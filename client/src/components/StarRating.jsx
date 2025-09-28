import React from 'react';
import './StarRating.css';

const StarRating = ({ 
  rating, 
  reviewCount = 0, 
  size = 'medium',
  showCount = true,
  className = '' 
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="star filled">
          ★
        </span>
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star half">
          ★
        </span>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star empty">
          ★
        </span>
      );
    }
    
    return stars;
  };

  const displayRating = rating > 0 ? rating.toFixed(1) : 'No rating';

  return (
    <div className={`star-rating ${size} ${className}`}>
      <div className="stars">
        {rating > 0 ? renderStars() : (
          // Show empty stars when no rating
          Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="star empty">
              ★
            </span>
          ))
        )}
      </div>
      {showCount && (
        <div className="rating-info">
          <span className="rating-value">{displayRating}</span>
          {reviewCount > 0 && (
            <span className="review-count">
              ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;