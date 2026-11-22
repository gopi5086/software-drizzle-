const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { initDB } = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(morgan('dev'));

// Database Initialization
initDB();

// Test & Health Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Drizzle Drop Inn Backend is online',
    timestamp: new Date().toISOString()
  });
});

// Import API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));

// Serve static frontend if present (for single-server hosting on Hostinger / VPS)
const possibleStaticPaths = [
  path.join(__dirname, '../public_html'),
  path.join(__dirname, 'public_html'),
  path.join(__dirname, '../frontend/dist'),
];
const staticPath = possibleStaticPaths.find(p => fs.existsSync(p));

if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Drizzle Drop Inn API v2 is running...');
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
