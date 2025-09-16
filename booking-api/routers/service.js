const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const serviceController = require('../controller/service');

// Create service
router.post('/', auth(true), serviceController.createService);

// Get all services
router.get('/', auth(true), serviceController.getAllServices);

// Get service by ID
router.get('/:id', auth(true), serviceController.getServiceById);

// Update service
router.put('/:id', auth(true), serviceController.updateService);

// Delete service
router.delete('/:id', auth(true), serviceController.deleteService);


module.exports = { serviceRouter: router };