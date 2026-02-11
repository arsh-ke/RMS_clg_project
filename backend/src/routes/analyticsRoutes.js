const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesReport,
  getTopSellingItems,
  getOrderStats,
  getCategoryRevenue,
  getHourlyAnalysis
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/top-items', getTopSellingItems);
router.get('/orders', getOrderStats);
router.get('/category-revenue', getCategoryRevenue);
router.get('/hourly', getHourlyAnalysis);

module.exports = router;
