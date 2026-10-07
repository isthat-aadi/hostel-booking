require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware');

const app = express();
app.use(cors());                 // frontend (Figma/React app) runs on another port
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/warden', require('./routes/warden'));
app.use('/api/admin', require('./routes/admin'));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Hostel API running on http://localhost:${PORT}`));
