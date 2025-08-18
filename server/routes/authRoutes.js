const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Email & password signup
router.post('/signup', authController.signup);

// Google OAuth signup
router.post('/signup/google', authController.googleSignup);

// (Optional) Login endpoint if you plan to have server-side login via Firebase Admin)
//router.post('/login', authController.login); // implement login in controller if needed

module.exports = router;
