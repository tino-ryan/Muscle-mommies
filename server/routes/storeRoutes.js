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
  updateReservationStatus, // Updated name
  createReview, // New function
  confirmReservation,
  getStoreReviews,
} = require('../controllers/storeController');
const {
  getItems: getAllItems,
  getItemsByStore,
  searchItems,
  createItem,
} = require('../controllers/itemController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Use memory storage for all file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// User and reservation routes
router.get('/stores/users/:userId', authMiddleware, getUserById);
router.put('/stores/reserve/:itemId', authMiddleware, customerReserve);

// Contact info routes
router.get('/stores/contact-infos', authMiddleware, getContactInfos);
router.post('/stores/contact-infos', authMiddleware, addContactInfo);
router.delete(
  '/stores/contact-infos/:contactId',
  authMiddleware,
  deleteContactInfo
);

// Chat routes
router.get('/stores/chats', authMiddleware, getChats);
router.get(
  '/stores/chats/:chatId/messages',
  authMiddleware,
  getMessagesForChat
);
router.post('/stores/messages', authMiddleware, sendMessage);
router.put('/stores/chats/:chatId/read', authMiddleware, markAsRead);
router.post('/stores/chats', authMiddleware, createChat);

// Review routes (NEW)
router.post('/stores/reviews', authMiddleware, createReview);
router.get('/stores/:storeId/reviews', getStoreReviews);

// Reservation routes (moved up: specific before parametric)
router.get('/stores/reservations', authMiddleware, getReservations);
router.post('/stores/reservations', authMiddleware, createReservation);
router.put(
  '/stores/reservations/:reservationId',
  authMiddleware,
  updateReservationStatus // Updated function name
);
router.put(
  '/stores/reservations/:reservationId/confirm',
  authMiddleware,
  confirmReservation // NEW endpoint
);

// Store routes
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
router.put(
  '/stores/items/:itemId',
  authMiddleware,
  upload.array('images', 5),
  updateItem
);
router.put(
  '/stores/items/:itemId/images',
  authMiddleware,
  upload.array('images', 5),
  updateItem
);

module.exports = router;
