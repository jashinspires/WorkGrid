const db = require('../config/db');

exports.getTenantDetails = async (req, res) => {
    const { tenantId } = req.params;
    const { role, tenantId: userTenantId } = req.user;

    // Authorization: User must belong to this tenant OR be super_admin
    if (role !== 'super_admin' && tenantId !== userTenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    try {
        const tenantRes = await db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const tenant = tenantRes.rows[0];

        // Calculate stats
        const userCount = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const projectCount = await db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const taskCount = await db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]);

        res.json({
            success: true,
            data: {
                tenant: {
                    ...tenant,
                    stats: {
                        totalUsers: parseInt(userCount.rows[0].count),
                        totalProjects: parseInt(projectCount.rows[0].count),
                        totalTasks: parseInt(taskCount.rows[0].count)
                    }
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
    const { role, tenantId: userTenantId } = req.user;

    if (role !== 'super_admin' && tenantId !== userTenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    try {
        let updateFields = [];
        let values = [];
        let index = 1;

        if (name) {
            updateFields.push(`name = $${index++}`);
            values.push(name);
        }

        if (role === 'super_admin') {
            if (status) {
                updateFields.push(`status = $${index++}`);
                values.push(status);
            }
            if (subscriptionPlan) {
                updateFields.push(`subscription_plan = $${index++}`);
                values.push(subscriptionPlan);
            }
            if (maxUsers) {
                updateFields.push(`max_users = $${index++}`);
                values.push(maxUsers);
            }
            if (maxProjects) {
                updateFields.push(`max_projects = $${index++}`);
                values.push(maxProjects);
            }
        } else if (status || subscriptionPlan || maxUsers || maxProjects) {
            return res.status(403).json({ success: false, message: 'Only super_admin can update restricted fields' });
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(tenantId);
        const updateQuery = `UPDATE tenants SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index} RETURNING *`;
        const updatedTenant = await db.query(updateQuery, values);

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
            [userTenantId || tenantId, req.user.userId, 'UPDATE_TENANT', 'tenant', tenantId]
        );

        res.json({ success: true, message: 'Tenant updated successfully', data: updatedTenant.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.listAllTenants = async (req, res) => {
    const { role, tenantId: userTenantId } = req.user;
    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT t.*, 
            (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
            (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects
            FROM tenants t
            WHERE 1=1
        `;
        let values = [];
        let index = 1;

        // If not super_admin, only show their own tenant
        if (role !== 'super_admin') {
            query += ` AND t.id = $${index++}`;
            values.push(userTenantId);
        }

        if (status) {
            query += ` AND t.status = $${index++}`;
            values.push(status);
        }
        if (subscriptionPlan) {
            query += ` AND t.subscription_plan = $${index++}`;
            values.push(subscriptionPlan);
        }

        const totalRes = await db.query(`SELECT COUNT(*) FROM tenants WHERE 1=1 ${status ? 'AND status = $1' : ''}`, status ? [status] : []);
        const totalTenants = parseInt(totalRes.rows[0].count);

        query += ` ORDER BY t.created_at DESC LIMIT $${index++} OFFSET $${index++}`;
        values.push(limit, offset);

        const tenants = await db.query(query, values);

        res.json({
            success: true,
            data: {
                tenants: tenants.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalTenants / limit),
                    totalTenants,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
