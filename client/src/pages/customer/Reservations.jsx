import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import CustomerSidebar from '../../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Reservations.css';
import { API_URL } from '../../api';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [items, setItems] = useState({});
  const [stores, setStores] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        // Fetch reservations
        const resResponse = await axios.get(
          `${API_URL}/api/stores/reservations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const resData = resResponse.data;
        setReservations(resData);

        if (resData.length === 0) return;

        // Fetch item and store details
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

        const storePromises = resData.map((res) =>
          axios
            .get(`${API_URL}/api/stores/${res.storeId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { storeName: 'Unknown Store' } }))
        );
        const storeResponses = await Promise.all(storePromises);
        const storeMap = {};
        storeResponses.forEach((resp, idx) => {
          storeMap[resData[idx].storeId] = resp.data;
        });
        setStores(storeMap);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(
          'Failed to load reservations: ' +
            (err.response?.data?.error || err.message)
        );
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleConfirmReceived = (reservation) => {
    setSelectedReservation(reservation);
    setShowConfirmModal(true);
    setRating(5);
    setReview('');
  };

  const handleSubmitReview = async () => {
    if (!selectedReservation) return;

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser.getIdToken();

      const reviewData = {
        reservationId: selectedReservation.reservationId,
        itemId: selectedReservation.itemId,
        storeId: selectedReservation.storeId,
        rating: rating,
        review: review.trim(),
      };

      console.log('=== FRONTEND REVIEW SUBMISSION ===');
      console.log('Review data being sent:', reviewData);
      console.log('Selected reservation:', selectedReservation);

      // Submit review and confirm receipt
      const reviewResponse = await axios.post(
        `${API_URL}/api/stores/reviews`,
        reviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Review response:', reviewResponse.data);

      // Update reservation status to Completed
      const confirmResponse = await axios.put(
        `${API_URL}/api/stores/reservations/${selectedReservation.reservationId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Confirm response:', confirmResponse.data);

      // Update local state
      setReservations((prev) =>
        prev.map((res) =>
          res.reservationId === selectedReservation.reservationId
            ? { ...res, status: 'Completed' }
            : res
        )
      );

      setShowConfirmModal(false);
      setSelectedReservation(null);

      console.log('Review submission completed successfully');
    } catch (err) {
      console.error('Failed to submit review:', err);
      console.error('Error response:', err.response?.data);
      setError(
        'Failed to confirm receipt: ' +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (reservation) => {
    if (reservation.status === 'Sold') {
      return (
        <div className="status-sold">
          <span className="status-text">Sold - Awaiting Confirmation</span>
          <button
            className="confirm-button"
            onClick={() => handleConfirmReceived(reservation)}
          >
            Confirm Received
          </button>
        </div>
      );
    }
    return <span className="status-text">{reservation.status}</span>;
  };

  return (
    <div className="reservations">
      <CustomerSidebar activePage="reservations" />
      <div className="layout-container">
        <div className="content">
          <h2>My Reservations</h2>
          {error && <div className="error">{error}</div>}
          {reservations.length === 0 ? (
            <p>No reservations found. Browse items to make a reservation.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Store</th>
                  <th>Status</th>
                  <th>Reserved At</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.reservationId}>
                    <td>{items[res.itemId]?.name || 'Loading...'}</td>
                    <td>{stores[res.storeId]?.storeName || 'Loading...'}</td>
                    <td>{getStatusDisplay(res)}</td>
                    <td>
                      {res.reservedAt
                        ? new Date(
                            res.reservedAt._seconds * 1000 +
                              res.reservedAt._nanoseconds / 1e6
                          ).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedReservation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Item Receipt</h3>
            <p>
              Please confirm that you have received{' '}
              <strong>{items[selectedReservation.itemId]?.name}</strong> from{' '}
              <strong>{stores[selectedReservation.storeId]?.storeName}</strong>
            </p>

            <div className="form-group">
              <label>Rating (1-5 stars):</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= rating ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Review:</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this item..."
                rows="4"
                maxLength="500"
              />
              <small>{review.length}/500 characters</small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedReservation(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-button"
                onClick={handleSubmitReview}
                disabled={isSubmitting || !review.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
