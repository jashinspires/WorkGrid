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
