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