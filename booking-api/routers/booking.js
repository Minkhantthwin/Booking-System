const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const BookingController = require('../controller/booking');

// Create
router.post('/', auth(true), BookingController.createBooking);

// List (filters + pagination)
router.get('/', auth(true), BookingController.getAllBookings);

// Check overlap window
router.get('/check', auth(true), BookingController.checkOverlap);

// Get by ID
router.get('/:id', auth(true), BookingController.getBookingById);

// Update
router.put('/:id', auth(true), BookingController.updateBooking);

// Delete
router.delete('/:id', auth(true), BookingController.deleteBooking);

module.exports = { bookingRouter: router };