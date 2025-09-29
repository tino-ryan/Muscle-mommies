import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StoreSidebar from '../../components/StoreSidebar';
import { API_URL } from '../../api';
import './Analytics.css';

// Inline SVG Icons (reused from the provided file)
const ShoppingBag = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const Users = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Package = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.89 2.07l.08.14a2 2 0 0 0 2.45.69l.13-.07a2 2 0 0 1 2.15.42l.14.16a2 2 0 0 0 2.21 2.21l.16.14a2 2 0 0 1 .42 2.15l-.07.13a2 2 0 0 0 .69 2.45l.14.08a2 2 0 0 1 0 3.3l-.14.08a2 2 0 0 0-.69 2.45l.07.13a2 2 0 0 1-.42 2.15l-.16.14a2 2 0 0 0-2.21 2.21l-.14.16a2 2 0 0 1-2.15.42l-.13-.07a2 2 0 0 0-2.45.69l-.08.14a2 2 0 0 1-3.3 0l-.08-.14a2 2 0 0 0-2.45-.69l-.13.07a2 2 0 0 1-2.15-.42l-.14-.16a2 2 0 0 0-2.21-2.21l-.16-.14a2 2 0 0 1-.42-2.15l.07-.13a2 2 0 0 0-.69-2.45l-.14-.08a2 2 0 0 1 0-3.3l.14-.08a2 2 0 0 0 .69-2.45l-.07-.13a2 2 0 0 1 .42-2.15l.16-.14a2 2 0 0 0 2.21-2.21l.14-.16a2 2 0 0 1 2.15-.42l.13.07a2 2 0 0 0 2.45-.69z" />
    <circle cx="12" cy="12" r="7" />
  </svg>
);

const Clock = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MessageCircle = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.42 8.42 0 0 1 8.5 8.5z" />
  </svg>
);

// Metric Card Component
const MetricCard = ({ title, value, unit, icon: Icon, colorClass }) => (
  <div className="form-card">
    <div className="flex items-center justify-between mb-4">
      <Icon className={`w-8 h-8 ${colorClass}`} />
      <span className="text-sm font-semibold text-gray-500">{title}</span>
    </div>
    <p className="text-4xl font-extrabold text-gray-900 leading-none">
      {value}
      {unit && (
        <span className="text-xl font-medium text-gray-600 ml-1">{unit}</span>
      )}
    </p>
  </div>
);

// Inventory Snapshot Table Component
const InventorySnapshot = ({ inventory }) => (
  <div className="form-card overflow-x-auto">
    <h3 className="card-title">Inventory Snapshot & Alerts</h3>
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Price</th>
          <th className="text-center">Reserved</th>
          <th className="text-center">Stock</th>
          <th className="text-center">Alert</th>
        </tr>
      </thead>
      <tbody>
        {inventory.map((item) => {
          const isLowStock = item.quantity <= 2 && item.quantity > 0;
          const isSoldOut = item.quantity === 0;
          const alertClass = isSoldOut
            ? 'bg-red-100 text-red-800'
            : isLowStock
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600';

          return (
            <tr key={item.id} className="hover:bg-gray-50">
              <td>{item.name}</td>
              <td>R{item.price.toFixed(2)}</td>
              <td className="text-center">{item.reserved || 0}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-center">
                <span className={`alert-tag ${alertClass}`}>
                  {isSoldOut
                    ? 'SOLD OUT'
                    : isLowStock
                      ? 'Re-stock soon'
                      : 'Healthy'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Recent Activity Feed Component
const RecentActivity = ({ activity }) => (
  <div className="form-card">
    <h3 className="card-title">Recent Activity</h3>
    <ul className="activity-list">
      {activity.map((a) => (
        <li key={a.id} className="activity-item">
          <div className="flex-shrink-0">
            {a.type.includes('Sale') && (
              <ShoppingBag className="w-5 h-5 text-green-500" />
            )}
            {a.type.includes('Reserved') && (
              <Package className="w-5 h-5 text-blue-500" />
            )}
            {a.type.includes('Chat') && (
              <MessageCircle className="w-5 h-5 text-purple-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {a.type}
              {a.item && (
                <span className="text-gray-600 font-normal ml-1">
                  {' '}
                  - {a.item}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {a.user && `User: ${a.user} | `}
              {a.amount && `+ R${a.amount.toFixed(2)}`}
            </p>
          </div>
          <time className="text-xs text-gray-400 flex-shrink-0">{a.time}</time>
        </li>
      ))}
    </ul>
  </div>
);

// Main Analytics Component
export default function Analytics() {
  const [store, setStore] = useState({ storeName: '', storeId: '' });
  const [salesData, setSalesData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  // Fetch store and analytics data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true);
          const token = await user.getIdToken();

          // Fetch store details
          const storeResponse = await axios.get(`${API_URL}/api/my-store`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!storeResponse.data.storeId) {
            setError('No store found. Please set up your store profile.');
            navigate('/store-profile');
            return;
          }
          setStore({
            storeName: storeResponse.data.storeName || 'Your Store',
            storeId: storeResponse.data.storeId || '',
          });

          // Fetch sales data
          const salesResponse = await axios.get(
            `${API_URL}/api/stores/${storeResponse.data.storeId}/analytics/sales`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSalesData(
            salesResponse.data.length > 0
              ? salesResponse.data
              : [
                  { week: 'Wk 1', sales: 0, reservations: 0 },
                  { week: 'Wk 2', sales: 0, reservations: 0 },
                  { week: 'Wk 3', sales: 0, reservations: 0 },
                  { week: 'Wk 4', sales: 0, reservations: 0 },
                ]
          );

          // Fetch inventory data
          const inventoryResponse = await axios.get(
            `${API_URL}/api/stores/${storeResponse.data.storeId}/inventory`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setInventory(inventoryResponse.data || []);

          // Fetch recent activity
          const activityResponse = await axios.get(
            `${API_URL}/api/stores/${storeResponse.data.storeId}/activity`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setActivity(activityResponse.data || []);

          setError('');
        } catch (error) {
          console.error(
            'Fetch analytics error:',
            error.response?.data || error.message
          );
          setError(
            'Failed to load analytics: ' +
              (error.response?.data?.error || error.message)
          );
        } finally {
          setLoading(false);
        }
      } else {
        setError('Please log in to view analytics.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // Calculate Key Metrics
  const totalSalesValue = salesData.reduce((sum, d) => sum + (d.sales || 0), 0);
  const totalItemsReserved = inventory.reduce(
    (sum, item) => sum + (item.reserved || 0),
    0
  );
  const totalItemsInStock = inventory.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const avgResponseTime = 'N/A'; // Placeholder, as no chat data is provided

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setError('Failed to log out: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="analytics">
      <div className="layout-container">
        <StoreSidebar currentPage="Analytics" onLogout={handleLogout} />
        <div className="content">
          {error && (
            <div className="error-box">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          )}
          <header className="header">
            <h1 className="page-title">
              <ShoppingBag className="w-6 h-6 mr-2 text-primary" />
              {store.storeName} Analytics
            </h1>
            <div className="store-id">
              Store ID: <span className="font-mono">{store.storeId}</span>
            </div>
          </header>
          <main className="main-content">
            <div className="kpi-grid">
              <MetricCard
                title="Total Sales (Monthly)"
                value={`R${totalSalesValue.toLocaleString()}`}
                icon={ShoppingBag}
                colorClass="text-green-500"
              />
              <MetricCard
                title="Items Reserved"
                value={totalItemsReserved}
                icon={Users}
                colorClass="text-blue-500"
              />
              <MetricCard
                title="Inventory Items"
                value={totalItemsInStock}
                icon={Package}
                colorClass="text-yellow-500"
              />
              <MetricCard
                title="Avg. Chat Response"
                value={avgResponseTime}
                icon={Clock}
                colorClass="text-purple-500"
              />
            </div>
            <div className="charts-activity-grid">
              <div className="form-card sales-chart">
                <h3 className="card-title">Monthly Sales & Reservations</h3>
                {/* ChartJS placeholder: Replace with your chart component */}
                <div className="chart-placeholder">
                  {/* You can integrate Chart.js or another chart library here */}
                  <p>Chart goes here</p>
                </div>
                <div className="sales-trend">
                  <h4>Sales Trend (vs. Last Week)</h4>
                  {salesData.length >= 2 ? (
                    (() => {
                      const latest = salesData[salesData.length - 1].sales || 0;
                      const previous =
                        salesData[salesData.length - 2].sales || 0;
                      const difference = latest - previous;
                      const percentage =
                        previous !== 0
                          ? ((difference / previous) * 100).toFixed(1)
                          : 'N/A';
                      const isPositive = difference >= 0;
                      return (
                        <div>
                          <ShoppingBag
                            className={`w-12 h-12 mb-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                          />
                          <p
                            className={`text-5xl font-extrabold ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {percentage !== 'N/A'
                              ? `${isPositive ? '+' : ''}${percentage}%`
                              : 'N/A'}
                          </p>
                          <p className="text-lg font-medium text-gray-500 mt-2">
                            {percentage !== 'N/A'
                              ? isPositive
                                ? 'Increase'
                                : 'Decrease'
                              : 'No Data'}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-gray-500">
                      Not enough data to calculate trend.
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Calculated from confirmed sales.
                  </p>
                </div>
              </div>
              <InventorySnapshot inventory={inventory} />
              <RecentActivity activity={activity} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
// ...existing code...
