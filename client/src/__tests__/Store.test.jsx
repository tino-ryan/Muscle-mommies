import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import Store from '../pages/customer/Store';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

// Mock dependencies
jest.mock('firebase/auth');
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'store-123' }),
  useNavigate: () => jest.fn(),
}));
jest.mock('../components/CustomerSidebar', () => {
  return function CustomerSidebar() {
    return <div data-testid="customer-sidebar">Sidebar</div>;
  };
});
jest.mock('../components/StarRating', () => {
  return function StarRating({ rating, reviewCount }) {
    return (
      <div data-testid="star-rating">
        {rating} stars ({reviewCount} reviews)
      </div>
    );
  };
});
jest.mock('../components/ReviewsModal', () => {
  return function ReviewsModal({ isOpen, onClose, storeName }) {
    return isOpen ? (
      <div data-testid="reviews-modal">
        <h2>{storeName} Reviews</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

const mockStore = {
  storeId: 'store-123',
  storeName: 'Test Store',
  address: '123 Test St',
  description: 'A test store',
  ownerId: 'owner-456',
  profileImageURL: 'https://example.com/store.jpg',
  averageRating: 4.5,
  reviewCount: 10,
};

const mockClothes = [
  {
    itemId: 'item-1',
    name: 'T-Shirt',
    category: 'Tops',
    style: 'Casual',
    size: 'M',
    price: 50,
    status: 'Available',
    department: 'Men',
    description: 'A nice t-shirt',
    images: [{ imageURL: 'https://example.com/tshirt.jpg' }],
  },
  {
    itemId: 'item-2',
    name: 'Jeans',
    category: 'Bottoms',
    style: 'Casual',
    size: 'L',
    price: 150,
    status: 'Available',
    department: 'Women',
    description: 'Comfortable jeans',
    images: [{ imageURL: 'https://example.com/jeans.jpg' }],
  },
  {
    itemId: 'item-3',
    name: 'Dress',
    category: 'Dresses',
    style: 'Formal',
    size: 'S',
    price: 200,
    status: 'Reserved',
    department: 'Women',
    description: 'Elegant dress',
    images: [
      { imageURL: 'https://example.com/dress1.jpg' },
      { imageURL: 'https://example.com/dress2.jpg' },
    ],
  },
  {
    itemId: 'item-4',
    name: 'Expensive Shirt',
    category: 'Tops',
    style: 'Formal',
    size: 'L',
    price: 500,
    status: 'Available',
    department: 'Men',
    images: [],
  },
];

const mockUser = {
  uid: 'user-789',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
};

const mockAuth = {
  currentUser: mockUser,
};

describe('Store Component', () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    require('react-router-dom').useNavigate = () => mockNavigate;

    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stores/store-123/items')) {
        return Promise.resolve({ data: mockClothes });
      }
      if (url.includes('/api/stores/store-123')) {
        return Promise.resolve({ data: mockStore });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  const renderStore = () => {
    return render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    test('displays loading spinner while fetching data', () => {
      axios.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderStore();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading store...')).toBeInTheDocument();
    });
  });

  describe('Store Display', () => {
    test('renders store information correctly', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Test Store')).toBeInTheDocument();
      });

      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('A test store')).toBeInTheDocument();
      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });

    test('displays "Read Reviews" button when reviews exist', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Read Reviews')).toBeInTheDocument();
      });
    });

    test('opens reviews modal when "Read Reviews" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Read Reviews')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Read Reviews'));

      await waitFor(() => {
        expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Items Display', () => {
    test('displays all available items', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      expect(screen.getByText('Jeans')).toBeInTheDocument();
      expect(screen.getByText('Dress')).toBeInTheDocument();
      expect(screen.getByText('Expensive Shirt')).toBeInTheDocument();
    });

    test('shows correct item count', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('(4 items)')).toBeInTheDocument();
      });
    });

    test('displays reserved badge on reserved items', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Reserved')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    test('filters items by category', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'Tops' } });

      await waitFor(() => {
        expect(screen.getByText('(2 items)')).toBeInTheDocument();
      });

      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.queryByText('Jeans')).not.toBeInTheDocument();
    });

    test('filters items by style', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const styleSelect = screen.getByDisplayValue('All Styles');
      fireEvent.change(styleSelect, { target: { value: 'Formal' } });

      await waitFor(() => {
        expect(screen.getByText('(2 items)')).toBeInTheDocument();
      });
    });

    test('filters items by size', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const sizeSelect = screen.getByDisplayValue('All Sizes');
      fireEvent.change(sizeSelect, { target: { value: 'M' } });

      await waitFor(() => {
        expect(screen.getByText('(1 items)')).toBeInTheDocument();
      });

      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
    });

    test('filters items by price range', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const priceInputs = screen.getAllByPlaceholderText(/Min|Max/);
      fireEvent.change(priceInputs[0], { target: { value: '100' } });
      fireEvent.change(priceInputs[1], { target: { value: '200' } });

      await waitFor(() => {
        expect(screen.getByText('(2 items)')).toBeInTheDocument();
      });

      expect(screen.queryByText('T-Shirt')).not.toBeInTheDocument();
      expect(screen.getByText('Jeans')).toBeInTheDocument();
    });

    test('shows "no items" message when filters yield no results', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const priceInputs = screen.getAllByPlaceholderText(/Min|Max/);
      fireEvent.change(priceInputs[0], { target: { value: '1000' } });

      await waitFor(() => {
        expect(screen.getByText('No items available')).toBeInTheDocument();
      });
    });

    test('clears all filters when "Clear All Filters" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const priceInputs = screen.getAllByPlaceholderText(/Min|Max/);
      fireEvent.change(priceInputs[0], { target: { value: '1000' } });

      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear All Filters'));

      await waitFor(() => {
        expect(screen.getByText('(4 items)')).toBeInTheDocument();
      });
    });
  });

  describe('Item Modal', () => {
    test('opens modal when item is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const items = screen.getAllByText('T-Shirt');
      fireEvent.click(items[0]);

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });

      expect(screen.getByText('A nice t-shirt')).toBeInTheDocument();
    });

    test('closes modal when close button is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Description')).not.toBeInTheDocument();
      });
    });

    test('navigates through images in carousel', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Dress')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Dress')[0]);

      await waitFor(() => {
        const nextButton = screen.getByText('→');
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByText('→');
      const prevButton = screen.getByText('←');

      fireEvent.click(nextButton);
      fireEvent.click(prevButton);

      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
    });
  });

  describe('Reserve Functionality', () => {
    test('reserves item successfully', async () => {
      axios.put.mockResolvedValue({ data: { reservationId: 'res-123' } });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Reserve')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reserve'));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/reserve/item-1'),
          { storeId: 'store-123' },
          { headers: { Authorization: 'Bearer mock-token' } }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-456_user-789'
      );
    });

    test('disables reserve button for reserved items', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Dress')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Dress')[0]);

      await waitFor(() => {
        const reserveButton = screen.getByText('Reserve');
        expect(reserveButton).toBeDisabled();
      });
    });

    test('handles reserve failure', async () => {
      axios.put.mockRejectedValue(new Error('Network error'));
      window.alert = jest.fn();

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Reserve')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reserve'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to reserve item')
        );
      });
    });
  });

  describe('Enquire Functionality', () => {
    test('sends enquiry successfully', async () => {
      axios.post.mockResolvedValue({ data: { messageId: 'msg-123' } });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Enquire')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Enquire'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/messages'),
          expect.objectContaining({
            receiverId: 'owner-456',
            itemId: 'item-1',
            storeId: 'store-123',
          }),
          { headers: { Authorization: 'Bearer mock-token' } }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-456_user-789'
      );
    });

    test('handles enquiry failure', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));
      window.alert = jest.fn();

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Enquire')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Enquire'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to send enquiry')
        );
      });
    });
  });

  describe('Navigation', () => {
    test('navigates back when back button is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('← Back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('← Back'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('redirects to login if user is not authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderStore();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });
});
