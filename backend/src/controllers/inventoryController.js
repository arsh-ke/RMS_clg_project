const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const { emitToRole } = require('../config/socketio');

exports.getAllInventory = async (req, res, next) => {
  try {
    const { category, lowStock } = req.query;
    const filter = {};
    
    if (category) filter.category = category;

    let items = await Inventory.find(filter).sort('category name');

    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.minThreshold);
    }

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.createInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.restockItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    item.quantity += quantity;
    item.lastRestocked = new Date();
    await item.save();

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.getLowStockItems = async (req, res, next) => {
  try {
    const items = await Inventory.find();
    const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

exports.checkAndAlertLowStock = async (req, res, next) => {
  try {
    const items = await Inventory.find();
    const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);

    if (lowStockItems.length > 0) {
      const itemNames = lowStockItems.map(i => i.name).join(', ');
      
      const notification = await Notification.create({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${lowStockItems.length} items are running low: ${itemNames}`,
        targetRoles: ['admin', 'manager']
      });

      emitToRole('admin', 'low_stock_alert', { items: lowStockItems, notification });
      emitToRole('manager', 'low_stock_alert', { items: lowStockItems, notification });
    }

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryStats = async (req, res, next) => {
  try {
    const items = await Inventory.find();
    
    const stats = {
      totalItems: items.length,
      lowStockCount: items.filter(i => i.quantity <= i.minThreshold).length,
      totalValue: items.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0),
      categoryBreakdown: {}
    };

    items.forEach(item => {
      if (!stats.categoryBreakdown[item.category]) {
        stats.categoryBreakdown[item.category] = {
          count: 0,
          value: 0
        };
      }
      stats.categoryBreakdown[item.category].count++;
      stats.categoryBreakdown[item.category].value += item.quantity * item.costPerUnit;
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
