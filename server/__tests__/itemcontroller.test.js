// __tests__/itemController.test.js

// Mock state management - prefix with 'mock' to be Jest-compliant
const mockState = {
  itemsArray: [],
  itemImagesArray: [],
  shouldThrowItemsGetError: false,
  shouldThrowStoresDocGetError: false,
  shouldThrowItemsQueryGetError: false,
  shouldThrowStoresWhereError: false,
  mockStoreOwnership: null,
};

jest.mock('firebase-admin', () => {
  const mockItems = [
    {
      id: 'item1',
      itemId: 'item1',
      name: 'Item 1',
      storeId: 'store123',
      price: 100,
      quantity: 10,
      category: 'cat1',
      style: 'style1',
      department: 'dep1',
      status: 'Available',
      description: 'Description 1',
      images: [],
    },
    {
      id: 'item2',
      itemId: 'item2',
      name: 'Item 2',
      storeId: 'store123',
      price: 200,
      quantity: 5,
      category: 'cat2',
      style: 'style2',
      department: 'dep2',
      status: 'Unavailable',
      description: 'Description 2',
      images: [],
    },
  ];

  mockState.itemsArray = [...mockItems];

  function createMockQuery(items) {
    return {
      doc: jest.fn((docId) => ({
        get: jest.fn(() => {
          if (mockState.shouldThrowItemsGetError) {
            return Promise.reject(new Error('Database error'));
          }
          return Promise.resolve({
            exists: items.some((i) => i.itemId === docId || i.id === docId),
            data: () =>
              items.find((i) => i.itemId === docId || i.id === docId) || {},
            id: docId,
          });
        }),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockResolvedValue(),
      })),
      where: jest.fn(function (field, op, value) {
        const filtered = items.filter((item) => {
          if (op === '==') return item[field] === value;
          return true;
        });
        return createMockQuery(filtered);
      }),
      get: jest.fn(() => {
        if (mockState.shouldThrowItemsQueryGetError) {
          return Promise.reject(new Error('Search error'));
        }
        return Promise.resolve({
          empty: items.length === 0,
          size: items.length,
          docs: items.map((item) => ({
            id: item.id || item.itemId,
            data: () => item,
          })),
        });
      }),
    };
  }

  const mockCollection = (name) => {
    if (name === 'items') {
      const itemsQuery = createMockQuery(mockState.itemsArray);
      itemsQuery.doc = jest.fn((docId) => ({
        get: jest.fn(() => {
          if (mockState.shouldThrowItemsGetError) {
            return Promise.reject(new Error('Database error'));
          }
          const item = mockState.itemsArray.find((i) => i.itemId === docId);
          return Promise.resolve({
            exists: !!item,
            data: () => item || {},
            id: docId,
          });
        }),
        set: jest.fn().mockImplementation((data) => {
          mockState.itemsArray.push({ ...data, id: docId });
          return Promise.resolve();
        }),
        update: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockImplementation(() => {
          mockState.itemsArray = mockState.itemsArray.filter(
            (i) => i.itemId !== docId
          );
          return Promise.resolve();
        }),
      }));
      itemsQuery.get = jest.fn(() => {
        if (mockState.shouldThrowItemsGetError) {
          return Promise.reject(new Error('Database error'));
        }
        return Promise.resolve({
          empty: mockState.itemsArray.length === 0,
          size: mockState.itemsArray.length,
          docs: mockState.itemsArray.map((item) => ({
            id: item.id || item.itemId,
            data: () => item,
          })),
        });
      });
      return itemsQuery;
    }

    if (name === 'stores') {
      return {
        doc: jest.fn((docId) => ({
          get: jest.fn(() => {
            if (mockState.shouldThrowStoresDocGetError) {
              return Promise.reject(new Error('Database error'));
            }
            return Promise.resolve({
              exists: docId === 'store123',
              data: () => ({
                id: 'store123',
                ownerId: 'user123',
                storeName: 'Store 123',
              }),
              id: docId || 'store123',
            });
          }),
        })),
        where: jest.fn((field, op, value) => ({
          get: jest.fn(() => {
            if (mockState.shouldThrowStoresWhereError) {
              return Promise.reject(new Error('Database error'));
            }
            // Check for mock override
            if (mockState.mockStoreOwnership !== null) {
              return Promise.resolve({
                empty: !mockState.mockStoreOwnership,
                docs: mockState.mockStoreOwnership
                  ? [
                      {
                        id: mockState.mockStoreOwnership,
                        data: () => ({ ownerId: value }),
                      },
                    ]
                  : [],
              });
            }
            return Promise.resolve({
              empty: value !== 'user123',
              docs:
                value === 'user123'
                  ? [{ id: 'store123', data: () => ({ ownerId: 'user123' }) }]
                  : [],
            });
          }),
        })),
      };
    }

    if (name === 'itemImages') {
      return {
        doc: jest.fn((docId) => ({
          set: jest.fn().mockImplementation((data) => {
            mockState.itemImagesArray.push({ ...data, id: docId });
            return Promise.resolve();
          }),
          update: jest.fn().mockResolvedValue(),
          get: jest.fn().mockResolvedValue({ exists: false }),
          delete: jest.fn().mockImplementation(() => {
            mockState.itemImagesArray = mockState.itemImagesArray.filter(
              (img) => img.imageId !== docId
            );
            return Promise.resolve();
          }),
        })),
        where: jest.fn((field, op, value) => ({
          get: jest.fn().mockResolvedValue({
            empty: mockState.itemImagesArray.length === 0,
            docs: mockState.itemImagesArray
              .filter((img) => img[field] === value)
              .map((img) => ({
                id: img.imageId,
                data: () => img,
              })),
          }),
        })),
      };
    }

    return {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(),
      })),
      where: jest.fn(() => createMockQuery([])),
      get: jest.fn().mockResolvedValue({ docs: [] }),
    };
  };

  const mockFirestore = () => ({
    collection: mockCollection,
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date()),
    },
  });

  return {
    firestore: mockFirestore,
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
  };
});

jest.mock('cloudinary');
jest.mock('streamifier');
jest.mock('uuid');

const cloudinary = require('cloudinary');
const streamifier = require('streamifier');
const { Readable, Writable } = require('stream');
const uuid = require('uuid');

let uuidCounter = 0;
uuid.v4.mockImplementation(() => `mock-uuid-${uuidCounter++}`);

jest.setTimeout(20000);

streamifier.createReadStream.mockImplementation((buffer) => {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return readable;
});

cloudinary.v2 = {
  config: jest.fn().mockReturnValue({}),
  uploader: {
    upload_stream: jest.fn((opts, cb) => {
      const writable = new Writable({
        write(chunk, enc, next) {
          next();
        },
      });
      process.nextTick(() =>
        cb(null, { secure_url: 'https://mocked.cloudinary.com/mock-image.jpg' })
      );
      return writable;
    }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
};

const {
  getItems,
  getItemsByStore,
  searchItems,
  createItem,
  deleteItem,
} = require('../controllers/itemController');

describe('Item Controller – 100% Coverage', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    uuidCounter = 0;
    mockState.shouldThrowItemsGetError = false;
    mockState.shouldThrowStoresDocGetError = false;
    mockState.shouldThrowItemsQueryGetError = false;
    mockState.shouldThrowStoresWhereError = false;
    mockState.mockStoreOwnership = null;

    // Reset arrays
    const mockItems = [
      {
        id: 'item1',
        itemId: 'item1',
        name: 'Item 1',
        storeId: 'store123',
        price: 100,
        quantity: 10,
        category: 'cat1',
        style: 'style1',
        department: 'dep1',
        status: 'Available',
        description: 'Description 1',
        images: [],
      },
      {
        id: 'item2',
        itemId: 'item2',
        name: 'Item 2',
        storeId: 'store123',
        price: 200,
        quantity: 5,
        category: 'cat2',
        style: 'style2',
        department: 'dep2',
        status: 'Unavailable',
        description: 'Description 2',
        images: [],
      },
    ];
    mockState.itemsArray = [...mockItems];
    mockState.itemImagesArray = [];

    req = {
      params: {},
      query: {},
      body: {},
      user: { uid: 'user123' },
      files: [],
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getItems', () => {
    test('returns all items successfully', async () => {
      await getItems(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Item 1' }),
          expect.objectContaining({ name: 'Item 2' }),
        ])
      );
    });

    test('handles errors gracefully', async () => {
      mockState.shouldThrowItemsGetError = true;

      await getItems(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getItemsByStore', () => {
    test('returns items for a specific store', async () => {
      req.params.storeId = 'store123';
      await getItemsByStore(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ storeId: 'store123' }),
        ])
      );
    });

    test('returns 404 when store does not exist', async () => {
      req.params.storeId = 'nonexistent';
      await getItemsByStore(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Store not found' });
    });

    test('handles errors gracefully', async () => {
      req.params.storeId = 'store123';
      mockState.shouldThrowStoresDocGetError = true;

      await getItemsByStore(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch store items',
        details: 'Database error',
      });
    });
  });

  describe('searchItems', () => {
    test('filters by searchTerm (name)', async () => {
      req.query.searchTerm = 'item 1';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
    });

    test('filters by searchTerm (description)', async () => {
      req.query.searchTerm = 'description 2';
      req.query.status = 'Unavailable';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 2');
    });

    test('filters by category', async () => {
      req.query.category = 'cat2';
      req.query.status = 'Unavailable';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ category: 'cat2' })])
      );
    });

    test('filters by style', async () => {
      req.query.style = 'style1';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ style: 'style1' })])
      );
    });

    test('filters by department', async () => {
      req.query.department = 'dep2';
      req.query.status = 'Unavailable';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ department: 'dep2' }),
        ])
      );
    });

    test('filters by status', async () => {
      req.query.status = 'Available';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'Available' }),
        ])
      );
    });

    test('filters by minPrice only', async () => {
      req.query.minPrice = '150';
      req.query.status = 'Unavailable';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ price: 200 })])
      );
    });

    test('filters by maxPrice only', async () => {
      req.query.maxPrice = '150';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result.every((item) => item.price <= 150)).toBe(true);
    });

    test('filters by price range (min and max)', async () => {
      req.query.minPrice = '150';
      req.query.maxPrice = '250';
      req.query.status = 'Unavailable';
      await searchItems(req, res);
      const result = res.json.mock.calls[0][0];
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Item 2', price: 200 }),
        ])
      );
    });

    test('handles errors gracefully', async () => {
      mockState.shouldThrowItemsQueryGetError = true;

      await searchItems(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Search error' });
    });
  });

  describe('createItem', () => {
    test('returns 400 when name is missing', async () => {
      req.body = { price: '100', quantity: '10' };

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: name, price, quantity',
      });
    });

    test('returns 400 when price is missing', async () => {
      req.body = { name: 'Item', quantity: '10' };

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: name, price, quantity',
      });
    });

    test('returns 400 when quantity is missing', async () => {
      req.body = { name: 'Item', price: '100' };

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: name, price, quantity',
      });
    });

    test('returns 400 when store not found for user', async () => {
      req.user.uid = 'nonexistent-user';
      req.body = { name: 'Item', price: '100', quantity: '10' };

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Store not found' });
    });

    test('returns 400 when price is not a valid number', async () => {
      req.body = { name: 'Item', price: 'invalid', quantity: '10' };

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Price and quantity must be valid numbers',
      });
    });

    test('returns 400 when quantity is not a valid number', async () => {
      req.body = { name: 'Item', price: '100', quantity: 'invalid' };

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Price and quantity must be valid numbers',
      });
    });

    test('handles cloudinary upload error', async () => {
      req.body = { name: 'Item', price: '100', quantity: '10' };
      req.files = [{ buffer: Buffer.from('image') }];

      cloudinary.v2.uploader.upload_stream.mockImplementationOnce(
        (opts, cb) => {
          const writable = new Writable({
            write(chunk, enc, next) {
              next();
            },
          });
          process.nextTick(() => cb(new Error('Upload failed')));
          return writable;
        }
      );

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to upload image',
        details: 'Upload failed',
      });
    });

    test('handles general error during item creation', async () => {
      req.body = { name: 'Item', price: '100', quantity: '10' };
      mockState.shouldThrowStoresWhereError = true;

      await createItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to create item',
        details: 'Database error',
      });
    });
  });

  describe('deleteItem', () => {
    beforeEach(() => {
      // Set up item images for deletion tests
      mockState.itemImagesArray = [
        {
          imageId: 'img1',
          itemId: 'item1',
          imageURL: 'https://cloudinary.com/folder/image123.jpg',
        },
      ];
    });

    test('deletes item successfully with images', async () => {
      req.params.itemId = 'item1';

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Item deleted successfully',
      });
      expect(cloudinary.v2.uploader.destroy).toHaveBeenCalled();
    });

    test('returns 404 when item does not exist', async () => {
      req.params.itemId = 'nonexistent';

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
    });

    test('returns 403 when user store not found', async () => {
      req.params.itemId = 'item1';
      req.user.uid = 'nonexistent-user';

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Store not found',
      });
    });

    test('returns 403 when user does not own the item', async () => {
      req.params.itemId = 'item1';

      // Override store ownership to return a different store
      mockState.mockStoreOwnership = 'different-store';

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized: You do not own this item',
      });
    });

    test('deletes item even when cloudinary deletion fails', async () => {
      req.params.itemId = 'item1';

      cloudinary.v2.uploader.destroy.mockRejectedValueOnce(
        new Error('Cloudinary error')
      );

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Item deleted successfully',
      });
    });

    test('deletes item with no images', async () => {
      req.params.itemId = 'item1';
      mockState.itemImagesArray = [];

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Item deleted successfully',
      });
    });

    test('handles general error during deletion', async () => {
      req.params.itemId = 'item1';
      mockState.shouldThrowItemsGetError = true;

      await deleteItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete item',
        details: 'Database error',
      });
    });
  });
});
