const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getPopularItems,
  getCategories
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { menuItemValidation } = require('../middleware/validators');

router.use(protect);

router.get('/popular', getPopularItems);
router.get('/categories', getCategories);

router.route('/')
  .get(getAllMenuItems)
  .post(authorize('admin', 'manager'), menuItemValidation, createMenuItem);

router.route('/:id')
  .get(getMenuItem)
  .put(authorize('admin', 'manager'), updateMenuItem)
  .delete(authorize('admin', 'manager'), deleteMenuItem);

module.exports = router;
