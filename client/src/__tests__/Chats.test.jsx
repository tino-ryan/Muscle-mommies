import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Chats from '../pages/store/Chats';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import axios from 'axios';

// Mocks
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('axios');

jest.mock('../components/StoreSidebar', () => ({ currentPage, onLogout }) => (
  <div data-testid="store-sidebar">
    <span>Current Page: {currentPage}</span>
    <button onClick={onLogout}>Logout</button>
  </div>
));

// Mock react-spinners with a try-catch to handle missing module
jest.mock(
  'react-spinners',
  () => {
    try {
      return {
        ClipLoader: ({ color, size }) => (
          <div data-testid="clip-loader" data-color={color} data-size={size}>
            Loading...
          </div>
        ),
      };
    } catch (error) {
      // If react-spinners is not available, provide a fallback mock
      return {
        ClipLoader: () => <div data-testid="clip-loader">Loading...</div>,
      };
    }
  },
  { virtual: true }
);

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderChats = () =>
  render(
    <BrowserRouter>
      <Chats />
    </BrowserRouter>
  );

describe('Chats', () => {
  const mockAuth = {
    signOut: jest.fn(),
  };

  const mockUser = {
    uid: 'user123',
    getIdToken: jest.fn().mockResolvedValue('fake-token'),
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

      renderChats();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('shows login error when not authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderChats();

      await waitFor(() => {
        expect(screen.getByText('Please log in.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when fetching data', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        // Don't call the callback immediately to keep loading state
        return jest.fn();
      });

      renderChats();

      expect(screen.getByTestId('clip-loader')).toBeInTheDocument();
      expect(screen.getByText('Loading chats...')).toBeInTheDocument();
    });
  });

  describe('Chat List Rendering', () => {
    const mockChatData = [
      {
        id: 'chat1',
        participants: ['user123', 'other1'],
        itemId: 'item1',
        lastMessage: 'Hello, is this still available?',
        lastTimestamp: { seconds: Date.now() / 1000 },
        unreadCount: 2,
      },
      {
        id: 'chat2',
        participants: ['user123', 'other2'],
        itemId: 'item2',
        lastMessage: 'Thanks!',
        lastTimestamp: { seconds: Date.now() / 1000 - 86400 }, // 1 day ago
        unreadCount: 0,
      },
    ];

    const mockItemData = {
      item1: {
        name: 'Vintage Jacket',
        images: [{ imageURL: 'http://example.com/jacket.jpg' }],
      },
      item2: {
        name: 'Retro Shoes',
        images: [],
      },
    };

    const mockUserData = {
      other1: { displayName: 'John Doe', email: 'john@example.com' },
      other2: { displayName: 'Jane Smith', email: 'jane@example.com' },
    };

    beforeEach(() => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/items/item1')) {
          return Promise.resolve({ data: mockItemData.item1 });
        }
        if (url.includes('/api/items/item2')) {
          return Promise.resolve({ data: mockItemData.item2 });
        }
        if (url.includes('/api/stores/users/other1')) {
          return Promise.resolve({ data: mockUserData.other1 });
        }
        if (url.includes('/api/stores/users/other2')) {
          return Promise.resolve({ data: mockUserData.other2 });
        }
        return Promise.reject(new Error('Not found'));
      });
    });

    it('shows unread badge for chats with unread messages', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'chat1',
              data: () => ({
                participants: ['user123', 'other1'],
                itemId: 'item1',
                lastMessage: 'Hello',
                lastTimestamp: { seconds: Date.now() / 1000 },
                unreadCount: 3,
              }),
            },
          ],
        };

        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      renderChats();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(
          screen.getByText('3').closest('.unread-badge')
        ).toBeInTheDocument();
      });
    });

    it('shows no chats message when chat list is empty', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = { docs: [] };
        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      renderChats();

      await waitFor(() => {
        expect(
          screen.getByText(
            'No chats available. Customers will start conversations from item pages.'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    const mockChatWithSearch = [
      {
        id: 'chat1',
        participants: ['user123', 'other1'],
        itemId: 'item1',
        lastMessage: 'Hello about the vintage jacket',
        lastTimestamp: { seconds: Date.now() / 1000 },
        unreadCount: 0,
      },
    ];

    beforeEach(() => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/items/item1')) {
          return Promise.resolve({
            data: { name: 'Vintage Jacket', images: [] },
          });
        }
        if (url.includes('/api/stores/users/other1')) {
          return Promise.resolve({
            data: { displayName: 'John Vintage', email: 'john@example.com' },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = {
          docs: mockChatWithSearch.map((chat) => ({
            id: chat.id,
            data: () => ({
              participants: chat.participants,
              itemId: chat.itemId,
              lastMessage: chat.lastMessage,
              lastTimestamp: chat.lastTimestamp,
              unreadCount: chat.unreadCount,
            }),
          })),
        };

        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });
    });

    it('filters chats by message content', async () => {
      renderChats();

      await waitFor(() => {
        expect(
          screen.getByText('Hello about the vintage jacket')
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search items or customers...'
      );
      fireEvent.change(searchInput, { target: { value: 'hello' } });

      expect(
        screen.getByText('Hello about the vintage jacket')
      ).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats timestamps correctly', async () => {
      const now = new Date();
      const today = Math.floor(now.getTime() / 1000);
      const yesterday = today - 86400; // 24 hours ago

      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'chat1',
              data: () => ({
                participants: ['user123', 'other1'],
                lastMessage: 'Today message',
                lastTimestamp: { seconds: today },
                unreadCount: 0,
              }),
            },
            {
              id: 'chat2',
              data: () => ({
                participants: ['user123', 'other2'],
                lastMessage: 'Yesterday message',
                lastTimestamp: { seconds: yesterday },
                unreadCount: 0,
              }),
            },
            {
              id: 'chat3',
              data: () => ({
                participants: ['user123', 'other3'],
                lastMessage: 'No timestamp',
                unreadCount: 0,
              }),
            },
          ],
        };

        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/users/other1')) {
          return Promise.resolve({ data: { displayName: 'User One' } });
        }
        if (url.includes('/api/stores/users/other2')) {
          return Promise.resolve({ data: { displayName: 'User Two' } });
        }
        if (url.includes('/api/stores/users/other3')) {
          return Promise.resolve({ data: { displayName: 'User Three' } });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderChats();

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByText('User Three')).toBeInTheDocument();
      });

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore errors', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        const mockError = {
          code: 'permission-denied',
          message: 'Insufficient permissions',
        };
        setTimeout(() => errorCallback(mockError), 100);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderChats();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to fetch chats: Insufficient permissions')
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Firestore error:',
        'permission-denied',
        'Insufficient permissions'
      );

      consoleSpy.mockRestore();
    });

    it('handles API errors gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'chat1',
              data: () => ({
                participants: ['user123', 'other1'],
                itemId: 'item1',
                lastMessage: 'Hello',
                lastTimestamp: { seconds: Date.now() / 1000 },
                unreadCount: 0,
              }),
            },
          ],
        };

        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/items/item1')) {
          return Promise.reject(new Error('Item not found'));
        }
        if (url.includes('/api/stores/users/other1')) {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.reject(new Error('API Error'));
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderChats();

      await waitFor(() => {
        expect(screen.getByText('Unknown User')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch user other1:',
        'User not found'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout correctly', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = { docs: [] };
        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      renderChats();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(mockAuth.signOut).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('UI Elements', () => {
    it('renders sidebar with correct props', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = { docs: [] };
        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      renderChats();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
        expect(screen.getByText('Current Page: Chats')).toBeInTheDocument();
      });
    });

    it('displays default avatar when no item image available', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = {
          docs: [
            {
              id: 'chat1',
              data: () => ({
                participants: ['user123', 'other1'],
                itemId: 'item1',
                lastMessage: 'Hello',
                lastTimestamp: { seconds: Date.now() / 1000 },
                unreadCount: 0,
              }),
            },
          ],
        };

        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/items/item1')) {
          return Promise.resolve({
            data: { name: 'Test Item', images: [] }, // No images
          });
        }
        if (url.includes('/api/stores/users/other1')) {
          return Promise.resolve({
            data: { displayName: 'Test User' },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderChats();

      await waitFor(() => {
        expect(screen.getByText('👤')).toBeInTheDocument();
      });
    });
  });
});
