import { Routes, Route } from 'react-router-dom';

// Auth pages
import Login from './pages/auth/Login';
import SignupPage from './pages/auth/SignupPage.jsx';

// Customer pages
import CustomerHome from './pages/customer/Home';
import Store from './pages/customer/Store';
import Search from './pages/customer/Search';
import CusReservations from './pages/customer/Reservations';
import BadgePage from './pages/customer/BadgePage'; // Add this

// Store owner pages
import StoreHome from './pages/store/StoreHome';
import StoreProfile from './pages/store/StoreProfile';
import StoreListings from './pages/store/StoreListings';
import AddListing from './pages/store/AddListing';
import EditListing from './pages/store/EditListing';
import StoreReservations from './pages/store/Reservations';
import Chats from './pages/store/Chats.jsx';
import Analytics from './pages/store/Analytics.jsx';

// Customer pages
import UserChats from './pages/customer/UserChats.jsx';
import ChatWindow from './pages/ChatWindow.jsx';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.jsx';

// Optional common dashboard
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/signup/customer" element={<SignupPage role="customer" />} />
      <Route path="/signup/store" element={<SignupPage role="storeOwner" />} />
      <Route path="/login" element={<Login />} />

      {/* Role-based landing pages */}
      <Route path="/customer/home" element={<CustomerHome />} />
      <Route path="/store/home" element={<StoreHome />} />
      <Route path="/store/profile" element={<StoreProfile />} />
      <Route path="/store/listings" element={<StoreListings />} />
      <Route path="/store/listings/add" element={<AddListing />} />
      <Route path="/store/listings/edit/:itemId" element={<EditListing />} />
      <Route path="/store/reservations" element={<StoreReservations />} />
      <Route path="/store/chats" element={<Chats />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      <Route path="/user/chats" element={<UserChats />} />
      <Route path="/user/chats/:chatId" element={<ChatWindow />} />
      <Route path="/store/chats/:chatId" element={<ChatWindow />} />
      <Route path="/store/home" element={<StoreHome />} />
      <Route path="/customer/home" element={<CustomerHome />} />
      <Route path="/customer/reservations" element={<CusReservations />} />

      {/* New Item Detail page for testing */}
      <Route path="/store/:id" element={<Store />} />
      <Route path="/search" element={<Search />} />

      {/* Badges page */}
      <Route path="/badges" element={<BadgePage />} />

      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}

export default App;