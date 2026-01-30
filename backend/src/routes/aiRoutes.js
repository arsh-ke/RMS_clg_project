const express = require('express');
const router = express.Router();
const {
  getSalesPrediction,
  getFoodRecommendations,
  getInventoryForecast,
  askAssistant
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/sales-prediction', authorize('admin', 'manager'), getSalesPrediction);
router.post('/food-recommendations', getFoodRecommendations);
router.get('/inventory-forecast', authorize('admin', 'manager'), getInventoryForecast);
router.post('/assistant', authorize('admin', 'manager'), askAssistant);

module.exports = router;
