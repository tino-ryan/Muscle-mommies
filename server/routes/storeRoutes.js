const express = require('express');
const router = express.Router();
const {
  getStore,
  getStores,
  createOrUpdateStore,
  uploadImage,
  getContactInfos,
  addContactInfo,
  deleteContactInfo,
  getStoreById,
  updateItem,
  getChats,
  getMessagesForChat,
  sendMessage,
  markAsRead,
  createReservation,
  createChat,
  getReservations,
  getUserById,
  customerReserve,
  getItemById,
  updateReservation,
} = require('../controllers/storeController');
const {
  getItems: getAllItems,
  getItemsByStore,
  searchItems,
  createItem,
} = require('../controllers/itemController');
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

// User and reservation routes
router.get('/stores/users/:userId', authMiddleware, getUserById);
router.put('/stores/reserve/:itemId', authMiddleware, customerReserve);

// Contact info routes (specific routes before parametric)
router.get('/stores/contact-infos', authMiddleware, getContactInfos);
router.post('/stores/contact-infos', authMiddleware, addContactInfo);
router.delete(
  '/stores/contact-infos/:contactId',
  authMiddleware,
  deleteContactInfo
);

// Chat routes (moved up: specific before parametric)
router.get('/stores/chats', authMiddleware, getChats);
router.get(
  '/stores/chats/:chatId/messages',
  authMiddleware,
  getMessagesForChat
);
router.post('/stores/messages', authMiddleware, sendMessage);
router.put('/stores/chats/:chatId/read', authMiddleware, markAsRead);
router.post('/stores/chats', authMiddleware, createChat);

// Reservation routes (moved up: specific before parametric)
router.get('/stores/reservations', authMiddleware, getReservations);
router.post('/stores/reservations', authMiddleware, createReservation);
router.put(
  '/stores/reservations/:reservationId',
  authMiddleware,
  updateReservation
);

// Store routes (parametric :storeId comes after specifics)
router.get('/my-store', authMiddleware, getStore);
router.get('/stores', getStores);
router.get('/stores/:storeId', authMiddleware, getStoreById);
router.post(
  '/stores',
  authMiddleware,
  upload.single('profileImage'),
  createOrUpdateStore
);
router.post(
  '/stores/upload-image',
  authMiddleware,
  upload.single('profileImage'),
  uploadImage
);

// Item routes
router.get('/items', getAllItems);
router.get('/items/:id', authMiddleware, getItemById);
router.get('/stores/:storeId/items', authMiddleware, getItemsByStore);
router.get('/items/search', searchItems);
router.post(
  '/stores/items',
  authMiddleware,
  upload.array('images', 5),
  createItem
);
router.put('/stores/items/:itemId', authMiddleware, updateItem);
router.put(
  '/stores/items/:itemId/images',
  authMiddleware,
  upload.array('images', 5),
  updateItem
);

module.exports = router;
