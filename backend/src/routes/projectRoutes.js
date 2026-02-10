const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { createTask, getTasksByProject } = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// Project CRUD
router.post('/', authenticate, createProject);
router.get('/', authenticate, getProjects);
router.put('/:projectId', authenticate, updateProject);
router.delete('/:projectId', authenticate, deleteProject);

// Task creation and listing (nested under projects as per spec)
// POST /api/projects/:projectId/tasks
// GET /api/projects/:projectId/tasks
router.post('/:projectId/tasks', authenticate, createTask);
router.get('/:projectId/tasks', authenticate, getTasksByProject);

module.exports = router;
