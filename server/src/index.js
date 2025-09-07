const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Database
const sequelize = require('../config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const { authenticateToken } = require('../middleware/auth');

const PORT = process.env.PORT || 5000;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Echelon API is running!', timestamp: new Date().toISOString() });
});

// Auth routes
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);
// Employee routes
const employeeRoutes = require('../routes/employees');
app.use('/api/employees', authenticateToken, employeeRoutes);
// Admin routes
const adminRoutes = require('../routes/admin');
app.use('/api/admin', authenticateToken, adminRoutes);

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../client/build');
  
  console.log('Serving static files from:', buildPath);
  
  // Serve static files
  app.use(express.static(buildPath));
  
  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Echelon API - Development Mode' });
  });
}

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Sync database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'production') {
        const buildPath = path.join(__dirname, '../../client/build');
        console.log('Static files path:', buildPath);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();