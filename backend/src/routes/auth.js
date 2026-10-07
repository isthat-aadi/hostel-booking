const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { sign, wrap } = require('../middleware');

// Student registration: only students present in admission_record can register
router.post('/register', wrap(async (req, res) => {
  const { admission_no, email, phone, password, year_semester, hobbies = [] } = req.body;
  if (!admission_no || !email || !phone || !password) {
    return res.status(400).json({ error: 'admission_no, email, phone and password are required' });
  }
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const [[adm]] = await pool.query('SELECT * FROM admission_record WHERE admission_no = ?', [admission_no]);
  if (!adm) return res.status(404).json({ error: 'Admission number not found in college records' });
  if (adm.admission_status !== 'Confirmed') return res.status(403).json({ error: 'Admission is not confirmed yet' });

  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO student (admission_no, name, email, phone, course, year_semester, gender, password_hash)
       VALUES (?,?,?,?,?,?,?,?)`,
      [adm.admission_no, adm.name, email, phone, adm.course, year_semester || '1st Year / Sem 1', adm.gender, hash]);
    for (const hid of hobbies) {
      await conn.query('INSERT IGNORE INTO student_hobby (student_id, hobby_id) VALUES (?,?)', [r.insertId, hid]);
    }
    await conn.commit();
    res.status(201).json({ student_id: r.insertId, message: 'Registered. You can login now.' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// One login for all roles.  identifier = admission_no (student) or email (warden/admin)
router.post('/login', wrap(async (req, res) => {
  const { role, identifier, password } = req.body;
  let sql, key;
  if (role === 'student') { sql = 'SELECT * FROM student WHERE admission_no = ?'; key = 'student_id'; }
  else if (role === 'warden') { sql = 'SELECT * FROM warden WHERE email = ?'; key = 'warden_id'; }
  else if (role === 'admin') { sql = 'SELECT * FROM admin WHERE email = ?'; key = 'admin_id'; }
  else return res.status(400).json({ error: 'role must be student, warden or admin' });

  const [[u]] = await pool.query(sql, [identifier]);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) {
    return res.status(401).json({ error: 'Wrong ID or password' });
  }
  const payload = { id: u[key], role, name: u.name };
  if (role === 'student') payload.gender = u.gender;
  if (role === 'warden') payload.hostel_id = u.hostel_id;
  res.json({ token: sign(payload), user: payload });
}));

module.exports = router;
