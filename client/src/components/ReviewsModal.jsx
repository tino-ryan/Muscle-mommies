import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api'; // Adjust path as needed
import './ReviewsModal.css';

const ReviewsModal = ({ storeId, storeName, isOpen, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/api/stores/${storeId}/reviews`
        );
        setReviews(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && storeId) {
      fetchReviews();
    }
  }, [isOpen, storeId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/stores/${storeId}/reviews`
      );
      setReviews(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      >
        ★
      </span>
    ));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';

    // Handle Firestore timestamp
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1e6)
      : new Date(timestamp);

    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="reviews-modal-overlay">
      <div className="reviews-modal-content">
        <div className="reviews-modal-header">
          <h2>Reviews for {storeName}</h2>
          <button className="reviews-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="reviews-modal-body">
          {loading && (
            <div className="reviews-loading">
              <div className="spinner"></div>
              <p>Loading reviews...</p>
            </div>
          )}

          {error && (
            <div className="reviews-error">
              <p>{error}</p>
              <button onClick={fetchReviews}>Try Again</button>
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className="reviews-empty">
              <p>No reviews yet for this store.</p>
            </div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.reviewId} className="review-item">
                  <div className="review-header">
                    <div className="review-user-info">
                      <span className="review-user-name">
                        {review.userName}
                      </span>
                      <span className="review-date">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {review.itemName && (
                    <div className="review-item-info">
                      <span className="review-item-label">Item:</span>
                      <span className="review-item-name">
                        {review.itemName}
                      </span>
                    </div>
                  )}

                  {review.review && (
                    <div className="review-text">
                      <p>{review.review}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
