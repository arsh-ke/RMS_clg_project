const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');

// Sales Prediction using simple statistical analysis
exports.getSalesPrediction = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    // Get historical data
    const historicalDays = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    const historicalOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate averages and trends
    const totalDays = historicalOrders.length || 1;
    const avgDailyOrders = historicalOrders.reduce((sum, d) => sum + d.orders, 0) / totalDays;
    const avgDailyRevenue = historicalOrders.reduce((sum, d) => sum + d.revenue, 0) / totalDays;

    // Calculate day of week patterns
    const dayOfWeekStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          avgOrders: { $avg: 1 },
          avgRevenue: { $avg: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Simple trend calculation (last week vs previous week)
    const lastWeek = historicalOrders.slice(-7);
    const previousWeek = historicalOrders.slice(-14, -7);

    const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.revenue, 0) / (lastWeek.length || 1);
    const prevWeekAvg = previousWeek.reduce((sum, d) => sum + d.revenue, 0) / (previousWeek.length || 1);

    const trend = prevWeekAvg > 0 ? ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100 : 0;

    // Predict next 7 days
    const predictions = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const predDate = new Date(today);
      predDate.setDate(predDate.getDate() + i);
      
      const dayOfWeek = predDate.getDay() + 1;
      const dayStats = dayOfWeekStats.find(d => d._id === dayOfWeek);
      
      // Factor in trend and day of week patterns
      const dayMultiplier = dayStats ? (dayStats.count / (historicalOrders.length / 7)) : 1;
      const trendMultiplier = 1 + (trend / 100) * 0.1;
      
      predictions.push({
        date: predDate.toISOString().split('T')[0],
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][predDate.getDay()],
        predictedOrders: Math.round(avgDailyOrders * dayMultiplier * trendMultiplier),
        predictedRevenue: Math.round(avgDailyRevenue * dayMultiplier * trendMultiplier),
        confidence: Math.min(85 + historicalDays / 10, 95)
      });
    }

    // Monthly prediction
    const monthlyPrediction = {
      predictedOrders: Math.round(avgDailyOrders * 30 * (1 + trend / 1000)),
      predictedRevenue: Math.round(avgDailyRevenue * 30 * (1 + trend / 1000)),
      confidence: Math.min(75 + historicalDays / 15, 90)
    };

    res.status(200).json({
      success: true,
      data: {
        historicalAverage: {
          dailyOrders: Math.round(avgDailyOrders),
          dailyRevenue: Math.round(avgDailyRevenue)
        },
        trend: {
          percentage: Math.round(trend * 10) / 10,
          direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
        },
        dayOfWeekPatterns: dayOfWeekStats.map(d => ({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d._id - 1],
          avgOrders: Math.round(d.count / (historicalDays / 7))
        })),
        dailyPredictions: predictions,
        monthlyPrediction
      }
    });
  } catch (error) {
    next(error);
  }
};

// Smart Food Recommendations based on patterns
exports.getFoodRecommendations = async (req, res, next) => {
  try {
    const { tableId, orderItems = [] } = req.body;

    // Get frequently ordered combinations
    const frequentCombos = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$_id',
          items: { $push: '$items.menuItem' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items',
          frequency: { $sum: 1 }
        }
      },
      { $sort: { frequency: -1 } },
      { $limit: 20 }
    ]);

    // Get popular items by category
    const popularByCategory = await MenuItem.aggregate([
      { $match: { isAvailable: true } },
      {
        $group: {
          _id: '$category',
          items: {
            $push: {
              id: '$_id',
              name: '$name',
              price: '$price',
              orderCount: '$orderCount'
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          topItems: { $slice: [{ $sortArray: { input: '$items', sortBy: { orderCount: -1 } } }, 3] }
        }
      }
    ]);

    // Get trending items (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const trendingItems = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          count: { $sum: '$items.quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get complementary suggestions based on current order
    let complementaryItems = [];
    if (orderItems.length > 0) {
      // Find orders with similar items and get what else was ordered
      complementaryItems = await Order.aggregate([
        {
          $match: {
            'items.menuItem': { $in: orderItems.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) },
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.menuItem': { $nin: orderItems.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) }
          }
        },
        {
          $group: {
            _id: '$items.menuItem',
            name: { $first: '$items.name' },
            frequency: { $sum: 1 }
          }
        },
        { $sort: { frequency: -1 } },
        { $limit: 5 }
      ]);
    }

    // Time-based recommendations
    const currentHour = new Date().getHours();
    let timeBasedCategory = 'main-course';
    if (currentHour < 11) timeBasedCategory = 'starters';
    else if (currentHour >= 15 && currentHour < 18) timeBasedCategory = 'drinks';
    else if (currentHour >= 21) timeBasedCategory = 'desserts';

    const timeBasedRecommendations = await MenuItem.find({
      category: timeBasedCategory,
      isAvailable: true
    })
      .sort('-orderCount')
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        trending: trendingItems,
        popularByCategory: popularByCategory,
        complementary: complementaryItems,
        timeBasedSuggestions: {
          category: timeBasedCategory,
          reason: `Popular during this time of day`,
          items: timeBasedRecommendations
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Inventory Demand Forecasting
exports.getInventoryForecast = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;

    // Get all inventory items
    const inventoryItems = await Inventory.find();

    // Calculate average daily usage from order history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderVolume = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalQuantity: { $sum: '$items.quantity' }
        }
      }
    ]);

    // For each inventory item, calculate forecast
    const forecasts = inventoryItems.map(item => {
      const dailyUsage = item.dailyUsage || (item.quantity / 30);
      const forecastDays = parseInt(days);
      
      const projectedUsage = dailyUsage * forecastDays;
      const daysUntilEmpty = dailyUsage > 0 ? Math.floor(item.quantity / dailyUsage) : 999;
      
      let status = 'healthy';
      let urgency = 'low';
      
      if (daysUntilEmpty <= 3) {
        status = 'critical';
        urgency = 'high';
      } else if (daysUntilEmpty <= 7) {
        status = 'low';
        urgency = 'medium';
      } else if (daysUntilEmpty <= 14) {
        status = 'moderate';
        urgency = 'low';
      }

      const recommendedRestock = Math.ceil(dailyUsage * 14);

      return {
        id: item._id,
        name: item.name,
        category: item.category,
        currentStock: item.quantity,
        unit: item.unit,
        dailyUsage: Math.round(dailyUsage * 100) / 100,
        projectedUsage: Math.round(projectedUsage * 100) / 100,
        daysUntilEmpty: daysUntilEmpty > 365 ? '365+' : daysUntilEmpty,
        status,
        urgency,
        recommendedRestockQuantity: recommendedRestock,
        estimatedRestockDate: daysUntilEmpty <= 14 
          ? new Date(Date.now() + (daysUntilEmpty - 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null
      };
    });

    // Sort by urgency
    const sortedForecasts = forecasts.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    const criticalItems = sortedForecasts.filter(f => f.urgency === 'high');
    const warningItems = sortedForecasts.filter(f => f.urgency === 'medium');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: forecasts.length,
          criticalCount: criticalItems.length,
          warningCount: warningItems.length,
          healthyCount: forecasts.length - criticalItems.length - warningItems.length
        },
        criticalAlerts: criticalItems,
        warnings: warningItems,
        forecasts: sortedForecasts
      }
    });
  } catch (error) {
    next(error);
  }
};

// AI Assistant - Answer questions about restaurant data
exports.askAssistant = async (req, res, next) => {
  try {
    const { question } = req.body;
    const questionLower = question.toLowerCase();

    let response = {
      question,
      answer: '',
      data: null
    };

    // Today's sales
    if (questionLower.includes('today') && (questionLower.includes('sales') || questionLower.includes('revenue'))) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const orders = await Order.find({
        createdAt: { $gte: startOfToday },
        paymentStatus: 'paid'
      });

      const total = orders.reduce((sum, o) => sum + o.total, 0);
      response.answer = `Today's sales: ₹${total.toFixed(2)} from ${orders.length} orders`;
      response.data = { revenue: total, orderCount: orders.length };
    }
    // Low stock items
    else if (questionLower.includes('low') && questionLower.includes('stock')) {
      const items = await Inventory.find();
      const lowStock = items.filter(i => i.quantity <= i.minThreshold);

      response.answer = `${lowStock.length} items are low in stock: ${lowStock.map(i => i.name).join(', ')}`;
      response.data = lowStock;
    }
    // Top selling items
    else if (questionLower.includes('top') && (questionLower.includes('selling') || questionLower.includes('popular'))) {
      const topItems = await MenuItem.find({ isAvailable: true })
        .sort('-orderCount')
        .limit(5);

      response.answer = `Top 5 selling items: ${topItems.map((i, idx) => `${idx + 1}. ${i.name} (${i.orderCount} orders)`).join(', ')}`;
      response.data = topItems;
    }
    // Active orders
    else if (questionLower.includes('active') && questionLower.includes('order')) {
      const activeOrders = await Order.find({
        status: { $in: ['pending', 'preparing', 'ready'] }
      }).populate('table', 'tableNumber');

      response.answer = `There are ${activeOrders.length} active orders`;
      response.data = activeOrders;
    }
    // Table status
    else if (questionLower.includes('table') && (questionLower.includes('free') || questionLower.includes('available'))) {
      const Table = require('../models/Table');
      const freeTables = await Table.find({ status: 'free' });

      response.answer = `${freeTables.length} tables are currently free: Table ${freeTables.map(t => t.tableNumber).join(', ')}`;
      response.data = freeTables;
    }
    // Monthly revenue
    else if (questionLower.includes('month') && (questionLower.includes('sales') || questionLower.includes('revenue'))) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const orders = await Order.find({
        createdAt: { $gte: startOfMonth },
        paymentStatus: 'paid'
      });

      const total = orders.reduce((sum, o) => sum + o.total, 0);
      response.answer = `This month's revenue: ₹${total.toFixed(2)} from ${orders.length} orders`;
      response.data = { revenue: total, orderCount: orders.length };
    }
    // Default response
    else {
      response.answer = "I can help you with: today's sales, low stock items, top selling items, active orders, free tables, and monthly revenue. Try asking about any of these!";
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
};
