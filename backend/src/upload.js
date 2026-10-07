// File upload settings for the two required documents.
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// URL part -> database value
const DOC_TYPES = { 'payment-receipt': 'PAYMENT_RECEIPT', 'allotment-form': 'ALLOTMENT_FORM' };
const ALLOWED = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `${DOC_TYPES[req.params.type]}-${Date.now()}${ALLOWED[file.mimetype]}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },                       // 5 MB
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new Error('ONLY_PDF_JPG_PNG'))
});

module.exports = { upload, UPLOAD_DIR, DOC_TYPES };
