import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import CustomerSidebar from '../../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyCloset.css';
import { API_URL } from '../../api';

export default function MyCloset() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [items, setItems] = useState({});
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
        // Fetch reservations for the logged-in user
        const resResponse = await axios.get(
          `${API_URL}/api/stores/reservations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const resData = resResponse.data;
        setReservations(resData);

        if (resData.length === 0) return;

        // Fetch item details (to get images)
        const itemPromises = resData.map((res) =>
          axios
            .get(`${API_URL}/api/items/${res.itemId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({
              data: { images: [{ imageURL: 'https://via.placeholder.com/200x200?text=No+Image' }] },
            }))
        );
        const itemResponses = await Promise.all(itemPromises);
        const itemMap = {};
        itemResponses.forEach((resp, idx) => {
          itemMap[resData[idx].itemId] = resp.data;
        });
        setItems(itemMap);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(
          'Failed to load closet: ' +
            (err.response?.data?.error || err.message)
        );
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  return (
    <div className="closet">
      <CustomerSidebar activePage="closet" />
      <div className="content-container">
        <h2>My Closet</h2>
        {error && <div className="error">{error}</div>}
        {reservations.length === 0 ? (
          <p>No reserved items yet. Start browsing and reserve your favorites!</p>
        ) : (
          <div className="closet-items">
            {reservations.map((res) => {
              const item = items[res.itemId] || {};
              const itemImages = item.images || []; // backend should return an array

              return (
                <div className="closet-item" key={res.reservationId}>
                  {itemImages.length > 0 ? (
                    itemImages.map((img, index) => (
                      <img
                        key={index}
                        src={img.imageURL}
                        alt={item.name || 'Closet item'}
                        className="closet-image"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    ))
                  ) : (
                    <img
                      src="https://via.placeholder.com/200x200?text=No+Image"
                      alt="No item available"
                      className="closet-image"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
