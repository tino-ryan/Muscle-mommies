const itemController = require('../controllers/itemController');

// Mock firebase-admin to provide a valid firestore object
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      get: jest.fn(),
      where: jest.fn(() => ({ get: jest.fn() })),
      add: jest.fn(),
      doc: jest.fn(() => ({ get: jest.fn() })),
    })),
  })),
}));

// Mock externalController to prevent getThriftStores error
jest.mock('../controllers/externalController', () => ({
  getThriftStores: jest.fn(),
  validateApiKey: jest.fn(),
  uploadPhoto: jest.fn(),
  getPhotos: jest.fn(),
}));

// Mock authController to prevent authRoutes.test.js from loading itemController dependencies
jest.mock('../controllers/authController', () => ({
  signup: jest.fn(),
  googleSignup: jest.fn(),
  getRole: jest.fn(),
  getRole1: jest.fn(),
}));

describe('Item Controller', () => {
  test('getItems is defined and callable', () => {
    expect(itemController.getItems).toBeDefined();
    expect(typeof itemController.getItems).toBe('function');
  });

  test('getItemsByStore is defined and callable', () => {
    expect(itemController.getItemsByStore).toBeDefined();
    expect(typeof itemController.getItemsByStore).toBe('function');
  });

  test('searchItems is defined and callable', () => {
    expect(itemController.searchItems).toBeDefined();
    expect(typeof itemController.searchItems).toBe('function');
  });

  test('createItem is defined and callable', () => {
    expect(itemController.createItem).toBeDefined();
    expect(typeof itemController.createItem).toBe('function');
  });
});
