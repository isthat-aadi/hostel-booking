const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev_secret';

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: '8h' });

// auth('student') / auth('warden') / auth('admin')
const auth = (role) => (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    const user = jwt.verify(token, SECRET);
    if (role && user.role !== role) return res.status(403).json({ error: 'Not allowed for your role' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, login again' });
  }
};

// wrap async handlers so errors reach errorHandler
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// SIGNAL 45000 from our triggers/procedures -> friendly 400; duplicate key -> 409
const errorHandler = (err, req, res, next) => {
  if (err.message === 'ONLY_PDF_JPG_PNG') return res.status(400).json({ error: 'Only PDF, JPG or PNG files are allowed' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File is too large (max 5 MB)' });
  if (err.sqlState === '45000') return res.status(400).json({ error: err.sqlMessage });
  if (err.errno === 1062) return res.status(409).json({ error: 'Already exists' });
  if (err.errno === 1452) return res.status(400).json({ error: 'Related record not found' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
};

module.exports = { sign, auth, wrap, errorHandler };
