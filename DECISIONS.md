
# CampusFind — Technical Decisions

This document records confirmed architectural and technical decisions.

## 1. Application Architecture

Decision:
Separate frontend and backend applications.

Structure:
- frontend/
- backend/

Status: Verified from repository structure.

## 2. Frontend Technology

Decision:
React with Vite.

Technologies:
- React 19
- Vite
- Axios
- JavaScript ES Modules

Status: Verified from frontend/package.json.

## 3. Backend Technology

Decision:
Node.js with Express.

Technologies:
- Node.js
- Express 5
- JavaScript CommonJS
- Mongoose

Status: Verified from backend/package.json.

## 4. Database

Decision:
MongoDB with Mongoose.

Existing models:
- User
- Item
- Claim
- Match
- Notification

Status: Previously established. Verify implementation before changing models.

## 5. Authentication

Existing dependencies:
- JSON Web Token
- bcryptjs

Existing middleware:
- authMiddleware
- roleMiddleware

Important:
Inspect actual authentication implementation before changing security logic.

## 6. Image Storage

Cloudinary integration exists in the backend.

Related file:
backend/src/config/cloudinary.js

Status: Historical implementation milestone. Verify current configuration before making changes.

## 7. API Documentation

Decision:
Use Swagger/OpenAPI documentation.

Related file:
backend/src/docs/swagger.js

## 8. Testing

Backend:
Node.js built-in test runner.

Frontend:
Vitest and React Testing Library.

Decision:
Test relevant functionality before considering a task complete.

## 9. Development Rules

- Preserve existing architecture.
- Avoid unnecessary dependencies.
- Never rewrite working functionality without a reason.
- Prefer reusable and maintainable code.
- Use centralized error handling.
- Protect sensitive configuration.
- Commit verified changes only.

## 10. Decision Management

Whenever a significant architectural decision is made:

1. Record the decision.
2. Explain why it was selected.
3. Record alternatives if relevant.
4. Update this document.
5. Never silently reverse an existing decision.
