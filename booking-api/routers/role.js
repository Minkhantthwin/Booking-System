const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const roleController = require('../controller/role');

// Create role
router.post('/', auth(true), requireAdmin, roleController.createRole);

// List roles
router.get('/', auth(true), requireAdmin, roleController.listRoles);

// Get, update, delete role by ID
router.get('/:id', auth(true), requireAdmin, roleController.getRoleById);
router.put('/:id', auth(true), requireAdmin, roleController.updateRole);
router.delete('/:id', auth(true), requireAdmin, roleController.deleteRole);

module.exports = { roleRouter: router };