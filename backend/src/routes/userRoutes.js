const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getAllUsers)
  .post(authorize('admin'), createUser);

router.route('/password')
  .put(updatePassword);

router.route('/:id')
  .get(authorize('admin', 'manager'), getUser)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;
