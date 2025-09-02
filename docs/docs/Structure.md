# structure and progress

## structure

![Deployment Diagram](/images/deployment-diagram.png)

### Database Structure

[Database Design PDF](/pdf/database.pdf)

- Firestore is used as the database.
- **Single Users collection**:
  - `uid` (primary key)
  - `name`
  - `email`
  - `role` (customer or storeOwner)
  - `createdAt`

**Why a single table/collection:**

- Simplifies user management and queries.
- All user roles are stored in one place for easier scalability.
- Our previous experience with Firebase Auth and Firestore on an earlier project worked very well, so we continued using it.

**Pros:**

- Flexible and scalable.
- Easy to query by UID.
- Works seamlessly with Firebase Admin SDK.

**Cons:**

- No relational constraints (not suitable for complex relational queries).
- Firestore pricing can grow with many reads/writes.

---

### Backend Structure

- Created **MVC-style structure**:
  - `models/` – Data models (e.g., User)
  - `controllers/` – API logic (signup/login)
  - `routes/` – Express routes
  - `config/` – Firebase setup and configuration

**Why this structure:**  
We avoided putting all logic in a single `index.js` like in the last project because it was hard to maintain. Separating concerns ensures maintainable and testable code. Future features can follow the same structure.

**Pros:**

- Easy to extend and maintain.
- Clear separation of logic and data.
- Scalable for additional features.

**Cons:**

- Slightly more initial setup.
- Developers need to understand MVC separation.

---

### Frontend Structure

- React app structured for **components, pages, and tests**.
- `SignupPage` and `LoginPage` interact with backend via **axios**.
- Google OAuth integration uses Firebase client SDK and backend token verification.

**Pros:**

- Clear separation of UI and backend.
- Google signup reduces friction for users.
- Compatible with future React components and routing.

**Cons:**

- Requires proper CORS handling.
- Slightly more complex setup for token verification.

---

### Hosting Choice

- We are using **Firebase Hosting** instead of Azure.
- Reason: Our previous experience with Azure caused deployment issues; Firebase Hosting worked seamlessly in prior projects.

**Pros:**

- Simple deployment and hosting.
- Integrated with Firebase Auth and Firestore.
- Free tier available for small projects.

**Cons:**

- Less flexibility than a full cloud provider like Azure.
- Vendor lock-in with Firebase services.

---

### Google OAuth Integration

- Frontend obtains **Google ID token** via Firebase client SDK.
- Backend verifies token using **Firebase Admin** and creates user profile if it doesn't exist.

**Why:**  
Provides seamless signup and login experience for users who prefer Google accounts.

**Pros:**

- Faster signup for users.
- Reduces password management overhead.
- Trusted authentication via Google.

**Cons:**

- Adds dependency on Google/Firebase.
- Requires handling token verification on the backend.

---

## Progress

### . User Authentication

- Implemented **signup and login functionality** for both email/password and Google OAuth.
- Users are stored in **Firebase Authentication** and also have corresponding profiles in **Firestore**.
- Backend endpoints:
  - `POST /api/auth/signup` – Email/password signup.
  - `POST /api/auth/signup/google` – Google OAuth signup.
  - `POST /api/auth/login` – Email/password login.

**Why this structure:**  
Separating **Auth** (Firebase Auth) and **user profile** (Firestore) ensures secure authentication while keeping user data structured and queryable.  
We added **email/password login** in addition to Google OAuth because it makes **testing and stubbing easier** during development.

**Pros:**

- Secure authentication via Firebase.
- Easy integration with frontend.
- Profiles are easily extendable for additional user data.
- Email/password login improves testing workflow.

**Cons:**

- Requires Firebase Admin setup and proper credential management.
- Slight complexity for synchronizing Auth and Firestore data.

### . User Home & Store Discovery

- Users can view closest stores on a map interface with distance filtering.
- Backend calculates distances based on store locations and user coordinates.
- Frontend displays live map markers and updates dynamically as filters change.

**Pros:**

- Improves discoverability for users.
- Intuitive UI with map visualisation.
- Distance filtering enhances user experience.

**Cons:**

- Requires handling geolocation permissions.
- Map rendering and live updates can be performance-heavy at times, especially on low-end devices.

### . Search & Filtering

- Users can search stores or items by name, size, catergory, or other attributes.
- Dynamic filters update results in real-time using backend queries.

**Pro:**

- Fast and relevant results
- Allows users to narrow down options quickly.
- Extensible for future filters (price, availability, ratings).

**Cons:**

- Backend queries must be optimised to avoid excessive reads in Firestore

### . Store Fronts & Item Details

- Store fronts display all items in a store.
- Item detail page includes:
  - IEnlarged image and full item description.
  - Reservation button to reserve the item.
  - Equiry feature for contacting the store directly where users can enquire about:
    - In-store collection (valid for one week).
    - Delivery

**Pros:**

- Clear, user-friendly item browsing.
- Reservation workflow increases engagement.
- Flexible options for item pickup/delivery.

**Cons:**

- Requires synchronisation of the item availability across reservations.
- Backend must handle multiple reservation states and user notifications.

### . Reserved Items

- Users can view items they have reserved.
- Includes quick links to item details and reservation status.

**Pros:**

- Easy tracking of reserved items

**Cons:**

- Needs proper state management between frontend and backend.

### . Chat Interface

- Real-time chat interface for user-store communication.
- Allows for users to ask questions about items, reservations, or deliveries.

**Pros:**

- Enhances communication between users and store owners.
- Supports reservations and enquiries seamlessly.

**Cons:**

- requires backend Websocket or real-time database integration for live updates.

### . Store Ownner Dashboard

- User dashboard/store managemnet
  - Manage store items and inventory.
  - Manage reservations and orders.
  - Update item availabiltiy and basic store information.

**Pros:**

- Centralised control for inventory and reservations.
- Allows store owners to manage their store effectively.
- Improves operational efficiency and reduces manual tracking.
- Provides a foundation for future analytics and reporting features.

**Cons:**

- Lacks analytics and insights in this sprint (data-driven decisions not available yet).
- Requires careful role-based access control to prevent unauthorized changes.
- Any reporting or insights will need to be added in future sprints.

---

## Summary

- ✅ User signup and login implemented (email/password + Google OAuth).
- ✅ Single Firestore collection for all users.
- ✅ Backend structured with MVC for scalability.
- ✅ Frontend integrated with backend using axios.
- ✅ Firebase hosting used for deployment.
- ✅ Main features implemented:
  - User home & closest stores with live map.
  - Search & filtering by size, category, etc.
  - Store fronts & detailed item pages with reservation/enquiry.
  - Reserved items management.
  - Chat interface.
  - Store owner dashboard

**Next Steps:**

- Implement logout and session management.
- Add user profile editing.
- Expand database for additional features (events, orders, etc.).
- Improve testing coverage for frontend and backend.
- Optimize Firestore queries and map rendering for performance.
- Implement analytics for stores and admin
