/**
 * EXAMPLE: Using System Settings in Order Billing Logic
 * 
 * This file demonstrates how to integrate SystemSettings into
 * existing business logic (e.g., billing, inventory, notifications)
 * 
 * BACKEND EXAMPLE: Integration in orderController.js
 */

// ============================================
// ORIGINAL CODE (HARDCODED VALUES)
// ============================================

/*
const taxRate = 0.05;  // ❌ HARDCODED
const tax = subtotal * taxRate;
const total = subtotal + tax;
*/

// ============================================
// REFACTORED CODE (USING SYSTEM SETTINGS)
// ============================================

// At the top of orderController.js, add:
const SystemSettings = require('../models/SystemSettings');

// In your order creation function, replace hardcoded values:
exports.createOrder = async (req, res, next) => {
  try {
    const { items, table, customerName, customerPhone, orderType, notes } = req.body;

    // ✅ FETCH SETTINGS FROM DATABASE
    const settings = await SystemSettings.findOne();
    const taxPercent = settings?.financial?.taxPercent || 0;
    const serviceChargePercent = settings?.financial?.serviceChargePercent || 0;
    const autoCompleteAfterPayment = settings?.orders?.autoCompleteAfterPayment ?? true;

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

    // ✅ USE SETTINGS FOR TAX & SERVICE CHARGE CALCULATION
    const taxAmount = subtotal * (taxPercent / 100);
    const serviceCharge = subtotal * (serviceChargePercent / 100);
    const total = subtotal + taxAmount + serviceCharge;

    const order = await Order.create({
      table: table?._id,
      tableNumber,
      items: orderItems,
      orderType: orderType || (table ? 'dine-in' : 'takeaway'),
      subtotal,
      tax: taxAmount,
      serviceCharge,
      total,
      customerName,
      customerPhone,
      notes,
      createdBy: req.user.id
    });

    // Emit socket notification
    emitToRole('kitchen', 'new-order', {
      orderId: order._id,
      items: orderItems,
      tableNumber: order.tableNumber,
      priority: order.priority
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// FRONTEND EXAMPLE: Using Settings in React
// ============================================

// EXAMPLE CODE - COMMENTED OUT FOR REFERENCE:
// 
// import useSettingsHook from '../hooks/useSettingsHook';
// 
// function BillingComponent() {
//   const {
//     getTaxPercent,
//     getServiceChargePercent,
//     isAutoCompleteAfterPayment,
//     getCurrency
//   } = useSettingsHook();
// 
//   const calculateTotal = (subtotal) => {
//     const tax = subtotal * (getTaxPercent() / 100);
//     const serviceCharge = subtotal * (getServiceChargePercent() / 100);
//     return {
//       subtotal,
//       tax,
//       serviceCharge,
//       total: subtotal + tax + serviceCharge,
//       currency: getCurrency()
//     };
//   };
// 
//   const handlePayment = async () => {
//     if (isAutoCompleteAfterPayment()) {
//       await updateOrderStatus(orderId, 'completed');
//     }
//   };
// 
//   return (
//     <div>
//       <p>Subtotal: ₹{calculateTotal(1000).subtotal}</p>
//       <p>Tax ({getTaxPercent()}%): ₹{calculateTotal(1000).tax}</p>
//       <p>Service Charge ({getServiceChargePercent()}%): ₹{calculateTotal(1000).serviceCharge}</p>
//       <p>Total: ₹{calculateTotal(1000).total}</p>
//     </div>
//   );
// }

// ============================================
// NOTIFICATION INTEGRATION EXAMPLE
// ============================================

// EXAMPLE CODE - COMMENTED OUT FOR REFERENCE:
//
// In notificationController.js:
//
// const SystemSettings = require('../models/SystemSettings');
// 
// exports.sendKitchenNotification = async (req, res) => {
//   try {
//     const settings = await SystemSettings.findOne();
//     const kitchenSoundEnabled = settings?.notifications?.kitchenSoundEnabled;
//     const kitchenSoundVolume = settings?.notifications?.kitchenSoundVolume || 80;
// 
//     emitToRole('kitchen', 'sound-alert', {
//       enabled: kitchenSoundEnabled,
//       volume: kitchenSoundVolume,
//       type: 'new_order'
//     });
// 
//     res.status(200).json({
//       success: true,
//       message: 'Kitchen notification sent'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error sending notification',
//       error: error.message
//     });
//   }
// };

// ============================================
// INVENTORY INTEGRATION EXAMPLE
// ============================================

// EXAMPLE CODE - COMMENTED OUT FOR REFERENCE:
//
// In inventoryController.js:
//
// const SystemSettings = require('../models/SystemSettings');
// 
// exports.checkInventory = async (req, res) => {
//   try {
//     const settings = await SystemSettings.findOne();
//     const lowStockThreshold = settings?.inventory?.defaultLowStockThreshold || 10;
//     const autoDeductEnabled = settings?.inventory?.autoInventoryDeductionEnabled;
// 
//     const inventory = await Inventory.find();
//     
//     const lowStockItems = inventory.filter(item => item.quantity < lowStockThreshold);
// 
//     if (autoDeductEnabled) {
//       // Auto-deduct logic here
//     }
// 
//     if (lowStockItems.length > 0) {
//       emitToRole('admin', 'low-stock-alert', {
//         items: lowStockItems,
//         threshold: lowStockThreshold
//       });
//     }
// 
//     res.status(200).json({
//       success: true,
//       data: { lowStockItems, threshold: lowStockThreshold }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error checking inventory',
//       error: error.message
//     });
//   }
// };

module.exports = {
  description: 'Example integration patterns for System Settings',
  usage: 'Reference these patterns when integrating settings into your modules'
};
