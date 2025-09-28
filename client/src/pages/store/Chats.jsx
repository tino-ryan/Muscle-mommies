import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';
import StoreSidebar from '../../components/StoreSidebar';
import { API_URL } from '../../api';
import { ClipLoader } from 'react-spinners';
import './Chats.css';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true); // Add this to your state declarations
  const [searchTerm, setSearchTerm] = useState(''); // New State for Search
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true); // Set loading to true before fetching
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

              if (chatData.length === 0) {
                setChats([]); // No chats, clear state
                setItems({});
                setLoading(false); // No data to fetch, stop loading
                return;
              }

              // Fetch item data for chats that have an associated itemId
              const itemPromises = chatData
                .filter((chat) => chat.itemId)
                .map((chat) =>
                  axios
                    .get(`${API_URL}/api/items/${chat.itemId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    .catch(() => ({
                      data: { name: 'Unknown Item', images: [] },
                    }))
                );
              const itemResponses = await Promise.all(itemPromises);
              const itemMap = {};
              const itemsToProcess = [...itemResponses]; // Create a mutable copy

              chatData.forEach((chat) => {
                if (chat.itemId) {
                  itemMap[chat.itemId] = itemsToProcess.shift()?.data || {
                    name: 'Unknown Item',
                    images: [],
                  };
                }
              });
              setItems(itemMap);

              // Fetch user data for other participants
              const chatsWithDetails = await Promise.all(
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
                    // Log the error but continue with 'Unknown User'
                    console.error(
                      `Failed to fetch user ${otherId}:`,
                      err.message
                    );
                    return { ...chat, otherName: 'Unknown User' };
                  }
                })
              );

              // Sort chats by last message timestamp (most recent first)
              chatsWithDetails.sort(
                (a, b) =>
                  (b.lastTimestamp?.seconds || 0) -
                  (a.lastTimestamp?.seconds || 0)
              );
              setChats(chatsWithDetails);
              setLoading(false); // Set loading to false after all data is fetched
            },
            (err) => {
              console.error('Firestore error:', err.code, err.message);
              setError('Failed to fetch chats: ' + err.message);
              setLoading(false); // Set loading to false on error
            }
          );
          return () => unsubscribeSnapshot();
        } catch (error) {
          console.error('Error in chat fetch:', error);
          setError('Failed to fetch chats: ' + error.message);
          setLoading(false); // Set loading to false on error
        }
      } else {
        setError('Please log in.');
        navigate('/login');
        setLoading(false); // Set loading to false if not authenticated
      }
    });
    return () => unsubscribeAuth();
  }, [auth, navigate]);

  const handleOpenChat = (chatId) => {
    navigate(`/store/chats/${chatId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No messages yet';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const filteredChats = chats.filter((chat) => {
    const searchLower = searchTerm.toLowerCase();
    const item = items[chat.itemId];

    const matchesName = chat.otherName.toLowerCase().includes(searchLower);
    const matchesMessage = chat.lastMessage
      ?.toLowerCase()
      .includes(searchLower);
    const matchesItem = item?.name.toLowerCase().includes(searchLower);

    return matchesName || matchesMessage || matchesItem;
  });
  if (loading) {
    return (
      <div className="chats">
        <div className="layout-container">
          <StoreSidebar
            currentPage="Chats"
            onLogout={() => auth.signOut().then(() => navigate('/login'))}
          />
          <div className="content">
            <div className="loading-container">
              <ClipLoader color="#3498db" size={40} />
              <p>Loading chats...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="chats">
      <div className="layout-container">
        <StoreSidebar
          currentPage="Chats"
          onLogout={() => auth.signOut().then(() => navigate('/login'))}
        />
        <div className="content">
          <div className="header">
            <h1>Chats</h1>
          </div>

          {error && <div className="error">{error}</div>}

          {/* Search Bar - New */}
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search items or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* End Search Bar */}

          {filteredChats.length === 0 && !searchTerm ? (
            <p className="no-chats">
              No chats available. Customers will start conversations from item
              pages.
            </p>
          ) : filteredChats.length === 0 && searchTerm ? (
            <p className="no-chats">
              No results found for &quot;{searchTerm}&quot;.
            </p>
          ) : (
            <div className="chat-list">
              {filteredChats.map((chat) => {
                const item = items[chat.itemId];
                const isUnread = chat.unreadCount > 0;

                // Determine the primary display name
                const primaryName = chat.otherName;
                // Determine the secondary line (item name or message preview)

                return (
                  <div
                    key={chat.chatId}
                    onClick={() => handleOpenChat(chat.chatId)}
                    className={`chat-card ${isUnread ? 'unread' : ''}`}
                  >
                    {/* LEFT SECTION: Avatar/Image */}
                    <div className="chat-avatar">
                      {item?.images?.[0]?.imageURL ? (
                        <img src={item.images[0].imageURL} alt={item.name} />
                      ) : (
                        <div className="no-image">👤</div>
                      )}
                    </div>

                    {/* MIDDLE SECTION: Content */}
                    <div className="chat-content">
                      <div className="chat-name-preview">
                        <h3 className={isUnread ? 'bold-text' : ''}>
                          {primaryName}
                          {chat.itemId && item?.name && (
                            <span> ({item.name})</span>
                          )}
                        </h3>
                        <p
                          className={`chat-preview ${isUnread ? 'bold-text' : ''}`}
                        >
                          {chat.lastMessage || 'Start the conversation...'}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT SECTION: Time/Badge */}
                    <div className="chat-right-info">
                      <p
                        className={`chat-timestamp ${isUnread ? 'bold-text' : ''}`}
                      >
                        {formatDate(chat.lastTimestamp)}
                      </p>
                      {isUnread && (
                        <span className="unread-badge">{chat.unreadCount}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
