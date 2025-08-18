const admin = require('../config/firebase'); // Firebase Admin SDK

const User = require('../models/user'); // User model

// Signup via email & password
exports.signup = async (req, res) => {
  console.log('Signup payload:', req.body); // <-- log the incoming data
  try {
    const { name, email, password, role } = req.body;

    if (!['customer', 'storeOwner'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    console.log('Firebase Auth user created:', userRecord.uid);
    const user = new User(userRecord.uid, name, email, role);
    await user.save();

    res.status(201).json({
      success: true,
      uid: userRecord.uid,
      email,
      message: 'User created successfully',
    });
  } catch (err) {
    console.error('Signup error:', err); // <-- log the error
    res.status(400).json({ success: false, message: err.message });
  }
};

// Signup via Google OAuth (frontend provides ID token)
exports.googleSignup = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    // Validate role
    if (!['customer', 'storeOwner'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Verify Google token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // Check if user already exists in Firestore
    const existingUser = await User.getByUid(uid);
    if (!existingUser) {
      const user = new User(uid, name || '', email || '', role);
      await user.save();
    }

    res.json({
      success: true,
      uid,
      email,
      message: 'Google signup successful',
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
