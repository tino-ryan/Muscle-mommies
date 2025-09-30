import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import SearchPage from '../pages/customer/Search'; // Adjust path as needed

// Mock external dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockIdToken = 'mock-id-token';
const mockUser = {
  uid: 'user-123',
  getIdToken: jest.fn(() => Promise.resolve(mockIdToken)),
};
const mockAuth = {
  currentUser: mockUser,
};
jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
}));

jest.mock('../components/CustomerSidebar', () => {
  return function MockCustomerSidebar() {
    return <div data-testid="customer-sidebar">Sidebar</div>;
  };
});

jest.mock('../api', () => ({
  API_URL: 'http://mock-api.com',
}));

jest.mock('axios');
const mockedAxios = axios;

// Mock data
const mockStores = [
  {
    storeId: 's1',
    storeName: 'Vintage Hub',
    address: '123 Main St',
    description: 'Old school cool',
    ownerId: 'owner-s1',
  },
  {
    storeId: 's2',
    storeName: 'Street Style',
    address: '456 Oak Ave',
    description: 'Modern fits',
    ownerId: 'owner-s2',
  },
];

const mockItems = [
  {
    itemId: 'i1',
    name: 'Denim Jacket',
    category: 'tops',
    style: 'vintage',
    department: "men's",
    price: 350,
    storeId: 's1',
    status: 'Available',
    quantity: 5,
    description: 'A classic denim jacket.',
    images: [
      { imageURL: 'img-url-1', isPrimary: true },
      { imageURL: 'img-url-2' },
    ],
  },
  {
    itemId: 'i2',
    name: 'Floral Dress',
    category: 'dresses',
    style: 'y2k',
    department: "women's",
    price: 200,
    storeId: 's2',
    status: 'Available',
    quantity: 2,
    description: 'A brightly colored floral dress.',
    images: [], // No images
  },
  {
    itemId: 'i3',
    name: 'Reserved Skirt',
    category: 'skirts',
    style: 'basics',
    department: "women's",
    price: 150,
    storeId: 's1',
    status: 'Reserved', // Should not show initially
    description: 'A simple black skirt.',
    images: [{ imageURL: 'img-url-3', isPrimary: true }],
  },
];

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = mockUser;

    mockedAxios.get.mockImplementation((url) => {
      if (url.endsWith('/api/stores'))
        return Promise.resolve({ data: mockStores });
      if (url.endsWith('/api/items'))
        return Promise.resolve({ data: mockItems });
      return Promise.reject(new Error('not found'));
    });
  });

  // --- Initial Loading and Auth Tests ---

  it('renders loading and then items', async () => {
    render(<SearchPage />);
    expect(screen.getByText(/Loading items.../i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/Loading items.../i)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/Denim Jacket/i)).toBeInTheDocument();
    expect(screen.getByText(/Floral Dress/i)).toBeInTheDocument();
    expect(screen.queryByText(/Reserved Skirt/i)).not.toBeInTheDocument();
  });

  it('navigates to login if no user', async () => {
    mockAuth.currentUser = null;
    render(<SearchPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('renders API error', async () => {
    mockedAxios.get.mockRejectedValue({
      response: { data: { error: 'Test API Failure' } },
    });
    render(<SearchPage />);
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to load data: Test API Failure/i)
      ).toBeInTheDocument();
    });
  });

  // --- Filtering and Search Tests ---

  it('filters items by category', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText('Denim Jacket'));

    // Grab first select (category)
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    fireEvent.change(categorySelect, { target: { value: 'tops' } });

    expect(screen.getByText('Denim Jacket')).toBeInTheDocument();
    expect(screen.queryByText('Floral Dress')).not.toBeInTheDocument();
  });

  it('filters by price', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText('Denim Jacket'));
    const maxInput = screen.getByPlaceholderText('Max');
    fireEvent.change(maxInput, { target: { value: '250' } });

    expect(screen.queryByText('Denim Jacket')).not.toBeInTheDocument();
    expect(screen.getByText('Floral Dress')).toBeInTheDocument();
  });

  // --- Modal and Action Tests ---

  it('handles item reservation successfully', async () => {
    mockedAxios.put.mockResolvedValue({ data: { reservationId: 'res-123' } });

    render(<SearchPage />);
    await waitFor(() =>
      expect(screen.getByText('Denim Jacket')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Denim Jacket'));
    fireEvent.click(screen.getByRole('button', { name: 'Reserve' }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://mock-api.com/api/stores/reserve/i1',
        { storeId: 's1' },
        { headers: { Authorization: `Bearer ${mockIdToken}` } }
      );
    });

    // Check item status update
    await waitFor(() => {
      expect(screen.getByText('This item is reserved')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reserve' })).toBeDisabled();
    });

    // Check navigation to chat
    await waitFor(() => {
      // user-123 and owner-s1 sorted and joined
      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-s1_user-123'
      );
    });
  });

  it('handles item enquiry successfully', async () => {
    mockedAxios.post.mockResolvedValue({ data: { messageId: 'msg-123' } });

    render(<SearchPage />);
    await waitFor(() =>
      expect(screen.getByText('Denim Jacket')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Denim Jacket'));
    fireEvent.click(screen.getByRole('button', { name: 'Enquire' }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://mock-api.com/api/stores/messages',
        expect.objectContaining({
          receiverId: 'owner-s1',
          message: 'Hey, I would like to enquire about the item Denim Jacket',
          itemId: 'i1',
          storeId: 's1',
        }),
        expect.anything()
      );
    });

    // Check navigation to chat
    await waitFor(() => {
      // user-123 and owner-s1 sorted and joined
      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-s1_user-123'
      );
    });
  });
});
