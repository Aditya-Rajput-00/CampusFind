# CampusFind

**A Campus Lost & Found Management System**

CampusFind is a full-stack web application designed to help students and staff report lost or found belongings, submit claims, manage item matches, and receive notifications.

## Features

- **User Authentication:** Secure login and registration using JWT authentication.
- **Lost & Found Reporting:** Report lost or found items.
- **Claim Management:** Submit and manage claims for reported items.
- **Item Matching:** Manage matches between lost and found reports.
- **Notifications:** Receive updates about relevant activities.
- **Role-Based Access:** Separate access for students, staff, and administrators.
- **Staff Approval:** Administrators can review staff registrations.
- **Image Storage:** Cloudinary integration for item images.
- **API Documentation:** Swagger/OpenAPI documentation.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite 8, JavaScript, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Security | Helmet, Express Rate Limit, Express Validator |
| Image Storage | Cloudinary |
| API Documentation | Swagger / OpenAPI |
| Frontend Testing | Vitest, React Testing Library, ESLint |
| Backend Testing | Node.js Test Runner |

## Project Structure

```text
CampusFind/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── docs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── PROJECT_CONTEXT.md
├── CURRENT_TASK.md
├── CHANGELOG.md
└── DECISIONS.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Aditya-Rajput-00/CampusFind.git
cd CampusFind
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file by copying `.env.example`.

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update the values in `backend/.env`:

- `PORT`
- `CLIENT_URL`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- Cloudinary credentials

Never commit your real `.env` file or expose its secrets.

### 3. Start the Backend

From `CampusFind/backend`:

```bash
npm run dev
```

The backend uses `http://localhost:5000` by default.

### 4. Configure and Start the Frontend

Open another terminal at the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend uses the local Vite proxy for `/api` requests by default.

For a separately configured API server, set `VITE_API_URL` to the appropriate API base URL in the frontend environment.

### 5. Open the Application

Use the local URL printed by Vite in your terminal.

## Testing

### Backend

From `CampusFind/backend`:

```bash
npm test
```

### Frontend

From `CampusFind/frontend`:

```bash
npm test
npm run lint
npm run build
```

## API Documentation

When the backend is running, Swagger documentation is available at:

`http://localhost:5000/api-docs`

## Deployment Architecture

The project deployment architecture uses:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Image Storage:** Cloudinary

Backend production URL:

https://campusfind-backend-k16o.onrender.com

Deployment availability and configuration may change; verify live services before relying on them.

## Security Notes

- Keep environment variables and API credentials private.
- Use a strong, unique JWT secret.
- Do not commit `.env` files.
- Public registration is restricted to student and staff roles.
- Staff accounts require administrator approval.
- Protected requests validate the current user account against the database.

## Project Documentation

- `PROJECT_CONTEXT.md` — Project architecture and context.
- `CURRENT_TASK.md` — Current development and roadmap position.
- `CHANGELOG.md` — Development history.
- `DECISIONS.md` — Technical decisions.

## Release

**Planned First Release:** `v1.0.0`

[View GitHub Releases](https://github.com/Aditya-Rajput-00/CampusFind/releases)

## Repository

https://github.com/Aditya-Rajput-00/CampusFind