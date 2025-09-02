import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { API_URL } from '../api';
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
import './ChatWindow.css';

export default function ChatWindow() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherName, setOtherName] = useState('Loading...');
  const [chatData, setChatData] = useState(null);
  const [item, setItem] = useState(null);
  const [store, setStore] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const hasFetchedDetails = useRef(false);

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

    const fetchRole = async () => {
      try {
        const token = await user.getIdToken();
        const response = await axios.post(
          `${API_URL}/api/auth/getRole`,
          { uid: user.uid },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRole(response.data.role || 'customer');
      } catch (err) {
        console.error('Failed to fetch role:', err);
        setRole('customer');
        setError('Failed to fetch role: ' + err.message);
      }
    };
    fetchRole();

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp')
    );
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          messageId: doc.id,
          ...doc.data(),
        }));
        setMessages(newMessages);
        if (
          newMessages.some((msg) => msg.receiverId === user.uid && !msg.read)
        ) {
          try {
            const token = await user.getIdToken();
            await axios.put(
              `${API_URL}/api/stores/chats/${chatId}/read`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            console.error('Failed to mark messages as read:', err);
          }
        }
      },
      (err) => {
        console.error('Firestore messages error:', err.code, err.message);
        setError(`Failed to load messages: ${err.message} (Code: ${err.code})`);
      }
    );

    const fetchChatDetails = async () => {
      if (hasFetchedDetails.current) return;
      hasFetchedDetails.current = true;

      try {
        const token = await user.getIdToken();
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);
        if (!chatDoc.exists()) {
          setError('Chat not found');
          return;
        }
        const data = chatDoc.data();
        setChatData(data);
        const [id1, id2] = chatId.split('_');
        const otherId = id1 === user.uid ? id2 : id1;
        const userResponse = await axios.get(
          `${API_URL}/api/stores/users/${otherId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOtherName(
          userResponse.data.displayName || userResponse.data.email || 'Unknown'
        );

        if (data.itemId) {
          try {
            const itemResponse = await axios.get(
              `${API_URL}/api/items/${data.itemId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setItem(itemResponse.data);
          } catch (err) {
            console.error(
              'Item fetch error:',
              err.response?.status,
              err.message
            );
            if (err.response?.status === 404 && data.storeId) {
              try {
                const storeItemsResponse = await axios.get(
                  `${API_URL}/api/stores/${data.storeId}/items`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const foundItem = storeItemsResponse.data.find(
                  (item) => item.itemId === data.itemId
                );
                if (foundItem) {
                  setItem(foundItem);
                } else {
                  try {
                    const reservationsResponse = await axios.get(
                      `${API_URL}/api/stores/reservations`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const reservedItem = reservationsResponse.data.find(
                      (res) => res.itemId === data.itemId
                    );
                    if (reservedItem) {
                      const reservedItemResponse = await axios.get(
                        `${API_URL}/api/items/${data.itemId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setItem(reservedItemResponse.data);
                    } else {
                      setError('Item not found in store or reservations.');
                      setItem(null);
                    }
                  } catch (resErr) {
                    console.error(
                      'Reservations fetch error:',
                      resErr.response?.status,
                      resErr.message
                    );
                    setError('Item not found. It may have been removed.');
                    setItem(null);
                  }
                }
              } catch (storeErr) {
                console.error(
                  'Store items fetch error:',
                  storeErr.response?.status,
                  storeErr.message
                );
                setError('Item not found in store. It may have been removed.');
                setItem(null);
              }
            } else {
              setError('Failed to fetch item: ' + err.message);
              setItem(null);
            }
          }
        }
        if (data.storeId) {
          try {
            const storeResponse = await axios.get(
              `${API_URL}/api/stores/${data.storeId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setStore(storeResponse.data);
          } catch (err) {
            console.error(
              'Store fetch error:',
              err.response?.status,
              err.message
            );
            setError('Store not found: ' + err.message);
            setStore(null);
          }
        }
      } catch (err) {
        console.error('Failed to load chat details:', err);
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
    if (!user) return;
    const receiverId = chatId.split('_').find((id) => id !== user.uid);
    try {
      const token = await user.getIdToken();
      await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId,
          message: newMessage,
          itemId: chatData?.itemId,
          storeId: chatData?.storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message: ' + err.message);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
  };

  return (
    <div className="chat-window">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>
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
            {messages.length === 0 && !error && (
              <p>No messages yet. Start the conversation!</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`message ${
                  msg.senderId === auth.currentUser?.uid ? 'sent' : 'received'
                } ${msg.read ? 'read' : 'unread'}`}
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
          {item ? (
            <div>
              <h4>Linked Item</h4>
              <img
                src={
                  item.images?.[0]?.imageURL ||
                  'https://via.placeholder.com/150?text=No+Image'
                }
                alt={item.name || 'Item'}
                className="drawer-image"
              />
              <p>
                {item.name} - R{item.price} ({item.status})
              </p>
            </div>
          ) : (
            <p>No linked item available or item no longer exists.</p>
          )}
          {store ? (
            <div>
              <h4>Store Info</h4>
              <p>{store.storeName}</p>
              <p>Address: {store.address}</p>
              <img
                src={
                  store.profileImageURL ||
                  'https://via.placeholder.com/150?text=No+Image'
                }
                alt="Store Profile"
                className="drawer-image"
              />
            </div>
          ) : (
            <p>No store information available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
