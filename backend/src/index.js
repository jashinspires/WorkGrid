require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health Check (Mandatory requirement)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, status: 'UP', database: 'Connected' });
  } catch (err) {
    res.status(500).json({ success: false, status: 'DOWN', database: 'Disconnected' });
  }
});

// Authentication routes
app.use('/api/auth', require('./routes/authRoutes'));

// Tenant routes (includes user creation/listing under /api/tenants/:tenantId/users)
app.use('/api/tenants', require('./routes/tenantRoutes'));

// User routes (update/delete only - creation/listing is under tenants)
app.use('/api/users', require('./routes/userRoutes'));

// Project routes (includes task creation/listing under /api/projects/:projectId/tasks)
app.use('/api/projects', require('./routes/projectRoutes'));

// Task routes (update/delete only - creation/listing is under projects)
app.use('/api/tasks', require('./routes/taskRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
