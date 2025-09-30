// __tests__/index.test.js
const request = require('supertest');
const express = require('express');
const admin = require('../config/firebase');

// Mock Express app to isolate index.js routes
const app = express();
app.use(express.json());
app.use(require('cors')());

// Define routes from index.js
app.get('/', (req, res) => {
  res.send('Backend is live!');
});

app.get('/api/users', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users').get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

describe('Server Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it('should return "Backend is live!" on GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Backend is live!');
  });

  it('should fetch users from Firestore on GET /api/users', async () => {
    // Mock Firestore data
    const mockUsers = [
      { id: 'user1', name: 'Alice' },
      { id: 'user2', name: 'Bob' },
    ];
    // Mock the entire firestore() chain
    const mockCollection = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        docs: mockUsers.map((user) => ({
          id: user.id,
          data: () => user,
        })),
      }),
    });
    admin.firestore = jest.fn().mockReturnValue({
      collection: mockCollection,
    });

    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(mockCollection).toHaveBeenCalledWith('users');
  });

  it('should return 500 if Firestore query fails', async () => {
    // Mock Firestore error
    const mockCollection = jest.fn().mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('Firestore error')),
    });
    admin.firestore = jest.fn().mockReturnValue({
      collection: mockCollection,
    });

    const response = await request(app).get('/api/users');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Firestore error' });
  });
});
