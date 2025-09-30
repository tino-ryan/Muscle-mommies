# INTRO

## Project Brief

**ThriftFinder** is a full-stack web application that helps users discover, explore, and shop at nearby **thrift stores**. It empowers thrift store owners to manage their listings and communicate with potential customers through an integrated reservation and messaging system.

The platform promotes sustainable fashion by connecting communities with local second-hand stores — offering an engaging and gamified shopping experience.

---

## Key Features

### For Shoppers (Users)

- **Browse Thrift Stores** on a map based on location
- **View Store Profiles** with descriptions, contact info, and listed items
- **Shop Thrifted Items** by viewing pictures, sizes, prices, and descriptions
- **Reserve or Enquire** about items, which:
  - Triggers a reservation
  - Automatically opens a **chat** with the store owner
- **Chat Messaging System** with read receipts and reservation status updates
- **Closet Page** where users can see items they’ve reserved and collected
- **Earn Badges** by visiting stores and completing tasks (via Campus Quest API)

### For Store Owners

- **Create and Manage Store Profiles**
- **List Items** with sizes, images, prices, styles, and categories
- **Receive Reservations or Enquiries** in real time
- **Chat with Customers**
- **Mark Reservations as Sold or Cancelled**
- **Manage Business Contacts** and add social links
- **Review Analytics** _(WIP)_

### External API Integration

- Campus Quest API provides **badge data** for the `Badges` page.
- Stores are exposed as quest locations via `GET /external/stores`.
- Users can upload photos to external journals (`externalImages`).

---

## How to Use ThriftFinder

### As a New User

1. **Sign Up** using your email and set your role (customer or store owner)
2. If you’re a **customer**:
   - Navigate to the **Map**
   - Explore thrift stores in your area
   - Browse items, reserve or enquire
   - Track your items in **Closet**
   - Chat with store owners
3. If you’re a **store owner**:
   - Create a **store profile**
   - Upload your listings with Cloudinary-integrated image upload
   - Manage reservations and chat with customers
   - Update items and reservation status

### Badges & Rewards

- View your earned badges on the **Badges** page
- Rewards are powered by the **Campus Quest API**
- You earn badges by visiting stores and completing challenges

---

## Tech Stack

- **Frontend**: React + Tailwind + React Router
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Cloudinary for image hosting
- **Auth**: Firebase Authentication
- **Maps**: Leaflet via `react-leaflet`
- **External API**: Campus Quest badge system

---

## Access

- Authentication required for all features except public map viewing
- Store Owners must verify via email before listing items
- Backend uses Firebase Admin SDK for secure data access

---

## Future Features

- Add full **store analytics** dashboard
- Expand **badges system** to track purchase-based achievements
- Add **user reviews** and ratings for items and stores
- Enable **filtering by category/price/size/style**
- Deploy mobile-friendly version (React Native/PWA)

---

> ThriftFinder makes second-hand shopping easy, interactive, and fun — while supporting sustainable fashion and local businesses.
