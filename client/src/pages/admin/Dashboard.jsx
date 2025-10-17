import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { API_URL } from '../../api';
import { 
  Store, 
  Users, 
  BarChart3, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  X,
  Send
} from 'lucide-react';
import './Dashboard.css';

// Skeleton Card Component
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

export default function Dashboard() {
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalUsers: 0,
    storeOwners: 0,
    customers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    topReservationsStore: null,
    topSalesStore: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatModal, setChatModal] = useState({ open: false, store: null, owner: null });
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        await fetchAllData(user);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data: ' + err.message);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const fetchAllData = async (user) => {
    try {
      const token = await user.getIdToken();

      // Fetch all stores
      const storesRef = collection(db, 'stores');
      const storesSnap = await getDocs(storesRef);
      
      const storesData = [];
      let totalRevenue = 0;
      let totalProducts = 0;
      let topReservationsStore = { count: 0 };
      let topSalesStore = { revenue: 0 };

      for (const doc of storesSnap.docs) {
        const storeData = doc.data();
        const storeId = doc.id;

        // Fetch items
        const itemsRef = collection(db, 'items');
        const itemsQ = query(itemsRef, where('storeId', '==', storeId));
        const itemsSnap = await getDocs(itemsQ);
        const productCount = itemsSnap.size;
        totalProducts += productCount;

        // Build price map
        const itemPriceMap = {};
        itemsSnap.forEach((itemDoc) => {
          itemPriceMap[itemDoc.id] = parseFloat(itemDoc.data().price) || 0;
        });

        // Fetch all reservations
        const reservationsRef = collection(db, 'Reservations');
        const reservationsQ = query(reservationsRef, where('storeId', '==', storeId));
        const reservationsSnap = await getDocs(reservationsQ);

        let storeRevenue = 0;
        let completedCount = 0;

        reservationsSnap.forEach((resDoc) => {
          const resData = resDoc.data();
          if (resData.status === 'Completed') {
            const itemPrice = itemPriceMap[resData.itemId] || 0;
            storeRevenue += itemPrice;
            completedCount++;
          }
        });

        totalRevenue += storeRevenue;

        // Track top stores
        if (reservationsSnap.size > topReservationsStore.count) {
          topReservationsStore = {
            name: storeData.storeName,
            count: reservationsSnap.size,
            id: storeId,
            ownerId: storeData.ownerId,
          };
        }

        if (storeRevenue > topSalesStore.revenue) {
          topSalesStore = {
            name: storeData.storeName,
            revenue: storeRevenue,
            id: storeId,
            ownerId: storeData.ownerId,
          };
        }

        // Fetch owner info
        let ownerName = 'Unknown';
        if (storeData.ownerId) {
          try {
            const ownerResponse = await fetch(
              `${API_URL}/stores/users/${storeData.ownerId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (ownerResponse.ok) {
              const ownerData = await ownerResponse.json();
              ownerName = ownerData.displayName || ownerData.name || 'Unknown';
            }
          } catch (err) {
            console.warn('Failed to fetch owner:', err);
          }
        }

        storesData.push({
          id: storeId,
          name: storeData.storeName || 'Unnamed Store',
          owner: ownerName,
          ownerId: storeData.ownerId,
          products: productCount,
          revenue: storeRevenue,
          reservations: reservationsSnap.size,
          status: storeData.status || 'active',
        });
      }

      setStores(storesData);

      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      
      const usersData = [];
      let storeOwnerCount = 0;
      let customerCount = 0;

      usersSnap.forEach((doc) => {
        const userData = doc.data();
        const role = userData.role || 'Customer';
        
        if (role === 'shop_owner' || role === 'Store Owner') {
          storeOwnerCount++;
        } else {
          customerCount++;
        }

        usersData.push({
          id: doc.id,
          name: userData.displayName || userData.name || 'Anonymous',
          email: userData.email || 'No email',
          role: role === 'shop_owner' ? 'Store Owner' : role,
          joinDate: userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
          status: userData.status || 'active',
        });
      });

      setUsers(usersData);

      // Update stats
      setStats({
        totalStores: storesData.length,
        activeStores: storesData.filter(s => s.status === 'active').length,
        totalUsers: usersData.length,
        storeOwners: storeOwnerCount,
        customers: customerCount,
        totalRevenue,
        totalProducts,
        topReservationsStore,
        topSalesStore,
      });

    } catch (err) {
      console.error('Error in fetchAllData:', err);
      throw err;
    }
  };

  const handleOpenChat = (store) => {
    setChatModal({ open: true, store, owner: store.owner });
  };

  const handleCloseChat = () => {
    setChatModal({ open: false, store: null, owner: null });
    setChatMessage('');
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !chatModal.store) return;

    setSendingMessage(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      // Check for existing chat
      const chatsRef = collection(db, 'chats');
      const chatQuery = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );
      const chatSnap = await getDocs(chatQuery);

      let chatId = null;
      const existingChat = chatSnap.docs.find(doc => {
        const participants = doc.data().participants || [];
        return participants.includes(chatModal.store.ownerId);
      });

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        // Create new chat using API
        const createChatResponse = await fetch(`${API_URL}/stores/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId: chatModal.store.ownerId,
          }),
        });

        if (!createChatResponse.ok) {
          throw new Error('Failed to create chat');
        }

        const chatData = await createChatResponse.json();
        chatId = chatData.chatId;
      }

      // Send message using API
      const sendMessageResponse = await fetch(`${API_URL}/stores/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: chatId,
          content: chatMessage,
          receiverId: chatModal.store.ownerId,
        }),
      });

      if (!sendMessageResponse.ok) {
        throw new Error('Failed to send message');
      }

      alert('Message sent successfully!');
      handleCloseChat();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon">⚡</div>
            <div className="loading-text">Loading Admin Dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <div className="error-card">
            <AlertCircle size={48} color="#ff3b30" />
            <div className="loading-text" style={{ marginTop: '16px' }}>Error</div>
            <p style={{ marginTop: '8px', color: '#86868b' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container fade-in">
      {/* Top Bar */}
      <div className="dashboard-topbar">
        <div className="topbar-content">
          <div className="topbar-left">
            <Store size={32} />
            <div className="store-info">
              <h1>Admin Dashboard</h1>
              <p>Platform Overview & Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Stats Cards */}
        <div className="flip-cards-grid">
          <div className="flip-card-wrapper fade-in">
            <div className="card-front">
              <div className="card-bg-decoration" />
              <Store size={40} color="#2A38EA" className="card-icon" />
              <div className="card-label">Total Stores</div>
              <div className="card-value">{stats.totalStores}</div>
              <div className="card-subtitle">{stats.activeStores} active stores</div>
            </div>
          </div>

          <div className="flip-card-wrapper fade-in">
            <div className="card-front">
              <div className="card-bg-decoration" />
              <Users size={40} color="#2A38EA" className="card-icon" />
              <div className="card-label">Total Users</div>
              <div className="card-value">{stats.totalUsers}</div>
              <div className="card-subtitle">
                {stats.storeOwners} owners, {stats.customers} customers
              </div>
            </div>
          </div>

          <div className="flip-card-wrapper fade-in">
            <div className="card-front">
              <div className="card-bg-decoration" />
              <BarChart3 size={40} color="#2A38EA" className="card-icon" />
              <div className="card-label">Total Revenue</div>
              <div className="card-value">R {stats.totalRevenue.toLocaleString()}</div>
              <div className="card-subtitle">Across all stores</div>
            </div>
          </div>

          <div className="flip-card-wrapper fade-in">
            <div className="card-front">
              <div className="card-bg-decoration" />
              <BarChart3 size={40} color="#2A38EA" className="card-icon" />
              <div className="card-label">Total Products</div>
              <div className="card-value">{stats.totalProducts}</div>
              <div className="card-subtitle">Listed on platform</div>
            </div>
          </div>

          {/* Top Reservations Store */}
          {stats.topReservationsStore?.name && (
            <div className="flip-card-wrapper fade-in">
              <div className="card-front">
                <div className="card-bg-decoration" />
                <TrendingUp size={40} color="#2A38EA" className="card-icon" />
                <div className="card-label">Most Reservations</div>
                <div className="card-value" style={{ fontSize: '20px' }}>
                  {stats.topReservationsStore.name}
                </div>
                <div className="card-subtitle">
                  {stats.topReservationsStore.count} total reservations
                </div>
                <div className="card-actions single" style={{ marginTop: '12px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const store = stores.find(s => s.id === stats.topReservationsStore.id);
                      if (store) handleOpenChat(store);
                    }}
                    className="card-btn-primary"
                  >
                    <MessageSquare size={16} />
                    Chat with Owner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Sales Store */}
          {stats.topSalesStore?.name && (
            <div className="flip-card-wrapper fade-in">
              <div className="card-front">
                <div className="card-bg-decoration" />
                <TrendingUp size={40} color="#2A38EA" className="card-icon" />
                <div className="card-label">Top Sales</div>
                <div className="card-value" style={{ fontSize: '20px' }}>
                  {stats.topSalesStore.name}
                </div>
                <div className="card-subtitle">
                  R {stats.topSalesStore.revenue.toLocaleString()} in revenue
                </div>
                <div className="card-actions single" style={{ marginTop: '12px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const store = stores.find(s => s.id === stats.topSalesStore.id);
                      if (store) handleOpenChat(store);
                    }}
                    className="card-btn-primary"
                  >
                    <MessageSquare size={16} />
                    Chat with Owner
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stores Table */}
        <div className="chart-card fade-in" style={{ marginBottom: '24px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Stores Management</h3>
            <p className="chart-subtitle">All registered stores on the platform</p>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Owner</th>
                  <th>Products</th>
                  <th>Reservations</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.length > 0 ? (
                  stores.map(store => (
                    <tr key={store.id}>
                      <td className="font-semibold">{store.name}</td>
                      <td>{store.owner}</td>
                      <td>{store.products}</td>
                      <td>{store.reservations}</td>
                      <td>R {store.revenue.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${store.status === 'active' ? 'active' : 'inactive'}`}>
                          {store.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenChat(store)}
                          className="action-btn"
                        >
                          <MessageSquare size={16} />
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">No stores found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Table */}
        <div className="chart-card fade-in">
          <div className="chart-header">
            <h3 className="chart-title">Users Overview</h3>
            <p className="chart-subtitle">All registered users on the platform</p>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id}>
                      <td className="font-semibold">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role === 'Store Owner' ? 'owner' : 'customer'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.joinDate}</td>
                      <td>
                        <span className="status-badge active">{user.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {chatModal.open && (
        <div className="modal-overlay" onClick={handleCloseChat}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Chat with {chatModal.owner}</h3>
                <p className="modal-subtitle">{chatModal.store?.name}</p>
              </div>
              <button onClick={handleCloseChat} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="chat-textarea"
                rows={6}
              />
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseChat} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleSendMessage} 
                className="btn-primary"
                disabled={sendingMessage || !chatMessage.trim()}
              >
                {sendingMessage ? 'Sending...' : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}