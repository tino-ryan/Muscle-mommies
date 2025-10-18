# ThriftFinder API Documentation

## Overview

**Base URL**: `https://muscle-mommies-server.onrender.com`

The **ThriftFinder** API powers a local thrifting platform connecting shops and shoppers. It is built with **Express**, **Firebase Auth/Firestore** for authentication and data storage, and **Cloudinary** for image handling. The API is deployed on Render.com, with server code located in the `/server` directory, executed via `npm start`.

- **Authentication**: Most endpoints require a Firebase JSON Web Token (JWT) in the `Authorization` header (`Bearer <token>`). Public endpoints are marked as _No auth required_.
- **CORS**: Restricted to allowed origins (defined in `process.env.ALLOWED_ORIGINS` or defaults to `http://localhost:3001`, `https://muscle-mommies.web.app`). `/external` routes allow all origins (`*`).
- **File Uploads**: Handled via `multer` with memory storage and a 5MB file size limit.
- **Data Models**: Stored in Firestore, e.g., `Item` (`itemId`, `name`, `category`, `images[]`), `User` (`uid`, `role`, `email`), `Store` (`storeId`, `storeName`, `location`).
- **Error Handling**: Returns JSON `{ error: "message" }` with appropriate HTTP status codes (e.g., 401, 403, 500).
- **External APIs**:
  - **Campus Quest Location API**: Locate thrift shops or popup markets near campuses, unlock deals via quests.
  - **Event Planning GuestList API**: Manage RSVPs for thrift events, sync with user profiles.
  - **Virtual Pen Pals Message API**: Facilitate delayed messaging for thrift tips or item swaps.

---

## Project Structure

The ThriftFinder API follows a modular architecture using the **Model-View-Controller (MVC)** pattern, with additional middleware and configuration layers. Below is the file structure and an explanation of the approach.

### File Structure

```plain
/server
├── _mocks_/                    # Mock data for testing
├── _tests_/                    # Unit and integration tests
├── controllers/               # Business logic for handling requests
│   ├── authController.js      # Authentication logic (signup, Google OAuth)
│   ├── externalController.js  # External API integrations
│   ├── itemController.js      # Item-related operations (create, search, get)
│   ├── outfitController.js    # Outfit management (save, retrieve)
│   └── storeController.js     # Store, reservation, chat, and review operations
├── middleware/                # Request processing middleware
│   └── authMiddleware.js      # Firebase JWT verification
├── models/                    # Data model definitions
│   ├── User.js               # User schema
│   ├── itemModel.js          # Item schema
│   └── store.js              # Store, Chat, Message schemas
├── routes/                    # API route definitions
│   ├── authRoutes.js         # Authentication routes
│   ├── externalRoutes.js     # External API routes
│   └── storeRoutes.js        # Store, item, reservation, chat, review routes
├── config/                    # Configuration files
│   └── firebase.js           # Firebase initialization
├── utils.js                   # Utility functions
└── index.js                   # Entry point, server setup
```

### Structure Breakdown

- **Models**: Define Firestore schema and validation logic (e.g., `Item`, `Store`, `User`). Located in `/models`. Each model encapsulates data structure and provides a blueprint for Firestore documents.
- **Routes**: Define API endpoints and map them to controller functions. Located in `/routes`. Routes are grouped by functionality (e.g., `authRoutes.js` for authentication, `storeRoutes.js` for store-related operations).
- **Controllers**: Contain business logic for handling requests, interacting with Firestore, and managing Cloudinary uploads. Located in `/controllers`. Each controller handles specific resources (e.g., `itemController.js` for items).
- **Middleware**: Handles cross-cutting concerns like authentication (`authMiddleware.js`) and admin verification. Located in `/middleware`.
- **Config**: Manages external service configurations, such as Firebase (`firebase.js`). Located in `/config`.
- **Utils**: Shared utility functions for reusable logic across controllers.
- **Entry Point (`index.js`)**: Initializes Express, sets up CORS, applies middleware, and mounts routes.

### Pros of the Approach

1. **Modularity and Organization**:
   - Separating concerns into models, routes, and controllers makes the codebase modular and easier to navigate.
   - Each file has a single responsibility (e.g., `itemController.js` handles item-related logic), improving readability and maintainability.
2. **Ease of Debugging**:
   - The clear separation of routes and controllers simplifies tracing request flows. For example, errors in `itemController.js` are isolated to item-related logic.
   - Logging in controllers (e.g., `console.log` in `getItemsByStore`) aids in pinpointing issues during development.
3. **Scalability**:
   - New features can be added by creating new routes and controllers without modifying existing ones.
   - The model layer allows consistent data validation across endpoints.
4. **Reusability**:
   - Shared logic (e.g., `uploadToCloudinary` in `itemController.js` and `storeController.js`) reduces code duplication.
   - Middleware like `authMiddleware.js` is reusable across routes.
5. **Testing**:
   - The `_mocks_` and `_tests_` directories support unit and integration testing, making it easier to validate functionality and catch bugs early.

### Cons of the Approach

1. **Large Controller Files**:
   - The `storeController.js` file is lengthy, handling multiple resources (stores, reservations, chats, reviews). This increases complexity and makes maintenance harder, as developers must navigate a single large file for unrelated operations.
   - For example, `storeController.js` includes 20+ functions, from `getStore` to `createReview`, which could be split into separate controllers (e.g., `reservationController.js`, `chatController.js`).
2. **Firestore Query Limitations**:
   - Firestore’s query constraints (e.g., limited compound queries in `searchItems`) require client-side filtering for some operations, increasing complexity and potential performance issues.
   - Example: `searchItems` in `itemController.js` applies `searchTerm` filtering client-side due to Firestore’s lack of full-text search.
3. **Dependency on External Services**:
   - Reliance on Firebase and Cloudinary introduces external dependencies, which can lead to issues if services are down or APIs change.
   - Example: Cloudinary configuration errors could break image uploads in `createItem` or `createOrUpdateStore`.
4. **Deployment Challenges with Render**:
   - Render’s free tier introduces sleeping times, causing delays for the first request after inactivity, which impacts user experience.
   - Previous experience with Railway showed similar issues when the free tier expired, forcing a switch back to Render. While Render is easy to set up and familiar from past projects, free hosting services generally have drawbacks like limited resources or downtime.
   - Paid hosting options would resolve sleeping times but increase costs, a challenge for projects with limited budgets.

### Deployment Context

- **Initial Choice**: The team started with Railway for hosting but switched to Render when Railway’s free tier expired.
- **Render Experience**: Render was chosen due to prior experience from a previous project, making setup straightforward. However, the free tier’s sleeping times remain a drawback, causing latency for initial requests.
- **Hosting Trade-offs**: Free hosting services (e.g., Render, Railway) are cost-effective but introduce limitations like sleeping times or resource constraints. Paid services would improve performance but require budget allocation.

---

## Authentication

Authentication is handled via Firebase Auth. Protected routes use `authMiddleware` to validate the Firebase JWT and attach `req.user` (containing `uid`) to requests. Admin-only routes use `verifyAdmin` middleware, checking if the user’s Firestore document (`users/{uid}`) has `role: 'admin'`.

### Auth Endpoints

- **POST `/api/auth/signup`**  
  Creates a new user account.  
  **Body**: `{ email: string, password: string, name?: string }`  
  **Response**: `200 { uid: string, email: string, name?: string }`  
  **Errors**: `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _No auth required._

- **POST `/api/auth/signup/google`**  
  Signs up a user via Google OAuth.  
  **Body**: `{ idToken: string }` (Firebase Google ID token)  
  **Response**: `200 { uid: string, email: string, name?: string }`  
  **Errors**: `401 { error: "Invalid token" }`, `500 { error: "Server error" }`  
  _No auth required._

- **POST `/api/auth/getRole`**  
  Retrieves the user’s role (`shop_owner`, `shopper`, or `admin`).  
  **Body**: `{ uid?: string }` (or inferred from token)  
  **Response**: `200 { role: string }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `500 { error: "Server error" }`  
  _Auth may be required based on controller implementation._

- **GET `/api/auth/user`**  
  Alias for `/getRole`. Fetches user info/role.  
  **Response**: `200 { role: string, uid: string, ... }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `500 { error: "Server error" }`  
  _Auth may be required based on controller implementation._

---

## API Endpoints

### Users

- **GET `/api/users`**  
  Fetches all user profiles (admin only).  
  **Response**: `200 [ { id: string, email: string, role: string, ... } ]`  
  **Errors**: `403 { error: "Forbidden: Admin access required" }`, `500 { error: "Server error" }`  
  _Auth required (admin only)._

- **GET `/api/stores/users/:userId`**  
  Fetches a specific user’s profile.  
  **Params**: `:userId` (Firestore user ID)  
  **Response**: `200 { uid: string, email: string, displayName: string, role: string }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "User not found" }`, `500 { error: "Server error" }`  
  _Auth required._

### Stores

- **GET `/api/my-store`**  
  Retrieves the store owned by the authenticated user.  
  **Response**: `200 { storeId: string, storeName: string, description: string, location: { lat: number, lng: number }, theme: string, hours: object, ... }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Store not found" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

- **GET `/api/stores`**  
  Fetches all stores.  
  **Response**: `200 [ { storeId: string, storeName: string, description: string, location: { lat: number, lng: number }, theme: string, hours: object, ... } ]`  
  **Errors**: `500 { error: "Server error" }`  
  _No auth required._

- **GET `/api/stores/:storeId`**  
  Retrieves a specific store by ID, including contact info.  
  **Params**: `:storeId` (Firestore store ID)  
  **Response**: `200 { storeId: string, storeName: string, description: string, location: { lat: number, lng: number }, theme: string, hours: object, contactInfos: object[], ... }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Store not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **POST `/api/stores`**  
  Creates or updates a store.  
  **Body**: `{ storeName: string, description: string, address: string, location: { lat: number, lng: number }, theme?: string, hours?: object }`  
  **Files**: `profileImage` (single file, max 5MB)  
  **Response**: `200 { storeId: string, storeName: string, ... }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

- **POST `/api/stores/upload-image`**  
  Uploads a profile image for a store.  
  **Files**: `profileImage` (single file, max 5MB)  
  **Response**: `200 { imageURL: string }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "No file uploaded" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

- **GET `/api/stores/contact-infos`**  
  Retrieves contact information for the authenticated user’s store.  
  **Response**: `200 [ { id: string, type: string, value: string } ]`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Store not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **POST `/api/stores/contact-infos`**  
  Adds contact information to a store.  
  **Body**: `{ type: string, value: string }`  
  **Response**: `200 { id: string, type: string, value: string }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required._

- **DELETE `/api/stores/contact-infos/:contactId`**  
  Deletes contact information by ID.  
  **Params**: `:contactId` (Firestore contact ID)  
  **Response**: `200 { message: "Contact info deleted successfully" }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Store not found" }`, `404 { error: "Contact not found" }`, `500 { error: "Server error" }`  
  _Auth required._

### Items

- **GET `/api/items`**  
  Fetches all available items.  
  **Response**: `200 [ { itemId: string, name: string, category: string, department: string, style: string, size: string, price: number, quantity: number, status: string, images: object[], ... } ]`  
  **Errors**: `500 { error: "Server error" }`  
  _No auth required._

- **GET `/api/items/:id`**  
  Retrieves an item by ID.  
  **Params**: `:id` (Firestore item ID)  
  **Response**: `200 { itemId: string, name: string, category: string, ..., images: object[] }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Item not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **GET `/api/stores/:storeId/items`**  
  Fetches items for a specific store.  
  **Params**: `:storeId` (Firestore store ID)  
  **Response**: `200 [ { itemId: string, name: string, ..., images: object[] } ]`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Store not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **GET `/api/items/search`**  
  Searches and filters items.  
  **Query Params**:
  - `searchTerm: string` (e.g., item name)
  - `category: string`
  - `style: string`
  - `department: string`
  - `minPrice: number`
  - `maxPrice: number`
  - `status: string` (e.g., `Available`)  
    **Response**: `200 [ { itemId: string, name: string, ..., images: object[] } ]`  
    **Errors**: `400 { error: "Invalid query parameters" }`, `500 { error: "Server error" }`  
    _No auth required._

- **POST `/api/stores/items`**  
  Creates a new item.  
  **Body**: `{ name: string, description: string, category: string, department: string, style: string, size: string, price: number, quantity: number, status: string }`  
  **Files**: `images[]` (up to 5 files, max 5MB each)  
  **Response**: `201 { itemId: string, name: string, ..., images: object[] }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

- **PUT `/api/stores/items/:itemId`**  
  Updates an item and its images.  
  **Params**: `:itemId` (Firestore item ID)  
  **Body**: `{ name?: string, description?: string, category?: string, department?: string, style?: string, size?: string, price?: number, quantity?: number, status?: string }`  
  **Files**: `images[]` (up to 5 files, max 5MB each)  
  **Response**: `200 { itemId: string, name: string, ..., images: object[] }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Item not found" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

- **PUT `/api/stores/items/:itemId/images`**  
  Updates an item’s images only.  
  **Params**: `:itemId` (Firestore item ID)  
  **Files**: `images[]` (up to 5 files, max 5MB each)  
  **Response**: `200 { itemId: string, images: object[] }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Item not found" }`, `400 { error: "No files uploaded" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

### Reservations

- **GET `/api/stores/reservations`**  
  Fetches reservations for the authenticated user or store.  
  **Response**: `200 [ { reservationId: string, itemId: string, storeId: string, userId: string, status: string, reservedAt: timestamp, ... } ]`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "User not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **POST `/api/stores/reservations`**  
  Creates a new reservation.  
  **Body**: `{ reservationId: string, itemId: string, storeId: string, status: string, reservedAt: string }`  
  **Response**: `200 { reservationId: string, itemId: string, storeId: string, status: string, ... }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `404 { error: "Item or store not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **PUT `/api/stores/reservations/:reservationId`**  
  Updates a reservation’s status (Pending, Confirmed, Cancelled, Sold).  
  **Params**: `:reservationId` (Firestore reservation ID)  
  **Body**: `{ status: string }`  
  **Response**: `200 { reservationId: string, status: string, message: "Status updated successfully" }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `403 { error: "Unauthorized to update this reservation" }`, `404 { error: "Reservation or item not found" }`, `400 { error: "Invalid status" }`, `500 { error: "Server error" }`  
  _Auth required (store owner only)._

- **PUT `/api/stores/reservations/:reservationId/confirm`**  
  Confirms a reservation (marks as Completed).  
  **Params**: `:reservationId` (Firestore reservation ID)  
  **Response**: `200 { message: "Reservation confirmed successfully" }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `403 { error: "Unauthorized to confirm this reservation" }`, `404 { error: "Reservation not found" }`, `400 { error: "Can only confirm sold items" }`, `500 { error: "Server error" }`  
  _Auth required._

- **PUT `/api/stores/reserve/:itemId`**  
  Directly reserves an item for the authenticated user.  
  **Params**: `:itemId` (Firestore item ID)  
  **Body**: `{ storeId: string }`  
  **Response**: `200 { reservationId: string, messageId: string }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Item not found" }`, `400 { error: "Item not available" }`, `500 { error: "Server error" }`  
  _Auth required._

### Chats / Messages

- **GET `/api/stores/chats`**  
  Retrieves chats for the authenticated user.  
  **Response**: `200 [ { chatId: string, participants: string[], lastMessage: string, lastTimestamp: timestamp, itemId?: string, storeId?: string, otherName: string, otherId: string } ]`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `500 { error: "Server error" }`  
  _Auth required._

- **GET `/api/stores/chats/:chatId/messages`**  
  Fetches messages for a specific chat.  
  **Params**: `:chatId` (Firestore chat ID)  
  **Response**: `200 [ { messageId: string, chatId: string, senderId: string, receiverId: string, message: string, timestamp: timestamp, read: boolean } ]`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Chat not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **POST `/api/stores/messages`**  
  Sends a message in a chat.  
  **Body**: `{ chatId: string, message: string, receiverId?: string, itemId?: string, storeId?: string }`  
  **Response**: `200 { messageId: string, chatId: string, senderId: string, receiverId: string, message: string, timestamp: timestamp, read: boolean }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required._

- **PUT `/api/stores/chats/:chatId/read`**  
  Marks a chat’s messages as read for the authenticated user.  
  **Params**: `:chatId` (Firestore chat ID)  
  **Response**: `200 { message: "Messages marked as read" }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `404 { error: "Chat not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **POST `/api/stores/chats`**  
  Creates a new chat.  
  **Body**: `{ receiverId: string, itemId?: string, message: string, storeId?: string }`  
  **Response**: `200 { chatId: string, messageId: string }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required._

### Reviews

- **POST `/api/stores/reviews`**  
  Submits a review for a store.  
  **Body**: `{ storeId: string, rating: number, review?: string, reservationId?: string, itemId?: string }`  
  **Response**: `200 { message: "Review created successfully", review: { reviewId: string, storeId: string, rating: number, ... } }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `404 { error: "Store not found" }`, `500 { error: "Server error" }`  
  _Auth required._

- **GET `/api/stores/:storeId/reviews`**  
  Fetches reviews for a specific store.  
  **Params**: `:storeId` (Firestore store ID)  
  **Response**: `200 [ { reviewId: string, storeId: string, userId: string, userName: string, rating: number, review: string, itemName: string, createdAt: timestamp } ]`  
  **Errors**: `400 { error: "Store ID is required" }`, `500 { error: "Server error" }`  
  _No auth required._

### Outfits

- **POST `/api/outfits`**  
  Saves an outfit for the authenticated user.  
  **Body**: `{ items: string[], name?: string }` (array of item IDs)  
  **Response**: `200 { outfitId: string, items: string[], name?: string, ... }`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `400 { error: "Invalid input" }`, `500 { error: "Server error" }`  
  _Auth required._

- **GET `/api/outfits`**  
  Retrieves all outfits for the authenticated user.  
  **Response**: `200 [ { outfitId: string, items: string[], name?: string, ... } ]`  
  **Errors**: `401 { error: "Unauthorized: Invalid token" }`, `500 { error: "Server error" }`  
  _Auth required._

### Root Endpoint

- **GET `/`**  
  Confirms the server is running.  
  **Response**: `200 "Backend is live!"` (text)  
  **Errors**: None  
  _No auth required._

---

## User Guide

This section provides step-by-step instructions for interacting with the ThriftFinder API, tailored for developers integrating with the platform.

### Getting Started

1. **Set Up Firebase Authentication**:
   - Obtain a Firebase JWT by signing up or signing in via Firebase Auth (client-side SDK or REST API).
   - Use the `/api/auth/signup` or `/api/auth/signup/google` endpoints to create a user account.
   - Store the JWT (`idToken`) returned from Firebase for use in subsequent requests.

2. **Making Authenticated Requests**:
   - Include the JWT in the `Authorization` header as `Bearer <token>` for all protected endpoints.
   - Example (using `curl`):
     ```bash
     curl -H "Authorization: Bearer <your-jwt-token>" https://muscle-mommies-server.onrender.com/api/my-store
     ```

3. **Handling File Uploads**:
   - For endpoints like `/api/stores` or `/api/stores/items`, use `multipart/form-data` to upload images.
   - Example (using `curl` for `/api/stores/upload-image`):
     ```bash
     curl -X POST -H "Authorization: Bearer <your-jwt-token>" -F "profileImage=@/path/to/image.jpg" https://muscle-mommies-server.onrender.com/api/stores/upload-image
     ```
   - Ensure files are under 5MB and in image format (e.g., JPEG, PNG).

4. **Testing Public Endpoints**:
   - Public endpoints like `/api/stores` or `/api/items` do not require authentication.
   - Example:
     ```bash
     curl https://muscle-mommies-server.onrender.com/api/stores
     ```

### Common Workflows

#### For Shoppers

1. **Browse Stores and Items**:
   - Use `GET /api/stores` to list all thrift stores.
   - Use `GET /api/items` or `GET /api/items/search?searchTerm=shirt&category=Clothing` to find items.
2. **Reserve an Item**:
   - Authenticate and use `PUT /api/stores/reserve/:itemId` with `{ storeId }` in the body to reserve an item.
   - This creates a reservation and initiates a chat with the store owner.
3. **Communicate with Store Owners**:
   - Use `POST /api/stores/chats` to start a chat, then `POST /api/stores/messages` to send messages.
   - Check messages with `GET /api/stores/chats/:chatId/messages`.
4. **Leave a Review**:
   - After a purchase, use `POST /api/stores/reviews` to submit a review for the store.
   - Example body: `{ storeId: "abc123", rating: 5, review: "Great experience!" }`

#### For Store Owners

1. **Set Up a Store**:
   - Authenticate and use `POST /api/stores` to create or update your store profile.
   - Include `storeName`, `address`, `location`, and optionally `profileImage`.
2. **Add Items**:
   - Use `POST /api/stores/items` to add items, including up to 5 images.
   - Example body: `{ name: "Vintage Shirt", price: 20, quantity: 1, category: "Clothing" }`
3. **Manage Reservations**:
   - View reservations with `GET /api/stores/reservations`.
   - Update status (e.g., to Sold) with `PUT /api/stores/reservations/:reservationId`.
4. **View Reviews**:
   - Use `GET /api/stores/:storeId/reviews` to see customer feedback.

### Error Handling

- **401 Unauthorized**: Ensure the `Authorization` header includes a valid Firebase JWT.
- **403 Forbidden**: Check if the user has the required role (e.g., `admin` for `/api/users`, `storeOwner` for item updates).
- **404 Not Found**: Verify that the requested resource (e.g., `storeId`, `itemId`) exists.
- **400 Bad Request**: Check the request body or query parameters for required fields or correct formats.
- **500 Server Error**: Retry the request or contact the API administrator if the issue persists.

### Deployment Considerations

- **Render Sleeping Times**: The API may experience delays on the first request after inactivity due to Render’s free tier. For critical applications, consider upgrading to a paid plan.
- **Testing Locally**: Set up a local environment with `npm start` and configure `process.env.ALLOWED_ORIGINS` to include `http://localhost:3001`.
