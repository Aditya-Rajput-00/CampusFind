# CampusFind

**A Campus Lost & Found Management System**

CampusFind is a web application for campus communities to report lost and found belongings, submit and review claims, manage potential matches, and receive notifications. Students and staff use the public application; administrators manage staff approvals and account access through role-protected endpoints.

## Implemented features

- Student and staff registration, login, and role-aware access.
- Administrator approval of staff registrations; public registration cannot create administrator accounts.
- Lost and found item reporting, search, filters, status management, pagination, and image previews.
- Claim submission and management, match review, and notifications.
- Staff and administrator dashboard statistics; an administrator UI for staff approvals and API endpoints for user and role administration.
- Responsive authentication pages and a shared warm visual design system.
- REST API documentation through Swagger/OpenAPI.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript, Axios, CSS |
| Backend | Node.js, Express 5 (CommonJS) |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Validation and security | Express Validator, Helmet, Express Rate Limit, CORS |
| Uploads and storage | Multer, Cloudinary |
| API documentation | Swagger/OpenAPI |
| Frontend checks | Vitest, React Testing Library, ESLint |
| Backend tests | Node.js built-in test runner |

## Project structure

```text
CampusFind/
├── backend/
│   ├── src/             # Express app, config, controllers, middleware, models, routes
│   ├── tests/
│   ├── uploads/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/             # React app, pages, components, context, services
│   └── package.json
├── PROJECT_CONTEXT.md
├── CURRENT_TASK.md
├── CHANGELOG.md
└── DECISIONS.md
```

## Local setup

### Prerequisites

- Node.js and npm
- MongoDB locally or a MongoDB Atlas connection
- Git
- Cloudinary credentials for item image uploads

Clone the repository and install the two applications separately:

```bash
git clone https://github.com/Aditya-Rajput-00/CampusFind.git
cd CampusFind/backend
npm install
cd ../frontend
npm install
```

Create `backend/.env` from `backend/.env.example` (for example, run `Copy-Item backend/.env.example backend/.env` in PowerShell from the repository root). Set `PORT`, `CLIENT_URL`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and the Cloudinary values. Keep real credentials out of Git. The example defaults to a local MongoDB database and frontend origin `http://localhost:5173`.

Open two terminals at the repository root. In the first, start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Vite serves the frontend and proxies `/api` and `/uploads` to `http://localhost:5000`. To use a separately hosted API, set `VITE_API_URL` in the frontend environment. Open the local URL printed by Vite.

Use a strong, unique JWT secret and never commit `.env` files. Protected requests check the current user account in MongoDB; pending or rejected staff accounts cannot log in.

## Checks

Run these from their respective application directories:

```bash
# backend
npm test

# frontend
npm test -- --run
npm run lint
npm run build
```

## API documentation

With the backend running, open `http://localhost:5000/api-docs`.

## Release and project status

`v1.0.0` is the first published GitHub release. Its tag points to `ee447b3` (`docs: prepare CampusFind v1.0.0 release`). Later frontend design and authentication improvements are recorded as unreleased changes; they have not been assigned another release tag.

The configured production architecture is Vercel for the frontend, Render for the backend, MongoDB Atlas for the database, and Cloudinary for image storage. Verify live deployment state before relying on service availability. The current development and roadmap status is in [CURRENT_TASK.md](CURRENT_TASK.md).

## Project documents

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — Architecture and project context.
- [CURRENT_TASK.md](CURRENT_TASK.md) — Completed work, open review item, and next recommended task.
- [CHANGELOG.md](CHANGELOG.md) — Release history and unreleased milestones.
- [DECISIONS.md](DECISIONS.md) — Confirmed technical and project decisions.

## Repository

[GitHub: Aditya-Rajput-00/CampusFind](https://github.com/Aditya-Rajput-00/CampusFind)
