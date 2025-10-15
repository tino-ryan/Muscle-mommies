# Development Plan

---

## 1. Project Overview

_Project Name:_ ThriftFinder  
_Description:_  
ThriftFinder is a local thrifting marketplace app that connects nearby thrift stores with shoppers looking for unique, second-hand fashion items. It allows store owners to easily upload and manage their inventory, while enabling users to browse local listings, chat with sellers, and reserve items for pickup or delivery.

_Goals:_

- Promote sustainable shopping.
- Save time for shoppers by providing searchable digital catalogs.
- Give thrift stores digital visibility and customer insights.

---

## 2. Target Audience

- _Thrift Shoppers (students, young professionals, eco-conscious consumers):_  
  Want convenience, affordable fashion, and the ability to browse/filter items.

- _Thrift Store Owners:_  
  Need simple tools to showcase inventory, interact with customers, and track performance.

---

## 3. Functional Requirements

- Dynamic Storefronts (create/edit listings, upload images, prices, sizes).
- Proximity & Inventory Filters (location, category, keyword search).
- In-App Messaging (real-time chat).
- Item Reservations & Notifications (alerts for restocks and pickups).
- Analytics Dashboard (popular items, categories, feedback).
- Event Discovery (local thrift events, pop-up markets).

---

## 4. Non-Functional Requirements

- _Performance:_ Homepage loads within 3s, catalog browsing smooth.
- _Scalability:_ Support thousands of concurrent users and listings.
- _Security:_ Firebase Auth, encrypted messages, secure DB rules.
- _Usability:_ Intuitive navigation, mobile-first design.
- _Reliability:_ 99.9% uptime, stable messaging and reservations.

---

## 5. Technical Requirements

- _Frontend:_ React (or React Native if mobile-first).
- _Backend:_ Firebase (Auth, Firestore, Storage, Functions) or Node.js + MongoDB.
- _Messaging:_ Firebase Realtime Database / Socket.io.
- _Notifications:_ Twilio / SendGrid.
- _Hosting & Deployment:_ Firebase Hosting / Vercel with CI/CD.

---

## 6. Design Requirements

- Clean, visual-first design showcasing items.
- Early 2000s cyber space color palette .
- Responsive layouts (web & mobile).
- Accessible design (WCAG-compliant).

---

## 7. Development Plan Components

### 7.1 Task Breakdown

- _Backend:_ Authentication, APIs, database schemas, notifications.
- _Frontend:_ UI modules (homepage, storefront, item detail, chat, dashboard).
- _Integrations:_ Location API, GuestList API, Twilio/SendGrid.
- _Testing:_ Unit tests (APIs), integration tests, usability tests.

---

### 7.2 Resource Allocation

- _Team:_
  - 5 × Frontend Developer
  - 5 × Backend Developer
  - 2 × UI/UX Designer
  - 3 × QA/Test Engineer
- _Tools:_ GitHub/GitLab, Firebase, Twilio/SendGrid, Figma.
- _Budget:_ Hosting, API fees, notification credits.

---

### 7.3 Testing & Quality Assurance

- _Unit Testing:_ APIs and database functions (Jest/Mocha).
- _Manual Usability Testing:_ With real thrift shoppers.
- _Continuous Integration:_ GitHub Actions for automated builds/tests.

---

### 7.4 Launch & Deployment

- _Staging Environment:_ Firebase Hosting / Vercel for testing.
- _Production Release:_ After Sprint 4, with full feature set.

---

### 7.5 Maintenance & Updates

- Monitor performance via Firebase Analytics.
- Bug tracking & fixes with GitHub Issues.
- Feature enhancements (e.g., payments, advanced filters).
- Quarterly updates with new features and events.

---

## 8. Sprint Roadmap (Detailed)

### _Sprint 1: Foundations & Documentation (Weeks 1–2)_

_Objective:_ Establish project foundations, version control, methodology, documentation, and initial setup.

_Deliverables:_

- Version control: Git repo initialized, linters/formatters configured, README created, all members contributing commits.
- Documentation site: Build and deploy site with both trivial (links/resources) and non-trivial content.
- Work planning: Set up project management tool (Notion/Trello/GitHub Projects), add all Sprint 1 tasks, hold regular scrums.
- Development guides: Firestore emulator setup, Express API guide, React setup and environment variables.
- Git methodology: Document branching and commit strategy with resources explaining methodology.
- Project methodology: Document Scrum approach, task point system, assignment strategy, and provide resources.
- Tech stack: Document chosen stack with reasons and supporting resources.
- Stakeholder interaction: Meet client, gather requirements, document outcomes.
- Initial design & plan: Wireframes/mockups for key pages, roadmap, and timeline.
- Implementation: Setup Firebase Auth with login/signup, configure environment variables.

_Success Criteria:_ Project repo, documentation site, methodologies, and initial Firebase authentication setup are completed and functional.

---

### _Sprint 2: Storefronts, Filtering & Core Features (Weeks 3–4)_

_Objective:_ Implement user-facing browsing, storefronts, and initial chat and dashboards.

_Deliverables:_

- User home with closest stores displayed, distance filtering, and live map integration.
- Search and filtering by size, category, and keywords.
- Storefronts that display store items.
- Item detail page with enlarged view, reservation button, and enquiry options (collect within a week or request delivery).
- Closet and reserved items for users.
- Chat interface between users and store owners.
- Store owner dashboards for managing reservations and items.
- Store owner analytics dashboard with initial stats.
- Admin dashboard with visibility over users, stores, and stats.
- Automated testing for implemented features.
- Stakeholder reviews (at least three tutor meetings, feedback implemented).
- API integration: Firebase Auth, Map API, and page-related APIs for DB interactions.
- User feedback collection workflow via Google Form linked to spreadsheet.
- Project management methodology evidence documented.
- Bug tracker setup and usage (GitHub Issues).
- Database documentation (schema updates).
- Third-party code documentation (Firebase, Maps API, etc., with justifications).
- Testing documentation and evidence of user feedback integration.

_Success Criteria:_ Users can browse and filter stores/items, view item details, reserve/enquire, and interact with storefront dashboards. APIs, testing, documentation, and tutor reviews are completed.

---

### _Sprint 3: Reservations, Feedback & Advanced Features (Weeks 5–6)_

_Objective:_ Complete reservation workflows, integrate user feedback, expand dashboards, and improve app polish and testing coverage.

_Deliverables:_

- User feedback collected, documented, and implemented from tutor, peers, and test users in multiple rounds.
- Testing coverage >80% across frontend and backend.
- Closet feature with themed stores (owners select themes that reflect on storefronts).
- Store pages with full details, item search/filter, detailed modals for reservations and enquiries, and store ratings/reviews.
- Reservations page for both users and owners, including status updates, confirmations, and reviews.
- UI refinements including loading screens and consistent styling templates.
- Store owner dashboard with professional charts and sales stats.
- Settings pages for user and store preferences.
- Admin pages for managing users, stores, and reports.
- API endpoints implemented and tested across all features.
- Performance improvements validated with testing.
- Evidence of feedback-driven improvements (UI reskin, new features).
- Documentation updated with mockups, diagrams, schema changes, and testing workflows.
- Agile methodology evidenced in project logs, sprint reports, and version control practices.
- Bug tracker actively used with logged issues.

_Success Criteria:_ Stores have themed storefronts, reservations and reviews are functional, dashboards and admin tools are operational, and the app shows evidence of improvement from feedback. Testing coverage exceeds 80% with updated documentation.

---

### _Sprint 4: Analytics, Events & Polishing (Weeks 7–8)_

_Objective:_ Add analytics, event discovery, rewards, and polish UI.

_Deliverables:_

- Analytics Dashboard: Most viewed items, popular categories, customer feedback.
- Rewards API: Eco-points for purchases, redeemable later.
- Event Discovery: Campus Quest + GuestList API integration.
- UI Polishing: Cart drawer, responsive design, improved feed UI.
- Database: `Analytics` collection, extended reservations with eco-points.

_Success Criteria:_ Store owners can access analytics, users can discover events, and app is demo-ready.

---

## Final Deliverable

A fully working MVP featuring:

- Thrift catalog browsing
- Real-time chat & item reservations
- Notifications & eco-points rewards
- Store analytics dashboard
- Event discovery integration
