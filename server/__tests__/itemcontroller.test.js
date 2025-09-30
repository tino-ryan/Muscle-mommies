// __tests__/itemController.test.js
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

  function createMockQuery(items) {
    return {
      doc: jest.fn((docId) => ({
        get: jest.fn().mockResolvedValue({
          exists: items.length > 0,
          data: () => items[0] || {},
          id: docId,
        }),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(),
      })),
      where: jest.fn(function (field, op, value) {
        const filtered = items.filter((item) => {
          if (op === '==') return item[field] === value;
          return true;
        });
        return createMockQuery(filtered);
      }),
      get: jest.fn().mockResolvedValue({
        empty: items.length === 0,
        size: items.length,
        docs: items.map((item) => ({
          id: item.id || item.itemId,
          data: () => item,
        })),
      }),
    };
  }

  const mockCollection = (name) => {
    if (name === 'items') {
      const itemsQuery = createMockQuery(mockItems);
      itemsQuery.doc = jest.fn((docId) => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockItems.find((i) => i.itemId === docId) || mockItems[0],
          id: docId,
        }),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(),
      }));
      return itemsQuery;
    }

    if (name === 'stores') {
      return {
        doc: jest.fn((docId) => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              id: 'store123',
              ownerId: 'user123',
              storeName: 'Store 123',
            }),
            id: docId || 'store123',
          }),
        })),
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [{ id: 'store123', data: () => ({ ownerId: 'user123' }) }],
          }),
        }),
      };
    }

    if (name === 'itemImages') {
      return {
        doc: jest.fn(() => ({
          set: jest.fn().mockResolvedValue(),
          update: jest.fn().mockResolvedValue(),
          get: jest.fn().mockResolvedValue({ exists: false }),
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

  return {
    firestore: jest.fn(() => ({
      collection: mockCollection,
      FieldValue: { serverTimestamp: jest.fn(() => new Date()) },
    })),
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

uuid.v4.mockReturnValue('mock-uuid');

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
  },
};

const {
  getItems,
  getItemsByStore,
  searchItems,
} = require('../controllers/itemController');

describe('Item Controller – full tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {},
      query: {},
      body: {},
      user: { uid: 'user123' },
      files: [],
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  test('getItems returns all items', async () => {
    await getItems(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Item 1' }),
        expect.objectContaining({ name: 'Item 2' }),
      ])
    );
  });

  test('getItemsByStore returns items for a store', async () => {
    req.params.storeId = 'store123';
    await getItemsByStore(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ storeId: 'store123' })])
    );
  });

  test('searchItems filters by searchTerm', async () => {
    req.query.searchTerm = 'item 1';
    await searchItems(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Item 1' })])
    );
  });

  test('searchItems filters by category', async () => {
    req.query.category = 'cat2';
    req.query.status = 'Unavailable';
    await searchItems(req, res);
    const result = res.json.mock.calls[0][0];
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ category: 'cat2' })])
    );
  });

  test('searchItems filters by style', async () => {
    req.query.style = 'style1';
    await searchItems(req, res);
    const result = res.json.mock.calls[0][0];
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ style: 'style1' })])
    );
  });

  test('searchItems filters by department', async () => {
    req.query.department = 'dep2';
    req.query.status = 'Unavailable';
    await searchItems(req, res);
    const result = res.json.mock.calls[0][0];
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ department: 'dep2' })])
    );
  });

  test('searchItems filters by status', async () => {
    req.query.status = 'Available';
    await searchItems(req, res);
    const result = res.json.mock.calls[0][0];
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'Available' })])
    );
  });

  test('searchItems filters by price range', async () => {
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
});
