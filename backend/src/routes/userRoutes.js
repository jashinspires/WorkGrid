const express = require('express');
const router = express.Router();
const { updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// User update and delete routes (creation/listing is under /api/tenants/:tenantId/users)
// PUT /api/users/:userId
// DELETE /api/users/:userId
router.put('/:userId', authenticate, updateUser);
router.delete('/:userId', authenticate, authorize(['tenant_admin', 'super_admin']), deleteUser);

module.exports = router;
