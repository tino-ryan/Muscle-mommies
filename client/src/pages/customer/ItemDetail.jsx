import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import HamburgerMenu from '../../components/HamburgerMenu';
import './ItemDetail.css';
const API_URL = 'http://localhost:3000';

export default function ItemDetail() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [store, setStore] = useState(null);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Please log in to view item details.');
        navigate('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        // Fetch item
        const itemResponse = await axios.get(
          `${API_URL}/api/stores/items/${itemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setItem(itemResponse.data);

        // Fetch store details
        if (itemResponse.data.storeId) {
          const storeResponse = await axios.get(
            `${API_URL}/api/stores/${itemResponse.data.storeId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setStore(storeResponse.data);
        } else {
          setError('Item has no associated store.');
        }
      } catch (error) {
        console.error('Error fetching item or store:', error);
        setError(
          `Failed to load details: ${error.message} (Status: ${error.response?.status})`
        );
        if (error.response?.status === 404) {
          navigate('/customer/home'); // Redirect on 404
        }
      }
    });

    return () => unsubscribe();
  }, [itemId, auth, navigate]);

  const handleEnquire = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = await user.getIdToken();
      let ownerId;
      if (store && store.ownerId) {
        ownerId = store.ownerId;
      } else {
        const storeResponse = await axios.get(
          `${API_URL}/api/stores/${item.storeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        ownerId = storeResponse.data.ownerId;
      }

      await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId: ownerId,
          message: `Enquiring about ${item.name}`,
          itemId: item.itemId,
          storeId: item.storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/user/chats'); // Adjust to /user/chats/:chatId when implemented
    } catch (error) {
      setError('Failed to start chat: ' + error.message);
    }
  };

  const handleReserve = async () => {
    setError('Reservation feature not implemented yet.');
  };

  if (error) return <div className="error">{error}</div>;
  if (!item) return <div>Loading...</div>;

  return (
    <div className="item-detail">
      <HamburgerMenu />
      <div className="layout-container">
        <div className="content">
          <h2>{item.name}</h2>
          <div className="image-gallery">
            {item.images && item.images.length > 0 ? (
              item.images.map((img, index) => (
                <img
                  key={index}
                  src={img.imageURL}
                  alt={`${item.name} - Image ${index + 1}`}
                  style={{ width: '200px', margin: '10px' }}
                />
              ))
            ) : (
              <p>No images available.</p>
            )}
          </div>
          <p>
            <strong>Description:</strong> {item.description || 'No description'}
          </p>
          <p>
            <strong>Category:</strong> {item.category || 'N/A'}
          </p>
          <p>
            <strong>Department:</strong> {item.department || 'N/A'}
          </p>
          <p>
            <strong>Style:</strong> {item.style || 'N/A'}
          </p>
          <p>
            <strong>Size:</strong> {item.size || 'N/A'}
          </p>
          <p>
            <strong>Price:</strong> ${item.price || '0.00'}
          </p>
          <p>
            <strong>Quantity:</strong> {item.quantity || '0'}
          </p>
          <p>
            <strong>Status:</strong> {item.status || 'Unknown'}
          </p>
          {store && (
            <div className="store-info">
              <h3>Store Details</h3>
              <p>
                <strong>Name:</strong> {store.storeName || 'Unnamed Store'}
              </p>
              <p>
                <strong>Address:</strong> {store.address || 'No address'}
              </p>
            </div>
          )}
          <div className="actions">
            <button onClick={handleEnquire} disabled={!store}>
              Enquire/Chat
            </button>
            <button onClick={handleReserve} disabled={!store}>
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
