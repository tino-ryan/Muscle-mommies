// pages/store/Chats.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';
import HamburgerMenu from '../../components/HamburgerMenu';
import { API_URL } from '../../api';
import './Chats.css';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
          );
          const unsubscribeSnapshot = onSnapshot(
            q,
            async (snapshot) => {
              const chatData = snapshot.docs.map((doc) => ({
                chatId: doc.id,
                ...doc.data(),
              }));
              console.log('Fetched chats:', chatData);
              const chatsWithNames = await Promise.all(
                chatData.map(async (chat) => {
                  const otherId = chat.participants.find(
                    (id) => id !== user.uid
                  );
                  try {
                    const userResponse = await axios.get(
                      `${API_URL}/api/stores/users/${otherId}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    return {
                      ...chat,
                      otherName:
                        userResponse.data.displayName ||
                        userResponse.data.email ||
                        'Unknown User',
                    };
                  } catch (err) {
                    console.error(
                      `Failed to fetch user ${otherId}:`,
                      err.message
                    );
                    return { ...chat, otherName: 'Unknown User' };
                  }
                })
              );
              chatsWithNames.sort(
                (a, b) =>
                  (b.lastTimestamp?.seconds || 0) -
                  (a.lastTimestamp?.seconds || 0)
              );
              setChats(chatsWithNames);
            },
            (err) => {
              console.error('Firestore error:', err.code, err.message);
              setError('Failed to fetch chats: ' + err.message);
            }
          );
          return () => unsubscribeSnapshot();
        } catch (error) {
          console.error('Error in chat fetch:', error);
          setError('Failed to fetch chats: ' + error.message);
        }
      } else {
        setError('Please log in.');
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [auth, navigate]);

  const handleOpenChat = (chatId) => {
    navigate(`/store/chats/${chatId}`);
  };

  return (
    <div className="chats">
      <HamburgerMenu />
      <div className="layout-container">
        <div className="sidebar">
          <div className="sidebar-item" onClick={() => navigate('/store/home')}>
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
            onClick={() => navigate('/store/listings')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M56,128a16,16,0,1,1-16-16A16,16,0,0,1,56,128ZM40,48A16,16,0,1,0,56,64,16,16,0,0,0,40,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,40,176Zm176-64H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V120A8,8,0,0,0,216,112Zm0-64H88a8,8,0,0,0-8,8V72a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48Zm0,128H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V184A8,8,0,0,0,216,176Z"></path>
            </svg>
            <p>Listings</p>
          </div>
          <div className="sidebar-item" onClick={() => navigate('/analytics')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29L40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
            </svg>
            <p>Analytics</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/reservations')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"></path>
            </svg>
            <p>Reservations</p>
          </div>
          <div className="sidebar-item active">
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
            onClick={() => navigate('/store/profile')}
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
            <p>Store Profile</p>
          </div>
        </div>
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
                <p>Last: {chat.lastMessage || 'No messages yet'}</p>
              </li>
            ))}
            {chats.length === 0 && (
              <p>
                No chats available. Customers will start conversations from item
                pages.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
