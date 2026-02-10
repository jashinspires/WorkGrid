// Handles user management operations

const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.addUser = async (req, res) => {
    const { tenantId } = req.params;
    const { email, password, fullName, role = 'user' } = req.body;
    const { tenantId: adminTenantId, role: adminRole } = req.user;

    if (adminRole !== 'tenant_admin' || tenantId !== adminTenantId) {
        return res.status(403).json({ success: false, message: 'Only tenant_admin can add users' });
    }

    try {
        // Check limits
        const tenantRes = await db.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
        const currentUsersRes = await db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);

        if (parseInt(currentUsersRes.rows[0].count) >= tenantRes.rows[0].max_users) {
            return res.status(403).json({ success: false, message: 'Subscription limit reached' });
        }

        // Email unique per tenant
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email.toLowerCase(), tenantId]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await db.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, tenant_id, is_active, created_at',
            [tenantId, email.toLowerCase(), passwordHash, fullName, role]
        );

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
            [tenantId, req.user.userId, 'CREATE_USER', 'user', newUser.rows[0].id]
        );

        res.status(201).json({ success: true, message: 'User created successfully', data: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.listTenantUsers = async (req, res) => {
    const { tenantId } = req.params;
    const { search, role, page = 1, limit = 50 } = req.query;
    const { tenantId: userTenantId, role: userRole } = req.user;

    if (userRole !== 'super_admin' && tenantId !== userTenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
        let values = [tenantId];
        let index = 2;

        if (search) {
            query += ` AND (full_name ILIKE $${index} OR email ILIKE $${index})`;
            values.push(`%${search}%`);
            index++;
        }

        if (role) {
            query += ` AND role = $${index}`;
            values.push(role);
            index++;
        }

        const totalRes = await db.query(`SELECT COUNT(*) FROM users WHERE tenant_id = $1 ${search ? 'AND (full_name ILIKE $2 OR email ILIKE $2)' : ''} ${role ? (search ? 'AND role = $3' : 'AND role = $2') : ''}`, values.slice(0, index - 1));
        const totalUsers = parseInt(totalRes.rows[0].count);

        query += ` ORDER BY created_at DESC LIMIT $${index++} OFFSET $${index++}`;
        values.push(limit, offset);

        const users = await db.query(query, values);

        res.json({
            success: true,
            data: {
                users: users.rows,
                total: totalUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / limit),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const { userId: currentUserId, tenantId: currentTenantId, role: currentUserRole } = req.user;

    try {
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const user = userRes.rows[0];

        if (currentUserRole !== 'super_admin' && user.tenant_id !== currentTenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        if (currentUserId !== userId && currentUserRole !== 'tenant_admin' && currentUserRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        let updateFields = [];
        let values = [];
        let index = 1;

        if (fullName) {
            updateFields.push(`full_name = $${index++}`);
            values.push(fullName);
        }

        if ((currentUserRole === 'tenant_admin' || currentUserRole === 'super_admin') && role) {
            updateFields.push(`role = $${index++}`);
            values.push(role);
        }

        if ((currentUserRole === 'tenant_admin' || currentUserRole === 'super_admin') && isActive !== undefined) {
            updateFields.push(`is_active = $${index++}`);
            values.push(isActive);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(userId);
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index} RETURNING id, email, full_name, role, is_active, updated_at`;
        const updatedUser = await db.query(updateQuery, values);

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
            [user.tenant_id, currentUserId, 'UPDATE_USER', 'user', userId]
        );

        res.json({ success: true, message: 'User updated successfully', data: updatedUser.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    const { userId: currentUserId, tenantId: currentTenantId, role: currentUserRole } = req.user;

    if (userId === currentUserId) return res.status(403).json({ success: false, message: 'Cannot delete yourself' });

    try {
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const user = userRes.rows[0];

        if (currentUserRole !== 'super_admin' && (currentUserRole !== 'tenant_admin' || user.tenant_id !== currentTenantId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
            [user.tenant_id, currentUserId, 'DELETE_USER', 'user', userId]
        );

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
