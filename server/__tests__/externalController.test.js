// __tests__/externalController.test.js
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mock Firebase
jest.mock('../config/firebase');
const admin = require('../config/firebase');
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(), // ✅ add this
    uploader: {
      upload: jest.fn(),
    },
  },
}));

const cloudinary = require('cloudinary').v2;

// Import controllers
const {
  getThriftStores,
  getPhotos,
  uploadPhoto,
} = require('../controllers/externalController');

// Setup Express app
const app = express();
app.use(express.json());
app.get('/thrift-stores', getThriftStores);
app.get('/photos', getPhotos);
app.post(
  '/upload-photo',
  (req, res, next) => {
    // Mock multer middleware
    req.file = req.file || req.body.mockFile;
    next();
  },
  uploadPhoto
);

describe('GET /thrift-stores', () => {
  it('should return thrift stores from Firestore', async () => {
    const mockDocs = [
      { id: 'store1', data: () => ({ name: 'Thrift A', location: 'City A' }) },
      { id: 'store2', data: () => ({ name: 'Thrift B', location: 'City B' }) },
    ];
    admin.firestore.mockReturnValue({
      collection: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      })),
    });

    const res = await request(app).get('/thrift-stores');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { storeId: 'store1', name: 'Thrift A', location: 'City A' },
      { storeId: 'store2', name: 'Thrift B', location: 'City B' },
    ]);
  });

  it('should return 500 if Firestore throws', async () => {
    admin.firestore.mockReturnValue({
      collection: () => {
        throw new Error('Firestore fail');
      },
    });

    const res = await request(app).get('/thrift-stores');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to fetch thrift stores');
    expect(res.body.details).toBe('Firestore fail');
  });
});

describe('GET /photos', () => {
  it('should return photos from Firestore', async () => {
    const mockDocs = [
      { id: 'img1', data: () => ({ url: 'url1' }) },
      { id: 'img2', data: () => ({ url: 'url2' }) },
    ];
    admin.firestore.mockReturnValue({
      collection: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      })),
    });

    const res = await request(app).get('/photos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { imageId: 'img1', url: 'url1' },
      { imageId: 'img2', url: 'url2' },
    ]);
  });

  it('should return 500 if Firestore throws', async () => {
    admin.firestore.mockReturnValue({
      collection: () => {
        throw new Error('Firestore fail');
      },
    });

    const res = await request(app).get('/photos');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to fetch images');
    expect(res.body.details).toBe('Firestore fail');
  });
});

describe('POST /upload-photo', () => {
  const tempFilePath = path.join(__dirname, 'mock-image.jpg');

  beforeAll(() => {
    fs.writeFileSync(tempFilePath, 'fake image content');
  });

  afterAll(() => {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  });

  it('should upload image and save metadata to Firestore', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      public_id: 'muscle-mommies/external/mock-image-id',
      secure_url: 'https://mocked.cloudinary.com/mock-image.jpg',
    });

    const mockSet = jest.fn().mockResolvedValue();
    const mockDoc = jest.fn(() => ({ set: mockSet }));
    const mockCollection = jest.fn(() => ({ doc: mockDoc }));

    admin.firestore = jest.fn(() => ({
      collection: mockCollection,
    }));
    admin.firestore.FieldValue = { serverTimestamp: () => 'mocked-timestamp' };

    const res = await request(app)
      .post('/upload-photo')
      .send({
        mockFile: { path: tempFilePath, originalname: 'mock-image.jpg' },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('imageId', 'mock-image-id');
    expect(res.body).toHaveProperty(
      'imageURL',
      'https://mocked.cloudinary.com/mock-image.jpg'
    );
    expect(mockSet).toHaveBeenCalledWith({
      imageId: 'mock-image-id',
      imageURL: 'https://mocked.cloudinary.com/mock-image.jpg',
      folder: 'muscle-mommies/external',
      createdAt: 'mocked-timestamp',
    });
  });

  it('should return 400 if no file is uploaded', async () => {
    const res = await request(app).post('/upload-photo');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No image provided');
  });

  it('should return 500 if Firestore fails', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      public_id: 'muscle-mommies/external/mock-image-id',
      secure_url: 'https://mocked.cloudinary.com/mock-image.jpg',
    });

    admin.firestore.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          set: () => {
            throw new Error('Firestore fail');
          },
        })),
      })),
      FieldValue: { serverTimestamp: () => 'mocked-timestamp' },
    });

    const res = await request(app)
      .post('/upload-photo')
      .send({
        mockFile: { path: tempFilePath, originalname: 'mock-image.jpg' },
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to upload image');
    expect(res.body.details).toBe('Firestore fail');
  });

  it('should return 500 if Cloudinary fails', async () => {
    cloudinary.uploader.upload.mockRejectedValue(new Error('Cloudinary fail'));

    const res = await request(app)
      .post('/upload-photo')
      .send({
        mockFile: { path: tempFilePath, originalname: 'mock-image.jpg' },
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Failed to upload image');
    expect(res.body.details).toBe('Cloudinary fail');
  });

  it('should hit finally block and unlink temp file', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      public_id: 'muscle-mommies/external/mock-image-id',
      secure_url: 'https://mocked.cloudinary.com/mock-image.jpg',
    });

    const mockSet = jest.fn().mockResolvedValue();
    const mockDoc = jest.fn(() => ({ set: mockSet }));
    const mockCollection = jest.fn(() => ({ doc: mockDoc }));

    admin.firestore.mockReturnValue({
      collection: mockCollection,
      FieldValue: { serverTimestamp: () => 'mocked-timestamp' },
    });

    // Spy on fs to hit finally
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    const res = await request(app)
      .post('/upload-photo')
      .send({
        mockFile: { path: tempFilePath, originalname: 'mock-image.jpg' },
      });

    expect(unlinkSpy).toHaveBeenCalled(); // ✅ finally block covered
    expect(res.statusCode).toBe(200);
  });
});
