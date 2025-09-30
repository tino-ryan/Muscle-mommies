// __tests__/authController.test.js
const authController = require('../controllers/authController');
const admin = require('../config/firebase');
const User = require('../models/User');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

jest.mock('../config/firebase', () => ({
  auth: jest.fn(),
}));

// Store the original implementation
const createMockUser = function (uid, name, email, role) {
  this.uid = uid;
  this.name = name;
  this.email = email;
  this.role = role;
  this.save = jest.fn().mockResolvedValue(true);
};

jest.mock('../models/User', () => {
  return jest.fn().mockImplementation(createMockUser);
});

User.getByUid = jest.fn();

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();

    // Reset User mock to default implementation
    User.mockImplementation(createMockUser);
  });

  describe('signup', () => {
    it('should create user with valid role', async () => {
      req.body = {
        name: 'John',
        email: 'john@example.com',
        password: 'pass123',
        role: 'customer',
      };
      const mockCreateUser = jest.fn().mockResolvedValue({ uid: 'uid123' });
      admin.auth.mockReturnValue({ createUser: mockCreateUser });

      await authController.signup(req, res);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'pass123',
        displayName: 'John',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          uid: 'uid123',
          email: 'john@example.com',
          message: 'User created successfully',
        })
      );
    });

    it('should return 400 for invalid role', async () => {
      req.body = {
        name: 'John',
        email: 'john@example.com',
        password: 'pass123',
        role: 'invalid',
      };

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid role' })
      );
    });

    it('should handle Firebase createUser error', async () => {
      req.body = {
        name: 'John',
        email: 'john@example.com',
        password: 'pass123',
        role: 'customer',
      };
      admin.auth.mockReturnValue({
        createUser: jest.fn().mockRejectedValue(new Error('Firebase error')),
      });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Firebase error' })
      );
    });

    it('should handle error when saving user fails', async () => {
      req.body = {
        name: 'John',
        email: 'john@example.com',
        password: 'pass123',
        role: 'customer',
      };
      const mockCreateUser = jest.fn().mockResolvedValue({ uid: 'uid123' });
      admin.auth.mockReturnValue({ createUser: mockCreateUser });
      User.mockImplementation(function (uid, name, email, role) {
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.role = role;
        this.save = jest.fn().mockRejectedValue(new Error('Save failed'));
      });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Save failed' })
      );
    });

    it('should handle missing required fields', async () => {
      req.body = { name: 'John', role: 'customer' }; // Missing email, password
      admin.auth.mockReturnValue({
        createUser: jest
          .fn()
          .mockRejectedValue(new Error('Missing required fields')),
      });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.any(String) })
      );
    });
  });

  describe('googleSignup', () => {
    it('should create new user if not exists', async () => {
      req.body = { idToken: 'token123', role: 'storeOwner' };
      admin.auth.mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'uid123',
          email: 'a@b.com',
          name: 'Alice',
        }),
      });
      User.getByUid.mockResolvedValue(null);

      await authController.googleSignup(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          uid: 'uid123',
          email: 'a@b.com',
          message: 'Google signup successful',
        })
      );
      expect(User).toHaveBeenCalledWith(
        'uid123',
        'Alice',
        'a@b.com',
        'storeOwner'
      );
      // Check that save was called on the instance
      const userInstance = User.mock.instances[0];
      expect(userInstance.save).toHaveBeenCalled();
    });

    it('should create new user with missing name', async () => {
      req.body = { idToken: 'token123', role: 'storeOwner' };
      admin.auth.mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'uid123',
          email: 'a@b.com',
          // name is undefined
        }),
      });
      User.getByUid.mockResolvedValue(null);

      await authController.googleSignup(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          uid: 'uid123',
          email: 'a@b.com',
          message: 'Google signup successful',
        })
      );
      expect(User).toHaveBeenCalledWith('uid123', '', 'a@b.com', 'storeOwner');
      const userInstance = User.mock.instances[0];
      expect(userInstance.save).toHaveBeenCalled();
    });

    it('should create new user with missing email', async () => {
      req.body = { idToken: 'token123', role: 'storeOwner' };
      admin.auth.mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'uid123',
          name: 'Alice',
          // email is undefined
        }),
      });
      User.getByUid.mockResolvedValue(null);

      await authController.googleSignup(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          uid: 'uid123',
          email: undefined, // Controller returns undefined when email is missing
          message: 'Google signup successful',
        })
      );
      expect(User).toHaveBeenCalledWith('uid123', 'Alice', '', 'storeOwner');
      const userInstance = User.mock.instances[0];
      expect(userInstance.save).toHaveBeenCalled();
    });

    it('should not create user if already exists', async () => {
      req.body = { idToken: 'token123', role: 'customer' };
      admin.auth.mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'uid123',
          email: 'a@b.com',
          name: 'Alice',
        }),
      });
      User.getByUid.mockResolvedValue({ uid: 'uid123' });

      await authController.googleSignup(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          uid: 'uid123',
          email: 'a@b.com',
          message: 'Google signup successful',
        })
      );
      expect(User).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid role', async () => {
      req.body = { idToken: 'token123', role: 'invalid' };

      await authController.googleSignup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid role' })
      );
    });

    it('should return 400 on invalid token', async () => {
      req.body = { idToken: 'token123', role: 'customer' };
      admin.auth.mockReturnValue({
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
      });

      await authController.googleSignup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid token' })
      );
    });

    it('should handle DB failure when checking user', async () => {
      req.body = { idToken: 'token123', role: 'customer' };
      admin.auth.mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'uid123',
          email: 'a@b.com',
          name: 'Alice',
        }),
      });
      User.getByUid.mockRejectedValue(new Error('DB failure'));

      await authController.googleSignup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'DB failure' })
      );
    });

    it('should handle missing idToken', async () => {
      req.body = { role: 'customer' }; // Missing idToken
      admin.auth.mockReturnValue({
        verifyIdToken: jest
          .fn()
          .mockRejectedValue(new Error('Missing idToken')),
      });

      await authController.googleSignup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.any(String) })
      );
    });
  });

  describe('getRole', () => {
    it('should return role if user exists', async () => {
      req.body = { uid: 'uid123' };
      User.getByUid.mockResolvedValue({ role: 'customer' });

      await authController.getRole(req, res);

      expect(res.json).toHaveBeenCalledWith({ role: 'customer' });
      expect(User.getByUid).toHaveBeenCalledWith('uid123');
    });

    it('should return 404 if user not found', async () => {
      req.body = { uid: 'uid123' };
      User.getByUid.mockResolvedValue(null);

      await authController.getRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 500 on server error', async () => {
      req.body = { uid: 'uid123' };
      User.getByUid.mockRejectedValue(new Error('DB error'));

      await authController.getRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });

    it('should handle missing uid', async () => {
      req.body = {}; // Missing uid

      await authController.getRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('getRole1', () => {
    it('should return role using req.user.uid', async () => {
      req.user = { uid: 'uid123' };
      User.getByUid.mockResolvedValue({ role: 'storeOwner' });

      await authController.getRole1(req, res);

      expect(res.json).toHaveBeenCalledWith({ role: 'storeOwner' });
      expect(User.getByUid).toHaveBeenCalledWith('uid123');
    });

    it('should return 404 if user not found', async () => {
      req.user = { uid: 'uid123' };
      User.getByUid.mockResolvedValue(null);

      await authController.getRole1(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 500 on server error', async () => {
      req.user = { uid: 'uid123' };
      User.getByUid.mockRejectedValue(new Error('DB error'));

      await authController.getRole1(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
      expect(console.error).toHaveBeenCalledWith(
        'Get role error:',
        expect.any(Error)
      );
    });

    it('should handle missing req.user', async () => {
      req.user = undefined;

      await authController.getRole1(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
      expect(console.error).toHaveBeenCalledWith(
        'Get role error:',
        expect.any(Error)
      );
    });

    it('should handle missing req.user.uid', async () => {
      req.user = {};

      await authController.getRole1(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
      expect(console.error).toHaveBeenCalledWith(
        'Get role error:',
        expect.any(Error)
      );
    });
  });
});
