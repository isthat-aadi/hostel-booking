-- =====================================================================
-- PHASE 2a: CAMPUS STRUCTURE  (run AFTER 01_schema.sql)
-- 4 hostels (2 boys, 2 girls) x 8 floors x 20 rooms  =  640 rooms, 1920 beds
-- Per floor: rooms 01-04 Quad AC | 05-10 Quad Non-AC | 11-14 Double AC | 15-20 Double Non-AC
--   (edit the mix in sp_seed_structure if your real hostel differs)
-- Quad   = 2 bunk beds = 4 beds; bunk next to the window = beds 1 (lower) + 2 (upper)
-- Double = 2 single beds; bed 1 is near the window
-- =====================================================================
USE hostel_booking;

INSERT INTO hostel (hostel_name, gender, total_floors) VALUES
  ('Boys Hostel A',  'Male',   8),
  ('Boys Hostel B',  'Male',   8),
  ('Girls Hostel A', 'Female', 8),
  ('Girls Hostel B', 'Female', 8);

DELIMITER //
CREATE PROCEDURE sp_seed_structure()
BEGIN
  DECLARE h INT DEFAULT 1;
  DECLARE fl, i, v_floor, v_room INT;
  DECLARE v_type VARCHAR(10);
  DECLARE v_ac TINYINT;

  WHILE h <= 4 DO
    SET fl = 1;
    WHILE fl <= 8 DO
      INSERT INTO floor (hostel_id, floor_number, floor_type)
      VALUES (h, fl, IF(fl = 8, 'Quiet', 'Regular'));
      SET v_floor = LAST_INSERT_ID();

      SET i = 1;
      WHILE i <= 20 DO
        SET v_type = IF(i <= 10, 'Quad', 'Double');
        SET v_ac   = IF(i <= 4 OR (i >= 11 AND i <= 14), 1, 0);
        INSERT INTO room (floor_id, room_number, room_type, is_ac)
        VALUES (v_floor, CAST(fl * 100 + i AS CHAR), v_type, v_ac);
        SET v_room = LAST_INSERT_ID();

        IF v_type = 'Quad' THEN
          INSERT INTO bed (room_id, bed_number, bed_level, near_window) VALUES
            (v_room,1,'Lower',1),(v_room,2,'Upper',1),(v_room,3,'Lower',0),(v_room,4,'Upper',0);
        ELSE
          INSERT INTO bed (room_id, bed_number, bed_level, near_window) VALUES
            (v_room,1,'Standard',1),(v_room,2,'Standard',0);
        END IF;

        SET i = i + 1;
      END WHILE;
      SET fl = fl + 1;
    END WHILE;
    SET h = h + 1;
  END WHILE;
END//
DELIMITER ;

CALL sp_seed_structure();
DROP PROCEDURE sp_seed_structure;

-- Sample "official admission list" (replace with real CSV import later)
INSERT INTO admission_record (admission_no, name, email, phone, course, gender) VALUES
 ('JKLU2026001','Rohan Sharma','rohan.sharma@example.com','9000000001','B.Tech CSE','Male'),
 ('JKLU2026002','Aman Verma','aman.verma@example.com','9000000002','B.Tech CSE','Male'),
 ('JKLU2026003','Karan Singh','karan.singh@example.com','9000000003','B.Tech ECE','Male'),
 ('JKLU2026004','Vikram Rathore','vikram.rathore@example.com','9000000004','B.Tech CSE','Male'),
 ('JKLU2026005','Yash Gupta','yash.gupta@example.com','9000000005','BBA','Male'),
 ('JKLU2026006','Harsh Meena','harsh.meena@example.com','9000000006','B.Tech ME','Male'),
 ('JKLU2026007','Dev Joshi','dev.joshi@example.com','9000000007','B.Tech CSE','Male'),
 ('JKLU2026008','Nitin Jain','nitin.jain@example.com','9000000008','B.Tech ECE','Male'),
 ('JKLU2026009','Arjun Kapoor','arjun.kapoor@example.com','9000000009','B.Tech CSE','Male'),
 ('JKLU2026010','Manav Agarwal','manav.agarwal@example.com','9000000010','BBA','Male'),
 ('JKLU2026011','Sahil Khan','sahil.khan@example.com','9000000011','B.Tech ME','Male'),
 ('JKLU2026012','Tanmay Saini','tanmay.saini@example.com','9000000012','B.Tech CSE','Male'),
 ('JKLU2026013','Priya Sharma','priya.sharma@example.com','9000000013','B.Tech CSE','Female'),
 ('JKLU2026014','Ananya Verma','ananya.verma@example.com','9000000014','B.Tech CSE','Female'),
 ('JKLU2026015','Kavya Singh','kavya.singh@example.com','9000000015','B.Tech ECE','Female'),
 ('JKLU2026016','Riya Rathore','riya.rathore@example.com','9000000016','B.Tech CSE','Female'),
 ('JKLU2026017','Sneha Gupta','sneha.gupta@example.com','9000000017','BBA','Female'),
 ('JKLU2026018','Pooja Meena','pooja.meena@example.com','9000000018','B.Tech ME','Female'),
 ('JKLU2026019','Diya Joshi','diya.joshi@example.com','9000000019','B.Tech CSE','Female'),
 ('JKLU2026020','Nisha Jain','nisha.jain@example.com','9000000020','B.Tech ECE','Female'),
 ('JKLU2026021','Ishita Kapoor','ishita.kapoor@example.com','9000000021','B.Tech CSE','Female'),
 ('JKLU2026022','Muskan Agarwal','muskan.agarwal@example.com','9000000022','BBA','Female'),
 ('JKLU2026023','Zoya Khan','zoya.khan@example.com','9000000023','B.Tech ME','Female'),
 ('JKLU2026024','Tanya Saini','tanya.saini@example.com','9000000024','B.Tech CSE','Female');
