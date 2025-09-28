import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import { API_URL } from '../../api';
import StoreSidebar from '../../components/StoreSidebar';
import './StoreListings.css';

export default function StoreListings() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    category: '',
    style: '',
    status: '',
  });
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const auth = getAuth();
  const [loading, setLoading] = useState(true); // Add this to your state declarations
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true); // Set loading to true before fetching
        try {
          const token = await user.getIdToken();
          const storeResponse = await axios.get(`${API_URL}/api/my-store`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const storeId = storeResponse.data.storeId;
          const response = await axios.get(
            `${API_URL}/api/stores/${storeId}/items`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setItems(response.data);
        } catch (error) {
          console.error('Error fetching items:', error);
          if (error.response?.status === 404) {
            setError('No items found for this store.');
          } else if (error.response?.status === 400) {
            setError('Store profile not found. Please create a store.');
            navigate('/store/profile');
          } else {
            setError('Failed to fetch listings: ' + error.message);
          }
        } finally {
          setLoading(false); // Set loading to false after fetch completes
        }
      } else {
        setError('Please log in.');
        navigate('/login');
        setLoading(false); // Ensure loading is false if not authenticated
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (!filters.department || item.department === filters.department) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.style || item.style === filters.style) &&
      (!filters.status || item.status === filters.status)
  );

  const handleEdit = (itemId, e, itemStatus) => {
    e.stopPropagation();
    if (itemStatus.toLowerCase() === 'sold') {
      alert('Cannot edit a sold item.');
      return;
    }
    setSelectedItem(null);
    navigate(`/store/listings/edit/${itemId}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setError('Failed to log out: ' + error.message);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    console.log('Selected item images:', item.images); // Debug log
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const nextImage = () => {
    if (selectedItem?.images && selectedItem.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedItem.images.length);
    }
  };

  const prevImage = () => {
    if (selectedItem?.images && selectedItem.images.length > 1) {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + selectedItem.images.length) % selectedItem.images.length
      );
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  const uniqueDepartments = [
    ...new Set(items.map((item) => item.department).filter(Boolean)),
  ];
  const uniqueCategories = [
    ...new Set(items.map((item) => item.category).filter(Boolean)),
  ];
  const uniqueStyles = [
    ...new Set(items.map((item) => item.style).filter(Boolean)),
  ];
  const uniqueStatuses = [
    ...new Set(items.map((item) => item.status).filter(Boolean)),
  ];
  if (loading) {
    return (
      <div className="store-listings">
        <div className="layout-container">
          <StoreSidebar currentPage="Listings" onLogout={handleLogout} />
          <div className="content">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading listings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }
  return (
    <div className="store-listings">
      <div className="layout-container">
        <StoreSidebar currentPage="Listings" onLogout={handleLogout} />
        <div className="content">
          <div className="header">
            <h1>Listings</h1>
            <button onClick={() => navigate('/store/listings/add')}>
              Add Listing
            </button>
          </div>

          <div className="search-filters">
            <div className="search-bar">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
              <input
                placeholder="Search listings"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="mobile-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters ⬆' : 'Show Filters ⬇'}
            </button>
            <div className={`filters ${showFilters ? 'visible' : ''}`}>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filters.style}
                onChange={(e) =>
                  setFilters({ ...filters, style: e.target.value })
                }
              >
                <option value="">All Styles</option>
                {uniqueStyles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            <p className="click-info">Click on an item to view more details.</p>
            {filteredItems.length === 0 ? (
              <p>No items match the filters.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Item</th>
                    <th>Department</th>
                    <th>Category</th>
                    <th>Style</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.itemId} onClick={() => handleItemClick(item)}>
                      <td>
                        {item.images?.[0]?.imageURL ? (
                          <img src={item.images[0].imageURL} alt={item.name} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.department || 'N/A'}</td>
                      <td>{item.category || 'N/A'}</td>
                      <td>{item.style || 'N/A'}</td>
                      <td>R{Number(item.price).toFixed(2)}</td>
                      <td>
                        <span className="status-tag">{item.status}</span>
                      </td>
                      <td>
                        {item.status.toLowerCase() === 'sold' ? (
                          <button className="action-button disabled" disabled>
                            Edit
                          </button>
                        ) : (
                          <button
                            className="action-button"
                            onClick={(e) =>
                              handleEdit(item.itemId, e, item.status)
                            }
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>
              ×
            </button>
            <div className="modal-body">
              <div className="left-column">
                <div className="image-carousel">
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    <>
                      <img
                        src={selectedItem.images[currentImageIndex].imageURL}
                        alt={selectedItem.name}
                      />
                      {selectedItem.images.length > 1 && (
                        <div className="carousel-controls">
                          <button className="prev-btn" onClick={prevImage}>
                            ‹
                          </button>
                          <button className="next-btn" onClick={nextImage}>
                            ›
                          </button>
                          <p className="image-counter">
                            {currentImageIndex + 1} /{' '}
                            {selectedItem.images.length}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-image-large">No Images</div>
                  )}
                </div>

                <span className="price">
                  R{Number(selectedItem.price).toFixed(2)}
                </span>
                {selectedItem.status.toLowerCase() === 'sold' ? (
                  <button className="edit-button disabled" disabled>
                    Edit Listing
                  </button>
                ) : (
                  <button
                    className="edit-button"
                    onClick={() =>
                      handleEdit(selectedItem.itemId, null, selectedItem.status)
                    }
                  >
                    Edit Listing
                  </button>
                )}
              </div>
              <div className="item-info">
                <h2>
                  {selectedItem.name}{' '}
                  <span className="status-tag-large">
                    {selectedItem.status}
                  </span>
                </h2>
                <div className="info-box">
                  <h3>Description</h3>
                  <p>
                    {selectedItem.description || 'No description available.'}
                  </p>
                </div>
                <div className="info-box">
                  <h3>Details</h3>
                  <p>
                    <strong>Department:</strong>{' '}
                    {selectedItem.department || 'N/A'}
                    <br />
                    <strong>Category:</strong> {selectedItem.category || 'N/A'}
                    <br />
                    <strong>Style:</strong> {selectedItem.style || 'N/A'}
                  </p>
                  {selectedItem.stock && (
                    <p>
                      <strong>Stock:</strong> {selectedItem.stock}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
