const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, generateUPIQR } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/upi-qr/:orderId', generateUPIQR);

module.exports = router;