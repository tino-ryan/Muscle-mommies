// __tests__/outfitController.test.js
const outfitController = require('../controllers/outfitController');
const admin = require('firebase-admin');

jest.mock('firebase-admin', () => {
  const collectionMock = jest.fn();
  const docMock = jest.fn();
  const setMock = jest.fn();
  const whereMock = jest.fn();
  const getMock = jest.fn();

  const docsMock = [];

  return {
    firestore: jest.fn(() => ({
      collection: collectionMock.mockReturnValue({
        doc: docMock.mockReturnValue({
          id: 'mockOutfitId',
          set: setMock,
        }),
        where: whereMock.mockReturnValue({
          get: getMock,
        }),
      }),
    })),
    __mocks__: {
      collectionMock,
      docMock,
      setMock,
      whereMock,
      getMock,
      docsMock,
    },
  };
});
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe('Outfit Controller', () => {
  let req, res;
  let mocks;

  beforeEach(() => {
    mocks = admin.__mocks__;
    req = { body: {}, user: { uid: 'user123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('saveOutfit', () => {
    it('should save outfit with valid slots', async () => {
      req.body.slots = Array(9).fill('item');
      mocks.setMock.mockResolvedValue();

      await outfitController.saveOutfit(req, res);

      expect(mocks.setMock).toHaveBeenCalledWith({
        userId: 'user123',
        slots: req.body.slots,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        outfitId: 'mockOutfitId',
        slots: req.body.slots,
      });
    });

    it('should return 400 if slots is missing', async () => {
      req.body.slots = undefined;

      await outfitController.saveOutfit(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid slots array' });
    });

    it('should return 400 if slots is not an array', async () => {
      req.body.slots = 'not-an-array';

      await outfitController.saveOutfit(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid slots array' });
    });

    it('should return 400 if slots array length is not 9', async () => {
      req.body.slots = Array(5).fill('item');

      await outfitController.saveOutfit(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid slots array' });
    });

    it('should return 500 if saving to Firestore fails', async () => {
      req.body.slots = Array(9).fill('item');
      mocks.setMock.mockRejectedValue(new Error('DB error'));

      await outfitController.saveOutfit(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

  describe('getUserOutfits', () => {
    it('should return all outfits for user', async () => {
      const fakeDocs = [
        { id: '1', data: () => ({ slots: ['a'] }) },
        { id: '2', data: () => ({ slots: ['b'] }) },
      ];
      mocks.getMock.mockResolvedValue({ docs: fakeDocs });

      await outfitController.getUserOutfits(req, res);

      expect(mocks.whereMock).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(res.json).toHaveBeenCalledWith([
        { outfitId: '1', slots: ['a'] },
        { outfitId: '2', slots: ['b'] },
      ]);
    });

    it('should return 500 if fetching outfits fails', async () => {
      mocks.getMock.mockRejectedValue(new Error('Fetch error'));

      await outfitController.getUserOutfits(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Fetch error' });
    });
  });
});
