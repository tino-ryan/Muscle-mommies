import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import ReviewsModal from '../ReviewsModal';
import { API_URL } from '../../api';

jest.mock('axios');

describe('ReviewsModal', () => {
  const storeId = '123';
  const storeName = 'Test Store';
  const onClose = jest.fn();

  const mockReviews = [
    {
      reviewId: 'r1',
      userName: 'Alice',
      rating: 5,
      createdAt: new Date('2025-01-01').toISOString(),
      itemName: 'Tee',
      review: 'Great product!',
    },
    {
      reviewId: 'r2',
      userName: 'Bob',
      rating: 3,
      createdAt: { _seconds: 1700000000, _nanoseconds: 0 },
      review: 'Average experience.',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ReviewsModal
        storeId={storeId}
        storeName={storeName}
        isOpen={false}
        onClose={onClose}
      />
    );
    expect(screen.queryByText(/Reviews for/i)).not.toBeInTheDocument();
  });

  it('renders modal header and close button', () => {
    render(
      <ReviewsModal
        storeId={storeId}
        storeName={storeName}
        isOpen={true}
        onClose={onClose}
      />
    );
    expect(screen.getByText(`Reviews for ${storeName}`)).toBeInTheDocument();
    const closeBtn = screen.getByText('×');
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state while fetching reviews', async () => {
    axios.get.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <ReviewsModal
        storeId={storeId}
        storeName={storeName}
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Loading reviews/i)).toBeInTheDocument();
    expect(
      screen
        .getByText(/Loading reviews/i)
        .parentElement.querySelector('.spinner')
    ).toBeInTheDocument();
  });

  it('fetches and displays reviews', async () => {
    axios.get.mockResolvedValue({ data: mockReviews });

    render(
      <ReviewsModal
        storeId={storeId}
        storeName={storeName}
        isOpen={true}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Great product!')).toBeInTheDocument();
      expect(screen.getByText('Average experience.')).toBeInTheDocument();
      expect(screen.getByText('Item:')).toBeInTheDocument();
      expect(screen.getByText('Tee')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails and retries', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    axios.get.mockResolvedValueOnce({ data: mockReviews });

    render(
      <ReviewsModal
        storeId={storeId}
        storeName={storeName}
        isOpen={true}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Try Again/i));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('shows empty state when no reviews', async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(
      <ReviewsModal
        storeId={storeId}
        storeName={storeName}
        isOpen={true}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No reviews yet for this store/i)
      ).toBeInTheDocument();
    });
  });
});
