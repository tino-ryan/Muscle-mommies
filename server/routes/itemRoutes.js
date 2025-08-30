// routes/itemRoutes.js
const express = require('express');
const {
  getItems,
  getItemById,
  getItemsByStore,
  searchItems,
  createItem,
} = require('../controllers/itemController');

const router = express.Router();

// /api/items
router.get('/', getItems);
router.get('/search', searchItems);
router.get('/store/:storeId', getItemsByStore);
router.get('/:id', getItemById);
router.post('/', createItem);

module.exports = router;
