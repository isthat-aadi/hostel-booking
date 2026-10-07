const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { sign, wrap } = require('../middleware');

// Student sign-up.
//  - If the admission number IS in the college list, name/course/gender are taken from the list
//    (the student cannot change them).
//  - If it is NOT in the list, the student types name, gender and course themselves.
//    The warden verifies identity later by checking the uploaded documents.
router.post('/register', wrap(async (req, res) => {
  const b = req.body;
  const admission_no = (b.admission_no || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const phone = (b.phone || '').replace(/\s+/g, '');
  const password = b.password || '';
  const hobbies = Array.isArray(b.hobbies) ? b.hobbies : [];

  if (!admission_no || !email || !phone || !password) {
    return res.status(400).json({ error: 'Admission number, email, phone and password are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Phone number must be 10 digits' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const [[dup]] = await pool.query('SELECT student_id FROM student WHERE admission_no = ? OR email = ? LIMIT 1',
    [admission_no, email]);
  if (dup) return res.status(409).json({ error: 'This admission number or email is already registered' });

  let name, course, gender;
  const [[adm]] = await pool.query('SELECT * FROM admission_record WHERE admission_no = ?', [admission_no]);
  if (adm) {
    if (adm.admission_status !== 'Confirmed') return res.status(403).json({ error: 'Admission is not confirmed yet' });
    ({ name, course, gender } = adm);
  } else {
    name = (b.name || '').trim();
    course = (b.course || '').trim();
    gender = b.gender;
    if (!name || !course || !['Male', 'Female'].includes(gender)) {
      return res.status(400).json({ error: 'Name, gender (Male or Female) and course are required' });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO student (admission_no, name, email, phone, course, year_semester, gender, password_hash)
       VALUES (?,?,?,?,?,?,?,?)`,
      [admission_no, name, email, phone, course, b.year_semester || '1st Year / Sem 1', gender, hash]);
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
