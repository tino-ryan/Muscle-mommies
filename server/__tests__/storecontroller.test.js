// __tests__/storeController.test.js
const {
  customerReserve,
  getStore,
  getStores,
  createOrUpdateStore,
  uploadImage,
  getContactInfos,
  addContactInfo,
  deleteContactInfo,
  getStoreById,
  updateItem,
  getChats,
  getMessagesForChat,
  sendMessage,
  markAsRead,
  createReservation,
  createChat,
  getReservations,
  getUserById,
  getItemById,
  confirmReservation,
  updateReservationStatus,
  getStoreReviews,
  createReview,
  updateStoreRating,
} = require('../controllers/storeController');
const admin = require('../config/firebase');
const cloudinary = require('cloudinary').v2;

// Helper to mock Express res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Helper to mock Express req
const mockRequest = (overrides) => ({
  params: {},
  body: {},
  user: { uid: 'testUserId' },
  ...overrides,
});

describe('storeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoreById', () => {
    it('should return 400 if storeId is missing', async () => {
      const req = mockRequest({ params: {} });
      const res = mockResponse();

      await getStoreById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Store ID is required' });
    });

    it('should return 404 if store not found', async () => {
      const req = mockRequest({ params: { storeId: 'fakeId' } });
      const res = mockResponse();

      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      admin.firestore().collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({ get: mockGet }),
      });

      await getStoreById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Store not found' });
    });

    it('should return store data if found', async () => {
      const req = mockRequest({ params: { storeId: 'abc123' } });
      const res = mockResponse();

      const mockData = {
        storeName: 'Test Store',
        hours: {},
        theme: 'theme-default',
      };
      const mockStoreDoc = {
        exists: true,
        id: 'abc123',
        data: () => mockData,
      };
      const mockContactSnapshot = {
        docs: [
          {
            id: 'contact1',
            data: () => ({ type: 'email', value: 'test@test.com' }),
          },
        ],
      };

      admin.firestore().collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockStoreDoc),
          collection: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockContactSnapshot),
          }),
        }),
      });

      await getStoreById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        storeId: 'abc123',
        ...mockData,
        theme: 'theme-default',
        hours: expect.any(Object),
        contactInfos: [
          { id: 'contact1', type: 'email', value: 'test@test.com' },
        ],
      });
    });
  });

  describe('getStore', () => {
    it('should return 401 if userId missing', async () => {
      const req = mockRequest({ user: {} });
      const res = mockResponse();

      await getStore(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User ID not provided' });
    });

    it('should return 400 if no store found', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const mockGet = jest.fn().mockResolvedValue({ empty: true });
      admin.firestore().collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ get: mockGet }),
      });

      await getStore(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Store not found. Please create a store.',
      });
    });

    it('should return store data if found', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const mockDoc = {
        id: 'store123',
        data: () => ({ storeName: 'Owner Store' }),
      };
      const mockGet = jest
        .fn()
        .mockResolvedValue({ empty: false, docs: [mockDoc] });

      admin.firestore().collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ get: mockGet }),
      });

      await getStore(req, res);

      expect(res.json).toHaveBeenCalledWith({
        storeId: 'store123',
        storeName: 'Owner Store',
        theme: 'theme-default',
        hours: expect.any(Object),
      });
    });
  });

  describe('getStores', () => {
    it('should return a list of stores', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const mockDocs = [
        { id: 's1', data: () => ({ storeName: 'Store1' }) },
        { id: 's2', data: () => ({ storeName: 'Store2' }) },
      ];

      const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });
      admin.firestore().collection = jest
        .fn()
        .mockReturnValue({ get: mockGet });

      await getStores(req, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          storeId: 's1',
          storeName: 'Store1',
          theme: 'theme-default',
          hours: expect.any(Object),
        },
        {
          storeId: 's2',
          storeName: 'Store2',
          theme: 'theme-default',
          hours: expect.any(Object),
        },
      ]);
    });
  });
  describe('createOrUpdateStore', () => {
    it('should return 401 if userId missing', async () => {
      const req = mockRequest({ user: {} });
      const res = mockResponse();

      await createOrUpdateStore(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User ID not provided' });
    });

    it('should return 400 if required fields missing', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await createOrUpdateStore(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: storeName, address, location',
      });
    });

    it('should create a new store if none exists', async () => {
      const req = mockRequest({
        body: {
          storeName: 'My Store',
          address: '123 Street',
          location: { lat: 1, lng: 2 },
        },
      });
      const res = mockResponse();

      // Mock Firestore: store does not exist
      const mockAdd = jest.fn().mockResolvedValue({ id: 'newStoreId' });
      const mockGet = jest.fn().mockResolvedValue({ empty: true });
      admin.firestore().collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ get: mockGet }),
        add: mockAdd,
      });

      await createOrUpdateStore(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'newStoreId',
          storeName: 'My Store',
          address: '123 Street',
        })
      );
    });

    it('should handle Cloudinary upload if file provided', async () => {
      const mockFile = { buffer: Buffer.from('test') };
      const req = mockRequest({
        body: {
          storeName: 'StoreWithImage',
          address: '123',
          location: { lat: 1, lng: 2 },
        },
        file: mockFile,
      });
      const res = mockResponse();

      // Mock Firestore: store does not exist
      const mockAdd = jest.fn().mockResolvedValue({ id: 'storeWithImageId' });
      const mockGet = jest.fn().mockResolvedValue({ empty: true });
      admin.firestore().collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ get: mockGet }),
        add: mockAdd,
      });

      // Mock Cloudinary uploader
      cloudinary.uploader.upload_stream = jest.fn((options, callback) => {
        callback(null, {
          secure_url: 'https://mocked.cloudinary.com/test.jpg',
        });
        return { end: jest.fn() };
      });

      await createOrUpdateStore(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'storeWithImageId',
          profileImageURL: 'https://mocked.cloudinary.com/test.jpg',
        })
      );
    });
  });

  describe('uploadImage', () => {
    it('should return 400 if no file provided', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await uploadImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No image provided' });
    });

    it('should upload image to Cloudinary and return URL', async () => {
      const mockFile = { buffer: Buffer.from('test') };
      const req = mockRequest({ file: mockFile });
      const res = mockResponse();

      cloudinary.uploader.upload_stream = jest.fn((options, callback) => {
        callback(null, {
          secure_url: 'https://mocked.cloudinary.com/test-upload.jpg',
        });
        return { end: jest.fn() };
      });

      await uploadImage(req, res);

      expect(res.json).toHaveBeenCalledWith({
        imageURL: 'https://mocked.cloudinary.com/test-upload.jpg',
      });
    });
  });
  // ----------------------- Messaging tests -----------------------
  describe('storeController - messaging functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('sendMessage', () => {
      it('should return 400 if receiverId or message is missing', async () => {
        const req = mockRequest({ body: { receiverId: '', message: '' } });
        const res = mockResponse();

        await sendMessage(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Missing receiverId or message',
        });
      });

      it('should send message and update chat', async () => {
        const req = mockRequest({
          body: { receiverId: 'user2', message: 'Hello' },
        });
        const res = mockResponse();

        const mockAdd = jest.fn().mockResolvedValue({ id: 'msg123' });
        const mockSet = jest.fn().mockResolvedValue();

        admin.firestore().collection = jest.fn().mockImplementation((name) => {
          if (name === 'messages') return { add: mockAdd };
          if (name === 'chats')
            return { doc: jest.fn(() => ({ set: mockSet })) };
          return { add: mockAdd, doc: jest.fn(() => ({ set: mockSet })) };
        });

        await sendMessage(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            messageId: 'msg123',
            message: 'Hello',
            senderId: 'testUserId',
          })
        );
      });
    });

    describe('getChats', () => {
      it('should return sorted chats with other user info', async () => {
        const req = mockRequest();
        const res = mockResponse();

        const mockDocs = [
          {
            id: 'chat1',
            data: () => ({
              participants: ['testUserId', 'user2'],
              lastTimestamp: { seconds: 1 },
            }),
          },
          {
            id: 'chat2',
            data: () => ({
              participants: ['user3', 'testUserId'],
              lastTimestamp: { seconds: 2 },
            }),
          },
        ];

        const mockGet = jest
          .fn()
          .mockResolvedValue({ docs: mockDocs, size: mockDocs.length });

        admin.firestore().collection = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ get: mockGet }),
        });

        // Mock admin.auth().getUser
        admin.auth().getUser = jest
          .fn()
          .mockResolvedValue({ displayName: 'OtherUser' });

        await getChats(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              chatId: 'chat2',
              otherName: 'OtherUser',
              otherId: 'user3',
            }),
            expect.objectContaining({
              chatId: 'chat1',
              otherName: 'OtherUser',
              otherId: 'user2',
            }),
          ])
        );
      });
    });

    describe('getMessagesForChat', () => {
      it('should return messages for a given chatId', async () => {
        const req = mockRequest({ params: { chatId: 'chat123' } });
        const res = mockResponse();

        const mockDocs = [
          { id: 'msg1', data: () => ({ message: 'Hi', chatId: 'chat123' }) },
          { id: 'msg2', data: () => ({ message: 'Hello', chatId: 'chat123' }) },
        ];

        const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });

        admin.firestore().collection = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({ get: mockGet }),
          }),
        });

        await getMessagesForChat(req, res);

        expect(res.json).toHaveBeenCalledWith([
          { messageId: 'msg1', message: 'Hi', chatId: 'chat123' },
          { messageId: 'msg2', message: 'Hello', chatId: 'chat123' },
        ]);
      });
    });

    describe('markAsRead', () => {
      it('should mark unread messages as read', async () => {
        const req = mockRequest({ params: { chatId: 'chat123' } });
        const res = mockResponse();

        const mockDocRef = { id: 'msg1' };
        const mockDocs = [
          {
            ref: mockDocRef,
            data: () => ({
              read: false,
              receiverId: 'testUserId',
              chatId: 'chat123',
            }),
          },
        ];

        // Mock the query snapshot
        const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });

        // Mock Firestore chain
        const mockCollection = {
          where: jest.fn().mockReturnThis(),
          get: mockGet,
        };
        admin.firestore().collection = jest
          .fn()
          .mockReturnValue(mockCollection);

        // Mock batch
        const mockUpdate = jest.fn();
        const mockCommit = jest.fn().mockResolvedValue();
        const mockBatch = { update: mockUpdate, commit: mockCommit };
        admin.firestore().batch = jest.fn().mockReturnValue(mockBatch);

        await markAsRead(req, res);

        // Expect batch update and commit
        expect(mockUpdate).toHaveBeenCalledWith(mockDocRef, { read: true });
        expect(mockCommit).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          message: 'Messages marked as read',
        });
      });
    });
  });
  // ----------------------- Reservation & Review tests -----------------------
  describe('storeController - reservation and review functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // ---------------- createReservation ----------------
    describe('createReservation', () => {
      it('should return 400 if required fields are missing', async () => {
        const req = mockRequest({ body: {} });
        const res = mockResponse();

        await createReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Missing required fields',
        });
      });

      it('should return 404 if item does not exist', async () => {
        const req = mockRequest({
          body: {
            reservationId: 'r1',
            itemId: 'item1',
            storeId: 'store1',
            status: 'Pending',
            reservedAt: new Date(),
          },
        });
        const res = mockResponse();

        admin.firestore().collection = jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }),
          }),
        });

        await createReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
      });

      it('should create reservation if item and store exist', async () => {
        const req = mockRequest({
          body: {
            reservationId: 'r1',
            itemId: 'item1',
            storeId: 'store1',
            status: 'Pending',
            reservedAt: new Date(),
          },
        });
        const res = mockResponse();

        const mockItemDoc = { exists: true };
        const mockStoreDoc = { exists: true };
        const mockSet = jest.fn().mockResolvedValue();

        admin.firestore().collection = jest.fn().mockImplementation((name) => {
          if (name === 'items')
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockItemDoc),
              })),
            };
          if (name === 'stores')
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockStoreDoc),
              })),
            };
          if (name === 'Reservations')
            return { doc: jest.fn(() => ({ set: mockSet })) };
          return { doc: jest.fn(() => ({ get: jest.fn() })) };
        });

        await createReservation(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            reservationId: 'r1',
            itemId: 'item1',
            storeId: 'store1',
          })
        );
      });
    });

    // ---------------- customerReserve ----------------
    describe('customerReserve', () => {
      it('should return 404 if item not found', async () => {
        const req = mockRequest({
          params: { itemId: 'item1' },
          body: { storeId: 'store1' },
        });
        const res = mockResponse();

        admin.firestore().collection = jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }),
          }),
        });

        await customerReserve(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
      });

      it('should reserve item and create chat & message', async () => {
        const req = mockRequest({
          params: { itemId: 'item1' },
          body: { storeId: 'store1' },
        });
        const res = mockResponse();

        const mockItemDoc = {
          exists: true,
          data: () => ({
            status: 'Available',
            storeId: 'store1',
            name: 'ItemName',
          }),
          ref: { update: jest.fn().mockResolvedValue() },
        };
        const mockStoreDoc = {
          exists: true,
          data: () => ({ ownerId: 'owner1' }),
        };

        admin.firestore().collection = jest.fn((name) => {
          switch (name) {
            case 'items':
              return {
                doc: jest.fn(() => ({
                  get: jest.fn().mockResolvedValue(mockItemDoc),
                })),
              };
            case 'stores':
              return {
                doc: jest.fn(() => ({
                  get: jest.fn().mockResolvedValue(mockStoreDoc),
                })),
              };
            case 'messages':
              return { add: jest.fn().mockResolvedValue({ id: 'msg1' }) };
            case 'chats':
              return {
                doc: jest.fn(() => ({ set: jest.fn().mockResolvedValue() })),
              };
            case 'Reservations':
              return {
                doc: jest.fn(() => ({ set: jest.fn().mockResolvedValue() })),
              }; // ID is generated internally
            default:
              return {
                doc: jest.fn(() => ({
                  get: jest.fn().mockResolvedValue({ exists: true }),
                })),
              };
          }
        });

        await customerReserve(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            reservationId: expect.any(String), // <-- accept any string
            messageId: 'msg1',
          })
        );
      });
    });

    describe('updateReservationStatus', () => {
      it('should return 400 for invalid status', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'InvalidStatus' },
        });
        const res = mockResponse();

        await updateReservationStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid status' });
      });

      // More tests can be added for Sold, Cancelled, and normal status updates
    });

    describe('createReview', () => {
      it('should return 400 if missing fields', async () => {
        const req = mockRequest({ body: {} });
        const res = mockResponse();

        await createReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Missing required fields: storeId, rating',
        });
      });

      it('should return 400 if rating is invalid', async () => {
        const req = mockRequest({
          body: { storeId: 's1', rating: 6 },
        });
        const res = mockResponse();

        await createReview(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Rating must be between 1 and 5',
        });
      });

      it('should return 404 if store not found', async () => {
        const req = mockRequest({
          body: { storeId: 's1', rating: 5 },
        });
        const res = mockResponse();

        admin.firestore().collection = jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }),
          }),
        });

        await createReview(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Store not found' });
      });

      it('should create review successfully', async () => {
        const req = mockRequest({
          body: {
            reservationId: 'r1',
            itemId: 'i1',
            storeId: 's1',
            rating: 5,
            review: 'Great item!',
          },
        });
        const res = mockResponse();

        const mockStoreDoc = { exists: true };
        const mockAdd = jest.fn().mockResolvedValue({ id: 'review1' });
        const mockUpdate = jest.fn().mockResolvedValue();

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockStoreDoc),
                update: mockUpdate,
              }),
            };
          }
          if (name === 'Reviews') {
            return {
              add: mockAdd,
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ empty: false, docs: [] }),
              }),
            };
          }
          return { add: mockAdd };
        });

        await createReview(req, res);

        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            reservationId: 'r1',
            itemId: 'i1',
            storeId: 's1',
            userId: 'testUserId',
            rating: 5,
            review: 'Great item!',
            createdAt: expect.any(Object),
          })
        );
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Review created successfully',
            review: expect.objectContaining({
              reservationId: 'r1',
              itemId: 'i1',
              storeId: 's1',
              userId: 'testUserId',
              rating: 5,
              review: 'Great item!',
              createdAt: expect.any(Object),
            }),
          })
        );
      });

      it('should create review without reservationId or itemId', async () => {
        const req = mockRequest({
          body: { storeId: 's1', rating: 4, review: 'Nice store!' },
        });
        const res = mockResponse();

        const mockStoreDoc = { exists: true };
        const mockAdd = jest.fn().mockResolvedValue({ id: 'review2' });
        const mockUpdate = jest.fn().mockResolvedValue();

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockStoreDoc),
                update: mockUpdate,
              }),
            };
          }
          if (name === 'Reviews') {
            return {
              add: mockAdd,
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ empty: false, docs: [] }),
              }),
            };
          }
          return { add: mockAdd };
        });

        await createReview(req, res);

        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            reservationId: null,
            itemId: null,
            storeId: 's1',
            userId: 'testUserId',
            rating: 4,
            review: 'Nice store!',
            createdAt: expect.any(Object),
          })
        );
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Review created successfully',
            review: expect.objectContaining({
              reservationId: null,
              itemId: null,
              storeId: 's1',
              userId: 'testUserId',
              rating: 4,
              review: 'Nice store!',
              createdAt: expect.any(Object),
            }),
          })
        );
      });
    });

    describe('confirmReservation', () => {
      it('should return 404 if reservation not found', async () => {
        const req = mockRequest({ params: { reservationId: 'r1' } });
        const res = mockResponse();

        const mockGet = jest.fn().mockResolvedValue({ exists: false });
        admin.firestore().collection = jest
          .fn()
          .mockReturnValue({ doc: jest.fn(() => ({ get: mockGet })) });

        await confirmReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Reservation not found',
        });
      });

      it('should confirm reservation and call updateStoreRating', async () => {
        const req = mockRequest({ params: { reservationId: 'r1' } });
        const res = mockResponse();

        const mockReservation = {
          exists: true,
          data: () => ({ userId: 'testUserId', storeId: 's1', status: 'Sold' }),
        };
        const mockUpdate = jest.fn().mockResolvedValue();

        admin.firestore().collection = jest.fn().mockImplementation((name) => {
          if (name === 'Reservations')
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockReservation),
                update: mockUpdate,
              })),
            };
          if (name === 'stores')
            return {
              doc: jest.fn(() => ({ update: jest.fn().mockResolvedValue() })),
            };
          if (name === 'Reviews')
            return {
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({ docs: [] }),
              })),
            };
          return { doc: jest.fn(() => ({ get: jest.fn() })) };
        });

        await confirmReservation(req, res);

        expect(res.json).toHaveBeenCalledWith({
          message: 'Reservation confirmed successfully',
        });
      });
    });
  });
});

// ----------------------- Read-only: getStoreReviews & getItemById -----------------------
describe('storeController - read-only functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- getStoreReviews ----------------
  // ---------------- getStoreReviews ----------------
  describe('getStoreReviews', () => {
    it('should return 400 if storeId is missing', async () => {
      const req = mockRequest({ params: {} });
      const res = mockResponse();

      await getStoreReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Store ID is required' });
    });

    it('should return store reviews if found', async () => {
      const req = mockRequest({ params: { storeId: 'store1' } });
      const res = mockResponse();

      const mockDocs = [
        {
          id: 'rev1',
          data: () => ({
            rating: 5,
            comment: 'Great!',
            userId: 'user1',
            itemId: 'i1',
          }),
        },
        {
          id: 'rev2',
          data: () => ({
            rating: 4,
            comment: 'Good',
            userId: 'user2',
            itemId: 'i2',
          }),
        },
      ];

      const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });

      // Mock Firestore for Reviews
      admin.firestore().collection = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ get: mockGet }),
      });

      // Mock admin.auth().getUser
      admin.auth = jest.fn().mockReturnValue({
        getUser: jest.fn((uid) =>
          Promise.resolve({ uid, displayName: `User ${uid}` })
        ),
      });

      // Mock users collection
      admin.firestore().collection = jest.fn((name) => {
        if (name === 'Reviews') {
          return { where: jest.fn().mockReturnValue({ get: mockGet }) };
        }
        if (name === 'users') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ displayName: 'Mock User' }),
              }),
            })),
          };
        }
        if (name === 'items') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ name: 'Mock Item' }),
              }),
            })),
          };
        }
      });

      await getStoreReviews(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          reviewId: 'rev1',
          rating: 5,
          comment: 'Great!',
        }),
        expect.objectContaining({
          reviewId: 'rev2',
          rating: 4,
          comment: 'Good',
        }),
      ]);
    });
  });

  // ---------------- getItemById ----------------
  describe('getItemById', () => {
    it('should return 400 if itemId is missing', async () => {
      const req = mockRequest({ params: {} });
      const res = mockResponse();

      await getItemById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item ID is required' });
    });

    it('should return item data if found', async () => {
      const req = mockRequest({ params: { id: 'item1' } });
      const res = mockResponse();

      const mockDoc = {
        exists: true,
        id: 'item1',
        data: () => ({ name: 'Test Item', price: 100 }),
      };

      admin.firestore().collection = jest.fn().mockReturnValue({
        doc: jest
          .fn()
          .mockReturnValue({ get: jest.fn().mockResolvedValue(mockDoc) }),
      });

      await getItemById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'item1',
          name: 'Test Item',
          price: 100,
        })
      );
    });

    it('should return 404 if item not found', async () => {
      const req = mockRequest({ params: { id: 'item1' } });
      const res = mockResponse();

      admin.firestore().collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: false }),
        }),
      });

      await getItemById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
    });
  });
});

// ----------------------- updateStoreRating -----------------------
describe('storeController - updateStoreRating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the store rating based on reviews', async () => {
    const storeId = 'store1';
    const mockReviews = [
      { data: () => ({ rating: 5 }) },
      { data: () => ({ rating: 3 }) },
    ];

    const mockWhere = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: mockReviews }),
    });
    const mockUpdate = jest.fn().mockResolvedValue();

    admin.firestore().collection = jest.fn((name) => {
      if (name === 'Reviews') return { where: mockWhere };
      if (name === 'stores')
        return { doc: jest.fn(() => ({ update: mockUpdate })) };
      return { doc: jest.fn(() => ({ get: jest.fn() })) };
    });

    await updateStoreRating(storeId);

    const expectedAverage = (5 + 3) / 2;
    expect(mockUpdate).toHaveBeenCalledWith({
      averageRating: expectedAverage,
      reviewCount: mockReviews.length,
      updatedAt: expect.any(Object),
    });
  });
});

// ----------------------- Missing storeController tests -----------------------
describe('storeController - additional functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockUpdate = jest.fn().mockResolvedValue();
  const mockItemDoc = {
    exists: true,
    data: () => ({ storeId: 'store1', images: [] }),
    ref: { update: mockUpdate },
    update: mockUpdate, // optional for direct calls
  };

  admin.firestore().collection = jest.fn((name) => {
    if (name === 'stores')
      return {
        where: jest.fn().mockReturnValue({
          get: jest
            .fn()
            .mockResolvedValue({ empty: false, docs: [{ id: 'store1' }] }),
        }),
      };
    if (name === 'items')
      return {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockItemDoc),
          update: mockUpdate,
        })),
      };
  });

  // ---------------- createChat ----------------
  describe('createChat', () => {
    it('should return 400 if receiverId or message is missing', async () => {
      const req = mockRequest({ body: { receiverId: '', message: '' } });
      const res = mockResponse();

      await createChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing receiverId or message',
      });
    });

    it('should create chat and message successfully', async () => {
      const req = mockRequest({
        body: {
          receiverId: 'user2',
          message: 'Hello',
          itemId: 'i1',
          storeId: 's1',
        },
      });
      const res = mockResponse();

      const mockSet = jest.fn().mockResolvedValue();
      const mockAdd = jest.fn().mockResolvedValue({ id: 'msg1' });

      admin.firestore().collection = jest.fn((name) => {
        if (name === 'chats') return { doc: jest.fn(() => ({ set: mockSet })) };
        if (name === 'messages') return { add: mockAdd };
        return { doc: jest.fn(() => ({ set: mockSet })) };
      });

      await createChat(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: expect.any(String),
          messageId: 'msg1',
        })
      );
    });
  });

  // ---------------- getReservations ----------------
  describe('getReservations', () => {
    it('should return 404 if user not found', async () => {
      const req = mockRequest();
      const res = mockResponse();

      admin.firestore().collection = jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false }),
        })),
      }));

      await getReservations(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return reservations for customer', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const mockUserDoc = { exists: true, data: () => ({ role: 'customer' }) };
      const mockSnapshot = {
        docs: [{ id: 'r1', data: () => ({ status: 'Pending' }) }],
      };

      admin.firestore().collection = jest.fn((name) => {
        if (name === 'users')
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockUserDoc),
            })),
          };
        if (name === 'Reservations')
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockSnapshot),
            }),
          };
        return { doc: jest.fn(() => ({ get: jest.fn() })) };
      });

      await getReservations(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ reservationId: 'r1', status: 'Pending' }),
      ]);
    });
  });

  // ---------------- getUserById ----------------
  describe('storeController - additional functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('getUserById', () => {
      it('should return user data if found', async () => {
        const req = mockRequest({ params: { userId: 'u1' } });
        const res = mockResponse();

        // Mock admin.auth().getUser
        admin.auth = jest.fn().mockReturnValue({
          getUser: jest.fn().mockResolvedValue({
            uid: 'u1',
            email: 'test@test.com',
            displayName: 'Tester',
          }),
        });

        // Mock Firestore users collection
        admin.firestore().collection = jest.fn((name) => {
          if (name === 'users') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({ role: 'customer', displayName: 'Tester' }),
                }),
              })),
            };
          }
        });

        await getUserById(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            uid: 'u1',
            email: 'test@test.com',
            displayName: 'Tester',
            role: 'customer',
          })
        );
      });
    });
  });

  // ---------------- getContactInfos ----------------
  describe('getContactInfos', () => {
    it('should return 400 if store not found', async () => {
      const req = mockRequest();
      const res = mockResponse();

      admin.firestore().collection = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      }));

      await getContactInfos(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Store not found' });
    });

    it('should return contact infos if found', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const mockStoreSnapshot = { empty: false, docs: [{ id: 'store1' }] };
      const mockContactSnapshot = {
        docs: [
          { id: 'c1', data: () => ({ type: 'email', value: 'test@test.com' }) },
        ],
      };

      admin.firestore().collection = jest.fn((name) => {
        if (name === 'stores')
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockStoreSnapshot),
            }),
            doc: jest.fn(() => ({
              collection: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockContactSnapshot),
              })),
            })),
          };
      });

      await getContactInfos(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 'c1', type: 'email', value: 'test@test.com' },
      ]);
    });
  });

  // ---------------- addContactInfo ----------------
  describe('addContactInfo', () => {
    it('should return 401 if userId missing', async () => {
      const req = mockRequest({ user: {} });
      const res = mockResponse();

      await addContactInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if missing fields', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await addContactInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should add contact info successfully', async () => {
      const req = mockRequest({ body: { type: 'phone', value: '123456' } });
      const res = mockResponse();
      const mockSet = jest.fn().mockResolvedValue();
      const mockStoreSnapshot = { empty: false, docs: [{ id: 'store1' }] };

      admin.firestore().collection = jest.fn((name) => {
        if (name === 'stores')
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockStoreSnapshot),
            }),
            doc: jest.fn(() => ({
              collection: jest.fn(() => ({
                doc: jest.fn(() => ({ set: mockSet })),
              })),
            })),
          };
      });

      await addContactInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'phone', value: '123456' })
      );
    });
  });

  // ---------------- deleteContactInfo ----------------
  describe('deleteContactInfo', () => {
    it('should return 400 if store not found', async () => {
      const req = mockRequest({ params: { contactId: 'c1' } });
      const res = mockResponse();

      admin.firestore().collection = jest.fn(() => ({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      }));

      await deleteContactInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should delete contact info successfully', async () => {
      const req = mockRequest({ params: { contactId: 'c1' } });
      const res = mockResponse();
      const mockDelete = jest.fn().mockResolvedValue();
      const mockStoreSnapshot = { empty: false, docs: [{ id: 'store1' }] };

      admin.firestore().collection = jest.fn((name) => {
        if (name === 'stores')
          return {
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockStoreSnapshot),
            }),
            doc: jest.fn(() => ({
              collection: jest.fn(() => ({
                doc: jest.fn(() => ({ delete: mockDelete })),
              })),
            })),
          };
      });

      await deleteContactInfo(req, res);

      expect(mockDelete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Contact info deleted successfully',
      });
    });
  });

  // ---------------- updateItem ----------------
  describe('storeController - additional functions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('updateItem', () => {
      let mockUpdate;

      beforeEach(() => {
        jest.clearAllMocks();

        mockUpdate = jest.fn().mockResolvedValue();

        const mockItemDocData = {
          storeId: 'store1',
          name: 'OldItem',
          price: 20,
          quantity: 2,
        };

        const mockItemDoc = {
          exists: true,
          data: () => mockItemDocData,
          ref: { update: mockUpdate },
        };

        // Mock Firestore for stores and items
        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'store1' }],
                }),
              }),
            };
          }

          if (name === 'items') {
            return {
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockItemDoc),
                update: mockUpdate,
              }),
            };
          }

          // Fallback for other collections
          return { doc: jest.fn() };
        });
      });

      it('should return 404 if item not found', async () => {
        const req = {
          user: { uid: 'user1' },
          params: { itemId: 'missingItem' },
          body: { name: 'NewItem', price: 50, quantity: 5 },
        };
        const res = mockResponse();

        // Properly mock stores and items
        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'store1' }],
                }),
              }),
            };
          }

          if (name === 'items') {
            return {
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ exists: false }),
              }),
            };
          }

          return { doc: jest.fn().mockReturnValue({ get: jest.fn() }) };
        });

        await updateItem(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
      });

      it('should update item successfully', async () => {
        const req = {
          user: { uid: 'user1' },
          params: { itemId: 'item1' },
          body: { name: 'NewItem', price: 50, quantity: 5 },
          files: [],
        };
        const res = mockResponse();

        await updateItem(req, res);

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'NewItem',
            price: 50,
            quantity: 5,
          })
        );

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId: 'item1',
            name: 'NewItem',
            price: 50,
            quantity: 5,
          })
        );
      });
    });
  });
  // Add these tests to your existing storeController.test.js file

  describe('storeController - Missing Coverage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // =============== updateReservationStatus - Complete Coverage ===============
    describe('updateReservationStatus - Full Coverage', () => {
      it('should return 403 if user is not a store owner', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'Confirmed' },
        });
        const res = mockResponse();

        admin.firestore().collection = jest.fn(() => ({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ empty: true }),
          }),
        }));

        await updateReservationStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'User is not a store owner',
        });
      });

      it('should return 404 if reservation not found', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'Confirmed' },
        });
        const res = mockResponse();

        const mockStoreSnapshot = { empty: false, docs: [{ id: 'store1' }] };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockStoreSnapshot),
              }),
            };
          }
          if (name === 'Reservations') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({ exists: false }),
              })),
            };
          }
        });

        await updateReservationStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Reservation not found',
        });
      });

      it('should return 403 if reservation does not belong to store', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'Confirmed' },
        });
        const res = mockResponse();

        const mockStoreSnapshot = { empty: false, docs: [{ id: 'store1' }] };
        const mockReservationDoc = {
          exists: true,
          data: () => ({ storeId: 'differentStore', itemId: 'item1' }),
        };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockStoreSnapshot),
              }),
            };
          }
          if (name === 'Reservations') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockReservationDoc),
              })),
            };
          }
        });

        await updateReservationStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unauthorized to update this reservation',
        });
      });

      it('should update item status to Sold when marking reservation as Sold', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'Sold' },
        });
        const res = mockResponse();

        const mockUpdate = jest.fn().mockResolvedValue();
        const mockReservationDoc = {
          exists: true,
          data: () => ({ storeId: 'store1', itemId: 'item1' }),
        };
        const mockItemDoc = {
          id: 'itemDoc1',
          data: () => ({ itemId: 'item1' }),
        };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'store1' }],
                }),
              }),
            };
          }
          if (name === 'Reservations') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockReservationDoc),
                update: mockUpdate,
              })),
            };
          }
          if (name === 'items') {
            return {
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [mockItemDoc],
                }),
              })),
              doc: jest.fn(() => ({ update: mockUpdate })),
            };
          }
        });

        await updateReservationStatus(req, res);

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'Sold' })
        );
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'Sold' })
        );
      });

      it('should handle item not found error when marking as Sold', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'Sold' },
        });
        const res = mockResponse();

        const mockReservationDoc = {
          exists: true,
          data: () => ({ storeId: 'store1', itemId: 'missingItem' }),
        };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'store1' }],
                }),
              }),
            };
          }
          if (name === 'Reservations') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockReservationDoc),
              })),
            };
          }
          if (name === 'items') {
            return {
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({ empty: true }),
              })),
            };
          }
        });

        await updateReservationStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
      });

      it('should update item to Available when cancelling reservation', async () => {
        const req = mockRequest({
          params: { reservationId: 'r1' },
          body: { status: 'Cancelled' },
        });
        const res = mockResponse();

        const mockUpdate = jest.fn().mockResolvedValue();
        const mockReservationDoc = {
          exists: true,
          data: () => ({ storeId: 'store1', itemId: 'item1' }),
        };
        const mockItemDoc = { id: 'itemDoc1' };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: 'store1' }],
                }),
              }),
            };
          }
          if (name === 'Reservations') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockReservationDoc),
                update: mockUpdate,
              })),
            };
          }
          if (name === 'items') {
            return {
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [mockItemDoc],
                }),
              })),
              doc: jest.fn(() => ({ update: mockUpdate })),
            };
          }
        });

        await updateReservationStatus(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'Cancelled' })
        );
      });
    });

    // =============== createReview - Edge Cases ===============

    // =============== confirmReservation - Complete Coverage ===============
    describe('confirmReservation - Full Coverage', () => {
      it('should return 403 if reservation does not belong to user', async () => {
        const req = mockRequest({ params: { reservationId: 'r1' } });
        const res = mockResponse();

        const mockReservationDoc = {
          exists: true,
          data: () => ({ userId: 'differentUser', status: 'Sold' }),
        };

        admin.firestore().collection = jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockReservationDoc),
          })),
        }));

        await confirmReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unauthorized to confirm this reservation',
        });
      });

      it('should return 400 if reservation status is not Sold', async () => {
        const req = mockRequest({ params: { reservationId: 'r1' } });
        const res = mockResponse();

        const mockReservationDoc = {
          exists: true,
          data: () => ({
            userId: 'testUserId',
            status: 'Pending',
            storeId: 's1',
          }),
        };

        admin.firestore().collection = jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockReservationDoc),
          })),
        }));

        await confirmReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Can only confirm sold items',
        });
      });

      it('should successfully confirm reservation and update store rating', async () => {
        const req = mockRequest({ params: { reservationId: 'r1' } });
        const res = mockResponse();

        const mockUpdate = jest.fn().mockResolvedValue();
        const mockReservationDoc = {
          exists: true,
          data: () => ({ userId: 'testUserId', status: 'Sold', storeId: 's1' }),
        };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'Reservations') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockReservationDoc),
                update: mockUpdate,
              })),
            };
          }
          if (name === 'Reviews') {
            return {
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [
                    { data: () => ({ rating: 5 }) },
                    { data: () => ({ rating: 4 }) },
                  ],
                }),
              })),
            };
          }
          if (name === 'stores') {
            return {
              doc: jest.fn(() => ({ update: mockUpdate })),
            };
          }
        });

        await confirmReservation(req, res);

        expect(mockUpdate).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          message: 'Reservation confirmed successfully',
        });
      });
    });

    // =============== getStoreReviews - Error Handling ===============
    describe('getStoreReviews - Error Handling', () => {
      it('should return empty array if no reviews found', async () => {
        const req = mockRequest({ params: { storeId: 'store1' } });
        const res = mockResponse();

        admin.firestore().collection = jest.fn(() => ({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ empty: true }),
          }),
        }));

        await getStoreReviews(req, res);

        expect(res.json).toHaveBeenCalledWith([]);
      });

      it('should handle user fetch error gracefully', async () => {
        const req = mockRequest({ params: { storeId: 'store1' } });
        const res = mockResponse();

        const mockDocs = [
          {
            id: 'rev1',
            data: () => ({ rating: 5, userId: 'user1', itemId: 'i1' }),
          },
        ];

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'Reviews') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: mockDocs,
                }),
              }),
            };
          }
          if (name === 'items') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({ name: 'Test Item' }),
                }),
              })),
            };
          }
          if (name === 'users') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({ exists: false }),
              })),
            };
          }
        });

        admin.auth = jest.fn().mockReturnValue({
          getUser: jest.fn().mockRejectedValue(new Error('User not found')),
        });

        await getStoreReviews(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              reviewId: 'rev1',
              userName: 'Anonymous',
            }),
          ])
        );
      });
    });

    // =============== customerReserve - Error Cases ===============
    describe('customerReserve - Additional Error Cases', () => {
      it('should return 400 if item is not available', async () => {
        const req = mockRequest({
          params: { itemId: 'item1' },
          body: { storeId: 'store1' },
        });
        const res = mockResponse();

        const mockItemDoc = {
          exists: true,
          data: () => ({ status: 'Sold', storeId: 'store1' }),
        };

        admin.firestore().collection = jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockItemDoc),
          })),
        }));

        await customerReserve(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Item not available' });
      });

      it('should return 400 if storeId does not match', async () => {
        const req = mockRequest({
          params: { itemId: 'item1' },
          body: { storeId: 'store1' },
        });
        const res = mockResponse();

        const mockItemDoc = {
          exists: true,
          data: () => ({ status: 'Available', storeId: 'differentStore' }),
        };

        admin.firestore().collection = jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue(mockItemDoc),
          })),
        }));

        await customerReserve(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid store' });
      });
    });

    // =============== getReservations - Store Owner Edge Case ===============
    describe('getReservations - Store Owner No Store', () => {
      it('should return empty array for store owner with no store', async () => {
        const req = mockRequest();
        const res = mockResponse();

        const mockUserDoc = {
          exists: true,
          data: () => ({ role: 'storeOwner' }),
        };

        admin.firestore().collection = jest.fn((name) => {
          if (name === 'users') {
            return {
              doc: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockUserDoc),
              })),
            };
          }
          if (name === 'stores') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ empty: true }),
              }),
            };
          }
        });

        await getReservations(req, res);

        expect(res.json).toHaveBeenCalledWith([]);
      });
    });
  });
});
