// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Existing routes
router.post('/signup', authController.signup);
router.post('/signup/google', authController.googleSignup);

// New route for getting user role
router.post('/getRole', authController.getRole);

router.get('/auth/user', authController.getRole1);

module.exports = router;
