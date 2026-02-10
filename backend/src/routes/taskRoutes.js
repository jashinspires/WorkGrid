const express = require('express');
const router = express.Router();
const { updateTask, updateTaskStatus } = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// All task routes require authentication
router.use(authenticate);

// Task update routes (creation/listing is under /api/projects/:projectId/tasks)
// PATCH /api/tasks/:taskId/status
// PUT /api/tasks/:taskId
router.patch('/:taskId/status', updateTaskStatus);
router.put('/:taskId', updateTask);

module.exports = router;
