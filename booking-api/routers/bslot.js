const express = require('express');
const router = express.Router();
const { auth, requirePersonal } = require('../middleware/auth');
const BslotController = require('../controller/bslot');

// Create blocked slot
router.post('/', auth(true), requirePersonal, BslotController.createBlockedSlot);

// List blocked slots (filterable by user_id, resource_id, from, to)
router.get('/', auth(true), BslotController.getAllBlockedSlots);

// Check overlap for a proposed window
router.get('/check', auth(true), BslotController.checkOverlap);

// Get by ID
router.get('/:id', auth(true), BslotController.getBlockedSlotById);

// Update blocked slot
router.put('/:id', auth(true), requirePersonal, BslotController.updateBlockedSlot);

// Delete blocked slot
router.delete('/:id', auth(true), requirePersonal, BslotController.deleteBlockedSlot);

module.exports = { bslotRouter: router };