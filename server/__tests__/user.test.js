// __tests__/user.test.js
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
  update: jest.fn(),
}));

jest.mock('../config/firebase', () => {
  const mockCollection = jest.fn((name) => {
    if (name === 'users') {
      return {
        doc: mockDoc,
      };
    }
    return {
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn().mockResolvedValue({ exists: false }),
      })),
    };
  });

  return {
    firestore: jest.fn(() => ({
      collection: mockCollection,
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date()),
      },
    })),
  };
});

const User = require('../models/User');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a User instance with correct properties', () => {
    const user = new User(
      'uid123',
      'Test User',
      'test@example.com',
      'customer'
    );
    expect(user.uid).toBe('uid123');
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('customer');
  });

  test('should convert to JSON correctly', () => {
    const user = new User(
      'uid123',
      'Test User',
      'test@example.com',
      'customer'
    );
    const json = user.toJSON();
    expect(json).toEqual({
      uid: 'uid123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      createdAt: expect.any(Date),
    });
  });

  test('should create User from auth user', () => {
    const authUser = {
      uid: 'uid123',
      displayName: 'Test User',
      email: 'test@example.com',
    };
    const user = User.fromAuthUser(authUser, 'admin');
    expect(user).toBeInstanceOf(User);
    expect(user.uid).toBe('uid123');
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('admin');
  });

  test('should handle empty displayName in fromAuthUser', () => {
    const authUser = {
      uid: 'uid123',
      email: 'test@example.com',
    };
    const user = User.fromAuthUser(authUser);
    expect(user).toBeInstanceOf(User);
    expect(user.uid).toBe('uid123');
    expect(user.name).toBe('');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('customer');
  });

  test('save() should call Firestore with correct data', async () => {
    const user = new User('uid123', 'Test User', 'test@example.com', 'admin');
    await user.save();
    expect(mockDoc).toHaveBeenCalledWith('uid123');
    expect(mockSet).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      createdAt: expect.any(Date),
    });
  });

  test('getByUid() should return user data if document exists', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        name: 'Fetched User',
        email: 'fetched@example.com',
        role: 'customer',
      }),
    });

    const data = await User.getByUid('uid123');
    expect(mockDoc).toHaveBeenCalledWith('uid123');
    expect(data).toEqual({
      name: 'Fetched User',
      email: 'fetched@example.com',
      role: 'customer',
    });
  });

  test('getByUid() should return null if document does not exist', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    const data = await User.getByUid('uid404');
    expect(data).toBeNull();
  });
});
