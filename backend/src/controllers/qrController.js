const QRCode = require('qrcode');
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const { emitToRole } = require('../config/socket');

exports.generateQRCode = async (req, res, next) => {
  try {
    const { tableId } = req.params; 

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const url = `${process.env.FRONTEND_URL || ''}/menu?table=${table._id}`;
    const dataUrl = await QRCode.toDataURL(url);

    res.status(200).json({ success: true, data: { url, qrcode: dataUrl } });
  } catch (error) {
    next(error);
  }
};

exports.createGuestOrder = async (req, res, next) => {
  try {
    const { tableId, items, customerName, customerPhone, notes } = req.body;

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'tableId is required' });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item not found: ${item.menuItemId}` });
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
      table: table._id,
      tableNumber: table.tableNumber,
      items: orderItems,
      orderType: 'dine-in',
      orderSource: 'QR',
      subtotal,
      tax,
      total,
      customerName,
      customerPhone,
      notes
    });

    table.status = 'occupied';
    table.currentOrder = order._id;
    await table.save();

    await Notification.create({
      type: 'order_new',
      title: 'New QR Order',
      message: `QR Order #${order.orderNumber} - Table ${table.tableNumber} - ${items.length} items`,
      targetRoles: ['kitchen', 'manager'],
      relatedOrder: order._id,
      relatedTable: table.tableNumber
    });

    emitToRole('kitchen', 'new_order', order);
    emitToRole('manager', 'new_order', order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
