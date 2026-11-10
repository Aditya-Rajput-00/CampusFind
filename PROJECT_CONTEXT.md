# CampusFind — Project Context

## 1. Project Overview

**Project Name:** CampusFind  
**Repository:** https://github.com/Aditya-Rajput-00/CampusFind  
**Local Path:** D:/CampusFind

**Description:**

CampusFind is a full-stack campus lost-and-found application designed to help students and staff report lost or found items, submit claims, manage matches, and receive notifications.

## 2. Technology Stack

### Frontend
- React 19
- Vite 8
- JavaScript (ES Modules)
- Axios
- CSS
- Vitest
- React Testing Library
- ESLint

### Backend
- Node.js
- Express 5
- JavaScript (CommonJS)
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Express Validator
- Helmet
- Express Rate Limit
- Multer
- Cloudinary
- Swagger / OpenAPI
- Node.js Test Runner

## 3. Project Architecture

CampusFind uses separate frontend and backend applications.

### Backend Structure

backend/
- src/
  - config/
  - controllers/
  - docs/
  - middleware/
  - models/
  - routes/
  - utils/
  - validators/
  - app.js
  - server.js
- tests/
- uploads/
- package.json
- .env.example

### Frontend Structure

frontend/
- public/
- src/
  - assets/
  - components/
  - context/
  - hooks/
  - pages/
  - services/
  - test/
  - utils/
  - App.jsx
  - main.jsx
- package.json
- vite.config.js

## 4. Database Models

The following Mongoose models exist:

- User
- Item
- Claim
- Match
- Notification

Inspect the actual model files before documenting individual fields or relationships.

## 5. Backend Modules

Existing controllers:
- authController
- claimController
- dashboardController
- itemController
- matchController
- notificationController
- userController

Existing route modules:
- authRoutes
- claimRoutes
- dashboardRoutes
- itemRoutes
- matchRoutes
- notificationRoutes
- userRoutes

Existing middleware:
- authMiddleware
- errorMiddleware
- rateLimitMiddleware
- roleMiddleware
- uploadMiddleware

## 6. Frontend Modules

Application areas:
- Authentication
- Dashboard
- Items
- Claims
- Matches
- Notifications
- Admin staff approvals

Frontend service modules include authentication, claims, dashboard, items, matches, notifications, and user services.

Inspect actual source files before documenting additional functionality or API behavior.

## 7. Verified Development History

Previously recorded GitHub commits:

- b10be06 — Add staff registration approval workflow
- be65ca1 — Add Cloudinary image storage for production
- 6fc4c85 — Improve lost and found items page
- 8ab0f48 — Add frontend integration test coverage
- 1eded03 — Fix claim and match controller test fixtures

These commits are historical evidence, not proof that every feature currently passes testing.

## 8. Current Development Position

**Overall roadmap position:**
- Phase 15 — Final Testing & Deployment
- Task 84 — Production Environment Setup

This is the current overall roadmap position confirmed by the developer.

The frontend registration, staff approval UI, authentication improvements, and related tests have been reviewed and verified locally as a separate development activity.

The frontend changes remain local, uncommitted, and unpushed.

The frontend verification results recorded on November 11, 2026:
- 10 test files passed.
- 51 tests passed.
- 0 test failures.
- ESLint passed.
- Vite production build passed.
- 101 modules transformed.

These results apply to the local working tree at the time of verification. Rerun verification after any further code changes.

Task 84 must be handled separately. Do not mark production setup or deployment complete based on frontend verification.

## 9. Development Rules

1. Work on one focused task at a time.
2. Inspect existing code before modifying it.
3. Never rewrite working functionality unnecessarily.
4. Preserve existing architecture and conventions.
5. Test every implementation.
6. Fix errors before proceeding.
7. Maintain GitHub regularly.
8. Commit only verified changes after explicit developer approval.
9. Never expose .env secrets.
10. Never assume unverified features are implemented.
11. Preserve existing uncommitted work.
12. Do not stage unrelated files or documentation accidentally.

## 10. Development Workflow

Follow:

PLAN → INSPECT → IMPLEMENT → TEST → VERIFY → REVIEW → COMMIT

Do not move to the next task until the current task is verified.

## 11. Documentation Maintenance

Maintain these files in the repository root:

- PROJECT_CONTEXT.md — Overall project knowledge
- CURRENT_TASK.md — Current development position
- CHANGELOG.md — Important development history
- DECISIONS.md — Architectural and technical decisions

Update relevant documentation after every significant development milestone.

## 12. Important Instructions for AI Assistants

Before starting any new development conversation:

1. Read this file.
2. Read CURRENT_TASK.md.
3. Read CHANGELOG.md.
4. Read DECISIONS.md.
5. Inspect relevant source code.
6. Confirm the current development position with the developer.
7. Continue from the last verified task.

If information is missing, ask the developer rather than inventing details.