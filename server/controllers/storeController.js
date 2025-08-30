const admin = require('../config/firebase');
const uuid = require('uuid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Store, Item, ItemImage } = require('../models/store');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get store details
const getStore = async (req, res) => {
  try {
    const userId = req.user.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const snapshot = await storeRef.get();
    if (snapshot.empty) {
      return res
        .status(400)
        .json({ error: 'Store not found. Please create a store.' });
    }
    const storeData = snapshot.docs[0].data();
    res.json({ storeId: snapshot.docs[0].id, ...storeData });
  } catch (error) {
    console.error('Error fetching store:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch store', details: error.message });
  }
};

// Create or update store
const createOrUpdateStore = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { storeName, description, address, location, profileImageURL } =
      req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    if (!storeName || !address || !location) {
      return res.status(400).json({
        error: 'Missing required fields: storeName, address, location',
      });
    }

    // Parse location if it's a JSON string
    let parsedLocation;
    try {
      parsedLocation =
        typeof location === 'string' ? JSON.parse(location) : location;
      if (!parsedLocation.lat || !parsedLocation.lng) {
        return res.status(400).json({ error: 'Invalid location format' });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: 'Failed to parse location', details: error.message });
    }

    let imageURL = profileImageURL || '';
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'muscle-mommies',
        });
        imageURL = result.secure_url;
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn(
            'Failed to clean up temporary file:',
            cleanupError.message
          );
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          error: 'Failed to upload image',
          details: uploadError.message,
        });
      }
    }

    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const snapshot = await storeRef.get();
    const storeData = {
      ownerId: userId,
      storeName,
      description: description || '',
      address,
      location: {
        lat: parseFloat(parsedLocation.lat),
        lng: parseFloat(parsedLocation.lng),
      },
      profileImageURL: imageURL,
      createdAt: snapshot.empty
        ? admin.firestore.FieldValue.serverTimestamp()
        : snapshot.docs[0].data().createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let storeId;
    if (snapshot.empty) {
      const newStoreRef = await admin
        .firestore()
        .collection(Store.collection)
        .add(storeData);
      storeId = newStoreRef.id;
    } else {
      storeId = snapshot.docs[0].id;
      await admin
        .firestore()
        .collection(Store.collection)
        .doc(storeId)
        .update(storeData);
    }

    res.json({ storeId, ...storeData });
  } catch (error) {
    console.error('Error creating/updating store:', error);
    res
      .status(500)
      .json({ error: 'Failed to create/update store', details: error.message });
  }
};

// Upload image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'muscle-mommies',
    });
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError.message);
    }
    res.json({ imageURL: result.secure_url });
  } catch (error) {
    console.error('Error uploading image:', error);
    res
      .status(500)
      .json({ error: 'Failed to upload image', details: error.message });
  }
};

// Get all items
const getItems = async (req, res) => {
  try {
    const userId = req.user.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    const itemsRef = admin
      .firestore()
      .collection(Item.collection)
      .where('storeId', '==', storeId);
    const itemsSnapshot = await itemsRef.get();
    const items = [];
    for (const doc of itemsSnapshot.docs) {
      const itemData = doc.data();
      const imagesRef = admin
        .firestore()
        .collection(ItemImage.collection)
        .where('itemId', '==', doc.id);
      const imagesSnapshot = await imagesRef.get();
      const images = imagesSnapshot.docs.map((imgDoc) => imgDoc.data());
      items.push({ itemId: doc.id, ...itemData, images });
    }
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch items', details: error.message });
  }
};

// Create new item
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
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    if (!name || !price || !quantity) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: name, price, quantity' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    const itemId = uuid.v4();
    const imageURLs = [];
    if (images.length > 0) {
      for (const file of images) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'muscle-mommies',
          });
          const imageId = uuid.v4();
          await admin
            .firestore()
            .collection(ItemImage.collection)
            .doc(imageId)
            .set({
              imageId,
              itemId,
              imageURL: result.secure_url,
              isPrimary: imageURLs.length === 0,
            });
          imageURLs.push({
            imageId,
            imageURL: result.secure_url,
            isPrimary: imageURLs.length === 0,
          });
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.warn(
              'Failed to clean up temporary file:',
              cleanupError.message
            );
          }
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            error: 'Failed to upload image',
            details: uploadError.message,
          });
        }
      }
    }
    const itemData = {
      itemId,
      storeId,
      name,
      description: description || '',
      category: category || '',
      department: department || '',
      style: style || '',
      size: size || '',
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 0,
      status: status || 'Available',
      images: imageURLs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin
      .firestore()
      .collection(Item.collection)
      .doc(itemId)
      .set(itemData);
    res.json(itemData);
  } catch (error) {
    console.error('Error creating item:', error);
    res
      .status(500)
      .json({ error: 'Failed to create item', details: error.message });
  }
};

// Get contact infos
const getContactInfos = async (req, res) => {
  try {
    const userId = req.user.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    const contactInfosRef = admin
      .firestore()
      .collection(Store.collection)
      .doc(storeId)
      .collection(Store.subcollections.contactInfos.collection);
    const contactInfosSnapshot = await contactInfosRef.get();
    const contactInfos = contactInfosSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(contactInfos);
  } catch (error) {
    console.error('Error fetching contact infos:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch contact infos', details: error.message });
  }
};

// Add contact info
const addContactInfo = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { type, value } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    if (!type || !value) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: type, value' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    const contactId = uuid.v4();
    const contactData = { id: contactId, type, value };
    await admin
      .firestore()
      .collection(Store.collection)
      .doc(storeId)
      .collection(Store.subcollections.contactInfos.collection)
      .doc(contactId)
      .set(contactData);
    res.json(contactData);
  } catch (error) {
    console.error('Error adding contact info:', error);
    res
      .status(500)
      .json({ error: 'Failed to add contact info', details: error.message });
  }
};

// Delete contact info
const deleteContactInfo = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { contactId } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    await admin
      .firestore()
      .collection(Store.collection)
      .doc(storeId)
      .collection(Store.subcollections.contactInfos.collection)
      .doc(contactId)
      .delete();
    res.json({ message: 'Contact info deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact info:', error);
    res
      .status(500)
      .json({ error: 'Failed to delete contact info', details: error.message });
  }
};

// Get single item by ID
const getItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { itemId } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    const itemRef = admin.firestore().collection(Item.collection).doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const itemData = itemDoc.data();
    if (itemData.storeId !== storeId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to access this item' });
    }
    const imagesRef = admin
      .firestore()
      .collection(ItemImage.collection)
      .where('itemId', '==', itemId);
    const imagesSnapshot = await imagesRef.get();
    const images = imagesSnapshot.docs.map((imgDoc) => imgDoc.data());
    res.json({ itemId, ...itemData, images });
  } catch (error) {
    console.error('Error fetching item:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch item', details: error.message });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { itemId } = req.params;
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

    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }
    if (!name || !price || !quantity) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: name, price, quantity' });
    }

    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;

    const itemRef = admin.firestore().collection(Item.collection).doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (itemDoc.data().storeId !== storeId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to update this item' });
    }

    const newImageURLs = [];
    if (images.length > 0) {
      for (const file of images) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'muscle-mommies',
          });
          const imageId = uuid.v4();
          await admin
            .firestore()
            .collection(ItemImage.collection)
            .doc(imageId)
            .set({
              imageId,
              itemId,
              imageURL: result.secure_url,
              isPrimary: false,
            });
          newImageURLs.push({
            imageId,
            imageURL: result.secure_url,
            isPrimary: false,
          });
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.warn(
              'Failed to clean up temporary file:',
              cleanupError.message
            );
          }
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({
            error: 'Failed to upload image',
            details: uploadError.message,
          });
        }
      }
    }

    const existingImages = itemDoc.data().images || [];
    const updatedImages = [...existingImages, ...newImageURLs];

    const itemData = {
      name,
      description: description || '',
      category: category || '',
      department: department || '',
      style: style || '',
      size: size || '',
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 0,
      status: status || 'Available',
      images: updatedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await itemRef.update(itemData);
    res.json({ itemId, ...itemData });
  } catch (error) {
    console.error('Error updating item:', error);
    res
      .status(500)
      .json({ error: 'Failed to update item', details: error.message });
  }
};

module.exports = {
  getStore,
  createOrUpdateStore,
  uploadImage,
  getItems,
  createItem,
  getContactInfos,
  addContactInfo,
  deleteContactInfo,
  getItem,
  updateItem,
};
