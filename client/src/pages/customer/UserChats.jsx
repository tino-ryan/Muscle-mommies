import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import HamburgerMenu from '../../components/HamburgerMenu'; // Adjust if shopper has different menu

import './UserChats.css';

export default function UserChats() {
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await axios.get(`${API_URL}/api/stores/chats`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setChats(response.data);
        } catch (error) {
          setError('Failed to fetch chats: ' + error.message);
        }
      } else {
        setError('Please log in.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleOpenChat = (chatId) => {
    navigate(`/user/chats/${chatId}`);
  };

  return (
    <div className="user-chats">
      <HamburgerMenu />
      <div className="layout-container">
        {/* Shopper sidebar here, similar but with user-specific items */}
        <div className="content">
          <h1>My Chats</h1>
          {error && <div className="error">{error}</div>}
          <ul className="chat-list">
            {chats.map((chat) => (
              <li
                key={chat.chatId}
                onClick={() => handleOpenChat(chat.chatId)}
                className="chat-item"
              >
                <strong>{chat.otherName}</strong>
                <p>Last: {chat.lastMessage}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
