import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StoreHome from '../pages/store/StoreHome';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MemoryRouter } from 'react-router-dom';

// ✅ Mock firebase.js so we don’t call real getFirestore()
jest.mock('../firebase', () => ({
  db: {},
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock Sidebar
jest.mock('../components/StoreSidebar', () => () => (
  <div data-testid="mock-sidebar">Sidebar</div>
));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('StoreHome', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'user123' };
    getAuth.mockReturnValue({});
  });

  function setupOnAuth(user) {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(user);
      return jest.fn(); // unsubscribe
    });
  }

  it('redirects to login if no user', () => {
    setupOnAuth(null);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows no store found error if query returns empty', async () => {
    setupOnAuth(mockUser);
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No store found/i)).toBeInTheDocument();
    });
  });

  it('renders KPIs and category/style data when queries succeed', async () => {
    setupOnAuth(mockUser);

    // Mock store
    getDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'store1', data: () => ({ storeName: 'Test Store' }) }],
      })
      // Sales
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ amount: 100 }) },
          { data: () => ({ amount: 200 }) },
        ],
      })
      // Reservations
      .mockResolvedValueOnce({ size: 2, docs: [] })
      // Messages
      .mockResolvedValueOnce({ size: 3, docs: [] })
      // Items
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ category: 'Shoes', style: 'Casual, Sport' }) },
          { data: () => ({ category: 'Shoes', style: 'Casual' }) },
          { data: () => ({ category: 'Shirts', style: 'Formal' }) },
        ],
      });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    // Loading first
    expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Test Store/)).toBeInTheDocument();
      expect(screen.getByText(/Total Sales/)).toBeInTheDocument();
      expect(screen.getByText(/R 300/)).toBeInTheDocument();
      expect(screen.getByText(/New Reservations/)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/Unread Chats/)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Categories
      expect(screen.getByText('Shoes').closest('.mini-card')).toHaveTextContent(
        '2 items'
      );
      expect(
        screen.getByText('Shirts').closest('.mini-card')
      ).toHaveTextContent('1 item');

      // Styles
      expect(
        screen.getByText('Casual').closest('.mini-card')
      ).toHaveTextContent('2 items');
      expect(screen.getByText('Sport').closest('.mini-card')).toHaveTextContent(
        '1 item'
      );
      expect(
        screen.getByText('Formal').closest('.mini-card')
      ).toHaveTextContent('1 item');
    });
  });

  it('shows error when fetching fails', async () => {
    setupOnAuth(mockUser);
    getDocs.mockRejectedValueOnce(new Error('Firestore failed'));

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to fetch analytics/i)
      ).toBeInTheDocument();
    });
  });
});
