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

// Function to group days with identical hours (from StoreProfile)
const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const groupHours = (hours) => {
  const grouped = [];
  const daysChecked = new Set();

  days.forEach((day, index) => {
    if (daysChecked.has(day)) return;

    const currentHours = hours[day];
    if (!currentHours) return;

    const sameHoursDays = [dayShortNames[index]];
    daysChecked.add(day);

    for (let i = index + 1; i < days.length; i++) {
      const otherDay = days[i];
      if (daysChecked.has(otherDay)) continue;

      const otherHours = hours[otherDay];
      if (
        otherHours &&
        otherHours.open === currentHours.open &&
        (!currentHours.open ||
          (otherHours.start === currentHours.start &&
            otherHours.end === currentHours.end))
      ) {
        sameHoursDays.push(dayShortNames[i]);
        daysChecked.add(otherDay);
      }
    }

    if (sameHoursDays.length > 1) {
      grouped.push({
        days:
          sameHoursDays.join('–') === 'Mon–Tue–Wed–Thu–Fri'
            ? 'Mon–Fri'
            : sameHoursDays.join(', '),
        hours: currentHours.open
          ? `${currentHours.start}–${currentHours.end}`
          : 'Closed',
      });
    } else {
      grouped.push({
        days: sameHoursDays[0],
        hours: currentHours.open
          ? `${currentHours.start}–${currentHours.end}`
          : 'Closed',
      });
    }
  });

  return grouped;
};

// Function to format message timestamps
const formatMessageDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const timeStr = date.toLocaleTimeString('en-ZA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Johannesburg',
  });

  const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeStr}`;
  } else {
    return (
      date.toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Africa/Johannesburg',
      }) + `, ${timeStr}`
    );
  }
};

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

  const openContact = (type, value) => {
    let url;
    switch (type) {
      case 'email':
        url = `mailto:${value}`;
        break;
      case 'phone':
        url = `tel:${value}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${value.replace('@', '')}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  };

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

            setStore({
              ...storeResponse.data,
            });
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
      <div className="content">
        <div className="chat-header" onClick={() => setDrawerOpen(!drawerOpen)}>
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
              <div className="message-footer">
                <span className="timestamp">
                  {formatMessageDate(msg.timestamp)}
                </span>
                {msg.senderId === auth.currentUser?.uid && (
                  <span className="read-indicator">
                    {msg.read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
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
        <div onClick={() => setDrawerOpen(!drawerOpen)}>
          <span>{drawerOpen ? 'Close Details' : 'Open Details'}</span>
        </div>
        {item ? (
          <div className="info-card item-info-card">
            <h4 className="card-title">
              <i className="fas fa-tag"></i> Item Details
            </h4>
            <div className="item-image-container">
              <img
                src={
                  item.images?.[0]?.imageURL ||
                  'https://via.placeholder.com/150?text=No+Image'
                }
                alt={item.name || 'Item'}
                className="item-image"
              />
            </div>
            <p className="item-name">
              {item.name} - R
              {item.price ? Number(item.price).toFixed(2) : 'N/A'} (
              {item.status})
            </p>
            <p className="item-detail">
              <strong>Description:</strong>{' '}
              {item.description || 'No description available.'}
            </p>
            <p className="item-detail">
              <strong>Department:</strong> {item.category || 'Uncategorized'}
            </p>
            <p className="item-detail">
              <strong>Size:</strong> {item.size || 'Not specified'}
            </p>
          </div>
        ) : (
          <p>No linked item available or item no longer exists.</p>
        )}
        {store ? (
          <div className="info-card store-info-card">
            <h4 className="card-title">
              <i className="fas fa-store"></i> Store Info
            </h4>
            <div className="store-image-container">
              <img
                src={
                  store.profileImageURL ||
                  'https://via.placeholder.com/150?text=No+Image'
                }
                alt={store.storeName || 'Store'}
                className="store-image"
              />
            </div>
            <p className="store-name">{store.storeName}</p>
            <p className="store-address">
              {store.address || 'No address provided.'}
            </p>
            <button
              className="btn-map"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${store.location.lat},${store.location.lng}`,
                  '_blank'
                )
              }
              disabled={!store.location?.lat}
            >
              Get Directions
            </button>
            <h5>Operating Hours</h5>
            <div className="hours-list">
              {groupHours(store.hours || {}).map((group, index) => (
                <div key={index} className="hour-item">
                  <strong>{group.days}:</strong> <span>{group.hours}</span>
                </div>
              ))}
            </div>
            <h5>Contact Info</h5>
            {store.contactInfos?.length > 0 ? (
              <div className="contact-list">
                {store.contactInfos.map((contact) => (
                  <p
                    key={contact.id}
                    onClick={() => openContact(contact.type, contact.value)}
                    className="contact-link"
                  >
                    <i className={`fab fa-${contact.type} contact-icon`}></i>
                    {contact.value}
                  </p>
                ))}
              </div>
            ) : (
              <p className="no-contact">No contact info provided.</p>
            )}
          </div>
        ) : (
          <p>No store information available.</p>
        )}
      </div>
    </div>
  );
}
