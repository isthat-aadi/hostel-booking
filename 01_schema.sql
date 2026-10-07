-- =====================================================================
-- Hostel Room Booking & Roommate Selection System  |  PHASE 1: SCHEMA
-- Target: MySQL 8.x  (run the whole file in MySQL Workbench / mysql CLI)
-- =====================================================================
DROP DATABASE IF EXISTS hostel_booking;
CREATE DATABASE hostel_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostel_booking;

-- ---------------------------------------------------------------------
-- 1. PEOPLE & ACCESS
-- ---------------------------------------------------------------------
CREATE TABLE admin (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,            -- bcrypt hash, never plain text
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hostel (
  hostel_id    INT AUTO_INCREMENT PRIMARY KEY,
  hostel_name  VARCHAR(80) NOT NULL UNIQUE,
  gender       ENUM('Male','Female') NOT NULL,     -- who may book this hostel
  total_floors TINYINT UNSIGNED NOT NULL,
  CONSTRAINT chk_hostel_floors CHECK (total_floors > 0)
);

CREATE TABLE warden (
  warden_id        INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id        INT NOT NULL UNIQUE,            -- 1 hostel : 1 warden
  created_by_admin INT NOT NULL,                   -- admin manages wardens (1:M)
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(120) NOT NULL UNIQUE,
  phone            VARCHAR(15),
  password_hash    VARCHAR(255) NOT NULL,
  FOREIGN KEY (hostel_id)        REFERENCES hostel(hostel_id),
  FOREIGN KEY (created_by_admin) REFERENCES admin(admin_id)
);

-- Stand-in for the college's official admission system.
-- Now: filled by CSV import. Later: synced from the real system if IT allows.
CREATE TABLE admission_record (
  admission_no     VARCHAR(20) PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(120),
  phone            VARCHAR(15),
  course           VARCHAR(60) NOT NULL,           -- e.g. 'B.Tech CSE'
  gender           ENUM('Male','Female') NOT NULL,
  admission_status ENUM('Confirmed','Pending','Cancelled') NOT NULL DEFAULT 'Confirmed',
  imported_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student (
  student_id    INT AUTO_INCREMENT PRIMARY KEY,
  admission_no  VARCHAR(20) NOT NULL UNIQUE,       -- only admitted students can register
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  phone         VARCHAR(15)  NOT NULL,
  course        VARCHAR(60)  NOT NULL,
  year_semester VARCHAR(20)  NOT NULL,             -- e.g. '1st Year / Sem 1'
  gender        ENUM('Male','Female') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admission_no) REFERENCES admission_record(admission_no)
);

-- STUDENT.Hobbies in the ER is a multi-valued attribute. The standard ER-to-relational
-- rule maps it to its own table (so each cell holds ONE value = 1NF).
CREATE TABLE hobby (
  hobby_id   INT AUTO_INCREMENT PRIMARY KEY,
  hobby_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE student_hobby (
  student_id INT NOT NULL,
  hobby_id   INT NOT NULL,
  PRIMARY KEY (student_id, hobby_id),
  FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (hobby_id)   REFERENCES hobby(hobby_id)     ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. HOSTEL STRUCTURE:  hostel -> floor -> room -> bed
-- ---------------------------------------------------------------------
CREATE TABLE floor (
  floor_id     INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id    INT NOT NULL,
  floor_number TINYINT NOT NULL,
  floor_type   ENUM('Regular','Quiet') NOT NULL DEFAULT 'Regular',
  UNIQUE (hostel_id, floor_number),
  FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id) ON DELETE CASCADE
);

CREATE TABLE room (
  room_id      INT AUTO_INCREMENT PRIMARY KEY,
  floor_id     INT NOT NULL,
  room_number  VARCHAR(10) NOT NULL,
  room_type    ENUM('Double','Quad') NOT NULL,       -- Double = 2 single beds, Quad = 2 bunk beds
  is_ac        TINYINT(1) NOT NULL DEFAULT 0,
  capacity     TINYINT GENERATED ALWAYS AS
               (CASE room_type WHEN 'Double' THEN 2 ELSE 4 END) STORED,
  occupied_seats TINYINT NOT NULL DEFAULT 0,          -- kept in sync by trigger (see 03_logic.sql)
  status       ENUM('Open','Maintenance') NOT NULL DEFAULT 'Open',
  UNIQUE (floor_id, room_number),
  FOREIGN KEY (floor_id) REFERENCES floor(floor_id) ON DELETE CASCADE
);

-- Quad room = 2 bunk beds = 4 beds (upper/lower, some near the window)
CREATE TABLE bed (
  bed_id      INT AUTO_INCREMENT PRIMARY KEY,
  room_id     INT NOT NULL,
  bed_number  TINYINT NOT NULL,
  bed_level   ENUM('Lower','Upper','Standard') NOT NULL,
  near_window TINYINT(1) NOT NULL DEFAULT 0,
  is_blocked  TINYINT(1) NOT NULL DEFAULT 0,       -- warden can block a damaged bed
  UNIQUE (room_id, bed_number),
  UNIQUE KEY uq_bed_room (bed_id, room_id),           -- lets booking prove bed belongs to room
  FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. FEES  (numbers from the official Semester I fee sheet)
-- ---------------------------------------------------------------------
CREATE TABLE fee_structure (
  fee_id           INT AUTO_INCREMENT PRIMARY KEY,
  room_type        ENUM('Double','Quad') NOT NULL,
  is_ac            TINYINT(1) NOT NULL,
  bed_level        ENUM('Lower','Upper','Standard') NOT NULL,
  hostel_fee       DECIMAL(10,2) NOT NULL,
  utility_charges  DECIMAL(10,2) NOT NULL,
  mess_advance     DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) NOT NULL,
  subtotal         DECIMAL(10,2) GENERATED ALWAYS AS
                   (hostel_fee + utility_charges + mess_advance) STORED,
  total_semester   DECIMAL(10,2) GENERATED ALWAYS AS
                   (hostel_fee + utility_charges + mess_advance + security_deposit) STORED,
  UNIQUE (room_type, is_ac, bed_level)
);

-- Extra paid things: preferences (window bed) and optional services (transport)
CREATE TABLE extra_charge (
  charge_id   INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(120) NOT NULL,
  category    ENUM('Preference','Service') NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------
-- 4. PREFERENCES & MATCHING
-- ---------------------------------------------------------------------
CREATE TABLE roommate_preference (
  preference_id        INT AUTO_INCREMENT PRIMARY KEY,
  student_id           INT NOT NULL UNIQUE,        -- 1 student : 1 preference set
  preferred_course     VARCHAR(60) NULL,           -- NULL = don't care
  preferred_floor_type ENUM('Regular','Quiet','Any') NOT NULL DEFAULT 'Any',
  preferred_room_type  ENUM('Double','Quad','Any') NOT NULL DEFAULT 'Any',
  wants_ac             ENUM('AC','Non-AC','Any') NOT NULL DEFAULT 'Any',
  preferred_bed_level  ENUM('Lower','Upper','Any') NOT NULL DEFAULT 'Any',
  wants_window_bed     TINYINT(1) NOT NULL DEFAULT 0,   -- triggers the extra window charge
  sleep_schedule       ENUM('Early Bird','Night Owl','Flexible') NOT NULL,
  cleanliness          ENUM('Very Tidy','Average','Relaxed') NOT NULL,
  study_style          ENUM('Quiet','Group','Flexible') NOT NULL,
  notes                VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
);

-- Same shape as the ER: how well a student fits a room.
-- match_score = average compatibility with the room's other approved occupants.
CREATE TABLE roommate_match (
  match_id     INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  room_id      INT NOT NULL,
  match_score  DECIMAL(5,2) NOT NULL,
  match_status ENUM('Suggested','Assigned') NOT NULL DEFAULT 'Assigned',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, room_id),
  CONSTRAINT chk_match_score CHECK (match_score BETWEEN 0 AND 100),
  FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)    REFERENCES room(room_id)       ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 5. BOOKING & PAYMENT
-- ---------------------------------------------------------------------
-- The two UNIQUE keys on generated columns make double-allotment IMPOSSIBLE
-- at database level: one live booking per bed, one live booking per student.
-- (NULLs are allowed many times in a UNIQUE key, so finished bookings don't block.)
CREATE TABLE booking (
  booking_id      INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  room_id         INT NOT NULL,                    -- as in the ER (BOOKING.RoomID)
  bed_id          INT NOT NULL,                    -- extension: exact bed inside the room
  original_bed_id INT NULL,                        -- set if warden reassigns the student
  warden_id       INT NULL,                        -- warden who reviewed it
  booking_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_in_date   DATE NULL,
  status          ENUM('Held','Pending','Approved','Rejected','Cancelled','Expired')
                  NOT NULL DEFAULT 'Held',
  hold_expires_at DATETIME NULL,                   -- bed is locked until this time
  reviewed_at     DATETIME NULL,
  remarks         VARCHAR(255),
  active_bed_id     INT GENERATED ALWAYS AS
    (CASE WHEN status IN ('Held','Pending','Approved') THEN bed_id END) STORED,
  active_student_id INT GENERATED ALWAYS AS
    (CASE WHEN status IN ('Held','Pending','Approved') THEN student_id END) STORED,
  UNIQUE KEY uq_one_live_booking_per_bed     (active_bed_id),
  UNIQUE KEY uq_one_live_booking_per_student (active_student_id),
  FOREIGN KEY (student_id)      REFERENCES student(student_id),
  FOREIGN KEY (bed_id, room_id) REFERENCES bed(bed_id, room_id),   -- bed MUST belong to that room
  FOREIGN KEY (original_bed_id) REFERENCES bed(bed_id),
  FOREIGN KEY (warden_id)       REFERENCES warden(warden_id) ON DELETE SET NULL
);

CREATE TABLE payment (
  payment_id     INT AUTO_INCREMENT PRIMARY KEY,
  booking_id     INT NOT NULL,
  receipt_no     VARCHAR(25) NOT NULL UNIQUE,
  payment_status ENUM('Pending','Paid','Refunded') NOT NULL DEFAULT 'Pending',
  payment_mode   ENUM('Online','UPI','Card','Cash') NULL,
  payment_reference VARCHAR(50) NULL,               -- transaction / receipt number the student typed in
  paid_amount    DECIMAL(10,2) NULL,                -- amount the student says they paid
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at        DATETIME NULL,                     -- set when the warden approves (money verified)
  FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
);

-- Receipt lines: hostel fee, utility, mess, deposit, window preference, transport...
-- Negative amounts allowed (adjustments / refunds when warden reassigns a bed)
CREATE TABLE payment_item (
  item_id     INT AUTO_INCREMENT PRIMARY KEY,
  payment_id  INT NOT NULL,
  item_type   ENUM('HOSTEL_FEE','UTILITY','MESS_ADVANCE','SECURITY_DEPOSIT',
                   'WINDOW_PREFERENCE','TRANSPORT','ADJUSTMENT') NOT NULL,
  description VARCHAR(120) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payment(payment_id) ON DELETE CASCADE
);

-- Documents the student must upload before the booking can reach the warden.
-- One row per document type per booking (re-upload replaces the row).
CREATE TABLE booking_document (
  doc_id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_id          INT NOT NULL,
  doc_type            ENUM('PAYMENT_RECEIPT','ALLOTMENT_FORM') NOT NULL,
  file_name           VARCHAR(255) NOT NULL,
  file_path           VARCHAR(255) NOT NULL,
  uploaded_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verification_status ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  verified_by         INT NULL,
  verified_at         DATETIME NULL,
  remarks             VARCHAR(255) NULL,
  UNIQUE (booking_id, doc_type),
  FOREIGN KEY (booking_id)  REFERENCES booking(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES warden(warden_id)   ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 6. REFERENCE DATA
-- ---------------------------------------------------------------------
INSERT INTO fee_structure
  (room_type, is_ac, bed_level, hostel_fee, utility_charges, mess_advance, security_deposit) VALUES
  ('Double', 1, 'Standard', 46500, 17500, 31250, 5000),
  ('Double', 0, 'Standard', 37250,  9750, 31250, 5000),
  ('Quad',   1, 'Lower',    38000, 12500, 31250, 5000),
  ('Quad',   0, 'Lower',    31500,  8500, 31250, 5000),
  ('Quad',   1, 'Upper',    35500, 12500, 31250, 5000),
  ('Quad',   0, 'Upper',    30000,  8500, 31250, 5000);

INSERT INTO extra_charge (code, description, category, amount) VALUES
  ('WINDOW_BED',     'Window-side bed preference',                                'Preference', 10000),
  ('TRANSPORT_SEM',  'Transport fee - per semester',                              'Service',    26250),
  ('TRANSPORT_YEAR', 'Transport fee - yearly',                                    'Service',    52500);

INSERT INTO hobby (hobby_name) VALUES
  ('Cricket'),('Football'),('Basketball'),('Gaming'),('Music'),('Reading'),
  ('Coding'),('Movies'),('Dancing'),('Gym'),('Art'),('Travelling');

-- ---------------------------------------------------------------------
-- 7. MATCH SCORE FUNCTION  (0-100, symmetric)
--    Course 30 | Sleep 25 | Hobbies 20 | Cleanliness 15 | Study style 10
-- ---------------------------------------------------------------------
DELIMITER //
CREATE FUNCTION fn_match_score(p_a INT, p_b INT) RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
  DECLARE v_score   DECIMAL(5,2) DEFAULT 0;
  DECLARE v_course_a, v_course_b VARCHAR(60);
  DECLARE v_sleep_a, v_sleep_b, v_study_a, v_study_b VARCHAR(20);
  DECLARE v_clean_a, v_clean_b INT;
  DECLARE v_common, v_union INT DEFAULT 0;

  SELECT s.course, p.sleep_schedule, p.study_style,
         FIELD(p.cleanliness,'Very Tidy','Average','Relaxed')
    INTO v_course_a, v_sleep_a, v_study_a, v_clean_a
    FROM student s JOIN roommate_preference p ON p.student_id = s.student_id
   WHERE s.student_id = p_a;

  SELECT s.course, p.sleep_schedule, p.study_style,
         FIELD(p.cleanliness,'Very Tidy','Average','Relaxed')
    INTO v_course_b, v_sleep_b, v_study_b, v_clean_b
    FROM student s JOIN roommate_preference p ON p.student_id = s.student_id
   WHERE s.student_id = p_b;

  IF v_course_a IS NULL OR v_course_b IS NULL THEN
    RETURN NULL;                                   -- someone has not filled preferences yet
  END IF;

  -- Course (30)
  IF v_course_a = v_course_b THEN SET v_score = v_score + 30; END IF;

  -- Sleep schedule (25): same = full, 'Flexible' on either side = partial
  IF v_sleep_a = v_sleep_b THEN SET v_score = v_score + 25;
  ELSEIF v_sleep_a = 'Flexible' OR v_sleep_b = 'Flexible' THEN SET v_score = v_score + 15;
  END IF;

  -- Hobbies (20): overlap / total distinct hobbies of the pair
  SELECT COUNT(*) INTO v_common
    FROM student_hobby x JOIN student_hobby y ON x.hobby_id = y.hobby_id
   WHERE x.student_id = p_a AND y.student_id = p_b;
  SELECT COUNT(DISTINCT hobby_id) INTO v_union
    FROM student_hobby WHERE student_id IN (p_a, p_b);
  IF v_union > 0 THEN SET v_score = v_score + 20 * v_common / v_union; END IF;

  -- Cleanliness (15): same = full, one step apart = half
  SET v_score = v_score + CASE ABS(v_clean_a - v_clean_b) WHEN 0 THEN 15 WHEN 1 THEN 7.5 ELSE 0 END;

  -- Study style (10)
  IF v_study_a = v_study_b THEN SET v_score = v_score + 10;
  ELSEIF v_study_a = 'Flexible' OR v_study_b = 'Flexible' THEN SET v_score = v_score + 5;
  END IF;

  RETURN v_score;
END//
DELIMITER ;

-- ---------------------------------------------------------------------
-- 8. VIEWS
-- ---------------------------------------------------------------------
-- Every bed with live status + base fee. The frontend room picker reads THIS.
CREATE VIEW v_bed_availability AS
SELECT b.bed_id, h.hostel_id, h.hostel_name, h.gender AS hostel_gender,
       f.floor_id, f.floor_number, f.floor_type,
       r.room_id, r.room_number, r.room_type, r.is_ac,
       b.bed_number, b.bed_level, b.near_window,
       CASE WHEN b.is_blocked = 1 OR r.status = 'Maintenance' THEN 'Blocked'
            WHEN bk.booking_id IS NULL THEN 'Available'
            WHEN bk.status = 'Approved' THEN 'Booked'
            ELSE bk.status END AS bed_status,       -- Held / Pending while in progress
       fs.total_semester AS base_semester_fee
  FROM bed b
  JOIN room r   ON r.room_id  = b.room_id
  JOIN floor f  ON f.floor_id = r.floor_id
  JOIN hostel h ON h.hostel_id = f.hostel_id
  JOIN fee_structure fs ON fs.room_type = r.room_type
                       AND fs.is_ac = r.is_ac
                       AND fs.bed_level = b.bed_level
  LEFT JOIN booking bk ON bk.active_bed_id = b.bed_id;

CREATE VIEW v_room_occupancy AS
SELECT r.room_id, r.floor_id, r.room_number, r.capacity,
       COUNT(CASE WHEN bk.status = 'Approved' THEN 1 END)             AS occupied_seats,
       COUNT(CASE WHEN bk.status IN ('Held','Pending') THEN 1 END)    AS in_progress_seats,
       r.capacity - COUNT(bk.booking_id)                              AS free_seats
  FROM room r
  LEFT JOIN bed b      ON b.room_id = r.room_id
  LEFT JOIN booking bk ON bk.active_bed_id = b.bed_id
 GROUP BY r.room_id, r.floor_id, r.room_number, r.capacity;

CREATE VIEW v_receipt AS
SELECT p.payment_id, p.receipt_no, p.booking_id, p.payment_status, p.payment_mode, p.paid_at,
       SUM(pi.amount) AS total_amount
  FROM payment p JOIN payment_item pi ON pi.payment_id = p.payment_id
 GROUP BY p.payment_id, p.receipt_no, p.booking_id, p.payment_status, p.payment_mode, p.paid_at;
