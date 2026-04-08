const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'staff', 'kitchen']).withMessage('Invalid role'),
  validate
];

const menuItemValidation = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').isIn(['veg', 'non-veg', 'drinks', 'desserts', 'starters', 'main-course']).withMessage('Invalid category'),
  body('recipe').optional().isArray().withMessage('Recipe must be an array'),
  body('recipe.*.inventoryItem').optional().isMongoId().withMessage('Invalid inventory item ID'),
  body('recipe.*.quantity').optional().isNumeric().withMessage('Recipe quantity must be a number'),
  validate
];

const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('orderType').optional().isIn(['dine-in', 'takeaway']).withMessage('Invalid order type'),
  validate
];

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  menuItemValidation,
  orderValidation
};
