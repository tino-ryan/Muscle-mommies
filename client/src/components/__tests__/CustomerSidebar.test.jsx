import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerSidebar from '../CustomerSidebar';
import { signOut } from 'firebase/auth';

// Mock react-router navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth
const mockAuth = { currentUser: { uid: '123' } };
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signOut: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(document, 'cookie', { writable: true, value: '' });
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

  it('adds active class based on activePage prop', () => {
    render(<CustomerSidebar activePage="chats" />);
    expect(screen.getByText(/Chats/i).parentElement).toHaveClass('active');
    expect(screen.getByText(/Home/i).parentElement).not.toHaveClass('active');
  });

  it('navigates to correct page when sidebar items are clicked', () => {
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

  it('toggles hamburger menu and slide-out menu', () => {
    render(<CustomerSidebar activePage="home" />);
    const menuIcon = document.querySelector('.menu-icon');
    expect(menuIcon).toBeInTheDocument();

    // Initially menu closed
    expect(document.querySelector('.menu-overlay')).toBeNull();

    // Open menu
    fireEvent.click(menuIcon);
    expect(document.querySelector('.menu-overlay')).toHaveClass('active');

    // Click overlay closes menu
    const overlay = document.querySelector('.menu-overlay');
    fireEvent.click(overlay);
    expect(document.querySelector('.menu-overlay')).toBeNull();
  });

  it('mobile nav items navigate correctly', () => {
    render(<CustomerSidebar activePage="home" />);
    const mobileNavItems = document.querySelectorAll('.mobile-nav .nav-item');

    fireEvent.click(mobileNavItems[0]); // Home
    expect(mockNavigate).toHaveBeenCalledWith('/customer/home');

    fireEvent.click(mobileNavItems[1]); // Search
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });
});
