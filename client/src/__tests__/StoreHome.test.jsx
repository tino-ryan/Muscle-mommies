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

    // Setup default Firestore mock implementations
    collection.mockImplementation(() => ({}));
    query.mockImplementation((...args) => args);
    where.mockImplementation(() => ({}));
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
        screen.getByText(/Failed to fetch critical data/i)
      ).toBeInTheDocument();
    });
  });
});
