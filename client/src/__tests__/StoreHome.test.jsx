import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('StoreHome (new version)', () => {
  const mockAuth = { signOut: jest.fn() };
  const mockUser = { uid: 'user123' };

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
  });

  it('redirects to login when user is not authenticated', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No user
      return jest.fn();
    });

    renderStoreHome();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows loading state initially', () => {
    onAuthStateChanged.mockImplementation(() => jest.fn());
    renderStoreHome();
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders error message when no store found', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    getDocs.mockResolvedValueOnce({ empty: true, docs: [] }); // store query result

    renderStoreHome();

    await waitFor(() => {
      expect(
        screen.getByText(/No store found. Please set up your store./i)
      ).toBeInTheDocument();
    });
  });

  it('renders KPIs, categories and styles when store exists', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Mock Firestore results for store + KPIs + items
    getDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'store1', data: () => ({ storeName: 'Test Store' }) }],
      }) // store
      .mockResolvedValueOnce({
        docs: [{ data: () => ({ amount: 100 }) }, { data: () => ({ amount: 50 }) }],
      }) // sales
      .mockResolvedValueOnce({ size: 2 }) // reservations
      .mockResolvedValueOnce({ size: 3 }) // unread chats
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ category: 'Shoes', style: 'Casual, Sporty' }) },
          { data: () => ({ category: 'Shirts', style: 'Formal' }) },
        ],
      }); // items

    renderStoreHome();

    // Store name
    await waitFor(() => {
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    // KPIs
    expect(screen.getByText(/Total Sales/i)).toBeInTheDocument();
    expect(screen.getByText('R 150')).toBeInTheDocument();
    expect(screen.getByText(/New Reservations/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Unread Chats/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Categories
    expect(screen.getByText(/Shoes: 1 items/i)).toBeInTheDocument();
    expect(screen.getByText(/Shirts: 1 items/i)).toBeInTheDocument();

    // Styles
    expect(screen.getByText(/Casual/i)).toBeInTheDocument();
    expect(screen.getByText(/Formal/i)).toBeInTheDocument();
  });

  it('renders error when Firestore query fails', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    getDocs.mockRejectedValue(new Error('Firestore failure'));

    renderStoreHome();

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to fetch analytics/i)
      ).toBeInTheDocument();
    });
  });
});
