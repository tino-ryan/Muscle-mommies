# structure

## structure


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
