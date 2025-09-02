import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api';
import './StoreReservations.css';

export default function StoreReservations() {
  const [reservations, setReservations] = useState([]);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState({});
  const [users, setUsers] = useState({});
  const [stores, setStores] = useState({});
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
        const roleResponse = await axios.post(
          `${API_URL}/api/auth/getRole`,
          { uid: user.uid },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userRole = roleResponse.data.role || 'customer';
        setRole(userRole);

        const resResponse = await axios.get(
          `${API_URL}/api/stores/reservations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const resData = resResponse.data;
        setReservations(resData);

        if (resData.length === 0) return;

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

        if (userRole === 'storeOwner') {
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
        } else {
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
        }
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

  const handleUpdateStatus = async (reservationId, newStatus) => {
    if (role !== 'storeOwner') return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(
        `${API_URL}/api/stores/reservations/${reservationId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReservations((prev) =>
        prev.map((res) =>
          res.reservationId === reservationId
            ? { ...res, status: newStatus }
            : res
        )
      );
    } catch (err) {
      setError('Failed to update status: ' + err.message);
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

  return (
    <div className="store-reservations">
      <div className="layout-container">
        <div className="sidebar">
          <div className="sidebar-item" onClick={() => navigate('/store/home')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
            </svg>
            <p>Home</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/listings')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M56,128a16,16,0,1,1-16-16A16,16,0,0,1,56,128ZM40,48A16,16,0,1,0,56,64,16,16,0,0,0,40,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,40,176Zm176-64H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V120A8,8,0,0,0,216,112Zm0-64H88a8,8,0,0,0-8,8V72a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48Zm0,128H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V184A8,8,0,0,0,216,176Z"></path>
            </svg>
            <p>Listings</p>
          </div>
          <div
            className="sidebar-item active"
            onClick={() => navigate('/store/reservations')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"></path>
            </svg>
            <p>Reservations</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/chats')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V168.45l-26.88-23.8a16,16,0,0,0-21.81.75L147.47,168H40V56Z M40,184V179.47l25.19-25.18a16,16,0,0,0,21.93-.58L107.47,176H194.12l26.88,23.8a8,8,0,0,0-.12-15.55Z"></path>
            </svg>
            <p>Chats</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/profile')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
            </svg>
            <p>Store Profile</p>
          </div>
          <div className="sidebar-item" onClick={handleLogout}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M120,216a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h72a8,8,0,0,1,0,16H48V208h64A8,8,0,0,1,120,216Zm108.56-96.56-48-48A8,8,0,0,0,174.93,80H104a8,8,0,0,0,0,16h50.64l35.2,35.2a8,8,0,0,0,11.32,0l48-48A8,8,0,0,0,228.56,119.44Z"></path>
            </svg>
            <p>Logout</p>
          </div>
        </div>
        <div className="content">
          <h2>
            {role === 'storeOwner' ? 'Store Reservations' : 'My Reservations'}
          </h2>
          {error && <div className="error">{error}</div>}
          {reservations.length === 0 ? (
            <p>
              No reservations found.{' '}
              {role === 'storeOwner'
                ? 'Create a store to start receiving reservations.'
                : 'Browse items to make a reservation.'}
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  {role === 'storeOwner' ? <th>Customer</th> : <th>Store</th>}
                  <th>Status</th>
                  <th>Reserved At</th>
                  {role === 'storeOwner' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.reservationId}>
                    <td>{items[res.itemId]?.name || 'Loading...'}</td>
                    {role === 'storeOwner' ? (
                      <td>{users[res.userId]?.displayName || 'Loading...'}</td>
                    ) : (
                      <td>{stores[res.storeId]?.storeName || 'Loading...'}</td>
                    )}
                    <td>{res.status}</td>
                    <td>
                      {res.reservedAt
                        ? new Date(
                            res.reservedAt._seconds * 1000 +
                              res.reservedAt._nanoseconds / 1e6
                          ).toLocaleString()
                        : 'N/A'}
                    </td>
                    {role === 'storeOwner' && (
                      <td>
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
                      </td>
                    )}
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
