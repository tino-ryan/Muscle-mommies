const express = require('express');
const router = express.Router();
const {
  validateApiKey,
  getThriftStores,
  getPhotos,
} = require('../controllers/externalController');

router.get('/stores', getThriftStores);
router.get('/photos', validateApiKey, getPhotos);

module.exports = router;
