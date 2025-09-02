// src/components/Reservations.jsx
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import CustomerSidebar from '../../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Reservations.css'; // Create this CSS file

import { API_URL } from '../../api';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [items, setItems] = useState({});
  const [stores, setStores] = useState({});
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchReservations = async () => {
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
    };

    fetchReservations();
  }, [navigate]);

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
                    <td>{res.status}</td>
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
    </div>
  );
}
