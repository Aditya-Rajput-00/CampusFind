<img width="1400" height="300" alt="campusfind-readme-banner-preview" src="https://github.com/user-attachments/assets/7f1771fa-8378-45c5-b803-122650951be2" />



Report lost belongings, discover found items, submit claims, and review potential matches — all in one place.

[Live Application](https://campus-find-adiii9.vercel.app/) · [API Documentation](https://campusfind-backend-k16o.onrender.com/api-docs) · [First Published Release: v1.0.0](https://github.com/Aditya-Rajput-00/CampusFind/releases/tag/v1.0.0)

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A) ![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white) ![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white) ![Version](https://img.shields.io/badge/Version-2nd%20Generation-brown) ![Last commit](https://img.shields.io/github/last-commit/Aditya-Rajput-00/CampusFind?label=last%20updated)

---

## About the project

CampusFind is a full-stack web application designed to make campus Lost &amp; Found management easier and more organized. Students and staff can report lost or found belongings, browse reports, submit claims, review potential matches, and receive notifications. Administrators have role-protected tools to approve staff accounts and manage account access.

The application uses a React frontend, an Express REST API, MongoDB for persistent data, and Cloudinary for uploaded item images.

![CampusFind campus illustration](frontend/src/assets/campus-hero.png)

## CampusFind — Second Generation (V2)

CampusFind has evolved beyond its first stable release into a more complete second-generation application. The current development line adds major improvements to the original Lost &amp; Found experience, including:

- Expanded role-based dashboards and account management for students, staff, and administrators.
- Automatic Lost &amp; Found matching with weighted scoring and match notifications.
- Refined Items, Claims, Matches, and Notifications experiences.
- Responsive authentication pages and a consistent campus-inspired visual identity.
- Staff approval workflows and role-scoped user directories.

**Version status:** [v1.0.0](https://github.com/Aditya-Rajput-00/CampusFind/releases/tag/v1.0.0) is the first published GitHub release. “V2” refers to the current second-generation development work on the `main` branch; a formal `v2.0.0` GitHub release has not yet been published.

## Product demo

The CampusFind V2 walkthrough is approximately **1 minute 11 seconds** long. GitHub supports inline MP4 playback in repository Markdown. To add the player, open `README.md` on GitHub, choose **Edit**, and drag `CampusFind-V2-Demo-Optimized.mp4` into the editor at the blank line below. Keep the GitHub-generated media URL on its own line, then commit the README change.

<!-- VIDEO UPLOAD POSITION: Drag CampusFind-V2-Demo-Optimized.mp4 here in the GitHub README editor. The file is intentionally not stored in the Git repository. -->

## Application screenshots

These screenshots are captured from the supplied CampusFind demo recording.

![CampusFind registration page](docs/screenshots/registration-page.jpg)

![CampusFind Lost and Found items page](docs/screenshots/items-overview.jpg)

![CampusFind automatic matching results](docs/screenshots/matching-results.jpg)

## Live environments

| Environment | Frontend | Backend |
| --- | --- | --- |
| **Production** | [Open CampusFind](https://campus-find-adiii9.vercel.app/) | [Backend health](https://campusfind-backend-k16o.onrender.com/) |
| **Staging** | [Open staging app](https://campus-find-qx9y.vercel.app/) | [Staging backend health](https://campusfind-backend-staging.onrender.com/) |

**API reference:** [Production Swagger UI](https://campusfind-backend-k16o.onrender.com/api-docs)

> Production and staging use separate MongoDB database names. Live service availability can change; these links point to the configured deployments.

## Features

### Lost & Found

- Report lost and found belongings with descriptions, locations, categories, and images.
- Browse reports with search, filters, status information, and pagination.
- Preview uploaded item images.
- Manage item status through role-aware application workflows.

### Claims, matches, and notifications

- Submit and manage claims for reported items.
- Review potential Lost &amp; Found matches.
- Automatically compare newly created Lost and Found reports.
- Receive notifications when automatic match records are created.
- Continue to use the manual match review and decision workflow.

### Accounts and role-based access

- Student and staff registration and login.
- Student accounts are approved after registration; staff accounts require administrator approval.
- Public registration cannot create administrator accounts.
- Role-aware dashboards and account directories.
- Administrator tools for staff approval and account administration.
- Backend routes enforce permissions independently of frontend visibility.

### User experience

- Responsive layouts for desktop, tablet, and mobile.
- Shared Soft Taupe, Dark Brown, and Warm Ivory visual system.
- Consistent navigation, forms, cards, and status treatments.

## Automatic matching

When a Lost or Found item is created, CampusFind compares it with eligible reports of the opposite type. Only reports with `ACTIVE` status are considered.

| Matching signal | Maximum points |
| --- | ---: |
| Title similarity | 35 |
| Exact category match | 25 |
| Description similarity | 25 |
| Location similarity | 15 |
| **Total** | **100** |

A match is created when the configured score reaches **60/100**. Location similarity considers building, area, and floor. A compound unique index prevents duplicate Lost/Found pairs. Both reporters receive a match notification. Matching errors are logged and do not undo successful item creation.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript, Axios, CSS |
| Backend | Node.js, Express 5, JavaScript (CommonJS) |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Validation and security | Express Validator, Helmet, Express Rate Limit, CORS |
| Image handling | Multer, Cloudinary |
| API documentation | Swagger / OpenAPI |
| Frontend testing | Vitest, React Testing Library |
| Code quality | ESLint |
| Backend testing | Node.js built-in test runner |

## Architecture

CampusFind contains two separately managed applications:

```text
CampusFind/
├── backend/
│   ├── scripts/              # Operational scripts, including admin bootstrap
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── docs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── PROJECT_CONTEXT.md
├── CURRENT_TASK.md
├── CHANGELOG.md
├── DECISIONS.md
└── README.md
```

**Backend API areas:** authentication, users, items, claims, matches, notifications, and dashboard.

## Run locally

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- A local MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Cloudinary](https://cloudinary.com/) credentials for item image uploads

### 1. Clone the repository

```bash
git clone https://github.com/Aditya-Rajput-00/CampusFind.git
cd CampusFind
```

### 2. Install dependencies

Run these commands from the repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure environment variables

Create the backend environment file from the example.

**PowerShell** (from the repository root):

```powershell
Copy-Item backend/.env.example backend/.env
```

**macOS / Linux** (from the repository root):

```bash
cp backend/.env.example backend/.env
```

Configure the variables below in `backend/.env`. Use the exact names and defaults in [`backend/.env.example`](backend/.env.example).

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend server port (default: `5000`) |
| `CLIENT_URL` | Frontend origin allowed by backend CORS (default: `http://localhost:5173`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong, unique secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT lifetime |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

Never commit real credentials or share your `.env` file.

### 4. Start the backend

In a terminal at the repository root:

```bash
cd backend
npm run dev
```

### 5. Start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The Vite development server proxies `/api` and `/uploads` requests to `http://localhost:5000`.

For a separately hosted API, set `VITE_API_URL` in the frontend environment, including the `/api` suffix.

### First administrator account

Public registration intentionally does not allow administrator accounts. To provision the first administrator, run the interactive bootstrap command from the `backend/` directory:

```bash
npm run bootstrap
```

Follow the prompts. The password is entered interactively and is not supplied as a command-line argument.

## Run tests and checks

Run each command from the relevant application directory.

**Backend tests**

```bash
cd backend
npm test
```

**Frontend tests, lint, and production build**

```bash
cd frontend
npm test -- --run
npm run lint
npm run build
```

## API documentation

With the backend running locally, open [http://localhost:5000/api-docs](http://localhost:5000/api-docs).

The deployed API reference is available through [Production Swagger UI](https://campusfind-backend-k16o.onrender.com/api-docs).

## Security

- Passwords are hashed with bcryptjs rather than stored as plain text.
- JWT-protected requests validate the current user account in MongoDB.
- Backend middleware enforces role and account-status restrictions.
- Pending or rejected staff accounts cannot log in.
- The backend uses input validation, CORS configuration, Helmet, rate limiting, and centralized error handling.
- Keep `.env` files, JWT secrets, Cloudinary credentials, and test credentials out of version control.

## Release

The first published GitHub release is **[CampusFind v1.0.0](https://github.com/Aditya-Rajput-00/CampusFind/releases/tag/v1.0.0)**, published on November 12, 2026.

The `v1.0.0` tag identifies the first stable release. The current `main` branch contains later development work; changes after that tag are not represented by a newer published release unless another release is created.

## Project documentation

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — Architecture, modules, and implementation context.
- [CURRENT_TASK.md](CURRENT_TASK.md) — Current development status and next work.
- [CHANGELOG.md](CHANGELOG.md) — Project milestones and release history.
- [DECISIONS.md](DECISIONS.md) — Technical and architectural decisions.

## Contributing

Issues and suggestions are welcome. For code changes, describe the problem, keep changes focused, and include relevant tests. Open an issue before a large feature or architectural change so the intended approach can be discussed.

## Repository

[Aditya-Rajput-00/CampusFind](https://github.com/Aditya-Rajput-00/CampusFind)
