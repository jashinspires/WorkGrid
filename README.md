# WorkGrid

A project and task management system where multiple organizations share one application — but never each other's data.

---

## The Core Problem

Imagine you're building a task management tool. One company signs up, then another, then fifty more. The naive approach is to spin up a separate copy of the application for each one. That works until it doesn't — costs multiply, maintenance becomes a nightmare, and you're left managing fifty slightly different deployments.

The better idea? **Multi-tenancy.** A single running application serves all organizations, but at the data layer, each one is completely walled off from the others. Company A's projects, tasks, and team members are invisible to Company B, even though they live in the same database. The mechanism is deceptively simple: every row in every table carries a `tenant_id`, and every query filters by it. No exceptions.

This project implements exactly that.

---

## What It Does

At its core, this is a **project and task management platform** — think a simplified Jira or Trello. But the interesting part isn't the task management itself. It's the isolation layer underneath.

**Three levels of access:**

| Role | Scope | Can do |
|------|-------|--------|
| **Super Admin** | Platform-wide | View all tenants and their stats |
| **Tenant Admin** | Their organization | Manage team members, create/delete projects |
| **User** | Their organization | View projects, create/update tasks |

**The key guarantee:** A tenant admin from Organization A cannot — through the UI, through the API, or through URL manipulation — access anything belonging to Organization B. The backend enforces this on every single request by extracting the `tenant_id` from the JWT and filtering all database queries through it.

---

## Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   React SPA │────▶│  Express REST API    │────▶│  PostgreSQL  │
│  Port 3000  │     │     Port 5000        │     │  Port 5432   │
└─────────────┘     │                      │     └──────────────┘
                    │  JWT Authentication   │
                    │  RBAC Middleware      │
                    │  Tenant Isolation    │
                    └─────────────────────┘
```

**Frontend:** React 18 with React Router. Context API handles authentication state. No external UI libraries — the styling is hand-written CSS.

**Backend:** Node.js + Express. Every protected route passes through JWT verification middleware, which decodes the token and attaches `tenantId`, `userId`, and `role` to the request object. Controllers then use `tenant_id` in all database queries — this is where isolation actually happens.

**Database:** PostgreSQL 15. Five core tables — `tenants`, `users`, `projects`, `tasks`, `audit_logs` — all linked through `tenant_id`. Foreign keys with `ON DELETE CASCADE` ensure referential integrity when things get deleted.

**Infrastructure:** Docker Compose brings up all three services with a single command. The database initializes itself from SQL files in the `database/` directory (schema creation, constraints, seed data — in that order).

---

## Database Design

```
tenants
├── users (tenant_id FK)
├── projects (tenant_id FK, created_by FK → users)
│   └── tasks (project_id FK, tenant_id FK, assigned_to FK → users)
└── audit_logs (tenant_id FK, user_id FK)
```

The `tenant_id` column appears in every table that holds business data. This is the shared-schema multi-tenancy pattern — one database, one set of tables, isolation enforced by filtering. It's the most cost-effective approach for platforms that expect many small-to-medium tenants rather than a handful of enterprise ones.

Subscription plans (`free`, `pro`, `enterprise`) enforce limits on how many users and projects a tenant can create. The check happens at the API level before any INSERT.

---

## Getting Started

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone <repository-url>
cd workgrid
docker compose up -d
```

That's it. Three containers start up:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:5000
- **PostgreSQL** → port 5432 (internal)

The database seeds itself with a demo tenant and sample data on first run.

### Test Credentials

| Role | Subdomain | Email | Password |
|------|-----------|-------|----------|
| Super Admin | `system` | superadmin@system.com | Admin@123 |
| Tenant Admin | `demo` | admin@demo.com | Demo@123 |
| User | `demo` | user1@demo.com | User@123 |
| User | `demo` | user2@demo.com | User@123 |

You can also register an entirely new tenant from the registration page — it provisions a new isolated workspace immediately.

---

## API Overview

19 RESTful endpoints organized around five resource groups:

| Group | Endpoints | Auth Required |
|-------|-----------|---------------|
| **Auth** | Register tenant, Login, Get current user, Logout | Partial |
| **Tenants** | List all (super admin), Get details, Update | Yes |
| **Users** | List by tenant, Add user, Update, Delete | Yes |
| **Projects** | List, Create, Update, Delete | Yes |
| **Tasks** | List by project, Create, Update status, Update, Delete, Search | Yes |

Every response follows a consistent format:

```json
{
  "success": true,
  "message": "Description of what happened",
  "data": { ... }
}
```

Full endpoint documentation is in [docs/API.md](docs/API.md).

---

## Functional Requirements Covered

| ID | Requirement | Implementation |
|----|------------|----------------|
| FR-001 | Tenant registration with unique subdomain | `POST /api/auth/register-tenant` with subdomain uniqueness constraint |
| FR-002 | JWT authentication with 24h expiry | Token issued on login with `expiresIn: '24h'` |
| FR-003 | Plan-based limits on users and projects | Checked in controllers before creation |
| FR-004 | Tenant data isolation | `tenant_id` filtering on every query |
| FR-005 | Admin can add/delete users | Admin-only routes in user controller |
| FR-006 | Create projects within tenant | Project creation scoped to `tenant_id` |
| FR-007 | Assign tasks to team members | `assigned_to` field references users table |
| FR-008 | Update task status (Todo → In Progress → Done) | `PATCH /api/tasks/:id/status` |
| FR-009 | Audit logging for critical actions | `audit_logs` table, entries on login/create/delete |
| FR-010 | Super admin views all tenants | `GET /api/tenants` restricted to `super_admin` role |
| FR-011 | Standard JSON response format | Consistent `{ success, message, data }` wrapper |
| FR-012 | UI hides admin features for regular users | Role-based conditional rendering in React |
| FR-013 | Dashboard shows tenant statistics | Project count and task count from API |
| FR-014 | Cascade delete for related records | `ON DELETE CASCADE` on foreign keys |
| FR-015 | Search tasks by title | `ILIKE` query with `?search=` parameter |

---

## Security

- **Password hashing:** bcrypt with 10 salt rounds. No plaintext passwords touch the database.
- **JWT:** Signed tokens carrying `userId`, `tenantId`, and `role`. Verified on every protected route.
- **RBAC:** Three roles with strict permission boundaries. The middleware rejects requests before they reach the controller.
- **Tenant isolation:** Not just a frontend concern — the backend enforces `tenant_id` filtering on every database query, regardless of what the client sends.
- **Input validation:** Request bodies are validated before processing. SQL queries use parameterized statements to prevent injection.

---

## Project Structure

```
workgrid/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Auth, Project, Task, Tenant, User handlers
│   │   ├── middleware/         # JWT auth & role verification
│   │   ├── routes/             # Express route definitions
│   │   ├── config/             # Database connection pool
│   │   └── index.js            # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Login, Register, Dashboard, Projects, Users
│   │   ├── components/         # Layout, Navigation
│   │   ├── context/            # AuthContext (global state)
│   │   └── styles.css          # Application styles
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   ├── 005_create_audit_logs.sql
│   └── 006_seed_data.sql
├── docs/
│   ├── API.md                  # Endpoint documentation
│   ├── architecture.md         # System design & diagrams
│   ├── PRD.md                  # Product requirements
│   ├── research.md             # Multi-tenancy research & decisions
│   └── technical-spec.md       # Technical specification
├── docker-compose.yml
└── DEPLOYMENT_GUIDE.md
```

---

## Documentation

| Document | What's in it |
|----------|-------------|
| [API Documentation](docs/API.md) | Every endpoint with request/response examples |
| [Architecture](docs/architecture.md) | System design, component diagrams, data flow |
| [Product Requirements](docs/PRD.md) | User personas, functional & non-functional requirements |
| [Research](docs/research.md) | Multi-tenancy pattern analysis, tech stack evaluation, security considerations |
| [Technical Spec](docs/technical-spec.md) | Folder structure, setup guide, environment variables |
| [Deployment Guide](DEPLOYMENT_GUIDE.md) | Instructions for cloud deployment |

---

## What I Took Away From This

The most non-obvious thing about multi-tenancy is that the isolation is boring by design. There's no clever trick — it's a `WHERE tenant_id = $1` on every query, a `tenant_id` column on every table, and a middleware that sets that value from the JWT before anything else runs. The discipline of applying that pattern consistently across every controller, every route, every edge case — that's where the actual work is.

The second thing: getting Docker Compose to orchestrate three services with health checks and initialization order taught me more about infrastructure than any tutorial. The database has to be healthy before the backend starts, the backend has to be healthy before the frontend can talk to it, and the SQL files have to run in the right order or everything breaks silently.

Building the RBAC system also forced me to think about authorization differently. It's not enough to hide a button in the UI — the API has to reject the request independently, because anyone can open a browser console and send a fetch request.
