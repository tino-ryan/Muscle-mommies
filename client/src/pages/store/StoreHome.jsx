import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';
import StoreSidebar from '../../components/StoreSidebar';
import { API_URL } from '../../api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FaMoneyBillWave,
  FaCalendarCheck,
  FaComments,
  FaTags,
  FaTshirt,
  FaBox,
  FaStore,
  FaArrowRight,
  FaPlus,
  FaEdit,
  FaStar,
  FaEye,
  FaHeart,
  FaEnvelope,
} from 'react-icons/fa';
import './StoreHome.css';

// Skeleton Card Component for Loading State
const SkeletonCard = () => (
  <div className="flip-card-wrapper skeleton">
    <div className="card-front skeleton-card">
      <div className="skeleton-icon" />
      <div className="skeleton-text skeleton-label" />
      <div className="skeleton-text skeleton-value" />
      <div className="skeleton-text skeleton-subtitle" />
    </div>
  </div>
);

// Flip Card Component
const FlipCard = ({ front, back, isFlipped, onFlip }) => {
  return (
    <div className="flip-card-container" onClick={onFlip}>
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front">{front}</div>
        <div className="flip-card-back">{back}</div>
      </div>
    </div>
  );
};

export default function StoreOwnerDashboard() {
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalItems: 0,
    availableItems: 0,
    reservedItems: 0,
    outOfStockItems: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    unreadChats: 0,
    totalChats: 0,
    averagePrice: 0,
    totalOutfits: 0,
    averageRating: 0,
    reviewCount: 0,
    departmentCounts: {},
    categoryCounts: {},
    styleCounts: {},
    topItemViews: 0,
    totalMessagesSent: 0,
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [items, setItems] = useState({});
  const [users, setUsers] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [priorityLoading, setPriorityLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  // Phase 1: Fetch critical data for top cards
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Fetch store
        const storesRef = collection(db, 'stores');
        const storeQ = query(storesRef, where('ownerId', '==', user.uid));
        const storeSnap = await getDocs(storeQ);

        if (storeSnap.empty) {
          setError('No store found. Please set up your store.');
          setPriorityLoading(false);
          return;
        }

        const storeDoc = storeSnap.docs[0];
        const storeData = storeDoc.data();
        setStore({ id: storeDoc.id, ...storeData });
        console.log('Store Data:', { id: storeDoc.id, ...storeData });
        const storeId = storeDoc.id;

        // Fetch items for price lookup
        const itemsRef = collection(db, 'items');
        const itemsQ = query(itemsRef, where('storeId', '==', storeId));
        const itemsSnap = await getDocs(itemsQ);
        const itemPriceMap = {};
        itemsSnap.forEach((doc) => {
          const data = doc.data();
          itemPriceMap[doc.id] = parseFloat(data.price) || 0;
          console.log('Item Doc:', doc.id, { price: data.price }); // Debug item price
        });

        // Reservations (for stats and revenue)
        const reservationsRef = collection(db, 'Reservations');
        const reservationsQ = query(
          reservationsRef,
          where('storeId', '==', storeId)
        );
        const reservationsSnap = await getDocs(reservationsQ);

        let totalRevenue = 0;
        const reservationStats = {
          total: reservationsSnap.size,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };
        const allReservations = [];
        const completedSales = [];

        reservationsSnap.forEach((doc) => {
          const data = doc.data();
          console.log('Reservation Doc:', doc.id, data); // Debug reservation data
          const status = data.status || 'Pending';
          reservationStats[status.toLowerCase()] =
            (reservationStats[status.toLowerCase()] || 0) + 1;

          const reservationData = {
            id: doc.id,
            ...data,
            time: data.reservedAt?.toDate?.() || new Date(),
          };

          if (status === 'Completed') {
            const itemPrice = itemPriceMap[data.itemId] || 0;
            totalRevenue += itemPrice;
            completedSales.push(reservationData);
          } else {
            allReservations.push(reservationData);
          }
        });

        setRecentReservations(allReservations.slice(0, 3));
        setRecentSales(completedSales.slice(0, 3));

        // Messages
        const messagesRef = collection(db, 'messages');
        const messagesQ = query(messagesRef, where('storeId', '==', storeId));
        const messagesSnap = await getDocs(messagesQ);
        const unreadCount = messagesSnap.docs.filter(
          (doc) => !doc.data().read
        ).length;
        const totalMessagesSent = messagesSnap.size;

        const messages = messagesSnap.docs
          .map((doc) => ({
            id: doc.id,
            message: doc.data().message,
            time: doc.data().timestamp?.toDate?.() || new Date(),
            read: doc.data().read,
            senderId: doc.data().senderId,
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 3);
        setRecentMessages(messages);

        // Chats
        const chatsRef = collection(db, 'chats');
        const chatsQ = query(chatsRef, where('storeId', '==', storeId));
        const chatsSnap = await getDocs(chatsQ);

        // Items (basic counts)
        const itemStatusCount = {
          available: 0,
          reserved: 0,
          outOfStock: 0,
        };

        itemsSnap.forEach((doc) => {
          const data = doc.data();
          const status = (data.status || 'Available').toLowerCase();
          if (status.includes('available')) itemStatusCount.available++;
          else if (status.includes('reserved')) itemStatusCount.reserved++;
          else if (status.includes('out')) itemStatusCount.outOfStock++;
        });

        setStats((prev) => ({
          ...prev,
          totalRevenue,
          totalItems: itemsSnap.size,
          availableItems: itemStatusCount.available,
          reservedItems: itemStatusCount.reserved,
          outOfStockItems: itemStatusCount.outOfStock,
          totalReservations: reservationStats.total,
          pendingReservations: reservationStats.pending,
          confirmedReservations: reservationStats.confirmed,
          completedReservations: reservationStats.completed,
          cancelledReservations: reservationStats.cancelled,
          unreadChats: unreadCount,
          totalChats: chatsSnap.size,
          averageRating: storeData.averageRating || 0,
          reviewCount: storeData.reviewCount || 0,
          totalMessagesSent,
        }));

        setPriorityLoading(false);
      } catch (err) {
        console.error('Priority fetch error:', err);
        setError('Failed to fetch critical data: ' + err.message);
        setPriorityLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Phase 2: Fetch additional stats
  useEffect(() => {
    if (!store || !store.id || priorityLoading) {
      console.log(
        'Skipping additional stats fetch: store or store.id is undefined or priorityLoading is true',
        {
          store,
          priorityLoading,
        }
      );
      return;
    }

    const fetchAdditionalStats = async () => {
      try {
        const storeId = store.id;
        console.log('Fetching additional stats for storeId:', storeId);

        // Fetch reviews
        const reviewsResponse = await axios.get(
          `${API_URL}/api/stores/${storeId}/reviews`
        );
        const reviews = reviewsResponse.data || [];
        setRecentReviews(reviews.slice(0, 3));

        // Items (detailed stats)
        const itemsRef = collection(db, 'items');
        const itemsQ = query(itemsRef, where('storeId', '==', storeId));
        const itemsSnap = await getDocs(itemsQ);

        const itemMap = {};
        const deptMap = {};
        const catMap = {};
        const styleMap = {};
        let totalPrice = 0;
        let priceCount = 0;
        let maxViews = 0;

        itemsSnap.forEach((doc) => {
          const data = doc.data();
          itemMap[doc.id] = data;

          if (data.price) {
            totalPrice += parseFloat(data.price) || 0;
            priceCount++;
          }

          if (data.department) {
            deptMap[data.department] = (deptMap[data.department] || 0) + 1;
          }

          if (data.category) {
            catMap[data.category] = (catMap[data.category] || 0) + 1;
          }

          if (data.style) {
            data.style.split(',').forEach((tag) => {
              const t = tag.trim();
              if (t) styleMap[t] = (styleMap[t] || 0) + 1;
            });
          }

          const views = data.views || 0;
          if (views > maxViews) maxViews = views;
        });

        setItems(itemMap);

        // Fetch users for reservations
        const userIds = [
          ...new Set(
            [...recentReservations, ...recentSales].map((r) => r.userId)
          ),
        ];
        const userMap = {};

        for (const userId of userIds) {
          try {
            const userResponse = await axios.get(
              `${API_URL}/api/stores/users/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
                },
              }
            );
            userMap[userId] = userResponse.data;
          } catch (err) {
            console.warn(`Failed to fetch user ${userId}:`, err);
            userMap[userId] = { displayName: 'Unknown User' };
          }
        }
        setUsers(userMap);

        // Outfits
        const outfitsRef = collection(db, 'outfits');
        const outfitsSnap = await getDocs(outfitsRef);
        const outfitsWithStoreItems = outfitsSnap.docs.filter((doc) => {
          const outfitItems = doc.data().items || [];
          return outfitItems.some((itemId) => itemMap[itemId]);
        });

        setStats((prev) => ({
          ...prev,
          averagePrice:
            priceCount > 0 ? Math.round(totalPrice / priceCount) : 0,
          totalOutfits: outfitsWithStoreItems.length,
          departmentCounts: deptMap,
          categoryCounts: catMap,
          styleCounts: styleMap,
          topItemViews: maxViews,
        }));

        setSecondaryLoading(false);
      } catch (err) {
        console.error('Secondary fetch error:', err);
        setError('Failed to fetch additional stats: ' + err.message);
        setSecondaryLoading(false);
      }
    };

    fetchAdditionalStats();
  }, [store, priorityLoading, recentReservations, recentSales, auth.currentUser]);

  const handleCardFlip = (cardId) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const departmentData = Object.entries(stats.departmentCounts || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const categoryData = Object.entries(stats.categoryCounts || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#2A38EA', '#F4A261', '#E76F51', '#2A9D8F', '#264653'];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase?.() || '') {
      case 'pending':
        return '#F4A261';
      case 'confirmed':
        return '#2A9D8F';
      case 'cancelled':
      case 'completed':
        return '#E76F51';
      default:
        return '#1d1d1f';
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="loading-icon">⚠️</div>
          <div className="loading-text">Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container fade-in">
      <StoreSidebar currentPage="Home" onLogout={handleLogout} />
      {/* Top Bar */}
      <div className="topbar-content">
        <div className="topbar-left">
          <FaStore size={32} />
          <div className="store-info">
            <h1>{store?.storeName || 'Your Store'}</h1>
            <p>Store Dashboard - Click cards to explore</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Primary Interactive Cards */}
        <div className="flip-cards-grid">
          {priorityLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {/* Messages Card */}
              <div className="flip-card-wrapper fade-in">
                <FlipCard
                  isFlipped={flippedCards['messages']}
                  onFlip={() => handleCardFlip('messages')}
                  front={
                    <div className="card-front">
                      <div className="card-bg-decoration" />
                      <FaComments
                        size={40}
                        color="#2A38EA"
                        className="card-icon"
                      />
                      <div className="card-label">Messages</div>
                      <div className="card-value">{stats.totalChats}</div>
                      <div className="card-subtitle">
                        {stats.unreadChats} unread{' '}
                        {stats.unreadChats !== 1 ? 'messages' : 'message'}
                      </div>
                      {stats.unreadChats > 0 && (
                        <div className="card-badge alert">Action Required!</div>
                      )}
                      <div className="card-hint">Click to view →</div>
                      <div className="card-actions single">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/chats');
                          }}
                          className="card-btn-primary"
                        >
                          Go to Chats <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  }
                  back={
                    <div
                      className="card-back"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="card-back-header">
                        <h3 className="card-back-title">Recent Messages</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardFlip('messages');
                          }}
                          className="card-close-btn"
                        >
                          ×
                        </button>
                      </div>
                      <div className="card-back-content">
                        {recentMessages.length > 0 ? (
                          recentMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`card-back-item ${
                                !msg.read ? 'unread' : ''
                              }`}
                            >
                              <div className="card-back-item-text">
                                {msg.message.substring(0, 50)}...
                              </div>
                              <div className="card-back-item-meta">
                                <span>{formatTime(msg.time)}</span>
                                {!msg.read && (
                                  <span
                                    className="status-badge"
                                    style={{ color: '#2A38EA' }}
                                  >
                                    NEW
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="card-back-empty">No messages yet</div>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Reservations Card */}
              <div className="flip-card-wrapper fade-in">
                <FlipCard
                  isFlipped={flippedCards['reservations']}
                  onFlip={() => handleCardFlip('reservations')}
                  front={
                    <div className="card-front">
                      <div className="card-bg-decoration" />
                      <FaCalendarCheck
                        size={40}
                        color="#2A38EA"
                        className="card-icon"
                      />
                      <div className="card-label">Active Reservations</div>
                      <div className="card-value">
                        {stats.totalReservations - stats.completedReservations}
                      </div>
                      <div className="card-subtitle">
                        {stats.pendingReservations} pending confirmation
                      </div>
                      <div className="card-hint">Click to view →</div>
                      <div className="card-actions single">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/reservations');
                          }}
                          className="card-btn-primary"
                        >
                          View All Reservations <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  }
                  back={
                    <div
                      className="card-back"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="card-back-header">
                        <h3 className="card-back-title">Recent Reservations</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardFlip('reservations');
                          }}
                          className="card-close-btn"
                        >
                          ×
                        </button>
                      </div>
                      <div className="card-back-content">
                        {recentReservations.length > 0 ? (
                          recentReservations.map((res, idx) => {
                            const item = items[res.itemId] || {};
                            const user = users[res.userId] || {};
                            return (
                              <div
                                key={idx}
                                className="card-back-item"
                                style={{
                                  borderLeftColor: getStatusColor(res.status),
                                }}
                              >
                                <div className="card-back-item-text">
                                  {item.name || 'Loading...'} -{' '}
                                  {user.displayName || 'Customer'}
                                </div>
                                <div className="card-back-item-meta">
                                  <span>{formatTime(res.time)}</span>
                                  <span
                                    className="status-badge"
                                    style={{
                                      color: getStatusColor(res.status),
                                    }}
                                  >
                                    {res.status || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="card-back-empty">
                            No active reservations
                          </div>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Items Card */}
              <div className="flip-card-wrapper fade-in">
                <FlipCard
                  isFlipped={flippedCards['items']}
                  onFlip={() => handleCardFlip('items')}
                  front={
                    <div className="card-front">
                      <div className="card-bg-decoration" />
                      <FaBox size={40} color="#2A38EA" className="card-icon" />
                      <div className="card-label">Total Items</div>
                      <div className="card-value">{stats.totalItems}</div>
                      <div className="card-subtitle">
                        {stats.availableItems} available for sale
                      </div>
                      <div className="card-hint">Click to manage →</div>
                      <div className="card-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/listings');
                          }}
                          className="card-btn-primary"
                        >
                          <FaPlus /> Add Item
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/listings');
                          }}
                          className="card-btn-secondary"
                        >
                          View All <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  }
                  back={
                    <div
                      className="card-back"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="card-back-header">
                        <h3 className="card-back-title">Inventory Status</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardFlip('items');
                          }}
                          className="card-close-btn"
                        >
                          ×
                        </button>
                      </div>
                      <div className="inventory-status">
                        <div className="inventory-item">
                          <span className="inventory-label">Available</span>
                          <span className="inventory-value">
                            {stats.availableItems}
                          </span>
                        </div>
                        <div className="inventory-item">
                          <span className="inventory-label">Reserved</span>
                          <span className="inventory-value">
                            {stats.reservedItems}
                          </span>
                        </div>
                        <div className="inventory-item">
                          <span className="inventory-label">Out of Stock</span>
                          <span className="inventory-value">
                            {stats.outOfStockItems}
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Revenue Card */}
              <div className="flip-card-wrapper fade-in">
                <FlipCard
                  isFlipped={flippedCards['revenue']}
                  onFlip={() => handleCardFlip('revenue')}
                  front={
                    <div className="card-front">
                      <div className="card-bg-decoration" />
                      <FaMoneyBillWave
                        size={40}
                        color="#2A38EA"
                        className="card-icon"
                      />
                      <div className="card-label">Total Revenue</div>
                      <div className="card-value">
                        R {stats.totalRevenue.toLocaleString()}
                      </div>
                      <div className="card-subtitle">
                        {stats.completedReservations} completed sales
                      </div>
                      <div className="card-hint">Click to view sales →</div>
                      <div className="card-actions single">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/reservations', {
                              state: { viewMode: 'sales' },
                            });
                          }}
                          className="card-btn-primary"
                        >
                          View All Sales <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  }
                  back={
                    <div
                      className="card-back"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="card-back-header">
                        <h3 className="card-back-title">Recent Sales</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardFlip('revenue');
                          }}
                          className="card-close-btn"
                        >
                          ×
                        </button>
                      </div>
                      <div className="card-back-content">
                        {recentSales.length > 0 ? (
                          recentSales.map((sale, idx) => {
                            const item = items[sale.itemId] || {};
                            const user = users[sale.userId] || {};
                            return (
                              <div key={idx} className="card-back-item">
                                <div className="card-back-item-text">
                                  {item.name || 'Loading...'} -{' '}
                                  {user.displayName || 'Customer'}
                                </div>
                                <div className="card-back-item-meta">
                                  <span>{formatTime(sale.time)}</span>
                                  <span
                                    className="status-badge"
                                    style={{ color: '#2A38EA' }}
                                  >
                                    R{' '}
                                    {item.price
                                      ? item.price.toLocaleString()
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="card-back-empty">
                            No completed sales yet
                          </div>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Store Profile Card */}
              <div className="flip-card-wrapper fade-in">
                <FlipCard
                  isFlipped={flippedCards['store']}
                  onFlip={() => handleCardFlip('store')}
                  front={
                    <div className="card-front">
                      <div className="card-bg-decoration" />
                      <FaStore
                        size={40}
                        color="#2A38EA"
                        className="card-icon"
                      />
                      <div className="card-label">Store Profile</div>
                      <div className="rating-display">
                        <div className="rating-number">
                          {stats.averageRating.toFixed(1)}
                        </div>
                        <div>
                          <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                size={16}
                                color={
                                  star <= Math.round(stats.averageRating)
                                    ? '#2A38EA'
                                    : '#d1d1d6'
                                }
                              />
                            ))}
                          </div>
                          <div className="rating-count">
                            {stats.reviewCount}{' '}
                            {stats.reviewCount === 1 ? 'review' : 'reviews'}
                          </div>
                        </div>
                      </div>
                      <div className="card-hint">Click to view reviews →</div>
                      <div className="card-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/profile');
                          }}
                          className="card-btn-primary"
                        >
                          <FaEdit /> Edit Store
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/store/profile');
                          }}
                          className="card-btn-secondary"
                        >
                          View All <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  }
                  back={
                    <div
                      className="card-back"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="card-back-header">
                        <h3 className="card-back-title">Recent Reviews</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardFlip('store');
                          }}
                          className="card-close-btn"
                        >
                          ×
                        </button>
                      </div>
                      <div className="card-back-content">
                        {recentReviews.length > 0 ? (
                          recentReviews.map((review, idx) => (
                            <div key={idx} className="card-back-item">
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginBottom: '6px',
                                }}
                              >
                                <span className="card-back-item-text">
                                  {review.userName || 'Anonymous'}
                                </span>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                      size={10}
                                      color={
                                        star <= review.rating
                                          ? '#2A38EA'
                                          : '#d1d1d6'
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <div
                                style={{ fontSize: '11px', color: '#86868b' }}
                              >
                                {review.comment
                                  ? review.comment.length > 60
                                    ? review.comment.substring(0, 60) + '...'
                                    : review.comment
                                  : 'No comment'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="card-back-empty">No reviews yet</div>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* Charts Section */}
        {!priorityLoading && (
          <div className="charts-grid fade-in">
            {/* Revenue Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Revenue Trend</h3>
                <p className="chart-subtitle">Last 6 months performance</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={[
                    { month: 'Jan', revenue: 4200 },
                    { month: 'Feb', revenue: 5800 },
                    { month: 'Mar', revenue: 7200 },
                    { month: 'Apr', revenue: 6500 },
                    { month: 'May', revenue: 8900 },
                    { month: 'Jun', revenue: 10200 },
                  ]}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2A38EA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A38EA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                  <XAxis
                    dataKey="month"
                    stroke="#86868b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#86868b" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e5e5e7',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2A38EA"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Quick Stats</h3>
                <p className="chart-subtitle">At a glance</p>
              </div>
              <div className="stats-grid">
                {[
                  {
                    label: 'Avg. Item Price',
                    value: secondaryLoading ? '...' : `R ${stats.averagePrice}`,
                    icon: FaTags,
                  },
                  {
                    label: 'In Outfits',
                    value: secondaryLoading ? '...' : stats.totalOutfits,
                    icon: FaHeart,
                  },
                  {
                    label: 'Top Item Views',
                    value: secondaryLoading ? '...' : stats.topItemViews,
                    icon: FaEye,
                  },
                  {
                    label: 'Messages Sent',
                    value: stats.totalMessagesSent,
                    icon: FaEnvelope,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="stat-item">
                    <div className="stat-item-left">
                      <div className="stat-icon-wrapper">
                        <Icon size={16} color="#2A38EA" />
                      </div>
                      <span className="stat-label">{label}</span>
                    </div>
                    <span className="stat-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Department, Category & Style Distribution */}
        {!priorityLoading && !secondaryLoading && (
          <div className="distribution-grid fade-in">
            {/* Departments */}
            <div className="distribution-card">
              <div className="distribution-header">
                <FaTags size={20} color="#2A38EA" />
                <div>
                  <h3 className="distribution-title">Items by Department</h3>
                  <p className="distribution-subtitle">
                    Men&apos;s vs Women&apos;s
                  </p>
                </div>
              </div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                    <XAxis type="number" stroke="#86868b" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      stroke="#86868b"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e5e5e7',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#2A38EA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Categories */}
            <div className="distribution-card">
              <div className="distribution-header">
                <FaTags size={20} color="#2A38EA" />
                <div>
                  <h3 className="distribution-title">Items by Category</h3>
                  <p className="distribution-subtitle">
                    Distribution of item types
                  </p>
                </div>
              </div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e5e5e7',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Styles */}
            <div className="distribution-card">
              <div className="distribution-header">
                <FaTshirt size={20} color="#2A38EA" />
                <div>
                  <h3 className="distribution-title">Popular Styles</h3>
                  <p className="distribution-subtitle">
                    Trending in your store
                  </p>
                </div>
              </div>
              <div className="style-list">
                {Object.entries(stats.styleCounts || {}).length > 0 ? (
                  Object.entries(stats.styleCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([style, count]) => (
                      <div key={style} className="style-item">
                        <span className="style-name">{style}</span>
                        <span className="style-count">{count}</span>
                      </div>
                    ))
                ) : (
                  <div className="card-back-empty">No styles yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Help Text */}
        {!priorityLoading && (
          <div className="footer-tip fade-in">
            <div className="footer-tip-title">
              💡 Tip: Click on any card above to see more details and quick
              actions
            </div>
            <div className="footer-tip-subtitle">
              Navigate your store efficiently with our interactive dashboard
            </div>
          </div>
        )}
      </div>
    </div>
  );
}