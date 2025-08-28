import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

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
      <div className="store-setup-prompt">
        <h1>Welcome, Store Owner!</h1>
        <p>You don&apos;t have a store set up yet. Let&apos;s get started!</p>
        <button onClick={() => navigate('/store/profile')}>Set Up Store</button>
      </div>
    );
  }

  return (
    <div className="store-home">
      <h1>Your Store Dashboard</h1>
      <div className="options">
        <button onClick={() => navigate('/store/chats')}>Chats</button>
        <button onClick={() => navigate('/reservations')}>Reservations</button>
        <button onClick={() => navigate('/store/listings')}>Listings</button>
        <button onClick={() => navigate('/analytics')}>Analytics</button>
        <button onClick={() => navigate('/store/profile')}>
          Store Profile
        </button>
      </div>
    </div>
  );
}
