const express = require('express');
const router = express.Router();
const { generateQRCode, createGuestOrder } = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/auth');

// Public endpoint for guest QR orders
router.post('/order', createGuestOrder);

// Admin endpoint to generate QR for a table
router.get('/generate/:tableId', protect, authorize('admin', 'manager'), generateQRCode);

module.exports = router;
