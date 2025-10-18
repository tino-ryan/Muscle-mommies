# ThriftFinder Firestore Database Documentation

## Overview

The **ThriftFinder** application leverages **Google Firebase Firestore**, a NoSQL, document-based database, to manage thrift store profiles, item listings, user interactions, and external API data for integration with the Campus Quest project. Firestore was chosen for its seamless integration with Firebase Authentication and Hosting, fast performance, clean and intuitive layout, and ability to meet all application requirements, as proven in our previous project. This documentation details the database structure, collection schemas, relationships, and usage guidelines for developers working with the ThriftFinder API and its external integrations.

### Diagram

```plain
users
  ├── Reservations (userId)
  ├── stores (ownerId)
  ├── messages (senderId, receiverId)
  └── outfits (userId)

stores
  ├── contactInfos (subcollection)
  ├── items (storeId)
  ├── Reservations (storeId)
  ├── Reviews (storeId)
  ├── chats (storeId)
  └── messages (storeId)

items
  ├── itemImages (itemId)
  ├── Reservations (itemId)
  ├── Reviews (itemId)
  ├── chats (itemId)
  ├── messages (itemId)
  └── outfits (slots)

chats
  └── messages (chatId)

Reservations
  └── Reviews (reservationId)

externalImages
  (isolated, used by Campus Quest)
```

### Why Firestore?

- **Seamless Integration**: Firestore integrates natively with Firebase Authentication (used for user management) and Firebase Hosting, simplifying setup and ensuring consistency across the stack. This was a key factor, as it worked well in our previous project.
- **Fast Performance**: Firestore’s real-time updates and efficient querying support the dynamic needs of ThriftFinder (e.g., live item updates, messaging) and Campus Quest’s external API.
- **Clean Layout**: The document-collection model provides a clear, hierarchical structure, making it easy to manage and query data for stores, items, and user interactions.
- **Scalability**: Firestore’s automatic scaling handles growing data volumes without requiring manual infrastructure management.
- **Meets Requirements**: Firestore supports all ThriftFinder features (store management, item listings, reservations, chats, outfits) and Campus Quest’s photo journal and store location needs, with no significant limitations encountered.

### Database Setup

- **Database**: Google Firebase Firestore (NoSQL, document-based).
- **Environment**: Configured via Firebase Admin SDK in the backend (`/server/config/firebase.js`), with credentials stored in environment variables (`FIREBASE_*` in `.env`).
- **Access**:
  - Backend: Full read/write access via Firebase Admin SDK in controllers (`itemController.js`, `storeController.js`).
  - External API: Read-only access to `stores` (`GET /external/stores`) and read/write access to `externalImages` (`POST /external/upload`, `GET /external/photos`) with API key authentication (`validateApiKey` in `externalController.js`).
- **Collections**: Nine main collections: `users`, `stores`, `items`, `itemImages`, `Reservations`, `Reviews`, `chats`, `messages`, `outfits`, and `externalImages` for Campus Quest’s photo journal.

### Pros of Firestore Setup

- **Ease of Setup**: Firestore’s integration with Firebase Auth and Hosting streamlined development, especially given our team’s prior experience with Firebase from the last project.
- **Real-Time Updates**: Supports live updates for chats (`messages`, `chats`) and item status changes (`items`, `Reservations`), enhancing user experience.
- **Flexible Schema**: NoSQL structure allows dynamic fields (e.g., `stores.hours`, `items.images`) without rigid schema changes.
- **Scalability**: Automatically handles increased load as the platform grows, suitable for ThriftFinder’s user base and Campus Quest’s external queries.
- **Cost-Effective for Development**: Free tier was sufficient for development and testing, aligning with project budget constraints.

### Cons of Firestore Setup

- **Query Limitations**: Firestore’s query restrictions (e.g., no full-text search, limited compound queries) require client-side filtering in some cases (e.g., `searchItems` in `itemController.js`), increasing complexity and potential latency.
- **Cost Monitoring**: While the free tier sufficed for development, production usage (reads/writes) could incur costs, requiring careful query optimization.
- **Index Management**: Complex queries (e.g., filtering `items` by multiple fields or `chats` by `participants`) require manual index creation in the Firestore console, which can be overlooked and cause errors.
- **Dependency on Firebase Ecosystem**: Tight integration with Firebase Auth and Hosting creates a dependency on Google’s ecosystem, potentially complicating future migrations.

## Collections

Below are the nine Firestore collections, their schemas, purposes, and example documents based on the provided data.

### 1. `users`

Stores user profile information, including their role in the ThriftFinder ecosystem.

#### Schema

- **Document ID**: Firebase UID (e.g., `hfY0t2eLCGVXRmp4WKoBmR1TIfi1`)
- **Fields**:
  - `createdAt`: Timestamp of user creation (Firestore Timestamp, e.g., 23 August 2025 at 01:07:07 UTC+2)
  - `email`: User’s email address (string, e.g., `ryanrats04@gmail.com`)
  - `name`: User’s display name (string, e.g., `Ryan`)
  - `role`: User role (string, enum: `customer`, `storeOwner`, e.g., `storeOwner`)

#### Purpose

- Tracks user accounts and roles to distinguish between customers and store owners.
- Used by `authController.js` for signup (`/api/auth/signup`) and role retrieval (`/api/auth/getRole`).
- Links to `stores` (via `ownerId`), `Reservations` (via `userId`), `messages` (via `senderId`, `receiverId`), and `outfits` (via `userId`).

#### Example

```json
{
  "createdAt": { "_seconds": 1724450827, "_nanoseconds": 0 },
  "email": "ryanrats04@gmail.com",
  "name": "Ryan",
  "role": "storeOwner"
}
```

### 2. `stores`

Stores thrift shop profiles, used for ThriftFinder storefronts and Campus Quest quest locations/advertisements.

#### Schema

- **Document ID**: UUID (e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
- **Fields**:
  - `address`: Physical address (string, e.g., `1 Jan Smuts Avenue, Braamfontein, Johannesburg`)
  - `averageRating`: Average rating from reviews (number, e.g., 4)
  - `createdAt`: Creation timestamp (Firestore Timestamp, e.g., 28 August 2025 at 21:37:24 UTC+2)
  - `description`: Store description (string, e.g., `typical braam thrift shop fr`)
  - `hours`: Operating hours by day (map, e.g., `{ "Monday": { "open": true, "start": "09:00", "end": "17:00" }, ... }`)
  - `location`: Geolocation (map, `{ lat: number, lng: number }`, e.g., `{ "lat": -26.19289, "lng": 28.0304321 }`)
  - `ownerId`: Firebase UID of the store owner (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2`)
  - `profileImageURL`: Cloudinary URL for store’s profile image (string, e.g., `https://res.cloudinary.com/.../sgwxe5wfwyihjkhasvoc.jpg`)
  - `reviewCount`: Number of reviews (number, e.g., 1)
  - `storeId`: UUID (string, matches document ID)
  - `storeName`: Store name (string, e.g., `Skull Dugree`)
  - `theme`: Store aesthetic (string, e.g., `theme-y2k`)
  - `updatedAt`: Last update timestamp (Firestore Timestamp, e.g., 18 October 2025 at 15:52:08 UTC+2)
- **Subcollection**: `contactInfos`
  - **Document ID**: UUID (e.g., `2cc06aa4-6c46-4239-9be8-8f69d4c7655a`)
  - **Fields**:
    - `id`: UUID (string, matches document ID)
    - `type`: Contact type (string, e.g., `email`, `phone`)
    - `value`: Contact value (string, e.g., `tinogozho2@gmail.com`)

#### Purpose

- Stores thrift shop metadata for display in ThriftFinder and Campus Quest (`GET /external/stores`).
- Links to `items`, `Reservations`, `chats`, `messages`, and `Reviews` via `storeId`.
- `contactInfos` subcollection stores additional contact details (e.g., email, phone).
- `theme` field enhances UI filtering and user experience.

#### Example

```json
{
  "address": "1 Jan Smuts Avenue, Braamfontein, Johannesburg",
  "averageRating": 4,
  "createdAt": { "_seconds": 1724879844, "_nanoseconds": 0 },
  "description": "typical braam thrift shop fr",
  "hours": {
    "Monday": { "open": true, "start": "09:00", "end": "17:00" },
    "Tuesday": { "open": true, "start": "09:00", "end": "17:00" },
    "Wednesday": { "open": false, "start": "09:00", "end": "17:00" },
    "Thursday": { "open": true, "start": "09:00", "end": "22:00" },
    "Friday": { "open": true, "start": "09:00", "end": "17:00" },
    "Saturday": { "open": false, "start": "09:00", "end": "17:00" },
    "Sunday": { "open": false, "start": "09:00", "end": "17:00" }
  },
  "location": { "lat": -26.19289, "lng": 28.0304321 },
  "ownerId": "dTGCpDOOteSXAq02NirTMZ2EOQk2",
  "profileImageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1758987109/muscle-mommies/sgwxe5wfwyihjkhasvoc.jpg",
  "reviewCount": 1,
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "storeName": "Skull Dugree",
  "theme": "theme-y2k",
  "updatedAt": { "_seconds": 1729341128, "_nanoseconds": 0 }
}
```

**Subcollection Example (`contactInfos`)**:

```json
{
  "id": "2cc06aa4-6c46-4239-9be8-8f69d4c7655a",
  "type": "email",
  "value": "tinogozho2@gmail.com"
}
```

### 3. `items`

Stores thrift item listings for sale in stores.

#### Schema

- **Document ID**: UUID (e.g., `02d15b8d-4d4f-4e8f-ba0c-694f3271e62b`)
- **Fields**:
  - `category`: Item category (string, e.g., `tops`)
  - `createdAt`: Creation timestamp (Firestore Timestamp, e.g., 25 September 2025 at 18:21:37 UTC+2)
  - `department`: Department (string, e.g., `men's`)
  - `description`: Item description (string, e.g., ``)
  - `images`: Array of image metadata (array of maps, `{ imageId: string, imageURL: string, isPrimary: boolean, itemId: string }`)
  - `itemId`: UUID (string, matches document ID)
  - `name`: Item name (string, e.g., `Tshirt`)
  - `price`: Item price (number, e.g., 150)
  - `quantity`: Available quantity (number, e.g., 1)
  - `size`: Item size (string, e.g., ``)
  - `status`: Item status (string, enum: `Available`, `Reserved`, `Sold`, `Out of Stock`, e.g., `Available`)
  - `storeId`: Reference to store (string, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
  - `style`: Item style (string, e.g., ``)
  - `updatedAt`: Last update timestamp (Firestore Timestamp, e.g., 25 September 2025 at 18:21:37 UTC+2)

#### Purpose

- Manages item listings for ThriftFinder’s inventory (`/api/items`, `/api/stores/:storeId/items`).
- Links to `itemImages`, `Reservations`, `chats`, `messages`, and `outfits` via `itemId`.

#### Example

```json
{
  "category": "tops",
  "createdAt": { "_seconds": 1727277697, "_nanoseconds": 0 },
  "department": "men's",
  "description": "",
  "images": [
    {
      "imageId": "62aaa180-125a-42c1-852b-2ccfc899be28",
      "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1758817296/muscle-mommies/utxlvddsfjizybybvwo2.jpg",
      "isPrimary": true,
      "itemId": "02d15b8d-4d4f-4e8f-ba0c-694f3271e62b"
    }
  ],
  "itemId": "02d15b8d-4d4f-4e8f-ba0c-694f3271e62b",
  "name": "Tshirt",
  "price": 150,
  "quantity": 1,
  "size": "",
  "status": "Available",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "style": "",
  "updatedAt": { "_seconds": 1727277697, "_nanoseconds": 0 }
}
```

### 4. `itemImages`

Stores metadata for images associated with items, uploaded to Cloudinary.

#### Schema

- **Document ID**: UUID (e.g., `085a423d-2963-4135-ad85-45bff2b38538`)
- **Fields**:
  - `imageId`: UUID (string, matches document ID)
  - `imageURL`: Cloudinary URL (string, e.g., `https://res.cloudinary.com/.../palmcylacfecr0hjywt9.jpg`)
  - `isPrimary`: Whether the image is primary (boolean, e.g., `true`)
  - `itemId`: Reference to item (string, e.g., `70d5faf2-6117-4f43-b387-7a4a3eb1689`)

#### Purpose

- Stores image metadata for item listings, linked to `items` via `itemId`.
- Populated during item creation/update (`createItem`, `updateItem` in `itemController.js`).

#### Example

```json
{
  "imageId": "085a423d-2963-4135-ad85-45bff2b38538",
  "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1757024443/muscle-mommies/palmcylacfecr0hjywt9.jpg",
  "isPrimary": true,
  "itemId": "70d5faf2-6117-4f43-b387-7a4a3eb1689"
}
```

### 5. `Reservations`

Tracks item reservations made by customers.

#### Schema

- **Document ID**: UUID (e.g., `56387fce-6f71-4e4d-8d52-c78234ea188d`)
- **Fields**:
  - `completedAt`: Completion timestamp (Firestore Timestamp, e.g., 27 September 2025 at 17:19:16 UTC+2, optional)
  - `itemId`: Reference to item (string, e.g., `d417a96e-aa95-45af-8591-771cdbd7f46a`)
  - `reservationId`: UUID (string, matches document ID)
  - `reservedAt`: Reservation timestamp (Firestore Timestamp, e.g., 2 September 2025 at 15:55:33 UTC+2)
  - `soldAt`: Sale timestamp (Firestore Timestamp, e.g., 27 September 2025 at 17:16:46 UTC+2, optional)
  - `status`: Reservation status (string, enum: `Pending`, `Confirmed`, `Cancelled`, `Sold`, `Completed`, e.g., `Completed`)
  - `storeId`: Reference to store (string, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`)
  - `updatedAt`: Last update timestamp (Firestore Timestamp, e.g., 27 September 2025 at 17:19:16 UTC+2)
  - `userId`: Firebase UID of the reserving user (string, e.g., `m4lMopagfkbd2RURe9JeralPK4R2`)

#### Purpose

- Manages item reservations for ThriftFinder’s order system (`/api/stores/reservations`, `/api/stores/reserve/:itemId`).
- Links to `items`, `stores`, `chats`, and `messages` via `itemId` and `storeId`.

#### Example

```json
{
  "completedAt": { "_seconds": 1727536756, "_nanoseconds": 0 },
  "itemId": "d417a96e-aa95-45af-8591-771cdbd7f46a",
  "reservationId": "56387fce-6f71-4e4d-8d52-c78234ea188d",
  "reservedAt": { "_seconds": 1725374133, "_nanoseconds": 0 },
  "soldAt": { "_seconds": 1727536606, "_nanoseconds": 0 },
  "status": "Completed",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "updatedAt": { "_seconds": 1727536756, "_nanoseconds": 0 },
  "userId": "m4lMopagfkbd2RURe9JeralPK4R2"
}
```

### 6. `Reviews`

Stores customer reviews for stores and items.

#### Schema

- **Document ID**: Auto-generated Firestore ID (e.g., `b089ed4e-3835-450d-b785-bff302533fd2`)
- **Fields**:
  - `createdAt`: Review timestamp (Firestore Timestamp, e.g., 25 September 2025 at 12:50:27 UTC+2)
  - `itemId`: Reference to item (string, e.g., `a12b24ae-fd94-428e-9c0c-7aa8be76ba4f`, optional)
  - `rating`: Review rating (number, 1-5, e.g., 4)
  - `reservationId`: Reference to reservation (string, e.g., `b089ed4e-3835-450d-b785-bff302533fd2`, optional)
  - `review`: Review text (string, e.g., `Great quality, seller was extremely helpful. Will shop again`)
  - `storeId`: Reference to store (string, e.g., `JcjBD6UJLYZwVziJK1w6`)
  - `userId`: Firebase UID of the reviewer (string, e.g., `hfY0t2eLCGVXRmp4WKoBmR1TIfi1`)

#### Purpose

- Stores feedback for stores and items (`/api/stores/reviews`, `/api/stores/:storeId/reviews`).
- Links to `stores`, `items`, and `Reservations` via `storeId`, `itemId`, and `reservationId`.

#### Example

```json
{
  "createdAt": { "_seconds": 1727259027, "_nanoseconds": 0 },
  "itemId": "a12b24ae-fd94-428e-9c0c-7aa8be76ba4f",
  "rating": 4,
  "reservationId": "b089ed4e-3835-450d-b785-bff302533fd2",
  "review": "Great quality, seller was extremely helpful. Will shop again",
  "storeId": "JcjBD6UJLYZwVziJK1w6",
  "userId": "hfY0t2eLCGVXRmp4WKoBmR1TIfi1"
}
```

### 7. `chats`

Stores conversation metadata between users (e.g., customer and store owner).

#### Schema

- **Document ID**: Concatenated Firebase UIDs (e.g., `F8g3r5NssmgWcwTAzc0ZOI1MqB42_XlAeEMLnD3QYqtOBbjqMep6rPin2`)
- **Fields**:
  - `chatId`: Concatenated UIDs (string, matches document ID)
  - `itemId`: Reference to item (string, e.g., `f3cdba3a-c665-446f-99f6-12605b0d1c6e`, optional)
  - `lastMessage`: Most recent message text (string, e.g., `lowkey wanna kill myself ahahaha`)
  - `lastTimestamp`: Timestamp of last message (Firestore Timestamp, e.g., 29 September 2025 at 01:24:59 UTC+2)
  - `participants`: Array of Firebase UIDs (array of strings, e.g., `["F8g3r5NssmgWcwTAzc0ZOI1MqB42", "XlAeEMLnD3QYqtOBbjqMep6rPin2"]`)
  - `storeId`: Reference to store (string, e.g., `WlzniiGFwVWyKYBi6G1`, optional)

#### Purpose

- Tracks conversation metadata for ThriftFinder’s messaging (`/api/stores/chats`, `/api/stores/messages`).
- Links to `messages`, `items`, and `stores` via `chatId`, `itemId`, and `storeId`.

#### Example

```json
{
  "chatId": "F8g3r5NssmgWcwTAzc0ZOI1MqB42_XlAeEMLnD3QYqtOBbjqMep6rPin2",
  "itemId": "f3cdba3a-c665-446f-99f6-12605b0d1c6e",
  "lastMessage": "lowkey wanna kill myself ahahaha",
  "lastTimestamp": { "_seconds": 1727561099, "_nanoseconds": 0 },
  "participants": [
    "F8g3r5NssmgWcwTAzc0ZOI1MqB42",
    "XlAeEMLnD3QYqtOBbjqMep6rPin2"
  ],
  "storeId": "WlzniiGFwVWyKYBi6G1"
}
```

### 8. `messages`

Stores individual messages within conversations.

#### Schema

- **Document ID**: Auto-generated Firestore ID (e.g., `1MvBm3z0AG2giHXanBWs`)
- **Fields**:
  - `chatId`: Reference to chat (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2_m4lMopagfkbd2RURe9JeralPK4R2`)
  - `itemId`: Reference to item (string, e.g., `d417a96e-aa95-45af-8591-771cdbd7f46a`, optional)
  - `message`: Message text (string, e.g., `Reservation request for pink dress`)
  - `read`: Whether the message was read (boolean, e.g., `true`)
  - `receiverId`: Firebase UID of recipient (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2`)
  - `senderId`: Firebase UID of sender (string, e.g., `m4lMopagfkbd2RURe9JeralPK4R2`)
  - `storeId`: Reference to store (string, e.g., `c2e14220-5ebc-4211-9995-b056ad6e852f`, optional)
  - `timestamp`: Message timestamp (Firestore Timestamp, e.g., 2 September 2025 at 15:55:34 UTC+2)

#### Purpose

- Stores message history for ThriftFinder’s chat feature (`/api/stores/chats/:chatId/messages`).
- Links to `chats`, `items`, and `stores` via `chatId`, `itemId`, and `storeId`.

#### Example

```json
{
  "chatId": "dTGCpDOOteSXAq02NirTMZ2EOQk2_m4lMopagfkbd2RURe9JeralPK4R2",
  "itemId": "d417a96e-aa95-45af-8591-771cdbd7f46a",
  "message": "Reservation request for pink dress",
  "read": true,
  "receiverId": "dTGCpDOOteSXAq02NirTMZ2EOQk2",
  "senderId": "m4lMopagfkbd2RURe9JeralPK4R2",
  "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
  "timestamp": { "_seconds": 1725374134, "_nanoseconds": 0 }
}
```

### 9. `outfits`

Stores user-created outfit combinations from selected items.

#### Schema

- **Document ID**: UUID (e.g., `a1b2c3d4-e5f6-4123-8a9b-0c1d2e3f4g5h`)
- **Fields**:
  - `outfitId`: UUID (string, matches document ID)
  - `slots`: Array of item IDs or null (array, e.g., `["d417a96e-aa95-45af-8591-771cdbd7f46a", null, null, null, null, null, null, null, null]`)
  - `userId`: Firebase UID of the user (string, e.g., `dTGCpDOOteSXAq02NirTMZ2EOQk2`)

#### Purpose

- Allows users to save outfit combinations (`/api/outfits`).
- Links to `items` and `users` via `slots` (item IDs) and `userId`.

#### Example

```json
{
  "outfitId": "a1b2c3d4-e5f6-4123-8a9b-0c1d2e3f4g5h",
  "slots": [
    "d417a96e-aa95-45af-8591-771cdbd7f46a",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  "userId": "dTGCpDOOteSXAq02NirTMZ2EOQk2"
}
```

### 10. `externalImages`

Stores metadata for photos uploaded via the external API for Campus Quest’s photo journal feature.

#### Schema

- **Document ID**: Cloudinary public ID (e.g., `muscle-mommies/x2xtgq15os9qwfpyq4cy`)
- **Fields**:
  - `imageId`: Cloudinary public ID (string, matches document ID)
  - `imageURL`: Cloudinary URL (string, e.g., `https://res.cloudinary.com/.../x2xtgq15os9qwfpyq4cy.jpg`)
  - `createdAt`: Upload timestamp (Firestore Timestamp, e.g., 30 September 2025 at 14:39:00 UTC+2)

#### Purpose

- Stores metadata for Campus Quest photo journal uploads (`POST /external/upload`, `GET /external/photos`).
- Isolated from `itemImages` to prevent interference with ThriftFinder’s internal logic.

#### Example

```json
{
  "imageId": "muscle-mommies/x2xtgq15os9qwfpyq4cy",
  "imageURL": "https://res.cloudinary.com/dfkg0topw/image/upload/v1756419431/muscle-mommies/x2xtgq15os9qwfpyq4cy.jpg",
  "createdAt": { "_seconds": 1727698740, "_nanoseconds": 0 }
}
```

## Relationships

The collections are interconnected to support ThriftFinder’s functionality and Campus Quest’s integration:

- **storeId**: Links `stores` to `items`, `Reservations`, `Reviews`, `chats`, and `messages`.
- **itemId**: Links `items` to `itemImages`, `Reservations`, `Reviews`, `chats`, `messages`, and `outfits` (via `slots`).
- **userId** and **ownerId**: Link `users` to `Reservations`, `stores`, `outfits`, and `messages` (via `senderId`, `receiverId`).
- **chatId**: Links `chats` to `messages`.
- **reservationId**: Links `Reservations` to `Reviews`.

## Data Flow

### ThriftFinder App

1. **User Signup**: Creates `users` document (`authController.js`).
2. **Store Creation**: Populates `stores` and `contactInfos` (`createOrUpdateStore`).
3. **Item Listing**: Adds `items` and `itemImages` (`createItem`, `updateItem`).
4. **Reservation**: Updates `items.status`, creates `Reservations`, and triggers `chats`/`messages` (`customerReserve`).
5. **Messaging**: Creates `chats` and `messages` (`sendMessage`, `createChat`).
6. **Outfit Creation**: Saves `outfits` with item references (`saveOutfit`).
7. **Reviews**: Creates `Reviews` and updates `stores.averageRating` (`createReview`, `updateStoreRating`).

### Campus Quest Integration

1. **Store Data**: `GET /external/stores` retrieves `stores` for quest locations or ads.
2. **Photo Journal**: `POST /external/upload` uploads photos to Cloudinary and stores metadata in `externalImages`. `GET /external/photos` retrieves photo metadata.

## User Guide

### For Developers

#### Setting Up Firestore

1. **Initialize Firebase Admin SDK**:
   - Configure credentials in `/server/config/firebase.js` using environment variables (`FIREBASE_*`).
   - Example:
     ```javascript
     const admin = require('firebase-admin');
     admin.initializeApp({
       credential: admin.credential.cert(process.env.FIREBASE_CREDENTIALS),
     });
     ```
2. **Set Security Rules**:
   - Restrict `users`, `items`, `Reservations`, `chats`, `messages`, `outfits` to authenticated users.
   - Allow public read for `stores` (for `GET /external/stores`).
   - Restrict `externalImages` write access to API key-authenticated requests.
   - Example rules:
     ```json
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /stores/{storeId} {
           allow read: if true;
           allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
         }
         match /externalImages/{imageId} {
           allow read, write: if false; // Backend handles access via API key
         }
         match /{collection}/{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```

#### Querying Data

1. **Retrieve Stores**:
   - Use `GET /api/stores` or `GET /external/stores` to fetch all stores.
   - Example (Node.js with Admin SDK):
     ```javascript
     const stores = await admin.firestore().collection('stores').get();
     stores.docs.map((doc) => ({ storeId: doc.id, ...doc.data() }));
     ```
2. **Search Items**:
   - Use `GET /api/items/search` with query params (e.g., `category=tops&searchTerm=shirt`).
   - Example Firestore query:
     ```javascript
     let query = admin
       .firestore()
       .collection('items')
       .where('status', '==', 'Available');
     if (category) query = query.where('category', '==', category);
     const snapshot = await query.get();
     ```
3. **Manage Reservations**:
   - Create with `POST /api/stores/reservations` or `PUT /api/stores/reserve/:itemId`.
   - Example:
     ```javascript
     await admin.firestore().collection('Reservations').doc(reservationId).set({
       reservationId,
       itemId,
       storeId,
       userId,
       status: 'Pending',
       reservedAt: admin.firestore.FieldValue.serverTimestamp(),
     });
     ```

#### Maintaining the Database

1. **Indexes**:
   - Create composite indexes for queries like `items.where('storeId', '==', storeId)` or `chats.where('participants', 'array-contains', userId)`.
   - Monitor Firestore console for index errors and create indexes as needed.
2. **Backups**:
   - Use Firebase’s export feature (`gcloud firestore export`) to back up data weekly.
3. **Cost Optimization**:
   - Minimize reads/writes by caching frequent queries (e.g., store listings).
   - Avoid unnecessary client-side filtering (e.g., optimize `searchItems`).
4. **Cleaning Up**:
   - Implement a TTL policy for `externalImages` to remove old photos (e.g., older than 90 days).
   - Example cleanup script:
     ```javascript
     const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
     const oldImages = await admin
       .firestore()
       .collection('externalImages')
       .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
       .get();
     oldImages.docs.forEach((doc) => doc.ref.delete());
     ```

### For Campus Quest Team

1. **Accessing Stores**:
   - Use `GET /external/stores` to retrieve store data for quest locations.
   - Example response:
     ```json
     [
       {
         "storeId": "c2e14220-5ebc-4211-9995-b056ad6e852f",
         "storeName": "Skull Dugree",
         "location": { "lat": -26.19289, "lng": 28.0304321 },
         "theme": "theme-y2k"
       }
     ]
     ```
2. **Photo Journal**:
   - Upload photos via `POST /external/upload` with API key in `X-API-Key` header.
   - Retrieve photos via `GET /external/photos`.
   - Example upload (curl):
     ```bash
     curl -X POST -H "X-API-Key: <your-api-key>" -F "image=@/path/to/photo.jpg" https://muscle-mommies-server.onrender.com/external/upload
     ```

## Notes

- **Security**: Ensure Firestore Security Rules are updated to match backend logic. Regularly audit rules to prevent unauthorized access.
- **Performance**: Optimize queries to reduce Firestore costs (e.g., batch operations in `markAsRead`).
- **Campus Quest Collaboration**: Share this documentation and the API key securely with the Campus Quest team. Discuss additional needs (e.g., filtering stores by `location` or linking `externalImages` to quests).
- **Maintenance**: Monitor Cloudinary storage for `muscle-mommies` folder to avoid exceeding limits. Regularly review Firestore usage in the Firebase console.
