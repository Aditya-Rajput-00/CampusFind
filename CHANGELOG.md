# CampusFind — Changelog

All notable project changes are documented in this file.

The format follows a simplified Keep a Changelog structure.

---

## [1.0.0] — 2026-11-12

**Status: Published — First Stable Release**

GitHub Release:

https://github.com/Aditya-Rajput-00/CampusFind/releases/tag/v1.0.0

Git tag: `v1.0.0`

Target commit: `ee447b3b9df0c559f2ae54bd60b5ec3c6a6d84bd`

### Features

- User registration and authentication.
- Student and staff account management.
- Administrator approval for staff registrations.
- Lost and found item reporting and management.
- Claim submission and management.
- Item matching functionality.
- Notifications and dashboard statistics.
- Image management using Cloudinary.
- API documentation using Swagger/OpenAPI.

### Security

- Improved authentication middleware to validate the current user against MongoDB.
- Added validation of the user ID format.
- Rejected deleted users and accounts that are not approved.
- Used the current database role instead of relying on potentially outdated JWT role information.
- Forwarded database errors to centralized error handling.

### Technology Stack

- Frontend: React 19, Vite 8, Axios.
- Backend: Node.js, Express 5.
- Database: MongoDB, Mongoose.
- Authentication: JWT, bcryptjs.
- Image storage: Cloudinary.
- Frontend testing: Vitest, React Testing Library, ESLint.
- Backend testing: Node.js Test Runner.

### Infrastructure

The planned production architecture uses:

- Frontend: Vercel.
- Backend: Render.
- Database: MongoDB Atlas.
- Image storage: Cloudinary.

### Recorded Verification

Task 89 backend security verification recorded:

- Full backend test suite: 162 passed, 0 failed.
- Authentication middleware unit tests: 11/11 passed.
- CORS integration tests cover allowed origins, untrusted origins, and OPTIONS requests.

These results refer to the recorded Task 89 verification and do not claim that every production deployment component was re-tested during release publication.

### Release Preparation

- Added the root `README.md`.
- Updated `PROJECT_CONTEXT.md`.
- Updated `CURRENT_TASK.md`.
- Updated `CHANGELOG.md`.
- Updated `DECISIONS.md`.
- Reviewed and committed the documentation changes.

Release-preparation commit:

`ee447b3` — `docs: prepare CampusFind v1.0.0 release`

---

## [Unreleased]

### Features

- Added a reusable, keyboard-accessible Dropdown and integrated it into the Items filters and Report Item modal.

---

## Initial Development

### Project Foundation

- Created the CampusFind repository.
- Initialized the backend using Node.js and Express.
- Connected the backend to MongoDB.
- Established the initial frontend application.
- Created the initial project structure and documentation.

### Backend Models

- User
- Item
- Claim
- Match
- Notification

### Backend Modules

- Authentication
- Users
- Items
- Claims
- Matches
- Notifications
- Dashboard

---

## Versioning Notes

- `v1.0.0` is the first published GitHub release.
- Backend and frontend package versions are maintained independently.
- The GitHub release version does not automatically change either package version.
- Future releases should document significant features, fixes, security improvements, and verification results.
