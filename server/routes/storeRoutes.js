const express = require('express');
const router = express.Router();
const {
  getStore,
  createOrUpdateStore,
  uploadImage,
  getItems,
  createItem,
  getContactInfos,
  addContactInfo,
  deleteContactInfo,
  getItem,
  updateItem,
} = require('../controllers/storeController');
const authMiddleware = require('../middleware/authMiddleware');
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

router.get('/my-store', authMiddleware, getStore);
router.post(
  '/',
  authMiddleware,
  upload.single('profileImage'),
  createOrUpdateStore
);
router.post(
  '/upload-image',
  authMiddleware,
  upload.single('profileImage'),
  uploadImage
);
router.get('/items', authMiddleware, getItems);
router.post('/items', authMiddleware, upload.array('images', 5), createItem);
router.get('/items/:itemId', authMiddleware, getItem);
router.put(
  '/items/:itemId',
  authMiddleware,
  upload.array('images', 5),
  updateItem
);
router.get('/contact-infos', authMiddleware, getContactInfos);
router.post('/contact-infos', authMiddleware, addContactInfo);
router.delete('/contact-infos/:contactId', authMiddleware, deleteContactInfo);

module.exports = router;
