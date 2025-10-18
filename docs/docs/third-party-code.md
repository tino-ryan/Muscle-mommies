# Third-Party Libraries Used in ThriftFinder

This project integrates several third-party libraries and APIs to power features like maps, cloud storage, authentication, styling, and gamification.

---

## Leaflet

**Leaflet** is an open-source JavaScript library for interactive maps.

- **Docs**: https://leafletjs.com/reference.html

### How Leaflet is Used

### How Leaflet is Used

- **MapContainer** and **TileLayer** (from `react-leaflet`) display OpenStreetMap-based maps.
- **Markers/Popups** show store locations with rich info.
- **Custom Icons** distinguish user vs store markers.
- **FitBounds** adjusts zoom to show both user and nearby stores.

### Why Leaflet?

- No API key/billing required (unlike Google Maps).
- Lightweight and responsive.
- Fully customizable.
- Great React support via `react-leaflet`.

---

## Cloudinary

**Cloudinary** is used to handle image uploads for store profiles, items, and external photo journals.

- Images are uploaded using `cloudinary.v2.uploader.upload_stream`.
- URLs are stored in Firestore (`profileImageURL`, `images`, `externalImages`).

### Benefits

- Automatic image optimization and CDN delivery.
- Organized into folders like `muscle-mommies/` and `muscle-mommies/external`.
- Seamless integration with Firebase functions and admin dashboard.

---

## 🔥 Firebase

**Firebase** powers authentication, database, and admin SDK:

- **Firestore** stores all app data (`users`, `stores`, `items`, etc.).
- **Auth** handles secure user login/signup.
- **Admin SDK** provides full backend access for controllers.
- **Functions** like timestamps and auth verification streamline logic.

### Firebase Admin SDK

Used in `storeController.js`, `externalController.js`, and more for:

- Creating/reading/updating Firestore docs.
- Authenticating API calls (e.g., getting `req.user.uid`).

---

## Google Fonts & Icons

- Fonts are imported via Google Fonts in the `index.html` or `tailwind.config.js`.
- Icons (e.g., material icons) are pulled from Google Icons or custom React icon libraries.

### Benefits:

- Lightweight typography customization.
- Easy-to-use and scalable icon sets.

---

## Campus Quest API (Custom External Integration)

### API Purpose

We integrated with the **Campus Quest** team's custom API to power **badge and reward systems** on the `Badges` page.

### How It Works

- When users visit thrift stores or complete related tasks, they earn **badges** or **rewards**.
- This info is fetched from the Campus Quest API and displayed dynamically.
- Helps gamify the app and drive engagement.

### Authentication

- A secure API key (or token) is used to communicate with the Campus Quest backend.
- Only read access is required for badge data.

---

## Summary

| Tool             | Purpose                                 |
| ---------------- | --------------------------------------- |
| Leaflet          | Interactive maps and store geolocation  |
| Cloudinary       | Image upload, CDN, and optimization     |
| Firebase         | Auth, Firestore, Admin SDK              |
| Google Fonts     | Custom web typography                   |
| Google Icons     | Icons across the UI                     |
| Campus Quest API | Gamification through badges and rewards |

> These tools were selected for reliability, scalability, cost-efficiency, and ease of integration with React/Firebase ecosystems.
