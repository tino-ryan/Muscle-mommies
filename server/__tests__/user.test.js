const User = require('../models/User');

// Mock ../config/firebase to prevent loading dependencies
jest.mock('../config/firebase', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));

describe('User Model', () => {
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
});
