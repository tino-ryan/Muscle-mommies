# Testing Documentation: Keeping ThriftFinder Rock-Solid

The **Muscle Mommies** team ensures **ThriftFinder (The Box)** delivers a reliable, user-friendly experience through a robust testing strategy. We test the **frontend** (React) and **backend** (Node.js, Firebase) separately, using **Jest** for automated tests and **Codecov** for coverage tracking. With **GitHub Actions** enforcing CI/CD, we maintain high code quality across the board. Here's how we make sure our thrift adventure stays on point!

---

## Overview

- **Current Coverage**: 82.09% (3172/3864 lines covered, main branch, commit `930136c`).
- **Coverage Trend**: Up from 81.48% over the last 3 months.
- **Testing Tools**: Jest, React Testing Library (frontend), Supertest (backend), Codecov.
- **CI/CD**: GitHub Actions runs tests on every push/PR to `main` and `dev`.
- **User Testing**: Structured feedback sessions with thrift shoppers and store owners.

Our testing strategy combines automated unit/integration tests with user feedback to ensure reliability, security, and a delightful UX.

---

## Test Structure

### Frontend Tests

- **Location**: `client/src/__tests__`, `client/src/components/__tests__`
- **Framework**: Jest + React Testing Library
- **Purpose**: Validate UI components, pages, and logic for rendering and interaction.

**Key Files**:

- `egTest.test.js`: 100% utility function coverage.
- `Button.test.jsx`: 100% coverage for reusable buttons.
- `admindash.test.js`: 100% coverage for admin dashboard.
- `Home.test.jsx`, `ChatWindow.test.jsx`: Tests for page rendering and interactions.

**Coverage Summary**:
| Metric | Coverage |
|------------|------------|
| Statements | 89.29% |
| Branches | 76.64% |
| Functions | 88.69% |
| Lines | 90.36% |

- **Fully Covered**: `Button.jsx`, `StoreSidebar.jsx`, `MyCloset.jsx`, `admin/Dashboard.jsx` (100%).
- **Partially Covered**: `ChatWindow.jsx`, `Login.jsx`, `UserChats.jsx` (actively expanding).
- **No Coverage**: `Analytics.jsx` (scheduled for testing).

### Backend Tests

- **Location**: `server/__tests__`
- **Framework**: Jest + Supertest
- **Purpose**: Validate API endpoints, controllers, middleware, and Firestore interactions.

**Key Files**:

- `authController.test.js`: 100% coverage, including edge cases.
- `itemModel.test.js`: 100% lines, 90% branches.
- `store.test.js`, `utils.test.js`, `storeRoutes.test.js`: 100% across all metrics.
- `storeController.test.js`: 82.78% lines, 100% functions, covering complex logic like:
  - Store CRUD operations
  - Messaging system
  - Reservation lifecycle
  - Chat, review, and contact management

**Coverage Summary**:
| Metric | Coverage |
|------------|------------|
| Statements | 83.69% |
| Branches | 72.29% |
| Functions | 91.02% |
| Lines | 83.96% |

- **Fully Covered**: All models and middleware.
- **Near Full Coverage**: `storeController.js` (largest controller, minor uncovered lines in fallback paths).
- **Mocks**: `firebase-admin`, `multer`, `uuid`, `cloudinary` for reliable testing.

**Overall Coverage**: 82.09% (3172/3864 lines, commit `930136c`).

---

## Automated Testing Procedure

We use **Jest** for unit and integration tests, focusing on:

- **API Routes**: Ensuring endpoints return correct responses and HTTP status codes for CRUD operations.
- **Authentication**: Verifying Firebase token handling and restricted route access.
- **Database**: Testing Firestore interactions via Firebase emulators to avoid production data changes.
- **UI Components**: Validating search, filters, reservation modals, and dashboards across devices.

**GitHub Actions** runs tests on every push/PR to `main` or `dev`, with **Codecov** uploading coverage reports. Coverage flags (`frontend`, `backend`, `combined`) track progress. Challenges with async tests and emulator setups were resolved using mock data and config tweaks.

**Highlights**:

- **400+ tests**, 100% pass rate (`28/28` suites).
- **Fast Feedback**: ~6s (backend), ~34s (frontend).
- **24+ Endpoints Tested** in `storeController.js` (CRUD, Cloudinary uploads, messaging, reservations, reviews).

---

## Running Tests Locally

In both `client` and `server` directories:

```bash
npm install
npm run test:coverage
```

**Output**:

- CLI and HTML coverage reports.
- `coverage/lcov.info` for Codecov integration.

---

## User Feedback Procedure

We conducted user testing with thrift shoppers, store owners, and external participants to evaluate usability and performance.

**Process**:

1. **Scenario-Based Tasks**: Users completed actions like signing up, listing items, reserving, and chatting.
2. **Observation**: Team monitored navigation and noted friction points.
3. **Feedback Collection**: Google Forms captured ratings (ease of use, performance, satisfaction) and comments.
4. **Issue Tracking**: Problems logged in Notion, prioritized for sprints.

**Results** (15+ participants, Sprints 2–3):

- **Navigation**: Dashboard confusion led to clearer labels and icons.
- **Performance**: Backend cold start delays fixed with loading indicators and caching.
- **Usability**: Closet feature praised; users requested clearer confirmation messages.
- **Responsiveness**: Layout tweaks improved mobile experience.
- **Satisfaction**: Gamified features (Campus Quest badges) were a hit.

---

## Continuous Integration

- **Workflow**: GitHub Actions runs parallel `client` and `server` jobs on Node.js 20 (`ubuntu-latest`).
- **Triggers**: Every push/PR to `main` or `dev`.
- **Coverage**: Reports uploaded to [Codecov](https://about.codecov.io/) with secure tokens.
- **Flags**: `frontend`, `backend`, `combined` for granular tracking.

---

## Future Plans

- Add **Cypress E2E tests** for workflows (e.g., Login → Chat → Purchase).
- Test **Analytics.jsx** and remaining uncovered branches.
- Achieve **100% coverage** for all controllers and page components.
- Refactor tests into **domain-specific suites** (e.g., Store, Chat, Review).

---

## Summary

The Muscle Mommies test suite is a cornerstone of ThriftFinder’s quality. With **82.09% coverage**, **400+ passing tests**, and robust CI/CD, we’re delivering a reliable, user-friendly app.

| Area        | Status                             |
| ----------- | ---------------------------------- |
| UI          | High coverage (90.36% lines)       |
| Backend     | Near full coverage (83.96% lines)  |
| CI/CD       | Fully automated via GitHub Actions |
| Coverage    | Codecov + CLI reports              |
| In Progress | Analytics.jsx, Cypress, edge cases |

_Styling Tip_: Use CSS classes like `.bg-thrift-vibe { background: linear-gradient(to right, #d8b4fe, #f9a8d4); }`, `.text-pop { color: #7c3aed; }`, and `.shadow-glow { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }` for a vibrant look when rendering.

> _Testing isn’t just a safety net—it’s how we keep ThriftFinder thrifty and trusty!_
