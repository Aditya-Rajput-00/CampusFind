
# CampusFind Changelog

Notable project changes are recorded here. The project has one published release, `v1.0.0`; later work remains under **Unreleased** until a subsequent release is actually created.

## [Unreleased]

### Backend

- Added role-based `DELETE /api/users/:id` for student/staff account soft deletion. Admin can delete student and staff accounts; Staff can delete student accounts only. Administrator accounts and self-deletion are protected.
- Account deletion validates IDs, anonymizes credentials and profile information, excludes deleted accounts from authentication and active listings, and retains related historical records.
- Added `GET /api/users/students`, a staff/admin-authorized, paginated directory limited to approved students and the `_id`, name, email, and department fields. The endpoint supports legacy records with missing status; the existing admin-only `GET /api/users` authorization is unchanged.
- Added the aggregate `totalStudents` dashboard statistic, matching `{ role: "student", accountStatus: "approved", deletedAt: null }` independently of directory pagination.
- Added the aggregate `totalUsers` dashboard statistic, counting all non-deleted user accounts, including students, staff, and administrators, using `{ deletedAt: null }`.
- Authentication middleware treats missing or null account status as approved for legacy users, consistent with login; pending and rejected users remain blocked.
- Added an admin-only `GET /api/users/staff` endpoint with server-side staff scoping, safe profile fields, name/email search, status filtering, and pagination metadata.
- Staff statistics include legacy accounts without an explicit status under Approved, matching existing login behavior.
- Added an operator-run first-admin bootstrap CLI with hidden password entry, bcrypt hashing, and a unique MongoDB guard against concurrent initial administrator creation.
- Successfully created the initial administrator and verified admin login and access to an admin-protected API endpoint.
- Verified the deployed staff API workflow end to end: registration as pending, pending-login denial, admin listing and approval, and successful staff login after approval.
- Added automatic Lost & Found matching after successful item creation. The matching service compares only opposite-type ACTIVE reports using title similarity (35 points), exact category match (25 points), description similarity (25 points), and location similarity (15 points). The configurable minimum threshold is 60/100.
- Added duplicate-pair protection through a compound unique index on `lostItemId` and `foundItemId`.
- Automatically created matches generate MATCH notifications for both reporters. Existing manual matching and confirmation/rejection workflows remain supported; item statuses are not automatically changed.
- Isolated automatic matching failures so they do not roll back successful item creation; failures are logged.

### Frontend

- Added role-based Dashboard account deletion actions with target-specific confirmation, duplicate-submit protection, success/error feedback, and directory/statistics refresh. Admin can delete student/staff accounts; Staff can delete student accounts only.
- Admin Dashboard displays Total Users and the all-account directory. Staff Dashboard displays Total Students and the approved-student directory without Admin-only role or account-status controls.
- Added administrator-account protection and role-appropriate account actions in the Dashboard interface; backend authorization remains authoritative.
- Integrated the approved graduation-cap logo in Login and Registration using its original colors and in the responsive application header using a Warm Ivory recolor; replaced the Vite favicon and default page title with CampusFind branding.
- Added independent show/hide controls for Registration Password and Confirm Password fields, blocks mismatched passwords with a clear error, and keeps confirmation out of the existing API payload.
- Fixed the Dashboard Total Users directory by omitting empty role and account-status filters rejected by backend list-query validation; surfaced validation details in errors and reset stale record totals after failed requests.
- Staff Approvals now ignores out-of-order list/statistics responses, reconciles 409 action conflicts with fresh data, keeps pagination disabled during loads, and restores focus after closing account details.
- Added regression coverage for action failures, refreshes, conflict handling, stale list responses, loading pagination, and modal focus.
- Expanded Staff Approvals with backend-derived status statistics, searchable status filters, paginated account records, responsive layouts, a safe details modal, and confirmation before approval or rejection.
- Added a reusable keyboard-accessible Dropdown for item filters and the Report Item form.
- Improved responsive header and user controls.
- Applied the warm visual system to authentication, item cards, Claims, Matches, and Notifications.
- Added dedicated desktop, tablet, and mobile campus backgrounds to Login and Registration (`57a4159`).
- Improved item image framing and added an accessible full-size image preview.
- Added focused page tests for Matches and Notifications and expanded Items and Registration coverage.
- Added server-backed pagination to Claims and Matches using existing pagination metadata; status summaries describe the visible page while record totals use the server total.
- Normalized the Dashboard item total from the Items API's `pagination.totalItems` field and added regression coverage for the response shape.
- Refined the Staff & Admin Dashboard with a welcome header, client-local refresh timestamp, responsive statistic cards, accessible Lost vs Found comparison, and clearer management tables and states.
- Refreshing the Dashboard now refreshes the selected management records as well as the statistics.

### Verification

- Automatic Lost & Found Matching verification (November 23, 2026): matching service tests 16/16, item controller tests 24/24, item API integration tests 3/3, and full backend suite 225/225 passed. Full frontend suite passed 156/156 tests across 17 files; frontend ESLint and Vite production build passed. Total automated tests: 381/381 passed.
- Latest role-based account deletion and Dashboard directory verification passed 29/29 backend user API integration tests, 208/208 full backend tests, 21/21 focused Dashboard frontend tests, and 156/156 full frontend tests across 17 files. The frontend Vite production build passed.
- Account deletion tests cover Admin deletion of student/staff accounts, Staff deletion of student accounts, denial of Staff deletion of other roles, unauthenticated denial, invalid IDs, self-deletion protection, administrator-account protection, retained related records, and directory/count behavior.
- Dashboard regression tests cover Admin Total Users, Staff Total Students, role-appropriate directories and delete actions, confirmation, successful deletion feedback, and directory/statistics refresh.
- Staff Dashboard student directory verification passed 152 frontend tests across 17 files and 200 backend tests, including staff listing, fixed approved-student scope, safe fields, search, pagination, validation errors, staff authorization, unauthenticated access, and continued protection of the admin-only user endpoint. Frontend ESLint and Vite production build passed.
- Dashboard Total Students verification passed the full 152-test frontend suite across 17 files and 200 backend tests. Regression checks verify exact role/status matching excludes pending, rejected, null/missing statuses, admin, and staff accounts; card totals are independent of paginated directory results. Frontend ESLint, Vite production build, and `git diff --check` passed.
- Dashboard user-directory fix passed 149 frontend tests across 17 files and 196 backend tests, including filter omission, search, role/status filtering, pagination, validation details, safe user fields, and authorization. Frontend ESLint, Vite production build, and `git diff --check` passed.
- Registration password improvements passed 145 frontend tests across 17 files, including independent visibility toggles, mismatch blocking, correction, and payload checks; frontend ESLint, Vite production build, and `git diff --check` passed.
- Logo color refinement verification passed 142 frontend tests across 17 files, frontend ESLint, Vite production build, and `git diff --check`. Desktop, mobile, and narrow-mobile header/logo CSS was reviewed; interactive browser viewport inspection remains unavailable because the browser access host cannot attach to the minimized Chrome windows.
- CampusFind logo integration verification passed 142 frontend tests across 17 files, frontend ESLint, Vite production build, and `git diff --check`. The responsive header styles were reviewed at desktop, mobile, and narrow mobile breakpoints; interactive browser viewport inspection was unavailable because the browser access host could not attach to the minimized Chrome windows.
- Phase 3 correction verification passed 194 backend tests and 137 frontend tests across 17 files; frontend ESLint, Vite production build, and `git diff --check` passed. Focused authentication middleware tests passed 13/13.
- Staff Approval Dashboard verification passed 192 backend tests, 129 frontend tests across 17 files, frontend ESLint, Vite production build, and `git diff --check`.
- Dashboard redesign verification passed 123 frontend tests across 17 files; frontend ESLint, production build, and `git diff --check` passed. The 187-test backend result belongs to the preceding pagination verification.
- Browser-based viewport verification for the Dashboard redesign was unavailable; responsive breakpoints were reviewed in CSS.
- The developer manually verified Login and Registration at the requested laptop, tablet, and mobile viewports.

## [1.0.0] — 2026-11-12

**Status:** Published first stable release. This remains the only published CampusFind release in the repository history.

- GitHub release: [CampusFind v1.0.0](https://github.com/Aditya-Rajput-00/CampusFind/releases/tag/v1.0.0)
- Tag: `v1.0.0`
- Tagged commit: `ee447b3b9df0c559f2ae54bd60b5ec3c6a6d84bd` (`docs: prepare CampusFind v1.0.0 release`)
- Post-publication release-record synchronization: `80b16ce` (`docs: finalize CampusFind v1.0.0 release records`)

### Features in the release

- User registration and authentication with student and staff roles.
- Administrator review of staff registrations.
- Lost and found item reporting and management, claims, matches, notifications, and dashboard statistics.
- Image handling through Cloudinary and API documentation through Swagger/OpenAPI.

### Security and infrastructure

- Authentication middleware checks the current user record, ID format, approval state, and current database role.
- Production architecture is configured for Vercel, Render, MongoDB Atlas, and Cloudinary. Live service availability must be verified separately.

### Release technology

- Frontend: React 19, Vite 8, Axios, Vitest, React Testing Library, and ESLint.
- Backend: Node.js, Express 5, MongoDB/Mongoose, and the Node.js test runner.
- Authentication and uploads: JWT, bcryptjs, Multer, and Cloudinary.
- API documentation: Swagger/OpenAPI.

### Recorded release verification

- Task 89 backend suite: 162 passed, 0 failed.
- Authentication middleware unit tests: 11/11 passed.
- CORS integration tests cover allowed origins, untrusted origins, and preflight requests.

These are historical Task 89 results and do not claim a fresh full backend run at release time. The backend package version is `1.0.0`; the frontend package version is independently maintained at `0.0.0`.

## Earlier development

### Project foundation

- Created the repository and established separate React/Vite frontend and Express backend applications connected to MongoDB.
- Added authentication, users, items, claims, matches, notifications, and dashboard modules.

### Backend modules

Authentication, users, items, claims, matches, notifications, dashboard, and staff approvals.

### Data model areas

- User
- Item
- Claim
- Match
- Notification

## Versioning notes

- `v1.0.0` is the first and only published release recorded in this repository.
- Backend and frontend package versions are independent of the repository release tag.
- Do not add a release entry until a release is actually published and its tag is verified.
