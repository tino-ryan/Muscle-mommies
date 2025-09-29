import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StoreSidebar from '../StoreSidebar';

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('StoreSidebar', () => {
  const onLogoutMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all menu items', () => {
    render(
      <MemoryRouter>
        <StoreSidebar currentPage="" onLogout={onLogoutMock} />
      </MemoryRouter>
    );

    const labels = [
      'Home',
      'Listings',
      'Reservations',
      'Chats',
      'Store Profile',
      'Logout',
    ];

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('highlights the active menu item based on currentPage prop', () => {
    render(
      <MemoryRouter>
        <StoreSidebar currentPage="Listings" onLogout={onLogoutMock} />
      </MemoryRouter>
    );

    const listingsItem = screen.getByText('Listings').parentElement;
    expect(listingsItem).toHaveClass('active');

    const homeItem = screen.getByText('Home').parentElement;
    expect(homeItem).not.toHaveClass('active');
  });

  it('calls navigate with correct path when clicking menu items', () => {
    render(
      <MemoryRouter>
        <StoreSidebar currentPage="" onLogout={onLogoutMock} />
      </MemoryRouter>
    );

    const homeItem = screen.getByText('Home').parentElement;
    fireEvent.click(homeItem);
    expect(mockedNavigate).toHaveBeenCalledWith('/store/home');

    const chatsItem = screen.getByText('Chats').parentElement;
    fireEvent.click(chatsItem);
    expect(mockedNavigate).toHaveBeenCalledWith('/store/chats');
  });

  it('calls onLogout when clicking the Logout item', () => {
    render(
      <MemoryRouter>
        <StoreSidebar currentPage="" onLogout={onLogoutMock} />
      </MemoryRouter>
    );

    const logoutItem = screen.getByText('Logout').parentElement;
    fireEvent.click(logoutItem);
    expect(onLogoutMock).toHaveBeenCalled();
  });

  it('does not call navigate for Logout item', () => {
    render(
      <MemoryRouter>
        <StoreSidebar currentPage="" onLogout={onLogoutMock} />
      </MemoryRouter>
    );

    const logoutItem = screen.getByText('Logout').parentElement;
    fireEvent.click(logoutItem);
    expect(mockedNavigate).not.toHaveBeenCalledWith(
      expect.stringContaining('Logout')
    );
  });
});
