import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import CustomerSidebar from "../../components/CustomerSidebar";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../api";
import "./MyCloset.css";

export default function MyCloset() {
  const [reservations, setReservations] = useState([]);
  const [items, setItems] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [outfit, setOutfit] = useState(Array(9).fill(null)); // 9 slots
  const [outfits, setOutfits] = useState([]); // saved outfits from db
  const [error, setError] = useState("");
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const token = await user.getIdToken();

        // fetch reservations
        const resResponse = await axios.get(`${API_URL}/api/stores/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resData = resResponse.data;

        // ✅ filter only completed/confirmed
        const completed = resData.filter(
          (r) => r.status === "Completed" || r.status === "Confirmed"
        );
        setReservations(completed);

        if (completed.length > 0) {
          // fetch item details
          const itemPromises = completed.map((res) =>
            axios
              .get(`${API_URL}/api/items/${res.itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .catch(() => ({
                data: {
                  images: [
                    { imageURL: "https://via.placeholder.com/200x200?text=No+Image" },
                  ],
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

        // fetch saved outfits
        const outfitRes = await axios.get(`${API_URL}/api/outfits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOutfits(outfitRes.data);

      } catch (err) {
        setError("Failed to load closet: " + (err.response?.data?.error || err.message));
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Handle slot click → open popup
  const handleSlotClick = (index) => {
    setSelectedSlot(index);
  };

  // Select item → fill slot
  const handleItemSelect = (itemId) => {
    const newOutfit = [...outfit];
    newOutfit[selectedSlot] = itemId;
    setOutfit(newOutfit);
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

      alert("Outfit saved!");

      // reload outfits after saving
      const outfitRes = await axios.get(`${API_URL}/api/outfits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutfits(outfitRes.data);

    } catch (err) {
      console.error(err);
      alert("Failed to save outfit");
    }
  };

  return (
    <div className="closet">
      <CustomerSidebar activePage="closet" />
      <div className="content-container">
        <h2>My Closet</h2>
        {error && <div className="error">{error}</div>}

        {/* Create new outfit section */}
        <div className="create-outfit-section">
          <h3>Create New Outfit</h3>
          <div className="closet-grid">
            {outfit.map((itemId, index) => {
              const item = items[itemId];
              const itemImages = item?.images || [];

              return (
                <div
                  key={index}
                  className="closet-slot"
                  onClick={() => handleSlotClick(index)}
                >
                  {itemId && itemImages.length > 0 ? (
                    <img
                      src={itemImages[0].imageURL}
                      alt={item?.name || "Closet item"}
                      className="closet-slot-image"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/200x200?text=No+Image";
                      }}
                    />
                  ) : (
                    <span>+</span>
                  )}
                </div>
              );
            })}
          </div>

          <button className="save-button" onClick={handleSave}>
            Save Outfit
          </button>
        </div>

        {/* My outfits section */}
        <div className="my-outfits-section">
          <h3>My Outfits</h3>
          {outfits.length === 0 ? (
            <p>You haven’t saved any outfits yet.</p>
          ) : (
            <div className="outfits-list">
              {outfits.map((outfitDoc, idx) => (
                <div key={idx} className="outfit-card">
                  {outfitDoc.slots.map((itemId, slotIdx) => {
                    if (!itemId) return <div key={slotIdx} className="outfit-slot empty"></div>;
                    const item = items[itemId];
                    const itemImages = item?.images || [];
                    return (
                      <div key={slotIdx} className="outfit-slot">
                        {itemImages.length > 0 ? (
                          <img
                            src={itemImages[0].imageURL}
                            alt={item?.name || "Closet item"}
                            className="outfit-slot-image"
                          />
                        ) : (
                          <img
                            src="https://via.placeholder.com/200x200?text=No+Image"
                            alt="No item available"
                            className="outfit-slot-image"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popup for item selection */}
        {selectedSlot !== null && (
          <div className="popup">
            <div className="popup-content">
              <h3>Select an item</h3>
              <div className="popup-items">
                {reservations.map((res) => {
                  const item = items[res.itemId];
                  const itemImages = item?.images || [];

                  return (
                    <div
                      key={res.reservationId}
                      className="popup-item-wrapper"
                      onClick={() => handleItemSelect(res.itemId)}
                    >
                      {itemImages.length > 0 ? (
                        itemImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.imageURL}
                            alt={item?.name || "Closet item"}
                            className="popup-item"
                          />
                        ))
                      ) : (
                        <img
                          src="https://via.placeholder.com/200x200?text=No+Image"
                          alt="No item available"
                          className="popup-item"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="popup-actions">
                <button onClick={() => setSelectedSlot(null)}>Close</button>
                {outfit[selectedSlot] && (
                  <button className="remove-button" onClick={handleRemoveItem}>
                    Remove Item
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
