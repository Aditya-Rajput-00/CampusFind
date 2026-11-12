# CampusFind — Changelog

All notable project changes are documented in this file.

The format follows a simplified Keep a Changelog structure.

---

## [Unreleased]

### Release Preparation — 2026-11-12

- Added the root `README.md` for project documentation.
- Updated `PROJECT_CONTEXT.md` with the current verified project status.
- Updated `CURRENT_TASK.md` to reflect completed Task 89 and ongoing Task 90.
- Preparing the first GitHub release, `v1.0.0`.
- GitHub release and version tag have not yet been published.

---

## [1.0.0] — Planned

**Status:** Release preparation in progress. This version has not yet been published.

### Security

- Improved authentication middleware to validate the current user against MongoDB.
- Added validation of the user ID format.
- Rejected deleted users and accounts that are not approved.
- Used the current database role instead of relying on potentially outdated JWT role information.
- Forwarded database errors to centralized error handling.

### Backend

- Implemented authentication and user management.
- Implemented lost and found item management.
- Implemented claim and match functionality.
- Implemented notification functionality.
- Implemented dashboard statistics.
- Added API documentation using Swagger/OpenAPI.
- Configured centralized error handling and security middleware.

### Frontend

- Established the React and Vite frontend application.
- Configured frontend API communication.
- Added frontend testing and linting tools.

### Infrastructure

- Integrated MongoDB using Mongoose.
- Configured Cloudinary for image management.
- Prepared the production deployment architecture using Vercel, Render, MongoDB Atlas, and Cloudinary.

### Verification

- Task 89 backend test results: 162 passed, 0 failed.
- Authentication middleware unit tests: 11/11 passed.
- CORS integration tests cover allowed origins, untrusted origins, and OPTIONS requests.

These are recorded verification results from Task 89, not a claim that every production deployment component has been re-tested.

---

## [0.0.0] — Initial Development

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

- The repository's first planned GitHub release is `v1.0.0`.
- Backend and frontend package versions are maintained independently.
- The GitHub release version does not automatically change either package version.
- A release is considered published only after its Git tag and GitHub Release have been verified.

---

## Latest Verified Security Commit

`64c3b78` — `fix: validate current user state in auth middleware`

Branch: `main`

Status: Committed and pushed to GitHub.