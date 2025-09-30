// __tests__/authMiddleware.test.js
const authMiddleware = require('../middleware/authMiddleware');
const admin = require('../config/firebase');

jest.mock('../config/firebase', () => ({
  auth: jest.fn(),
}));
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});
describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset mock for each test
    admin.auth.mockReturnValue({
      verifyIdToken: jest.fn(),
    });
  });

  test('should call next() if token is valid', async () => {
    req.headers.authorization = 'Bearer validtoken';

    // mock successful token verification
    admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123' });

    await authMiddleware(req, res, next);

    expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('validtoken');
    expect(req.user).toEqual({ uid: 'user123' });
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken';

    // mock rejection
    admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });
  test('should return 401 if no Authorization header is provided', async () => {
    req.headers = {}; // no Authorization header

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: No token provided',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
