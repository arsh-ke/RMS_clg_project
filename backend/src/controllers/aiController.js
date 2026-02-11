const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const Table = require('../models/Table');

// Sales Prediction using simple statistical analysis (Rule-based AI in Node.js)
exports.getSalesPrediction = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const historicalDays = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    // Get historical orders
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      paymentStatus: 'paid'
    });

    // Group by date
    const dailyData = {};
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = { orders: 0, revenue: 0 };
      }
      dailyData[day].orders += 1;
      dailyData[day].revenue += order.total;
    });

    const totalDays = Object.keys(dailyData).length || 1;
    const avgDailyOrders = Object.values(dailyData).reduce((sum, d) => sum + d.orders, 0) / totalDays;
    const avgDailyRevenue = Object.values(dailyData).reduce((sum, d) => sum + d.revenue, 0) / totalDays;

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
          avgRevenue: { $avg: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate trend (last week vs previous week)
    const sortedDays = Object.keys(dailyData).sort();
    const lastWeek = sortedDays.slice(-7).map(d => dailyData[d]);
    const prevWeek = sortedDays.slice(-14, -7).map(d => dailyData[d]);

    const lastWeekAvg = lastWeek.reduce((sum, d) => sum + (d?.revenue || 0), 0) / (lastWeek.length || 1);
    const prevWeekAvg = prevWeek.reduce((sum, d) => sum + (d?.revenue || 0), 0) / (prevWeek.length || 1);

    const trend = prevWeekAvg > 0 ? ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100 : 0;

    // Generate 7-day predictions
    const predictions = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 1; i <= 7; i++) {
      const predDate = new Date(today);
      predDate.setDate(predDate.getDate() + i);
      
      const dayOfWeek = predDate.getDay() + 1;
      const dayStats = dayOfWeekStats.find(d => d._id === dayOfWeek);
      
      const dayMultiplier = dayStats ? (dayStats.count / (totalDays / 7)) : 1;
      const trendMultiplier = 1 + (trend / 100) * 0.1;

      predictions.push({
        date: predDate.toISOString().split('T')[0],
        dayOfWeek: dayNames[predDate.getDay()],
        predictedOrders: Math.round(avgDailyOrders * Math.max(dayMultiplier, 0.5) * trendMultiplier),
        predictedRevenue: Math.round(avgDailyRevenue * Math.max(dayMultiplier, 0.5) * trendMultiplier),
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
          day: dayNames[d._id - 1],
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

// Smart Food Recommendations based on patterns (Rule-based in Node.js)
exports.getFoodRecommendations = async (req, res, next) => {
  try {
    const { orderItems = [] } = req.body;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get trending items (last 7 days)
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

    // Get popular items by category
    const menuItems = await MenuItem.find({ isAvailable: true }).sort('-orderCount');
    
    const popularByCategory = {};
    menuItems.forEach(item => {
      const cat = item.category;
      if (!popularByCategory[cat]) {
        popularByCategory[cat] = [];
      }
      if (popularByCategory[cat].length < 3) {
        popularByCategory[cat].push(item);
      }
    });

    const popularByCategoryArray = Object.entries(popularByCategory).map(([category, topItems]) => ({
      category,
      topItems
    }));

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
        popularByCategory: popularByCategoryArray,
        complementary: [],
        timeBasedSuggestions: {
          category: timeBasedCategory,
          reason: 'Popular during this time of day',
          items: timeBasedRecommendations
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Inventory Demand Forecasting (Rule-based in Node.js)
exports.getInventoryForecast = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const forecastDays = parseInt(days);

    const inventoryItems = await Inventory.find();

    const forecasts = inventoryItems.map(item => {
      const dailyUsage = item.dailyUsage || (item.quantity / 30);
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
        id: item._id.toString(),
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
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    forecasts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    const criticalItems = forecasts.filter(f => f.urgency === 'high');
    const warningItems = forecasts.filter(f => f.urgency === 'medium');

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
        forecasts
      }
    });
  } catch (error) {
    next(error);
  }
};

// AI Assistant - Answer questions about restaurant data (Rule-based in Node.js)
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

      const names = lowStock.slice(0, 5).map(i => i.name).join(', ');
      response.answer = `${lowStock.length} items are low in stock: ${names}`;
      response.data = lowStock;
    }
    // Top selling items
    else if (questionLower.includes('top') && (questionLower.includes('selling') || questionLower.includes('popular'))) {
      const topItems = await MenuItem.find({ isAvailable: true })
        .sort('-orderCount')
        .limit(5);

      const itemList = topItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.orderCount} orders)`).join(', ');
      response.answer = `Top 5 selling items: ${itemList}`;
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
      const freeTables = await Table.find({ status: 'free' });

      const tableNums = freeTables.map(t => t.tableNumber).join(', ');
      response.answer = `${freeTables.length} tables are currently free: Table ${tableNums}`;
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
