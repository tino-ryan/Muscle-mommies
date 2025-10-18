import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import SearchPage from '../pages/customer/Search';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Mock react-router navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock CustomerSidebar
jest.mock('../components/CustomerSidebar', () => {
  return function MockCustomerSidebar() {
    return <div data-testid="customer-sidebar">Sidebar</div>;
  };
});

// Mock API URL
jest.mock('../api', () => ({
  API_URL: 'http://mock-api.com',
}));

// Mock axios
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
    images: [{ imageURL: 'img-url-1', isPrimary: true }],
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
    images: [],
  },
  {
    itemId: 'i3',
    name: 'Reserved Skirt',
    category: 'skirts',
    style: 'basics',
    department: "women's",
    price: 150,
    storeId: 's1',
    status: 'Reserved',
    images: [{ imageURL: 'img-url-3', isPrimary: true }],
  },
];

// Mock Firebase auth
jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  return {
    ...originalModule,
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

describe('SearchPage', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      uid: 'user-123',
      getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
    };

    getAuth.mockReturnValue({ currentUser: mockUser });

    // Mock onAuthStateChanged to immediately call callback with user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });

    mockedAxios.get.mockImplementation((url) => {
      if (url.endsWith('/api/stores'))
        return Promise.resolve({ data: mockStores });
      if (url.endsWith('/api/items'))
        return Promise.resolve({ data: mockItems });
      return Promise.reject(new Error('not found'));
    });
  });

  it('renders loading and then items', async () => {
    render(<SearchPage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/Denim Jacket/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Floral Dress/i)).toBeInTheDocument();
    expect(screen.queryByText(/Reserved Skirt/i)).not.toBeInTheDocument();
  });

  it('navigates to login if no user', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(<SearchPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('renders API error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API failure'));
    render(<SearchPage />);
    await waitFor(() =>
      expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument()
    );
  });

  it('filters items by category', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    fireEvent.change(screen.getByDisplayValue('All Categories'), {
      target: { value: 'tops' },
    });
    expect(screen.getByText(/Denim Jacket/i)).toBeInTheDocument();
    expect(screen.queryByText(/Floral Dress/i)).not.toBeInTheDocument();
  });
});
