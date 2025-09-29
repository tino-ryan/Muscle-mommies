import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerSidebar from '../CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

// Mock react-router navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth
const mockSignOut = jest.fn();
const mockAuth = { currentUser: { uid: '123' } };
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signOut: jest.fn(() => mockSignOut()),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // reset document.cookie
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
  });
});

describe('CustomerSidebar', () => {
  it('renders all sidebar items', () => {
    render(<CustomerSidebar activePage="home" />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Chats/i)).toBeInTheDocument();
    expect(screen.getByText(/Reservations/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('highlights the active page', () => {
    render(<CustomerSidebar activePage="search" />);
    const searchItem = screen.getByText(/Search/i).closest('.sidebar-item');
    expect(searchItem).toHaveClass('active');
  });

  it('navigates to correct page when items are clicked', () => {
    render(<CustomerSidebar activePage="home" />);

    fireEvent.click(screen.getByText(/Search/i));
    expect(mockNavigate).toHaveBeenCalledWith('/search');

    fireEvent.click(screen.getByText(/Chats/i));
    expect(mockNavigate).toHaveBeenCalledWith('/user/chats');

    fireEvent.click(screen.getByText(/Reservations/i));
    expect(mockNavigate).toHaveBeenCalledWith('/customer/reservations');

    fireEvent.click(screen.getByText(/Home/i));
    expect(mockNavigate).toHaveBeenCalledWith('/customer/home');
  });

  it('logs out correctly', async () => {
    render(<CustomerSidebar activePage="home" />);
    fireEvent.click(screen.getByText(/Logout/i));

    expect(signOut).toHaveBeenCalledWith(mockAuth);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles logout errors gracefully', async () => {
    signOut.mockImplementationOnce(() => {
      throw new Error('Logout failed');
    });

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<CustomerSidebar activePage="home" />);
    fireEvent.click(screen.getByText(/Logout/i));

    expect(signOut).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('Error logging out:', expect.any(Error));
    spy.mockRestore();
  });
});
