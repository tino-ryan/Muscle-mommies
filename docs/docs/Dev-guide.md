# Development Guides

This document explains how to set up the development environment for Muscle-mommies, including creating the development database, API, and frontend site.

---

## 1. How to Create a Development Database (Firebase)

Our project uses **Firebase** as the backend database. Follow these steps to set up your development Firebase environment:

### Prerequisites

- Google account
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to the Firebase project or create your own Firebase project

### Steps

1. **Login to Firebase CLI**

   ```bash
   firebase login
   ```

2. **Initialize Firebase in the server directory**  
   If not already done, run in `/server`:

   ```bash
   firebase init
   ```

   Select features you need (e.g., Firestore).

3. **Set up Firebase config**  
   Get your Firebase config credentials from your Firebase console under project settings.

4. **Create `.env` file in `/server`**  
   Add your Firebase config keys as environment variables, e.g.:

   ```env
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-auth-domain
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   FIREBASE_APP_ID=your-app-id
   ```

5. **Initialize Firestore locally or use Firebase emulator** (optional)  
   For offline/local development, run:
   ```bash
   firebase emulators:start --only firestore
   ```

---

## 2. How to Create a Development API (Node.js + Express)

The backend API serves data and business logic.

### Prerequisites

- Node.js (v16 or above recommended)
- npm or yarn

### Steps

1. **Navigate to the backend directory**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file** (if not existing) in `/server` with required environment variables (including Firebase keys as above).

4. **Run the API server**

   ```bash
   npm run dev
   ```

   This should start the backend server, typically on `http://localhost:5000`

5. **Test endpoints**  
   Use Postman or curl to test API routes (e.g., `GET /api/users`).

---

## 3. How to Create a Development Site (React Frontend)

The frontend React app provides the UI.

### Prerequisites

- Node.js and npm/yarn
- Firebase project setup (for hosting and database connection)

### Steps

1. **Navigate to the client directory**

   ```bash
   cd client
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file** with your Firebase config (same as backend but adapted for client if needed)  
   Example:

   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```

4. **Run the React app**

   ```bash
   npm start
   ```

   The frontend should now be running on `http://localhost:3000`

5. **Ensure it connects to the development backend and Firebase database**  
   Verify API calls and database queries work correctly.

---

## Troubleshooting

- Make sure all `.env` files are set correctly with valid Firebase credentials.
- Backend and frontend ports should not conflict.
- For Firebase emulator issues, try restarting the emulator or checking firewall permissions.

---

## Summary

- Setup Firebase project and config
- Start backend API server with `npm run dev` in `/server`
- Start React frontend with `npm start` in `/client`
- Use Firebase emulator for local database testing (optional)

---
