const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 Hello from your Railway-powered backend!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
