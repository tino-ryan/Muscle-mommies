import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import SearchPage from '../pages/customer/Search';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/CustomerSidebar', () => () => (
  <div data-testid="customer-sidebar">Sidebar</div>
));

jest.mock('../api', () => ({
  API_URL: 'http://mock-api.com',
}));

jest.mock('axios');
const mockedAxios = axios;

jest.mock('firebase/auth', () => {
  const original = jest.requireActual('firebase/auth');
  return {
    ...original,
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

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

describe('SearchPage', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      uid: 'user-123',
      getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
    };
    getAuth.mockReturnValue({ currentUser: mockUser });

    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(mockUser);
      return jest.fn();
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
  });

  it('navigates to login if no user', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return jest.fn();
    });
    render(<SearchPage />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('renders API error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API fail'));
    render(<SearchPage />);
    await waitFor(() =>
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument()
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

  it('opens and closes modal on item click', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    fireEvent.click(screen.getByText(/Denim Jacket/i));
    expect(screen.getByText(/Reserve Item/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '' })); // close button
    expect(screen.queryByText(/Reserve Item/i)).not.toBeInTheDocument();
  });

  it('navigates to store when clicking Go to Store', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    const storeButtons = screen.getAllByText(/Go to Store/i);
    fireEvent.click(storeButtons[0]); // or [1] depending which one is Vintage Hub
    expect(mockNavigate).toHaveBeenCalledWith('/store/s1');
  });

  it('handles image onError fallback', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    const img = screen.getByAltText('Denim Jacket');
    fireEvent.error(img);
    expect(img.src).toContain('placeholder');
  });

  it('handles reserve success', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { reservationId: 'r1' },
    });
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    fireEvent.click(screen.getByText(/Denim Jacket/i));
    await waitFor(() => screen.getByText(/Reserve Item/i));
    fireEvent.click(screen.getByText(/Reserve Item/i));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-s1_user-123'.replace('_', '_')
      )
    );
  });

  it('handles reserve failure gracefully', async () => {
    window.alert = jest.fn();
    mockedAxios.put.mockRejectedValueOnce(new Error('Reserve failed'));
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));
    fireEvent.click(screen.getByText(/Denim Jacket/i));
    fireEvent.click(screen.getByText(/Reserve Item/i));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reserve item')
      )
    );
  });

  it('handles enquire success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { messageId: 'm1' } });
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));
    fireEvent.click(screen.getByText(/Denim Jacket/i));
    fireEvent.click(screen.getByText(/Send Enquiry/i));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/user/chats/')
      )
    );
  });

  it('handles enquire failure', async () => {
    window.alert = jest.fn();
    mockedAxios.post.mockRejectedValueOnce(new Error('Enquiry failed'));
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));
    fireEvent.click(screen.getByText(/Denim Jacket/i));
    fireEvent.click(screen.getByText(/Send Enquiry/i));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send enquiry')
      )
    );
  });

  it('changes price range input', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    const minInput = screen.getAllByPlaceholderText('Min')[0];
    fireEvent.change(minInput, { target: { value: '100' } });
    expect(minInput.value).toBe('100');

    const maxInput = screen.getAllByPlaceholderText('Max')[0];
    fireEvent.change(maxInput, { target: { value: '400' } });
    expect(maxInput.value).toBe('400');
  });

  it('filters by search term (store name)', async () => {
    render(<SearchPage />);
    await waitFor(() => screen.getByText(/Denim Jacket/i));

    const searchInput = screen.getByPlaceholderText(/Search for stores/i);
    fireEvent.change(searchInput, { target: { value: 'vintage' } });

    const storeTitles = screen.getAllByText(/Vintage Hub/i);
    expect(storeTitles[0]).toBeInTheDocument();
  });
});
