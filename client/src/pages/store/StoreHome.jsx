import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import StoreSidebar from '../../components/StoreSidebar';
import './StoreHome.css';
import {
  FaMoneyBillWave,
  FaCalendarCheck,
  FaComments,
  FaTags,
  FaTshirt,
} from 'react-icons/fa';

export default function StoreHome() {
  const [store, setStore] = useState(null);
  const [salesRevenue, setSalesRevenue] = useState(0);
  const [newReservations, setNewReservations] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [styleCounts, setStyleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const storesRef = collection(db, 'stores');
        const storeQ = query(storesRef, where('ownerId', '==', user.uid));
        const storeSnap = await getDocs(storeQ);

        if (storeSnap.empty) {
          setError('No store found. Please set up your store.');
          setLoading(false);
          return;
        }

        const storeDoc = storeSnap.docs[0];
        setStore(storeDoc.data());
        const storeId = storeDoc.id;

        // Sales revenue
        const salesRef = collection(db, 'sales');
        const salesQ = query(salesRef, where('storeId', '==', storeId));
        const salesSnap = await getDocs(salesQ);
        const totalRevenue = salesSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0),
          0
        );
        setSalesRevenue(totalRevenue);

        // New reservations
        const reservationsRef = collection(db, 'Reservations');
        const reservationsQ = query(
          reservationsRef,
          where('storeId', '==', storeId)
        );
        const reservationsSnap = await getDocs(reservationsQ);
        setNewReservations(reservationsSnap.size);

        // Unread chats
        const messagesRef = collection(db, 'messages');
        const messagesQ = query(
          messagesRef,
          where('storeId', '==', storeId),
          where('read', '==', false)
        );
        const messagesSnap = await getDocs(messagesQ);
        setUnreadChats(messagesSnap.size);

        // Items
        const itemsRef = collection(db, 'items');
        const itemsQ = query(itemsRef, where('storeId', '==', storeId));
        const itemsSnap = await getDocs(itemsQ);

        const catMap = {};
        const styleMap = {};

        itemsSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.category)
            catMap[data.category] = (catMap[data.category] || 0) + 1;
          if (data.style) {
            data.style.split(',').forEach((tag) => {
              const t = tag.trim();
              if (t) styleMap[t] = (styleMap[t] || 0) + 1;
            });
          }
        });

        setCategoryCounts(catMap);
        setStyleCounts(styleMap);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch analytics: ' + err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="store-home">
      <StoreSidebar
        currentPage="Home"
        onLogout={() => auth.signOut().then(() => navigate('/login'))}
      />
      <div className="analytics-content">
        <h1>{store?.storeName || 'Your Store'}</h1>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <FaMoneyBillWave className="kpi-icon" />
            <h2>Total Sales</h2>
            <div className="kpi-value">R {salesRevenue.toLocaleString()}</div>
          </div>

          <div className="kpi-card">
            <FaCalendarCheck className="kpi-icon" />
            <h2>New Reservations</h2>
            <div className="kpi-value">{newReservations}</div>
          </div>

          <div className="kpi-card">
            <FaComments className="kpi-icon" />
            <h2>Unread Chats</h2>
            <div className="kpi-value unread">{unreadChats}</div>
          </div>
        </div>

        {/* Listings */}
        <div className="section">
          <h2>
            <FaTags /> Listings Overview by Category
          </h2>
          <div className="card-grid">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div key={cat} className="mini-card">
                <h3>{cat}</h3>
                <p>
                  {count} item{count > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Styles */}
        <div className="section">
          <h2>
            <FaTshirt /> Most Popular Styles
          </h2>
          <div className="card-grid">
            {Object.entries(styleCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([style, count]) => (
                <div key={style} className="mini-card">
                  <h3>{style}</h3>
                  <p>
                    {count} item{count > 1 ? 's' : ''}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
