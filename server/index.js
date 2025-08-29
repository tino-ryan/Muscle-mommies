// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('./config/firebase');
// Firebase Admin SDK
const authRoutes = require('./routes/authRoutes'); // your auth routes

//store routes
const storeRoutes = require('./routes/storeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // allow all origins (adjust for production)
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Backend is live!');
});

// Auth routes
app.use('/api/auth', authRoutes);
// store routes
app.use('/api/stores', storeRoutes);

// (Optional) Users route - dev/admin use only
app.get('/api/users', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
