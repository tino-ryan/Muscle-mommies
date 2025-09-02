const {
  Store,
  Item,
  ItemImage,
  Chat,
  Message,
  Reservation,
} = require('../models/store');

describe('Store Model', () => {
  test('should have correct Store structure', () => {
    expect(Store).toHaveProperty('collection', 'stores');
    expect(Store.fields).toEqual({
      storeId: String,
      ownerId: String,
      storeName: String,
      description: String,
      address: String,
      location: { lat: String, lng: String },
      profileImageURL: String,
      createdAt: Object,
      updatedAt: Object,
    });
    expect(Store.subcollections).toHaveProperty('contactInfos');
    expect(Store.subcollections.contactInfos).toEqual({
      collection: 'contactInfos',
      fields: {
        id: String,
        type: String,
        value: String,
      },
    });
  });

  test('should have correct Item structure', () => {
    expect(Item).toHaveProperty('collection', 'items');
    expect(Item.fields).toEqual({
      itemId: String,
      storeId: String,
      name: String,
      description: String,
      category: String,
      department: String,
      style: String,
      size: String,
      price: Number,
      quantity: Number,
      status: String,
      createdAt: Object,
      updatedAt: Object,
      images: Array,
    });
  });

  test('should have correct ItemImage structure', () => {
    expect(ItemImage).toHaveProperty('collection', 'itemImages');
    expect(ItemImage.fields).toEqual({
      imageId: String,
      itemId: String,
      imageURL: String,
      isPrimary: Boolean,
    });
  });

  test('should have correct Chat structure', () => {
    expect(Chat).toHaveProperty('collection', 'chats');
    expect(Chat.fields).toEqual({
      chatId: String,
      participants: Array,
      lastMessage: String,
      lastTimestamp: Object,
      itemId: String,
      storeId: String,
    });
  });

  test('should have correct Message structure', () => {
    expect(Message).toHaveProperty('collection', 'messages');
    expect(Message.fields).toEqual({
      messageId: String,
      chatId: String,
      senderId: String,
      receiverId: String,
      message: String,
      timestamp: Object,
      read: Boolean,
      itemId: String,
      storeId: String,
    });
  });

  test('should have correct Reservation structure', () => {
    expect(Reservation).toHaveProperty('collection', 'Reservations');
    expect(Reservation.fields).toEqual({
      reservationId: String,
      itemId: String,
      userId: String,
      storeId: String,
      status: String,
      reservedAt: Object,
    });
  });
});
