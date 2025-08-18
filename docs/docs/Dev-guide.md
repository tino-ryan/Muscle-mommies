# Muscle-Mommies Development Guide

This guide documents how to set up the development environment for **Muscle-Mommies**, explaining how to run the application locally. It covers backend API, frontend React app, Firebase, environment variables, and local workflows.

---

## 1. Setting Up Locally

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Firebase CLI: `npm install -g firebase-tools`
- Access to Firebase project or create a new one

---

### 1.1 Backend Setup

1. **Navigate to server folder**

```bash
cd server
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `.env` file**
   Add **only sensitive information**:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<YOUR_KEY>\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
```

**Why we chose these variables:**

- `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` are sensitive credentials required to authenticate the backend server with Firebase Admin SDK.
- Other Firebase configuration fields are public and do not need to be secret, so we hardcode them for simplicity.
- This separation ensures sensitive credentials are never pushed to GitHub.

4. **Run the backend**

```bash
node index.js
```

- Backend should run on `http://localhost:3000` by default.
- Test endpoints with Postman or curl (`GET /api/users`).

---

### 1.2 Frontend Setup

1. **Navigate to client folder**

```bash
cd client
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `.env` file**
   Add Firebase public keys and API URL:

```env
REACT_APP_FIREBASE_API_KEY=<your-public-key>
REACT_APP_API_URL=http://localhost:3000
```

**Why we chose these variables:**

- `REACT_APP_FIREBASE_API_KEY` is safe to expose in the frontend and is required to initialize Firebase for client-side operations.
- `REACT_APP_API_URL` allows switching between local and production backend easily.

4. **Start the frontend**

```bash
npm start
```

- Runs on `http://localhost:3001`.
- Uses proxy to forward API calls to backend.

---

### 1.3 Firebase Setup

1. **Login to Firebase CLI**

```bash
firebase login
```

2. **Optional: Run local Firestore emulator**

```bash
firebase emulators:start --only firestore
```

- Useful for testing locally without touching production data.

---

## 2. Local Development Workflow

1. Start backend: `node index.js`
2. Start frontend: `npm start`
3. Log in as different users to test role-based routing.
4. Make API calls via the frontend or Postman.
5. Debug errors using console logs and Firebase Emulator.

---

## 3. Deployment Notes

- **Frontend:** Hosted on Firebase Hosting
- **Backend:** Hosted on Railway
- **Environment Variables / Secrets:**
  - Backend: Add `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` in Railway secrets.
  - Frontend: Use Firebase Hosting environment or `.env.production`.

- **API URLs:** Frontend points to production backend (`https://muscle-mommies-production.up.railway.app`).

---

## 4. Key Points

- Backend and frontend run on separate ports locally.
- Environment variables keep secrets out of GitHub.
- Frontend uses proxy in development to avoid CORS issues.
- Use Firebase Emulator for safe local testing (optional).
