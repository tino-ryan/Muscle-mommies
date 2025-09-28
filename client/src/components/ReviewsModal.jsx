import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import StarRating from './StarRating';
import './ReviewsModal.css';
import { API_URL } from '../api';

const ReviewsModal = ({ storeId, storeName, reviews, isOpen, onClose }) => {
  const [localReviews, setLocalReviews] = useState(reviews || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = getAuth();

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp._seconds
        ? new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1e6)
        : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/api/reviews?storeId=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('ReviewsModal API Response:', response.data);

      // Fetch user names for each review
      const reviewsWithNames = await Promise.all(
        response.data.map(async (review) => {
          try {
            const userResponse = await axios.get(`${API_URL}/api/users/${review.userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log(`ReviewsModal User ${review.userId} Response:`, userResponse.data);
            return {
              ...review,
              Name: userResponse.data.Name || 'Anonymous',
            };
          } catch (err) {
            console.error(`Error fetching user ${review.userId} in ReviewsModal:`, err);
            return { ...review, Name: 'Anonymous' };
          }
        })
      );
      console.log('Processed Reviews in ReviewsModal:', reviewsWithNames);
      setLocalReviews(reviewsWithNames);
    } catch (err) {
      console.error('Error fetching reviews in ReviewsModal:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [auth, storeId]);

  useEffect(() => {
    if (isOpen) {
      console.log('ReviewsModal received reviews prop:', reviews);
      if (reviews && reviews.length > 0) {
        // Use passed reviews if available
        setLocalReviews(reviews);
        setLoading(false);
      } else {
        // Fetch reviews if none passed
        fetchReviews();
      }
    }
  }, [isOpen, reviews, fetchReviews]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 className="modal-title">Reviews for {storeName}</h2>
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        )}
        {error && (
          <div className="error-container">
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && localReviews.length === 0 && (
          <div className="no-reviews">
            <p>No reviews available for this store.</p>
          </div>
        )}
        {!loading && !error && localReviews.length > 0 && (
          <div className="reviews-list">
            {localReviews.map((review) => (
              <div key={review.reviewId} className="review-card">
                <div className="review-header">
                  <div className="review-user-info">
                    <span className="review-username">{review.Name || 'Anonymous'}</span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                  <StarRating rating={parseInt(review.rating, 10)} showCount={false} size="small" />
                </div>
                <p className="review-comment">{review.review}</p>
                {review.itemId && (
                  <p className="review-item">Item ID: {review.itemId}</p>
                )}
                {review.reservationId && (
                  <p className="review-reservation">Reservation ID: {review.reservationId}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ReviewsModal.propTypes = {
  storeId: PropTypes.string.isRequired,
  storeName: PropTypes.string.isRequired,
  reviews: PropTypes.array, // Optional reviews prop
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

ReviewsModal.defaultProps = {
  reviews: [],
};

export default ReviewsModal;