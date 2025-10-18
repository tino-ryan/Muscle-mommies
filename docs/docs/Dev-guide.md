# ThriftFinder Development Guide

This guide provides detailed instructions for setting up the development environment for **ThriftFinder**, a thrifting platform connecting shops and shoppers. It covers the backend API (Express, Firebase), frontend React app, Firebase configuration, environment variables, local development workflows, and documentation updates. The project uses Visual Studio Code (VSCode) as the recommended IDE, and this guide includes steps for installing missing dependencies (e.g., Leaflet for map features) and updating documentation in the `docs` folder.

## 1. Project Overview

- **Backend**: Express.js server with Firebase Admin SDK, Firestore, and Cloudinary for image uploads. Hosted on Render.com (`https://muscle-mommies-server.onrender.com`).
- **Frontend**: React app with Firebase Authentication, hosted on Firebase Hosting.
- **Database**: Firestore, storing collections like `users`, `stores`, `items`, `Reservations`, `Reviews`, `chats`, `messages`, `outfits`, and `externalImages`.
- **Directory Structure**:
  - `/server`: Backend code (`index.js`, `controllers/`, `routes/`, `models/`, `middleware/`).
  - `/client`: React frontend (`src/pages/` for pages, organized by user roles and shared components).
  - `/docs`: Documentation site (Docusaurus-based), with source files in `docs/docs/` and sidebar configuration in `docs/sidebars.js`.

## 2. Setting Up Locally

### Prerequisites

- **Node.js**: Version 16+ (LTS recommended). Install from [nodejs.org](https://nodejs.org).
- **npm**: Included with Node.js, or use `yarn` if preferred.
- **Firebase CLI**: Install globally with `npm install -g firebase-tools`.
- **VSCode**: Recommended IDE. Install from [code.visualstudio.com](https://code.visualstudio.com).
- **Firebase Project**: Access to the ThriftFinder Firebase project or create a new one at [console.firebase.google.com](https://console.firebase.google.com).
- **Cloudinary Account**: For image uploads. Obtain credentials from [cloudinary.com](https://cloudinary.com).
- **Git**: For cloning the repository.

### 2.1 Backend Setup

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   If missing modules are detected (e.g., `express`, `firebase-admin`, `cloudinary`, `multer`), VSCode will prompt to install them. Alternatively, install manually:

   ```bash
   npm install express firebase-admin cloudinary multer dotenv cors
   ```

3. **Create `.env` File**
   In the `/server` directory, create a `.env` file with sensitive credentials:

   ```env
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<your-private-key>\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=<your-service-account-email@project.iam.gserviceaccount.com>
   FIREBASE_PROJECT_ID=<your-project-id>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   ALLOWED_ORIGINS=http://localhost:3001,https://muscle-mommies.web.app
   PORT=3000
   ```

   **Why these variables?**
   - `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`: Sensitive credentials for Firebase Admin SDK to access Firestore and Authentication.
   - `CLOUDINARY_*`: Credentials for Cloudinary image uploads (used in `itemController.js` and `storeController.js`).
   - `ALLOWED_ORIGINS`: Restricts CORS to trusted domains (local and production frontend).
   - `PORT`: Specifies the backend port (default: 3000).
   - Sensitive credentials are kept in `.env` to avoid exposure in GitHub.

4. **Run the Backend**
   ```bash
   node index.js
   ```

   - The server runs on `http://localhost:3000`.
   - Test with `curl http://localhost:3000` (returns "Backend is live!") or use Postman to hit endpoints like `GET /api/stores`.

### 2.2 Frontend Setup

1. **Navigate to Client Folder**

   ```bash
   cd client
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   The frontend uses React and dependencies like `react-router-dom`, `firebase` (for Authentication), and `axios` (for API calls). If map features are used (e.g., store locations), install Leaflet:

   ```bash
   npm install leaflet react-leaflet
   ```

   In VSCode, missing modules will trigger a prompt to install them. Ensure `node_modules` includes `leaflet` and `react-leaflet` for map components in pages like `StoreMap.js`.

3. **Create `.env` File**
   In the `/client` directory, create a `.env` file with public Firebase keys and API URL:

   ```env
   REACT_APP_FIREBASE_API_KEY=<your-public-api-key>
   REACT_APP_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=<your-project-id>
   REACT_APP_FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
   REACT_APP_FIREBASE_APP_ID=<your-app-id>
   REACT_APP_API_URL=http://localhost:3000
   ```

   **Why these variables?**
   - `REACT_APP_FIREBASE_*`: Public Firebase configuration for client-side Authentication and Firestore access. Safe to expose in the frontend.
   - `REACT_APP_API_URL`: Points to the backend (local or production). Set to `http://localhost:3000` for development.
   - These variables are prefixed with `REACT_APP_` as per React’s convention.

4. **Start the Frontend**
   ```bash
   npm start
   ```

   - Runs on `http://localhost:3001`.
   - The `package.json` proxy forwards API requests to `http://localhost:3000`, avoiding CORS issues.

### 2.3 Firebase Setup

1. **Login to Firebase CLI**

   ```bash
   firebase login
   ```

   Authenticate with your Google account linked to the Firebase project.

2. **Run Firestore Emulator (Optional)**

   ```bash
   firebase emulators:start --only firestore
   ```

   - Starts a local Firestore emulator for testing without affecting production data.
   - Update `REACT_APP_API_URL` to point to the emulator if needed (e.g., `http://localhost:8080`).

3. **Verify Firebase Configuration**
   - Ensure the Firebase project ID in `/server/.env` and `/client/.env` matches the Firebase project.
   - Check `server/config/firebase.js` for correct Admin SDK initialization:
     ```javascript
     const admin = require('firebase-admin');
     admin.initializeApp({
       credential: admin.credential.cert({
         private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
         client_email: process.env.FIREBASE_CLIENT_EMAIL,
         project_id: process.env.FIREBASE_PROJECT_ID,
       }),
     });
     ```

### 2.4 Documentation Setup

1. **Navigate to Docs Folder**

   ```bash
   cd docs
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   The documentation site uses Docusaurus. If missing modules are detected, VSCode will prompt to install them, or run the command above.

3. **Run Documentation Site**
   ```bash
   npm start
   ```

   - Runs on `http://localhost:3002`.
   - Serves documentation from `docs/docs/` with navigation defined in `docs/sidebars.js`.

## 3. Project Structure

### Backend (`/server`)

- **Entry Point**: `index.js` (sets up Express, CORS, middleware, routes).
- **Controllers**: `controllers/` (e.g., `itemController.js`, `storeController.js`) handle business logic.
- **Routes**: `routes/` (e.g., `storeRoutes.js`, `authRoutes.js`) define API endpoints.
- **Models**: `models/` (e.g., `itemModel.js`, `store.js`) define Firestore schemas.
- **Middleware**: `middleware/authMiddleware.js` for Firebase JWT verification.
- **Config**: `config/firebase.js` for Firebase initialization.
- **Environment**: `.env` for sensitive credentials.

### Frontend (`/client`)

- **Source**: `src/`
  - **Pages**: `src/pages/` organized by user roles and shared components:
    - `auth/` (e.g., `Login.js`, `Signup.js`): Authentication pages.
    - `customer/` (e.g., `BrowseItems.js`, `Outfits.js`): Customer-specific pages.
    - `store/` (e.g., `StoreDashboard.js`, `AddItem.js`): Store owner pages.
    - `admin/` (e.g., `AdminUsers.js`): Admin pages for user/store management.
    - `shared/` (e.g., `StoreMap.js`, `ItemCard.js`): Reusable components.
  - **Components**: `src/components/` for reusable UI elements.
  - **Services**: `src/services/` for API calls (e.g., `api.js` using `axios`).
- **Environment**: `.env` for Firebase and API configuration.
- **Dependencies**: Includes `react`, `react-router-dom`, `firebase`, `axios`, `leaflet` (for maps), and `react-leaflet`.

### Documentation (`/docs`)

- **Docs**: `docs/docs/` contains Markdown files (e.g., `ThriftFinder_API_Documentation.md`, `ThriftFinder_Firestore_Database_Documentation.md`).
- **Sidebar**: `docs/sidebars.js` defines navigation for the documentation site.
- **Run**: `npm start` in `/docs` to serve the site locally.

## 4. Local Development Workflow

1. **Start Backend**

   ```bash
   cd server
   node index.js
   ```

   - Ensure `http://localhost:3000` is running.

2. **Start Frontend**

   ```bash
   cd client
   npm start
   ```

   - Access at `http://localhost:3001`.
   - Test role-based routing by logging in as `customer`, `storeOwner`, or `admin`.

3. **Test API Endpoints**
   - Use Postman or curl to test endpoints (e.g., `GET /api/stores`, `POST /api/stores/items`).
   - Example:
     ```bash
     curl -H "Authorization: Bearer <firebase-jwt>" http://localhost:3000/api/my-store
     ```

4. **Debugging**
   - Use VSCode’s debugger with breakpoints in `server/index.js` or `client/src`.
   - Check console logs in browser (F12) or terminal.
   - Use Firestore Emulator to inspect database changes without affecting production.

5. **Update Documentation**
   - Add or edit Markdown files in `docs/docs/`.
   - Update `docs/sidebars.js` to include new documents in the navigation.
   - Example for adding this guide:
     ```javascript
     module.exports = {
       sidebar: [
         'ThriftFinder_API_Documentation',
         'ThriftFinder_Firestore_Database_Documentation',
         'ThriftFinder_Development_Guide', // Add this line
       ],
     };
     ```
   - Run `npm start` in `/docs` to preview changes.

## 5. Adding Dependencies

If new features require additional modules (e.g., Leaflet for maps), install them:

- **Backend**:

  ```bash
  cd server
  npm install <package>
  ```

  Example: `npm install leaflet` (if server-side map processing is needed).

- **Frontend**:

  ```bash
  cd client
  npm install <package>
  ```

  Example: `npm install leaflet react-leaflet` for store location maps in `src/pages/shared/StoreMap.js`.

- VSCode will detect missing modules and prompt to install them. Alternatively, check `package.json` for missing dependencies if errors occur.

## 6. Deployment Notes

- **Backend**: Hosted on Render.com (`https://muscle-mommies-server.onrender.com`).
  - Add `.env` variables to Render’s environment settings:
    - `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`
    - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
    - `ALLOWED_ORIGINS`, `PORT`
  - Deploy with `git push` to the Render-linked repository.

- **Frontend**: Hosted on Firebase Hosting.
  - Deploy with:
    ```bash
    cd client
    npm run build
    firebase deploy --only hosting
    ```
  - Add `.env.production` for production:
    ```env
    REACT_APP_API_URL=https://muscle-mommies-server.onrender.com
    ```

- **Documentation**: Hosted separately (e.g., Firebase Hosting or GitHub Pages).
  - Deploy with:
    ```bash
    cd docs
    npm run build
    firebase deploy --only hosting
    ```

- **Note**: Render’s free tier introduces sleeping times, causing delays on initial requests. Consider paid plans for production.

## 7. Key Points

- **Environment Variables**: Keep sensitive credentials in `.env` files (not committed to Git). Use `REACT_APP_` prefix for client-side variables.
- **CORS**: Backend restricts CORS to `ALLOWED_ORIGINS`. Update `.env` if adding new frontend domains.
- **Firebase Emulator**: Use for safe local testing to avoid modifying production data.
- **Documentation**: Update `docs/docs/` and `docs/sidebars.js` for new guides. Test locally with `npm start`.
- **Role-Based Routing**: Frontend pages in `src/pages/` are organized by role (`customer`, `store`, `admin`, `auth`, `shared`). Test with different user roles.
- **Dependencies**: Install missing modules (e.g., `leaflet`) as needed, especially for map features.

## 8. Troubleshooting

- **Backend Errors**:
  - **"Invalid Firebase credentials"**: Verify `FIREBASE_*` variables in `server/.env`.
  - **CORS issues**: Ensure `ALLOWED_ORIGINS` includes `http://localhost:3001`.
- **Frontend Errors**:
  - **"Module not found"**: Run `npm install` or install missing modules (e.g., `npm install leaflet`).
  - **API 401 Unauthorized**: Check Firebase JWT in `Authorization` header.
- **Firestore Emulator**:
  - If queries fail, ensure emulator is running (`firebase emulators:start --only firestore`).
- **Documentation**:
  - If new docs don’t appear, verify `docs/sidebars.js` and restart `npm start`.
