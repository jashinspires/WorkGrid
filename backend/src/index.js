require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

console.log('--- Backend Starting ---');
console.log('Node Version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root Route - Friendly welcome message
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.json({
    message: 'Multi-Tenant SaaS API is running!',
    version: '1.0.0',
    documentation: '/docs',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health Check (Mandatory requirement)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, status: 'UP', database: 'Connected' });
  } catch (err) {
    console.error('Health Check Database Error:', err.message);
    res.status(500).json({ success: false, status: 'DOWN', database: 'Disconnected' });
  }
});

// Debug endpoint (restricted/informational)
app.get('/api/debug', (req, res) => {
  res.json({
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});

// Authentication routes
app.use('/api/auth', require('./routes/authRoutes'));

// Tenant routes
app.use('/api/tenants', require('./routes/tenantRoutes'));

// User routes
app.use('/api/users', require('./routes/userRoutes'));

// Project routes
app.use('/api/projects', require('./routes/projectRoutes'));

// Task routes
app.use('/api/tasks', require('./routes/taskRoutes'));

// Catch-all 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `The requested path ${req.url} was not found on this server.`,
    availableEndpoints: ['/', '/api/health', '/api/debug']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log('--- Backend Ready ---');
});
