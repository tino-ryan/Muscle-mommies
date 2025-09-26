const admin = require("firebase-admin");
const db = admin.firestore();

const saveOutfit = async (req, res) => {
  try {
    const userId = req.user.uid; // comes from authMiddleware
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({ error: "Slots must be an array" });
    }

    // create a new doc
    const outfitRef = db.collection("outfits").doc();
    const outfitData = {
      outfitId: outfitRef.id,
      userId,
      slots, // [itemId or null...]
    };

    await outfitRef.set(outfitData);

    res.status(201).json({ message: "Outfit saved", outfitId: outfitRef.id });
  } catch (err) {
    console.error("Failed to save outfit:", err);
    res.status(500).json({ error: "Failed to save outfit" });
  }
};

module.exports = { saveOutfit };
