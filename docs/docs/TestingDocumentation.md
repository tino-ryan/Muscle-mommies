# Testing Documentation

## Overview

The **Muscle Mommies** project uses a robust and automated testing strategy to ensure both the **frontend** (React) and **backend** (Node.js, Firebase) components are reliable, secure, and maintainable. Tests are powered by **Jest** and integrated with **Codecov** to track test coverage over time.

Tests run automatically via **GitHub Actions** on every commit or pull request to the main and dev branches.  
 CI prevents regressions and encourages high-quality contributions.

---

## Test Structure

### Client-Side Tests

- **Location:** `client/src/__tests__`, `client/src/components/__tests__`
- **Framework:** Jest + React Testing Library
- **Purpose:** Unit and integration tests for UI components, pages, and logic

**Key Files:**

- `egTest.test.js`: Full utility function coverage (100%)
- `Button.test.jsx`: Covers reusable buttons (100%)
- `admindash.test.js`: Validates admin dashboard (100%)
- `Home.test.jsx`, `ChatWindow.test.jsx`: Page-level rendering and interaction tests

**Coverage Summary:**

| Metric     | Coverage   |
| ---------- | ---------- |
| Statements | **89.29%** |
| Branches   | **76.64%** |
| Functions  | **88.69%** |
| Lines      | **90.36%** |

`Button.jsx`, `StoreSidebar.jsx`, `MyCloset.jsx`, and `admin/Dashboard.jsx` all have **100% test coverage**  
`ChatWindow.jsx`, `Login.jsx`, and `UserChats.jsx` are **partially covered**, but are actively being expanded  
 `Analytics.jsx` currently has **no coverage** and is scheduled for initial tests

---

### Server-Side Tests

- **Location:** `server/__tests__`
- **Framework:** Jest + Supertest
- **Purpose:** API endpoint, controller, middleware, and model validation

**Key Files:**

- `authController.test.js`: 100% tested, including edge cases
- `itemModel.test.js`: 100% lines, 90% branches
- `store.test.js`, `utils.test.js`, `storeRoutes.test.js`: 100% across all metrics
- `storeController.test.js`: 82.78% line coverage with 100% function coverage — testing large, complex logic including:
  - Store CRUD
  - Messaging system
  - Reservation lifecycle
  - Chat, review, and contact management

**Coverage Summary:**

| Metric     | Coverage   |
| ---------- | ---------- |
| Statements | **83.69%** |
| Branches   | **72.29%** |
| Functions  | **91.02%** |
| Lines      | **83.96%** |

`storeController.js` is the **largest and most complex controller** and is nearing full coverage  
 Minor uncovered lines remain in logic-heavy flows (e.g., fallback paths, secondary validations)  
 All models and middleware are **fully covered**

---

## 🛠 Running Tests Locally

In both `client` and `server` directories:

```bash
npm install
npm run test:coverage
```

Generates:

- Local HTML and CLI coverage report
- `coverage/lcov.info` file for Codecov

---

## Continuous Integration

**GitHub Actions CI Workflow:**

**Runs on every push/PR** to `main` or `dev`  
 **Parallel jobs** for `client` and `server` using Node.js 20 on `ubuntu-latest`  
 **Coverage reports uploaded** to [Codecov](https://about.codecov.io/) using secure tokens  
 **Coverage Flags**:

- `frontend`
- `backend`
- `combined`

---

## Highlights

- **400 tests passing**, 100% pass rate
- `28/28` test suites pass
- Fast feedback (~6s backend, ~34s frontend)
- `storeController.js` has **24+ endpoints tested**, with focus on:
- CRUD + Cloudinary uploads
- Messaging / Chat / Contact flows
- Reservations, Sales, Reviews
- `firebase-admin`, `multer`, `uuid`, and `cloudinary` are mocked

---

## Future Plans

- [ ] Add Cypress E2E tests for full UI workflows (Login → Chat → Purchase)
- [ ] Bring **`Analytics.jsx`** and **uncovered branches** under test
- [ ] Target 100% for all **controllers** and **page components**
- [ ] Refactor tests into **domain-specific suites** (e.g., `Store`, `Chat`, `Review`)

---

## Summary

The Muscle Mommies test suite is one of its greatest strengths — with growing coverage, clear workflows, and aggressive CI enforcement.

| Area        | Status                                        |
| ----------- | --------------------------------------------- |
| UI          | High coverage (90%)                           |
| Backend     | Near full coverage (84%)                      |
| CI/CD       | Fully automated                               |
| Coverage    | Codecov + CLI                                 |
| In Progress | `Analytics.jsx`, Cypress, advanced edge cases |

> _Testing is not just a safety net — it's a product quality enforcer._
