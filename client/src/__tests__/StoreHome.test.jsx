import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreHome from '../pages/store/StoreHome';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mocks
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderStoreHome = () =>
  render(
    <BrowserRouter>
      <StoreHome />
    </BrowserRouter>
  );

describe('StoreHome', () => {
  const mockAuth = {
    signOut: jest.fn(),
  };

  const mockUser = {
    uid: 'user123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    mockAuth.signOut.mockResolvedValue();
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return jest.fn();
      });

      renderStoreHome();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('checks store existence when user is authenticated', async () => {
      const mockQuerySnapshot = { empty: false };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(collection).toHaveBeenCalledWith({}, 'stores');
        expect(where).toHaveBeenCalledWith('ownerId', '==', 'user123');
        expect(getDocs).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading message while checking store existence', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      // Don't resolve getDocs to keep loading state
      getDocs.mockImplementation(() => new Promise(() => {}));

      renderStoreHome();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Store Setup Flow', () => {
    it('shows setup message when store does not exist', async () => {
      const mockQuerySnapshot = { empty: true };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Welcome, Store Owner!')).toBeInTheDocument();
        expect(
          screen.getByText(
            "You don't have a store set up yet. Let's get started!"
          )
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Set Up Store')).toBeInTheDocument();
    });

    it('navigates to store profile when setup button is clicked', async () => {
      const mockQuerySnapshot = { empty: true };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Set Up Store')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Up Store'));

      expect(mockNavigate).toHaveBeenCalledWith('/store/profile');
    });
  });

  describe('Store Dashboard', () => {
    beforeEach(async () => {
      const mockQuerySnapshot = { empty: false };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);
    });

    it('shows dashboard when store exists', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Your Store Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Listings')).toBeInTheDocument();
      expect(screen.getByText('Reservations')).toBeInTheDocument();
      expect(screen.getByText('Chats')).toBeInTheDocument();
      expect(screen.getByText('Store Profile')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('navigates to listings when listings card is clicked', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Listings')).toBeInTheDocument();
      });

      const listingsCard = screen.getByText('Listings').closest('.card');
      fireEvent.click(listingsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
    });

    it('navigates to reservations when reservations card is clicked', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Reservations')).toBeInTheDocument();
      });

      const reservationsCard = screen
        .getByText('Reservations')
        .closest('.card');
      fireEvent.click(reservationsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/store/reservations');
    });

    it('navigates to chats when chats card is clicked', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Chats')).toBeInTheDocument();
      });

      const chatsCard = screen.getByText('Chats').closest('.card');
      fireEvent.click(chatsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/store/chats');
    });

    it('navigates to store profile when profile card is clicked', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Store Profile')).toBeInTheDocument();
      });

      const profileCard = screen.getByText('Store Profile').closest('.card');
      fireEvent.click(profileCard);

      expect(mockNavigate).toHaveBeenCalledWith('/store/profile');
    });

    it('handles logout when logout card is clicked', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutCard = screen.getByText('Logout').closest('.card');
      fireEvent.click(logoutCard);

      await waitFor(() => {
        expect(mockAuth.signOut).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('displays correct card descriptions', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Your Store Dashboard')).toBeInTheDocument();
      });

      expect(
        screen.getByText("Manage your store's inventory and listings")
      ).toBeInTheDocument();
      expect(
        screen.getByText('View and manage customer reservations')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Communicate with your customers')
      ).toBeInTheDocument();
      expect(
        screen.getByText("Edit your store's details and contact info")
      ).toBeInTheDocument();
      expect(screen.getByText('Sign out of your account')).toBeInTheDocument();
    });

    it('renders all dashboard cards with proper structure', async () => {
      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Your Store Dashboard')).toBeInTheDocument();
      });

      const cards = document.querySelectorAll('.card');
      expect(cards).toHaveLength(5); // Listings, Reservations, Chats, Profile, Logout

      // Check that each card has an SVG icon
      cards.forEach((card) => {
        const svg = card.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when Firestore query fails', async () => {
      const errorMessage = 'Permission denied';

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockRejectedValue(new Error(errorMessage));

      renderStoreHome();

      await waitFor(() => {
        expect(
          screen.getByText(`Failed to check store existence: ${errorMessage}`)
        ).toBeInTheDocument();
      });
    });

    it('handles authentication state changes properly', () => {
      const unsubscribeMock = jest.fn();

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return unsubscribeMock;
      });

      const { unmount } = renderStoreHome();
      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Component State Management', () => {
    it('initializes with loading state', () => {
      onAuthStateChanged.mockImplementation(() => jest.fn());

      renderStoreHome();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('updates state correctly when store exists', async () => {
      const mockQuerySnapshot = { empty: false };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Your Store Dashboard')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Welcome, Store Owner!')
      ).not.toBeInTheDocument();
    });

    it('updates state correctly when store does not exist', async () => {
      const mockQuerySnapshot = { empty: true };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Welcome, Store Owner!')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Your Store Dashboard')
      ).not.toBeInTheDocument();
    });
  });

  describe('Firestore Integration', () => {
    it('constructs correct Firestore query', async () => {
      const mockQuerySnapshot = { empty: false };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(collection).toHaveBeenCalledWith({}, 'stores');
        expect(where).toHaveBeenCalledWith('ownerId', '==', 'user123');
        expect(query).toHaveBeenCalled();
      });
    });

    it('handles empty query results correctly', async () => {
      const mockQuerySnapshot = { empty: true };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Welcome, Store Owner!')).toBeInTheDocument();
      });
    });

    it('handles non-empty query results correctly', async () => {
      const mockQuerySnapshot = { empty: false };

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      getDocs.mockResolvedValue(mockQuerySnapshot);

      renderStoreHome();

      await waitFor(() => {
        expect(screen.getByText('Your Store Dashboard')).toBeInTheDocument();
      });
    });
  });
});
