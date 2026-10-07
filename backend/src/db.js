require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  socketPath: process.env.DB_SOCKET || undefined
});

// Procedures with OUT params need ONE connection so @variables survive between statements
async function callWithOut(sql, params, outVar) {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql, params);
    const [[row]] = await conn.query(`SELECT ${outVar} AS id`);
    return row.id;
  } finally {
    conn.release();
  }
}

module.exports = { pool, callWithOut };
