// client/src/pages/customer/itemController.js

// Fetch all items for a given store
export const getStoreItems = async (storeId) => {
  try {
    const res = await fetch(`/api/stores/${storeId}/items`);
    if (!res.ok) throw new Error("Failed to fetch items");
    return await res.json();
  } catch (err) {
    console.error("Error in getStoreItems:", err);
    throw err;
  }
};

// Fetch store details
export const getStoreDetails = async (storeId) => {
  try {
    const res = await fetch(`/api/stores/${storeId}`);
    if (!res.ok) throw new Error("Failed to fetch store");
    return await res.json();
  } catch (err) {
    console.error("Error in getStoreDetails:", err);
    throw err;
  }
};

// Reserve an item
export const reserveItem = async (itemId, userId, storeId) => {
  try {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, userId, storeId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to reserve item");
    }

    return await res.json();
  } catch (err) {
    console.error("Error in reserveItem:", err);
    throw err;
  }
};

