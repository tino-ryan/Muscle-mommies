
# 💪 Muscle Mommies



A full-stack fitness application with client, server, and documentation components, built as a monorepo.

---

## 🧱 Project Structure

```txt
Muscle-mommies/
│
├── client/        # Frontend (React, hosted on Firebase)
├── server/        # Backend (Node.js + Express)
├── docs/          # Project documentation (Docusaurus, deployed via GitHub Pages)
├── README.md
└── ...
```

---

## 🚀 Quick Start Guide

This project uses **Node.js**, **npm**, and **React**. Please ensure the following are installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [React](https://react.dev/)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

### 1. Clone the Repo

```bash
git clone https://github.com/tino-ryan/Muscle-mommies.git
cd Muscle-mommies
```

---

### 2. Install Dependencies

```bash
cd client && npm install
cd ../server && npm install
cd ../docs && npm install
```

---

### 📦 Running Locally

#### Client (Frontend)

```bash
cd client
npm run dev
```

Runs at: [http://localhost:3000](http://localhost:3000)

---

#### Server (Backend)

```bash
cd server
npm run dev
```

Runs at: [http://localhost:5000](http://localhost:5000)

---

#### Documentation (Docs)

```bash
cd docs
npm run start
```

Runs at: [http://localhost:3001](http://localhost:3001)

---

### 🔒 Firebase Setup

Firebase Auth and Firestore are already configured.

Manage settings from your [Firebase Console](https://console.firebase.google.com/).

No additional setup needed unless you're changing providers.

---

### 🌐 Deployment

#### Client

Deployed on **Firebase Hosting**.

To redeploy:

```bash
cd client
npm run build
firebase deploy
```

---

#### Docs

Deployed using **GitHub Pages** (`gh-pages` branch).

To deploy:

```bash
cd docs
npm run deploy
```

Make sure GitHub Pages is enabled in the repo settings.

---

## 🤝 Contributing

1. Fork the repo  
2. Create a branch:

```bash
git checkout -b feature/your-feature
```

3. Commit your changes  
4. Push to your fork  
5. Submit a pull request

---

## 📄 License

MIT © 2025 Tino Ryan


---

## 🔐 Safe Git Workflow for Pushing Code

Follow this guide to safely push changes to any project repository without breaking production or other developers' work.

---

### 🧱 1. Pull the Latest Changes

Always sync with the remote repo before starting work:

```bash
git checkout main
git pull origin main
```

> ✅ This ensures your local copy is up to date.

---

### 🌿 2. Create a New Feature or Fix Branch

Use a clear, descriptive name for the branch:

```bash
git checkout -b feature/your-feature-name
```

Examples:
- `feature/signup-form`
- `fix/login-bug`
- `docs/update-readme`

---

### 💻 3. Make Changes and Stage Them

Check your changes:

```bash
git status
```

Add specific files or everything:

```bash
git add file1.js file2.js
# or
git add .
```

---

### 📝 4. Commit with a Clear Message

Use present tense and describe what the commit does:

```bash
git commit -m "Add login validation and error handling"
```

---

### 🚀 5. Push the Branch to GitHub

```bash
git push origin feature/your-feature-name
```

---

### 📬 6. Create a Pull Request (PR)

1. Go to the repo on GitHub.
2. Open a Pull Request from your branch into `main` (or `dev` if applicable).
3. Add a title and description of what you changed.
4. Submit the PR for review.

> Optionally assign teammates or reviewers.

---

### ✅ 7. Merge Safely

Once approved or reviewed:
- **Use "Squash and merge"** for clean history.
- Delete the branch after merging.

---

### 🧹 8. Clean Up (Optional)

After merge, clean your local branches:

```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

---

### 💡 Tip: Use `.gitignore` to Avoid Pushing Unwanted Files

Make sure `node_modules/`, `.env`, and build artifacts are ignored.

---

This workflow keeps your codebase safe, readable, and team-friendly.

