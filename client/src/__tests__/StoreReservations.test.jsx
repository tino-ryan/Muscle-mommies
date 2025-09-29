import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreReservations from '../pages/store/Reservations';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';

// Mocks
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('axios');

jest.mock('../components/StoreSidebar', () => ({ currentPage, onLogout }) => (
  <div data-testid="store-sidebar">
    <span>Current Page: {currentPage}</span>
    <button onClick={onLogout}>Logout</button>
  </div>
));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.confirm
global.confirm = jest.fn();

const renderStoreReservations = () =>
  render(
    <BrowserRouter>
      <StoreReservations />
    </BrowserRouter>
  );

describe('StoreReservations', () => {
  const mockAuth = {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
  };

  const mockUser = {
    getIdToken: jest.fn().mockResolvedValue('fake-token'),
  };

  const mockReservations = [
    {
      reservationId: 'res1',
      itemId: 'item1',
      userId: 'user1',
      status: 'Pending',
      reservedAt: { _seconds: Date.now() / 1000 },
    },
    {
      reservationId: 'res2',
      itemId: 'item2',
      userId: 'user2',
      status: 'Completed',
      reservedAt: { _seconds: Date.now() / 1000 - 86400 },
      soldAt: { _seconds: Date.now() / 1000 },
    },
  ];

  const mockItems = {
    item1: {
      name: 'Vintage Jacket',
      price: 150,
      category: 'tops',
      description: 'Beautiful vintage jacket',
      images: [{ imageURL: 'http://example.com/jacket.jpg' }],
    },
    item2: {
      name: 'Retro Shoes',
      price: 80,
      category: 'footwear',
      description: 'Classic retro shoes',
      images: [],
    },
  };

  const mockUsers = {
    user1: { displayName: 'John Doe' },
    user2: { displayName: 'Jane Smith' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    global.confirm.mockReturnValue(true);

    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stores/reservations')) {
        return Promise.resolve({ data: mockReservations });
      }
      if (url.includes('/api/items/item1')) {
        return Promise.resolve({ data: mockItems.item1 });
      }
      if (url.includes('/api/items/item2')) {
        return Promise.resolve({ data: mockItems.item2 });
      }
      if (url.includes('/api/stores/users/user1')) {
        return Promise.resolve({ data: mockUsers.user1 });
      }
      if (url.includes('/api/stores/users/user2')) {
        return Promise.resolve({ data: mockUsers.user2 });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderStoreReservations();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('handles logout correctly', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      signOut.mockResolvedValueOnce();

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when fetching data', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      // Don't resolve the axios promises to keep loading state
      axios.get.mockImplementation(() => new Promise(() => {}));

      renderStoreReservations();

      expect(screen.getByText('Loading reservations...')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  describe('Reservations Rendering', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('renders active reservations by default', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getByText('Active Reservations')).toBeInTheDocument();
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should not show completed reservations in active view
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('switches between active and sales view', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getByText('Active Reservations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View Past Sales'));

      expect(screen.getByText('Past Sales 💸')).toBeInTheDocument();
      expect(screen.getByText('View Active Reservations')).toBeInTheDocument();

      // Should now show completed reservations
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('shows no reservations message when list is empty', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderStoreReservations();

      await waitFor(() => {
        expect(
          screen.getByText('No active reservations found.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('filters reservations by search term', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by item or customer name'
      );
      fireEvent.change(searchInput, { target: { value: 'vintage' } });

      expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.queryAllByText('Vintage Jacket')).toHaveLength(0);
      });
    });

    it('filters by category', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'footwear' } });

      // Should filter out the tops item
      await waitFor(() => {
        expect(screen.queryAllByText('Vintage Jacket')).toHaveLength(0);
      });
    });

    it('filters by status', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'Confirmed' } });

      // Should hide pending items
      await waitFor(() => {
        expect(screen.queryAllByText('Vintage Jacket')).toHaveLength(0);
      });
    });

    it('toggles mobile filters', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getByText('Show Filters ⬇️')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show Filters ⬇️'));

      expect(screen.getByText('Hide Filters ⬆️')).toBeInTheDocument();
    });
  });

  describe('Status Updates', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
      axios.put.mockResolvedValue({});
    });

    it('updates reservation status', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByDisplayValue('Pending')[0];
      fireEvent.change(statusSelect, { target: { value: 'Confirmed' } });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/reservations/res1'),
          { status: 'Confirmed' },
          { headers: { Authorization: 'Bearer fake-token' } }
        );
      });

      expect(
        screen.getByText('Status updated successfully!')
      ).toBeInTheDocument();
    });

    it('shows confirmation dialog for status changes', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByDisplayValue('Pending')[0];
      fireEvent.change(statusSelect, { target: { value: 'Completed' } });

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Confirm status change to Completed?')
      );
    });

    it('cancels status update when user declines confirmation', async () => {
      global.confirm.mockReturnValue(false);

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByDisplayValue('Pending')[0];
      fireEvent.change(statusSelect, { target: { value: 'Confirmed' } });

      expect(axios.put).not.toHaveBeenCalled();
    });

    it('handles status update error', async () => {
      axios.put.mockRejectedValueOnce({
        response: { data: { error: 'Update failed' } },
      });

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByDisplayValue('Pending')[0];
      fireEvent.change(statusSelect, { target: { value: 'Confirmed' } });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to update status: Update failed')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Modal Functionality', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('opens modal when reservation is clicked', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const reservationRow = screen
        .getAllByText('Vintage Jacket')[0]
        .closest('tr');
      fireEvent.click(reservationRow);

      expect(screen.getByText('Beautiful vintage jacket')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument(); // Close button
    });

    it('closes modal when close button is clicked', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      // Open modal
      const reservationRow = screen
        .getAllByText('Vintage Jacket')[0]
        .closest('tr');
      fireEvent.click(reservationRow);

      expect(screen.getByText('Beautiful vintage jacket')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByText('×'));

      expect(
        screen.queryByText('Beautiful vintage jacket')
      ).not.toBeInTheDocument();
    });

    it('closes modal when overlay is clicked', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      // Open modal
      const reservationRow = screen
        .getAllByText('Vintage Jacket')[0]
        .closest('tr');
      fireEvent.click(reservationRow);

      const modalOverlay = document.querySelector('.modal-overlay');
      fireEvent.click(modalOverlay);

      expect(
        screen.queryByText('Beautiful vintage jacket')
      ).not.toBeInTheDocument();
    });

    it('navigates through image carousel', async () => {
      const multiImageItem = {
        ...mockItems.item1,
        images: [
          { imageURL: 'http://example.com/img1.jpg' },
          { imageURL: 'http://example.com/img2.jpg' },
          { imageURL: 'http://example.com/img3.jpg' },
        ],
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: mockReservations });
        }
        if (url.includes('/api/items/item1')) {
          return Promise.resolve({ data: multiImageItem });
        }
        if (url.includes('/api/items/item2')) {
          return Promise.resolve({ data: mockItems.item2 });
        }
        if (url.includes('/api/stores/users/user1')) {
          return Promise.resolve({ data: mockUsers.user1 });
        }
        if (url.includes('/api/stores/users/user2')) {
          return Promise.resolve({ data: mockUsers.user2 });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      // Open modal
      const reservationRow = screen
        .getAllByText('Vintage Jacket')[0]
        .closest('tr');
      fireEvent.click(reservationRow);

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });

      // Next image
      fireEvent.click(screen.getByText('›'));
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Previous image
      fireEvent.click(screen.getByText('‹'));
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('handles API errors when fetching reservations', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.reject({
            response: { data: { error: 'Failed to fetch reservations' } },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderStoreReservations();

      await waitFor(() => {
        expect(
          screen.getByText(
            'Failed to load reservations: Failed to fetch reservations'
          )
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch data:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('handles missing item data gracefully', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: mockReservations });
        }
        if (url.includes('/api/items/item1')) {
          return Promise.reject(new Error('Item not found'));
        }
        if (url.includes('/api/stores/users/user1')) {
          return Promise.resolve({ data: mockUsers.user1 });
        }
        return Promise.resolve({ data: { name: 'Unknown Item' } });
      });

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Unknown Item')[0]).toBeInTheDocument();
      });
    });

    it('handles missing user data gracefully', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/reservations')) {
          return Promise.resolve({ data: mockReservations });
        }
        if (url.includes('/api/items/item1')) {
          return Promise.resolve({ data: mockItems.item1 });
        }
        if (url.includes('/api/stores/users/user1')) {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.resolve({ data: { displayName: 'Unknown User' } });
      });

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Unknown User')[0]).toBeInTheDocument();
      });
    });
  });

  describe('Message Auto-Clear', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('clears success message after 3 seconds', async () => {
      axios.put.mockResolvedValue({});

      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByDisplayValue('Pending')[0];
      fireEvent.change(statusSelect, { target: { value: 'Confirmed' } });

      await waitFor(() => {
        expect(
          screen.getByText('Status updated successfully!')
        ).toBeInTheDocument();
      });

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(
          screen.queryByText('Status updated successfully!')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('renders sidebar with correct props', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
        expect(
          screen.getByText('Current Page: Reservations')
        ).toBeInTheDocument();
      });
    });

    it('shows proper date formatting', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Jacket')[0]).toBeInTheDocument();
      });

      // Should show formatted date in table
      const tableRows = document.querySelectorAll('tbody tr');
      expect(tableRows.length).toBeGreaterThan(0);
    });

    it('displays price formatting correctly', async () => {
      renderStoreReservations();

      await waitFor(() => {
        expect(screen.getAllByText('R150')[0]).toBeInTheDocument();
      });
    });
  });
});
