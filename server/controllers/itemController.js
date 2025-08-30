// controllers/itemController.js
const admin = require('firebase-admin');
const Item = require('../models/itemModel');

const db = admin.firestore();
const itemsRef = db.collection('items');

// GET all items
const getItems = async (req, res) => {
  try {
    const snapshot = await itemsRef.get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();

      return new Item({
        itemId: data.itemId || doc.id,
        name: data.name,
        storeId: data.storeId,
        category: data.category,
        style: data.style,
        department: data.department,
        price: data.price,
        quantity: data.quantity,
        size: data.size,
        status: data.status,
        description: data.description,
        images: data.images,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single item
const getItemById = async (req, res) => {
  try {
    const doc = await itemsRef.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(new Item({ itemId: doc.id, ...doc.data() }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET items by store
const getItemsByStore = async (req, res) => {
  try {
    const snapshot = await itemsRef
      .where('storeId', '==', req.params.storeId)
      .get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Item({
        itemId: data.itemId || doc.id,
        ...data,
      });
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search items with filters
const searchItems = async (req, res) => {
  try {
    const {
      searchTerm,
      category,
      style,
      department,
      minPrice,
      maxPrice,
      status = 'Available',
    } = req.query;

    let query = itemsRef;

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (style) {
      query = query.where('style', '==', style);
    }
    if (department) {
      query = query.where('department', '==', department);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Item({
        itemId: data.itemId || doc.id,
        ...data,
      });
    });

    // Apply client-side filters (Firestore limitations)
    if (searchTerm) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minPrice || maxPrice) {
      items = items.filter((item) => {
        const price = item.price;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST new item
const createItem = async (req, res) => {
  try {
    const {
      name,
      storeId,
      category,
      style,
      department,
      price,
      quantity,
      size,
      description,
      images,
    } = req.body;

    const newItem = {
      name,
      storeId,
      category,
      style,
      department,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      size,
      status: 'Available',
      description,
      images: images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await itemsRef.add(newItem);
    res.status(201).json({ itemId: docRef.id, ...newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getItems,
  getItemById,
  getItemsByStore,
  searchItems,
  createItem,
};
