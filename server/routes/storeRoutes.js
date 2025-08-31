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
  getStoreById,
  updateItem,
  getChats,
  getMessagesForChat,
  sendMessage,
  markAsRead,
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

// Update the route to match frontend expectation
router.get('/my-store', authMiddleware, getStore);
router.get('/api/stores/:storeId', authMiddleware, getStoreById); // Changed from /stores/:storeId
router.post(
  '/api/stores',
  authMiddleware,
  upload.single('profileImage'),
  createOrUpdateStore
);
router.post(
  '/api/stores/upload-image',
  authMiddleware,
  upload.single('profileImage'),
  uploadImage
);
router.get('/api/stores/items', authMiddleware, getItems);
router.post(
  '/api/stores/items',
  authMiddleware,
  upload.array('images', 5),
  createItem
);
router.get('/api/stores/items/:itemId', authMiddleware, getItem);
router.put(
  '/api/stores/items/:itemId',
  authMiddleware,
  upload.array('images', 5),
  updateItem
);
router.get('/api/stores/contact-infos', authMiddleware, getContactInfos);
router.post('/api/stores/contact-infos', authMiddleware, addContactInfo);
router.delete(
  '/api/stores/contact-infos/:contactId',
  authMiddleware,
  deleteContactInfo
);

router.get('/api/stores/chats', authMiddleware, getChats);
router.get(
  '/api/stores/chats/:chatId/messages',
  authMiddleware,
  getMessagesForChat
);
router.post('/api/stores/messages', authMiddleware, sendMessage);
router.put('/api/stores/chats/:chatId/read', authMiddleware, markAsRead);

module.exports = router;
