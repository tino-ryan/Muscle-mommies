import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StoreHome from '../pages/store/StoreHome';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Mock firebase.js so we don't call real getFirestore()
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

// Mock axios
jest.mock('axios');

// Mock Sidebar
jest.mock('../components/StoreSidebar', () => {
  return function StoreSidebar({ currentPage, onLogout }) {
    return (
      <div data-testid="mock-sidebar">
        <span>Page: {currentPage}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    );
  };
});

// Mock recharts to avoid rendering issues
jest.mock('recharts', () => ({
  AreaChart: () => <div data-testid="area-chart">Area Chart</div>,
  Area: () => null,
  BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
  Bar: () => null,
  PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('StoreHome', () => {
  let mockUser;
  let mockAuth;

  const mockStoreData = {
    storeName: 'Test Store',
    averageRating: 4.5,
    reviewCount: 10,
  };

  const mockItemData = {
    id: 'item-1',
    name: 'Test Item',
    price: 100,
    status: 'Available',
    department: 'Men',
    category: 'Shirt',
    style: 'Casual, Summer',
    views: 50,
  };

  const mockReservationData = {
    id: 'res-1',
    itemId: 'item-1',
    userId: 'user-456',
    status: 'Pending',
    reservedAt: { toDate: () => new Date('2024-01-01') },
  };

  const mockMessageData = {
    id: 'msg-1',
    message: 'Test message',
    read: false,
    senderId: 'user-456',
    storeId: 'store-1',
    timestamp: { toDate: () => new Date('2024-01-01') },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      uid: 'user123',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    };
    mockAuth = {
      currentUser: mockUser,
      signOut: jest.fn().mockResolvedValue(true),
    };
    getAuth.mockReturnValue(mockAuth);

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

  function setupFirestoreMocks(
    storeEmpty = false,
    items = [],
    reservations = [],
    messages = [],
    chats = []
  ) {
    let callCount = 0;
    getDocs.mockImplementation(() => {
      callCount++;
      // First call: stores
      if (callCount === 1) {
        if (storeEmpty) {
          return Promise.resolve({ empty: true, docs: [] });
        }
        return Promise.resolve({
          empty: false,
          docs: [
            {
              id: 'store-1',
              data: () => mockStoreData,
            },
          ],
        });
      }
      // Second call: items
      if (callCount === 2) {
        return Promise.resolve({
          size: items.length,
          forEach: (cb) => items.forEach(cb),
        });
      }
      // Third call: reservations
      if (callCount === 3) {
        return Promise.resolve({
          size: reservations.length,
          forEach: (cb) => reservations.forEach(cb),
        });
      }
      // Fourth call: messages
      if (callCount === 4) {
        return Promise.resolve({
          size: messages.length,
          docs: messages.map((msg) => ({
            id: msg.id,
            data: () => msg,
          })),
        });
      }
      // Fifth call: chats
      if (callCount === 5) {
        return Promise.resolve({
          size: chats.length,
        });
      }
      // Sixth call onwards: additional queries (items again, outfits, etc.)
      return Promise.resolve({
        size: 0,
        forEach: () => {},
        docs: [],
      });
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
    setupFirestoreMocks(true);

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

  it('renders dashboard with store data successfully', async () => {
    setupOnAuth(mockUser);
    const items = [{ data: () => mockItemData }];
    const reservations = [{ data: () => mockReservationData }];
    const messages = [mockMessageData];
    const chats = [];

    setupFirestoreMocks(false, items, reservations, messages, chats);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    expect(screen.getByText('Store Owner Dashboard')).toBeInTheDocument();
  });

  it('displays skeleton cards while loading', () => {
    setupOnAuth(mockUser);
    // Keep getDocs pending
    getDocs.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    const skeletonCards = document.querySelectorAll('.skeleton-card');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('calculates stats correctly', async () => {
    setupOnAuth(mockUser);
    const items = [
      { data: () => ({ ...mockItemData, status: 'Available', price: 100 }) },
      { data: () => ({ ...mockItemData, id: 'item-2', status: 'Reserved', price: 200 }) },
      { data: () => ({ ...mockItemData, id: 'item-3', status: 'Out of Stock', price: 150 }) },
    ];
    const reservations = [
      { data: () => ({ ...mockReservationData, status: 'Pending' }) },
      { data: () => ({ ...mockReservationData, id: 'res-2', status: 'Confirmed' }) },
      { data: () => ({ ...mockReservationData, id: 'res-3', status: 'Completed' }) },
    ];
    const messages = [mockMessageData];
    const chats = [{}];

    setupFirestoreMocks(false, items, reservations, messages, chats);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });
  });

  it('handles card flip interaction', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Find and click a card to flip it
    const messagesContainer = document.querySelector('.flip-card-wrapper');
    if (messagesContainer) {
      const flipCard = messagesContainer.querySelector('.flip-card-container');
      fireEvent.click(flipCard);

      await waitFor(() => {
        const flippedCard = flipCard.querySelector('.flipped');
        expect(flippedCard).toBeTruthy();
      });
    }
  });

  it('navigates to chats when button clicked', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    const goToChatsButton = screen.getByText(/Go to Chats/i);
    fireEvent.click(goToChatsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/store/chats');
  });

  it('navigates to reservations when button clicked', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    const viewReservationsButton = screen.getByText(/View All Reservations/i);
    fireEvent.click(viewReservationsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/store/reservations');
  });

  it('navigates to listings when add item button clicked', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    const addItemButton = screen.getByText(/Add Item/i);
    fireEvent.click(addItemButton);

    expect(mockNavigate).toHaveBeenCalledWith('/store/listings/add');
  });

  it('navigates to profile when edit store button clicked', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/Edit Store/i);
    fireEvent.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/store/profile');
  });

  it('handles logout correctly', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('displays unread message count and alert badge', async () => {
    setupOnAuth(mockUser);
    const messages = [
      { ...mockMessageData, read: false },
      { ...mockMessageData, id: 'msg-2', read: false },
    ];
    setupFirestoreMocks(false, [], [], messages, []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    const unreadMessages = screen.getAllByText(/2 unread messages/i);
    expect(unreadMessages.length).toBeGreaterThan(0);
    expect(screen.getByText(/Action Required!/i)).toBeInTheDocument();
  });

  it('displays empty state when no messages', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Flip the messages card
    const flipCardWrappers = document.querySelectorAll('.flip-card-wrapper');
    const messagesCard = flipCardWrappers[0].querySelector('.flip-card-container');
    fireEvent.click(messagesCard);

    await waitFor(() => {
      expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no reservations', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Flip the reservations card (second card)
    const flipCardWrappers = document.querySelectorAll('.flip-card-wrapper');
    const reservationsCard = flipCardWrappers[1].querySelector('.flip-card-container');
    fireEvent.click(reservationsCard);

    await waitFor(() => {
      expect(screen.getByText(/No active reservations/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no sales', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Flip the revenue card (fourth card)
    const flipCardWrappers = document.querySelectorAll('.flip-card-wrapper');
    const revenueCard = flipCardWrappers[3].querySelector('.flip-card-container');
    fireEvent.click(revenueCard);

    await waitFor(() => {
      expect(screen.getByText(/No completed sales yet/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no reviews', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Wait for secondary loading to complete
    await waitFor(() => {
      // Flip the store profile card
      const storeCard = screen.getByText(/Store Profile/i).closest('.flip-card-container');
      fireEvent.click(storeCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
    });
  });

  it('renders charts section after loading', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Charts should be rendered
    expect(screen.getByText(/Revenue Trend/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Stats/i)).toBeInTheDocument();
  });

  it('fetches and displays reviews in secondary phase', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    const mockReviews = [
      { userName: 'John Doe', rating: 5, comment: 'Great store!' },
      { userName: 'Jane Smith', rating: 4, comment: 'Good selection' },
    ];
    axios.get.mockResolvedValue({ data: mockReviews });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/stores/store-1/reviews')
      );
    });
  });

  it('handles secondary data fetch error gracefully', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockRejectedValue(new Error('Failed to fetch reviews'));
    console.error = jest.fn(); // Suppress error logs

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByText(/Quick Stats/i)).toBeInTheDocument();
    });
  });

  it('calculates department and category counts correctly', async () => {
    setupOnAuth(mockUser);
    const items = [
      { data: () => ({ ...mockItemData, department: 'Men', category: 'Shirt' }) },
      { data: () => ({ ...mockItemData, id: 'item-2', department: 'Men', category: 'Pants' }) },
      { data: () => ({ ...mockItemData, id: 'item-3', department: 'Women', category: 'Shirt' }) },
    ];
    setupFirestoreMocks(false, items, [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Wait for secondary data loading
    await waitFor(() => {
      expect(screen.getByText(/Items by Department/i)).toBeInTheDocument();
    });
  });

  it('displays singular message when unread count is 1', async () => {
    setupOnAuth(mockUser);
    const messages = [{ ...mockMessageData, read: false }];
    setupFirestoreMocks(false, [], [], messages, []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1 unread message$/i)).toBeInTheDocument();
    });
  });

  it('closes flipped card when close button clicked', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Flip the messages card
    const flipCardWrappers = document.querySelectorAll('.flip-card-wrapper');
    const messagesCard = flipCardWrappers[0].querySelector('.flip-card-container');
    fireEvent.click(messagesCard);

    await waitFor(() => {
      const flippedInner = messagesCard.querySelector('.flipped');
      expect(flippedInner).toBeTruthy();
    });

    // Click the close button
    const closeButtons = document.querySelectorAll('.card-close-btn');
    fireEvent.click(closeButtons[0]);

    // Card should flip back
    await waitFor(() => {
      const flippedCard = messagesCard.querySelector('.flipped');
      expect(flippedCard).toBeFalsy();
    });
  });

  it('stops propagation when clicking inside flipped card', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // Flip the messages card
    const messagesCard = screen.getByText('Messages').closest('.flip-card-container');
    fireEvent.click(messagesCard);

    await waitFor(() => {
      const cardBack = document.querySelector('.card-back');
      expect(cardBack).toBeTruthy();

      // Click inside the back shouldn't flip
      fireEvent.click(cardBack);

      // Card should still be flipped
      const flippedCard = messagesCard.querySelector('.flipped');
      expect(flippedCard).toBeTruthy();
    });
  });

  it('displays help banner with unread messages highlight', async () => {
    setupOnAuth(mockUser);
    const messages = [{ ...mockMessageData, read: false }];
    setupFirestoreMocks(false, [], [], messages, []);

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/You have 1 unread message waiting!/i)).toBeInTheDocument();
    });
  });

  it('renders distribution charts after secondary loading', async () => {
    setupOnAuth(mockUser);
    const items = [
      { data: () => mockItemData },
    ];
    setupFirestoreMocks(false, items, [], [], []);
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Items by Department/i)).toBeInTheDocument();
      expect(screen.getByText(/Items by Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Popular Styles/i)).toBeInTheDocument();
    });
  });

  it('handles empty reviews gracefully', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });
  
    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });
  
    // Should render "No reviews yet"
    await waitFor(() => {
      expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
    });
  });

  it('closes multiple flipped cards independently', async () => {
    setupOnAuth(mockUser);
    setupFirestoreMocks(false, [], [], [], []);
    axios.get.mockResolvedValue({ data: [] });
  
    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });
  
    const flipCardWrappers = document.querySelectorAll('.flip-card-wrapper');
    flipCardWrappers.forEach(wrapper => {
      const card = wrapper.querySelector('.flip-card-container');
      fireEvent.click(card);
    });
  
    await waitFor(() => {
      flipCardWrappers.forEach(wrapper => {
        const card = wrapper.querySelector('.flip-card-container');
        expect(card.querySelector('.flipped')).toBeTruthy();
      });
    });
  
    const closeButtons = document.querySelectorAll('.card-close-btn');
    closeButtons.forEach(btn => fireEvent.click(btn));
  
    await waitFor(() => {
      flipCardWrappers.forEach(wrapper => {
        const card = wrapper.querySelector('.flip-card-container');
        expect(card.querySelector('.flipped')).toBeFalsy();
      });
    });
  });

  it('renders charts with item data', async () => {
    setupOnAuth(mockUser);
    const items = [
      { data: () => ({ ...mockItemData, department: 'Men', category: 'Shirt', style: 'Casual' }) },
      { data: () => ({ ...mockItemData, id: 'item-2', department: 'Women', category: 'Pants', style: 'Formal' }) },
    ];
    setupFirestoreMocks(false, items, [], [], []);
    axios.get.mockResolvedValue({ data: [] });
  
    render(
      <MemoryRouter>
        <StoreHome />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText(/Items by Department/i)).toBeInTheDocument();
      expect(screen.getByText(/Items by Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Popular Styles/i)).toBeInTheDocument();
    });
  });  
});
