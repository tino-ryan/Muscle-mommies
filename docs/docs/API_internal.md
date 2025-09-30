# ThriftFinder API Documentation

## Overview

**Base URL**: `https://muscle-mommies-server.onrender.com`

This API powers **ThriftFinder**, a local thrifting app for connecting shops and shoppers.  
It’s built with **Express**, **Firebase Auth/Firestore**, and **Cloudinary** for image handling.

- **Auth**: Most endpoints require a Firebase JWT in the `Authorization` header (`Bearer <token>`).  
  Endpoints marked _"No auth"_ are publicly accessible.
- **Models**: Data models follow Firestore schema (e.g., `Item` has fields like `itemId`, `name`, `category`, `images` array).
- **File Uploads**: Uses `multer` (memory storage, 5MB limit).
- **Errors**: Typically returned as `{ error: "message" }` with appropriate 4xx or 5xx status codes.
- **Deployment**: Hosted on Render.com. Server code is in `/server`. Start with `npm start`.

---

## External API Use Cases

- **Campus Quest Location API**: Show thrift shops or popup markets near a campus. Unlock deals by completing campus quests or visiting landmarks.
- **Event Planning GuestList API**: RSVP/register for thrift-related events, sync with user profiles.
- **Virtual Pen Pals Message API**: Connect users across regions to exchange thrift tips or swap items via delayed pen pal-style messaging.

---

## Authentication

Handled via Firebase. Protected routes use `authMiddleware`, which validates `req.user.uid`.

### Auth Endpoints

- **POST `/signup`**  
  Creates a user account.  
  **Body**: `{ email, password, name? }`  
  **Response**: `{ uid, ... }`  
  _No auth required._

- **POST `/signup/google`**  
  Google OAuth signup.  
  **Body**: `{ idToken }` (Firebase token)  
  **Response**: `{ uid, ... }`  
  _No auth required._

- **POST `/getRole`**  
  Fetches user role (`shop_owner` or `shopper`).  
  **Body**: `{ uid? }` or token  
  **Response**: `{ role }`  
  _May not require auth._

- **GET `/auth/user`**  
  Fetches user info/role.  
  **Response**: `{ role, ... }`  
  _Alias for `/getRole`. Possibly public._

---

## Users

- **GET `/stores/users/:userId`**  
  Fetch user profile info.  
  **Params**: `:userId`  
  **Response**: `{ userId, name, email, role, location, ... }`  
  _Auth required._

---

## Stores

- **GET `/my-store`**  
  Get store info for current owner.  
  **Response**: `{ storeId, storeName, description, location, ... }`  
  _Auth required._

- **GET `/stores`**  
  Fetch all stores.  
  **Response**: `[ { storeId, storeName, ... } ]`  
  _No auth._

- **GET `/stores/:storeId`**  
  Get store by ID.  
  **Params**: `:storeId`  
  **Response**: `{ storeId, storeName, description, ... }`  
  _Auth required._

- **POST `/stores`**  
  Create or update a store.  
  **Body**: `{ storeName, description, address, location: { lat, lng }, contactInfo, ... }`  
  **Files**: `profileImage` (single file)  
  **Response**: `{ storeId, ... }`  
  _Auth required (owner only)._

- **POST `/stores/upload-image`**  
  Upload store image.  
  **Files**: `profileImage`  
  **Response**: `{ imageURL }`  
  _Auth required._

- **GET `/stores/contact-infos`**  
  Get contact info for store.  
  **Response**: `[ { contactId, info, ... } ]`  
  _Auth required._

- **POST `/stores/contact-infos`**  
  Add contact info.  
  **Body**: `{ info }`  
  **Response**: `{ contactId, ... }`  
  _Auth required._

- **DELETE `/stores/contact-infos/:contactId`**  
  Remove contact info.  
  **Params**: `:contactId`  
  **Response**: `{ success: true }`  
  _Auth required._

---

## Items

- **GET `/items`**  
  Get all items.  
  **Response**: `[ { itemId, name, category, ..., images: [...] } ]`  
  _No auth._

- **GET `/items/:id`**  
  Get item by ID.  
  **Params**: `:id`  
  **Response**: `{ itemId, name, ... }`  
  _Auth required._

- **GET `/stores/:storeId/items`**  
  Get store-specific items.  
  **Params**: `:storeId`  
  **Response**: `[ { itemId, ... } ]`  
  _Auth required._

- **GET `/items/search`**  
  Search/filter items.  
  **Query params**:  
  `?searchTerm=`, `?category=`, `?style=`, `?department=`, `?minPrice=`, `?maxPrice=`, `?status=Available`  
  **Response**: `[ { itemId, ... } ]`  
  _No auth._

- **POST `/stores/items`**  
  Create an item.  
  **Body**: `{ name, description, category, department, style, size, price, quantity, status }`  
  **Files**: `images[]` (up to 5)  
  **Response**: `{ itemId, ..., images: [...] }`  
  _Auth required (owner)._

- **PUT `/stores/items/:itemId`**  
  Update item and images.  
  **Params**: `:itemId`  
  **Body**: Same as POST  
  **Files**: `images[]`  
  _Auth required._

- **PUT `/stores/items/:itemId/images`**  
  Update item images only.  
  **Params**: `:itemId`  
  **Files**: `images[]`  
  _Auth required._

---

## Reservations

- **GET `/stores/reservations`**  
  Fetch user/store reservations.  
  **Response**: `[ { reservationId, itemId, status, ... } ]`  
  _Auth required._

- **POST `/stores/reservations`**  
  Create reservation.  
  **Body**: `{ itemId, ... }`  
  **Response**: `{ reservationId, ... }`  
  _Auth required._

- **PUT `/stores/reservations/:reservationId`**  
  Update reservation.  
  **Body**: `{ status }`  
  _Auth required._

- **PUT `/stores/reservations/:reservationId/confirm`**  
  Confirm reservation.  
  _Auth required._

- **PUT `/stores/reserve/:itemId`**  
  Reserve item directly.  
  **Params**: `:itemId`  
  _Auth required._

---

## Chats / Messages

- **GET `/stores/chats`**  
  Get user chats.  
  **Response**: `[ { chatId, ... } ]`  
  _Auth required._

- **GET `/stores/chats/:chatId/messages`**  
  Get messages in chat.  
  **Params**: `:chatId`  
  **Response**: `[ { messageId, content, ... } ]`  
  _Auth required._

- **POST `/stores/messages`**  
  Send message.  
  **Body**: `{ chatId, content, receiverId?, itemId? }`  
  _Auth required._

- **PUT `/stores/chats/:chatId/read`**  
  Mark chat as read.  
  _Auth required._

- **POST `/stores/chats`**  
  Create chat.  
  **Body**: `{ receiverId, itemId? }`  
  _Auth required._

---

## Reviews

- **POST `/stores/reviews`**  
  Leave a review.  
  **Body**: `{ storeId, rating, comment, ... }`  
  _Auth required._

- **GET `/stores/:storeId/reviews`**  
  Get store reviews.  
  _No auth._

---

## Outfits

- **POST `/outfits`**  
  Save an outfit.  
  **Body**: `{ items: [itemIds], name? }`  
  **Response**: `{ outfitId, ... }`  
  _Auth required._

- **GET `/outfits`**  
  Get user’s outfits.  
  _Auth required._
