const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  getTableStats
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getTableStats);

router.route('/')
  .get(getAllTables)
  .post(authorize('admin', 'manager'), createTable);

router.route('/:id')
  .get(getTable)
  .put(authorize('admin','manager'), updateTable)
  .delete(authorize('admin', 'manager'), deleteTable);

router.put('/:id/status', updateTableStatus);

module.exports = router;
