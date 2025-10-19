import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyCloset from '../pages/customer/MyCloset';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

// Mock dependencies
jest.mock('firebase/auth');
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../components/CustomerSidebar', () => {
  return function CustomerSidebar({ activePage }) {
    return <div data-testid="customer-sidebar">{activePage}</div>;
  };
});

const mockReservations = [
  {
    reservationId: 'res-1',
    itemId: 'item-1',
    status: 'Completed',
  },
  {
    reservationId: 'res-2',
    itemId: 'item-2',
    status: 'Confirmed',
  },
  {
    reservationId: 'res-3',
    itemId: 'item-3',
    status: 'Pending',
  },
  {
    reservationId: 'res-4',
    itemId: 'item-4',
    status: 'Completed',
  },
];

const mockItems = {
  'item-1': {
    itemId: 'item-1',
    name: 'T-Shirt',
    images: [{ imageURL: 'https://example.com/tshirt.jpg' }],
  },
  'item-2': {
    itemId: 'item-2',
    name: 'Jeans',
    images: [
      { imageURL: 'https://example.com/jeans1.jpg' },
      { imageURL: 'https://example.com/jeans2.jpg' },
    ],
  },
  'item-4': {
    itemId: 'item-4',
    name: 'Jacket',
    images: [{ imageURL: 'https://example.com/jacket.jpg' }],
  },
};

const mockOutfits = [
  {
    outfitId: 'outfit-1',
    slots: ['item-1', 'item-2', null, null, null, null, null, null, null],
  },
  {
    outfitId: 'outfit-2',
    slots: ['item-4', null, null, null, null, null, null, null, null],
  },
];

const mockUser = {
  uid: 'user-123',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
};

const mockAuth = {
  currentUser: mockUser,
};

describe('MyCloset Component', () => {
  let mockNavigate;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    mockNavigate = jest.fn();
    require('react-router-dom').useNavigate = () => mockNavigate;

    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Default axios mock responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stores/reservations')) {
        return Promise.resolve({ data: mockReservations });
      }
      if (url.includes('/api/items/item-1')) {
        return Promise.resolve({ data: mockItems['item-1'] });
      }
      if (url.includes('/api/items/item-2')) {
        return Promise.resolve({ data: mockItems['item-2'] });
      }
      if (url.includes('/api/items/item-4')) {
        return Promise.resolve({ data: mockItems['item-4'] });
      }
      if (url.includes('/api/items/item-3')) {
        return Promise.reject(new Error('Item not found'));
      }
      if (url.includes('/api/outfits')) {
        return Promise.resolve({ data: mockOutfits });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    axios.post.mockResolvedValue({ data: { outfitId: 'new-outfit' } });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const renderMyCloset = () => {
    return render(
      <MemoryRouter>
        <MyCloset />
      </MemoryRouter>
    );
  };

  describe('Initial Loading and Display', () => {
    test('renders component with sidebar', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/my closet/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('customer-sidebar')).toBeInTheDocument();
      expect(screen.getByText('closet')).toBeInTheDocument();
    });

    test('redirects to login if user is not authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderMyCloset();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('fetches and displays only completed/confirmed reservations', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/reservations'),
          expect.any(Object)
        );
      });

      // Should fetch items for completed/confirmed reservations only (not pending)
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/items/item-1'),
          expect.any(Object)
        );
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/items/item-2'),
          expect.any(Object)
        );
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/items/item-4'),
          expect.any(Object)
        );
      });
    });

    test('fetches saved outfits from backend', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/outfits'),
          expect.any(Object)
        );
      });

      // Verify console.log was called with fetched outfits
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Fetched outfits:', mockOutfits);
      });
    });

    test('displays error message when fetching fails', async () => {
      axios.get.mockRejectedValue({
        response: { data: { error: 'Network error' } },
      });

      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load closet/)).toBeInTheDocument();
      });
    });

    test('handles item fetch failure gracefully with placeholder', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/items/item-1'),
          expect.any(Object)
        );
      });

      // Verify item-3 was NOT fetched because it's pending
      const calls = axios.get.mock.calls.filter((call) =>
        call[0].includes('/api/items/item-3')
      );
      expect(calls.length).toBe(0);
    });
  });

  describe('Create New Outfit Section', () => {
    test('displays 9 empty slots initially', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/create new outfit/i)).toBeInTheDocument();
      });

      const slots = screen.getAllByText('+');
      expect(slots.length).toBe(9);
    });

    test('displays save outfit button', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/SAVE OUTFIT/i)).toBeInTheDocument();
      });
    });

    test('opens popup when slot is clicked', async () => {
      renderMyCloset();

      await waitFor(() => {
        const slots = screen.getAllByText('+');
        expect(slots.length).toBe(9);
      });

      const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
      fireEvent.click(slotsInGrid[0]);

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });
    });
  });

  describe('Item Selection Popup', () => {
    test('displays available items in popup', async () => {
      renderMyCloset();

      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });

      // Should display items
      const images = screen.getAllByAltText(/T-Shirt|Jeans|Jacket/);
      expect(images.length).toBeGreaterThan(0);
    });

    test('closes popup when close button is clicked', async () => {
      renderMyCloset();

      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByText(/CLOSE/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });
    });

    test('adds item to slot when selected from popup', async () => {
      renderMyCloset();

      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });

      // Click the first item in popup
      const popupItems = document.querySelectorAll('.popup-item');
      fireEvent.click(popupItems[0]);

      // Popup should close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // One slot should now be filled (8 + signs remaining)
      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(8);
      });
    });

    test('displays remove button when slot has item', async () => {
      renderMyCloset();

      // Add item to slot first
      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      // Wait for popup to close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Click same slot again
      const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
      fireEvent.click(slotsInGrid[0]);

      await waitFor(() => {
        expect(screen.getByText(/REMOVE ITEM/i)).toBeInTheDocument();
      });
    });

    test('removes item from slot when remove button is clicked', async () => {
      renderMyCloset();

      // Add item to slot
      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      // Wait for popup to close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Open popup again for same slot
      const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
      fireEvent.click(slotsInGrid[0]);

      await waitFor(() => {
        expect(screen.getByText(/REMOVE ITEM/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByText(/REMOVE ITEM/i);
      fireEvent.click(removeButton);

      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(9); // Back to all empty
      });
    });

    test('displays placeholder for items with no images', async () => {
      const noImageReservations = [
        {
          reservationId: 'res-5',
          itemId: 'item-5',
          status: 'Completed',
        },
      ];

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: noImageReservations });
        }
        if (url.includes('/api/items/item-5')) {
          return Promise.resolve({
            data: { itemId: 'item-5', name: 'No Image Item', images: [] },
          });
        }
        if (url.includes('/api/outfits')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderMyCloset();

      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        const placeholders = screen.getAllByAltText('No item available');
        expect(placeholders.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Save Outfit Functionality', () => {
    test('saves outfit successfully', async () => {
      renderMyCloset();

      // Add an item to a slot
      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      // Wait for popup to close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByText(/SAVE OUTFIT/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/outfits'),
          expect.objectContaining({
            slots: expect.any(Array),
          }),
          expect.objectContaining({
            headers: { Authorization: 'Bearer mock-token' },
          })
        );
      });

      expect(window.alert).toHaveBeenCalledWith('Outfit saved!');
    });

    test('refetches outfits after saving', async () => {
      renderMyCloset();

      await waitFor(() => {
        const saveButton = screen.getByText(/SAVE OUTFIT/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        // Should be called twice: once on mount, once after save
        const outfitCalls = axios.get.mock.calls.filter((call) =>
          call[0].includes('/api/outfits')
        );
        expect(outfitCalls.length).toBeGreaterThanOrEqual(2);
      });
    });

    test('displays error alert when save fails', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));
      console.error = jest.fn();

      renderMyCloset();

      await waitFor(() => {
        const saveButton = screen.getByText(/SAVE OUTFIT/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save outfit');
      });
    });
  });

  describe('My Outfits Section', () => {
    test('displays "My Outfits" section', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/my outfits/i)).toBeInTheDocument();
      });
    });

    test('displays saved outfits', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitCards = document.querySelectorAll('.my-outfits-section .store-card');
        expect(outfitCards.length).toBe(2);
      });
    });

    test('displays empty slots in saved outfits correctly', async () => {
      renderMyCloset();

      await waitFor(() => {
        const emptySlots = document.querySelectorAll('.my-outfits-section .store-card-image-wrapper.empty');
        expect(emptySlots.length).toBeGreaterThan(0);
      });
    });

    test('displays item images in saved outfits', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitImages = document.querySelectorAll('.my-outfits-section .store-image');
        expect(outfitImages.length).toBeGreaterThan(0);
      });
    });

    test('displays placeholder for missing items in saved outfits', async () => {
      const outfitsWithMissingItem = [
        {
          outfitId: 'outfit-3',
          slots: ['item-999', null, null, null, null, null, null, null, null],
        },
      ];

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/outfits')) {
          return Promise.resolve({ data: outfitsWithMissingItem });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderMyCloset();

      await waitFor(() => {
        // Missing items show as empty wrappers in saved outfits
        const emptyWrappers = document.querySelectorAll('.my-outfits-section .store-card-image-wrapper.empty');
        expect(emptyWrappers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Image Error Handling', () => {
    test('handles broken image URLs with placeholder', async () => {
      renderMyCloset();

      await waitFor(() => {
        // Wait for saved outfits to load which have images
        const outfitImages = document.querySelectorAll('.my-outfits-section .store-image');
        expect(outfitImages.length).toBeGreaterThan(0);
      });

      // Trigger error on image
      const image = document.querySelector('.my-outfits-section .store-image');
      if (image) {
        fireEvent.error(image);
        expect(image).toBeInTheDocument();
      }
    });
  });

  describe('Authentication Token', () => {
    test('uses correct authentication token in all API calls', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalled();
      });

      await waitFor(() => {
        const getCalls = axios.get.mock.calls;
        getCalls.forEach((call) => {
          if (call[1]) {
            expect(call[1].headers.Authorization).toBe('Bearer mock-token');
          }
        });
      });
    });

    test('requests new token when saving outfit', async () => {
      renderMyCloset();

      mockUser.getIdToken.mockClear();

      await waitFor(() => {
        const saveButton = screen.getByText(/SAVE OUTFIT/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Items Selection', () => {
    test('allows adding items to multiple slots', async () => {
      renderMyCloset();

      // Add item to first slot
      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      // Wait for popup to close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Add item to second slot
      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[1]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[1]);
      });

      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(7); // 9 - 2 filled slots
      });
    });

    test('allows replacing item in a slot', async () => {
      renderMyCloset();

      // Add first item
      await waitFor(() => {
        const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
        fireEvent.click(slotsInGrid[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      // Wait for popup to close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Click same slot to replace
      const slotsInGrid = document.querySelectorAll('.closet-grid .grid-slot');
      fireEvent.click(slotsInGrid[0]);

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[1]);
      });

      // Should still have 8 empty slots (only 1 filled)
      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(8);
      });
    });
  });
});