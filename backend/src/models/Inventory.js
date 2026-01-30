const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['vegetables', 'meat', 'dairy', 'spices', 'beverages', 'grains', 'oils', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'pieces', 'packets'],
    default: 'kg'
  },
  minThreshold: {
    type: Number,
    default: 10
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  dailyUsage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minThreshold;
});

inventorySchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Inventory', inventorySchema);
