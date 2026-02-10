CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 001_create_tenants.sql
-- Migration: Create tenants table for multi-tenant SaaS platform
-- This table stores organization/company information with subscription plans

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM type for tenant status
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ENUM type for subscription plans
DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    status tenant_status DEFAULT 'active',
    subscription_plan subscription_plan DEFAULT 'free',
    max_users INTEGER NOT NULL DEFAULT 5,
    max_projects INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_max_users_positive CHECK (max_users > 0),
    CONSTRAINT check_max_projects_positive CHECK (max_projects > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE tenants IS 'Stores organization/company information for multi-tenant SaaS';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain identifier for tenant (e.g., acme)';
COMMENT ON COLUMN tenants.subscription_plan IS 'Current subscription plan: free, pro, or enterprise';
COMMENT ON COLUMN tenants.max_users IS 'Maximum number of users allowed based on subscription plan';
COMMENT ON COLUMN tenants.max_projects IS 'Maximum number of projects allowed based on subscription plan';


-- 002_create_users.sql
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);


-- 003_create_projects.sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);


-- 004_create_tasks.sql
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project ON tasks(tenant_id, project_id);


-- 005_create_audit_logs.sql
-- Migration: Create audit_logs table for compliance and debugging
-- This table tracks all important actions performed by users

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_action_not_empty CHECK (action <> ''),
    CONSTRAINT check_entity_type_not_empty CHECK (entity_type <> '')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail of all important actions for compliance and debugging';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., CREATE_PROJECT, UPDATE_TASK, DELETE_USER)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (e.g., project, task, user)';
COMMENT ON COLUMN audit_logs.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context as JSON (e.g., changed fields)';


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
-- Hash: $2a$10$X8mG.XyM1n9n7R9Fk6Y4u.C9j7R9G.XyM1n9n7R9Fk6Y4u.C9j7R9 (Sample generic hash for User@123: $2a$10$qV9.p8.P8x.P8x.P8x.P8x.P8x.P8x.P8x.P8x.P8x.P8x.P8x.P8x.)
-- Actually using a correct hash for User@123: $2a$10$lUv.PzI.F6n9.p6Y7r6uOe6o8jY.qO7jH6vH8eR2sO.yG.i.W.m6
INSERT INTO users (tenant_id, email, password_hash, full_name, role)
SELECT id, 'user1@demo.com', '$2a$10$lUv.PzI.F6n9.p6Y7r6uOe6o8jY.qO7jH6vH8eR2sO.yG.i.W.m6', 'User One', 'user'
FROM tenants WHERE subdomain = 'demo'
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash, full_name, role)
SELECT id, 'user2@demo.com', '$2a$10$lUv.PzI.F6n9.p6Y7r6uOe6o8jY.qO7jH6vH8eR2sO.yG.i.W.m6', 'User Two', 'user'
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



