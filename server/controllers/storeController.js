const admin = require('../config/firebase');
const uuid = require('uuid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Store, Chat, Message } = require('../models/store');

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

// Get all stores
const getStores = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection(Store.collection).get();
    const stores = snapshot.docs.map((doc) => ({
      storeId: doc.id,
      ...doc.data(),
    }));
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch stores', details: error.message });
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

const getContactInfos = async (req, res) => {
  try {
    const userId = req.user.uid;
    const storeRef = admin
      .firestore()
      .collection('stores')
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;
    const snapshot = await admin
      .firestore()
      .collection('stores')
      .doc(storeId)
      .collection('contactInfos')
      .get();
    const contactInfos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(contactInfos);
  } catch (err) {
    console.error('Get contact infos error:', err);
    res.status(500).json({ error: err.message });
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

// Get store by ID
const getStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;
    const storeDoc = await admin
      .firestore()
      .collection(Store.collection)
      .doc(storeId)
      .get();
    if (!storeDoc.exists) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ storeId, ...storeDoc.data() });
  } catch (error) {
    console.error('Error fetching store:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch store', details: error.message });
  }
};

// Update item (modified for storeController.js)

// Get messages for a specific chatId
const getMessagesForChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messagesRef = admin.firestore().collection(Message.collection);
    const snapshot = await messagesRef
      .where('chatId', '==', chatId)
      .orderBy('timestamp')
      .get();
    const messages = snapshot.docs.map((doc) => ({
      messageId: doc.id,
      ...doc.data(),
    }));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch messages', details: error.message });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.uid;
    const { receiverId, message, itemId, storeId } = req.body;
    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Missing receiverId or message' });
    }
    const sortedIds = [senderId, receiverId].sort();
    const chatId = sortedIds.join('_');
    const messageData = {
      chatId,
      senderId,
      receiverId,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };
    const messageRef = await admin
      .firestore()
      .collection(Message.collection)
      .add(messageData);
    const chatRef = admin.firestore().collection(Chat.collection).doc(chatId);
    const chatData = {
      chatId,
      participants: sortedIds,
      lastMessage: message,
      lastTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      itemId: itemId || null,
      storeId: storeId || null,
    };
    await chatRef.set(chatData, { merge: true });
    res.json({ messageId: messageRef.id, ...messageData });
  } catch (error) {
    console.error('Error sending message:', error);
    res
      .status(500)
      .json({ error: 'Failed to send message', details: error.message });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.uid;
    const messagesRef = admin.firestore().collection(Message.collection);
    const unreadQuery = messagesRef
      .where('chatId', '==', chatId)
      .where('receiverId', '==', userId)
      .where('read', '==', false);
    const snapshot = await unreadQuery.get();
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res
      .status(500)
      .json({ error: 'Failed to mark as read', details: error.message });
  }
};

// In storeController.js

// ... existing imports and functions ...

// Add otherId to chats for client-side filtering consistency
// Update item (optimized for partial updates)
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

    const storeRef = admin
      .firestore()
      .collection(Store.collection)
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(400).json({ error: 'Store not found' });
    }
    const storeId = storeSnapshot.docs[0].id;

    const itemRef = admin.firestore().collection('items').doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (itemDoc.data().storeId !== storeId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to update this item' });
    }

    const existingData = itemDoc.data();
    console.log('Received updateItem request body:', req.body); // Debug log

    // Only validate if full update is attempted
    if (name !== undefined || price !== undefined || quantity !== undefined) {
      if (!name || price === undefined || quantity === undefined) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: name, price, quantity' });
      }
    }

    const newImageURLs = [];
    if (images.length > 0) {
      for (const file of images) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'muscle-mommies',
        });
        const imageId = uuid.v4();
        await admin.firestore().collection('itemImages').doc(imageId).set({
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
        fs.unlinkSync(file.path); // Error handling already present
      }
    }

    const existingImages = existingData.images || [];
    const updatedImages =
      images.length > 0 ? [...existingImages, ...newImageURLs] : existingImages;

    const itemData = {
      name: name !== undefined ? name : existingData.name,
      description:
        description !== undefined
          ? description
          : existingData.description || '',
      category: category !== undefined ? category : existingData.category || '',
      department:
        department !== undefined ? department : existingData.department || '',
      style: style !== undefined ? style : existingData.style || '',
      size: size !== undefined ? size : existingData.size || '',
      price: price !== undefined ? parseFloat(price) : existingData.price || 0,
      quantity:
        quantity !== undefined
          ? parseInt(quantity)
          : existingData.quantity || 0,
      status:
        status !== undefined ? status : existingData.status || 'Available',
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

const getChats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const chatsRef = admin.firestore().collection('chats'); // Ensure collection name matches Firestore
    const snapshot = await chatsRef
      .where('participants', 'array-contains', userId)
      .get();
    console.log(
      `Fetching chats for user ${userId}, found ${snapshot.size} chats`
    );
    let chats = snapshot.docs.map((doc) => ({ chatId: doc.id, ...doc.data() }));
    chats.sort(
      (a, b) =>
        (b.lastTimestamp?.seconds || 0) - (a.lastTimestamp?.seconds || 0)
    );
    for (let chat of chats) {
      const otherId = chat.participants.find((id) => id !== userId);
      try {
        const userRecord = await admin.auth().getUser(otherId);
        chat.otherName =
          userRecord.displayName || userRecord.email || 'Unknown';
        chat.otherId = otherId;
      } catch (err) {
        console.error(`Failed to fetch user ${otherId}:`, err.message);
        chat.otherName = 'Unknown';
        chat.otherId = otherId;
      }
    }
    console.log('Returning chats:', chats);
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch chats', details: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRecord = await admin.auth().getUser(userId);
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .get();
    const userData = userDoc.exists ? userDoc.data() : {};
    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || userData.displayName || 'Unknown',
      role: userData.role || 'customer',
    });
  } catch (error) {
    console.error(`Error fetching user ${req.params.userId}:`, error);
    res.status(404).json({ error: 'User not found', details: error.message });
  }
};

// In storeController.js
const createReservation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reservationId, itemId, storeId, status, reservedAt } = req.body;
    if (
      !reservationId ||
      !itemId ||
      !storeId ||
      !status ||
      !reservedAt ||
      !userId
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify item exists
    const itemDoc = await admin
      .firestore()
      .collection('items')
      .doc(itemId)
      .get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify store exists
    const storeDoc = await admin
      .firestore()
      .collection('stores')
      .doc(storeId)
      .get();
    if (!storeDoc.exists) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const reservationData = {
      reservationId,
      itemId,
      userId,
      storeId,
      status,
      reservedAt: admin.firestore.Timestamp.fromDate(new Date(reservedAt)),
    };
    console.log('Creating reservation:', reservationData);
    await admin
      .firestore()
      .collection('Reservations')
      .doc(reservationId)
      .set(reservationData);
    console.log(`Reservation ${reservationId} created successfully`);
    res.json(reservationData);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res
      .status(500)
      .json({ error: 'Failed to create reservation', details: error.message });
  }
};

// Implement createChat (missing in your code; optional if you refactor handleReserve to use sendMessage)
const createChat = async (req, res) => {
  try {
    const senderId = req.user.uid;
    const { receiverId, itemId, storeId, message } = req.body;
    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Missing receiverId or message' });
    }
    const sortedIds = [senderId, receiverId].sort();
    const chatId = sortedIds.join('_');
    const chatData = {
      chatId,
      participants: sortedIds,
      lastMessage: message,
      lastTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      itemId: itemId || null,
      storeId: storeId || null,
    };
    const chatRef = admin.firestore().collection('chats').doc(chatId);
    await chatRef.set(chatData, { merge: true });
    const messageData = {
      chatId,
      senderId,
      receiverId,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };
    const messageRef = await admin
      .firestore()
      .collection('messages')
      .add(messageData);
    res.json({ chatId, messageId: messageRef.id });
  } catch (error) {
    console.error('Error creating chat:', error);
    res
      .status(500)
      .json({ error: 'Failed to create chat', details: error.message });
  }
};

// New endpoint to fetch reservations (for viewing by customer or owner)
const getReservations = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const role = userDoc.data().role || 'customer'; // Default to customer

    let query;
    if (role === 'storeOwner') {
      const storeSnapshot = await admin
        .firestore()
        .collection('stores')
        .where('ownerId', '==', userId)
        .get();
      if (storeSnapshot.empty) {
        // Return empty array instead of error for owners with no store
        return res.json([]);
      }
      const storeId = storeSnapshot.docs[0].id;
      query = admin
        .firestore()
        .collection('Reservations')
        .where('storeId', '==', storeId);
    } else {
      query = admin
        .firestore()
        .collection('Reservations')
        .where('userId', '==', userId);
    }
    const snapshot = await query.get();
    const reservations = snapshot.docs.map((doc) => ({
      reservationId: doc.id,
      ...doc.data(),
    }));
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch reservations', details: error.message });
  }
};
// New endpoint for customer to reserve item
const customerReserve = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { itemId } = req.params;
    const { storeId } = req.body; // Send storeId in body if needed
    const itemDoc = await admin
      .firestore()
      .collection('items')
      .doc(itemId)
      .get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const itemData = itemDoc.data();
    if (itemData.status !== 'Available') {
      return res.status(400).json({ error: 'Item not available' });
    }
    if (itemData.storeId !== storeId) {
      return res.status(400).json({ error: 'Invalid store' });
    }

    // Update item status to Reserved
    await itemDoc.ref.update({
      status: 'Reserved',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create reservation
    const reservationId = uuid.v4();
    const reservationData = {
      reservationId,
      itemId,
      userId,
      storeId,
      status: 'Pending',
      reservedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin
      .firestore()
      .collection('Reservations')
      .doc(reservationId)
      .set(reservationData);

    // Send message (assume ownerId from store)
    const storeDoc = await admin
      .firestore()
      .collection('stores')
      .doc(storeId)
      .get();
    const ownerId = storeDoc.data().ownerId;
    const sortedIds = [userId, ownerId].sort();
    const chatId = sortedIds.join('_');
    const messageData = {
      chatId,
      senderId: userId,
      receiverId: ownerId,
      message: `Reservation request for ${itemData.name}`,
      itemId,
      storeId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };
    const messageRef = await admin
      .firestore()
      .collection('messages')
      .add(messageData);

    const chatData = {
      chatId,
      participants: sortedIds,
      lastMessage: messageData.message,
      lastTimestamp: messageData.timestamp,
      itemId,
      storeId,
    };
    await admin
      .firestore()
      .collection('chats')
      .doc(chatId)
      .set(chatData, { merge: true });

    res.json({ reservationId, messageId: messageRef.id });
  } catch (error) {
    console.error('Error reserving item:', error);
    res
      .status(500)
      .json({ error: 'Failed to reserve item', details: error.message });
  }
};
// Added: Moved from itemController.js
const getItemById = async (req, res) => {
  try {
    const itemId = req.params.id;
    console.log(`Attempting to fetch item with ID: ${itemId}`);
    const docRef = admin.firestore().collection('items').doc(itemId);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`Item ${itemId} not found in Firestore`);
      return res.status(404).json({ error: 'Item not found' });
    }
    const itemData = { itemId: doc.id, ...doc.data() };
    console.log(`Fetched item: ${JSON.stringify(itemData, null, 2)}`);
    res.json(itemData);
  } catch (err) {
    console.error('Error fetching item:', err);
    res
      .status(500)
      .json({ error: 'Failed to fetch item', details: err.message });
  }
};
const updateReservation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reservationId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Cancelled', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify user is store owner
    const storeRef = admin
      .firestore()
      .collection('stores')
      .where('ownerId', '==', userId);
    const storeSnapshot = await storeRef.get();
    if (storeSnapshot.empty) {
      return res.status(403).json({ error: 'User is not a store owner' });
    }
    const storeId = storeSnapshot.docs[0].id;

    // Verify reservation exists and belongs to store
    const reservationRef = admin
      .firestore()
      .collection('Reservations')
      .doc(reservationId);
    const reservationDoc = await reservationRef.get();
    if (!reservationDoc.exists) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    if (reservationDoc.data().storeId !== storeId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to update this reservation' });
    }

    await reservationRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ reservationId, status });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res
      .status(500)
      .json({ error: 'Failed to update reservation', details: error.message });
  }
};

module.exports = {
  customerReserve,
  getStore,
  getStores,
  createOrUpdateStore,
  uploadImage,
  getContactInfos,
  addContactInfo,
  deleteContactInfo,
  getStoreById,
  updateItem,
  getChats,
  getMessagesForChat,
  sendMessage,
  markAsRead,
  createReservation,
  createChat,
  getReservations,
  getUserById,
  getItemById,
  updateReservation,
};
