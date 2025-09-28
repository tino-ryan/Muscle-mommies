import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import Store from '../pages/customer/Store';
import CustomerSidebar from '../../components/CustomerSidebar';
import StarRating from '../../components/StarRating';
import ReviewsModal from '../../components/ReviewsModal';
import { API_URL } from '../../api';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

// Mock axios
jest.mock('axios');

// Mock components
// Note: If CustomerSidebar, StarRating, or ReviewsModal are in a different path (e.g., '../../components/sidebar/CustomerSidebar' or '../../components/customerSidebar'),
// update the paths to match the actual file location after pulling from main.
jest.mock('../../components/CustomerSidebar', () => () => <div data-testid="customer-sidebar">CustomerSidebar</div>);
jest.mock('../../components/StarRating', () => ({ rating, reviewCount, size }) => (
  <div data-testid="star-rating">{`Rating: ${rating}, Reviews: ${reviewCount}, Size: ${size}`}</div>
));
jest.mock('../../components/ReviewsModal', () => ({ storeId, storeName, isOpen, onClose }) => (
  isOpen ? <div data-testid="reviews-modal">{`Reviews for ${storeName} (${storeId})`}</div> : null
));

// Mock fetch (for consistency, though not used)
global.fetch = jest.fn();

describe('Store', () => {
  const mockUser = { uid: 'user123', getIdToken: jest.fn(() => Promise.resolve('mock-token')) };
  const mockStore = {
    storeId: 'store1',
    name: 'Test Thrift Store',
    address: '123 Thrift St',
    description: 'A cool thrift shop',
    averageRating: 4.5,
    reviewCount: 10,
    ownerId: 'owner123',
    profileImageURL: 'https://example.com/store.jpg',
  };
  const mockItems = [
    {
      itemId: 'item1',
      name: 'Vintage Jacket',
      price: 200,
      size: 'M',
      style: 'Vintage',
      category: 'Tops',
      department: 'Unisex',
      status: 'Available',
      images: [{ imageURL: 'https://example.com/jacket.jpg', isPrimary: true }],
      description: 'A stylish vintage jacket',
    },
  ];
  const mockReviews = [
    {
      reviewId: 'review1',
      userId: 'user456',
      rating: '5',
      review: 'Amazing store!',
      createdAt: { _seconds: 1696118400, _nanoseconds: 0 },
      Name: 'Jane Doe',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: 'store1' });
    getAuth.mockReturnValue({});
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/stores/store1`) {
        return Promise.resolve({ data: mockStore });
      }
      if (url === `${API_URL}/api/stores/store1/items`) {
        return Promise.resolve({ data: mockItems });
      }
      if (url === `${API_URL}/api/reviews?storeId=store1`) {
        return Promise.resolve({ data: mockReviews });
      }
      if (url === `${API_URL}/api/users/user456`) {
        return Promise.resolve({ data: { Name: 'Jane Doe' } });
      }
      return Promise.reject(new Error('Not found'));
    });
    axios.put.mockResolvedValue({ data: { reservationId: 'res123' } });
    axios.post.mockResolvedValue({ data: { messageId: 'msg123' } });
    signOut.mockResolvedValue();
  });

  it('renders store header', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Thrift Store')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('123 Thrift St')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('A cool thrift shop')).toBeInTheDocument();
    });
  });

  it('renders customer sidebar', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('customer-sidebar')).toBeInTheDocument();
    });
  });

  it('renders star rating', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('star-rating')).toHaveTextContent('Rating: 4.5, Reviews: 10, Size: medium');
    });
  });

  it('fetches and displays items', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('R200')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Tops')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Vintage')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('M')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('(1 items)')).toBeInTheDocument();
    });
  });

  it('fetches and displays reviews in carousel', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Amazing store!')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/10\/2\/2023/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('star-rating')).toHaveTextContent('Rating: 5, Reviews: 0, Size: small');
    });
  });

  it('handles fetch errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching store, items, or reviews:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('redirects to login when user is not authenticated', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('opens item modal when item is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Vintage Jacket'));

    await waitFor(() => {
      expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Category: Tops')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Size: M')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Department: Unisex')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Price: R200')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Reserve')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Enquire')).toBeInTheDocument();
    });
  });

  it('handles reserve action in item modal', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Vintage Jacket'));
    fireEvent.click(screen.getByText('Reserve'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/api/stores/reserve/item1`,
        { storeId: 'store1' },
        { headers: { Authorization: `Bearer mock-token` } }
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user/chats/user123_owner123');
    });
  });

  it('handles enquire action in item modal', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Vintage Jacket'));
    fireEvent.click(screen.getByText('Enquire'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/stores/messages`,
        {
          receiverId: 'owner123',
          message: 'Hey, I would like to enquire about the item Vintage Jacket',
          itemId: 'item1',
          storeId: 'store1',
        },
        { headers: { Authorization: `Bearer mock-token` } }
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user/chats/user123_owner123');
    });
  });

  it('disables reserve button for reserved items', async () => {
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/stores/store1`) {
        return Promise.resolve({ data: mockStore });
      }
      if (url === `${API_URL}/api/stores/store1/items`) {
        return Promise.resolve({
          data: [{ ...mockItems[0], status: 'Reserved' }],
        });
      }
      if (url === `${API_URL}/api/reviews?storeId=store1`) {
        return Promise.resolve({ data: mockReviews });
      }
      if (url === `${API_URL}/api/users/user456`) {
        return Promise.resolve({ data: { Name: 'Jane Doe' } });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Vintage Jacket'));

    await waitFor(() => {
      expect(screen.getByText('This item is reserved')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Reserve')).toBeDisabled();
    });
  });

  it('changes filters and updates items', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('(1 items)')).toBeInTheDocument();
    });

    const categorySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(categorySelect, { target: { value: 'Pants' } });

    await waitFor(() => {
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('(0 items)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear All Filters'));

    await waitFor(() => {
      expect(screen.getByText('(1 items)')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
    });
  });

  it('navigates to home when sidebar home item is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/customer/home');
    });
  });

  it('navigates to search when sidebar search item is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
  });

  it('navigates to chats when sidebar chats item is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Chats'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user/chats');
    });
  });

  it('navigates to profile when sidebar profile item is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Profile'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/customer/profile');
    });
  });

  it('handles logout when sidebar logout item is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('navigates back when back button is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('← Back'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('opens reviews modal when read reviews button is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Read Reviews'));

    await waitFor(() => {
      expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Reviews for Test Thrift Store (store1)')).toBeInTheDocument();
    });
  });

  it('handles reviews carousel navigation', async () => {
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/stores/store1`) {
        return Promise.resolve({ data: mockStore });
      }
      if (url === `${API_URL}/api/stores/store1/items`) {
        return Promise.resolve({ data: mockItems });
      }
      if (url === `${API_URL}/api/reviews?storeId=store1`) {
        return Promise.resolve({
          data: [
            mockReviews[0],
            {
              reviewId: 'review2',
              userId: 'user789',
              rating: '4',
              review: 'Great place!',
              createdAt: { _seconds: 1696204800, _nanoseconds: 0 },
              Name: 'John Smith',
            },
          ],
        });
      }
      if (url === `${API_URL}/api/users/user456`) {
        return Promise.resolve({ data: { Name: 'Jane Doe' } });
      }
      if (url === `${API_URL}/api/users/user789`) {
        return Promise.resolve({ data: { Name: 'John Smith' } });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('→'));

    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Great place!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('←'));

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('handles no items case', async () => {
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/stores/store1`) {
        return Promise.resolve({ data: mockStore });
      }
      if (url === `${API_URL}/api/stores/store1/items`) {
        return Promise.resolve({ data: [] });
      }
      if (url === `${API_URL}/api/reviews?storeId=store1`) {
        return Promise.resolve({ data: mockReviews });
      }
      if (url === `${API_URL}/api/users/user456`) {
        return Promise.resolve({ data: { Name: 'Jane Doe' } });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('(0 items)')).toBeInTheDocument();
    });
  });

  it('handles no reviews case', async () => {
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/stores/store1`) {
        return Promise.resolve({ data: { ...mockStore, reviewCount: 0, averageRating: 0 } });
      }
      if (url === `${API_URL}/api/stores/store1/items`) {
        return Promise.resolve({ data: mockItems });
      }
      if (url === `${API_URL}/api/reviews?storeId=store1`) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText('Read Reviews')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('star-rating')).toHaveTextContent('Rating: 0, Reviews: 0, Size: medium');
    });
  });

  it('handles missing store data fields', async () => {
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/stores/store1`) {
        return Promise.resolve({ data: { storeId: 'store1', ownerId: 'owner123' } });
      }
      if (url === `${API_URL}/api/stores/store1/items`) {
        return Promise.resolve({ data: mockItems });
      }
      if (url === `${API_URL}/api/reviews?storeId=store1`) {
        return Promise.resolve({ data: mockReviews });
      }
      if (url === `${API_URL}/api/users/user456`) {
        return Promise.resolve({ data: { Name: 'Jane Doe' } });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Vintage Jacket')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('closes item modal when close button is clicked', async () => {
    render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Vintage Jacket'));

    await waitFor(() => {
      expect(screen.getByText('Category: Tops')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('×'));

    await waitFor(() => {
      expect(screen.queryByText('Category: Tops')).not.toBeInTheDocument();
    });
  });
});