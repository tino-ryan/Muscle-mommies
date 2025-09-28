import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
//import { API_URL } from '../../api';
import './StoreHome.css';

export default function StoreHome() {
  const [storeExists, setStoreExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const storesRef = collection(db, 'stores');
          const q = query(storesRef, where('ownerId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          setStoreExists(!querySnapshot.empty);
        } catch (error) {
          setError('Failed to check store existence: ' + error.message);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!storeExists) {
    return (
      <div className="store-home">
        <div className="content">
          <h1>Welcome, Store Owner!</h1>
          <p>You don&apos;t have a store set up yet. Let&apos;s get started!</p>
          <button onClick={() => navigate('/store/profile')}>
            Set Up Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="store-home">
      <div className="content">
        <h1>Your Store Dashboard</h1>
        <div className="card-grid">
          <div className="card" onClick={() => navigate('/store/listings')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M56,128a16,16,0,1,1-16-16A16,16,0,0,1,56,128ZM40,48A16,16,0,1,0,56,64,16,16,0,0,0,40,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,40,176Zm176-64H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V120A8,8,0,0,0,216,112Zm0-64H88a8,8,0,0,0-8,8V72a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48Zm0,128H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V184A8,8,0,0,0,216,176Z"></path>
            </svg>
            <h3>Listings</h3>
            <p>Manage your store&apos;s inventory and listings</p>
          </div>
          <div className="card" onClick={() => navigate('/store/reservations')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"></path>
            </svg>
            <h3>Reservations</h3>
            <p>View and manage customer reservations</p>
          </div>
          <div className="card" onClick={() => navigate('/store/chats')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V168.45l-26.88-23.8a16,16,0,0,0-21.81.75L147.47,168H40V56Z M40,184V179.47l25.19-25.18a16,16,0,0,0,21.93-.58L107.47,176H194.12l26.88,23.8a8,8,0,0,0-.12-15.55Z"></path>
            </svg>
            <h3>Chats</h3>
            <p>Communicate with your customers</p>
          </div>
          <div className="card" onClick={() => navigate('/store/profile')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
            </svg>
            <h3>Store Profile</h3>
            <p>Edit your store&apos;s details and contact info</p>
          </div>
          <div
            className="card"
            onClick={() => auth.signOut().then(() => navigate('/login'))}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M120,216a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h72a8,8,0,0,1,0,16H48V208h64A8,8,0,0,1,120,216Zm108.56-96.56-48-48A8,8,0,0,0,174.93,80H104a8,8,0,0,0,0,16h50.64l35.2,35.2a8,8,0,0,0,11.32,0l48-48A8,8,0,0,0,228.56,119.44Z"></path>
            </svg>
            <h3>Logout</h3>
            <p>Sign out of your account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
