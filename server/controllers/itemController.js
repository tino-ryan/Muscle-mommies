const admin = require('firebase-admin');
const uuid = require('uuid');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Item = require('../models/itemModel');

const db = admin.firestore();
const itemsRef = db.collection('items');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Stream upload to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'muscle-mommies' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

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

// Delete an item
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.uid; // From authMiddleware

    // Check if item exists
    const itemDoc = await itemsRef.doc(itemId).get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const itemData = itemDoc.data();

    // Verify store ownership
    const storeRef = db.collection('stores').where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(403).json({ error: 'Unauthorized: Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    if (itemData.storeId !== storeId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized: You do not own this item' });
    }

    // Delete associated images from itemImages collection and Cloudinary
    const imageDocs = await db
      .collection('itemImages')
      .where('itemId', '==', itemId)
      .get();
    for (const imageDoc of imageDocs.docs) {
      const imageData = imageDoc.data();
      try {
        // Extract public_id from Cloudinary URL
        const publicId = imageData.imageURL.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`muscle-mommies/${publicId}`);
        await db.collection('itemImages').doc(imageDoc.id).delete();
      } catch (uploadError) {
        console.error('Cloudinary deletion error:', uploadError);
        // Continue deletion even if image deletion fails to ensure item is removed
      }
    }

    // Delete the item from Firestore
    await itemsRef.doc(itemId).delete();

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res
      .status(500)
      .json({ error: 'Failed to delete item', details: err.message });
  }
};

// GET items by store
const getItemsByStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;
    console.log(`Fetching items for storeId: ${storeId}`);
    const storeDoc = await db.collection('stores').doc(storeId).get();
    if (!storeDoc.exists) {
      console.log(`Store ${storeId} not found in Firestore`);
      return res.status(404).json({ error: 'Store not found' });
    }
    const snapshot = await itemsRef.where('storeId', '==', storeId).get();
    console.log(`Found ${snapshot.size} items for store ${storeId}`);
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Item({
        itemId: data.itemId || doc.id,
        ...data,
      });
    });
    res.json(items);
  } catch (err) {
    console.error('Error fetching store items:', err);
    res
      .status(500)
      .json({ error: 'Failed to fetch store items', details: err.message });
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
    const userId = req.user.uid;
    const {
      name,
      description,
      category,
      department,
      style,
      size,
      price,
      quantity,
      status,
    } = req.body;
    const images = req.files || [];

    console.log('Uploaded files:', images); // Log to verify files

    // Validate required fields
    if (!name || !price || !quantity) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: name, price, quantity' });
    }

    // Validate store ownership
    const storeRef = db.collection('stores').where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;

    // Parse and validate numeric fields
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      return res
        .status(400)
        .json({ error: 'Price and quantity must be valid numbers' });
    }

    // Handle image uploads to Cloudinary
    const imageURLs = [];
    for (const file of images) {
      try {
        const result = await uploadToCloudinary(file);
        const imageId = uuid.v4();
        await db
          .collection('itemImages')
          .doc(imageId)
          .set({
            imageId,
            itemId: null,
            imageURL: result.secure_url,
            isPrimary: imageURLs.length === 0,
          });
        imageURLs.push({
          imageId,
          imageURL: result.secure_url,
          isPrimary: imageURLs.length === 0,
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload image',
          details: uploadError.message,
        });
      }
    }

    // Create new item
    const itemData = {
      itemId: uuid.v4(),
      storeId,
      name,
      description: description || '',
      category: category || '',
      department: department || '',
      style: style || '',
      size: size || '',
      price: parsedPrice,
      quantity: parsedQuantity,
      status: status || 'Available',
      images: imageURLs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save item to Firestore
    await itemsRef.doc(itemData.itemId).set(itemData);

    // Update itemId in itemImages collection
    for (const image of imageURLs) {
      await db.collection('itemImages').doc(image.imageId).update({
        itemId: itemData.itemId,
      });
    }

    res.status(201).json({ itemId: itemData.itemId, ...itemData });
  } catch (err) {
    console.error('Error creating item:', err);
    res
      .status(500)
      .json({ error: 'Failed to create item', details: err.message });
  }
};

module.exports = {
  getItems,
  getItemsByStore,
  searchItems,
  createItem,
  deleteItem,
};
