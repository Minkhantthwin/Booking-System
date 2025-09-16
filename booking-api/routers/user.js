const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const userController = require('../controller/user');

// Registration
router.post('/register', userController.register);

// Login
router.post('/login', userController.login);

// Get all users (Admin & Staffs only)
router.get('/', auth(true), userController.getAllUsers);

// Profile
router.get('/profile', auth(true), userController.getProfile);
router.put('/profile', auth(true), userController.updateProfile);

// Delete user
router.delete('/:id', auth(true), userController.deleteUser);

module.exports = { userRouter: router };