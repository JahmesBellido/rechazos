const express = require('express');
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)'));
    }
  }
});

router.post('/avatar', isAuthenticated, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se seleccionó ningún archivo' });
  }
  const url = `/uploads/avatars/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
