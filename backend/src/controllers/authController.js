const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '30m'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    console.log(`[AUTH] Register attempt for email: ${email}, name: ${name}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn(`[AUTH] Register failed - Email already exists: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if any admin exists - first user can register as admin
    const adminExists = await User.findOne({ role: 'admin' });
    
    // If admin exists and someone tries to register as admin, deny
    if (adminExists && role === 'admin') {
      console.warn(`[AUTH] Register failed - Admin already exists, preventing new admin creation`);
      return res.status(403).json({
        success: false,
        message: 'Admin already exists. Only existing admin can create new admin users.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: adminExists ? 'staff' : (role || 'admin'), // First user becomes admin
      phone
    });

    console.log(`[AUTH] User registered successfully: ${user._id}, email: ${email}, role: ${user.role}`);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error(`[AUTH] Register error: ${error.message}`, error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log(`[AUTH] Login attempt for email: ${email}`);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.warn(`[AUTH] Login failed - User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`[AUTH] User found: ${user._id}, validating password...`);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`[AUTH] Login failed - Invalid password for user: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      console.warn(`[AUTH] Login failed - Account inactive for user: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    console.log(`[AUTH] Login successful for user: ${user._id}, email: ${email}`);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error(`[AUTH] Login error: ${error.message}`, error);
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    console.log(`[AUTH] Token refresh attempt`);

    if (!refreshToken) {
      console.warn(`[AUTH] Token refresh failed - No refresh token provided`);
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      console.warn(`[AUTH] Token refresh failed - Invalid token for user: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    console.log(`[AUTH] Token refreshed successfully for user: ${user._id}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error(`[AUTH] Token refresh error: ${error.message}`, error);
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    console.log(`[AUTH] Logout attempt for user: ${req.user.id}`);
    
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
      console.log(`[AUTH] User logged out successfully: ${user._id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error(`[AUTH] Logout error: ${error.message}`, error);
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    console.log(`[AUTH] Get user profile for: ${req.user.id}`);
    
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`[AUTH] Get user error: ${error.message}`, error);
    next(error);
  }
};
