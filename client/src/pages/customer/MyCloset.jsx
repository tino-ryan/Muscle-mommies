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
                    {
                      imageURL:
                        'https://via.placeholder.com/200x200?text=No+Image',
                    },
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
<<<<<<< HEAD
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
=======
      <div className="content">
        <div
          className="header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h1>my closet</h1>
          {error && <div className="error">{error}</div>}
        </div>
        <div
          className="closet-layout"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Side-by-side grids */}
          <div
            className="grid-container"
            style={{
              display: 'flex',
              gap: '30px',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {/* Create new outfit section */}
            <div
              className="create-outfit-section"
              style={{
                flex: 1,
                minWidth: '300px',
                maxWidth: '400px',
                background: '#fff',
                padding: '19px',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <h3>create new outfit</h3>
              <div
                className="closet-grid"
                style={{
                  display: 'grid',
                  minHeight: '400px',
                  
                }}
              >
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
                {outfit.map((itemId, index) => {
                  const item = items[itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div
                      key={index}
                      className="grid-slot"
                      onClick={() => handleSlotClick(index)}
                      style={{
                        width: '100px',
                        height: '100px',
                        border: '1px dashed #ccc',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer',
                      }}
                    >
                      {itemId && itemImages.length > 0 ? (
<<<<<<< HEAD
                        <img
                          src={itemImages[0].imageURL}
                          alt={item.name || 'Closet item'}
                          className="slot-image"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/200x200?text=No+Image';
                          }}
                        />
=======
                        <div className="store-card-image-wrapper">
                          <img
                            src={itemImages[0].imageURL}
                            alt={item.name || 'Closet item'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '8px',
                            }}
                            className="store-image"
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/200x200?text=No+Image';
                            }}
                          />
                        </div>
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
                      ) : (
                        <span
                          className="add-icon"
                          style={{
                            fontSize: '2rem',
                            color: '#aaa',
                            fontWeight: 'bold',
                          }}
                        >
                          +
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
<<<<<<< HEAD
              <button className="primary-button" onClick={handleSave}>
                Save Outfit
              </button>
            </div>
            <div className="form-card">
              <h3>Closet Items</h3>
              <div className="items-scroll">
=======
              <button
                className="button green"
                onClick={handleSave}
                style={{
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  margin: '12px',
                  
                  
                }}
              >
                <a>SAVE OUTFIT</a>
              </button>
            </div>

            {/* Closet items section */}
            <div
              className="closet-items-scroll"
              style={{
                flex: 1,
                minWidth: '350px',
                maxWidth: '500px',
                background: '#fff',
                padding: '16px',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                maxHeight: '400px',
                overflowY: 'auto',
                margin: '12px',
              }}
            >
              <h3 style={{ marginBottom: '12px', padding: '12px' }}>
                closet items
              </h3>
              <div
                className="closet-items-list"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, 100px)',
                  gap: '10px',
                  justifyContent: 'center',
                }}
              >
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
                {reservations.map((res) => {
                  const item = items[res.itemId] || {};
                  const itemImages = item.images || [];
                  return (
                    <div
                      key={res.reservationId}
<<<<<<< HEAD
                      className="item-card"
                      onClick={() => handleItemSelect(res.itemId)}
                    >
                      <div className="item-image-wrapper">
=======
                      className="store-card"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #ddd',
                        backgroundColor: '#fdfdfd',
                      }}
                    >
                      <div className="store-card-image-wrapper">
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
                        {itemImages.length > 0 ? (
                          itemImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.imageURL}
                              alt={item.name || 'Closet item'}
<<<<<<< HEAD
                              className="item-image"
=======
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              className="store-image"
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
                            />
                          ))
                        ) : (
                          <img
                            src="https://via.placeholder.com/200x200?text=No+Image"
                            alt="No item available"
<<<<<<< HEAD
                            className="item-image"
=======
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            className="store-image"
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
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
<<<<<<< HEAD
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
=======

          {/* My outfits section below */}
          <div className="my-outfits-section" style={{
        background: '#fff',
        padding: '16px',
        borderRadius: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}>
            <h3>my outfits</h3>
            {outfits.length === 0 ? (
              <div className="no-stores">
                <p style={{ color: '#777', textAlign: 'center' }}>You haven’t saved any outfits yet.</p>
              </div>
            ) : (
              <div className="store-list" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
          }}>
                {outfits.map((outfitDoc, idx) => (
                  <div key={idx} className="store-card" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                padding: '8px',
                width: '330px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}>
                    {Array(9)
                      .fill()
                      .map((_, slotIdx) => {
                        const itemId = outfitDoc.slots[slotIdx];
                        const item = items[itemId] || {};
                        const itemImages = item.images || [];
                        return (
                          <div
                            key={slotIdx}
                            style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#eee',
                      }}
                            className="store-card-image-wrapper"
                          >
                            {itemId && itemImages.length > 0 ? (
                              <img
                                src={itemImages[0].imageURL}
                                alt={item.name || 'Closet item'}
                                className="store-image"
                                style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                                onError={(e) => {
                                  e.target.src =
                                    'https://via.placeholder.com/200x200?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="store-card-image-wrapper empty"style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#ddd',
                          }}></div>
                            )}
                          </div>
                        );
                      })}
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
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
<<<<<<< HEAD
                    );
                  })}
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setSelectedSlot(null)}>
                    Close
=======
                    </div>
                  );
                })}
              </div>
              <div className="popup-actions">
                <button
                  className="button green"
                  onClick={() => setSelectedSlot(null)}
                >
                  <a>CLOSE</a>
                </button>
                {outfit[selectedSlot] && (
                  <button className="button pink" onClick={handleRemoveItem}>
                    <a>REMOVE ITEM</a>
>>>>>>> 6b82668770781752d9dbc56914f2fb7c31c454e7
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