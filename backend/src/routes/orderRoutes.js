const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  getKitchenOrders,
  getTodayOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { orderValidation } = require('../middleware/validators');

router.use(protect);

router.get('/kitchen', authorize('kitchen', 'manager', 'admin'), getKitchenOrders);
router.get('/today', getTodayOrders);

router.route('/')
  .get(getAllOrders)
  .post(authorize('staff', 'manager', 'admin'), orderValidation, createOrder);

router.route('/:id')
  .get(getOrder);

router.put('/:id/status', authorize('kitchen', 'staff', 'manager', 'admin'), updateOrderStatus);
router.put('/:id/payment', authorize('staff', 'manager', 'admin'), updateOrderPayment);

module.exports = router;
