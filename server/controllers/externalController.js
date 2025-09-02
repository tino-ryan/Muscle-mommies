const admin = require('../config/firebase');
// eslint-disable-next-line no-unused-vars
const { Store, ItemImage } = require('../models/store');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

// Get all thrift stores
const getThriftStores = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection(Store.collection).get();
    const stores = snapshot.docs.map((doc) => ({
      storeId: doc.id,
      ...doc.data(),
    }));
    res.json(stores);
  } catch (error) {
    console.error('Error fetching thrift stores:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch thrift stores', details: error.message });
  }
};

// Upload image to Cloudinary
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'muscle-mommies/external', // Separate folder for external uploads
    });
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError.message);
    }
    // Store image metadata in Firestore
    const imageId = result.public_id;
    const imageData = {
      imageId,
      imageURL: result.secure_url,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin
      .firestore()
      .collection('externalImages')
      .doc(imageId)
      .set(imageData);
    res.json({ imageId, imageURL: result.secure_url });
  } catch (error) {
    console.error('Error uploading image:', error);
    res
      .status(500)
      .json({ error: 'Failed to upload image', details: error.message });
  }
};

// Get all uploaded photos
const getPhotos = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('externalImages').get();
    const images = snapshot.docs.map((doc) => ({
      imageId: doc.id,
      ...doc.data(),
    }));
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch images', details: error.message });
  }
};

module.exports = { validateApiKey, getThriftStores, uploadPhoto, getPhotos };
