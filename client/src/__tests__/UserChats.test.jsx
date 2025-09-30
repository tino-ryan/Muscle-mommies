import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UserChats from '../pages/customer/UserChats';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../components/CustomerSidebar', () => (props) => (
  <div data-testid="sidebar">Sidebar active: {props.currentPage}</div>
));
jest.mock('axios');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('UserChats Page', () => {
  let mockUnsubscribeAuth;
  let mockUnsubscribeSnapshot;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribeAuth = jest.fn();
    mockUnsubscribeSnapshot = jest.fn();
    getAuth.mockReturnValue({});
    onAuthStateChanged.mockImplementation(
      (auth, callback) => mockUnsubscribeAuth
    );
    onSnapshot.mockImplementation((q, successCb, errorCb) => {
      return mockUnsubscribeSnapshot;
    });
    query.mockReturnValue('mockQuery');
    collection.mockReturnValue('mockCollection');
    where.mockReturnValue('mockWhere');
  });

  test('redirects to login if no user', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return mockUnsubscribeAuth;
    });

    render(
      <MemoryRouter>
        <UserChats />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('renders loading state initially', async () => {
    const fakeUser = {
      uid: 'user1',
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    };
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(fakeUser);
      return mockUnsubscribeAuth;
    });

    render(
      <MemoryRouter>
        <UserChats />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading chats.../i)).toBeInTheDocument();
  });

  test('renders chats when snapshot returns data', async () => {
    const fakeUser = {
      uid: 'user1',
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(fakeUser);
      return mockUnsubscribeAuth;
    });

    const fakeSnapshot = {
      docs: [
        {
          id: 'chat1',
          data: () => ({
            participants: ['user1', 'user2'],
            itemId: 'item1',
            lastMessage: 'Hello!',
            lastTimestamp: { seconds: 1633046400 },
            unreadCount: 2,
          }),
        },
      ],
    };

    onSnapshot.mockImplementation((q, successCb) => {
      successCb(fakeSnapshot);
      return mockUnsubscribeSnapshot;
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/api/items/')) {
        return Promise.resolve({ data: { name: 'Cool Jacket', images: [] } });
      }
      if (url.includes('/api/stores/users/')) {
        return Promise.resolve({ data: { displayName: 'Alice' } });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <UserChats />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Alice/i)).toBeInTheDocument();
    expect(await screen.findByText(/Cool Jacket/i)).toBeInTheDocument();
    expect(await screen.findByText(/Hello!/i)).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  test('displays error when Firestore snapshot fails', async () => {
    const fakeUser = {
      uid: 'user1',
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(fakeUser);
      return mockUnsubscribeAuth;
    });

    onSnapshot.mockImplementation((q, successCb, errorCb) => {
      errorCb({ code: 'permission-denied', message: 'Permission denied' });
      return mockUnsubscribeSnapshot;
    });

    render(
      <MemoryRouter>
        <UserChats />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Failed to fetch chats/i)
    ).toBeInTheDocument();
  });
});
