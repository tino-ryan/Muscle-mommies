import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import BadgePage from '../pages/customer/Badge';

// Mock axios
jest.mock('axios');

// Mock CustomerSidebar
jest.mock('../components/CustomerSidebar', () => {
  return function MockSidebar({ activePage }) {
    return <div data-testid="sidebar">Sidebar active: {activePage}</div>;
  };
});

// Mock window.open
const mockOpen = jest.fn();
beforeAll(() => {
  global.open = mockOpen;
});

describe('BadgePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders thrift badge and other badges on success', async () => {
    const thriftBadge = {
      id: 17,
      name: 'ThriftFinder Badge',
      description: 'Test description',
      imageUrl: 'http://test.com/thrift.png',
      createdAt: '2025-09-25T22:15:49+00:00',
    };

    const otherBadges = [
      {
        id: 1,
        name: 'Explorer Badge',
        description: 'Another test badge',
        imageUrl: 'http://test.com/explorer.png',
        createdAt: '2025-09-20T22:15:49+00:00',
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes('/collectibles/17')) {
        return Promise.resolve({ data: thriftBadge });
      }
      if (url.includes('/collectibles')) {
        return Promise.resolve({ data: [...otherBadges, thriftBadge] });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<BadgePage />);

    // Wait for loading to finish
    await waitFor(() =>
      expect(screen.getByText(/Earn Badges & Rewards/i)).toBeInTheDocument()
    );

    // Featured thrift badge
    expect(screen.getByText('ThriftFinder Badge')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();

    // Other badges
    expect(screen.getByText('Explorer Badge')).toBeInTheDocument();
  });

  test('renders error state and fallback thrift badge', async () => {
    axios.get.mockRejectedValue(new Error('API down'));

    render(<BadgePage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Oops! Something went wrong/i)
      ).toBeInTheDocument()
    );

    expect(
      screen.getByText(/Failed to load badges. Please try again later./i)
    ).toBeInTheDocument();

    // Retry button exists
    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    expect(retryButton).toBeInTheDocument();
  });

  test('claim button opens quest app link', async () => {
    const thriftBadge = {
      id: 17,
      name: 'ThriftFinder Badge',
      description: 'Test badge',
      imageUrl: 'http://test.com/thrift.png',
      createdAt: '2025-09-25T22:15:49+00:00',
    };

    axios.get.mockImplementation((url) => {
      if (url.includes('/collectibles/17')) {
        return Promise.resolve({ data: thriftBadge });
      }
      if (url.includes('/collectibles')) {
        return Promise.resolve({ data: [thriftBadge] });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<BadgePage />);

    await waitFor(() =>
      expect(screen.getByText('ThriftFinder Badge')).toBeInTheDocument()
    );

    const claimButton = screen.getByRole('button', { name: /Claim Badge/i });
    fireEvent.click(claimButton);

    expect(mockOpen).toHaveBeenCalledWith(
      'https://witsquest-hjggaxgwfgbeh0gk.brazilsouth-01.azurewebsites.net/',
      '_blank'
    );
  });
});
