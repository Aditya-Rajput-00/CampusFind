# CampusFind — Project Context

## 1. Project Overview

**Project Name:** CampusFind  
**Repository:** https://github.com/Aditya-Rajput-00/CampusFind  
**Local Path:** `D:/CampusFind`

CampusFind is a full-stack campus Lost & Found application designed to help students and staff report lost or found items, submit claims, manage matches, and receive notifications.

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

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── docs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── tests/
├── uploads/
├── package.json
└── .env.example
```

### Frontend Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── test/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## 4. Database Models

The following Mongoose models exist:

- User
- Item
- Claim
- Match
- Notification

Inspect actual model files before documenting individual fields or relationships.

## 5. Backend Modules

### Controllers
- authController
- claimController
- dashboardController
- itemController
- matchController
- notificationController
- userController

### Routes
- authRoutes
- claimRoutes
- dashboardRoutes
- itemRoutes
- matchRoutes
- notificationRoutes
- userRoutes

### Middleware
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

## 7. Authentication and Registration Policy

Confirmed registration policy:

- Public registration permits student and staff roles only.
- Student registrations are approved immediately.
- Staff registrations remain pending until an admin approves them.
- Pending or rejected staff accounts cannot log in.
- Public registration cannot create admin accounts.
- Admin-only endpoints manage pending staff approvals.

### Authentication Security

The authentication middleware validates the JWT and retrieves the current user from MongoDB.

The middleware:

- Validates the JWT.
- Checks the user ID format.
- Retrieves the current database user.
- Rejects deleted users.
- Rejects accounts that are not approved.
- Uses the current database role instead of trusting the JWT role.
- Forwards database errors to centralized error handling.

This prevents outdated JWT role information from granting privileges after a user's role changes.

## 8. Production Architecture

Previously verified deployment configuration:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Image storage: Cloudinary

Backend production URL:

https://campusfind-backend-k16o.onrender.com

The backend uses Express trust proxy configuration for the Render environment.

Verify live deployment status and environment configuration before making claims about current production availability.

## 9. Verified Development History

Previously recorded GitHub commits:

- `a730e92` — Configure Express trust proxy for Render
- `b10be06` — Add staff registration approval workflow
- `be65ca1` — Add Cloudinary image storage for production
- `6fc4c85` — Improve lost and found items page
- `8ab0f48` — Add frontend integration test coverage
- `1eded03` — Fix claim and match controller test fixtures

These commits are historical evidence, not proof that every feature currently passes testing.

## 10. Current Development Position

**Overall roadmap position:**

- Phase 15 — Final Testing & Deployment
- Task 88 — Production API Configuration: Completed
- Task 89 — Final Security Check: Completed and pushed
- Task 90 — Final GitHub Release/Version: In Progress

### Task 89 Verification Record

The recorded final backend verification for Task 89:

- Full backend test suite: 162/162 passed, 0 failures.
- Authentication middleware unit tests: 11/11 passed.
- Updated integration tests passed.
- CORS integration tests are present.
- `git diff --check` completed without errors.

These results apply to the working tree at the time of verification.

**Task 89 commit:** `64c3b78` — `fix: validate current user state in auth middleware`

### Task 90 — Final GitHub Release/Version

- First release version selected: `v1.0.0`.
- Repository inspection completed.
- Root README created.
- Four-file documentation structure retained.
- Remaining documentation updates are in progress.
- Release notes are pending.
- Git tag: Not created.
- GitHub Release: Not published.

### GitHub State at Initial Task 90 Inspection

- Default branch: `main`.
- Latest verified commit: `64c3b78`.
- Repository visibility: Public.
- No published releases or version tags were found at the initial inspection.

## 11. Development Rules

1. Work on one focused task at a time.
2. Inspect existing code before modifying it.
3. Never rewrite working functionality unnecessarily.
4. Preserve existing architecture and conventions.
5. Test every implementation.
6. Fix errors before proceeding.
7. Maintain GitHub regularly.
8. Commit only verified changes after explicit developer approval.
9. Never expose `.env` secrets.
10. Never assume unverified features are implemented.
11. Preserve existing uncommitted work.
12. Do not stage unrelated files.

## 12. Development Workflow

Follow:

PLAN → INSPECT → IMPLEMENT → TEST → VERIFY → REVIEW → COMMIT

Do not move to the next task until the current task is verified.

## 13. Documentation Maintenance

Maintain these files in the repository root:

- `PROJECT_CONTEXT.md` — Overall project knowledge.
- `CURRENT_TASK.md` — Current development position.
- `CHANGELOG.md` — Important development history.
- `DECISIONS.md` — Architectural and technical decisions.

Update relevant documentation after every significant development milestone.

## 14. Instructions for Future AI Assistants

Before starting a new development conversation:

1. Read this file.
2. Read `CURRENT_TASK.md`.
3. Read `CHANGELOG.md`.
4. Read `DECISIONS.md`.
5. Inspect relevant source code.
6. Confirm the current development position with the developer.
7. Continue from the last verified task.

If information is missing, ask the developer rather than inventing details.

## Last Updated

2026-11-12