# 💪 Muscle Mommies

A full-stack fitness application with client, server, and documentation components, built as a monorepo.

## 🧱 Project Structure

Muscle-mommies/
│
├── client/ # Frontend (React, hosted on Firebase)
├── server/ # Backend (Node.js + Express)
├── docs/ # Project documentation (Docusaurus, deployed via GitHub Pages)
├── README.md
└── ...



---

## 🚀 Quick Start Guide

This project uses **Node.js** and **npm**. Make sure they're installed.

### 1. Clone the Repo

git clone https://github.com/tino-ryan/Muscle-mommies.git
cd Muscle-mommies
2. Install All Dependencies
Install dependencies in each folder:


cd client && npm install
cd ../server && npm install
cd ../docs && npm install
📦 Running Locally
🔹 Client
bash
Copy
Edit
cd client
npm run dev   # or npm start depending on your setup
Frontend runs at: http://localhost:3000

🔹 Server
bash
Copy
Edit
cd server
npm run dev   # Make sure nodemon is installed, or use `node index.js`
Backend runs at: http://localhost:5000

The backend handles user logic, data endpoints, and connects to Firebase (already set up).

🔹 Docs
bash
Copy
Edit
cd docs
npm run start
Docs run at: http://localhost:3001

🌐 Deployment Info
✅ Frontend
Deployed on Firebase Hosting
Visit: [your-firebase-project-url]

✅ Documentation
Deployed via GitHub Actions to gh-pages branch
Visit: https://tino-ryan.github.io/Muscle-mommies

❗ Backend
Currently runs locally on localhost:5000.

Deployment platform: TBD (Render, Railway, etc.).

🧪 Recommended Setup Checks
 Firebase Hosting and Auth configured ✅

 GitHub Pages for docs working ✅

 .env setup (coming soon)

 Backend hosting setup (WIP)

 Role-based routing (e.g. admin/user) handled in client

📚 Docs & Contribution
To contribute or learn more about this project:


cd docs
npm run start
Explore the local documentation at localhost:3001, or visit the online version.

👨‍💻 Author
Tinotenda Gozho
GitHub: @tino-ryan






