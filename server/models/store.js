// Define the structure for the 'stores' collection
const Store = {
  collection: 'stores',
  fields: {
    storeId: String, // UUID for the store
    ownerId: String, // Firebase UID of the store owner
    storeName: String,
    description: String,
    address: String,
    location: {
      lat: String,
      lng: String,
    },
    profileImageURL: String,
    createdAt: Object, // Firestore Timestamp
    updatedAt: Object, // Firestore Timestamp
  },
  subcollections: {
    contactInfos: {
      collection: 'contactInfos',
      fields: {
        id: String, // UUID for the contact info
        type: String, // 'email', 'phone', 'instagram', 'facebook'
        value: String, // Contact value (e.g., 'user@example.com', '@handle')
      },
    },
  },
};

// Define the structure for the 'items' collection
const Item = {
  collection: 'items',
  fields: {
    itemId: String, // UUID for the item
    storeId: String, // Reference to storeId
    name: String,
    description: String,
    category: String,
    size: String,
    price: Number,
    quantity: Number,
    status: String, // 'Available', 'Out of Stock', etc.
    createdAt: Object, // Firestore Timestamp
    updatedAt: Object, // Firestore Timestamp
    images: Array, // Array of { imageId, imageURL, isPrimary }
  },
};

// Define the structure for the 'itemImages' collection
const ItemImage = {
  collection: 'itemImages',
  fields: {
    imageId: String, // UUID for the image
    itemId: String, // Reference to itemId
    imageURL: String,
    isPrimary: Boolean,
  },
};

module.exports = { Store, Item, ItemImage };
