const MenuItem = require('../models/MenuItem');

exports.getAllMenuItems = async (req, res, next) => {
  try {
    const { category, isAvailable } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const items = await MenuItem.find(filter).sort('category name');

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

exports.getMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
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

exports.createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
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

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getPopularItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({ isAvailable: true })
      .sort('-orderCount')
      .limit(10);

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await MenuItem.distinct('category');

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
