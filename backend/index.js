const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
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

app.get('/api/test-smtp', async (req, res) => {
  const emailService = require('./utils/emailService');
  const result = await emailService.verifySMTP();
  if (result.success && req.query.send === 'true') {
    const sendResult = await emailService.sendTestEmail(req.query.to);
    return res.json({ smtpVerification: result, sendResult });
  }
  res.status(result.success ? 200 : 500).json(result);
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
  path.join(process.cwd(), 'public_html'),
  path.join(__dirname, '../frontend/dist'),
  path.join(process.cwd(), 'frontend/dist'),
];
const staticPath = possibleStaticPaths.find(p => fs.existsSync(p));

if (staticPath) {
  app.use(express.static(staticPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(staticPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send('Drizzle Drop Inn API v2 is running...');
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Write active port to a file so the PHP bridge can discover it
  const portFilePaths = [
    path.join(__dirname, '../public_html/.node_port'),
    path.join(process.cwd(), 'public_html/.node_port'),
    path.join(__dirname, '../.node_port'),
    path.join(process.cwd(), '.node_port'),
  ];
  portFilePaths.forEach(p => {
    try { fs.writeFileSync(p, String(PORT)); } catch (_) {}
  });
});
