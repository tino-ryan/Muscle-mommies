import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase'; // Client-side Firestore
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import axios from 'axios';
import { API_URL } from '../api';
import HamburgerMenu from '../components/HamburgerMenu';
import './ChatWindow.css';

export default function ChatWindow() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherName, setOtherName] = useState('Loading...');
  const [chatData, setChatData] = useState({});
  const [item, setItem] = useState(null);
  const [store, setStore] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(''); // 'customer' or 'storeOwner'
  const auth = getAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const shopperSuggestions = [
    'Is this item available?',
    'What is the condition like?',
    'Can I reserve for pickup?',
  ];

  const ownerSuggestions = [
    'Yes, available for pickup.',
    'Condition is excellent.',
    'Reserved! See you soon.',
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch role from user document
    const fetchRole = async () => {
      try {
        const token = await user.getIdToken();
        const response = await axios.get(`${API_URL}/api/auth/user`, {
          // Adjust endpoint if needed
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(response.data.role || 'customer'); // Default to customer if not set
      } catch (err) {
        setError('Failed to fetch role: ' + err.message);
      }
    };
    fetchRole();

    // Real-time messages
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          messageId: doc.id,
          ...doc.data(),
        }));
        setMessages(newMessages);
        // Mark as read for the current user (receiver)
        if (
          newMessages.some((msg) => msg.receiverId === user.uid && !msg.read)
        ) {
          axios.put(
            `${API_URL}/api/stores/chats/${chatId}/read`,
            {},
            { headers: { Authorization: `Bearer ${user.getIdToken()}` } }
          );
        }
      },
      (err) => setError('Failed to load messages: ' + err.message)
    );

    // Fetch chat data, other name, item/store
    const fetchChatDetails = async () => {
      try {
        const token = await user.getIdToken();
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          setChatData(data);
          const [id1, id2] = chatId.split('_');
          const otherId = id1 === user.uid ? id2 : id1;
          const userResponse = await axios.get(
            `${API_URL}/api/stores/users/${otherId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setOtherName(
            userResponse.data.displayName ||
              userResponse.data.email ||
              'Unknown'
          );

          if (data.itemId) {
            const itemResponse = await axios.get(
              `${API_URL}/api/stores/items/${data.itemId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setItem(itemResponse.data);
          }
          if (data.storeId) {
            const storeResponse = await axios.get(
              `${API_URL}/api/stores/${data.storeId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setStore(storeResponse.data);
          }
        }
      } catch (err) {
        setError('Failed to load chat details: ' + err.message);
      }
    };
    fetchChatDetails();

    return () => unsubscribe();
  }, [chatId, auth, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const user = auth.currentUser;
    const receiverId = chatId.split('_').find((id) => id !== user.uid);
    try {
      const token = await user.getIdToken();
      await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId,
          message: newMessage,
          itemId: chatData.itemId,
          storeId: chatData.storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
    } catch (err) {
      setError('Failed to send: ' + err.message);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
  };

  return (
    <div className="chat-window">
      <HamburgerMenu />
      <div className="layout-container">
        <div className="content">
          <div
            className="chat-header"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <h2>Chat with {otherName}</h2>
            <span>{drawerOpen ? 'Close Details' : 'Open Details'}</span>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="messages-container">
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`${msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'} message ${
                  msg.read ? 'read' : 'unread'
                }`}
              >
                {msg.message}
                <span className="timestamp">
                  {msg.timestamp?.toDate().toLocaleString('en-ZA', {
                    timeZone: 'Africa/Johannesburg',
                  })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="suggestions">
            {(role === 'customer' ? shopperSuggestions : ownerSuggestions).map(
              (sug, idx) => (
                <div
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(sug)}
                >
                  {sug}
                </div>
              )
            )}
          </div>
          <div className="input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
        <div className={`drawer ${drawerOpen ? '' : 'hidden'}`}>
          <h3>Chat Details</h3>
          {item && (
            <div>
              <h4>Linked Item</h4>
              <img
                src={item.images[0]?.imageURL}
                alt={item.name}
                style={{ width: '100%' }}
              />
              <p>
                {item.name} - ${item.price}
              </p>
              {/* Add reserve button if needed */}
            </div>
          )}
          {store && (
            <div>
              <h4>Store Info</h4>
              <p>{store.storeName}</p>
              <p>Address: {store.address}</p>
              <img
                src={store.profileImageURL}
                alt="Store Profile"
                style={{ width: '100%' }}
              />
            </div>
          )}
          {!item && !store && <p>No linked item or store.</p>}
        </div>
      </div>
    </div>
  );
}
