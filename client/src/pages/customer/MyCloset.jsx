import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import CustomerSidebar from '../../components/CustomerSidebar';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../api';
import './MyCloset.css';

export default function MyCloset() {
  const [reservations, setReservations] = useState([]);
  const [items, setItems] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [outfit, setOutfit] = useState(Array(9).fill(null)); // 9 slots (3x3 grid)
  const [outfits, setOutfits] = useState([]); // saved outfits from db
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const token = await user.getIdToken();

        // Fetch reservations
        const resResponse = await axios.get(
          `${API_URL}/api/stores/reservations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const resData = resResponse.data;
        const completed = resData.filter(
          (r) => r.status === 'Completed' || r.status === 'Confirmed'
        );
        setReservations(completed);

        if (completed.length > 0) {
          const itemPromises = completed.map((res) =>
            axios
              .get(`${API_URL}/api/items/${res.itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .catch(() => ({
                data: {
                  images: [
                    { imageURL: 'https://via.placeholder.com/200x200?text=No+Image' },
                  ],
                  name: 'Unnamed Item',
                },
              }))
          );
          const itemResponses = await Promise.all(itemPromises);
          const itemMap = {};
          itemResponses.forEach((resp, idx) => {
            itemMap[completed[idx].itemId] = resp.data;
          });
          setItems(itemMap);
        }

        // Fetch saved outfits with debug
        const outfitRes = await axios.get(`${API_URL}/api/outfits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched outfits:', outfitRes.data); // Debug log
        setOutfits(outfitRes.data);
      } catch (err) {
        setError(
          'Failed to load closet: ' + (err.response?.data?.error || err.message)
        );
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Handle slot click → open popup
  const handleSlotClick = (index) => {
    setSelectedSlot(index);
  };

  // Select item → fill slot left-to-right, top-to-down
  const handleItemSelect = (itemId) => {
    const newOutfit = [...outfit];
    const firstEmptyIndex = newOutfit.indexOf(null);
    if (firstEmptyIndex !== -1) {
      newOutfit[firstEmptyIndex] = itemId;
      setOutfit(newOutfit);
    }
    setSelectedSlot(null);
  };

  const handleRemoveItem = () => {
    const newOutfit = [...outfit];
    newOutfit[selectedSlot] = null;
    setOutfit(newOutfit);
    setSelectedSlot(null);
  };

  // Save outfit → send to backend
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.post(
        `${API_URL}/api/outfits`,
        { slots: outfit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Outfit saved!');
      const outfitRes = await axios.get(`${API_URL}/api/outfits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutfits(outfitRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to save outfit');
    }
  };

  return (
    <div className="customer-home">
      <CustomerSidebar activePage="closet" />
      <div className="content">
        <div className="header">
          <h1>my closet</h1>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="closet-layout">
          {/* Side-by-side grids */}
          <div className="grid-container">
            {/* Create new outfit section */}
            <div className="create-outfit-section">
              <h3>create new outfit</h3>
              <div className="closet-grid">
                {outfit.map((itemId, index) => {
                  const item = items[itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div
                      key={index}
                      className="store-card"
                      onClick={() => handleSlotClick(index)}
                    >
                      {itemId && itemImages.length > 0 ? (
                        <div className="store-card-image-wrapper">
                          <img
                            src={itemImages[0].imageURL}
                            alt={item.name || 'Closet item'}
                            className="store-image"
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/200x200?text=No+Image';
                            }}
                          />
                        </div>
                      ) : (
                        <span className="add-icon">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="button green" onClick={handleSave}>
                <a>SAVE OUTFIT</a>
              </button>
            </div>

            {/* Closet items section */}
            <div className="closet-items-scroll">
              <h3>closet items</h3>
              <div className="closet-items-list">
                {reservations.map((res) => {
                  const item = items[res.itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div key={res.reservationId} className="store-card">
                      <div className="store-card-image-wrapper">
                        {itemImages.length > 0 ? (
                          itemImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.imageURL}
                              alt={item.name || 'Closet item'}
                              className="store-image"
                            />
                          ))
                        ) : (
                          <img
                            src="https://via.placeholder.com/200x200?text=No+Image"
                            alt="No item available"
                            className="store-image"
                          />
                        )}
                      </div>
                      <p className="item-name">{item.name || 'Unnamed Item'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* My outfits section below */}
          <div className="my-outfits-section">
            <h3>my outfits</h3>
            {outfits.length === 0 ? (
              <div className="no-stores">
                <p>You haven’t saved any outfits yet.</p>
              </div>
            ) : (
              <div className="store-list">
                {outfits.map((outfitDoc, idx) => (
                  <div key={idx} className="store-card">
                    {Array(9)
                      .fill()
                      .map((_, slotIdx) => {
                        const itemId = outfitDoc.slots[slotIdx];
                        const item = items[itemId] || {};
                        const itemImages = item.images || [];
                        return (
                          <div key={slotIdx} className="store-card-image-wrapper">
                            {itemId && itemImages.length > 0 ? (
                              <img
                                src={itemImages[0].imageURL}
                                alt={item.name || 'Closet item'}
                                className="store-image"
                                onError={(e) => {
                                  e.target.src =
                                    'https://via.placeholder.com/200x200?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="store-card-image-wrapper empty"></div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Popup for item selection */}
        {selectedSlot !== null && (
          <div className="popup">
            <div className="popup-content">
              <h3>select an item</h3>
              <div className="popup-items">
                {reservations.map((res) => {
                  const item = items[res.itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div
                      key={res.reservationId}
                      className="store-card"
                      onClick={() => handleItemSelect(res.itemId)}
                    >
                      <div className="store-card-image-wrapper">
                        {itemImages.length > 0 ? (
                          itemImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.imageURL}
                              alt={item.name || 'Closet item'}
                              className="store-image"
                            />
                          ))
                        ) : (
                          <img
                            src="https://via.placeholder.com/200x200?text=No+Image"
                            alt="No item available"
                            className="store-image"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="popup-actions">
                <button className="button green" onClick={() => setSelectedSlot(null)}>
                  <a>CLOSE</a>
                </button>
                {outfit[selectedSlot] && (
                  <button className="button pink" onClick={handleRemoveItem}>
                    <a>REMOVE ITEM</a>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}