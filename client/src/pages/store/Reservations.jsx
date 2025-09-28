import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StoreSidebar from '../../components/StoreSidebar';
import { API_URL } from '../../api';
import './StoreReservations.css';

// --- New Mobile Card Component ---
const ReservationCard = ({
  reservation,
  item,
  user,
  viewMode,
  handleUpdateStatus,
  setSelectedReservation,
}) => {
  const statusClass = `status-${reservation.status.toLowerCase()}`;
  const isCompleted = reservation.status === 'Completed';

  const dateField =
    viewMode === 'sales' && reservation.soldAt
      ? reservation.soldAt
      : reservation.reservedAt;
  const dateString = dateField
    ? new Date(dateField._seconds * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <div
      className="reservation-card"
      onClick={() => setSelectedReservation(reservation)}
    >
      <div className="card-header">
        {item?.images?.[0]?.imageURL && (
          <img
            src={item.images[0].imageURL}
            alt={item.name}
            className="card-image"
          />
        )}
        <span className="card-item-name">{item?.name || 'Loading...'}</span>
        <span className={`card-status ${statusClass}`}>
          {reservation.status}
        </span>
      </div>
      <div className="card-body">
        <p className="card-customer">
          <i className="fas fa-user"></i> {user?.displayName || 'Loading...'}
          <i className="fas fa-calendar-alt"></i>{' '}
          {viewMode === 'sales' ? 'Sold:' : 'Reserved:'} {dateString}
          <i className="fas fa-tag"></i> R{item?.price || 'N/A'}
        </p>
      </div>
      {!isCompleted && viewMode === 'active' && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <select
            value={reservation.status}
            onChange={(e) =>
              handleUpdateStatus(reservation.reservationId, e.target.value)
            }
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export default function StoreReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true); // Add this to your state declarations
  const [items, setItems] = useState({});
  const [users, setUsers] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false); // New State for Mobile Filters
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        setLoading(false); // Ensure loading is false if not authenticated
        return;
      }

      setLoading(true); // Set loading to true before fetching
      try {
        const token = await user.getIdToken();
        const resResponse = await axios.get(
          `${API_URL}/api/stores/reservations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const resData = resResponse.data;
        setReservations(resData);

        if (resData.length === 0) {
          setLoading(false); // No reservations, stop loading
          return;
        }

        const itemPromises = resData.map((res) =>
          axios
            .get(`${API_URL}/api/items/${res.itemId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { name: 'Unknown Item' } }))
        );
        const itemResponses = await Promise.all(itemPromises);
        const itemMap = {};
        itemResponses.forEach((resp, idx) => {
          itemMap[resData[idx].itemId] = resp.data;
        });
        setItems(itemMap);

        const userPromises = resData.map((res) =>
          axios
            .get(`${API_URL}/api/stores/users/${res.userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { displayName: 'Unknown User' } }))
        );
        const userResponses = await Promise.all(userPromises);
        const userMap = {};
        userResponses.forEach((resp, idx) => {
          userMap[resData[idx].userId] = resp.data;
        });
        setUsers(userMap);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(
          'Failed to load reservations: ' +
            (err.response?.data?.error || err.message)
        );
      } finally {
        setLoading(false); // Set loading to false after all fetches complete
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    const uniqueCategories = [
      ...new Set(
        Object.values(items).map((item) => item.category || 'Uncategorized')
      ),
    ].sort();
    setCategories(uniqueCategories);
  }, [items]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdateStatus = async (reservationId, newStatus) => {
    const res = reservations.find((r) => r.reservationId === reservationId);
    if (res.status === 'Completed' && newStatus !== 'Completed') {
      setMessage(
        'Cannot change status of completed reservation back to active.'
      );
      return;
    }

    // Slight modification to confirmation message to be more mobile-friendly
    const confirmMsg = `Confirm status change to ${newStatus}? ${
      newStatus === 'Completed'
        ? 'This completes the sale and removes it from active reservations.'
        : ''
    }`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(
        `${API_URL}/api/stores/reservations/${reservationId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReservations((prev) =>
        prev.map((r) =>
          r.reservationId === reservationId ? { ...r, status: newStatus } : r
        )
      );
      setMessage('Status updated successfully!');
    } catch (err) {
      setError(
        'Failed to update status: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setError('Failed to log out: ' + error.message);
    }
  };

  // (filteredReservations remains the same)
  // ... [filteredReservations code is omitted for brevity, as it's unchanged]
  const filteredReservations = reservations.filter((res) => {
    const isActive = res.status !== 'Completed';
    if (viewMode === 'active' && !isActive) return false;
    if (viewMode === 'sales' && isActive) return false;

    const item = items[res.itemId];
    const user = users[res.userId];
    if (!item || !user) return false;

    const searchLower = searchTerm.toLowerCase();
    if (
      searchLower &&
      !item.name.toLowerCase().includes(searchLower) &&
      !user.displayName.toLowerCase().includes(searchLower)
    )
      return false;

    if (
      selectedCategory !== 'all' &&
      (item.category || 'Uncategorized') !== selectedCategory
    )
      return false;

    if (selectedStatus !== 'all' && res.status !== selectedStatus) return false;

    if (selectedTime !== 'all') {
      const dateField =
        viewMode === 'sales' && res.soldAt ? res.soldAt : res.reservedAt;
      if (!dateField) return false;
      const reservedDate = new Date(dateField._seconds * 1000);

      const now = new Date();
      let startDate;
      if (selectedTime === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (selectedTime === '7days') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedTime === 'month') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
      }
      if (reservedDate < startDate) return false;
    }

    return true;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const nextImage = () => {
    if (selectedReservation) {
      const item = items[selectedReservation.itemId];
      if (item?.images && item.images.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
      }
    }
  };

  const prevImage = () => {
    if (selectedReservation) {
      const item = items[selectedReservation.itemId];
      if (item?.images && item.images.length > 1) {
        setCurrentImageIndex(
          (prev) => (prev - 1 + item.images.length) % item.images.length
        );
      }
    }
  };
  if (loading) {
    return (
      <div className="store-reservations">
        <div className="layout-container">
          <StoreSidebar currentPage="Reservations" onLogout={handleLogout} />
          <div className="content">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading reservations...</p>
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
    <div className="store-reservations">
      <div className="layout-container">
        <StoreSidebar currentPage="Reservations" onLogout={handleLogout} />
        <div className="content">
          <div className="header">
            <h1>
              {viewMode === 'active' ? 'Active Reservations' : 'Past Sales 💸'}
            </h1>
            <button
              onClick={() =>
                setViewMode(viewMode === 'active' ? 'sales' : 'active')
              }
            >
              {viewMode === 'active'
                ? 'View Past Sales'
                : 'View Active Reservations'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="header-controls">
            {/* Mobile Filter Toggle */}
            <button
              className="mobile-filter-toggle"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              {showMobileFilters ? 'Hide Filters ⬆️' : 'Show Filters ⬇️'}
            </button>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by item or customer name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={`filters ${showMobileFilters ? 'visible' : ''}`}>
            {/* ... Filters UI remains the same, but wrapped in a container that can be toggled */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {viewMode === 'active' ? (
                ['Pending', 'Confirmed', 'Cancelled'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              ) : (
                <option value="Completed">Completed</option>
              )}
            </select>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="no-reservations">
              <p>
                No{' '}
                {viewMode === 'active' ? 'active reservations' : 'past sales'}{' '}
                found.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Reserved At</th>
                    {viewMode === 'sales' && <th>Sold At</th>}
                    {viewMode === 'sales' && <th>Price</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => {
                    const item = items[res.itemId];
                    const user = users[res.userId];
                    return (
                      <tr
                        key={res.reservationId}
                        onClick={() => setSelectedReservation(res)}
                        style={{ cursor: 'pointer' }} // Add cursor to indicate clickability
                      >
                        <td>
                          <div className="item-info">
                            <strong>{item?.name || 'Loading...'}</strong>
                            {item?.price && (
                              <div className="item-price">R{item.price}</div>
                            )}
                          </div>
                        </td>
                        <td>{user?.displayName || 'Loading...'}</td>
                        <td className={`status-${res.status.toLowerCase()}`}>
                          {res.status}
                        </td>
                        <td>
                          {res.reservedAt
                            ? new Date(
                                res.reservedAt._seconds * 1000
                              ).toLocaleString()
                            : 'N/A'}
                        </td>
                        {viewMode === 'sales' && (
                          <td>
                            {res.soldAt
                              ? new Date(
                                  res.soldAt._seconds * 1000
                                ).toLocaleString()
                              : 'N/A'}
                          </td>
                        )}
                        {viewMode === 'sales' && (
                          <td>R{item?.price || 'N/A'}</td>
                        )}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="table-actions">
                            {viewMode === 'active' && (
                              <select
                                value={res.status}
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    res.reservationId,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Mobile Card List View */}
              <div className="reservations-card-list">
                {filteredReservations.map((res) => (
                  <ReservationCard
                    key={res.reservationId}
                    reservation={res}
                    item={items[res.itemId]}
                    user={users[res.userId]}
                    viewMode={viewMode}
                    handleUpdateStatus={handleUpdateStatus}
                    setSelectedReservation={setSelectedReservation}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {selectedReservation && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedReservation(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedReservation(null)}
            >
              ×
            </button>
            <div className="modal-body">
              <div className="left-column">
                <div className="image-carousel">
                  {selectedReservation.itemId &&
                  items[selectedReservation.itemId]?.images?.length > 0 ? (
                    <>
                      <img
                        src={
                          items[selectedReservation.itemId].images[
                            currentImageIndex
                          ].imageURL
                        }
                        alt={items[selectedReservation.itemId].name}
                      />
                      {items[selectedReservation.itemId].images.length > 1 && (
                        <div className="carousel-controls">
                          <button className="prev-btn" onClick={prevImage}>
                            ‹
                          </button>
                          <button className="next-btn" onClick={nextImage}>
                            ›
                          </button>
                          <p className="image-counter">
                            {currentImageIndex + 1} /{' '}
                            {items[selectedReservation.itemId].images.length}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-image-large">No Images</div>
                  )}
                </div>
                <span className="price">
                  R
                  {items[selectedReservation.itemId]?.price
                    ? Number(items[selectedReservation.itemId].price).toFixed(2)
                    : 'N/A'}
                </span>
              </div>
              <div className="item-info">
                <h2>
                  {items[selectedReservation.itemId]?.name || 'N/A'}{' '}
                  <span className="status-tag-large">
                    {selectedReservation.status}
                  </span>
                </h2>
                <div className="info-box">
                  <h3>Description</h3>
                  <p>
                    {items[selectedReservation.itemId]?.description ||
                      'No description available.'}
                  </p>
                </div>
                <div className="info-box">
                  <h3>Details</h3>
                  <p>
                    <strong>Customer:</strong>{' '}
                    {users[selectedReservation.userId]?.displayName || 'N/A'}
                    <br />
                    <strong>Reserved At:</strong>{' '}
                    {formatDate(selectedReservation.reservedAt)}
                    <br />
                    {selectedReservation.soldAt && (
                      <p>
                        <strong>Sold At:</strong>{' '}
                        {formatDate(selectedReservation.soldAt)}
                      </p>
                    )}
                    <strong>Category:</strong>{' '}
                    {items[selectedReservation.itemId]?.category || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
