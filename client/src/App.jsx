// App.jsx
import { Routes, Route } from 'react-router-dom';

// Auth pages
//import Login from './pages/auth/Login';
import SignupPage from './pages/auth/SignupPage.jsx';

// Customer pages
import CustomerHome from './pages/customer/Home';

// Store owner pages
import StoreHome from './pages/store/Home';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.jsx';

// Optional common dashboard
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/signup/customer" element={<SignupPage role="customer" />} />
      <Route path="/signup/store" element={<SignupPage role="storeOwner" />} />

      {/* Role-based landing pages */}
      <Route path="/customer/home" element={<CustomerHome />} />
      <Route path="/store/home" element={<StoreHome />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Optional common dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
