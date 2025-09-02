const express = require('express');
const router = express.Router();
const {
  validateApiKey,
  getThriftStores,
  uploadPhoto,
  getPhotos,
} = require('../controllers/externalController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// External routes
router.get('/stores', getThriftStores);
router.post('/upload', validateApiKey, upload.single('image'), uploadPhoto);
router.get('/photos', validateApiKey, getPhotos);

module.exports = router;
