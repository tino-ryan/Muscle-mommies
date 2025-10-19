import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChatWindow from '../pages/ChatWindow';
import { getAuth } from 'firebase/auth';
import { onSnapshot, getDoc } from 'firebase/firestore';
import axios from 'axios';

// Mocks
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('axios');

// Mock window.open
global.open = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderChatWindow = (chatId = 'user1_user2') => {
  return render(
    <MemoryRouter initialEntries={[`/chat/${chatId}`]}>
      <Routes>
        <Route path="/chat/:chatId" element={<ChatWindow />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ChatWindow', () => {
  const mockAuth = {
    currentUser: {
      uid: 'user1',
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
  };

  const mockMessages = [
    {
      id: 'msg1',
      messageId: 'msg1',
      chatId: 'user1_user2',
      senderId: 'user1',
      receiverId: 'user2',
      message: 'Hello!',
      timestamp: { toDate: () => new Date('2025-09-29T10:00:00') },
      read: true,
    },
    {
      id: 'msg2',
      messageId: 'msg2',
      chatId: 'user1_user2',
      senderId: 'user2',
      receiverId: 'user1',
      message: 'Hi there!',
      timestamp: { toDate: () => new Date('2025-09-29T10:01:00') },
      read: false,
    },
  ];

  const mockChatData = {
    participants: ['user1', 'user2'],
    itemId: 'item123',
    storeId: 'store123',
    lastMessage: 'Hi there!',
    lastTimestamp: { seconds: Date.now() / 1000 },
  };

  const mockItemData = {
    itemId: 'item123',
    name: 'Vintage Jacket',
    price: 150,
    status: 'Available',
    description: 'Beautiful vintage jacket',
    category: 'Clothing',
    size: 'M',
    images: [{ imageURL: 'http://example.com/jacket.jpg' }],
  };

  const mockStoreData = {
    storeId: 'store123',
    storeName: 'Vintage Store',
    address: '123 Main St, Cape Town',
    location: { lat: '-33.9249', lng: '18.4241' },
    profileImageURL: 'http://example.com/store.jpg',
    hours: {
      Monday: { open: true, start: '09:00', end: '17:00' },
      Tuesday: { open: true, start: '09:00', end: '17:00' },
      Wednesday: { open: true, start: '09:00', end: '17:00' },
      Thursday: { open: true, start: '09:00', end: '17:00' },
      Friday: { open: true, start: '09:00', end: '17:00' },
      Saturday: { open: false },
      Sunday: { open: false },
    },
  };

  const mockContactData = [
    { id: 1, type: 'email', value: 'store@example.com' },
    { id: 2, type: 'phone', value: '+27123456789' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);

    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stores/users/user2')) {
        return Promise.resolve({ data: { displayName: 'John Doe' } });
      }
      if (url.includes('/api/items/item123')) {
        return Promise.resolve({ data: mockItemData });
      }
      if (url.includes('/api/stores/store123')) {
        return Promise.resolve({ data: mockStoreData });
      }
      if (url.includes('/api/stores/contact-infos')) {
        return Promise.resolve({ data: mockContactData });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.post.mockImplementation((url) => {
      if (url.includes('/api/auth/getRole')) {
        return Promise.resolve({ data: { role: 'customer' } });
      }
      if (url.includes('/api/stores/messages')) {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.put.mockResolvedValue({});

    // Setup Firestore mocks
    onSnapshot.mockImplementation((query, successCallback) => {
      const mockSnapshot = {
        docs: mockMessages.map((msg) => ({
          id: msg.id,
          data: () => ({ ...msg }),
        })),
      };
      setTimeout(() => successCallback(mockSnapshot), 100);
      return jest.fn(); // Unsubscribe function
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockChatData,
    });
  });

  // Rest of the test cases remain unchanged
  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      getAuth.mockReturnValue({ currentUser: null });

      renderChatWindow();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Chat Rendering', () => {
    it('renders chat header with other user name', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('Chat with John Doe')).toBeInTheDocument();
      });
    });

    it('renders messages correctly', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
      });
    });

    it('shows sent and received message styles', async () => {
      renderChatWindow();

      await waitFor(() => {
        const messages = document.querySelectorAll('.message');
        expect(messages[0]).toHaveClass('sent');
        expect(messages[1]).toHaveClass('received');
      });
    });

    it('shows read indicators for sent messages', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('✓✓')).toBeInTheDocument(); // Read message
      });
    });

    it('shows empty state when no messages', async () => {
      onSnapshot.mockImplementation((query, successCallback) => {
        const mockSnapshot = { docs: [] };
        setTimeout(() => successCallback(mockSnapshot), 100);
        return jest.fn();
      });

      renderChatWindow();

      await waitFor(() => {
        expect(
          screen.getByText('No messages yet. Start the conversation!')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Message Sending', () => {
    it('sends message successfully', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Type a message...')
        ).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'New message' } });

      fireEvent.click(screen.getByText('Send'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/messages'),
          expect.objectContaining({
            receiverId: 'user2',
            message: 'New message',
          }),
          expect.objectContaining({
            headers: { Authorization: 'Bearer fake-token' },
          })
        );
      });

      expect(input).toHaveValue('');
    });

    it('does not send empty messages', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('Send')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Send'));

      expect(axios.post).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/stores/messages'),
        expect.anything(),
        expect.anything()
      );
    });

    it('handles message send error', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/api/stores/messages')) {
          return Promise.reject(new Error('Send failed'));
        }
        return Promise.resolve({ data: { role: 'customer' } });
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderChatWindow();

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, { target: { value: 'Test message' } });
        fireEvent.click(screen.getByText('Send'));
      });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to send message: Send failed')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Suggestion Chips', () => {
    it('shows customer suggestions for customer role', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('Is this item available?')).toBeInTheDocument();
        expect(
          screen.getByText('What is the condition like?')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Can I reserve for pickup?')
        ).toBeInTheDocument();
      });
    });

    it('shows owner suggestions for store owner role', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('/api/auth/getRole')) {
          return Promise.resolve({ data: { role: 'storeOwner' } });
        }
        return Promise.resolve({ data: { success: true } });
      });

      renderChatWindow();

      await waitFor(() => {
        expect(
          screen.getByText('Yes, available for pickup.')
        ).toBeInTheDocument();
        expect(screen.getByText('Condition is excellent.')).toBeInTheDocument();
        expect(screen.getByText('Reserved! See you soon.')).toBeInTheDocument();
      });
    });

    it('fills input when suggestion is clicked', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('Is this item available?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Is this item available?'));

      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toHaveValue('Is this item available?');
    });
  });

  describe('Drawer Functionality', () => {
    it('displays item details in drawer', async () => {
      renderChatWindow();

      await waitFor(() => {
        fireEvent.click(
          screen.getByText('Chat with John Doe').closest('.chat-header')
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Vintage Jacket/)).toBeInTheDocument();
        expect(screen.getByText(/R150.00/)).toBeInTheDocument();
        expect(
          screen.getByText(/Beautiful vintage jacket/)
        ).toBeInTheDocument();
      });
    });

    it('displays store information in drawer', async () => {
      renderChatWindow();

      await waitFor(() => {
        fireEvent.click(
          screen.getByText('Chat with John Doe').closest('.chat-header')
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Vintage Store')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, Cape Town')).toBeInTheDocument();
      });
    });

    it('displays operating hours', async () => {
      renderChatWindow();

      await waitFor(() => {
        fireEvent.click(
          screen.getByText('Chat with John Doe').closest('.chat-header')
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Mon–Fri:')).toBeInTheDocument();
        expect(screen.getByText('09:00–17:00')).toBeInTheDocument();
      });
    });

    it('opens Google Maps for directions', async () => {
      renderChatWindow();

      await waitFor(() => {
        fireEvent.click(
          screen.getByText('Chat with John Doe').closest('.chat-header')
        );
      });

      await waitFor(() => {
        const directionsBtn = screen.getByText('Get Directions');
        fireEvent.click(directionsBtn);
      });

      expect(global.open).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=-33.9249,18.4241',
        '_blank'
      );
    });
  });

  describe('Message Read Status', () => {
    it('marks unread messages as read', async () => {
      renderChatWindow();

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/chats/user1_user2/read'),
          {},
          expect.objectContaining({
            headers: { Authorization: 'Bearer fake-token' },
          })
        );
      });
    });

    it('handles read status update error', async () => {
      axios.put.mockRejectedValueOnce(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderChatWindow();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to mark messages as read:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      onSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        setTimeout(
          () =>
            errorCallback({
              code: 'permission-denied',
              message: 'Access denied',
            }),
          100
        );
        return jest.fn();
      });

      renderChatWindow();

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load messages: Access denied/)
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('handles missing chat document', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      renderChatWindow();

      await waitFor(() => {
        expect(screen.getByText('Chat not found')).toBeInTheDocument();
      });
    });

    it('handles item fetch error', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/items/item123')) {
          return Promise.reject({
            response: { status: 404 },
            message: 'Item not found',
          });
        }
        if (url.includes('/api/stores/users/user2')) {
          return Promise.resolve({ data: { displayName: 'John Doe' } });
        }
        return Promise.reject(new Error('Not found'));
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderChatWindow();

      await waitFor(() => {
        fireEvent.click(
          screen.getByText('Chat with John Doe').closest('.chat-header')
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/No linked item available/)
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('handles store fetch error', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store123')) {
          return Promise.reject(new Error('Store not found'));
        }
        if (url.includes('/api/stores/users/user2')) {
          return Promise.resolve({ data: { displayName: 'John Doe' } });
        }
        if (url.includes('/api/items/item123')) {
          return Promise.resolve({ data: mockItemData });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderChatWindow();

      await waitFor(() => {
        fireEvent.click(
          screen.getByText('Chat with John Doe').closest('.chat-header')
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText('Store not found: Store not found')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is clicked', () => {
      renderChatWindow();

      fireEvent.click(screen.getByText('← Back'));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats timestamps correctly', async () => {
      renderChatWindow();

      await waitFor(() => {
        const timestamps = document.querySelectorAll('.timestamp');
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });
  });
});
