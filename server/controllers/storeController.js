// controllers/storeController.js
const admin = require('firebase-admin');
const Store = require('../models/storeModel');

const db = admin.firestore();
const storesRef = db.collection('stores');

// GET all stores
const getStores = async (req, res) => {
  try {
    const snapshot = await storesRef.get();
    const stores = snapshot.docs.map(
      (doc) => new Store({ id: doc.id, ...doc.data() })
    );
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single store
const getStoreById = async (req, res) => {
  try {
    const doc = await storesRef.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(new Store({ id: doc.id, ...doc.data() }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST new store
const createStore = async (req, res) => {
  try {
    const { name, address, location, openingHours, ownerId } = req.body;
    const newStore = {
      name,
      address,
      location, // { latitude, longitude }
      openingHours,
      ownerId,
      createdAt: new Date(),
    };

    const docRef = await storesRef.add(newStore);
    res.status(201).json({ id: docRef.id, ...newStore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getStores, getStoreById, createStore };
