const Notification = require('../models/Notification');

exports.getAllNotifications = async (req, res, next) => {
  try {
    const { type, isRead, limit = 50 } = req.query;
    const userRole = req.user.role;
    
    const filter = {
      $or: [
        { targetRoles: userRole },
        { targetUsers: req.user.id }
      ]
    };
    
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('relatedOrder', 'orderNumber tableNumber');

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.readBy.push({
      user: req.user.id,
      readAt: new Date()
    });
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    await Notification.updateMany(
      {
        $or: [
          { targetRoles: userRole },
          { targetUsers: req.user.id }
        ],
        isRead: false
      },
      {
        $set: { isRead: true },
        $push: { readBy: { user: req.user.id, readAt: new Date() } }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    const count = await Notification.countDocuments({
      $or: [
        { targetRoles: userRole },
        { targetUsers: req.user.id }
      ],
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.clearOldNotifications = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} old notifications cleared`
    });
  } catch (error) {
    next(error);
  }
};
