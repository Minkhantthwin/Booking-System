const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const paymentController = require('../controller/payment');

router.post('/', auth(true), requireAdmin, paymentController.createPayment);
router.get('/', auth(true), requireAdmin, paymentController.getAllPayments);
router.get('/stats/status', auth(true), requireAdmin, paymentController.getPaymentStats);
router.get('/:id', auth(true), requireAdmin, paymentController.getPaymentById);
router.put('/:id', auth(true), requireAdmin, paymentController.updatePayment);
router.delete('/:id', auth(true), requireAdmin, paymentController.deletePayment);

module.exports = { paymentRouter: router };