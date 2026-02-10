const express = require('express');
const router = express.Router();
const { getTenantDetails, updateTenant, listAllTenants } = require('../controllers/tenantController');
const { addUser, listTenantUsers } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Tenant management
router.get('/', authenticate, authorize(['tenant_admin', 'super_admin']), listAllTenants);
router.get('/:tenantId', authenticate, getTenantDetails);
router.put('/:tenantId', authenticate, authorize(['tenant_admin', 'super_admin']), updateTenant);

// User creation and listing (nested under tenants as per spec)
// POST /api/tenants/:tenantId/users
// GET /api/tenants/:tenantId/users
router.post('/:tenantId/users', authenticate, authorize(['tenant_admin', 'super_admin']), addUser);
router.get('/:tenantId/users', authenticate, listTenantUsers);

module.exports = router;
