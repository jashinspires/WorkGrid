-- Save this as manual_add_project.sql
-- Usage: Execute in your database tool or via docker-compose

-- 1. Increase project limit if needed
UPDATE tenants 
SET max_projects = 50 
WHERE subdomain = 'demo';

-- 2. Manually insert a project (replacing placeholders)
INSERT INTO projects (name, description, tenant_id, created_by)
SELECT 'Manual Project', 'Created via SQl', t.id, u.id
FROM tenants t, users u
WHERE t.subdomain = 'demo' 
AND u.email = 'admin@demo.com';
