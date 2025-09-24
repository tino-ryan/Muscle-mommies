// src/components/CustomerSidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './CustomerSidebar.css';

export default function CustomerSidebar({ activePage }) {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="sidebar">
      <div
        className={`sidebar-item ${activePage === 'home' ? 'active' : ''}`}
        onClick={() => navigate('/customer/home')}
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
        className={`sidebar-item ${activePage === 'search' ? 'active' : ''}`}
        onClick={() => navigate('/search')}
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
        className={`sidebar-item ${activePage === 'chats' ? 'active' : ''}`}
        onClick={() => navigate('/user/chats')}
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
        className={`sidebar-item ${activePage === 'reservations' ? 'active' : ''}`}
        onClick={() => navigate('/customer/reservations')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24px"
          height="24px"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h24A8,8,0,0,1,112,120Zm64,0a8,8,0,0,1-8,8H144a8,8,0,0,1,0-16h24A8,8,0,0,1,176,120Zm-64,40a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h24A8,8,0,0,1,112,160Zm64,0a8,8,0,0,1-8,8H144a8,8,0,0,1,0-16h24A8,8,0,0,1,176,160Z"></path>
        </svg>
        <p>Reservations</p>
      </div>
    <div
      className={`sidebar-item ${activePage === 'closet' ? 'active' : ''}`}
      onClick={() => navigate('/customer/closet')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24px"
        height="24px"
        fill="currentColor"
        viewBox="0 0 256 256"
      >
        <path d="M208,48H48A16,16,0,0,0,32,64V192a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V64A16,16,0,0,0,208,48Zm0,16V96H48V64ZM48,192V112H208v80Z"></path>
      </svg>
      <p>My Closet</p>
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
  );
}
