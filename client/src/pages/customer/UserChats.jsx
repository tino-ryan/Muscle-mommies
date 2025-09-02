import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomerSidebar from '../../components/CustomerSidebar';
import { db } from '../../firebase';
import axios from 'axios';
import './UserChats.css';
import { API_URL } from '../../api';

export default function UserChats() {
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
    navigate(`/user/chats/${chatId}`);
  };

  return (
    <div className="user-chats">
      <CustomerSidebar activePage="chats" />
      <div className="main-content">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <div className="layout-container">
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
                  <div className="chat-item-content">
                    <strong>{chat.otherName}</strong>
                    <p className="chat-message">
                      Last: {chat.lastMessage || 'No messages yet'}
                    </p>
                    {chat.lastTimestamp && (
                      <span className="chat-timestamp">
                        {chat.lastTimestamp.toDate().toLocaleString('en-ZA', {
                          timeZone: 'Africa/Johannesburg',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {chats.length === 0 && (
                <div className="no-chats">
                  <p>
                    No chats available. Start a conversation from an item page.
                  </p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
