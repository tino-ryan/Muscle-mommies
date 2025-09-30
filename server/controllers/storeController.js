const admin = require('../config/firebase');
const uuid = require('uuid');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { Store, Chat, Message } = require('../models/store');
//const { use } = require('react');

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
const defaultHours = {
  Monday: { open: false, start: '09:00', end: '17:00' },
  Tuesday: { open: false, start: '09:00', end: '17:00' },
  Wednesday: { open: false, start: '09:00', end: '17:00' },
  Thursday: { open: false, start: '09:00', end: '17:00' },
  Friday: { open: false, start: '09:00', end: '17:00' },
  Saturday: { open: false, start: '09:00', end: '17:00' },
  Sunday: { open: false, start: '09:00', end: '17:00' },
};
// Get store by ID
const getStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }
    const storeDoc = await admin
      .firestore()
      .collection(Store.collection)
      .doc(storeId)
      .get();
    if (!storeDoc.exists) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const storeData = {
      storeId: storeDoc.id,
      ...storeDoc.data(),
      theme: storeDoc.data().theme || 'theme-default',
      hours: storeDoc.data().hours || defaultHours,
    };
    res.json(storeData);
  } catch (error) {
    console.error('Error fetching store:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch store', details: error.message });
  }
};

// Get store by owner
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
    const storeDoc = snapshot.docs[0];
    const storeData = {
      storeId: storeDoc.id,
      ...storeDoc.data(),
      theme: storeDoc.data().theme || 'theme-default',
      hours: storeDoc.data().hours || defaultHours,
    };
    res.json(storeData);
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
      theme: doc.data().theme || 'theme-default',
      hours: doc.data().hours || defaultHours,
    }));
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch stores', details: error.message });
  }
};

// Create or update store (from previous context, included for completeness)
// Create or update store
const createOrUpdateStore = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      storeName,
      description,
      address,
      location,
      profileImageURL,
      theme,
      hours,
    } = req.body;
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

    let parsedHours;
    try {
      parsedHours =
        typeof hours === 'string' ? JSON.parse(hours) : hours || defaultHours;
      const days = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      for (const day of days) {
        if (!parsedHours[day] || typeof parsedHours[day].open !== 'boolean') {
          parsedHours[day] = defaultHours[day]; // Fallback to default for missing or invalid day
        }
        if (parsedHours[day].open) {
          if (
            !parsedHours[day].start ||
            !parsedHours[day].end ||
            !timeRegex.test(parsedHours[day].start) ||
            !timeRegex.test(parsedHours[day].end)
          ) {
            return res
              .status(400)
              .json({ error: `Invalid time format for ${day}` });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing hours:', error);
      parsedHours = defaultHours; // Use default hours if parsing fails
    }

    // Validate theme
    const validThemes = [
      'theme-default',
      'theme-fashion',
      'theme-vintage',
      'theme-streetwear',
    ];
    const validatedTheme = validThemes.includes(theme)
      ? theme
      : 'theme-default';

    let imageURL = profileImageURL || '';
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        imageURL = result.secure_url;
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
      theme: validatedTheme,
      hours: parsedHours, // Always include hours
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
    const result = await uploadToCloudinary(req.file);
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
    console.log('Received updateItem request body:', req.body);

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
        if (!file.mimetype.startsWith('image/')) {
          return res
            .status(400)
            .json({ error: 'Only image files are allowed' });
        }
        const result = await uploadToCloudinary(file);
        if (!result.secure_url) {
          throw new Error('Cloudinary upload did not return a valid URL');
        }
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
    if (!itemId) return res.status(400).json({ error: 'Item ID is required' });
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

// Update the existing updateReservation function to handle the 'Sold' status
const updateReservationStatus = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reservationId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Cancelled', 'Sold'].includes(status)) {
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

    const reservationData = reservationDoc.data();
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // If marking as sold, add soldAt timestamp and update item status
    if (status === 'Sold') {
      updateData.soldAt = admin.firestore.FieldValue.serverTimestamp();

      // Find the item document by itemId field (not document ID)
      try {
        console.log(
          `Attempting to find and update item with itemId: ${reservationData.itemId}`
        );

        const itemQuery = admin
          .firestore()
          .collection('items')
          .where('itemId', '==', reservationData.itemId);

        const itemSnapshot = await itemQuery.get();

        if (itemSnapshot.empty) {
          console.error(`Item with itemId ${reservationData.itemId} not found`);
          return res.status(404).json({ error: 'Item not found' });
        }

        const itemDocId = itemSnapshot.docs[0].id;
        console.log(`Found item document ID: ${itemDocId}`);

        await admin.firestore().collection('items').doc(itemDocId).update({
          status: 'Sold',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `Successfully updated item ${reservationData.itemId} status to Sold`
        );
      } catch (itemError) {
        console.error('Error updating item status to Sold:', itemError);
        return res.status(500).json({
          error: 'Failed to update item status',
          details: itemError.message,
        });
      }
    }

    // If cancelling reservation, set item back to Available
    if (status === 'Cancelled') {
      try {
        console.log(
          `Attempting to find and update item with itemId: ${reservationData.itemId}`
        );

        const itemQuery = admin
          .firestore()
          .collection('items')
          .where('itemId', '==', reservationData.itemId);

        const itemSnapshot = await itemQuery.get();

        if (!itemSnapshot.empty) {
          const itemDocId = itemSnapshot.docs[0].id;
          await admin.firestore().collection('items').doc(itemDocId).update({
            status: 'Available',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(
            `Successfully updated item ${reservationData.itemId} status to Available`
          );
        }
      } catch (itemError) {
        console.error('Error updating item status to Available:', itemError);
        // Continue with reservation update even if item update fails
      }
    }

    // Update reservation status
    await reservationRef.update(updateData);
    console.log(`Reservation ${reservationId} status updated to ${status}`);

    res.json({ reservationId, status, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res
      .status(500)
      .json({ error: 'Failed to update reservation', details: error.message });
  }
};

// Create review and confirm reservation
const createReview = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reservationId, itemId, storeId, rating, review } = req.body;

    if (!reservationId || !itemId || !storeId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify reservation exists and belongs to user
    const reservationRef = admin
      .firestore()
      .collection('Reservations')
      .doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservationData = reservationDoc.data();
    if (reservationData.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to review this reservation' });
    }

    if (reservationData.status !== 'Sold') {
      return res.status(400).json({ error: 'Can only review sold items' });
    }

    // Create review document
    const reviewData = {
      reservationId,
      itemId,
      storeId,
      userId,
      rating: parseInt(rating),
      review: review || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // FIXED: Use 'Reviews' (uppercase) to match your DB
    await admin.firestore().collection('Reviews').add(reviewData);

    res.json({ message: 'Review created successfully', review: reviewData });
  } catch (error) {
    console.error('Error creating review:', error);
    res
      .status(500)
      .json({ error: 'Failed to create review', details: error.message });
  }
};

// Confirm reservation (customer confirms receipt)
const confirmReservation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reservationId } = req.params;

    // Verify reservation exists and belongs to user
    const reservationRef = admin
      .firestore()
      .collection('Reservations')
      .doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservationData = reservationDoc.data();
    if (reservationData.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to confirm this reservation' });
    }

    if (reservationData.status !== 'Sold') {
      return res.status(400).json({ error: 'Can only confirm sold items' });
    }

    // Update reservation status to Completed
    await reservationRef.update({
      status: 'Completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update store's average rating
    await updateStoreRating(reservationData.storeId);

    res.json({ message: 'Reservation confirmed successfully' });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res
      .status(500)
      .json({ error: 'Failed to confirm reservation', details: error.message });
  }
};

// Helper function to update store's average rating
const updateStoreRating = async (storeId) => {
  try {
    // FIXED: Use 'Reviews' (uppercase) to match your DB
    const reviewsSnapshot = await admin
      .firestore()
      .collection('Reviews')
      .where('storeId', '==', storeId)
      .get();

    if (reviewsSnapshot.empty) return;

    const reviews = reviewsSnapshot.docs.map((doc) => doc.data());
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update store document
    await admin
      .firestore()
      .collection('stores')
      .doc(storeId)
      .update({
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error updating store rating:', error);
  }
};

const getStoreReviews = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId)
      return res.status(400).json({ error: 'Store ID is required' });

    // Get all reviews for this store (without orderBy to avoid index requirement)
    const reviewsSnapshot = await admin
      .firestore()
      .collection('Reviews')
      .where('storeId', '==', storeId)
      .get(); // Removed .orderBy('createdAt', 'desc')

    if (reviewsSnapshot.empty) {
      return res.json([]);
    }

    const reviews = [];
    for (const doc of reviewsSnapshot.docs) {
      const reviewData = doc.data();

      // Get user information for each review
      try {
        const userRecord = await admin.auth().getUser(reviewData.userId);
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(reviewData.userId)
          .get();

        const userData = userDoc.exists ? userDoc.data() : {};

        // Get item information
        const itemDoc = await admin
          .firestore()
          .collection('items')
          .doc(reviewData.itemId)
          .get();

        const itemData = itemDoc.exists
          ? itemDoc.data()
          : { name: 'Unknown Item' };

        reviews.push({
          reviewId: doc.id,
          ...reviewData,
          userName:
            userRecord.displayName || userData.displayName || 'Anonymous',
          itemName: itemData.name,
          createdAt: reviewData.createdAt,
        });
      } catch (userError) {
        // If we can't get user info, still include the review
        console.error(userError);
        reviews.push({
          reviewId: doc.id,
          ...reviewData,
          userName: 'Anonymous',
          itemName: 'Unknown Item',
        });
      }
    }

    // Sort reviews manually by creation date (most recent first)
    reviews.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching store reviews:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch store reviews', details: error.message });
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
  confirmReservation,
  updateReservationStatus,
  getStoreReviews,
  createReview,
  updateStoreRating,
};
