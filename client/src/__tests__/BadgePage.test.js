import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import BadgePage from '../pages/customer/BadgePage';
import CustomerSidebar from '../components/CustomerSidebar';

// Mock axios
jest.mock('axios');

// Mock CustomerSidebar to avoid Firebase auth issues
jest.mock('../components/CustomerSidebar', () => {
  return function MockCustomerSidebar({ activePage }) {
    return (
      <div data-testid="mock-customer-sidebar" className="sidebar">
        <div
          data-testid="badges-item"
          className={`sidebar-item ${activePage === 'badges' ? 'active' : ''}`}
          onClick={() => window.history.pushState({}, '', '/badges')}
        >
          Badges
        </div>
      </div>
    );
  };
});

describe('BadgePage', () => {
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  const thriftBadge = {
    id: 17,
    createdAt: '2025-09-25T22:15:49+00:00',
    name: 'ThriftFinder Badge',
    description: 'Earn this badge by visiting one a nearby thrift store',
    imageUrl: 'https://pnqidfbfwiwsieysgowz.supabase.co/storage/v1/object/sign/badges/Thrift.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85N2Y5NTQ3Mi04ZTJiLTQ3MzItYjczZS0yMDhkZTA1MWM2ZjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWRnZXMvVGhyaWZ0LnBuZyIsImlhdCI6MTc1ODgzODY0OCwiZXhwIjoxNzkwMzc0NjQ4fQ.XW2TVUbqhyr7fFeJWEjVbI-gQSmJpADVFY2aBDtdnDo',
  };

  const otherBadges = [
    {
      id: 18,
      createdAt: '2025-09-26T10:00:00+00:00',
      name: 'Vintage Voyager Badge',
      description: 'Earned by exploring 5 thrift stores',
      imageUrl: 'https://example.com/vintage.png',
    },
    {
      id: 19,
      createdAt: '2025-09-27T12:00:00+00:00',
      name: 'Eco Warrior Badge',
      description: 'Earned by purchasing sustainable items',
      imageUrl: 'https://example.com/eco.png',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Simulate pending request
    render(
      <MemoryRouter initialEntries={['/badges']}>
        <BadgePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-customer-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Loading badges...')).toBeInTheDocument();
    expect(screen.getByTestId('badges-item')).toHaveClass('active');
  });

  it('renders ThriftFinder Badge and claim button on success', async () => {
    axios.get
      .mockResolvedValueOnce({ data: thriftBadge })
      .mockResolvedValueOnce({ data: otherBadges });

    render(
      <MemoryRouter initialEntries={['/badges']}>
        <BadgePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ThriftFinder Badge')).toBeInTheDocument();
      expect(screen.getByText('Earn this badge by visiting one a nearby thrift store')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'ThriftFinder Badge' })).toHaveAttribute('src', thriftBadge.imageUrl);
      expect(screen.getByText('Available since 9/25/2025')).toBeInTheDocument();
      expect(screen.getByText('Claim Badge & Sign Up')).toBeInTheDocument();
      expect(screen.getByText('To claim this reward, sign up for the Quest app and visit a nearby thrift store!')).toBeInTheDocument();
    });

    const claimButton = screen.getByRole('button', { name: 'Claim Badge & Sign Up' });
    expect(claimButton).toHaveAttribute('href', 'https://witsquest-hjggaxgwfgbeh0gk.brazilsouth-01.azurewebsites.net/');
  });

  it('renders other badges in grid', async () => {
    axios.get
      .mockResolvedValueOnce({ data: thriftBadge })
      .mockResolvedValueOnce({ data: otherBadges });

    render(
      <MemoryRouter initialEntries={['/badges']}>
        <BadgePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('More Badges to Collect')).toBeInTheDocument();
      expect(screen.getByText('Vintage Voyager Badge')).toBeInTheDocument();
      expect(screen.getByText('Eco Warrior Badge')).toBeInTheDocument();
      expect(screen.getAllByRole('img')).toHaveLength(3); // ThriftFinder + 2 others
    });
  });

  it('renders no other badges message when collectibles are empty', async () => {
    axios.get
      .mockResolvedValueOnce({ data: thriftBadge })
      .mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter initialEntries={['/badges']}>
        <BadgePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No other badges available yet. Check back soon!')).toBeInTheDocument();
    });
  });

  it('renders error state with fallback badge', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter initialEntries={['/badges']}>
        <BadgePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to load badges. Please try again later.')).toBeInTheDocument();
      expect(screen.getByText('ThriftFinder Badge')).toBeInTheDocument(); // Fallback
      expect(screen.getByText('Claim Badge & Sign Up')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });
  });

  it('navigates to badges when sidebar item is clicked', async () => {
    axios.get
      .mockResolvedValueOnce({ data: thriftBadge })
      .mockResolvedValueOnce({ data: otherBadges });

    render(
      <MemoryRouter initialEntries={['/customer/home']}>
        <BadgePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('badges-item'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/badges');
    });
  });
});