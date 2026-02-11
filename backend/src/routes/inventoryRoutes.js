const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockItem,
  getLowStockItems,
  checkAndAlertLowStock,
  getInventoryStats
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/low-stock', getLowStockItems);
router.get('/stats', authorize('admin', 'manager'), getInventoryStats);
router.post('/check-alerts', authorize('admin', 'manager'), checkAndAlertLowStock);

router.route('/')
  .get(getAllInventory)
  .post(authorize('admin', 'manager'), createInventoryItem);

router.route('/:id')
  .get(getInventoryItem)
  .put(authorize('admin', 'manager'), updateInventoryItem)
  .delete(authorize('admin', 'manager'), deleteInventoryItem);

router.put('/:id/restock', authorize('admin', 'manager'), restockItem);

module.exports = router;
