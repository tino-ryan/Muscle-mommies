// __tests__/HamburgerMenu.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HamburgerMenu from '../HamburgerMenu';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HamburgerMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the hamburger button', () => {
    render(
      <MemoryRouter>
        <HamburgerMenu />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: '☰' });
    expect(button).toBeInTheDocument();
  });

  it('toggles menu items when button is clicked', () => {
    render(
      <MemoryRouter>
        <HamburgerMenu />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: '☰' });

    // Menu should be hidden initially
    expect(screen.queryByText('Chats')).toBeNull();

    // Click to open
    fireEvent.click(button);
    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('Reservations')).toBeInTheDocument();

    // Click to close
    fireEvent.click(button);
    expect(screen.queryByText('Chats')).toBeNull();
  });

  it('navigates to the correct route when menu items are clicked', () => {
    render(
      <MemoryRouter>
        <HamburgerMenu />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: '☰' });
    fireEvent.click(button); // open menu

    const routes = [
      { label: 'Chats', path: '/chats' },
      { label: 'Reservations', path: '/store/reservations' },
      { label: 'Home', path: '/store/home' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Store Profile', path: '/store/profile' },
      { label: 'Listings', path: '/store/listings' },
    ];

    routes.forEach(({ label, path }) => {
      const item = screen.getByText(label);
      fireEvent.click(item);
      expect(mockNavigate).toHaveBeenCalledWith(path);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(routes.length);
  });
});
