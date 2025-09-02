import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import { API_URL } from '../../api';
import './StoreListings.css';

export default function StoreListings() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
        }
      } else {
        setError('Please log in.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (itemId) => {
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

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="store-listings">
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
            className="sidebar-item active"
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
            className="sidebar-item"
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
          <div className="header">
            <h1>Listings</h1>
            <button onClick={() => navigate('/store/listings/add')}>
              Add Listing
            </button>
          </div>
          <label className="search-bar">
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
          </label>
          <div className="table-container">
            <table>
              <thead>
                <tr>
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
                  <tr key={item.itemId}>
                    <td>
                      {item.images?.[0]?.imageURL ? (
                        <img src={item.images[0].imageURL} alt={item.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>
                    <td>{item.department || 'N/A'}</td>
                    <td>{item.category || 'N/A'}</td>
                    <td>{item.style || 'N/A'}</td>
                    <td>{`R${Number(item.price).toFixed(2)}`}</td>
                    <td>
                      <button className="status-button">{item.status}</button>
                    </td>
                    <td>
                      <button
                        className="action-button"
                        onClick={() => handleEdit(item.itemId)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
