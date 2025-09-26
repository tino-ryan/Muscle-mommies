import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerSidebar from '../../components/CustomerSidebar';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import './store.css';
import { API_URL } from '../../api';

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [store, setStore] = useState(null);
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Example options
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];
  const styleOptions = ['Vintage', 'Casual', 'Formal', 'Streetwear'];
  const categoryOptions = ['Tops', 'Pants', 'Dresses', 'Shoes', 'Accessories'];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (selectedItem.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (selectedItem.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const storeResponse = await axios.get(`${API_URL}/api/stores/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStore(storeResponse.data);

          const itemsResponse = await axios.get(
            `${API_URL}/api/stores/${id}/items`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setClothes(itemsResponse.data);
        } catch (error) {
          console.error('Error fetching store or items:', error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [id, auth, navigate]);

  // Filtering logic
  const filteredClothes = clothes.filter((item) => {
    const inPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const inSize = selectedSize ? item.size === selectedSize : true;
    const inStyle = selectedStyle ? item.style === selectedStyle : true;
    const inCategory = selectedCategory
      ? item.category === selectedCategory
      : true;
    return inPrice && inSize && inStyle && inCategory;
  });

  const handleReserve = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = clothes.find((i) => i.itemId === itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      // Call new reserve endpoint
      const reserveResponse = await axios.put(
        `${API_URL}/api/stores/reserve/${itemId}`,
        { storeId: store.storeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!reserveResponse.data.reservationId) {
        throw new Error('Failed to create reservation');
      }

      // Update local state
      setClothes((prev) =>
        prev.map((item) =>
          item.itemId === itemId ? { ...item, status: 'Reserved' } : item
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, status: 'Reserved' } : null
      );

      // Navigate to the specific chat
      const chatId = [user.uid, store.ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error reserving item:', error);
      alert(`Failed to reserve item: ${error.message}`);
    }
  };

  const handleEnquire = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = clothes.find((i) => i.itemId === itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      const storeId = store.storeId;
      const ownerId = store.ownerId;

      // Send enquiry message
      const messageResponse = await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId: ownerId,
          message: `Hey, I would like to enquire about the item ${item.name}`,
          itemId,
          storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Validate message response
      if (!messageResponse.data.messageId) {
        throw new Error('Failed to send enquiry message');
      }

      // Navigate to the specific chat
      const chatId = [user.uid, ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error sending enquiry:', error);
      alert(`Failed to send enquiry: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return (
      <div className="store-home">
        <CustomerSidebar />
        <div className="layout-container">
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/customer/home');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
              </svg>
              <p>Home</p>
            </div>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/search');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
              <p>Search</p>
            </div>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/user/chats');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V168.45l-26.88-23.8a16,16,0,0,0-21.81.75L147.47,168H40V56Z M40,184V179.47l25.19-25.18a16,16,0,0,0,21.93-.58L107.47,176H194.12l26.88,23.8a8,8,0,0,0-.12-15.55Z"></path>
              </svg>
              <p>Chats</p>
            </div>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/customer/profile');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
              </svg>
              <p>Profile</p>
            </div>
            <div className="sidebar-item" onClick={handleLogout}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M208,32H72A24,24,0,0,0,48,56V88a8,8,0,0,0,16,0V56a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8v-32a8,8,0,0,0-16,0v32a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V56A24,24,0,0,0,208,32Zm-56,88a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V128A8,8,0,0,0,152,120Zm40-32H104a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16Zm0,64H104a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM83.52,74.34l-32,32a8,8,0,0,0,0,11.32l32,32a8,8,0,0,0,11.32-11.32L67.66,128l27.18-27.16a8,8,0,0,0-11.32-11.32Z"></path>
              </svg>
              <p>Logout</p>
            </div>
          </div>

          <div className="loading-container">
            <div className="spinner" data-testid="spinner"></div>
            <div className="loading-text">Loading store...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="store-home">
        <button className="hamburger-menu" onClick={toggleSidebar}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216A8,8,0,0,0,0-16Z"></path>
          </svg>
        </button>
        <div className="layout-container">
          <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/customer/home');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
              </svg>
              <p>Home</p>
            </div>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/search');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
              <p>Search</p>
            </div>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/user/chats');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V168.45l-26.88-23.8a16,16,0,0,0-21.81.75L147.47,168H40V56Z M40,184V179.47l25.19-25.18a16,16,0,0,0,21.93-.58L107.47,176H194.12l26.88,23.8a8,8,0,0,0-.12-15.55Z"></path>
              </svg>
              <p>Chats</p>
            </div>
            <div
              className="sidebar-item"
              onClick={() => {
                navigate('/customer/profile');
                setSidebarOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
              </svg>
              <p>Profile</p>
            </div>
            <div className="sidebar-item" onClick={handleLogout}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M208,32H72A24,24,0,0,0,48,56V88a8,8,0,0,0,16,0V56a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8v-32a8,8,0,0,0-16,0v32a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V56A24,24,0,0,0,208,32Zm-56,88a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V128A8,8,0,0,0,152,120Zm40-32H104a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16Zm0,64H104a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM83.52,74.34l-32,32a8,8,0,0,0,0,11.32l32,32a8,8,0,0,0,11.32-11.32L67.66,128l27.18-27.16a8,8,0,0,0-11.32-11.32Z"></path>
              </svg>
              <p>Logout</p>
            </div>
          </div>
          <div className="content">
            <div className="error-container">
              <h3 className="error-title">Store not found</h3>
              <p className="error-message">
                The requested store could not be found.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-home">
      <button className="hamburger-menu" onClick={toggleSidebar}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24px"
          height="24px"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216A8,8,0,0,0,0-16Z"></path>
        </svg>
      </button>
      <div className="layout-container">
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div
            className="sidebar-item"
            onClick={() => {
              navigate('/customer/home');
              setSidebarOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
            </svg>
            <p>Home</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => {
              navigate('/search');
              setSidebarOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
            <p>Search</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => {
              navigate('/user/chats');
              setSidebarOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V168.45l-26.88-23.8a16,16,0,0,0-21.81.75L147.47,168H40V56Z M40,184V179.47l25.19-25.18a16,16,0,0,0,21.93-.58L107.47,176H194.12l26.88,23.8a8,8,0,0,0-.12-15.55Z"></path>
            </svg>
            <p>Chats</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => {
              navigate('/customer/profile');
              setSidebarOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
            </svg>
            <p>Profile</p>
          </div>
          <div className="sidebar-item" onClick={handleLogout}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208,32H72A24,24,0,0,0,48,56V88a8,8,0,0,0,16,0V56a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8v-32a8,8,0,0,0-16,0v32a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V56A24,24,0,0,0,208,32Zm-56,88a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0V128A8,8,0,0,0,152,120Zm40-32H104a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16Zm0,64H104a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM83.52,74.34l-32,32a8,8,0,0,0,0,11.32l32,32a8,8,0,0,0,11.32-11.32L67.66,128l27.18-27.16a8,8,0,0,0-11.32-11.32Z"></path>
            </svg>
            <p>Logout</p>
          </div>
        </div>
        <div className="content">
          <button onClick={() => navigate(-1)} className="store-back-button">
            ← Back
          </button>
          <div className="store-header">
            <img
              src={
                store.profileImageURL ||
                'https://via.placeholder.com/64x64?text=Store'
              }
              alt={store.name}
              className="store-image"
            />
            <div className="store-info">
              <h1 className="store-title">{store.name}</h1>
              <p className="store-address">{store.address}</p>
              <p className="store-description">{store.description}</p>
            </div>
          </div>
          <div className="search-controls">
            <div className="filters">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="filter-select"
              >
                <option value="">All Styles</option>
                {styleOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="filter-select"
              >
                <option value="">All Sizes</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="price-range">
                <span className="price-label">Price Range:</span>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="price-input"
                  placeholder="Min"
                />
                <span className="price-separator">to</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="price-input"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          <div className="store-content">
            <div className="items-section">
              <h2 className="section-title">
                <span className="section-icon">👕</span>
                Items
                <span className="results-count">
                  ({filteredClothes.length} items)
                </span>
              </h2>
              <div className="items-grid">
                {filteredClothes.map((item) => (
                  <div
                    key={item.itemId}
                    onClick={() => setSelectedItem(item)}
                    className="item-card"
                  >
                    {item.status === 'Reserved' && (
                      <span className="reserved-badge">Reserved</span>
                    )}
                    <div className="item-image-container">
                      <img
                        src={
                          item.images && item.images.length > 0
                            ? item.images[0].imageURL
                            : 'https://via.placeholder.com/200x200?text=No+Image'
                        }
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="item-content">
                      <h3 className="item-title">{item.name}</h3>
                      <div className="item-tags">
                        <span className="item-tag category">
                          {item.category}
                        </span>
                        <span className="item-tag style">{item.style}</span>
                      </div>
                      <div className="item-details">
                        <span className="item-size">{item.size}</span>
                      </div>
                      <div className="item-footer">
                        <p className="item-price">R{item.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredClothes.length === 0 && (
                  <div className="no-items">
                    <div className="no-items-icon">📦</div>
                    <h3 className="no-items-title">No items available</h3>
                    <p className="no-items-message">
                      Try adjusting your filters to find items in this store.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedStyle('');
                        setSelectedSize('');
                        setPriceRange([0, 1000]);
                      }}
                      className="clear-filters-button"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {selectedItem && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="modal-close"
                >
                  &times;
                </button>
                <div className="modal-body">
                  <div className="modal-image-carousel">
                    <img
                      src={
                        selectedItem.images && selectedItem.images.length > 0
                          ? selectedItem.images[currentImageIndex]?.imageURL ||
                            'https://via.placeholder.com/250x250?text=No+Image'
                          : 'https://via.placeholder.com/250x250?text=No+Image'
                      }
                      alt={selectedItem.name}
                      className="modal-image"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/250x250?text=No+Image';
                      }}
                    />
                    {selectedItem.images && selectedItem.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="carousel-button prev"
                        >
                          &larr;
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="carousel-button next"
                        >
                          &rarr;
                        </button>
                      </>
                    )}
                  </div>
                  <div className="modal-info">
                    <h2 className="modal-title">{selectedItem.name}</h2>
                    <div className="modal-description-section">
                      <h3 className="modal-section-title">Description</h3>
                      <p className="modal-description">
                        {selectedItem.description || 'No description available'}
                      </p>
                    </div>
                    <div className="modal-details-section">
                      <h3 className="modal-section-title">Details</h3>
                      <div className="modal-details-grid">
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">label</span>
                          <span>Category: {selectedItem.category}</span>
                        </div>
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">straighten</span>
                          <span>Size: {selectedItem.size || 'N/A'}</span>
                        </div>
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">group</span>
                          <span>Department: {selectedItem.department}</span>
                        </div>
                        <div className="modal-detail-item">
                          <span className="material-symbols-outlined modal-icon">currency_exchange</span>
                          <span>Price: R{selectedItem.price}</span>
                        </div>
                      </div>
                    </div>
                    {selectedItem.measurements && (
                      <div className="modal-measurements-section">
                        <h3 className="modal-section-title">Measurements</h3>
                        <p className="modal-measurements">
                          {selectedItem.measurements}
                        </p>
                      </div>
                    )}
                    {selectedItem.status === 'Reserved' && (
                      <p className="modal-reserved">This item is reserved</p>
                    )}
                    <div className="modal-actions">
                      <button
                        onClick={() => handleReserve(selectedItem.itemId)}
                        disabled={selectedItem.status === 'Reserved'}
                        className="modal-button reserve"
                      >
                        Reserve
                      </button>
                      <button
                        onClick={() => handleEnquire(selectedItem.itemId)}
                        className="modal-button enquire"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
