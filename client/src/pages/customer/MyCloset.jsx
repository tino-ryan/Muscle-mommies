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
  const [selectedOutfit, setSelectedOutfit] = useState(null); // For modal
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
          { headers: { Authorization: `Bearer ${token}` } }
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

  // Handle outfit card click → open modal
  const handleOutfitClick = (outfitDoc) => {
    setSelectedOutfit(outfitDoc);
  };

  const closeModal = () => {
    setSelectedOutfit(null);
  };

  return (
    <div className="my-closet">
      <CustomerSidebar activePage="closet" />
      <main className="layout-container">
        <div className="content">
          <h1 className="page-title">My Closet</h1>
          {error && (
            <div className="error-box">
              <p>{error}</p>
            </div>
          )}
          <div className="form-content-grid">
            <div className="form-card">
              <h3>Create New Outfit</h3>
              <div className="outfit-grid">
                {outfit.map((itemId, index) => {
                  const item = items[itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div
                      key={index}
                      className="grid-slot"
                      onClick={() => handleSlotClick(index)}
                    >
                      {itemId && itemImages.length > 0 ? (
                        <img
                          src={itemImages[0].imageURL}
                          alt={item.name || 'Closet item'}
                          className="slot-image"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/200x200?text=No+Image';
                          }}
                        />
                      ) : (
                        <span className="add-icon">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="primary-button" onClick={handleSave}>
                Save Outfit
              </button>
            </div>
            <div className="form-card">
              <h3>Closet Items</h3>
              <div className="items-scroll">
                {reservations.map((res) => {
                  const item = items[res.itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div
                      key={res.reservationId}
                      className="item-card"
                      onClick={() => handleItemSelect(res.itemId)}
                    >
                      <div className="item-image-wrapper">
                        {itemImages.length > 0 ? (
                          itemImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.imageURL}
                              alt={item.name || 'Closet item'}
                              className="item-image"
                            />
                          ))
                        ) : (
                          <img
                            src="https://via.placeholder.com/200x200?text=No+Image"
                            alt="No item available"
                            className="item-image"
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
          <div className="form-card">
            <h3>My Outfits</h3>
            {outfits.length === 0 ? (
              <div className="no-outfits">
                <p>You haven’t saved any outfits yet.</p>
              </div>
            ) : (
              <div className="outfits-list">
                {outfits.map((outfitDoc, idx) => (
                  <div
                    key={idx}
                    className="outfit-preview"
                    onClick={() => handleOutfitClick(outfitDoc)}
                  >
                    <p>Outfit {idx + 1}</p>
                    {/* Preview with first item or placeholder */}
                    {outfitDoc.slots.some((id) => id) ? (
                      <div className="preview-image">
                        {items[outfitDoc.slots.find((id) => id)]?.images?.[0]?.imageURL ? (
                          <img
                            src={items[outfitDoc.slots.find((id) => id)]?.images[0].imageURL}
                            alt="Outfit preview"
                            onError={(e) =>
                              (e.target.src = 'https://via.placeholder.com/200x200?text=No+Image')
                            }
                          />
                        ) : (
                          <div className="empty-preview"></div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-preview"></div>
                    )}
                    <button className="primary-button">View Outfit</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popup for item selection */}
          {selectedSlot !== null && (
            <div className="popup">
              <div className="popup-content">
                <h3>Select an Item</h3>
                <div className="popup-grid">
                  {reservations.map((res) => {
                    const item = items[res.itemId] || {};
                    const itemImages = item.images || [];
                    return (
                      <div
                        key={res.reservationId}
                        className="popup-item"
                        onClick={() => handleItemSelect(res.itemId)}
                      >
                        <div className="item-image-wrapper">
                          {itemImages.length > 0 ? (
                            itemImages.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.imageURL}
                                alt={item.name || 'Closet item'}
                                className="item-image"
                              />
                            ))
                          ) : (
                            <img
                              src="https://via.placeholder.com/200x200?text=No+Image"
                              alt="No item available"
                              className="item-image"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setSelectedSlot(null)}>
                    Close
                  </button>
                  {outfit[selectedSlot] && (
                    <button className="primary-button" onClick={handleRemoveItem}>
                      Remove Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal for outfit preview */}
          {selectedOutfit && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Outfit Preview</h3>
                <div className="outfit-grid-modal">
                  {Array(9)
                    .fill()
                    .map((_, slotIdx) => {
                      const itemId = selectedOutfit.slots[slotIdx];
                      const item = items[itemId] || {};
                      const itemImages = item.images || [];
                      return (
                        <div key={slotIdx} className="grid-slot-modal">
                          {itemId && itemImages.length > 0 ? (
                            <img
                              src={itemImages[0].imageURL}
                              alt={item.name || 'Closet item'}
                              className="slot-image-modal"
                              onError={(e) => {
                                e.target.src =
                                  'https://via.placeholder.com/200x200?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="empty-slot-modal"></div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}