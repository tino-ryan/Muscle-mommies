const express = require("express");
const cors = require("cors");
const admin = require("./firebase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // allows all origins — good for dev

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is live!");
});

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
