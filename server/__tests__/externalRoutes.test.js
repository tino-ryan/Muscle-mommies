const request = require('supertest');
const express = require('express');
const router = require('../routes/externalRoutes');

// mock controllers
jest.mock('../controllers/externalController', () => ({
  validateApiKey: jest.fn((req, res, next) => next()),
  getThriftStores: jest.fn((req, res) => res.json({ stores: [] })),
  uploadPhoto: jest.fn((req, res) => res.json({ message: 'Photo uploaded' })),
  getPhotos: jest.fn((req, res) => res.json({ photos: [] })),
}));

const {
  validateApiKey,
  getThriftStores,
  uploadPhoto,
  getPhotos,
} = require('../controllers/externalController');

describe('External Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/external', router);
  });

  test('GET /external/stores calls getThriftStores', async () => {
    const res = await request(app).get('/external/stores');
    expect(res.status).toBe(200);
    expect(getThriftStores).toHaveBeenCalled();
    expect(res.body).toEqual({ stores: [] });
  });

  test('POST /external/upload calls validateApiKey and uploadPhoto', async () => {
    const res = await request(app)
      .post('/external/upload')
      .field('dummy', 'value') // multipart/form-data
      .attach('image', Buffer.from('fakefile'), 'test.png');

    expect(res.status).toBe(200);
    expect(validateApiKey).toHaveBeenCalled();
    expect(uploadPhoto).toHaveBeenCalled();
    expect(res.body).toEqual({ message: 'Photo uploaded' });
  });

  test('GET /external/photos calls validateApiKey and getPhotos', async () => {
    const res = await request(app).get('/external/photos');
    expect(res.status).toBe(200);
    expect(validateApiKey).toHaveBeenCalled();
    expect(getPhotos).toHaveBeenCalled();
    expect(res.body).toEqual({ photos: [] });
  });
});
