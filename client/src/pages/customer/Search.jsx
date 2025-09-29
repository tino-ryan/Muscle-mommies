import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import CustomerSidebar from '../../components/CustomerSidebar';
import './search.css';
import { API_URL } from '../../api';

export default function SearchPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getPrimaryImageURL = (item) => {
    if (!item.images || item.images.length === 0) {
      return 'https://via.placeholder.com/200x200?text=No+Image';
    }
    const primaryImage =
      item.images.find((img) => img.isPrimary) || item.images[0];
    return primaryImage.imageURL;
  };

  const getStoreName = (storeId) => {
    const store = stores.find((s) => s.storeId === storeId);
    return store ? store.storeName : 'Unknown Store';
  };

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
    const loadData = async () => {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const [storesResponse, itemsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/stores`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/items`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setStores(storesResponse.data);
        setItems(itemsResponse.data);
      } catch (err) {
        setError(
          'Failed to load data: ' + (err.response?.data?.error || err.message)
        );
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      loadData();
    } else {
      navigate('/login');
    }
  }, [navigate, auth]);

  const handleReserve = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = items.find((i) => i.itemId === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      const reserveResponse = await axios.put(
        `${API_URL}/api/stores/reserve/${itemId}`,
        { storeId: item.storeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!reserveResponse.data.reservationId) {
        throw new Error('Failed to create reservation');
      }

      setItems((prev) =>
        prev.map((i) =>
          i.itemId === itemId ? { ...i, status: 'Reserved' } : i
        )
      );
      setSelectedItem((prev) =>
        prev && prev.itemId === itemId ? { ...prev, status: 'Reserved' } : prev
      );

      const store = stores.find((s) => s.storeId === item.storeId);
      if (!store) {
        throw new Error('Store not found');
      }
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
      const item = items.find((i) => i.itemId === itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      const store = stores.find((s) => s.storeId === item.storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      const messageResponse = await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId: store.ownerId,
          message: `Hey, I would like to enquire about the item ${item.name}`,
          itemId,
          storeId: item.storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!messageResponse.data.messageId) {
        throw new Error('Failed to send enquiry message');
      }

      const chatId = [user.uid, store.ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error sending enquiry:', error);
      alert(`Failed to send enquiry: ${error.message}`);
    }
  };

  const filteredStores = stores.filter((store) =>
    store.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter((item) => {
    const matchesSearch = searchTerm
      ? item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCategory = categoryFilter
      ? item.category === categoryFilter
      : true;
    const matchesStyle = styleFilter ? item.style === styleFilter : true;
    const matchesDepartment = departmentFilter
      ? item.department === departmentFilter
      : true;
    const matchesPrice =
      item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesStatus = item.status === 'Available';
    return (
      matchesSearch &&
      matchesCategory &&
      matchesStyle &&
      matchesDepartment &&
      matchesPrice &&
      matchesStatus
    );
  });

  if (loading) {
    return (
      <div className="search-home">
        <CustomerSidebar activePage="search" />
        <div className="content-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">Loading items...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-home">
        <CustomerSidebar activePage="search" />
        <div className="content-container">
          <div className="error-container">
            <h3 className="error-title">Error Loading Data</h3>
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-home">
      <CustomerSidebar activePage="search" />
      <div className="content-container">
        <div className="search-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for stores or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="tops">Tops</option>
              <option value="shirts">Shirts</option>
              <option value="pants">Pants</option>
              <option value="dresses">Dresses</option>
              <option value="footwear">Footwear</option>
              <option value="skirts">Skirts</option>
              <option value="accessories">Accessories</option>
            </select>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Styles</option>
              <option value="y2k">Y2K</option>
              <option value="grunge">Grunge</option>
              <option value="streetwear">Streetwear</option>
              <option value="vintage">Vintage</option>
              <option value="basics">Basics</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Departments</option>
              <option value="women's">Women&apos;s</option>
              <option value="men's">Men&apos;s</option>
              <option value="children">Children</option>
              <option value="unisex">Unisex</option>
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
        <div className="results">
          {searchTerm && filteredStores.length > 0 && (
            <div className="stores-section">
              <h2 className="section-title">
                <span className="section-icon">🏪</span>
                Stores
                <span className="results-count">
                  ({filteredStores.length} found)
                </span>
              </h2>
              <div className="stores-grid">
                {filteredStores.map((store) => (
                  <div
                    key={store.storeId}
                    className="store-card"
                    onClick={() => navigate(`/store/${store.storeId}`)}
                  >
                    <img
                      src={
                        store.profileImageURL ||
                        'https://via.placeholder.com/80x80?text=Store'
                      }
                      alt={store.storeName}
                      className="store-image"
                    />
                    <div className="store-content">
                      <h3 className="store-title">{store.storeName}</h3>
                      <p className="store-address">{store.address}</p>
                      <p className="store-description">{store.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {filteredItems.length > 0 && (
            <div className="items-section">
              <h2 className="section-title">
                <span className="section-icon"></span>
                {searchTerm || categoryFilter || styleFilter || departmentFilter
                  ? 'Search Results'
                  : 'All Items'}
                <span className="results-count">
                  ({filteredItems.length} items)
                </span>
              </h2>
              <div className="items-grid">
                {filteredItems.map((item) => (
                  <div
                    key={item.itemId || item.id}
                    className="item-card"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-image-container">
                      <img
                        src={getPrimaryImageURL(item)}
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
                      <span className="store-name">
                        {getStoreName(item.storeId)}
                      </span>
                      <div className="item-tags">
                        <span className="item-tag category">
                          {item.category}
                        </span>
                        <span className="item-tag style">{item.style}</span>
                      </div>
                      <div className="item-details">
                        <span className="item-department">
                          {item.department}
                        </span>
                        {item.size && (
                          <span className="item-size">{item.size}</span>
                        )}
                      </div>
                      <div className="item-footer">
                        <p className="item-price">R{item.price}</p>
                        {item.quantity && (
                          <span className="item-quantity">
                            {item.quantity} left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loading &&
            (searchTerm || categoryFilter || styleFilter || departmentFilter) &&
            filteredStores.length === 0 &&
            filteredItems.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3 className="no-results-title">No results found</h3>
                <p className="no-results-message">
                  Try adjusting your search terms or filters to find what
                  you&apos;re looking for
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setStyleFilter('');
                    setDepartmentFilter('');
                    setPriceRange([0, 500]);
                  }}
                  className="clear-filters-button"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          {!searchTerm &&
            !categoryFilter &&
            !styleFilter &&
            !departmentFilter &&
            items.length === 0 &&
            !loading && (
              <div className="no-items">
                <div className="no-items-icon">📦</div>
                <h3 className="no-items-title">No items available</h3>
                <p className="no-items-message">
                  Check back later for new thrift finds!
                </p>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
}
