import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Store from '../pages/customer/Store';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

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
jest.mock('../components/WriteReviewModal', () => {
  return function WriteReviewModal({ isOpen, onClose, onSubmit, storeName }) {
    return isOpen ? (
      <div data-testid="write-review-modal">
        <h2>Write Review for {storeName}</h2>
        <button onClick={() => onSubmit(5, 'Great store!')}>Submit</button>
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
  hours: {
    Monday: { open: true, start: '09:00', end: '17:00' },
    Tuesday: { open: true, start: '09:00', end: '17:00' },
    Wednesday: { open: true, start: '09:00', end: '17:00' },
    Thursday: { open: true, start: '09:00', end: '17:00' },
    Friday: { open: true, start: '09:00', end: '17:00' },
    Saturday: { open: false, start: '09:00', end: '17:00' },
    Sunday: { open: false, start: '09:00', end: '17:00' },
  },
  location: { lat: -26.195246, lng: 28.034088 },
  contactInfos: [],
  theme: 'theme-default',
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
    description: 'Expensive formal shirt',
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
    test('displays loading skeleton while fetching data', () => {
      axios.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderStore();
      
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
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

    test('displays "Reviews" button when reviews exist', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Reviews')).toBeInTheDocument();
      });
    });

    test('opens reviews modal when "Reviews" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Reviews')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reviews'));

      await waitFor(() => {
        expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
      });
    });

    test('opens write review modal when "Write Review" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Write Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Write Review'));

      await waitFor(() => {
        expect(screen.getByTestId('write-review-modal')).toBeInTheDocument();
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
        expect(screen.getByText(/4\s+Items/i)).toBeInTheDocument();
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
    beforeEach(() => {
      // Mock scrollIntoView
      Element.prototype.scrollIntoView = jest.fn();
    });

    test('filters items by category', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      // Open category filter modal
      const categoryButton = screen.getByText(/Category/i);
      fireEvent.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByText('Select Categories')).toBeInTheDocument();
      });

      // Select "Tops" category
      const topsCheckbox = screen.getByLabelText('Tops');
      fireEvent.click(topsCheckbox);

      // Apply filters
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/2\s+Items/i)).toBeInTheDocument();
      });

      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.queryByText('Jeans')).not.toBeInTheDocument();
    });

    test('filters items by search query', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Shirt' } });

      await waitFor(() => {
        expect(screen.getByText(/2\s+Items/i)).toBeInTheDocument();
      });

      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Expensive Shirt')).toBeInTheDocument();
      expect(screen.queryByText('Jeans')).not.toBeInTheDocument();
    });

    test('shows "no items" message when filters yield no results', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentItem' } });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
      });
    });

    test('clears all filters when "Clear All" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      // Apply a search filter
      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Shirt' } });

      await waitFor(() => {
        expect(screen.getByText(/2\s+Items/i)).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByText(/Clear All/i);
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText(/4\s+Items/i)).toBeInTheDocument();
      });
    });
  });

  describe('Item Modal', () => {


    test('navigates through images in carousel', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Dress')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Dress')[0]);

      await waitFor(() => {
        const thumbnails = document.querySelectorAll('.thumbnail');
        expect(thumbnails.length).toBe(2);
      });

      const thumbnails = document.querySelectorAll('.thumbnail');
      fireEvent.click(thumbnails[1]);

      expect(thumbnails[1]).toHaveClass('thumbnail-active');
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
        expect(screen.getByText('Reserve Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reserve Item'));

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

    test('handles reserve failure', async () => {
      axios.put.mockRejectedValue(new Error('Network error'));
      window.alert = jest.fn();

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Reserve Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reserve Item'));

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
        expect(screen.getByText('Send Enquiry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Send Enquiry'));

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
        expect(screen.getByText('Send Enquiry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Send Enquiry'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to send enquiry')
        );
      });
    });
  });

  describe('Navigation', () => {
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