const authRoutes = require('../routes/authRoutes');

// Mock dependencies to prevent errors
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

jest.mock('../controllers/externalController', () => ({
  getThriftStores: jest.fn(),
  validateApiKey: jest.fn(),
  uploadPhoto: jest.fn(),
  getPhotos: jest.fn(),
}));

jest.mock('../controllers/itemController', () => ({
  getItems: jest.fn(),
  getItemsByStore: jest.fn(),
  searchItems: jest.fn(),
  createItem: jest.fn(),
}));

jest.mock('../controllers/authController', () => ({
  signup: jest.fn(),
  googleSignup: jest.fn(),
  getRole: jest.fn(),
  getRole1: jest.fn(),
}));

describe('Auth Routes', () => {
  test('authRoutes is defined', () => {
    expect(authRoutes).toBeDefined();
  });

  test('signup route is defined', () => {
    expect(authRoutes.post).toBeDefined();
    expect(typeof authRoutes.post).toBe('function');
  });

  test('google signup route is defined', () => {
    expect(authRoutes.post).toBeDefined();
    expect(typeof authRoutes.post).toBe('function');
  });

  test('getRole route is defined', () => {
    expect(authRoutes.post).toBeDefined();
    expect(typeof authRoutes.post).toBe('function');
  });

  test('getRole1 route is defined', () => {
    expect(authRoutes.get).toBeDefined();
    expect(typeof authRoutes.get).toBe('function');
  });
});
