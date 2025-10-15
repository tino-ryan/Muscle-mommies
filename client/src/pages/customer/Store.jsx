import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerSidebar from '../../components/CustomerSidebar';
import StarRating from '../../components/StarRating';
import ReviewsModal from '../../components/ReviewsModal';
import StoreReviewModal from '../../components/WriteReviewModal';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import './store.css';
import { API_URL } from '../../api';

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [store, setStore] = useState(null);
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (selectedItem.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (selectedItem.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const storeResponse = await axios.get(`${API_URL}/api/stores/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStore(storeResponse.data);

          const itemsResponse = await axios.get(
            `${API_URL}/api/stores/${id}/items`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setClothes(itemsResponse.data);
        } catch (error) {
          console.error('Error fetching store or items:', error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [id, auth, navigate]);

  // --- Generate unique filter options from clothes ---
  const categoryOptions = useMemo(() => {
    return [...new Set(clothes.map((item) => item.category).filter(Boolean))];
  }, [clothes]);

  const styleOptions = useMemo(() => {
    return [...new Set(clothes.map((item) => item.style).filter(Boolean))];
  }, [clothes]);

  const sizeOptions = useMemo(() => {
    return [...new Set(clothes.map((item) => item.size).filter(Boolean))];
  }, [clothes]);

  // --- Filtering logic ---
  const filteredClothes = clothes.filter((item) => {
    const inPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const inSize = selectedSize ? item.size === selectedSize : true;
    const inStyle = selectedStyle ? item.style === selectedStyle : true;
    const inCategory = selectedCategory
      ? item.category === selectedCategory
      : true;
    const isAvailable = item.status !== 'Sold';
    return inPrice && inSize && inStyle && inCategory && isAvailable;
  });

  const handleReserve = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = clothes.find((i) => i.itemId === itemId);
      if (!item) throw new Error('Item not found');

      const reserveResponse = await axios.put(
        `${API_URL}/api/stores/reserve/${itemId}`,
        { storeId: store.storeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!reserveResponse.data.reservationId) {
        throw new Error('Failed to create reservation');
      }

      // Update local state
      setClothes((prev) =>
        prev.map((i) =>
          i.itemId === itemId ? { ...i, status: 'Reserved' } : i
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, status: 'Reserved' } : null
      );

      const chatId = [user.uid, store.ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error reserving item:', error);
      alert(`Failed to reserve item: ${error.message}`);
    }
  };

  const handleEnquire = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = clothes.find((i) => i.itemId === itemId);
      if (!item) throw new Error('Item not found');

      const storeId = store.storeId;
      const ownerId = store.ownerId;

      const messageResponse = await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId: ownerId,
          message: `Hey, I would like to enquire about the item ${item.name}`,
          itemId,
          storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!messageResponse.data.messageId) {
        throw new Error('Failed to send enquiry message');
      }

      const chatId = [user.uid, ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error sending enquiry:', error);
      alert(`Failed to send enquiry: ${error.message}`);
    }
  };

  const handleSubmitReview = async ({ rating, review }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
  
      const token = await user.getIdToken();
      
      await axios.post(
        `${API_URL}/api/stores/reviews`,
        {
          storeId: store.storeId,
          rating,
          review,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Refresh store data to get updated rating
      const storeResponse = await axios.get(`${API_URL}/api/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStore(storeResponse.data);
  
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to submit review'
      );
    }
  };

  if (loading) {
    return (
      <div className="store-home">
        <div className="loading-container">
          <div className="spinner" data-testid="spinner"></div>
          <div className="loading-text">Loading store...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-home">
      <div className="layout-container">
        <CustomerSidebar activePage="home" />
        <div className="content">
          <button onClick={() => navigate(-1)} className="store-back-button">
            ← Back
          </button>

          <div className="store-header">
            <div className="store-info">
              <div className="store-header-image-wrapper">
                <img
                  src={
                    store.profileImageURL ||
                    'https://via.placeholder.com/64x64?text=Store'
                  }
                  alt={store.storeName}
                  className="store-image"
                />
              </div>
              <h1 className="store-title">{store.storeName}</h1>
              <p className="store-address">{store.address}</p>
              <p className="store-description">{store.description}</p>
              <div className="store-rating-section">
                <StarRating
                  rating={store.averageRating || 0}
                  reviewCount={store.reviewCount || 0}
                  size="medium"
                />
                {store.reviewCount > 0 && (
                  <button
                    className="view-reviews-btn"
                    onClick={() => setShowReviewsModal(true)}
                  >
                    Read Reviews
                  </button>
                )}
                <button
                  className="write-review-btn"
                  onClick={() => setShowReviewModal(true)}
                >
                  Write a Review
                </button>
              </div>
            </div>
          </div>

          <div className="search-controls">
            <div className="filters">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="filter-select"
              >
                <option value="">All Styles</option>
                {styleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>

              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="filter-select"
              >
                <option value="">All Sizes</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <div className="price-range">
                <span className="price-label">Price Range:</span>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="price-input"
                  placeholder="Min"
                />
                <span className="price-separator">to</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="price-input"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className="store-content">
            <div className="items-section">
              <h2 className="section-title">
                <span className="section-icon"></span>
                Items
                <span className="results-count">
                  ({filteredClothes.length} items)
                </span>
              </h2>

              <div className="items-grid">
                {filteredClothes.map((item) => (
                  <div
                    key={item.itemId}
                    onClick={() => setSelectedItem(item)}
                    className="item-card"
                  >
                    {item.status === 'Reserved' && (
                      <span className="reserved-badge">Reserved</span>
                    )}
                    <div className="item-image-container">
                      <img
                        src={
                          item.images && item.images.length > 0
                            ? item.images[0].imageURL
                            : 'https://via.placeholder.com/200x200?text=No+Image'
                        }
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="item-content">
                      <h3 className="item-title">{item.name}</h3>
                      <div className="item-tags">
                        <span className="item-tag category">
                          {item.category}
                        </span>
                        <span className="item-tag style">{item.style}</span>
                      </div>
                      <div className="item-details">
                        <span className="item-size">{item.size}</span>
                      </div>
                      <div className="item-footer">
                        <p className="item-price">R{item.price}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredClothes.length === 0 && (
                  <div className="no-items">
                    <div className="no-items-icon">📦</div>
                    <h3 className="no-items-title">No items available</h3>
                    <p className="no-items-message">
                      Try adjusting your filters to find items in this store.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedStyle('');
                        setSelectedSize('');
                        setPriceRange([0, 1000]);
                      }}
                      className="clear-filters-button"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {selectedItem && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="modal-close"
                >
                  &times;
                </button>
                <div className="modal-body">
                  <div className="modal-image-carousel">
                    <img
                      src={
                        selectedItem.images && selectedItem.images.length > 0
                          ? selectedItem.images[currentImageIndex]?.imageURL ||
                            'https://via.placeholder.com/250x250?text=No+Image'
                          : 'https://via.placeholder.com/250x250?text=No+Image'
                      }
                      alt={selectedItem.name}
                      className="modal-image"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/250x250?text=No+Image';
                      }}
                    />
                    {selectedItem.images && selectedItem.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="carousel-button prev"
                        >
                          &larr;
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="carousel-button next"
                        >
                          &rarr;
                        </button>
                      </>
                    )}
                  </div>
                  <div className="modal-info">
                    <h2 className="modal-title">{selectedItem.name}</h2>
                    <div className="modal-description-section">
                      <h3 className="modal-section-title">Description</h3>
                      <p className="modal-description">
                        {selectedItem.description || 'No description available'}
                      </p>
                    </div>
                    <div className="modal-details-section">
                      <h3 className="modal-section-title">Details</h3>
                      <div className="modal-details-grid">
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">
                            label
                          </span>
                          <span>Category: {selectedItem.category}</span>
                        </div>
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">
                            straighten
                          </span>
                          <span>Size: {selectedItem.size || 'N/A'}</span>
                        </div>
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">
                            group
                          </span>
                          <span>Department: {selectedItem.department}</span>
                        </div>
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">
                            currency_exchange
                          </span>
                          <span>Price: R{selectedItem.price}</span>
                        </div>
                      </div>
                    </div>
                    {selectedItem.measurements && (
                      <div className="modal-measurements-section">
                        <h3 className="modal-section-title">Measurements</h3>
                        <p className="modal-measurements">
                          {selectedItem.measurements}
                        </p>
                      </div>
                    )}
                    {selectedItem.status === 'Reserved' && (
                      <p className="modal-reserved">This item is reserved</p>
                    )}
                    <div className="modal-actions">
                      <button
                        onClick={() => handleReserve(selectedItem.itemId)}
                        disabled={selectedItem.status === 'Reserved'}
                        className="modal-button reserve"
                      >
                        Reserve
                      </button>
                      <button
                        onClick={() => handleEnquire(selectedItem.itemId)}
                        className="modal-button enquire"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showReviewsModal && (
            <ReviewsModal
              storeId={store.storeId}
              storeName={store.storeName}
              isOpen={showReviewsModal}
              onClose={() => setShowReviewsModal(false)}
            />
          )}
          {showReviewModal && (
            <StoreReviewModal
              isOpen={showReviewModal}
              onClose={() => setShowReviewModal(false)}
              onSubmit={handleSubmitReview}
              storeName={store.storeName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
