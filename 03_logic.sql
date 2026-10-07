-- =====================================================================
-- PHASE 2b: BUSINESS LOGIC  (run AFTER 02_seed_structure.sql)
-- Triggers, transactions (stored procedures), helper functions, views
-- =====================================================================
USE hostel_booking;

-- Audit trail of every booking status / bed change
CREATE TABLE booking_log (
  log_id     INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  old_status VARCHAR(20) NULL,
  new_status VARCHAR(20) NOT NULL,
  old_bed_id INT NULL,
  new_bed_id INT NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (booking_id)
);

DELIMITER //

-- ------------------------------ FUNCTIONS -----------------------------
CREATE FUNCTION fn_window_charge(p_bed INT) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_nw  TINYINT DEFAULT 0;
  DECLARE v_amt DECIMAL(10,2) DEFAULT 0;
  SELECT near_window INTO v_nw FROM bed WHERE bed_id = p_bed;
  IF v_nw = 1 THEN
    SELECT amount INTO v_amt FROM extra_charge WHERE code = 'WINDOW_BED' AND is_active = 1;
  END IF;
  RETURN IFNULL(v_amt, 0);
END//

-- Total Semester-I price of a bed = fee sheet total + window extra (if any)
CREATE FUNCTION fn_bed_total(p_bed INT) RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(10,2);
  SELECT fs.total_semester INTO v_total
    FROM bed b JOIN room r ON r.room_id = b.room_id
    JOIN fee_structure fs ON fs.room_type = r.room_type
                         AND fs.is_ac = r.is_ac AND fs.bed_level = b.bed_level
   WHERE b.bed_id = p_bed;
  RETURN IFNULL(v_total, 0) + fn_window_charge(p_bed);
END//

-- ------------------------------ TRIGGERS ------------------------------
CREATE TRIGGER trg_bed_capacity BEFORE INSERT ON bed
FOR EACH ROW
BEGIN
  DECLARE v_cap INT;
  DECLARE v_cnt INT;
  SELECT capacity INTO v_cap FROM room WHERE room_id = NEW.room_id;
  SELECT COUNT(*) INTO v_cnt FROM bed WHERE room_id = NEW.room_id;
  IF v_cnt >= v_cap THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This room already has all its beds';
  END IF;
END//

CREATE TRIGGER trg_booking_gender BEFORE INSERT ON booking
FOR EACH ROW
BEGIN
  DECLARE v_sg VARCHAR(10);
  DECLARE v_hg VARCHAR(10);
  SELECT gender INTO v_sg FROM student WHERE student_id = NEW.student_id;
  SELECT h.gender INTO v_hg
    FROM bed b JOIN room r ON r.room_id = b.room_id
    JOIN floor f ON f.floor_id = r.floor_id
    JOIN hostel h ON h.hostel_id = f.hostel_id
   WHERE b.bed_id = NEW.bed_id;
  IF v_sg <> v_hg THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This hostel is not open for your gender';
  END IF;
END//

CREATE TRIGGER trg_booking_log_ins AFTER INSERT ON booking
FOR EACH ROW
BEGIN
  INSERT INTO booking_log (booking_id, old_status, new_status, old_bed_id, new_bed_id)
  VALUES (NEW.booking_id, NULL, NEW.status, NULL, NEW.bed_id);
END//

CREATE TRIGGER trg_booking_after_update AFTER UPDATE ON booking
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status OR OLD.bed_id <> NEW.bed_id THEN
    INSERT INTO booking_log (booking_id, old_status, new_status, old_bed_id, new_bed_id)
    VALUES (NEW.booking_id, OLD.status, NEW.status, OLD.bed_id, NEW.bed_id);
  END IF;
  -- room.occupied_seats = number of APPROVED bookings in that room
  UPDATE room
     SET occupied_seats = (SELECT COUNT(*) FROM booking
                            WHERE booking.room_id = room.room_id AND booking.status = 'Approved')
   WHERE room_id IN (OLD.room_id, NEW.room_id);
END//

-- ----------------------------- PROCEDURES -----------------------------
CREATE PROCEDURE sp_expire_holds()
BEGIN
  UPDATE booking SET status = 'Expired', remarks = 'Hold timed out'
   WHERE status = 'Held' AND hold_expires_at < NOW();
END//

-- STEP 1: student picks a bed -> bed is locked for p_minutes
CREATE PROCEDURE sp_hold_bed(IN p_student INT, IN p_bed INT, IN p_minutes INT, OUT p_booking INT)
BEGIN
  DECLARE v_blocked INT;
  DECLARE v_room INT;
  DECLARE EXIT HANDLER FOR 1062
    BEGIN ROLLBACK;
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Bed was just taken, or you already have a live booking'; END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  UPDATE booking SET status = 'Expired', remarks = 'Hold timed out'
   WHERE status = 'Held' AND hold_expires_at < NOW();

  SELECT b.is_blocked + (r.status = 'Maintenance'), b.room_id INTO v_blocked, v_room
    FROM bed b JOIN room r ON r.room_id = b.room_id
   WHERE b.bed_id = p_bed FOR UPDATE;              -- row lock: two students cannot race

  IF v_blocked IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bed not found';
  END IF;
  IF v_blocked > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This bed is not available';
  END IF;

  INSERT INTO booking (student_id, room_id, bed_id, status, hold_expires_at)
  VALUES (p_student, v_room, p_bed, 'Held', DATE_ADD(NOW(), INTERVAL p_minutes MINUTE));
  SET p_booking = LAST_INSERT_ID();
  COMMIT;
END//

-- STEP 2: build the receipt (one line per fee) for a held booking
CREATE PROCEDURE sp_create_receipt(IN p_booking INT, IN p_transport VARCHAR(4), OUT p_payment INT)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_bed INT;
  DECLARE v_exp DATETIME;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status, bed_id, hold_expires_at INTO v_status, v_bed, v_exp
    FROM booking WHERE booking_id = p_booking FOR UPDATE;

  IF v_status IS NULL OR v_status <> 'Held' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking is not waiting for payment';
  END IF;
  IF v_exp < NOW() THEN
    UPDATE booking SET status = 'Expired', remarks = 'Hold timed out' WHERE booking_id = p_booking;
    COMMIT;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hold expired, please pick the bed again';
  END IF;

  DELETE FROM payment WHERE booking_id = p_booking AND payment_status = 'Pending';
  INSERT INTO payment (booking_id, receipt_no)
  VALUES (p_booking, CONCAT('RCPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(p_booking, 5, '0')));
  SET p_payment = LAST_INSERT_ID();

  INSERT INTO payment_item (payment_id, item_type, description, amount)
  SELECT p_payment, 'HOSTEL_FEE',
         CONCAT('Hostel fee (', r.room_type, IF(r.is_ac, ' AC', ' Non-AC'), ', ', b.bed_level, ' bed)'),
         fs.hostel_fee
    FROM bed b JOIN room r ON r.room_id = b.room_id
    JOIN fee_structure fs ON fs.room_type = r.room_type AND fs.is_ac = r.is_ac AND fs.bed_level = b.bed_level
   WHERE b.bed_id = v_bed;
  INSERT INTO payment_item (payment_id, item_type, description, amount)
  SELECT p_payment, 'UTILITY', 'Utility charges', fs.utility_charges
    FROM bed b JOIN room r ON r.room_id = b.room_id
    JOIN fee_structure fs ON fs.room_type = r.room_type AND fs.is_ac = r.is_ac AND fs.bed_level = b.bed_level
   WHERE b.bed_id = v_bed;
  INSERT INTO payment_item (payment_id, item_type, description, amount)
  SELECT p_payment, 'MESS_ADVANCE', 'Mess advance', fs.mess_advance
    FROM bed b JOIN room r ON r.room_id = b.room_id
    JOIN fee_structure fs ON fs.room_type = r.room_type AND fs.is_ac = r.is_ac AND fs.bed_level = b.bed_level
   WHERE b.bed_id = v_bed;
  INSERT INTO payment_item (payment_id, item_type, description, amount)
  SELECT p_payment, 'SECURITY_DEPOSIT', 'Hostel security deposit', fs.security_deposit
    FROM bed b JOIN room r ON r.room_id = b.room_id
    JOIN fee_structure fs ON fs.room_type = r.room_type AND fs.is_ac = r.is_ac AND fs.bed_level = b.bed_level
   WHERE b.bed_id = v_bed;

  IF fn_window_charge(v_bed) > 0 THEN
    INSERT INTO payment_item (payment_id, item_type, description, amount)
    VALUES (p_payment, 'WINDOW_PREFERENCE', 'Window-side bed preference', fn_window_charge(v_bed));
  END IF;

  IF p_transport IN ('SEM', 'YEAR') THEN
    INSERT INTO payment_item (payment_id, item_type, description, amount)
    SELECT p_payment, 'TRANSPORT', description, amount FROM extra_charge
     WHERE code = IF(p_transport = 'SEM', 'TRANSPORT_SEM', 'TRANSPORT_YEAR');
  END IF;
  COMMIT;
END//

-- STEP 3: student submits the booking. Allowed ONLY when
--   * the hold is still alive, * a fee receipt exists,
--   * BOTH documents (payment receipt + allotment form) are uploaded,
--   * the payment reference is filled in.
-- The booking then moves to the warden's queue.
CREATE PROCEDURE sp_submit_booking(IN p_booking INT, IN p_student INT, IN p_mode VARCHAR(10),
                                   IN p_reference VARCHAR(50), IN p_amount DECIMAL(10,2))
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_exp DATETIME;
  DECLARE v_pay INT;
  DECLARE v_docs INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status, hold_expires_at INTO v_status, v_exp
    FROM booking WHERE booking_id = p_booking AND student_id = p_student FOR UPDATE;
  IF v_status IS NULL OR v_status <> 'Held' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This booking is not waiting for submission';
  END IF;
  IF v_exp < NOW() THEN
    UPDATE booking SET status = 'Expired', remarks = 'Hold timed out' WHERE booking_id = p_booking;
    COMMIT;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hold expired, please pick the bed again';
  END IF;

  SELECT payment_id INTO v_pay FROM payment
   WHERE booking_id = p_booking AND payment_status = 'Pending' LIMIT 1;
  IF v_pay IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Generate the fee receipt first';
  END IF;

  SELECT COUNT(DISTINCT doc_type) INTO v_docs FROM booking_document WHERE booking_id = p_booking;
  IF v_docs < 2 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Upload both the hostel fee payment receipt and the hostel allotment form first';
  END IF;
  IF p_reference IS NULL OR TRIM(p_reference) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment reference number is required';
  END IF;

  UPDATE payment SET payment_mode = p_mode, payment_reference = TRIM(p_reference), paid_amount = p_amount
   WHERE payment_id = v_pay;
  UPDATE booking SET status = 'Pending', hold_expires_at = NULL WHERE booking_id = p_booking;
  COMMIT;
END//

-- Warden checks ONE uploaded document by eye, then marks it Verified or Rejected.
CREATE PROCEDURE sp_verify_document(IN p_doc INT, IN p_warden INT, IN p_status VARCHAR(10), IN p_remarks VARCHAR(255))
BEGIN
  DECLARE v_bstatus VARCHAR(20);
  DECLARE v_ok INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT bk.status,
         (SELECT COUNT(*) FROM warden w WHERE w.warden_id = p_warden AND w.hostel_id = f.hostel_id)
    INTO v_bstatus, v_ok
    FROM booking_document d JOIN booking bk ON bk.booking_id = d.booking_id
    JOIN bed b ON b.bed_id = bk.bed_id JOIN room r ON r.room_id = b.room_id
    JOIN floor f ON f.floor_id = r.floor_id
   WHERE d.doc_id = p_doc FOR UPDATE;

  IF v_bstatus IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Document not found'; END IF;
  IF v_ok = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This document belongs to another hostel'; END IF;
  IF v_bstatus <> 'Pending' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Documents can only be checked on pending bookings'; END IF;
  IF p_status NOT IN ('Verified', 'Rejected') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status must be Verified or Rejected'; END IF;
  IF p_status = 'Rejected' AND (p_remarks IS NULL OR TRIM(p_remarks) = '') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Give a reason when rejecting a document';
  END IF;

  UPDATE booking_document
     SET verification_status = p_status, verified_by = p_warden, verified_at = NOW(), remarks = p_remarks
   WHERE doc_id = p_doc;
  COMMIT;
END//

-- Student cancels (only before warden approval)
CREATE PROCEDURE sp_cancel_booking(IN p_booking INT, IN p_student INT)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status INTO v_status FROM booking
   WHERE booking_id = p_booking AND student_id = p_student FOR UPDATE;
  IF v_status IS NULL OR v_status NOT IN ('Held', 'Pending') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This booking cannot be cancelled now';
  END IF;
  UPDATE booking SET status = 'Cancelled', remarks = 'Cancelled by student' WHERE booking_id = p_booking;
  UPDATE payment SET payment_status = 'Refunded' WHERE booking_id = p_booking AND payment_status = 'Paid';
  COMMIT;
END//

-- Warden approves -> roommate matches for that room are stored
CREATE PROCEDURE sp_warden_approve(IN p_booking INT, IN p_warden INT)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_ok INT;
  DECLARE v_docs_ok INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT bk.status,
         (SELECT COUNT(*) FROM warden w WHERE w.warden_id = p_warden AND w.hostel_id = f.hostel_id)
    INTO v_status, v_ok
    FROM booking bk JOIN bed b ON b.bed_id = bk.bed_id
    JOIN room r ON r.room_id = b.room_id JOIN floor f ON f.floor_id = r.floor_id
   WHERE bk.booking_id = p_booking FOR UPDATE;

  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found'; END IF;
  IF v_ok = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This booking belongs to another hostel'; END IF;
  IF v_status <> 'Pending' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only paid, pending bookings can be approved'; END IF;

  SELECT COUNT(*) INTO v_docs_ok FROM booking_document
   WHERE booking_id = p_booking AND verification_status = 'Verified';
  IF v_docs_ok < 2 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Verify both documents (payment receipt and allotment form) before approving';
  END IF;

  UPDATE booking SET status = 'Approved', warden_id = p_warden, reviewed_at = NOW()
   WHERE booking_id = p_booking;
  UPDATE payment SET payment_status = 'Paid', paid_at = NOW()
   WHERE booking_id = p_booking AND payment_status = 'Pending';   -- money confirmed by warden

  -- store/refresh each occupant's average compatibility with the room's other occupants
  INSERT INTO roommate_match (student_id, room_id, match_score, match_status)
  SELECT x.student_id, x.room_id, AVG(fn_match_score(x.student_id, y.student_id)), 'Assigned'
    FROM booking x
    JOIN booking y ON y.room_id = x.room_id AND y.status = 'Approved' AND y.student_id <> x.student_id
   WHERE x.status = 'Approved'
     AND x.room_id = (SELECT room_id FROM booking WHERE booking_id = p_booking)
   GROUP BY x.student_id, x.room_id
  HAVING AVG(fn_match_score(x.student_id, y.student_id)) IS NOT NULL
  ON DUPLICATE KEY UPDATE match_score = VALUES(match_score), match_status = 'Assigned';
  COMMIT;
END//

CREATE PROCEDURE sp_warden_reject(IN p_booking INT, IN p_warden INT, IN p_remarks VARCHAR(255))
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_ok INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT bk.status,
         (SELECT COUNT(*) FROM warden w WHERE w.warden_id = p_warden AND w.hostel_id = f.hostel_id)
    INTO v_status, v_ok
    FROM booking bk JOIN bed b ON b.bed_id = bk.bed_id
    JOIN room r ON r.room_id = b.room_id JOIN floor f ON f.floor_id = r.floor_id
   WHERE bk.booking_id = p_booking FOR UPDATE;

  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found'; END IF;
  IF v_ok = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This booking belongs to another hostel'; END IF;
  IF v_status <> 'Pending' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only pending bookings can be rejected'; END IF;

  UPDATE booking SET status = 'Rejected', warden_id = p_warden, reviewed_at = NOW(), remarks = p_remarks
   WHERE booking_id = p_booking;                    -- bed becomes free automatically
  UPDATE payment SET payment_status = 'Refunded' WHERE booking_id = p_booking AND payment_status = 'Paid';
  COMMIT;
END//

-- Warden moves the student to another free bed of the SAME hostel.
-- Price difference is written to the receipt as an ADJUSTMENT line (+extra / -refund).
CREATE PROCEDURE sp_warden_reassign(IN p_booking INT, IN p_warden INT, IN p_new_bed INT, IN p_remarks VARCHAR(255))
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_old_bed INT;
  DECLARE v_ok INT;
  DECLARE v_new_ok INT;
  DECLARE v_blocked INT;
  DECLARE v_diff DECIMAL(10,2);
  DECLARE v_payment INT;
  DECLARE EXIT HANDLER FOR 1062
    BEGIN ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'That bed is already taken'; END;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT bk.status, bk.bed_id,
         (SELECT COUNT(*) FROM warden w WHERE w.warden_id = p_warden AND w.hostel_id = f.hostel_id)
    INTO v_status, v_old_bed, v_ok
    FROM booking bk JOIN bed b ON b.bed_id = bk.bed_id
    JOIN room r ON r.room_id = b.room_id JOIN floor f ON f.floor_id = r.floor_id
   WHERE bk.booking_id = p_booking FOR UPDATE;

  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found'; END IF;
  IF v_ok = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This booking belongs to another hostel'; END IF;
  IF v_status <> 'Pending' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only pending bookings can be reassigned'; END IF;

  SELECT COUNT(*), MAX(b.is_blocked + (r.status = 'Maintenance')) INTO v_new_ok, v_blocked
    FROM bed b JOIN room r ON r.room_id = b.room_id JOIN floor f ON f.floor_id = r.floor_id
   WHERE b.bed_id = p_new_bed
     AND f.hostel_id = (SELECT hostel_id FROM warden WHERE warden_id = p_warden);
  IF v_new_ok = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'New bed must be in your hostel'; END IF;
  IF v_blocked > 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'New bed is not available'; END IF;

  UPDATE booking
     SET original_bed_id = IFNULL(original_bed_id, bed_id), bed_id = p_new_bed,
         room_id = (SELECT room_id FROM bed WHERE bed_id = p_new_bed),
         warden_id = p_warden, remarks = p_remarks
   WHERE booking_id = p_booking;                    -- unique key stops a taken bed (handler above)

  SET v_diff = fn_bed_total(p_new_bed) - fn_bed_total(v_old_bed);
  IF v_diff <> 0 THEN
    SELECT payment_id INTO v_payment FROM payment
     WHERE booking_id = p_booking AND payment_status IN ('Pending','Paid') LIMIT 1;
    IF v_payment IS NOT NULL THEN
      INSERT INTO payment_item (payment_id, item_type, description, amount)
      VALUES (v_payment, 'ADJUSTMENT',
              IF(v_diff > 0, 'Bed change: extra to pay', 'Bed change: refund due'), v_diff);
    END IF;
  END IF;
  COMMIT;
END//

-- Ranked roommate suggestions for a student (same gender, has filled preferences)
CREATE PROCEDURE sp_suggest_roommates(IN p_student INT, IN p_limit INT)
BEGIN
  SELECT s.student_id, s.name, s.course,
         fn_match_score(p_student, s.student_id) AS match_score
    FROM student s JOIN student me ON me.student_id = p_student
   WHERE s.student_id <> p_student AND s.gender = me.gender
     AND EXISTS (SELECT 1 FROM roommate_preference rp WHERE rp.student_id = s.student_id)
   ORDER BY match_score DESC, s.name
   LIMIT p_limit;
END//
DELIMITER ;

-- --------------------------------- VIEW -------------------------------
CREATE VIEW v_booking_details AS
SELECT bk.booking_id, bk.status, bk.booking_date, bk.hold_expires_at, bk.reviewed_at, bk.remarks,
       bk.student_id, s.name AS student_name, s.course, s.year_semester, s.phone,
       h.hostel_id, h.hostel_name, f.floor_number, r.room_id, r.room_number,
       r.room_type, r.is_ac, b.bed_id, b.bed_number, b.bed_level, b.near_window,
       bk.original_bed_id, rc.payment_id, rc.receipt_no, rc.payment_status, rc.total_amount,
       (SELECT COUNT(*) FROM booking_document d WHERE d.booking_id = bk.booking_id) AS docs_uploaded,
       (SELECT COUNT(*) FROM booking_document d
         WHERE d.booking_id = bk.booking_id AND d.verification_status = 'Verified') AS docs_verified
  FROM booking bk
  JOIN student s ON s.student_id = bk.student_id
  JOIN bed b     ON b.bed_id = bk.bed_id
  JOIN room r    ON r.room_id = b.room_id
  JOIN floor f   ON f.floor_id = r.floor_id
  JOIN hostel h  ON h.hostel_id = f.hostel_id
  LEFT JOIN v_receipt rc ON rc.booking_id = bk.booking_id;
