const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const auditController = require('../controller/audit');

router.post('/', auth(true), requireAdmin, auditController.createAuditLog);
router.get('/', auth(true), requireAdmin, auditController.getAllAuditLogs);
router.get('/stats/actions', auth(true), requireAdmin, auditController.getAuditLogStats);
router.get('/:id', auth(true), requireAdmin, auditController.getAuditLogById);
router.put('/:id', auth(true), requireAdmin, auditController.updateAuditLog);
router.delete('/:id', auth(true), requireAdmin, auditController.deleteAuditLog);

module.exports = { auditRouter: router };