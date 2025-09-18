const express = require('express');
const router = express.Router();
const { auth, requirePersonal } = require('../middleware/auth');
const AvailabilityController = require('../controller/availiability');

// Create availability
router.post('/', auth(true), requirePersonal, AvailabilityController.createAvailability);

// List availabilities (filterable by user_id, resource_id, day_of_week)
router.get('/', auth(true), requirePersonal, AvailabilityController.getAllAvailabilities);

// Get availability by ID
router.get('/:id', auth(true), requirePersonal, AvailabilityController.getAvailabilityById);

// Update availability
router.put('/:id', auth(true), requirePersonal, AvailabilityController.updateAvailability);

// Delete availability
router.delete('/:id', auth(true), requirePersonal, AvailabilityController.deleteAvailability);

module.exports = { availabilityRouter: router };