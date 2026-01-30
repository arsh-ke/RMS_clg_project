const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const { emitToRole, emitToAll } = require('../config/socketio');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, orderType, date, paymentStatus } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const orders = await Order.find(filter)
      .populate('table', 'tableNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'tableNumber')
      .populate('createdBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { tableId, items, orderType, customerName, customerPhone, notes } = req.body;

    let table = null;
    let tableNumber = null;

    if (tableId) {
      table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }
      tableNumber = table.tableNumber;
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${item.menuItemId}`
        });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes
      });

      subtotal += menuItem.price * item.quantity;

      menuItem.orderCount += item.quantity;
      await menuItem.save();
    }

    const taxRate = 0.05;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const order = await Order.create({
      table: table?._id,
      tableNumber,
      items: orderItems,
      orderType: orderType || (table ? 'dine-in' : 'takeaway'),
      subtotal,
      tax,
      total,
      customerName,
      customerPhone,
      notes,
      createdBy: req.user.id
    });

    if (table) {
      table.status = 'occupied';
      table.currentOrder = order._id;
      await table.save();
    }

    const notification = await Notification.create({
      type: 'order_new',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} - ${table ? `Table ${tableNumber}` : 'Takeaway'} - ${items.length} items`,
      targetRoles: ['kitchen', 'manager'],
      relatedOrder: order._id,
      relatedTable: tableNumber
    });

    emitToRole('kitchen', 'new_order', {
      order,
      notification
    });
    emitToRole('manager', 'new_order', {
      order,
      notification
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (status === 'completed' && order.table) {
      const table = await Table.findById(order.table);
      if (table) {
        table.status = 'free';
        table.currentOrder = null;
        await table.save();
      }
    }

    const statusMessages = {
      preparing: 'Order is being prepared',
      ready: 'Order is ready for serving',
      served: 'Order has been served',
      completed: 'Order completed',
      cancelled: 'Order has been cancelled'
    };

    const targetRoles = {
      preparing: ['staff', 'manager'],
      ready: ['staff', 'manager'],
      served: ['kitchen', 'manager'],
      completed: ['kitchen', 'manager', 'staff'],
      cancelled: ['kitchen', 'manager', 'staff']
    };

    if (statusMessages[status]) {
      const notification = await Notification.create({
        type: 'order_update',
        title: `Order Status: ${status.toUpperCase()}`,
        message: `${statusMessages[status]} - Order #${order.orderNumber}${order.tableNumber ? ` (Table ${order.tableNumber})` : ''}`,
        targetRoles: targetRoles[status] || ['manager'],
        relatedOrder: order._id,
        relatedTable: order.tableNumber
      });

      emitToAll('order_update', {
        order,
        notification,
        previousStatus
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderPayment = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, discount } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (discount !== undefined) {
      order.discount = discount;
      order.total = order.subtotal + order.tax - discount;
    }

    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    if (paymentStatus === 'paid') {
      const notification = await Notification.create({
        type: 'payment',
        title: 'Payment Received',
        message: `Payment of ₹${order.total.toFixed(2)} received for Order #${order.orderNumber}`,
        targetRoles: ['manager', 'admin'],
        relatedOrder: order._id
      });

      emitToRole('manager', 'payment_received', { order, notification });
      emitToRole('admin', 'payment_received', { order, notification });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getKitchenOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'preparing', 'ready'] }
    })
      .populate('table', 'tableNumber')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodayOrders = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay }
    })
      .populate('table', 'tableNumber')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
