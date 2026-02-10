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
