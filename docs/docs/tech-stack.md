# Tech Stack: Powering ThriftFinder's Vibe

ThriftFinder (The Box) is built with a modern, streamlined tech stack to deliver a seamless, mobile-friendly thrifting experience. Crafted by the **Muscle Mommies** team, our choices balance learning, performance, and ease of use. Here's the tech that brings our thrift adventure to life!

---

## Frontend: React + CSS + React Router

- **Why We Chose It**: As JavaScript framework newbies, we picked React for its popularity, simplicity, and ability to create fast, dynamic, and responsive web pages. Custom CSS gives us full control over our vibrant, unique styling, and React Router ensures smooth navigation.
- **What It Does**: Powers our mobile-friendly UI for browsing stores, reserving items, and earning badges.
- **Resources**: [React Documentation](https://react.dev/learn), [CSS Guide](https://developer.mozilla.org/en-US/docs/Web/CSS), [React Router Docs](https://reactrouter.com/en/main)

## Backend: Node.js + Express

- **Why We Chose It**: Our team’s prior experience with Node.js and Express made them a go-to choice. Express simplifies API setup, letting us focus on connecting shoppers and store owners.
- **What It Does**: Drives our backend API for handling reservations, chats, and store management.
- **Resources**: [Node.js Documentation](https://nodejs.org/en/docs/), [Express.js Guide](https://expressjs.com/en/starter/installing.html)

## Authentication: Firebase Authentication

- **Why We Chose It**: We needed a secure, easy-to-implement solution for user logins and role-based access (shoppers vs. store owners) without managing passwords. Firebase Auth integrates seamlessly with our stack.
- **What It Does**: Supports email and Google sign-ins for secure access to ThriftFinder’s features.
- **Resources**: [Firebase Authentication Docs](https://firebase.google.com/docs/auth)

## Database: Firebase Firestore

- **Why We Chose It**: Firestore’s ease of setup and seamless integration with Firebase Authentication made it a perfect fit. Its real-time updates keep our app lively without the hassle of managing a database server.
- **What It Does**: Stores user profiles, store data, item listings, messages, reservations, and analytics.
- **Resources**: [Cloud Firestore Documentation](https://firebase.google.com/docs/firestore)

## Storage: Cloudinary

- **Why We Chose It**: Cloudinary makes image uploads and management a breeze, perfect for showcasing thrift items in style.
- **What It Does**: Hosts high-quality images for store listings and profiles.
- **Resources**: [Cloudinary Documentation](https://cloudinary.com/documentation)

## Maps: Leaflet via react-leaflet

- **Why We Chose It**: Leaflet is lightweight and flexible, ideal for our interactive map to discover local thrift stores.
- **What It Does**: Displays store locations for easy browsing.
- **Resources**: [Leaflet Documentation](https://leafletjs.com/reference.html), [react-leaflet Docs](https://react-leaflet.js.org/docs/start-introduction/)

## External API: Campus Quest

- **Why We Chose It**: The Campus Quest API adds a fun, gamified layer by powering our badge system and integrating stores as quest locations.
- **What It Does**: Enables badge earning and photo journal uploads (`externalImages`).
- **Resources**: [Campus Quest API Docs](https://example.com/campus-quest-api) _(Update with actual link if available)_

## Testing: Jest

- **Why We Chose It**: Jest’s simplicity and JavaScript compatibility make it ideal for ensuring our code works as expected.
- **What It Does**: Runs unit and integration tests for reliable functionality.
- **Resources**: [Jest Documentation](https://jestjs.io/docs/getting-started)

## Development Tools

- **VS Code**: Our go-to editor for coding, debugging, and collaboration.
  - **Why**: It’s versatile, supports extensions like ESLint and Prettier, and keeps our workflow smooth.
  - **Resources**: [VS Code Documentation](https://code.visualstudio.com/docs)
- **GitHub**: Used for version control to manage our codebase and collaborate as a team.
  - **Why**: GitHub’s robust features make tracking changes and reviewing code a breeze.
  - **Resources**: [GitHub Docs](https://docs.github.com/en)
- **ESLint & Prettier**: Enforce consistent code style and catch errors early.
  - **Why**: Keeps our code clean, readable, and bug-free.
  - **Resources**: [ESLint Documentation](https://eslint.org/docs/latest/), [Prettier Documentation](https://prettier.io/docs/en/)

## Deployment

- **Frontend Hosting: Firebase Hosting**
  - **Why**: Quick setup and seamless integration with Firebase services make it ideal for our React app.
  - **What It Does**: Serves our mobile-friendly frontend to users.
  - **Resources**: [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- **Backend Hosting: Render**
  - **Why**: Render offers simple, scalable deployment for our Node.js backend.
  - **What It Does**: Hosts our Express API for reliable performance.
  - **Resources**: [Render Documentation](https://render.com/docs)
- **Documentation: Docusaurus on GitHub Pages**
  - **Why**: Docusaurus is perfect for creating clean, user-friendly documentation, and GitHub Pages makes hosting it effortless.
  - **What It Does**: Powers our project docs for easy access.
  - **Resources**: [Docusaurus Documentation](https://docusaurus.io/docs), [GitHub Pages Docs](https://docs.github.com/en/pages)

_Styling Tip_: Use CSS classes inspired by our vibrant aesthetic, like `.bg-purple-vibe { background: linear-gradient(to right, #d8b4fe, #f9a8d4); }`, `.text-thrift-pop { color: #7c3aed; }`, and `.shadow-glow { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }` for a bold, modern look when rendering this doc.

---

> ThriftFinder’s tech stack is the backbone of our sustainable, style-driven mission. Built with love by the Muscle Mommies & Moses, it’s ready to spark your thrifting adventure!
