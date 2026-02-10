const db = require('../config/db');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority, dueDate } = req.body;
  const { tenantId } = req.user;

  try {
    // 1. Verify Project belongs to THIS tenant
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Project not found in your organization' });
    }

    // 2. Create Task
    const newTask = await db.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, assigned_to, priority, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [projectId, tenantId, title, description, assignedTo, priority, dueDate]
    );

    // 3. Audit Log
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, req.user.userId, 'CREATE_TASK', 'task', newTask.rows[0].id]
    );

    res.status(201).json({ success: true, data: { task: newTask.rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getTasksByProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;

  try {
    // Ensure project belongs to tenant
    const projectCheck = await db.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Project not found in your organization' });
    }

    const tasks = await db.query(
      `SELECT t.*, u.full_name as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1 AND t.tenant_id = $2
       ORDER BY t.created_at DESC`,
      [projectId, tenantId]
    );

    res.json({ success: true, data: { tasks: tasks.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, dueDate, assignedTo } = req.body;
  const { tenantId } = req.user;

  try {
    const existing = await db.query('SELECT id, project_id FROM tasks WHERE id = $1 AND tenant_id = $2', [taskId, tenantId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found for your tenant' });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (title) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (priority) {
      fields.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (dueDate) {
      fields.push(`due_date = $${idx++}`);
      values.push(dueDate);
    }
    if (assignedTo !== undefined) {
      fields.push(`assigned_to = $${idx++}`);
      values.push(assignedTo || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(taskId);

    const updated = await db.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, req.user.userId, 'UPDATE_TASK', 'task', taskId]
    );

    res.json({ success: true, data: { task: updated.rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const { tenantId, userId } = req.user;

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const existing = await db.query('SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2', [taskId, tenantId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updated = await db.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, userId, 'UPDATE_TASK_STATUS', 'task', taskId]
    );

    res.json({ success: true, data: { task: updated.rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.deleteTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { tenantId } = req.user;

  try {
    const existing = await db.query('SELECT id, project_id FROM tasks WHERE id = $1 AND tenant_id = $2', [taskId, tenantId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found for your tenant' });
    }

    if (projectId && existing.rows[0].project_id !== projectId) {
      return res.status(403).json({ success: false, message: 'Task does not belong to this project' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    // Audit Log
    await db.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, userId, 'DELETE_TASK', 'task', taskId]
    );

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

