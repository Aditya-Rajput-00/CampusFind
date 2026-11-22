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
├── scripts/
│   └── bootstrapAdmin.js
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

### Frontend Branding

The official logo is the graduation-cap artwork in `frontend/src/assets/brand/campusfind-logo.png`. Login and Registration use its original Dark Brown and Mocha/Gold colors. The authenticated application header uses the same symbol recolored Warm Ivory (`#F8F4E9`) beside the existing CampusFind wordmark; no background badge is used. The favicon uses the approved artwork. Keep the master source unchanged when preparing derivatives.

## 7. Authentication and Registration Policy

Confirmed registration policy:

- Public registration permits student and staff roles only.
- Student registrations are approved immediately.
- Staff registrations remain pending until an admin approves them.
- Pending or rejected staff accounts cannot log in.
- Public registration cannot create admin accounts.
- The Registration form provides independent password visibility controls and confirms that Password and Confirm Password match before submitting. Confirmation remains client-side and is not included in the registration API payload.
- Admin-only endpoints manage pending staff approvals.
- Provision the first administrator from `backend/` with `npm run bootstrap`. The CLI prompts interactively for name, email, and password; password input is hidden. It normalizes and validates email, enforces a strong password, hashes it with bcryptjs at cost 10, and creates an approved admin.
- The command claims the unique `_id` `first-admin` in MongoDB's `adminBootstrapGuards` collection before inserting the user. MongoDB's unique `_id` serializes concurrent attempts and works with the standalone local MongoDB URI in `.env.example`; transactions are not required. It refuses if an admin exists or the guard is already claimed.
- Failures before attempting user insertion release the guard only after the database confirms there is no admin. Once an insertion is attempted, the guard remains on any error because the write outcome may be ambiguous. An operator must inspect admin records and the guard before manually clearing a stale `in-progress` guard; do not clear it if an admin may have been created.

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

### Initial Admin and Deployed Staff Workflow Verification

The initial administrator was successfully created through the one-time bootstrap CLI. Admin login and access to an admin-protected API endpoint were verified.

The deployed staff workflow was verified end to end: staff registration creates a pending account, pending staff login is denied, the admin can retrieve pending staff, the admin approves the test staff account, and that staff account can log in after approval. This records real deployed API verification and is separate from automated test-suite results.

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

Earlier verified milestones:

- `b10be06` — Add staff registration approval workflow.
- `be65ca1` — Add Cloudinary image storage for production.
- `adb443f` — Configure backend production CORS and update dependencies.
- `6ed8cd2` — Configure the frontend production API URL.
- `af23952` — Configure the production Swagger server URL.
- `a730e92` — Configure Express trust proxy for Render.
- `6fc4c85` — Improve the Lost & Found items page.
- `8ab0f48` — Add frontend integration test coverage.
- `1eded03` — Fix claim and match controller test fixtures.

Later selected commits, in chronological order:

- `64c3b78` — Validate current user state in authentication middleware.
- `ee447b3` — Prepare the v1.0.0 release documentation and README.
- `80b16ce` — Finalize the v1.0.0 release records after publication.
- `74e4580` — Add the reusable accessible Dropdown.
- `94aa2e2` — Improve the responsive header and user controls.
- `62ea570` — Apply warm styling to authentication and improve Login.
- `5a6372f` — Refresh the warm design system and Lost & Found items.
- `6cfbee9` — Refresh Claims, Matches, and Notifications and expand tests.
- `57a4159` — Complete responsive authentication backgrounds.

These commits document project history. Their test results apply only where a verification record is explicitly given.

## 10. Current Development Position

**Branch:** `main`

**Latest verified commit:** `6c2bf0a` — `fix: resolve dashboard user directory validation`.

The Staff Approval Dashboard Phase 5 corrections and approved graduation-cap logo color treatments are implemented and reviewed. Login and Registration retain the original Dark Brown and Mocha/Gold logo; the in-app header uses its Warm Ivory treatment. Registration password visibility and confirmation improvements are implemented and verified; confirmation is omitted from the existing API payload. The Admin Dashboard directory fix was committed in `6c2bf0a`. Current unreleased work adds a staff-authorized student directory and an approved-student count. Admin account deletion is implemented as a soft delete: student/staff accounts are disabled and identifying profile fields are anonymized while referenced history remains intact. The existing admin-only `GET /api/users` route remains admin-only. Authentication treats a missing or null account status as approved for legacy accounts; pending and rejected accounts remain blocked.

**Roadmap position:** Phase 15 — Final Testing & Deployment closeout.

Tasks 88 (Production API Configuration), 89 (Final Security Check), and 90 (Final GitHub Release/Version and documentation synchronization) are complete. The release and its documentation remain historical records; later frontend work is unreleased.

### Task 89 — Final Security Check

The authentication middleware validates the JWT and user ID, retrieves the current MongoDB user, rejects deleted or unapproved accounts, and uses the current database role for authorization.

Recorded verification:

- Full backend test suite: 162/162 passed, 0 failures.
- Authentication middleware unit tests: 11/11 passed.
- CORS integration tests cover configured origins, untrusted origins, and preflight requests.
- `git diff --check` passed.

These are historical results from Task 89, not a fresh backend run during the current documentation update.

### Task 90 — Final GitHub Release/Version (Project Documentation Synchronization)

**Status: Complete.** The first stable release, `v1.0.0`, was published on 2026-11-12. Its tag points to `ee447b3b9df0c559f2ae54bd60b5ec3c6a6d84bd`; the release records were synchronized in `80b16ce`. This documentation audit corrects stale status and history records without creating another release.

Subsequent frontend work is recorded under Unreleased in `CHANGELOG.md`. The Dashboard redesign verification passed 123 frontend tests across 17 files, frontend ESLint, production build, and `git diff --check`. The backend pagination work was previously verified by 187 passing backend tests. Browser-based viewport verification for the current redesign was unavailable in this environment.

Task 91's Dropdown popup clipping issue was fixed with intelligent upward/downward positioning and pushed in `dec832c`. Commit `3d7802c` contains the Dashboard management foundation, backend list pagination, Claims/Matches frontend pagination, and Dashboard Items metadata fix. The current uncommitted work is the premium Dashboard frontend redesign.

## 11. Development Rules

1. Work on one focused task at a time.
2. Inspect existing code before modifying it.
3. Never rewrite working functionality unnecessarily.
4. Preserve existing architecture and conventions.
5. Test relevant implementations.
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

## Staff Approval Dashboard

`GET /api/users/staff` is an authenticated, admin-only paginated staff directory. It accepts `search` (name/email), `accountStatus` (`pending`, `approved`, `rejected`), `page`, and `limit`. The server always applies `role: "staff"` and returns `_id`, name, email, role, account status, department, phone, and `createdAt` when available. The response follows the shared `{ success, message, data, pagination }` format; pagination includes `totalRecords` and `totalPages`. The endpoint uses an explicit field allowlist and does not return password hashes, tokens, or internal fields.

The admin Staff Approvals page provides total/pending/approved/rejected counts using `GET /api/users` pagination totals, a searchable status-filtered paginated staff list, account details, and confirmed approval/rejection actions. Older records without `accountStatus` are treated as approved, matching login behavior. Approval and rejection continue to use the existing admin-only endpoints and business logic.

`GET /api/users/students` is a separate authenticated staff/admin directory endpoint. It scopes records to approved students and, consistent with existing directory behavior, includes legacy records with no status. It supports name/email search and pagination, and selects only name, email, and department. It does not expose IDs, roles, account statuses, phone numbers, credentials, or other account fields. The Dashboard's `totalStudents` metric intentionally uses the stricter exact match `{ role: "student", accountStatus: "approved" }`, excludes missing/null statuses, and counts independently of directory pagination. The general `GET /api/users` endpoint remains admin-only.

Admin deletion of student/staff accounts sets `deletedAt`, rejects future authentication, replaces the name/email/password hash, and clears department and phone. Active user listings and dashboard counts exclude tombstones. Items, claims, matches, and notifications are retained; references continue to point to the anonymized user record. This is account deactivation and profile anonymization, not a hard database erase of historical documents or arbitrary text stored in related records.

## Last Updated

2026-11-21
