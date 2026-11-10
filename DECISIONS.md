# CampusFind — Technical Decisions

This document records confirmed architectural, technical, and product decisions.

## 1. Application Architecture

Decision: Separate frontend and backend applications.

Structure:
- `frontend/`
- `backend/`

Status: Verified from repository structure.

## 2. Frontend Technology

Decision: React with Vite.

Technologies:
- React 19
- Vite 8
- Axios
- JavaScript ES Modules
- CSS

Frontend testing and quality tools:
- Vitest
- React Testing Library
- ESLint

Status: Verified from frontend package configuration and the existing project setup.

## 3. Backend Technology

Decision: Node.js with Express.

Technologies:
- Node.js
- Express 5
- JavaScript CommonJS
- Mongoose

Status: Verified from backend package configuration.

## 4. Database

Decision: MongoDB with Mongoose.

Existing models:
- User
- Item
- Claim
- Match
- Notification

Status: Existing project decision. Verify implementation before changing models or relationships.

## 5. Authentication and Registration Policy

Existing technologies and middleware:
- JSON Web Token
- bcryptjs
- authMiddleware
- roleMiddleware

Confirmed registration policy:

- Public registration permits student and staff roles only.
- Student registrations are approved immediately.
- Staff registrations remain pending until an admin approves them.
- Pending or rejected staff accounts cannot log in.
- Public registration must not permit creation of admin accounts.
- Admin-only endpoints manage pending staff approvals.

Rationale: Keep public student onboarding straightforward while requiring an administrator to authorize staff accounts. Prevent privilege escalation through public registration.

Status: User-selected policy implemented in the backend and reflected in the current frontend registration and admin approval work. Inspect current source and tests before changing it.

## 6. Image Storage

Cloudinary integration exists in the backend.

Related file:

`backend/src/config/cloudinary.js`

Status: Historical implementation milestone. Verify current configuration before making changes.

## 7. API Documentation

Decision: Use Swagger/OpenAPI documentation.

Related file:

`backend/src/docs/swagger.js`

## 8. Testing

Backend:
- Node.js built-in test runner.

Frontend:
- Vitest
- React Testing Library
- ESLint
- Vite production build

Decision: Test relevant functionality before considering a task complete.

Latest recorded local frontend verification on 2026-11-11:
- 10 test files passed.
- 51 tests passed.
- 0 failed.
- ESLint passed.
- Vite production build passed.
- 101 modules transformed.

These results describe the local working tree at the time of verification. Rerun checks after further code changes.

## 9. Development Rules

- Preserve existing architecture.
- Avoid unnecessary dependencies.
- Never rewrite working functionality without a reason.
- Prefer reusable and maintainable code.
- Use centralized error handling.
- Protect sensitive configuration.
- Inspect actual source before making implementation claims.
- Preserve existing uncommitted work.
- Commit verified changes only after explicit developer approval.
- Do not stage unrelated files accidentally.

## 10. Decision Management

Whenever a significant architectural or product decision is made:

1. Record the decision.
2. Explain why it was selected.
3. Record alternatives if relevant.
4. Update this document.
5. Never silently reverse an existing decision.