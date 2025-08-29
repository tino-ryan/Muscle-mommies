// routes/storeRoutes.js
const express = require('express');
const {
  getStores,
  getStoreById,
  createStore,
} = require('../controllers/storeController');

const router = express.Router();

// /api/stores
router.get('/', getStores);
router.get('/:id', getStoreById);
router.post('/', createStore);

module.exports = router;
