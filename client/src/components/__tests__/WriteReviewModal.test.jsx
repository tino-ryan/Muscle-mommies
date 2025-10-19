// __tests__/StoreReviewModal.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StoreReviewModal from '../WriteReviewModal';

describe('StoreReviewModal', () => {
  const storeName = 'Test Store';
  const onClose = jest.fn();
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(
      <StoreReviewModal
        isOpen={false}
        onClose={onClose}
        onSubmit={onSubmit}
        storeName={storeName}
      />
    );

    expect(screen.queryByText(`Review ${storeName}`)).not.toBeInTheDocument();
  });

  test('renders modal when isOpen is true', () => {
    render(
      <StoreReviewModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        storeName={storeName}
      />
    );

    expect(screen.getByText(`Review ${storeName}`)).toBeInTheDocument();
    expect(
      screen.getByText(/Share your experience with this store/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Your Rating *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tell us about your experience/i)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit Review')).toBeInTheDocument();
  });

  test('updates rating when clicking stars', () => {
    render(
      <StoreReviewModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        storeName={storeName}
      />
    );

    const stars = screen.getAllByText('★');
    fireEvent.click(stars[3]); // Click 4th star
    expect(screen.getByText('Very Good')).toBeInTheDocument();
  });

  test('updates review text', () => {
    render(
      <StoreReviewModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        storeName={storeName}
      />
    );

    const textarea = screen.getByPlaceholderText(/Tell us about your experience/i);
    fireEvent.change(textarea, { target: { value: 'Great store!' } });
    expect(textarea.value).toBe('Great store!');
    expect(screen.getByText('12/500')).toBeInTheDocument(); // Character count
  });

  test('submits review successfully', async () => {
    onSubmit.mockResolvedValueOnce({}); // simulate success

    render(
      <StoreReviewModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        storeName={storeName}
      />
    );

    // Set rating
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[4]); // 5 stars

    // Enter review
    const textarea = screen.getByPlaceholderText(/Tell us about your experience/i);
    fireEvent.change(textarea, { target: { value: 'Excellent store!' } });

    fireEvent.click(screen.getByText('Submit Review'));

    expect(onSubmit).toHaveBeenCalledWith({ rating: 5, review: 'Excellent store!' });
    // Wait for modal to close
    await screen.findByText('Submit Review'); // still in DOM until rerender
  });

  test('shows submission error if onSubmit rejects', async () => {
    onSubmit.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <StoreReviewModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        storeName={storeName}
      />
    );

    // Set rating
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[2]); // 3 stars

    fireEvent.click(screen.getByText('Submit Review'));

    expect(await screen.findByText('Network Error')).toBeInTheDocument();
  });
});
