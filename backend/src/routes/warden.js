const router = require('express').Router();
const { pool } = require('../db');
const path = require('path');
const { auth, wrap } = require('../middleware');
const { UPLOAD_DIR } = require('../upload');

router.use(auth('warden'));

// bookings of MY hostel.  ?status=Pending (default) | Approved | Rejected | all
router.get('/bookings', wrap(async (req, res) => {
  await pool.query('CALL sp_expire_holds()');
  const st = req.query.status || 'Pending';
  const [rows] = st === 'all'
    ? await pool.query('SELECT * FROM v_booking_details WHERE hostel_id = ? ORDER BY booking_id DESC', [req.user.hostel_id])
    : await pool.query('SELECT * FROM v_booking_details WHERE hostel_id = ? AND status = ? ORDER BY booking_id DESC',
        [req.user.hostel_id, st]);
  res.json(rows);
}));

// one booking + student's preferences + hobbies + receipt (detail sheet)
router.get('/bookings/:id', wrap(async (req, res) => {
  const [[b]] = await pool.query('SELECT * FROM v_booking_details WHERE booking_id = ? AND hostel_id = ?',
    [req.params.id, req.user.hostel_id]);
  if (!b) return res.status(404).json({ error: 'Booking not found in your hostel' });
  const [[prefs]] = await pool.query('SELECT * FROM roommate_preference WHERE student_id = ?', [b.student_id]);
  const [hobbies] = await pool.query(
    `SELECT h.hobby_name FROM student_hobby sh JOIN hobby h ON h.hobby_id = sh.hobby_id WHERE sh.student_id = ?`,
    [b.student_id]);
  const [items] = b.payment_id
    ? await pool.query('SELECT item_type, description, amount FROM payment_item WHERE payment_id = ? ORDER BY item_id', [b.payment_id])
    : [[]];
  const [documents] = await pool.query(
    `SELECT doc_id, doc_type, file_name, uploaded_at, verification_status, remarks
       FROM booking_document WHERE booking_id = ?`, [b.booking_id]);
  const [[pay]] = b.payment_id
    ? await pool.query('SELECT payment_mode, payment_reference, paid_amount FROM payment WHERE payment_id = ?', [b.payment_id])
    : [[null]];
  res.json({ booking: b, preferences: prefs || null, hobbies: hobbies.map(h => h.hobby_name),
             receipt_items: items, student_payment_claim: pay, documents });
}));

// open an uploaded document (only for bookings of MY hostel)
router.get('/documents/:docId/file', wrap(async (req, res) => {
  const [[d]] = await pool.query(
    `SELECT d.file_path FROM booking_document d JOIN booking bk ON bk.booking_id = d.booking_id
       JOIN bed b ON b.bed_id = bk.bed_id JOIN room r ON r.room_id = b.room_id JOIN floor f ON f.floor_id = r.floor_id
      WHERE d.doc_id = ? AND f.hostel_id = ?`, [req.params.docId, req.user.hostel_id]);
  if (!d) return res.status(404).json({ error: 'Document not found in your hostel' });
  res.sendFile(path.join(UPLOAD_DIR, d.file_path));
}));

// mark a document Verified / Rejected   body: { status: 'Verified'|'Rejected', remarks }
router.post('/documents/:docId/verify', wrap(async (req, res) => {
  await pool.query('CALL sp_verify_document(?, ?, ?, ?)',
    [req.params.docId, req.user.id, req.body.status, req.body.remarks || null]);
  res.json({ message: 'Document ' + req.body.status.toLowerCase() });
}));

router.post('/bookings/:id/approve', wrap(async (req, res) => {
  await pool.query('CALL sp_warden_approve(?, ?)', [req.params.id, req.user.id]);
  res.json({ message: 'Booking approved' });
}));

router.post('/bookings/:id/reject', wrap(async (req, res) => {
  await pool.query('CALL sp_warden_reject(?, ?, ?)', [req.params.id, req.user.id, req.body.remarks || 'Rejected by warden']);
  res.json({ message: 'Booking rejected, bed is free again' });
}));

router.post('/bookings/:id/reassign', wrap(async (req, res) => {
  if (!req.body.new_bed_id) return res.status(400).json({ error: 'new_bed_id required' });
  await pool.query('CALL sp_warden_reassign(?, ?, ?, ?)',
    [req.params.id, req.user.id, req.body.new_bed_id, req.body.remarks || 'Reassigned by warden']);
  res.json({ message: 'Student moved to new bed' });
}));

// free beds of my hostel (for the reassign picker)
router.get('/free-beds', wrap(async (req, res) => {
  await pool.query('CALL sp_expire_holds()');
  const [rows] = await pool.query(
    `SELECT v.bed_id, v.floor_number, v.room_number, v.room_type, v.is_ac, v.bed_number, v.bed_level,
            v.near_window, fn_bed_total(v.bed_id) AS price_total
       FROM v_bed_availability v WHERE v.hostel_id = ? AND v.bed_status = 'Available'
      ORDER BY v.floor_number, v.room_number, v.bed_number`, [req.user.hostel_id]);
  res.json(rows);
}));

// occupancy per floor
router.get('/occupancy', wrap(async (req, res) => {
  await pool.query('CALL sp_expire_holds()');
  const [rows] = await pool.query(
    `SELECT floor_number, COUNT(*) AS total_beds,
            SUM(bed_status = 'Booked')  AS booked,
            SUM(bed_status IN ('Held','Pending')) AS in_progress,
            SUM(bed_status = 'Available') AS available,
            SUM(bed_status = 'Blocked') AS blocked
       FROM v_bed_availability WHERE hostel_id = ? GROUP BY floor_number ORDER BY floor_number`,
    [req.user.hostel_id]);
  res.json(rows);
}));

// block / unblock a damaged bed
router.put('/beds/:id/block', wrap(async (req, res) => {
  const [r] = await pool.query(
    `UPDATE bed b JOIN room r ON r.room_id = b.room_id JOIN floor f ON f.floor_id = r.floor_id
        SET b.is_blocked = ? WHERE b.bed_id = ? AND f.hostel_id = ?`,
    [req.body.blocked ? 1 : 0, req.params.id, req.user.hostel_id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Bed not found in your hostel' });
  res.json({ message: req.body.blocked ? 'Bed blocked' : 'Bed unblocked' });
}));

module.exports = router;
