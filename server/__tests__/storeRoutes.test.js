// __tests__/storeRoutes.test.js
const request = require('supertest');
const express = require('express');
const router = require('../routes/storeRoutes');

// -------------------------
// Mock all controllers
// -------------------------
jest.mock('../controllers/storeController', () => ({
  getStore: jest.fn((req, res) => res.json({ store: 'mockStore' })),
  getStores: jest.fn((req, res) => res.json({ stores: [] })),
  createOrUpdateStore: jest.fn((req, res) => res.json({ message: 'created' })),
  uploadImage: jest.fn((req, res) => res.json({ message: 'uploaded' })),
  getContactInfos: jest.fn((req, res) => res.json({ contacts: [] })),
  addContactInfo: jest.fn((req, res) => res.json({ message: 'added' })),
  deleteContactInfo: jest.fn((req, res) => res.json({ message: 'deleted' })),
  getStoreById: jest.fn((req, res) => res.json({ store: 'mockStoreId' })),
  updateItem: jest.fn((req, res) => res.json({ message: 'item updated' })),
  getChats: jest.fn((req, res) => res.json({ chats: [] })),
  getMessagesForChat: jest.fn((req, res) => res.json({ messages: [] })),
  sendMessage: jest.fn((req, res) => res.json({ message: 'sent' })),
  markAsRead: jest.fn((req, res) => res.json({ message: 'read' })),
  createReservation: jest.fn((req, res) => res.json({ message: 'reserved' })),
  createChat: jest.fn((req, res) => res.json({ chat: 'created' })),
  getReservations: jest.fn((req, res) => res.json({ reservations: [] })),
  getUserById: jest.fn((req, res) => res.json({ user: 'mockUser' })),
  customerReserve: jest.fn((req, res) => res.json({ reserved: true })),
  getItemById: jest.fn((req, res) => res.json({ item: 'mockItem' })),
  updateReservationStatus: jest.fn((req, res) =>
    res.json({ status: 'updated' })
  ),
  createReview: jest.fn((req, res) => res.json({ review: 'created' })),
  confirmReservation: jest.fn((req, res) => res.json({ confirmed: true })),
  getStoreReviews: jest.fn((req, res) => res.json({ reviews: [] })),
}));

jest.mock('../controllers/itemController', () => ({
  getItems: jest.fn((req, res) => res.json({ items: [] })),
  getItemsByStore: jest.fn((req, res) => res.json({ items: [] })),
  searchItems: jest.fn((req, res) => res.json({ items: [] })),
  createItem: jest.fn((req, res) => res.json({ item: 'created' })),
  deleteItem: jest.fn((req, res) => res.json({ message: 'deleted' })),
}));

jest.mock('../controllers/outfitController', () => ({
  saveOutfit: jest.fn((req, res) => res.json({ outfit: 'saved' })),
  getUserOutfits: jest.fn((req, res) => res.json({ outfits: [] })),
}));

jest.mock('../middleware/authMiddleware', () =>
  jest.fn((req, res, next) => next())
);

// -------------------------
// Setup Express app
// -------------------------
describe('storeRoutes', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', router);
  });

  // -------------------------
  // Store routes
  // -------------------------
  test('GET /stores', async () => {
    const res = await request(app).get('/stores');
    expect(res.body).toEqual({ stores: [] });
  });

  test('GET /my-store', async () => {
    const res = await request(app).get('/my-store');
    expect(res.body).toEqual({ store: 'mockStore' });
  });

  test('GET /stores/:storeId', async () => {
    const res = await request(app).get('/stores/123');
    expect(res.body).toEqual({ store: 'mockStoreId' });
  });

  test('POST /stores with file', async () => {
    const res = await request(app)
      .post('/stores')
      .attach('profileImage', Buffer.from('fake'), 'store.png');
    expect(res.body).toEqual({ message: 'created' });
  });

  test('POST /stores/upload-image with file', async () => {
    const res = await request(app)
      .post('/stores/upload-image')
      .attach('profileImage', Buffer.from('fake'), 'store.png');
    expect(res.body).toEqual({ message: 'uploaded' });
  });

  // -------------------------
  // Item routes
  // -------------------------
  test('GET /items', async () => {
    const res = await request(app).get('/items');
    expect(res.body).toEqual({ items: [] });
  });

  test('GET /items/:id', async () => {
    const res = await request(app).get('/items/123');
    expect(res.body).toEqual({ item: 'mockItem' });
  });

  test('GET /stores/:storeId/items', async () => {
    const res = await request(app).get('/stores/123/items');
    expect(res.body).toEqual({ items: [] });
  });

  test('GET /items/search', async () => {
    const res = await request(app).get('/items/search');
    expect(res.body).toEqual({ items: [] });
  });

  test('POST /stores/items', async () => {
    const res = await request(app)
      .post('/stores/items')
      .attach('images', Buffer.from('fake'), 'item.png');
    expect(res.body).toEqual({ item: 'created' });
  });

  test('PUT /stores/items/:itemId', async () => {
    const res = await request(app)
      .put('/stores/items/123')
      .attach('images', Buffer.from('fake'), 'item.png');
    expect(res.body).toEqual({ message: 'item updated' });
  });

  test('PUT /stores/items/:itemId/images', async () => {
    const res = await request(app)
      .put('/stores/items/123/images')
      .attach('images', Buffer.from('fake'), 'item.png');
    expect(res.body).toEqual({ message: 'item updated' });
  });

  // -------------------------
  // Contact info
  // -------------------------
  test('GET /stores/contact-infos', async () => {
    const res = await request(app).get('/stores/contact-infos');
    expect(res.body).toEqual({ contacts: [] });
  });

  test('POST /stores/contact-infos', async () => {
    const res = await request(app).post('/stores/contact-infos');
    expect(res.body).toEqual({ message: 'added' });
  });

  test('DELETE /stores/contact-infos/:contactId', async () => {
    const res = await request(app).delete('/stores/contact-infos/123');
    expect(res.body).toEqual({ message: 'deleted' });
  });

  // -------------------------
  // Chat routes
  // -------------------------
  test('GET /stores/chats', async () => {
    const res = await request(app).get('/stores/chats');
    expect(res.body).toEqual({ chats: [] });
  });

  test('GET /stores/chats/:chatId/messages', async () => {
    const res = await request(app).get('/stores/chats/123/messages');
    expect(res.body).toEqual({ messages: [] });
  });

  test('POST /stores/messages', async () => {
    const res = await request(app).post('/stores/messages');
    expect(res.body).toEqual({ message: 'sent' });
  });

  test('PUT /stores/chats/:chatId/read', async () => {
    const res = await request(app).put('/stores/chats/123/read');
    expect(res.body).toEqual({ message: 'read' });
  });

  test('POST /stores/chats', async () => {
    const res = await request(app).post('/stores/chats');
    expect(res.body).toEqual({ chat: 'created' });
  });

  // -------------------------
  // Reservation routes
  // -------------------------
  test('GET /stores/reservations', async () => {
    const res = await request(app).get('/stores/reservations');
    expect(res.body).toEqual({ reservations: [] });
  });

  test('POST /stores/reservations', async () => {
    const res = await request(app).post('/stores/reservations');
    expect(res.body).toEqual({ message: 'reserved' });
  });

  test('PUT /stores/reservations/:reservationId', async () => {
    const res = await request(app).put('/stores/reservations/123');
    expect(res.body).toEqual({ status: 'updated' });
  });

  test('PUT /stores/reservations/:reservationId/confirm', async () => {
    const res = await request(app).put('/stores/reservations/123/confirm');
    expect(res.body).toEqual({ confirmed: true });
  });

  // -------------------------
  // Review routes
  // -------------------------
  test('POST /stores/reviews', async () => {
    const res = await request(app).post('/stores/reviews');
    expect(res.body).toEqual({ review: 'created' });
  });

  test('GET /stores/:storeId/reviews', async () => {
    const res = await request(app).get('/stores/123/reviews');
    expect(res.body).toEqual({ reviews: [] });
  });

  // -------------------------
  // Outfit routes
  // -------------------------
  test('POST /outfits', async () => {
    const res = await request(app).post('/outfits');
    expect(res.body).toEqual({ outfit: 'saved' });
  });

  test('GET /outfits', async () => {
    const res = await request(app).get('/outfits');
    expect(res.body).toEqual({ outfits: [] });
  });
});
