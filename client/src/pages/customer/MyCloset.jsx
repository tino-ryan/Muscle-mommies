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

        // ✅ filter only completed reservations
        const completed = resData.filter((r) => r.status === "Completed" || r.status === "Confirmed");
        setReservations(completed);

        if (completed.length === 0) return;

        // fetch item details
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
                      "https://via.placeholder.com/200x200?text=No+Image",
                  },
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
    newOutfit[selectedSlot] = null; // clear the slot
    setOutfit(newOutfit);
    setSelectedSlot(null); // close popup
  };

  // Save outfit → send to backend
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      await axios.post(
        `${API_URL}/api/outfits`,
        {
          slots: outfit, // array of itemIds/null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Outfit saved!");
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

        {/* 9 slot grid */}
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

        {/* Save button */}
        <button className="save-button" onClick={handleSave}>
          Save Outfit
        </button>

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
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/200x200?text=No+Image";
                            }}
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
