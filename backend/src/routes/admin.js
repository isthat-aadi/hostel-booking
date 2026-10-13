const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { auth, wrap } = require('../middleware');

router.use(auth('admin'));

// dashboard numbers
router.get('/stats', wrap(async (req, res) => {
  await pool.query('CALL sp_expire_holds()');
  const [[s]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM student) AS students_registered,
            (SELECT COUNT(*) FROM admission_record) AS admissions_total,
            (SELECT COUNT(*) FROM booking WHERE status = 'Pending')  AS pending_bookings,
            (SELECT COUNT(*) FROM booking WHERE status = 'Approved') AS approved_bookings,
            (SELECT COUNT(*) FROM bed) AS total_beds,
            (SELECT COALESCE(SUM(pi.amount),0) FROM payment p JOIN payment_item pi ON pi.payment_id = p.payment_id
              WHERE p.payment_status = 'Paid') AS money_collected`);
  const [perHostel] = await pool.query(
    `SELECT hostel_name, COUNT(*) AS total_beds, SUM(bed_status = 'Booked') AS booked,
            SUM(bed_status IN ('Held','Pending')) AS in_progress,
            SUM(bed_status = 'Blocked') AS blocked,
            SUM(bed_status = 'Available') AS available FROM v_bed_availability GROUP BY hostel_id, hostel_name`);
  res.json({ ...s, per_hostel: perHostel });
}));

// ---- wardens (admin adds / removes) ----
router.get('/wardens', wrap(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.warden_id, w.name, w.email, w.phone, h.hostel_id, h.hostel_name
       FROM warden w JOIN hostel h ON h.hostel_id = w.hostel_id ORDER BY h.hostel_name`);
  res.json(rows);
}));
router.post('/wardens', wrap(async (req, res) => {
  const { hostel_id, name, email, phone, password } = req.body;
  if (!hostel_id || !name || !email || !password) return res.status(400).json({ error: 'hostel_id, name, email, password required' });
  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    'INSERT INTO warden (hostel_id, created_by_admin, name, email, phone, password_hash) VALUES (?,?,?,?,?,?)',
    [hostel_id, req.user.id, name, email, phone || null, hash]);
  res.status(201).json({ warden_id: r.insertId });
}));
router.delete('/wardens/:id', wrap(async (req, res) => {
  const [r] = await pool.query('DELETE FROM warden WHERE warden_id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Warden not found' });
  res.json({ message: 'Warden removed' });
}));

// ---- structure ----
router.get('/hostels', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM hostel ORDER BY hostel_name');
  res.json(rows);
}));
router.post('/hostels', wrap(async (req, res) => {
  const { hostel_name, gender, total_floors } = req.body;
  const [r] = await pool.query('INSERT INTO hostel (hostel_name, gender, total_floors) VALUES (?,?,?)',
    [hostel_name, gender, total_floors]);
  res.status(201).json({ hostel_id: r.insertId });
}));
router.get('/floors', wrap(async (req, res) => {
  const hostelId = req.query.hostel_id || null;
  const [rows] = await pool.query(
    `SELECT f.floor_id, f.hostel_id, f.floor_number, f.floor_type, COUNT(r.room_id) AS rooms
       FROM floor f LEFT JOIN room r ON r.floor_id = f.floor_id
      WHERE (? IS NULL OR f.hostel_id = ?)
      GROUP BY f.floor_id, f.hostel_id, f.floor_number, f.floor_type
      ORDER BY f.hostel_id, f.floor_number`, [hostelId, hostelId]);
  res.json(rows);
}));
router.post('/floors', wrap(async (req, res) => {
  const { hostel_id, floor_number, floor_type } = req.body;
  const [r] = await pool.query('INSERT INTO floor (hostel_id, floor_number, floor_type) VALUES (?,?,?)',
    [hostel_id, floor_number, floor_type || 'Regular']);
  res.status(201).json({ floor_id: r.insertId });
}));
// creating a room auto-creates its beds using the standard layout
router.post('/rooms', wrap(async (req, res) => {
  const { floor_id, room_number, room_type, is_ac } = req.body;
  const layouts = {
    Quad:   [[1,'Lower',1],[2,'Upper',1],[3,'Lower',0],[4,'Upper',0]],
    Double: [[1,'Standard',1],[2,'Standard',0]]
  };
  if (!layouts[room_type]) return res.status(400).json({ error: 'room_type must be Double or Quad' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO room (floor_id, room_number, room_type, is_ac) VALUES (?,?,?,?)',
      [floor_id, room_number, room_type, is_ac ? 1 : 0]);
    for (const [n, lvl, win] of layouts[room_type]) {
      await conn.query('INSERT INTO bed (room_id, bed_number, bed_level, near_window) VALUES (?,?,?,?)', [r.insertId, n, lvl, win]);
    }
    await conn.commit();
    res.status(201).json({ room_id: r.insertId });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}));

// ---- admissions import (replace with official system sync later) ----
router.post('/admissions/import', wrap(async (req, res) => {
  const rows = req.body.records;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'records array required' });
  let done = 0;
  for (const r of rows) {
    await pool.query(
      `INSERT INTO admission_record (admission_no, name, email, phone, course, gender, admission_status)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone),
         course = VALUES(course), gender = VALUES(gender), admission_status = VALUES(admission_status)`,
      [r.admission_no, r.name, r.email || null, r.phone || null, r.course, r.gender, r.admission_status || 'Confirmed']);
    done++;
  }
  res.json({ imported: done });
}));

// ---- fees ----
router.get('/fees', wrap(async (req, res) => {
  const [fees] = await pool.query('SELECT * FROM fee_structure ORDER BY room_type, is_ac DESC, bed_level');
  const [extras] = await pool.query('SELECT * FROM extra_charge ORDER BY charge_id');
  res.json({ fees, extras });
}));
router.put('/fees/:id', wrap(async (req, res) => {
  const { hostel_fee, utility_charges, mess_advance, security_deposit } = req.body;
  await pool.query(
    `UPDATE fee_structure SET hostel_fee = ?, utility_charges = ?, mess_advance = ?, security_deposit = ? WHERE fee_id = ?`,
    [hostel_fee, utility_charges, mess_advance, security_deposit, req.params.id]);
  res.json({ message: 'Fee updated' });
}));
router.put('/extra-charges/:code', wrap(async (req, res) => {
  const [r] = await pool.query('UPDATE extra_charge SET amount = ?, is_active = ? WHERE code = ?',
    [req.body.amount, req.body.is_active === false ? 0 : 1, req.params.code]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Charge not found' });
  res.json({ message: 'Charge updated' });
}));

module.exports = router;
