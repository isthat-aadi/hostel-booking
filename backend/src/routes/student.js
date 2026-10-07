const router = require('express').Router();
const { pool, callWithOut } = require('../db');
const fs = require('fs');
const path = require('path');
const { auth, wrap } = require('../middleware');
const { upload, UPLOAD_DIR, DOC_TYPES } = require('../upload');

router.use(auth('student'));
const HOLD = () => parseInt(process.env.HOLD_MINUTES || '10', 10);
const freshHolds = wrap(async (req, res, next) => { await pool.query('CALL sp_expire_holds()'); next(); });

// ---------- profile ----------
router.get('/me', wrap(async (req, res) => {
  const [[me]] = await pool.query(
    `SELECT student_id, admission_no, name, email, phone, course, year_semester, gender FROM student WHERE student_id = ?`,
    [req.user.id]);
  res.json(me);
}));

// ---------- preferences (step 2 of the journey) ----------
router.get('/hobbies', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT hobby_id, hobby_name FROM hobby ORDER BY hobby_name');
  res.json(rows);
}));

router.get('/preferences', wrap(async (req, res) => {
  const [[pref]] = await pool.query('SELECT * FROM roommate_preference WHERE student_id = ?', [req.user.id]);
  const [hobbies] = await pool.query(
    `SELECT h.hobby_id, h.hobby_name FROM student_hobby sh JOIN hobby h ON h.hobby_id = sh.hobby_id WHERE sh.student_id = ?`,
    [req.user.id]);
  res.json({ preferences: pref || null, hobbies });
}));

router.put('/preferences', wrap(async (req, res) => {
  const b = req.body;
  if (!b.sleep_schedule || !b.cleanliness || !b.study_style) {
    return res.status(400).json({ error: 'sleep_schedule, cleanliness and study_style are required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO roommate_preference
         (student_id, preferred_course, preferred_floor_type, preferred_room_type, wants_ac,
          preferred_bed_level, wants_window_bed, sleep_schedule, cleanliness, study_style, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE preferred_course = VALUES(preferred_course),
         preferred_floor_type = VALUES(preferred_floor_type), preferred_room_type = VALUES(preferred_room_type),
         wants_ac = VALUES(wants_ac), preferred_bed_level = VALUES(preferred_bed_level),
         wants_window_bed = VALUES(wants_window_bed), sleep_schedule = VALUES(sleep_schedule),
         cleanliness = VALUES(cleanliness), study_style = VALUES(study_style), notes = VALUES(notes)`,
      [req.user.id, b.preferred_course || null, b.preferred_floor_type || 'Any', b.preferred_room_type || 'Any',
       b.wants_ac || 'Any', b.preferred_bed_level || 'Any', b.wants_window_bed ? 1 : 0,
       b.sleep_schedule, b.cleanliness, b.study_style, b.notes || null]);
    if (Array.isArray(b.hobbies)) {
      await conn.query('DELETE FROM student_hobby WHERE student_id = ?', [req.user.id]);
      for (const hid of b.hobbies) {
        await conn.query('INSERT IGNORE INTO student_hobby (student_id, hobby_id) VALUES (?,?)', [req.user.id, hid]);
      }
    }
    await conn.commit();
    res.json({ message: 'Preferences saved' });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}));

router.get('/roommate-suggestions', wrap(async (req, res) => {
  const [rows] = await pool.query('CALL sp_suggest_roommates(?, ?)', [req.user.id, 10]);
  res.json(rows[0]);
}));

// ---------- room picker: hostel -> floor -> room -> bed ----------
router.get('/hostels', freshHolds, wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT h.hostel_id, h.hostel_name, h.gender, h.total_floors,
            COUNT(v.bed_id) AS total_beds,
            COUNT(CASE WHEN v.bed_status = 'Available' THEN 1 END) AS free_beds
       FROM hostel h LEFT JOIN v_bed_availability v ON v.hostel_id = h.hostel_id
      WHERE h.gender = ? GROUP BY h.hostel_id, h.hostel_name, h.gender, h.total_floors ORDER BY h.hostel_name`,
    [req.user.gender]);
  res.json(rows);
}));

router.get('/hostels/:id/floors', freshHolds, wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT f.floor_id, f.floor_number, f.floor_type, COUNT(v.bed_id) AS total_beds,
            COUNT(CASE WHEN v.bed_status = 'Available' THEN 1 END) AS free_beds
       FROM floor f JOIN hostel h ON h.hostel_id = f.hostel_id
       LEFT JOIN v_bed_availability v ON v.floor_id = f.floor_id
      WHERE f.hostel_id = ? AND h.gender = ?
      GROUP BY f.floor_id, f.floor_number, f.floor_type ORDER BY f.floor_number`,
    [req.params.id, req.user.gender]);
  res.json(rows);
}));

router.get('/floors/:id/rooms', freshHolds, wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.room_id, r.room_number, r.room_type, r.is_ac, r.capacity, r.status,
            o.occupied_seats, o.in_progress_seats, o.free_seats
       FROM room r JOIN floor f ON f.floor_id = r.floor_id JOIN hostel h ON h.hostel_id = f.hostel_id
       JOIN v_room_occupancy o ON o.room_id = r.room_id
      WHERE r.floor_id = ? AND h.gender = ? ORDER BY r.room_number`,
    [req.params.id, req.user.gender]);
  res.json(rows);
}));

router.get('/rooms/:id/beds', freshHolds, wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT v.bed_id, v.bed_number, v.bed_level, v.near_window, v.bed_status,
            v.base_semester_fee, fn_window_charge(v.bed_id) AS window_charge,
            fn_bed_total(v.bed_id) AS price_total
       FROM v_bed_availability v WHERE v.room_id = ? AND v.hostel_gender = ? ORDER BY v.bed_number`,
    [req.params.id, req.user.gender]);
  res.json(rows);
}));

// ---------- booking flow ----------
// 1) hold the bed
router.post('/bookings', wrap(async (req, res) => {
  const { bed_id } = req.body;
  if (!bed_id) return res.status(400).json({ error: 'bed_id required' });
  const id = await callWithOut('CALL sp_hold_bed(?,?,?,@out)', [req.user.id, bed_id, HOLD()], '@out');
  res.status(201).json({ booking_id: id, hold_minutes: HOLD() });
}));

// 2) build receipt   body: { transport: 'NONE' | 'SEM' | 'YEAR' }
router.post('/bookings/:id/receipt', wrap(async (req, res) => {
  const [[own]] = await pool.query('SELECT booking_id FROM booking WHERE booking_id = ? AND student_id = ?',
    [req.params.id, req.user.id]);
  if (!own) return res.status(404).json({ error: 'Booking not found' });
  const transport = ['SEM', 'YEAR'].includes(req.body.transport) ? req.body.transport : 'NONE';
  const paymentId = await callWithOut('CALL sp_create_receipt(?,?,@out)', [req.params.id, transport], '@out');
  res.status(201).json(await receipt(paymentId));
}));

// 3) upload the 2 required documents
//    POST /bookings/:id/documents/payment-receipt   (multipart, field name "file")
//    POST /bookings/:id/documents/allotment-form
const ownsLiveBooking = wrap(async (req, res, next) => {
  if (!DOC_TYPES[req.params.type]) return res.status(400).json({ error: 'type must be payment-receipt or allotment-form' });
  const [[b]] = await pool.query('SELECT status FROM booking WHERE booking_id = ? AND student_id = ?',
    [req.params.id, req.user.id]);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (!['Held', 'Pending'].includes(b.status)) return res.status(400).json({ error: 'Documents can no longer be changed for this booking' });
  next();
});

router.post('/bookings/:id/documents/:type', ownsLiveBooking, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Attach a file in the "file" field' });
  const type = DOC_TYPES[req.params.type];
  const rel = path.join(String(req.params.id), req.file.filename);
  const [[old]] = await pool.query('SELECT file_path, verification_status FROM booking_document WHERE booking_id = ? AND doc_type = ?',
    [req.params.id, type]);
  if (old && old.verification_status === 'Verified') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'This document is already verified by the warden' });
  }
  await pool.query(
    `INSERT INTO booking_document (booking_id, doc_type, file_name, file_path)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_path = VALUES(file_path),
       uploaded_at = NOW(), verification_status = 'Pending', verified_by = NULL, verified_at = NULL, remarks = NULL`,
    [req.params.id, type, req.file.originalname, rel]);
  if (old) fs.unlink(path.join(UPLOAD_DIR, old.file_path), () => {});   // remove the replaced file
  res.status(201).json({ message: 'Uploaded', doc_type: type });
}));

router.get('/bookings/:id/documents', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.doc_id, d.doc_type, d.file_name, d.uploaded_at, d.verification_status, d.remarks
       FROM booking_document d JOIN booking b ON b.booking_id = d.booking_id
      WHERE d.booking_id = ? AND b.student_id = ?`, [req.params.id, req.user.id]);
  res.json(rows);
}));

router.get('/documents/:docId/file', wrap(async (req, res) => {
  const [[d]] = await pool.query(
    `SELECT d.file_path, d.file_name FROM booking_document d JOIN booking b ON b.booking_id = d.booking_id
      WHERE d.doc_id = ? AND b.student_id = ?`, [req.params.docId, req.user.id]);
  if (!d) return res.status(404).json({ error: 'Document not found' });
  res.sendFile(path.join(UPLOAD_DIR, d.file_path));
}));

// 4) submit for warden approval
//    body: { payment_mode: 'Online'|'UPI'|'Card'|'Cash', payment_reference: 'UTR/receipt no', amount_paid: 123000 }
router.post('/bookings/:id/submit', wrap(async (req, res) => {
  const { payment_mode, payment_reference, amount_paid } = req.body;
  await pool.query('CALL sp_submit_booking(?,?,?,?,?)',
    [req.params.id, req.user.id, payment_mode || 'Online', payment_reference || '', amount_paid || null]);
  res.json({ message: 'Submitted. Your warden will verify your documents.' });
}));

router.post('/bookings/:id/cancel', wrap(async (req, res) => {
  await pool.query('CALL sp_cancel_booking(?, ?)', [req.params.id, req.user.id]);
  res.json({ message: 'Booking cancelled' });
}));

// current booking with receipt + roommates (home screen + status screen)
router.get('/booking', freshHolds, wrap(async (req, res) => {
  const [[b]] = await pool.query(
    `SELECT * FROM v_booking_details WHERE student_id = ? ORDER BY booking_id DESC LIMIT 1`, [req.user.id]);
  if (!b) return res.json(null);
  const [documents] = await pool.query(
    `SELECT doc_id, doc_type, file_name, uploaded_at, verification_status, remarks
       FROM booking_document WHERE booking_id = ?`, [b.booking_id]);
  const out = { booking: b, receipt: b.payment_id ? await receipt(b.payment_id) : null, documents, roommates: [] };
  if (b.status === 'Approved') {
    const [rm] = await pool.query(
      `SELECT s.student_id, s.name, s.course, ob.bed_number, ob.bed_level,
              fn_match_score(?, s.student_id) AS match_score
         FROM booking me
         JOIN booking o ON o.room_id = me.room_id AND o.status = 'Approved' AND o.student_id <> me.student_id
         JOIN bed ob ON ob.bed_id = o.bed_id
         JOIN student s ON s.student_id = o.student_id
        WHERE me.booking_id = ? AND me.status = 'Approved'`, [req.user.id, b.booking_id]);
    out.roommates = rm;
  }
  res.json(out);
}));

async function receipt(paymentId) {
  const [[head]] = await pool.query('SELECT * FROM v_receipt WHERE payment_id = ?', [paymentId]);
  const [items] = await pool.query(
    'SELECT item_type, description, amount FROM payment_item WHERE payment_id = ? ORDER BY item_id', [paymentId]);
  return { ...head, items };
}

module.exports = router;
