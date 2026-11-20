# CampusFind — Architecture & Project Decisions

This document records important technical and project decisions so future development remains consistent.

---

## 1. Project Architecture

**Decision:** CampusFind uses a separate frontend and backend architecture.

- Frontend: React with Vite.
- Backend: Node.js with Express.
- Database: MongoDB with Mongoose.
- API communication: HTTP REST APIs.

**Reason:** Separating frontend and backend makes the application easier to maintain, test, and deploy.

---

## 2. Backend Technology

**Decision:** Use Node.js and Express 5 with CommonJS modules.

**Reason:** This provides a lightweight and maintainable backend structure.

The backend uses Mongoose for MongoDB interaction and centralized middleware for request processing and error handling.

---

## 3. Database Design

**Decision:** Use MongoDB with Mongoose models.

The main models are:

- User
- Item
- Claim
- Match
- Notification

**Reason:** These models represent the main entities and relationships required by the CampusFind Lost & Found workflow.

---

## 4. Authentication and Authorization

**Decision:** Use JWT-based authentication and role-based authorization.

- Passwords are hashed using bcryptjs.
- JWTs are verified by authentication middleware.
- The current user is retrieved from MongoDB.
- Deleted users and accounts that are not approved are rejected.
- The current database role is used for authorization decisions.
- Public registration permits student and staff accounts only.
- Student accounts are automatically approved.
- Staff accounts require administrator approval.
- Pending or rejected staff accounts cannot log in.
- Public registration cannot create administrator accounts.

**Reason:** Authentication and authorization must reflect the current account state and prevent users from gaining privileges through outdated or manipulated token data.

---

## 5. API Error Handling

**Decision:** Use centralized error-handling middleware.

Controllers should pass unexpected errors to the centralized error handler using `next(error)` rather than implementing inconsistent error responses in individual controllers.

**Reason:** Consistent error handling improves maintainability and API reliability.

---

## 6. API Documentation

**Decision:** Use Swagger/OpenAPI documentation.

The API documentation is available through the backend's `/api-docs` route.

**Reason:** API documentation makes endpoints easier to understand, test, and maintain.

---

## 7. Image Management

**Decision:** Use Cloudinary for image storage and management.

Multer is used for handling uploaded files.

**Reason:** External image storage avoids depending on the backend server's local filesystem for production image hosting.

---

## 8. Security

**Decision:** Apply security controls through dedicated middleware and configuration.

The backend includes:

- Helmet.
- Express Rate Limit.
- CORS configuration.
- JWT authentication.
- Role-based authorization.
- Input validation.
- Centralized error handling.

**Reason:** Security should be applied consistently across the application rather than handled separately in every route.

---

## 9. Frontend Architecture

**Decision:** Use React 19 and Vite 8.

Axios is used for API communication.

The frontend API service supports `VITE_API_URL`, with `/api` as the fallback.

The Vite development configuration proxies `/api` requests to the local backend.

**Reason:** This keeps API configuration manageable across development and production environments.

---

## 10. Testing Strategy

**Decision:** Maintain separate testing tools for the backend and frontend.

- Backend: Node.js built-in test runner.
- Frontend: Vitest and React Testing Library.
- Frontend code quality: ESLint.

**Reason:** Separate test environments allow each application layer to be tested using appropriate tools.

---

## 11. Production Deployment Architecture

**Decision:** Use the following planned production architecture:

- Frontend: Vercel.
- Backend: Render.
- Database: MongoDB Atlas.
- Image storage: Cloudinary.

**Reason:** These services provide separate hosting for the frontend, backend, database, and uploaded images.

Production deployment should be considered verified only when the relevant services and configurations have actually been checked.

---

## 12. Versioning and GitHub Release

**Decision:** Use `v1.0.0` as the first published GitHub release version.

The first release is published and marked as Latest on GitHub.

**Release details:**

- Release title: CampusFind v1.0.0
- Tag: `v1.0.0`
- Target branch: `main`
- Target commit: `ee447b3b9df0c559f2ae54bd60b5ec3c6a6d84bd`

**Release URL:**

https://github.com/Aditya-Rajput-00/CampusFind/releases/tag/v1.0.0

The backend and frontend package versions remain independent.

**Reason:** The GitHub release identifies the overall application release, while package versions belong to their respective applications.

---

## 13. Documentation Structure

**Decision:** Maintain four separate project documentation files:

- `PROJECT_CONTEXT.md` — Overall project context and architecture.
- `CURRENT_TASK.md` — Current roadmap position and active task.
- `CHANGELOG.md` — History of notable project changes.
- `DECISIONS.md` — Important technical and architectural decisions.

The root `README.md` provides the project's introduction and setup information.

**Reason:** Each document has a distinct purpose, making project continuity easier across development sessions.

---

## 14. Development Workflow

**Decision:** Follow this workflow for project development:

1. PLAN
2. INSPECT
3. IMPLEMENT
4. TEST
5. VERIFY
6. REVIEW
7. COMMIT

Work on one focused task at a time. Do not proceed to the next task until the current work has been verified.

**Reason:** This reduces unnecessary changes, prevents regressions, and maintains a clear development history.

---

## 15. Release Status

**Current roadmap position:** Phase 15 — Final Testing & Deployment closeout.

- Task 88: Completed.
- Task 89: Completed and pushed.
- Task 90: Completed. The first GitHub release was published and the project records were synchronized; this documentation audit resolves later drift.

The first published release remains `v1.0.0`, tagged at:

`ee447b3b9df0c559f2ae54bd60b5ec3c6a6d84bd`

The release-record synchronization commit is `80b16ce`. Later frontend work, through authentication commit `57a4159`, is unreleased. No later tag is recorded.

Task 91's Dropdown popup clipping issue was fixed with intelligent upward/downward positioning and pushed in `dec832c`.

### Dashboard list pagination metadata

**Decision:** Keep each existing list endpoint's response shape and consume its own pagination metadata in the frontend. Claims and Matches use their server-provided `pagination.totalRecords`; the Items API provides `pagination.totalItems`, which Dashboard normalizes when displaying a section's record total.

Claims and Matches request 20 records per page and use returned page metadata for navigation. Existing role authorization and claim/match action workflows remain in their current pages. Status summary counts on those pages describe the visible page; the total-record summary comes from the server.

**Reason:** This fixes frontend/backend pagination regressions without changing API contracts or duplicating business logic.

---

## 16. Reusable Frontend Dropdown

**Decision:** Use one controlled React Dropdown component for the Items page filters and Report Item modal fields that need consistent custom styling.

The component follows a select-only combobox pattern with listbox and option semantics. It supports Arrow Up/Down, Enter, Space, Escape, Home, End, and type-to-search; keyboard focus remains on the trigger while options are navigated. It closes on outside pointer interaction and Tab, retains trigger focus after selection or Escape, exposes required and disabled states, and scrolls an active option into view when necessary.

The component is implemented without an additional dependency and passes the selected scalar value to its caller, preserving existing application state and API payloads.

**Reason:** A shared component keeps the filter and modal controls visually consistent while providing predictable keyboard and assistive-technology behavior.

**Follow-up:** Verify popup placement near the bottom of the scrolling Report Item modal on short viewports. The current popup opens below its trigger and may need a placement adjustment if clipping is observed.

---

## 17. Responsive Authentication Backgrounds

**Decision:** Use one shared authentication page structure and select a dedicated campus image through CSS breakpoints for Login and Registration.

- Desktop, above 1024px: `/images/auth-campus-background.png`.
- Tablet, 601–1024px: `/images/auth-tablet.png`.
- Mobile, 600px and below: `/images/auth-mobile.png`.
- The mobile image uses centered `cover` sizing so it fills the authentication page while preserving image proportions.

The shared rules preserve the warm ivory page surface and do not alter authentication logic or API behavior.

**Reason:** Dedicated compositions suit the available space at each device class and keep both authentication pages visually consistent.

---

## 18. First Administrator Bootstrap

**Decision:** Create the first administrator only through the private backend CLI (`cd backend; npm run bootstrap`), never through an unauthenticated HTTP endpoint.

- Password entry is interactive and hidden; passwords are not accepted as command-line arguments or printed to logs.
- Email is normalized and validated. Passwords must be at least 12 characters and contain lowercase, uppercase, numeric, and symbol characters. Hashing uses the existing bcryptjs dependency at cost 10.
- The created account has `role: "admin"` and `accountStatus: "approved"`.
- A unique MongoDB `_id` guard document serializes concurrent attempts on standalone and replica-set deployments; no transaction support is required.
- Existing admin or guard state refuses the operation. Pre-insertion failures release the guard only after a successful no-admin check. Once a user write is attempted, any error leaves the guard for operator inspection because the write outcome may be ambiguous.

**Reason:** Public registration intentionally excludes admins, and staff approval requires an admin. A guarded operator-only command resolves initial provisioning without weakening route authorization.
