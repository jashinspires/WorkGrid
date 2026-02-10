# Database Migrations and Seeds

This directory contains all database schema migrations and seed data for the Multi-Tenant SaaS Platform.

## Migration Files

Migrations are executed in numerical order during Docker container startup:

### 001_create_tenants.sql
Creates the `tenants` table to store organization/company information.

**Columns:**
- `id` (UUID, PK): Unique tenant identifier
- `name` (VARCHAR): Organization name
- `subdomain` (VARCHAR, UNIQUE): Unique subdomain (e.g., "acme")
- `status` (ENUM): active, suspended, trial, cancelled
- `subscription_plan` (ENUM): free, pro, enterprise
- `max_users` (INTEGER): Maximum users allowed
- `max_projects` (INTEGER): Maximum projects allowed
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_tenants_subdomain` on subdomain
- `idx_tenants_status` on status
- `idx_tenants_subscription_plan` on subscription_plan

**Triggers:**
- Auto-update `updated_at` on row modification

### 002_create_users.sql
Creates the `users` table to store user accounts.

**Columns:**
- `id` (UUID, PK): Unique user identifier
- `tenant_id` (UUID, FK): References tenants(id)
- `email` (VARCHAR): User email
- `password_hash` (VARCHAR): bcrypt hashed password
- `full_name` (VARCHAR): User's full name
- `role` (ENUM): super_admin, tenant_admin, user
- `created_at`, `updated_at` (TIMESTAMP)

**Constraints:**
- UNIQUE(tenant_id, email): Email unique per tenant
- Foreign key to tenants with CASCADE delete

### 003_create_projects.sql
Creates the `projects` table to store project information.

**Columns:**
- `id` (UUID, PK): Unique project identifier
- `tenant_id` (UUID, FK): References tenants(id)
- `name` (VARCHAR): Project name
- `description` (TEXT): Project description
- `status` (ENUM): active, archived, completed
- `created_by` (UUID, FK): References users(id)
- `created_at`, `updated_at` (TIMESTAMP)

**Constraints:**
- Foreign keys with CASCADE delete for tenant_id
- Foreign key to users for created_by

### 004_create_tasks.sql
Creates the `tasks` table to store task information.

**Columns:**
- `id` (UUID, PK): Unique task identifier
- `tenant_id` (UUID, FK): References tenants(id)
- `project_id` (UUID, FK): References projects(id)
- `title` (VARCHAR): Task title
- `description` (TEXT): Task description
- `status` (ENUM): todo, in_progress, blocked, done
- `priority` (ENUM): low, medium, high, urgent
- `assigned_to` (UUID, FK): References users(id), nullable
- `due_date` (DATE): Optional due date
- `created_at`, `updated_at` (TIMESTAMP)

**Constraints:**
- Foreign keys with CASCADE delete for project_id
- Foreign key with SET NULL for assigned_to

### 005_create_audit_logs.sql
Creates the `audit_logs` table for compliance and debugging.

**Columns:**
- `id` (UUID, PK): Unique log identifier
- `tenant_id` (UUID, FK): References tenants(id)
- `user_id` (UUID, FK): References users(id), nullable
- `action` (VARCHAR): Action performed (e.g., CREATE_PROJECT)
- `entity_type` (VARCHAR): Type of entity (e.g., project, task)
- `entity_id` (UUID): ID of affected entity
- `ip_address` (VARCHAR): User's IP address
- `user_agent` (TEXT): User's browser/client
- `metadata` (JSONB): Additional context
- `created_at` (TIMESTAMP)

**Indexes:**
- Composite index on (tenant_id, created_at) for efficient queries
- Individual indexes on action, entity_type, user_id

### 006_seed_data.sql
Loads initial test data for development and evaluation.

**Seed Data Includes:**
- 1 Super Admin user
- 1 Demo tenant (Pro plan)
- 1 Tenant Admin for demo tenant
- 2 Regular users for demo tenant
- 2 Sample projects
- 2 Sample tasks

## Seed Data Directory

The `seeds/` directory contains additional seed data files:

- `seed_data.sql`: Copy of 006_seed_data.sql for evaluator compatibility

## Automatic Execution

Migrations are automatically executed when the Docker container starts via the `docker-compose.yml` configuration:

```yaml
database:
  volumes:
    - ./database:/docker-entrypoint-initdb.d
```

All `.sql` files in the `/docker-entrypoint-initdb.d` directory are executed in alphabetical order on first container startup.

## Manual Execution

To manually run migrations:

```bash
# Connect to database
docker exec -it database psql -U saas_user -d saas_db

# Run specific migration
\i /docker-entrypoint-initdb.d/001_create_tenants.sql
```

## Rollback

To rollback all migrations:

```bash
# Stop containers and remove volumes
docker-compose down -v

# Restart (migrations will run again)
docker-compose up -d
```

## Testing Migrations

To test migrations locally:

```bash
# Start fresh database
docker-compose down -v
docker-compose up -d database

# Wait for database to be ready
docker-compose logs database

# Verify tables created
docker exec -it database psql -U saas_user -d saas_db -c "\dt"
```

## Schema Verification

To verify the schema matches the specification:

```bash
# Check tenants table
docker exec -it database psql -U saas_user -d saas_db -c "\d tenants"

# Check all tables
docker exec -it database psql -U saas_user -d saas_db -c "\d+"
```

## Tenant Isolation

All tenant-scoped tables include a `tenant_id` column:
- `users`
- `projects`
- `tasks`
- `audit_logs`

Every query MUST include `WHERE tenant_id = $1` to enforce data isolation.

## Performance Considerations

- All foreign key columns are indexed
- Composite indexes on (tenant_id, id) for tenant-scoped queries
- Timestamps indexed for time-based queries
- ENUM types used for status fields to ensure data integrity

## Security

- UUID primary keys prevent enumeration attacks
- Password hashes use bcrypt (never plain text)
- Foreign keys with CASCADE delete ensure referential integrity
- CHECK constraints validate data at database level
- Audit logs track all important actions
