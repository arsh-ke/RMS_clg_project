const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.warn(`[MIDDLEWARE] Protection failed - No token provided for route: ${req.path}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    console.log(`[MIDDLEWARE] Verifying token for route: ${req.path}`);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      console.warn(`[MIDDLEWARE] Protection failed - User not found or inactive for ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    console.log(`[MIDDLEWARE] Token verified successfully for user: ${user._id}`);
    req.user = user;
    next();
  } catch (error) {
    console.error(`[MIDDLEWARE] Auth error: ${error.message}`, error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
