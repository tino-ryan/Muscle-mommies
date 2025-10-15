import React, { useState } from 'react';
import './WriteReviewModal.css';

export default function StoreReviewModal({
  isOpen,
  onClose,
  onSubmit,
  storeName,
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({ rating, review });
      // Reset form
      setRating(0);
      setReview('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={handleClose}>
      <div
        className="review-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="review-modal-close" onClick={handleClose}>
          &times;
        </button>

        <h2 className="review-modal-title">Review {storeName}</h2>
        <p className="review-modal-subtitle">
          Share your experience with this store
        </p>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="review-rating-section">
            <label className="review-label">Your Rating *</label>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-star ${
                    star <= (hoveredRating || rating) ? 'active' : ''
                  }`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="review-rating-text">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>

          <div className="review-text-section">
            <label className="review-label" htmlFor="review-text">
              Your Review (Optional)
            </label>
            <textarea
              id="review-text"
              className="review-textarea"
              placeholder="Tell us about your experience with this store..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              maxLength={500}
            />
            <span className="review-char-count">{review.length}/500</span>
          </div>

          {error && <div className="review-error">{error}</div>}

          <div className="review-modal-actions">
            <button
              type="button"
              className="review-btn review-btn-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="review-btn review-btn-submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
