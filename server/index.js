//server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('./config/firebase');
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const externalRoutes = require('./routes/externalRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for restricted routes
const corsOptions = {
  origin: (origin, callback) => {
    console.log('Request Origin:', origin); // Log the origin
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'https://muscle-mommies.web.app'];
    console.log('Allowed Origins:', allowedOrigins); // Log allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

// Apply CORS selectively (exclude /external routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/external')) {
    // No CORS restrictions for /external routes
    cors({ origin: '*' })(req, res, next);
  } else {
    // Apply restricted CORS for all other routes
    cors(corsOptions)(req, res, next);
  }
});

app.use(express.json());

// Admin authorization middleware
const verifyAdmin = async (req, res, next) => {
  const user = req.user; // From authMiddleware
  try {
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(user.uid)
      .get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ error: 'Error checking user role' });
  }
};

// Root route
app.get('/', (req, res) => {
  res.send('Backend is live!');
});

// Protect /api/users with auth and admin role
app.get('/api/users', authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', storeRoutes);
app.use('/external', externalRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
