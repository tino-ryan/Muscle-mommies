# ThriftFinder Firestore Database Documentation

## Overview
ThriftFinder uses **Firebase Firestore** as its database to manage thrift store data, user interactions, and photo journal entries. The database supports the ThriftFinder app's core functionality (e.g., store management, item listings, reservations, and messaging) and the external API for integration with the Campus Quest project. This documentation describes the Firestore collections, their structure, purpose, and how they enable the application's features and external API endpoints.

The database is designed to:
- Store thrift store profiles and their inventory for display in ThriftFinder and as quest locations or advertisements in Campus Quest.
- Manage user interactions like reservations and messaging.
- Support photo uploads for user photo journals via the external API, stored in a separate `externalImages` collection to avoid interference with ThriftFinder’s internal logic.

## Database Setup
- **Database**: Google Firebase Firestore (NoSQL, document-based).
- **Collections**: The database consists of seven main collections: `users`, `stores`, `items`, `itemImages`, `Reservations`, `chats`, `messages`, and an additional `externalImages` collection for the external API.
- **Environment**: Configured via Firebase Admin SDK in the backend (`config/firebase.js`), with credentials stored in environment variables (`FIREBASE_*` in `.env`).
- **Access**: The backend (`index.js`, `storeController.js`, etc.) uses the Firebase Admin SDK for full read/write access. The external API (`/external/*`) provides read-only access to `stores` and read/write access to `externalImages` with API key authentication.

## Collections

### 1. `users`
Stores user profile information, including their role (customer or store owner).

#### Structure
- **Document ID**: Firebase UID (e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2`)
- **Fields**:
  - `createdAt`: Timestamp of user creation (Firestore Timestamp, e.g., 18 August 2025 at 21:29:35 UTC+2)
  - `email`: User’s email address (string, e.g., `boss@man.com`)
  - `name`: User’s display name (string, e.g., `boss`)
  - `role`: User role (string, enum: `customer` or `storeOwner`)

#### Purpose
- Tracks user accounts and their roles to differentiate between customers and store owners.
- Used by `authController.js` for signup and role retrieval (`/api/auth/getRole`).
- Links users to stores (via `ownerId` in `stores`) and reservations/messages (via `userId`, `senderId`, etc.).

#### Example
```json
{
  "createdAt": { "_seconds": 1724099375, "_nanoseconds": 0 },
  "email": "boss@man.com",
  "name": "boss",
  "role": "storeOwner"
}
```

### 2. `stores`
Stores thrift shop profiles, used for both ThriftFinder’s storefronts and Campus Quest’s quest locations/advertisements.

#### Structure
- **Document ID**: Auto-generated Firestore ID or UUID (e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
- **Fields**:
  - `address`: Physical address (string, e.g., `Wits Sports West Campus, Braamfontein, ...`)
  - `createdAt`: Creation timestamp (Firestore Timestamp, e.g., 28 August 2025 at 21:37:24 UTC+2)
  - `description`: Store description (string, e.g., `typical braam thrift shop`)
  - `location`: Geolocation (map, `{ lat: number, lng: number }`, e.g., `{ "lat": -26.1869103, "lng": 28.0299083 }`)
  - `ownerId`: Firebase UID of the store owner (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2`)
  - `profileImageURL`: Cloudinary URL for store’s profile image (string, e.g., `https://res.cloudinary.com/...`)
  - `storeId`: UUID for the store (string, matches document ID)
  - `storeName`: Store name (string, e.g., `Skull Dugree`)
  - `updatedAt`: Last update timestamp (Firestore Timestamp, e.g., 1 September 2025 at 23:40:36 UTC+2)
- **Subcollection**: `contactInfos`
  - **Document ID**: UUID (e.g., `4ac6605e-e6e7-476a-9f46-e10d08d3072a`)
  - **Fields**:
    - `id`: UUID (string, matches document ID)
    - `type`: Contact type (string, e.g., `phone`, `email`, `instagram`)
    - `value`: Contact value (string, e.g., `0667778888`)

#### Purpose
- Stores thrift shop metadata for display in ThriftFinder’s storefronts and Campus Quest’s quest locations/advertisements (`GET /external/stores`).
- Links to `items`, `Reservations`, `chats`, and `messages` via `storeId`.
- Subcollection `contactInfos` stores additional contact details (e.g., phone, social media).

#### Example
```json
{
  "address": "Wits Sports West Campus, Braamfontein, Johannesburg Ward 60, ...",
  "createdAt": { "_seconds": 1724879844, "_nanoseconds": 0 },
  "description": "typical braam thrift shop",
  "location": { "lat": -26.1869103, "lng": 28.0299083 },
  "ownerId": "dTGCpDOOteSXAq02NirTMZ2EOQk2",
  "profileImageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1756409843/muscle-mommies/owo3oralfcyucwkdupot.png",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "storeName": "Skull Dugree",
  "updatedAt": { "_seconds": 1725229236, "_nanoseconds": 0 }
}
```

### 3. `items`
Stores thrift item listings for sale in stores.

#### Structure
- **Document ID**: UUID (e.g., `1f8a7251-342c-409f-aaa2-54c6e5af3ab0`)
- **Fields**:
  - `category`: Item category (string, e.g., `footwear`)
  - `createdAt`: Creation timestamp (Firestore Timestamp, e.g., 28 August 2025 at 11:29:10 UTC+2)
  - `department`: Department (string, e.g., `men's`, `women's`)
  - `description`: Item description (string, e.g., `cool pair of adidas`)
  - `images`: Array of image metadata (array of maps, `{ imageId: string, imageURL: string, isPrimary: boolean }`)
  - `itemId`: UUID (string, matches document ID)
  - `name`: Item name (string, e.g., `shoes`)
  - `price`: Item price (number, e.g., 300)
  - `quantity`: Available quantity (number, e.g., 2)
  - `size`: Item size (string, e.g., `7`)
  - `status`: Item status (string, enum: `Available`, `Reserved`, `Out of Stock`, e.g., `Reserved`)
  - `storeId`: Reference to store (string, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
  - `style`: Item style (string, e.g., `streetwear`)
  - `updatedAt`: Last update timestamp (Firestore Timestamp, e.g., 2 September 2025 at 00:02:59 UTC+2)

#### Purpose
- Stores item listings for ThriftFinder’s inventory management and shopping features.
- Links to `Reservations`, `chats`, and `messages` via `itemId`.
- Used by `itemController.js` for CRUD operations (`/api/items`, `/api/stores/:storeId/items`, etc.).

#### Example
```json
{
  "category": "footwear",
  "createdAt": { "_seconds": 1724839750, "_nanoseconds": 0 },
  "department": "men's",
  "description": "cool pair of adidas",
  "images": [
    {
      "imageId": "8a62996e-86c0-4615-9b08-2220f532ebd1",
      "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1756419335/muscle-mommies/i4qzrhv1trdvzb8ehe0c.jpg",
      "isPrimary": false
    },
    {
      "imageId": "2ce94624-cd8b-493a-894d-910597abe2ca",
      "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1756668350/muscle-mommies/lamdqkswsz70xecaauji.webp",
      "isPrimary": false
    }
  ],
  "itemId": "1f8a7251-342c-409f-aaa2-54c6e5af3ab0",
  "name": "shoes",
  "price": 300,
  "quantity": 2,
  "size": "7",
  "status": "Reserved",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "style": "streetwear",
  "updatedAt": { "_seconds": 1725232979, "_nanoseconds": 0 }
}
```

### 4. `itemImages`
Stores metadata for images associated with items, uploaded to Cloudinary.

#### Structure
- **Document ID**: UUID (e.g., `121d5f7d-818b-4831-9e6f-11ae3c68b7e7`)
- **Fields**:
  - `imageId`: UUID (string, matches document ID)
  - `imageURL`: Cloudinary URL (string, e.g., `https://res.cloudinary.com/...`)
  - `isPrimary`: Whether the image is primary (boolean, e.g., `false`)
  - `itemId`: Reference to item (string, e.g., `58509fa7-5125-412e-b6eb-648fd822cb16`)

#### Purpose
- Stores image metadata for item listings, linked to `items` via `itemId`.
- Populated by `storeController.js` during item creation/update (`/api/stores/items`, `/api/stores/items/:itemId`).
- Separate from `externalImages` to isolate ThriftFinder’s internal images from Campus Quest’s photo journal uploads.

#### Example
```json
{
  "imageId": "121d5f7d-818b-4831-9e6f-11ae3c68b7e7",
  "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1756419431/muscle-mommies/aw7zglpyl8nx1pnvjist.jpg",
  "isPrimary": false,
  "itemId": "58509fa7-5125-412e-b6eb-648fd822cb16"
}
```

### 5. `Reservations`
Tracks item reservations made by customers.

#### Structure
- **Document ID**: UUID (e.g., `3cf472eb-f579-4561-8bba-d0b3e3fe9196`)
- **Fields**:
  - `itemId`: Reference to item (string, e.g., `1f8a7251-342c-409f-aaa2-54c6e5af3ab0`)
  - `reservationId`: UUID (string, matches document ID)
  - `reservedAt`: Reservation timestamp (Firestore Timestamp, e.g., 1 September 2025 at 09:37:04 UTC+2)
  - `status`: Reservation status (string, enum: `Pending`, `Confirmed`, `Cancelled`, `Completed`, e.g., `Pending`)
  - `storeId`: Reference to store (string, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
  - `updatedAt`: Last update timestamp (Firestore Timestamp, e.g., 1 September 2025 at 23:39:58 UTC+2)
  - `userId`: Firebase UID of the reserving user (string, e.g., `m4lMopagfkbd2RURe9JeralPK4R2`)

#### Purpose
- Manages item reservations for ThriftFinder’s order system (`/api/stores/reservations`, `/api/stores/reserve/:itemId`).
- Links to `items` and `stores` via `itemId` and `storeId`.
- Used by store owners to confirm/cancel reservations (`updateReservation` in `storeController.js`).

#### Example
```json
{
  "itemId": "1f8a7251-342c-409f-aaa2-54c6e5af3ab0",
  "reservationId": "3cf472eb-f579-4561-8bba-d0b3e3fe9196",
  "reservedAt": { "_seconds": 1725178624, "_nanoseconds": 0 },
  "status": "Pending",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "updatedAt": { "_seconds": 1725227998, "_nanoseconds": 0 },
  "userId": "m4lMopagfkbd2RURe9JeralPK4R2"
}
```

### 6. `chats`
Stores conversation metadata between users (e.g., customer and store owner).

#### Structure
- **Document ID**: Concatenated Firebase UIDs (e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2_m4lMopagfkbd2RURe9JeralPK4R2`)
- **Fields**:
  - `chatId`: Concatenated UIDs (string, matches document ID)
  - `itemId`: Reference to item (string, optional, e.g., `1f8a7251-342c-409f-aaa2-54c6e5af3ab0`)
  - `lastMessage`: Most recent message text (string, e.g., `Condition is excellent.`)
  - `lastTimestamp`: Timestamp of last message (Firestore Timestamp, e.g., 1 September 2025 at 15:25:56 UTC+2)
  - `participants`: Array of Firebase UIDs (array of strings, e.g., `["dTGCpDOOteSXAq02NirTMZ2EOQk2", "m4lMopagfkbd2RURe9JeralPK4R2"]`)
  - `storeId`: Reference to store (string, optional, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)

#### Purpose
- Tracks conversations for ThriftFinder’s in-app messaging (`/api/stores/chats`, `/api/stores/messages`).
- Links to `messages`, `items`, and `stores` via `chatId`, `itemId`, and `storeId`.
- Populated when users send messages or create chats (`sendMessage`, `createChat` in `storeController.js`).

#### Example
```json
{
  "chatId": "dTGCpDOOteSXAq02NirTMZ2EOQk2_m4lMopagfkbd2RURe9JeralPK4R2",
  "itemId": "1f8a7251-342c-409f-aaa2-54c6e5af3ab0",
  "lastMessage": "Condition is excellent.",
  "lastTimestamp": { "_seconds": 1725199556, "_nanoseconds": 0 },
  "participants": [
    "dTGCpDOOteSXAq02NirTMZ2EOQk2",
    "m4lMopagfkbd2RURe9JeralPK4R2"
  ],
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f"
}
```

### 7. `messages`
Stores individual messages within conversations.

#### Structure
- **Document ID**: Auto-generated Firestore ID (e.g., `92mnQMtLGwz1plHns8hK`)
- **Fields**:
  - `chatId`: Reference to chat (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2_m4lMopagfkbd2RURe9JeralPK4R2`)
  - `itemId`: Reference to item (string, optional, e.g., `1f8a7251-342c-409f-aaa2-54c6e5af3ab0`)
  - `message`: Message text (string, e.g., `Reservation request for shoes`)
  - `read`: Whether the message was read (boolean, e.g., `true`)
  - `receiverId`: Firebase UID of recipient (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2`)
  - `senderId`: Firebase UID of sender (string, e.g., `m4lMopagfkbd2RURe9JeralPK4R2`)
  - `storeId`: Reference to store (string, optional, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
  - `timestamp`: Message timestamp (Firestore Timestamp, e.g., 1 September 2025 at 09:37:04 UTC+2)

#### Purpose
- Stores message history for ThriftFinder’s chat feature (`/api/stores/chats/:chatId/messages`).
- Links to `chats`, `items`, and `stores` via `chatId`, `itemId`, and `storeId`.
- Supports read receipts (`markAsRead` in `storeController.js`).

#### Example
```json
{
  "chatId": "dTGCpDOOteSXAq02NirTMZ2EOQk2_m4lMopagfkbd2RURe9JeralPK4R2",
  "itemId": "1f8a7251-342c-409f-aaa2-54c6e5af3ab0",
  "message": "Reservation request for shoes",
  "read": true,
  "receiverId": "dTGCpDOOteSXAq02NirTMZ2EOQk2",
  "senderId": "m4lMopagfkbd2RURe9JeralPK4R2",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "timestamp": { "_seconds": 1725178624, "_nanoseconds": 0 }
}
```

### 8. `externalImages`
Stores metadata for photos uploaded via the external API (`POST /external/upload`) for Campus Quest’s photo journal feature.

#### Structure
- **Document ID**: Cloudinary public ID (e.g., `muscle-mommies/external/abc123`)
- **Fields**:
  - `imageId`: Cloudinary public ID (string, matches document ID)
  - `imageURL`: Cloudinary URL (string, e.g., `https://res.cloudinary.com/...`)
  - `createdAt`: Upload timestamp (Firestore Timestamp, e.g., 1 September 2025 at 09:00:00 UTC+2)

#### Purpose
- Stores metadata for photos uploaded by Campus Quest users, separate from `itemImages` to avoid interference with ThriftFinder’s internal logic.
- Populated by `externalController.js` (`uploadPhoto`) and retrieved via `GET /external/photos`.
- Supports Campus Quest’s photo journal feature, allowing users to upload quest-related images (e.g., thrift finds).

#### Example
```json
{
  "imageId": "muscle-mommies/external/abc123",
  "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1756419431/muscle-mommies/external/abc123.jpg",
  "createdAt": { "_seconds": 1725177600, "_nanoseconds": 0 }
}
```

## Why This Setup?
- **Firestore Choice**: Firestore’s NoSQL structure supports flexible schemas, real-time updates, and scalability, ideal for ThriftFinder’s dynamic data (stores, items, chats) and Campus Quest’s integration needs.
- **Separation of Concerns**:
  - `users`, `stores`, `items`, `itemImages`, `Reservations`, `chats`, and `messages` support ThriftFinder’s core functionality (storefronts, inventory, messaging, reservations).
  - `externalImages` isolates Campus Quest’s photo journal uploads to prevent conflicts with ThriftFinder’s `itemImages`.
- **Relationships**:
  - `storeId` links `stores` to `items`, `Reservations`, `chats`, and `messages`.
  - `itemId` links `items` to `itemImages`, `Reservations`, `chats`, and `messages`.
  - `userId` and `ownerId` link users to reservations and stores.
  - `chatId` links `chats` to `messages`.
- **External API Support**:
  - `stores` is exposed via `GET /external/stores` (public) for Campus Quest to use as quest locations or ads.
  - `externalImages` supports `POST /external/upload` and `GET /external/photos` (API key secured) for photo journal management.
- **Scalability**: Firestore’s automatic scaling handles growing data. The `externalImages` collection uses Cloudinary public IDs as document IDs to avoid collisions and simplify lookups.

## How It Works
1. **ThriftFinder App**:
   - Users sign up (`authController.js`) and are stored in `users`.
   - Store owners create/update stores (`createOrUpdateStore`), populating `stores` and `contactInfos`.
   - Items are added/updated (`createItem`, `updateItem`), stored in `items` with images in `itemImages`.
   - Customers reserve items (`customerReserve`), creating entries in `Reservations` and triggering messages in `chats` and `messages`.
   - Messages are sent (`sendMessage`) and tracked (`markAsRead`) in `chats` and `messages`.

2. **External API for Campus Quest**:
   - `GET /external/stores`: Retrieves all `stores` documents, used for quest locations or advertisements. No authentication needed to maximize exposure.
   - `POST /external/upload`: Uploads photos to Cloudinary (in `muscle-mommies/external` folder) and stores metadata in `externalImages`. Requires API key for security.
   - `GET /external/photos`: Retrieves all `externalImages` documents for photo journal display. Requires API key.

3. **Data Flow**:
   - **Store Creation**: `stores` → `contactInfos` (optional).
   - **Item Listing**: `items` → `itemImages` (via Cloudinary uploads).
   - **Reservation**: `items` (update `status`) → `Reservations` → `chats`/`messages` (notification to store owner).
   - **Messaging**: `chats` (conversation metadata) → `messages` (individual messages).
   - **Photo Journal**: External client uploads photo → Cloudinary → `externalImages`.

## Usage Notes
- **Access**: The backend uses Firebase Admin SDK with full access. The external API restricts `externalImages` access to API key holders (`validateApiKey` in `externalController.js`).
- **Security**:
  - Firebase Security Rules should restrict read/write access to authenticated users for `users`, `stores`, `items`, etc., except for `stores` (public read for `/external/stores`).
  - `externalImages` is write-protected by API key in the backend, but Firestore rules should further limit access.
- **Campus Quest Integration**:
  - Use `stores` data for quest locations (e.g., map `location.lat`, `location.lng`).
  - Use `externalImages` for photo journals, storing/retrieving quest-related images.
  - Share the API key securely with the Campus Quest team for `/external/upload` and `/external/photos`.
- **Maintenance**:
  - Monitor Firestore usage (reads/writes) to optimize costs.
  - Periodically clean up `externalImages` if unused photos accumulate (e.g., implement a TTL policy).
  - Ensure Cloudinary folder `muscle-mommies/external` is monitored for storage limits.

## Example Data Flow
1. **Store Owner Adds Item**:
   - Creates store in `stores` (`c2e14220-5ebc-4211-9995-b056ad6e852f`).
   - Adds item (`1f8a7251-342c-409f-aaa2-54c6e5af3ab0`) to `items` with images in `itemImages`.
2. **Customer Reserves Item**:
   - Triggers `customerReserve`, creating a `Reservations` entry (`3cf472eb-f579-4561-8bba-d0b3e3fe9196`).
   - Updates `items.status` to `Reserved`.
   - Creates a `chats` entry and sends a `messages` entry (`92mnQMtLGwz1plHns8hK`).
3. **Campus Quest Uses API**:
   - Calls `GET /external/stores` to get store data for quests.
   - Uploads a photo via `POST /external/upload`, storing metadata in `externalImages`.

## Notes
- **Indexes**: Ensure Firestore composite indexes are set for queries (e.g., `chats.participants`, `items.storeId`, `Reservations.userId`). Check the Firestore console for index errors.
- **Backups**: Use Firebase’s export feature to back up data regularly.
- **Campus Quest Collaboration**: Share this documentation and the API key with the Campus Quest team. Discuss additional needs (e.g., filtering stores by location or linking photos to quests).
- **Future Improvements**:
  - Add `externalImages` fields for linking to Campus Quest users/quests.
  - Implement Firestore TTL policies for old `externalImages` documents.
  - Add geospatial queries for `stores.location` to support proximity-based quests.