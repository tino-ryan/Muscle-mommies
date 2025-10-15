import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StoreSidebar.css';
import {
  Home,
  List,
  Calendar,
  MessageCircle,
  User,
  LogOut,
} from 'lucide-react';

export default function StoreSidebar({ currentPage, onLogout, theme }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      path: '/store/home',
      label: 'Home',
      icon: <Home size={20} />,
    },
    {
      path: '/store/listings',
      label: 'Listings',
      icon: <List size={20} />,
    },
    {
      path: '/store/reservations',
      label: 'Reservations',
      icon: <Calendar size={20} />,
    },
    {
      path: '/store/chats',
      label: 'Chats',
      icon: <MessageCircle size={20} />,
    },
    {
      path: '/store/profile',
      label: 'Store Profile',
      icon: <User size={20} />,
    },
    {
      path: null,
      label: 'Logout',
      icon: <LogOut size={20} />,
      onClick: () => {
        // Clear specific authentication cookies
        const cookies = document.cookie.split(';');
        cookies.forEach((cookie) => {
          const [name] = cookie.trim().split('=');
          if (name.startsWith('thriftRole_') || name === 'auth_token') {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
          }
        });
        onLogout();
        navigate('/login');
      },
    },
  ];

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div className="store-sidebar" data-theme={theme}>
      {menuItems.map((item, index) => (
        <div
          key={index}
          className={`sidebar-item ${currentPage === item.label ? 'active' : ''}`}
          onClick={() => handleItemClick(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
        >
          <div className="icon-wrapper">{item.icon}</div>
          <p className="label">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
