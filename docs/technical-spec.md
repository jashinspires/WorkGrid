# Technical Specification

## 1. Folder Structure

```text
/
├── backend/
│   ├── src/
│   │   ├── controllers/      (Request handlers for Auth, Tenants, Users, Projects, Tasks)
│   │   ├── middleware/       (Auth, TenantIsolation, Validation, Error handling)
│   │   ├── models/           (PostgreSQL queries / data-access layer)
│   │   ├── routes/           (Route definitions mapping URLs to controllers)
│   │   └── index.js          (Backend entry point)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       (Reusable UI components: forms, tables, modals, navbar)
│   │   ├── pages/            (Register, Login, Dashboard, Projects, Project Details, Users)
│   │   └── context/          (AuthContext and other shared state)
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql              (Schema creation, migrations, and seed data)
└── docker-compose.yml        (Database + Backend + Frontend services)

## 2. Backend Overview
Node.js + Express backend exposing REST APIs for Auth, Tenants, Users, Projects, and Tasks.

Uses PostgreSQL as the primary database, with all tenant-scoped tables including a tenant_id column for isolation.

Middleware layers handle JWT authentication, role-based authorization, and automatic tenant_id filtering per request.

## 3. Frontend Overview
React-based SPA consuming the backend APIs for registration, login, dashboard, projects, tasks, and user management.

Uses an AuthContext (or similar state) to store JWT token, current user, and tenant information, and to protect routes.


## 4. Development Setup Guide
Prerequisites: Node.js, Docker, Docker Compose, and a PostgreSQL client (optional).

Environment variables:

Backend .env: database connection values, JWT_SECRET, PORT, FRONTEND_URL.

Frontend .env: REACT_APP_API_URL pointing to the backend API base URL.

Local run (without Docker):

Install backend dependencies: cd backend && npm install.

Install frontend dependencies: cd frontend && npm install.

Start backend: npm run dev (port 5000).

Start frontend: npm start or npm run dev (port 3000).

Docker run:

From project root: docker-compose up -d to start database, backend, and frontend containers.

Access frontend at http://localhost:3000 and backend health check at http://localhost:5000/api/health.