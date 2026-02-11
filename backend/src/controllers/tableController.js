const Table = require('../models/Table');

exports.getAllTables = async (req, res, next) => {
  try {
    const { status, location } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (location) filter.location = location;

    const tables = await Table.find(filter)
      .populate('currentOrder')
      .sort('tableNumber');

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    next(error);
  }
};

exports.getTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate('currentOrder');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

exports.createTable = async (req, res, next) => {
  try {
    const table = await Table.create(req.body);

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    next(error);
  }
};

exports.getTableStats = async (req, res, next) => {
  try {
    const stats = await Table.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      free: 0,
      occupied: 0,
      reserved: 0,
      total: 0
    };

    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
