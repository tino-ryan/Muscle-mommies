import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Reservations from '../pages/customer/Reservations';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

jest.mock('firebase/auth');
jest.mock('axios');
jest.mock('../components/CustomerSidebar', () => (props) => (
  <div data-testid="sidebar">Sidebar active: {props.activePage}</div>
));

// mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Reservations Page', () => {
  let mockUnsubscribe;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    getAuth.mockReturnValue({});
    onAuthStateChanged.mockImplementation((auth, callback) => {
      return mockUnsubscribe;
    });
  });

  test('redirects to login if no user', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // simulate no user
      return mockUnsubscribe;
    });

    render(
      <MemoryRouter>
        <Reservations />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('renders reservations table on success', async () => {
    const fakeUser = { getIdToken: jest.fn().mockResolvedValue('fake-token') };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(fakeUser); // simulate logged in user
      return mockUnsubscribe;
    });

    const fakeReservations = [
      {
        reservationId: '1',
        itemId: 'item1',
        storeId: 'store1',
        status: 'Sold',
        reservedAt: { _seconds: 1633046400, _nanoseconds: 0 },
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes('/reservations')) {
        return Promise.resolve({ data: fakeReservations });
      }
      if (url.includes('/items/')) {
        return Promise.resolve({ data: { name: 'Cool Jacket' } });
      }
      if (url.includes('/stores/')) {
        return Promise.resolve({ data: { storeName: 'Thrift Shop' } });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <Reservations />
      </MemoryRouter>
    );

    expect(await screen.findByText(/My Reservations/i)).toBeInTheDocument();
    expect(await screen.findByText('Cool Jacket')).toBeInTheDocument();
    expect(await screen.findByText('Thrift Shop')).toBeInTheDocument();
    expect(
      await screen.findByText(/Sold - Awaiting Confirmation/)
    ).toBeInTheDocument();
  });

  test('shows error if fetching fails', async () => {
    const fakeUser = { getIdToken: jest.fn().mockResolvedValue('fake-token') };

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(fakeUser);
      return mockUnsubscribe;
    });

    axios.get.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Reservations />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Failed to load reservations/i)
    ).toBeInTheDocument();
  });

  test('opens confirmation modal and submits review', async () => {
    const fakeUser = { getIdToken: jest.fn().mockResolvedValue('fake-token') };
    getAuth.mockReturnValue({ currentUser: fakeUser });

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(fakeUser);
      return mockUnsubscribe;
    });

    const fakeReservations = [
      {
        reservationId: '1',
        itemId: 'item1',
        storeId: 'store1',
        status: 'Sold',
        reservedAt: { _seconds: 1633046400, _nanoseconds: 0 },
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes('/reservations')) {
        return Promise.resolve({ data: fakeReservations });
      }
      if (url.includes('/items/')) {
        return Promise.resolve({ data: { name: 'Cool Jacket' } });
      }
      if (url.includes('/stores/')) {
        return Promise.resolve({ data: { storeName: 'Thrift Shop' } });
      }
      return Promise.resolve({ data: {} });
    });

    axios.post.mockResolvedValue({ data: { message: 'Review saved' } });
    axios.put.mockResolvedValue({ data: { message: 'Reservation confirmed' } });

    render(
      <MemoryRouter>
        <Reservations />
      </MemoryRouter>
    );

    const confirmBtn = await screen.findByText('Confirm Received');
    fireEvent.click(confirmBtn);

    expect(
      await screen.findByText(/Confirm Item Receipt/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Share your experience/i), {
      target: { value: 'Great item!' },
    });

    fireEvent.click(screen.getByText(/Confirm & Submit Review/i));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(axios.put).toHaveBeenCalled();
    });
  });
});
