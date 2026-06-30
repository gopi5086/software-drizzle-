const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.get('/dashboard-stats', auth, reportController.getDashboardStats);
router.get('/recent-activity', auth, reportController.getRecentActivity);
router.get('/finance', auth, reportController.getFinanceOverview);
router.get('/invoices', auth, reportController.getInvoices);
router.get('/analytics', auth, reportController.getReportsData);
router.get('/staff-revenue', auth, reportController.getStaffRevenueReport);

module.exports = router;
