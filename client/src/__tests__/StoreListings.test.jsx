import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreListings from '../pages/store/StoreListings';
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

// Mock API_URL to match the expected URL in tests
jest.mock('../api', () => ({
  API_URL: 'https://muscle-mommies-server.onrender.com',
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderStoreListings = () =>
  render(
    <BrowserRouter>
      <StoreListings />
    </BrowserRouter>
  );

describe('StoreListings', () => {
  const mockAuth = {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
  };

  const mockUser = {
    uid: 'user123',
    getIdToken: jest.fn().mockResolvedValue('fake-token'),
  };

  const mockStoreData = { storeId: 'store123' };
  const mockItems = [
    {
      itemId: 'item1',
      name: 'Vintage Jacket',
      description: 'A beautiful vintage leather jacket',
      department: "women's",
      category: 'tops',
      style: 'vintage',
      price: 150.0,
      status: 'Available',
      images: [
        { imageURL: 'http://example.com/jacket1.jpg' },
        { imageURL: 'http://example.com/jacket2.jpg' },
      ],
    },
    {
      itemId: 'item2',
      name: 'Retro Shoes',
      description: 'Classic retro sneakers',
      department: "men's",
      category: 'footwear',
      style: 'streetwear',
      price: 80.0,
      status: 'Available',
      images: [{ imageURL: 'http://example.com/shoes.jpg' }],
    },
    {
      itemId: 'item3',
      name: 'Designer Bag',
      description: 'Luxury handbag',
      department: "women's",
      category: 'accessories',
      style: 'minimalist',
      price: 250.0,
      status: 'Sold',
      images: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    signOut.mockResolvedValue();
    window.alert = jest.fn();
  });

  describe('Authentication and Data Loading', () => {
    it('redirects to login when user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return jest.fn();
      });

      renderStoreListings();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('shows loading state initially', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      // Don't resolve the axios calls to keep loading state
      axios.get.mockImplementation(() => new Promise(() => {}));

      renderStoreListings();

      expect(screen.getByText('Loading listings...')).toBeInTheDocument();
      expect(
        screen.getByText('Loading listings...').closest('.loading-container')
      ).toBeInTheDocument();
    });

    it('loads store and items successfully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData }) // Store data
        .mockResolvedValueOnce({ data: mockItems }); // Items data

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Listings')).toBeInTheDocument();
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
        expect(screen.getByText('Retro Shoes')).toBeInTheDocument();
        expect(screen.getByText('Designer Bag')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith(
        'https://muscle-mommies-server.onrender.com/api/my-store',
        { headers: { Authorization: 'Bearer fake-token' } }
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://muscle-mommies-server.onrender.com/api/stores/store123/items',
        { headers: { Authorization: 'Bearer fake-token' } }
      );
    });

    it('handles 404 error (no items found)', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const mockError = {
        response: { status: 404 },
        message: 'Not found',
      };

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockRejectedValueOnce(mockError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderStoreListings();

      await waitFor(() => {
        expect(
          screen.getByText('No items found for this store.')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('handles 400 error and redirects to store profile', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const mockError = {
        response: { status: 400 },
        message: 'Bad request',
      };

      axios.get.mockRejectedValueOnce(mockError);

      renderStoreListings();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/store/profile');
      });
    });

    it('handles general API errors', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const mockError = {
        response: { status: 500 },
        message: 'Server error',
      };

      axios.get.mockRejectedValueOnce(mockError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderStoreListings();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to fetch listings: Server error')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: mockItems });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('searches items by name', async () => {
      const searchInput = screen.getByPlaceholderText('Search listings');

      fireEvent.change(searchInput, { target: { value: 'vintage' } });

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
        expect(screen.queryByText('Retro Shoes')).not.toBeInTheDocument();
        expect(screen.queryByText('Designer Bag')).not.toBeInTheDocument();
      });
    });

    it('filters by department', async () => {
      const departmentSelect = screen.getByDisplayValue('All Departments');

      fireEvent.change(departmentSelect, { target: { value: "men's" } });

      await waitFor(() => {
        expect(screen.queryByText('Vintage Jacket')).not.toBeInTheDocument();
        expect(screen.getByText('Retro Shoes')).toBeInTheDocument();
        expect(screen.queryByText('Designer Bag')).not.toBeInTheDocument();
      });
    });

    it('filters by category', async () => {
      const categorySelect = screen.getByDisplayValue('All Categories');

      fireEvent.change(categorySelect, { target: { value: 'accessories' } });

      await waitFor(() => {
        expect(screen.queryByText('Vintage Jacket')).not.toBeInTheDocument();
        expect(screen.queryByText('Retro Shoes')).not.toBeInTheDocument();
        expect(screen.getByText('Designer Bag')).toBeInTheDocument();
      });
    });

    it('filters by style', async () => {
      const styleSelect = screen.getByDisplayValue('All Styles');

      fireEvent.change(styleSelect, { target: { value: 'vintage' } });

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
        expect(screen.queryByText('Retro Shoes')).not.toBeInTheDocument();
        expect(screen.queryByText('Designer Bag')).not.toBeInTheDocument();
      });
    });

    it('filters by status', async () => {
      const statusSelect = screen.getByDisplayValue('All Statuses');

      fireEvent.change(statusSelect, { target: { value: 'Sold' } });

      await waitFor(() => {
        expect(screen.queryByText('Vintage Jacket')).not.toBeInTheDocument();
        expect(screen.queryByText('Retro Shoes')).not.toBeInTheDocument();
        expect(screen.getByText('Designer Bag')).toBeInTheDocument();
      });
    });

    it('shows mobile filter toggle', () => {
      expect(screen.getByText('Show Filters ⬇')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Show Filters ⬇'));

      expect(screen.getByText('Hide Filters ⬆')).toBeInTheDocument();
    });

    it('shows no matches message when filters return empty results', async () => {
      const searchInput = screen.getByPlaceholderText('Search listings');

      fireEvent.change(searchInput, { target: { value: 'nonexistent item' } });

      await waitFor(() => {
        expect(
          screen.getByText('No items match the filters.')
        ).toBeInTheDocument();
      });
    });

    it('combines search and filters correctly', async () => {
      const searchInput = screen.getByPlaceholderText('Search listings');
      const departmentSelect = screen.getByDisplayValue('All Departments');

      fireEvent.change(searchInput, { target: { value: 'jacket' } });
      fireEvent.change(departmentSelect, { target: { value: "women's" } });

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
        expect(screen.queryByText('Retro Shoes')).not.toBeInTheDocument();
        expect(screen.queryByText('Designer Bag')).not.toBeInTheDocument();
      });
    });
  });

  describe('Item Actions', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: mockItems });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('navigates to edit page when edit button is clicked for available item', () => {
      const editButtons = screen.getAllByText('Edit');
      const availableItemEditButton = editButtons.find(
        (btn) =>
          !btn.disabled &&
          btn.closest('tr').textContent.includes('Vintage Jacket')
      );

      fireEvent.click(availableItemEditButton);

      expect(mockNavigate).toHaveBeenCalledWith('/store/listings/edit/item1');
    });

    it('prevents editing sold items with alert', () => {
      const editButtons = screen.getAllByText('Edit');
      const soldItemEditButton = editButtons.find(
        (btn) =>
          btn.disabled && btn.closest('tr').textContent.includes('Designer Bag')
      );

      expect(soldItemEditButton).toBeDisabled();
      expect(soldItemEditButton).toHaveClass('disabled');
    });

    it('navigates to add listing page', () => {
      const addButton = screen.getByText('Add Listing');

      fireEvent.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/store/listings/add');
    });
  });

  describe('Modal Functionality', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: mockItems });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('closes modal when clicking close button', async () => {
      const vintageJacketRow = screen.getByText('Vintage Jacket').closest('tr');
      fireEvent.click(vintageJacketRow);

      await waitFor(() => {
        expect(
          screen.getByText('A beautiful vintage leather jacket')
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('A beautiful vintage leather jacket')
        ).not.toBeInTheDocument();
      });
    });

    it('closes modal when clicking overlay', async () => {
      const vintageJacketRow = screen.getByText('Vintage Jacket').closest('tr');
      fireEvent.click(vintageJacketRow);

      await waitFor(() => {
        expect(
          screen.getByText('A beautiful vintage leather jacket')
        ).toBeInTheDocument();
      });

      const overlay = screen
        .getByText('A beautiful vintage leather jacket')
        .closest('.modal-overlay');
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(
          screen.queryByText('A beautiful vintage leather jacket')
        ).not.toBeInTheDocument();
      });
    });

    it('navigates through images in modal', async () => {
      const vintageJacketRow = screen.getByText('Vintage Jacket').closest('tr');
      fireEvent.click(vintageJacketRow);

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('›');
      fireEvent.click(nextButton);

      expect(screen.getByText('2 / 2')).toBeInTheDocument();

      const prevButton = screen.getByText('‹');
      fireEvent.click(prevButton);

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('shows no images placeholder when item has no images', async () => {
      const designerBagRow = screen.getByText('Designer Bag').closest('tr');
      fireEvent.click(designerBagRow);

      await waitFor(() => {
        expect(screen.getByText('No Images')).toBeInTheDocument();
      });
    });

    it('disables edit button in modal for sold item', async () => {
      const designerBagRow = screen.getByText('Designer Bag').closest('tr');
      fireEvent.click(designerBagRow);

      await waitFor(() => {
        const editButton = screen.getByText('Edit Listing');
        expect(editButton).toBeDisabled();
        expect(editButton).toHaveClass('disabled');
      });
    });

    it('prevents modal clicks from propagating to overlay', async () => {
      const vintageJacketRow = screen.getByText('Vintage Jacket').closest('tr');
      fireEvent.click(vintageJacketRow);

      await waitFor(() => {
        expect(
          screen.getByText('A beautiful vintage leather jacket')
        ).toBeInTheDocument();
      });

      const modalContent = screen
        .getByText('A beautiful vintage leather jacket')
        .closest('.modal-content');
      fireEvent.click(modalContent);

      // Modal should still be open
      expect(
        screen.getByText('A beautiful vintage leather jacket')
      ).toBeInTheDocument();
    });
  });

  describe('Table Display', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: mockItems });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('renders table headers correctly', () => {
      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText('Item')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('shows "No Image" placeholder for items without images', () => {
      expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('displays correct price formatting', () => {
      expect(screen.getByText('R150.00')).toBeInTheDocument();
      expect(screen.getByText('R80.00')).toBeInTheDocument();
      expect(screen.getByText('R250.00')).toBeInTheDocument();
    });

    it('shows click info message', () => {
      expect(
        screen.getByText('Click on an item to view more details.')
      ).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: mockItems });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      });
    });

    it('handles logout correctly', async () => {
      const logoutButton = screen.getByText('Logout');

      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout error', async () => {
      signOut.mockRejectedValue(new Error('Logout failed'));

      const logoutButton = screen.getByText('Logout');

      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to log out: Logout failed')
        ).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: mockItems });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('renders sidebar with correct props', () => {
      expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Current Page: Listings')).toBeInTheDocument();
    });

    it('renders page title and add button', () => {
      expect(screen.getByText('Listings')).toBeInTheDocument();
      expect(screen.getByText('Add Listing')).toBeInTheDocument();
    });

    it('renders search bar with icon', () => {
      expect(
        screen.getByPlaceholderText('Search listings')
      ).toBeInTheDocument();
      // Check for SVG search icon
      const searchIcon = document.querySelector('svg[viewBox="0 0 256 256"]');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error when authentication fails', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderStoreListings();

      expect(screen.getByText('Please log in.')).toBeInTheDocument();
    });

    it('handles missing item properties gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const itemsWithMissingData = [
        {
          itemId: 'item1',
          name: 'Test Item',
          price: 100,
          status: 'Available',
          // Missing department, category, style, description, images
        },
      ];

      axios.get
        .mockResolvedValueOnce({ data: mockStoreData })
        .mockResolvedValueOnce({ data: itemsWithMissingData });

      renderStoreListings();

      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getAllByText('N/A')).toHaveLength(3); // department, category, style
        expect(screen.getByText('No Image')).toBeInTheDocument();
      });

      // Click item to open modal
      const itemRow = screen.getByText('Test Item').closest('tr');
      fireEvent.click(itemRow);

      await waitFor(() => {
        expect(
          screen.getByText('No description available.')
        ).toBeInTheDocument();
        expect(screen.getByText('No Images')).toBeInTheDocument();
      });
    });
  });
});
