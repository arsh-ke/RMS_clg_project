const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const QRCode = require('qrcode');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Notification = require('../models/Notification');
const { emitToRole } = require('../config/socket');

exports.createOrder = async (req, res, next) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env and restart the server.'
      });
    }

    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency: 'INR',
      receipt: `order_${order.orderNumber}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update order with razorpay order id
    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env and restart the server.'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    // Find order by razorpay order id
    const order = await Order.findOne({ 'payment.razorpayOrderId': razorpay_order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      // Payment failed
      order.payment.status = 'failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Payment successful
    order.payment.status = 'paid';
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'paid';
    order.paymentMethod = 'online';
    order.status = 'completed';
    await order.save();

    // Free the table if it was a dine-in order
    if (order.table) {
      const table = await Table.findById(order.table);
      if (table) {
        table.status = 'free';
        table.currentOrder = null;
        await table.save();
      }
    }

    // Create payment notification
    await Notification.create({
      type: 'payment',
      title: 'Payment Received',
      message: `Online payment of ₹${order.total.toFixed(2)} received for Order #${order.orderNumber}`,
      targetRoles: ['manager', 'admin'],
      relatedOrder: order._id
    });

    emitToRole('manager', 'payment_received', { order });
    emitToRole('admin', 'payment_received', { order });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: { orderId: order._id }
    });
  } catch (error) {
    next(error);
  }
};

exports.generateUPIQR = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    const upiId = process.env.UPI_MERCHANT_ID;
    const merchantName = process.env.MERCHANT_NAME || 'Restaurant';

    if (!upiId || upiId === 'your-upi-id@upi') {
      return res.status(500).json({
        success: false,
        message: 'UPI merchant ID not configured properly. Please set a valid UPI ID in backend .env (e.g., merchant@paytm)'
      });
    }

    // Validate UPI ID format
    if (!upiId.includes('@')) {
      return res.status(500).json({
        success: false,
        message: 'Invalid UPI ID format. UPI ID should be in format: username@upi_provider'
      });
    }

    // Calculate final amount after discount
    const discount = req.body.discount || 0;
    const finalAmount = Math.max(0, order.total - discount);

    if (finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${finalAmount.toFixed(2)}&cu=INR&tn=Order%20${order.orderNumber}`;

    // Generate QR code from UPI link
    const qrCodeDataUrl = await QRCode.toDataURL(upiLink, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update order with UPI details
    order.payment.upiId = upiId;
    order.payment.upiAmount = finalAmount;
    order.payment.upiTransactionNote = `Order ${order.orderNumber}`;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        upiLink: upiLink,
        amount: finalAmount,
        orderNumber: order.orderNumber,
        upiId: upiId,
        merchantName: merchantName
      }
    });
  } catch (error) {
    next(error);
  }
};