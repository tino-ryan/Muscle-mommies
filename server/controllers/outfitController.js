const admin = require('firebase-admin');
const db = admin.firestore();
const outfitsRef = db.collection('outfits');

// Save outfit (you already have this)
const saveOutfit = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length !== 9) {
      return res.status(400).json({ error: 'Invalid slots array' });
    }

    const outfitId = db.collection('outfits').doc().id; // generate new doc id

    await outfitsRef.doc(outfitId).set({
      userId,
      slots,
    });

    res.status(201).json({ outfitId, slots });
  } catch (err) {
    console.error('Error saving outfit:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET all outfits for logged-in user
const getUserOutfits = async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await outfitsRef.where('userId', '==', userId).get();

    const outfits = snapshot.docs.map((doc) => ({
      outfitId: doc.id,
      ...doc.data(),
    }));

    res.json(outfits);
  } catch (err) {
    console.error('Error fetching outfits:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  saveOutfit,
  getUserOutfits,
};
