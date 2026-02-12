-- seed_data.sql

-- 1. Super Admin (Password: Admin@123)
-- Hash generated via bcrypt (10 rounds)
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES ('superadmin@system.com', '$2a$10$K.lPUDpiqyctW2mfEkwRVO3YPVr0l61ZZGJ0TxkxB8aVwQNMjNdna', 'System Admin', 'super_admin', NULL)
ON CONFLICT DO NOTHING;

-- 2. Demo Tenant
INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES ('Demo Company', 'demo', 'active', 'pro', 25, 15)
ON CONFLICT (subdomain) DO NOTHING;

-- 3. Demo Tenant Admin (Password: Demo@123)
INSERT INTO users (tenant_id, email, password_hash, full_name, role)
SELECT id, 'admin@demo.com', '$2a$10$OnZIit9Pfl7Yf4FoF5OAW.ii9HNGmfTHl48DaTVJ.7diqgGVRK/EW', 'Demo Admin', 'tenant_admin'
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

-- 4. Regular Users (Password: User@123)
INSERT INTO users (tenant_id, email, password_hash, full_name, role)
SELECT id, 'user1@demo.com', '$2a$10$LLFEEeHLYL8XKZ5UTPUk/.L1vifQ/lvOr8mZV8nR5RvHyeFW0k0Qy', 'User One', 'user'
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash, full_name, role)
SELECT id, 'user2@demo.com', '$2a$10$LLFEEeHLYL8XKZ5UTPUk/.L1vifQ/lvOr8mZV8nR5RvHyeFW0k0Qy', 'User Two', 'user'
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

-- 5. Sample Projects
INSERT INTO projects (tenant_id, name, description, status, created_by)
SELECT t.id, 'Project Alpha', 'First demo project', 'active', u.id
FROM tenants t, users u 
WHERE t.subdomain = 'demo' AND u.email = 'admin@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO projects (tenant_id, name, description, status, created_by)
SELECT t.id, 'Project Beta', 'Second demo project', 'active', u.id
FROM tenants t, users u 
WHERE t.subdomain = 'demo' AND u.email = 'admin@demo.com'
ON CONFLICT DO NOTHING;

-- 6. Sample Tasks
INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to)
SELECT p.id, t.id, 'Setup environment', 'Initial setup for project alpha', 'todo', 'high', u.id
FROM projects p, tenants t, users u 
WHERE t.subdomain = 'demo' AND p.name = 'Project Alpha' AND u.email = 'user1@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to)
SELECT p.id, t.id, 'Design UI', 'Create mockups', 'in_progress', 'medium', u.id
FROM projects p, tenants t, users u 
WHERE t.subdomain = 'demo' AND p.name = 'Project Alpha' AND u.email = 'user2@demo.com'
ON CONFLICT DO NOTHING;
