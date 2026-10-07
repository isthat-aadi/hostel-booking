// Creates demo logins + demo students (needs bcrypt, so it can't be plain SQL).
// Run AFTER the three .sql files:   npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

(async () => {
  const adminHash = await bcrypt.hash('admin123', 10);
  const wardenHash = await bcrypt.hash('warden123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  await pool.query(
    `INSERT INTO admin (name, email, password_hash) VALUES ('Chief Admin','admin@jklu.test',?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`, [adminHash]);
  const [[adm]] = await pool.query("SELECT admin_id FROM admin WHERE email = 'admin@jklu.test'");

  const [hostels] = await pool.query('SELECT hostel_id, hostel_name FROM hostel ORDER BY hostel_id');
  const slugs = ['boysa', 'boysb', 'girlsa', 'girlsb'];
  for (let i = 0; i < hostels.length; i++) {
    await pool.query(
      `INSERT INTO warden (hostel_id, created_by_admin, name, email, phone, password_hash)
       VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [hostels[i].hostel_id, adm.admin_id, `Warden ${hostels[i].hostel_name}`,
       `warden.${slugs[i] || 'h' + hostels[i].hostel_id}@jklu.test`, '9800000000', wardenHash]);
  }

  // 4 boys + 4 girls registered with preferences; the rest stay "not registered yet" for live demo
  const demo = [
    ['JKLU2026001', 'Night Owl', 'Average', 'Quiet',  [1, 4, 7]],
    ['JKLU2026002', 'Night Owl', 'Average', 'Quiet',  [4, 7, 5]],
    ['JKLU2026003', 'Early Bird', 'Very Tidy', 'Quiet', [6, 5]],
    ['JKLU2026004', 'Flexible', 'Relaxed', 'Group',   [1, 2, 10]],
    ['JKLU2026013', 'Early Bird', 'Very Tidy', 'Quiet', [5, 6, 7]],
    ['JKLU2026014', 'Early Bird', 'Very Tidy', 'Quiet', [6, 5, 5]],
    ['JKLU2026015', 'Night Owl', 'Average', 'Group',  [8, 9]],
    ['JKLU2026016', 'Flexible', 'Average', 'Flexible', [5, 8, 12]]
  ];
  for (const [adm_no, sleep, clean, study, hobbies] of demo) {
    const [[a]] = await pool.query('SELECT * FROM admission_record WHERE admission_no = ?', [adm_no]);
    await pool.query(
      `INSERT IGNORE INTO student (admission_no, name, email, phone, course, year_semester, gender, password_hash)
       VALUES (?,?,?,?,?,?,?,?)`,
      [a.admission_no, a.name, a.email, a.phone, a.course, '1st Year / Sem 1', a.gender, studentHash]);
    const [[s]] = await pool.query('SELECT student_id FROM student WHERE admission_no = ?', [adm_no]);
    await pool.query(
      `INSERT IGNORE INTO roommate_preference (student_id, sleep_schedule, cleanliness, study_style)
       VALUES (?,?,?,?)`, [s.student_id, sleep, clean, study]);
    for (const h of [...new Set(hobbies)]) {
      await pool.query('INSERT IGNORE INTO student_hobby (student_id, hobby_id) VALUES (?,?)', [s.student_id, h]);
    }
  }
  console.log('Seeded. Logins:');
  console.log('  admin   admin@jklu.test / admin123');
  console.log('  wardens warden.boysa@jklu.test, warden.boysb@..., warden.girlsa@..., warden.girlsb@...  / warden123');
  console.log('  student JKLU2026001 (boy) or JKLU2026013 (girl) / student123');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
