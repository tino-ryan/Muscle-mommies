import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './HamburgerMenu.css';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="hamburger-menu">
      <button onClick={() => setOpen(!open)}>☰</button>
      {open && (
        <div className="menu-items">
          <p onClick={() => navigate('/chats')}>Chats</p>
          <p onClick={() => navigate('/store/reservations')}>Reservations</p>
          <p onClick={() => navigate('/store/home')}>Home</p>
          <p onClick={() => navigate('/analytics')}>Analytics</p>
          <p onClick={() => navigate('/store/profile')}>Store Profile</p>
          <p onClick={() => navigate('/store/listings')}>Listings</p>
        </div>
      )}
    </div>
  );
}
