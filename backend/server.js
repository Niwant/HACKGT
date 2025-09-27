const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database');
    
    // Test database connection with a simple query
    const result = await executeQuery('SELECT 1 as test');
    
    res.json({
      message: 'Database connection successful!',
      test: result[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Coverage endpoint
app.get('/api/coverage', async (req, res) => {
  try {
    const { patientId, rxcui } = req.query;
    if (!patientId || !rxcui) {
      return res.status(400).json({ error: 'patientId and rxcui are required' });
    }

    const { executeQuery } = require('./config/database');
    
    const sql = `
      SELECT dpc.PATIENT_ID, dpc.RXCUI, dpc.TIER,
             dpc.REQUIRES_PA, dpc.REQUIRES_ST, dpc.REQUIRES_QL,
             dpc.QUANTITY_LIMIT_AMOUNT, dpc.QUANTITY_LIMIT_DAYS
      FROM v_drug_plan_coverage dpc
      WHERE dpc.PATIENT_ID = ? AND dpc.RXCUI = ?
      LIMIT 1
    `;
    
    const rows = await executeQuery(sql, [patientId, rxcui]);
    
    if (rows.length === 0) {
      return res.json({ covered: false });
    }
    
    const r = rows[0];
    res.json({
      covered: true,
      tier: r.TIER,
      priorAuthorization: r.REQUIRES_PA === 'Y',
      stepTherapy: r.REQUIRES_ST === 'Y',
      quantityLimit: r.REQUIRES_QL === 'Y',
      quantityLimitAmount: r.QUANTITY_LIMIT_AMOUNT,
      quantityLimitDays: r.QUANTITY_LIMIT_DAYS,
    });
  } catch (error) {
    console.error('Coverage endpoint error:', error);
    res.status(500).json({ error: 'internal' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HACKGT Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/api/test',
      dbTest: '/api/db-test',
      coverage: '/api/coverage?patientId=...&rxcui=...'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry found';
    error.status = 400;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record not found';
    error.status = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  } else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Validation errors
  if (err.isJoi) {
    error.message = err.details[0].message;
    error.status = 400;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Database connection failed, but server will start anyway');
    }

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
