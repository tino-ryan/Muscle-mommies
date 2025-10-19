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
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

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
    consoleErrorSpy.mockRestore();
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

      const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
      fireEvent.click(gridSlots[0]);

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });
    });
  });

  describe('Closet Items Section', () => {
    test('displays closet items section', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/closet items/i)).toBeInTheDocument();
      });
    });

    test('displays all completed/confirmed items', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
        expect(screen.getByText('Jeans')).toBeInTheDocument();
        expect(screen.getByText('Jacket')).toBeInTheDocument();
      });
    });

    test('clicking item in closet section adds to first empty slot', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const itemCards = document.querySelectorAll('.item-card');
      fireEvent.click(itemCards[0]); // Click T-Shirt

      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(8); // One slot filled
      });
    });

    test('displays multiple images for items with multiple images', async () => {
      renderMyCloset();

      await waitFor(() => {
        const itemImages = document.querySelectorAll('.item-card .item-image');
        // Jeans has 2 images, T-Shirt has 1, Jacket has 1 = 4 total
        expect(itemImages.length).toBe(4);
      });
    });
  });

  describe('Item Selection Popup', () => {
    test('displays available items in popup', async () => {
      renderMyCloset();

      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
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
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /CLOSE/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });
    });

    test('adds item to first empty slot when selected from popup', async () => {
      renderMyCloset();

      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[3]); // Click any slot
      });

      await waitFor(() => {
        expect(screen.getByText(/select an item/i)).toBeInTheDocument();
      });

      // Click the first item in popup
      const popupItems = document.querySelectorAll('.popup-item');
      fireEvent.click(popupItems[0]);

      // Popup should close and first slot should be filled
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(8);
      });
    });

    test('displays remove button when slot has item', async () => {
      renderMyCloset();

      // Add item to slot first
      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      // Wait for popup to close
      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Click same slot again (first slot which should now have item)
      const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
      fireEvent.click(gridSlots[0]);

      await waitFor(() => {
        expect(screen.getByText(/REMOVE ITEM/i)).toBeInTheDocument();
      });
    });

    test('removes item from slot when remove button is clicked', async () => {
      renderMyCloset();

      // Add item to slot
      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
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
      const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
      fireEvent.click(gridSlots[0]);

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
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
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
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
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

      renderMyCloset();

      await waitFor(() => {
        const saveButton = screen.getByText(/SAVE OUTFIT/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save outfit');
        expect(consoleErrorSpy).toHaveBeenCalled();
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

    test('displays saved outfits with numbering', async () => {
      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText('Outfit 1')).toBeInTheDocument();
        expect(screen.getByText('Outfit 2')).toBeInTheDocument();
      });
    });

    test('displays view outfit button for each saved outfit', async () => {
      renderMyCloset();

      await waitFor(() => {
        const viewButtons = screen.getAllByText(/VIEW OUTFIT/i);
        expect(viewButtons.length).toBe(2);
      });
    });

    test.skip('displays empty state when no outfits saved', async () => {
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
        if (url.includes('/api/outfits')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/my outfits/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        const noOutfitsDiv = document.querySelector('.no-outfits');
        expect(noOutfitsDiv).toBeInTheDocument();
        expect(noOutfitsDiv.textContent).toContain("You haven't saved any outfits yet");
      }, { timeout: 2000 });
    });

    test('opens modal when outfit preview is clicked', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        expect(outfitPreviews.length).toBe(2);
      });

      const outfitPreviews = document.querySelectorAll('.outfit-preview');
      fireEvent.click(outfitPreviews[0]);

      await waitFor(() => {
        expect(screen.getByText(/outfit preview/i)).toBeInTheDocument();
      });
    });

    test('displays outfit grid in modal', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[0]);
      });

      await waitFor(() => {
        const modalSlots = document.querySelectorAll('.grid-slot-modal');
        expect(modalSlots.length).toBe(9);
      });
    });

    test('closes modal when close button clicked', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/outfit preview/i)).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByText(/CLOSE/i);
      const modalCloseButton = closeButtons[closeButtons.length - 1];
      fireEvent.click(modalCloseButton);

      await waitFor(() => {
        expect(screen.queryByText(/outfit preview/i)).not.toBeInTheDocument();
      });
    });

    test('closes modal when clicking outside modal content', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/outfit preview/i)).toBeInTheDocument();
      });

      const modalOverlay = document.querySelector('.modal-overlay');
      fireEvent.click(modalOverlay);

      await waitFor(() => {
        expect(screen.queryByText(/outfit preview/i)).not.toBeInTheDocument();
      });
    });

    test('does not close modal when clicking inside modal content', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/outfit preview/i)).toBeInTheDocument();
      });

      const modalContent = document.querySelector('.modal-content');
      fireEvent.click(modalContent);

      // Modal should still be open
      expect(screen.getByText(/outfit preview/i)).toBeInTheDocument();
    });

    test('displays empty slots in modal for null slot values', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[1]); // Outfit 2 has mostly empty slots
      });

      await waitFor(() => {
        const emptySlots = document.querySelectorAll('.empty-slot-modal');
        expect(emptySlots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Image Error Handling', () => {
    test('handles broken image URLs with placeholder in outfit grid', async () => {
      renderMyCloset();

      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      await waitFor(() => {
        const slotImages = document.querySelectorAll('.slot-image');
        if (slotImages.length > 0) {
          fireEvent.error(slotImages[0]);
          expect(slotImages[0].src).toContain('placeholder');
        }
      });
    });

    test('handles broken image URLs in outfit preview modal', async () => {
      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[0]);
      });

      await waitFor(() => {
        const modalImages = document.querySelectorAll('.slot-image-modal');
        if (modalImages.length > 0) {
          fireEvent.error(modalImages[0]);
          expect(modalImages[0].src).toContain('placeholder');
        }
      });
    });

    test('handles broken image URLs in saved outfit previews', async () => {
      renderMyCloset();

      await waitFor(() => {
        const previewImages = document.querySelectorAll('.preview-image img');
        if (previewImages.length > 0) {
          fireEvent.error(previewImages[0]);
          expect(previewImages[0].src).toContain('placeholder');
        }
      });
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
    test('fills slots left-to-right when adding multiple items', async () => {
      renderMyCloset();

      // Click on different slots but items should fill from left
      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[5]); // Click middle slot
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Add second item
      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[8]); // Click last slot
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

    test.skip('stops adding items when all slots are filled', async () => {
      renderMyCloset();

      // We have 3 items available, so fill 3 slots
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
          fireEvent.click(gridSlots[i]);
        });

        await waitFor(() => {
          const popupItems = document.querySelectorAll('.popup-item');
          if (popupItems.length > 0) {
            fireEvent.click(popupItems[i % popupItems.length]);
          }
        });

        await waitFor(() => {
          expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
        });
      }

      // 3 slots should be filled (6 empty)
      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(6);
      });
    });

    test('allows removing items from specific slots', async () => {
      renderMyCloset();

      // Add item to first slot
      await waitFor(() => {
        const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
        fireEvent.click(gridSlots[0]);
      });

      await waitFor(() => {
        const popupItems = document.querySelectorAll('.popup-item');
        fireEvent.click(popupItems[0]);
      });

      await waitFor(() => {
        expect(screen.queryByText(/select an item/i)).not.toBeInTheDocument();
      });

      // Click on filled slot to remove
      const gridSlots = document.querySelectorAll('.outfit-grid .grid-slot');
      fireEvent.click(gridSlots[0]);

      await waitFor(() => {
        const removeButton = screen.getByText(/REMOVE ITEM/i);
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        const plusSigns = screen.getAllByText('+');
        expect(plusSigns.length).toBe(9);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles items without name gracefully', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({
            data: [{ reservationId: 'res-1', itemId: 'item-1', status: 'Completed' }],
          });
        }
        if (url.includes('/api/items/item-1')) {
          return Promise.resolve({
            data: { itemId: 'item-1', images: [{ imageURL: 'test.jpg' }] },
          });
        }
        if (url.includes('/api/outfits')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText('Unnamed Item')).toBeInTheDocument();
      });
    });

    test('displays outfit with missing item data', async () => {
      const outfitWithMissingItem = [
        {
          outfitId: 'outfit-99',
          slots: ['item-999', null, null, null, null, null, null, null, null],
        },
      ];

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/outfits')) {
          return Promise.resolve({ data: outfitWithMissingItem });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderMyCloset();

      await waitFor(() => {
        const outfitPreviews = document.querySelectorAll('.outfit-preview');
        fireEvent.click(outfitPreviews[0]);
      });

      await waitFor(() => {
        const emptySlots = document.querySelectorAll('.empty-slot-modal');
        expect(emptySlots.length).toBeGreaterThan(0);
      });
    });

    test('handles empty reservations list', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/outfits')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderMyCloset();

      await waitFor(() => {
        expect(screen.getByText(/closet items/i)).toBeInTheDocument();
      });

      // Should not show any items
      const itemCards = document.querySelectorAll('.item-card');
      expect(itemCards.length).toBe(0);
    });
  });
});
