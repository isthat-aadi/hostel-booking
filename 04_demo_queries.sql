-- =====================================================================
-- PHASE 5: DEMO / VIVA QUERIES  (run after some bookings exist)
-- Each block says what concept it shows.
-- =====================================================================
USE hostel_booking;

-- 1. JOIN + GROUP BY: free beds per hostel and floor
SELECT hostel_name, floor_number,
       COUNT(*) AS total_beds,
       SUM(bed_status = 'Available') AS free_beds
  FROM v_bed_availability
 GROUP BY hostel_name, floor_number
 ORDER BY hostel_name, floor_number;

-- 2. VIEW: window beds still free in AC Quad rooms of Boys Hostel A
SELECT floor_number, room_number, bed_number, bed_level, base_semester_fee
  FROM v_bed_availability
 WHERE hostel_name = 'Boys Hostel A' AND room_type = 'Quad' AND is_ac = 1
   AND near_window = 1 AND bed_status = 'Available'
 ORDER BY floor_number, room_number
 LIMIT 10;

-- 3. FUNCTION via PROCEDURE: best roommate matches for student 1
CALL sp_suggest_roommates(1, 5);

-- 4. JOIN + SUM: money collected per hostel
SELECT h.hostel_name, SUM(pi.amount) AS collected
  FROM payment p
  JOIN payment_item pi ON pi.payment_id = p.payment_id
  JOIN booking bk      ON bk.booking_id = p.booking_id
  JOIN room r          ON r.room_id = bk.room_id
  JOIN floor f         ON f.floor_id = r.floor_id
  JOIN hostel h        ON h.hostel_id = f.hostel_id
 WHERE p.payment_status = 'Paid'
 GROUP BY h.hostel_name;

-- 5. SUBQUERY (NOT EXISTS): registered students who have not booked yet
SELECT s.student_id, s.name, s.course
  FROM student s
 WHERE NOT EXISTS (SELECT 1 FROM booking bk WHERE bk.student_id = s.student_id);

-- 6. HAVING: rooms that are at least half full
SELECT r.room_number, r.capacity, r.occupied_seats
  FROM room r
 WHERE r.occupied_seats * 2 >= r.capacity AND r.occupied_seats > 0;

-- 7. Extra income from the window-bed preference
SELECT COUNT(*) AS window_bookings, SUM(amount) AS window_income
  FROM payment_item WHERE item_type = 'WINDOW_PREFERENCE';

-- 8. Warden workload
SELECT w.name AS warden, COUNT(bk.booking_id) AS bookings_handled
  FROM warden w LEFT JOIN booking bk ON bk.warden_id = w.warden_id
 GROUP BY w.warden_id, w.name;

-- 9. TRIGGER audit trail: full history of every booking
SELECT booking_id, old_status, new_status, old_bed_id, new_bed_id, changed_at
  FROM booking_log ORDER BY log_id;

-- 10. CONSTRAINT demo: a student cannot hold two live bookings (run twice -> second fails)
-- CALL sp_hold_bed(<student_id>, <bed_id>, 10, @b);

-- 11. TRANSACTION demo: change data, then undo it
START TRANSACTION;
UPDATE extra_charge SET amount = 99999 WHERE code = 'WINDOW_BED';
SELECT code, amount FROM extra_charge WHERE code = 'WINDOW_BED';   -- shows 99999
ROLLBACK;
SELECT code, amount FROM extra_charge WHERE code = 'WINDOW_BED';   -- back to 10000
