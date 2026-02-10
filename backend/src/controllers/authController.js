// Handles user authentication and token generation
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PLAN_LIMITS = {
  free: { max_users: 5, max_projects: 3 },
  pro: { max_users: 25, max_projects: 15 },
  enterprise: { max_users: 100, max_projects: 100 },
};

exports.registerTenant = async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName, plan = 'free' } = req.body;

  if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const normalizedPlan = PLAN_LIMITS[plan] ? plan : 'free';
  const limits = PLAN_LIMITS[normalizedPlan];
  const tenantSubdomain = subdomain.toLowerCase();

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Prevent duplicate subdomains
    const existingTenant = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
    if (existingTenant.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Subdomain already taken' });
    }

    // Create tenant
    const tenantInsert = await client.query(
      `INSERT INTO tenants (name, subdomain, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantName, tenantSubdomain, normalizedPlan, limits.max_users, limits.max_projects]
    );
    const tenant = tenantInsert.rows[0];

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const userInsert = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenant.id, adminEmail.toLowerCase(), passwordHash, adminFullName, 'tenant_admin']
    );
    const user = userInsert.rows[0];

    // Audit
    await client.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenant.id, user.id, 'REGISTER_TENANT', 'tenant', tenant.id]
    );

    await client.query('COMMIT');

    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, plan: tenant.subscription_plan },
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: tenant.id },
        token,
        expiresIn: 86400,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  try {
    // 1. Verify Tenant
    const tenantRes = await db.query('SELECT * FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
    if (tenantRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const tenant = tenantRes.rows[0];

    // 2. Verify User
    const userRes = await db.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenant.id]);
    if (userRes.rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = userRes.rows[0];

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // 4. Generate Token
    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: user.tenant_id },
        token,
        expiresIn: 86400,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  const { userId } = req.user;
  try {
    const userRes = await db.query(
      `SELECT u.id, u.email, u.full_name as "fullName", u.role, u.is_active as "isActive", u.tenant_id as "tenantId",
      t.name as "tenantName", t.subdomain, t.subscription_plan as "subscriptionPlan", t.max_users as "maxUsers", t.max_projects as "maxProjects"
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const row = userRes.rows[0];
    const data = {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
      isActive: row.isActive,
      tenant: row.tenantId ? {
        id: row.tenantId,
        name: row.tenantName,
        subdomain: row.subdomain,
        subscriptionPlan: row.subscriptionPlan,
        maxUsers: row.maxUsers,
        maxProjects: row.maxProjects
      } : null
    };

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  // If JWT only, we just return success. Client side will delete token.
  // We can also log the logout action.
  try {
    const { userId, tenantId } = req.user;
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type) VALUES ($1, $2, $3, $4)',
      [tenantId, userId, 'LOGOUT', 'user']
    );
    res.json({ success: true, message: 'Logged out successfully...!' });
  } catch (err) {
    res.json({ success: true, message: 'Logged out successfully (audit failed)' });
  }
};

