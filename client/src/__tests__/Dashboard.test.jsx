import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { auth } from '../firebase';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}));

jest.mock('axios');

// Mock useNavigate at module scope
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    document.cookie = ''; // reset cookies
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders guest message if no user is logged in', async () => {
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/THRIFTFINDER/i)).toBeInTheDocument();
    expect(screen.getByText(/UNLOCK THE VAULT/i)).toBeInTheDocument();
  });

  test('clicking unlock button navigates to login', async () => {
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const button = await screen.findByText(/UNLOCK THE VAULT/i);
    fireEvent.click(button);

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('fetches role and sets cookie for logged-in user', async () => {
    const mockUser = { uid: 'user1', displayName: 'Test User' };
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb(mockUser);
      return jest.fn();
    });

    axios.post.mockResolvedValue({ data: { role: 'customer' } });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await act(async () => {
      // flush axios microtasks
      await Promise.resolve();

      // advance initial 200ms delay
      jest.advanceTimersByTime(200);

      // advance 1200ms navigation delay
      jest.advanceTimersByTime(1200);
    });

    expect(document.cookie).toContain('thriftRole_user1=customer');
    expect(mockNavigate).toHaveBeenCalledWith('/customer/home');
  });

  test('handles unknown role by erasing cookies and redirecting to login', async () => {
    const mockUser = { uid: 'user2', displayName: 'Test User 2' };
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb(mockUser);
      return jest.fn();
    });

    axios.post.mockResolvedValue({ data: { role: 'unknownRole' } });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await act(async () => {
      await Promise.resolve(); // flush axios
      jest.advanceTimersByTime(200); // initial delay
      jest.advanceTimersByTime(1200); // navigation delay
    });

    // Cookie for unknown role should be erased
    expect(document.cookie).not.toContain('thriftRole_user2=unknownRole');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('typing intro message for guest works', async () => {
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb(null);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Fast-forward typing animation and fadeOut delay
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    const message = screen.getByText(/THRIFTFINDER/i); // fallback check
    expect(message).toBeInTheDocument();
  });
});
