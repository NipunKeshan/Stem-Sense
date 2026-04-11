const express = require('express');
const router = express.Router();
const { login, getUsers, createUser, updateUserPermissions, getMe } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.route('/users')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);
router.route('/users/:id/permissions')
  .put(protect, admin, updateUserPermissions);

module.exports = router;
