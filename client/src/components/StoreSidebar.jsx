import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './StoreSidebar.css';

export default function StoreSidebar({ currentPage, onLogout }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`);
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { path: '/store/home', icon: 'home', label: 'Home' },
    { path: '/store/listings', icon: 'list', label: 'Listings' },
    { path: '/store/reservations', icon: 'calendar', label: 'Reservations' },
    { path: '/store/chats', icon: 'comments', label: 'Chats' },
    { path: '/store/profile', icon: 'user', label: 'Store Profile' },
    {
      path: '',
      icon: 'sign-out-alt',
      label: 'Logout',
      onClick: onLogout || handleLogout,
    },
  ];

  return (
    <>
      {/* Hamburger Header */}
      <div className={`hamburger-header ${isMenuOpen ? 'active' : ''}`}>
        <div className="hamburger-logo-container">
          <img
            src="/images/themes/logo_final.png"
            alt="Store Logo"
            className="hamburger-logo"
          />
        </div>
        <div
          className={`menu-icon ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Desktop Navbar */}
      <nav className="store-sidebar">
        <div className="logo-container">
          <img
            src="/images/themes/logo_final.png"
            alt="Store Logo"
            className="sidebar-logo"
          />
        </div>
        <div className="nav-content">
          {navItems.map((item, index) => (
            <div
              key={index}
              className={`nav-item ${currentPage === item.label ? 'active' : ''}`} // Removed .toLowerCase()
              onClick={item.onClick || (() => navigate(item.path))}
            >
              <i className={`fas fa-${item.icon}`}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Mobile Nav */}
      <div className="mobile-nav">
        <div className="nav-items-container left">
          {navItems.slice(0, 2).map((item, index) => (
            <div
              key={index}
              className={`nav-item ${currentPage === item.label ? 'active' : ''}`} // Removed .toLowerCase()
              onClick={() => navigate(item.path)}
            >
              <i className={`fas fa-${item.icon}`}></i>
            </div>
          ))}
        </div>

        <div className="mobile-logo-container">
          <img
            src="/images/themes/logo_final.png"
            alt="Store Logo"
            className="mobile-logo"
          />
        </div>

        <div className="nav-items-container right">
          {navItems.slice(2, 6).map((item, index) => (
            <div
              key={index}
              className={`nav-item ${currentPage === item.label ? 'active' : ''}`} // Removed .toLowerCase()
              onClick={item.onClick || (() => navigate(item.path))}
            >
              <i className={`fas fa-${item.icon}`}></i>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div
          className={`menu-overlay ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="menu-content" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item, index) => (
              <div
                key={index}
                className={`nav-item ${currentPage === item.label ? 'active' : ''}`} // Removed .toLowerCase()
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.onClick) item.onClick();
                  else navigate(item.path);
                  setIsMenuOpen(false);
                }}
              >
                <i className={`fas fa-${item.icon}`}></i>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
