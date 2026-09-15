# Plan Grid — Project Management Tool

A Jira-like project management tool built with Node.js, React, PostgreSQL and MongoDB.

## Stack

- **Frontend** (`client/`): React 18, Vite, TypeScript, Tailwind CSS, Redux Toolkit, @hello-pangea/dnd
- **Backend** (`server/`): Node.js, Express, TypeScript, Prisma (PostgreSQL), Mongoose (MongoDB activity log), Socket.io
- **DBs**: PostgreSQL (source of truth) + MongoDB (audit/activity log)

## Quick start

### 1. Databases

PostgreSQL and MongoDB are required. The project is configured to work with hosted DBs
(Neon, MongoDB Atlas) or any local install — credentials are read from `server/.env`
(see `server/.env.example`).

### 2. Backend

```bash
cd server
npm install
cp .env.example .env     # set DATABASE_URL, MONGODB_URI, JWT_SECRET
npx prisma migrate dev   # create schema
npm run prisma:seed      # optional demo data
npm run dev              # http://localhost:3001
```

### 3. Frontend

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

## Demo credentials

Seed script creates: `demo@example.com` / `demo1234`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` (server) | API with hot reload |
| `npm run dev` (client) | Vite dev server |
| `npm run build` (client) | Production build |
| `npx prisma migrate dev` | Apply DB migrations |
| `npm run prisma:seed` | Load demo data |

## API overview

| Group | Base path |
|-------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Projects | `/api/projects` |
| Issues | `/api/projects/:projectId/issues` |
| Sprints | `/api/projects/:projectId/sprints` |
| Activity | `/api/activity/...` |

## Deployment (separate client & server)

### Server (API) — Node host (Render/Railway/Fly/VPS)
Point the host at the `server/` directory. It should run `npm install` and `npm start`
(the start script compiles TypeScript to `dist/` and runs it).

Env vars to set:
| Variable | Example |
|----------|---------|
| `DATABASE_URL` | your Neon/Postgres URL |
| `MONGODB_URI` | your MongoDB URL |
| `JWT_SECRET` | long random string |
| `CLIENT_URL` | deployed client origin, e.g. `https://plan-grid.app` (used for CORS) |
| `PORT` | `3001` |

On first deploy run `npx prisma db push` (or `npx prisma migrate deploy`) once against the DB.

### Client (SPA) — static hosting (Vercel/Netlify/S3)
```bash
cd client
npm run build        # outputs dist/
```
Upload/point `dist/` at your static host.

Env var to set at build time:
| Variable | Example |
|----------|---------|
| `VITE_API_URL` | deployed API origin, e.g. `https://api.plan-grid.com` |

Set the rebuild trigger after the server is live, then test `https://<client>/api/health` from the browser DevTools Network tab (the API should respond with `{ ok: true }`).

## Project structure

```
├── client/                  # React frontend
│   └── src/
│       ├── components/      # board, issue, layout, common
│       ├── pages/           # auth, dashboard, projects, board, backlog
│       ├── store/           # Redux Toolkit slices
│       └── services/        # API client
├── server/                  # Node.js backend
│   └── src/
│       ├── controllers/     # auth, project, issue, sprint, activity
│       ├── routes/          # express routers
│       ├── middleware/      # JWT auth + project access control
│       ├── services/        # activity logging
│       └── models/          # Mongoose schemas
```