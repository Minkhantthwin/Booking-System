const prisma = require('../prismaClient');

function toDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function createAuditLog(req, res) {
  try {
    const { user_id, action, entity, entity_id, details } = req.body;
    if (!action) return res.status(400).json({ message: 'action is required' });

    if (user_id !== undefined) {
      const user = await prisma.user.findUnique({ where: { user_id: Number(user_id) } });
      if (!user) return res.status(400).json({ message: 'Invalid user_id' });
    }

    const log = await prisma.auditLog.create({
      data: {
        user_id: user_id !== undefined ? Number(user_id) : null,
        action,
        entity,
        entity_id: entity_id !== undefined ? Number(entity_id) : null,
        details
      }
    });

    res.status(201).json({ log });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Create audit log failed' });
  }
}

async function getAllAuditLogs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200);
    const skip = (page - 1) * limit;

    const { user_id, action, entity, entity_id, from, to } = req.query;

    const where = {};
    if (user_id) where.user_id = Number(user_id);
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entity) where.entity = { contains: entity, mode: 'insensitive' };
    if (entity_id) where.entity_id = Number(entity_id);

    if (from || to) {
      const start = from ? toDate(from) : null;
      const end = to ? toDate(to) : null;
      if ((from && !start) || (to && !end)) {
        return res.status(400).json({ message: 'Invalid from/to timestamp' });
      }
      where.created_at = {};
      if (start) where.created_at.gte = start;
      if (end) where.created_at.lte = end;
    }

    const select = {
      log_id: true,
      user_id: true,
      action: true,
      entity: true,
      entity_id: true,
      details: true,
      created_at: true
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({ logs, pagination: { page, limit, total, totalPages } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Fetch audit logs failed' });
  }
}

async function getAuditLogById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid log id required' });
  }

  try {
    const log = await prisma.auditLog.findUnique({ where: { log_id: id } });
    if (!log) return res.status(404).json({ message: 'Audit log not found' });
    res.json({ log });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Fetch audit log failed' });
  }
}

async function updateAuditLog(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid log id required' });
  }

  const { user_id, action, entity, entity_id, details } = req.body;
  const data = {};

  if (user_id !== undefined) {
    const user = await prisma.user.findUnique({ where: { user_id: Number(user_id) } });
    if (!user) return res.status(400).json({ message: 'Invalid user_id' });
    data.user_id = Number(user_id);
  }
  if (action !== undefined) data.action = action;
  if (entity !== undefined) data.entity = entity;
  if (entity_id !== undefined) data.entity_id = Number(entity_id);
  if (details !== undefined) data.details = details;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  try {
    const log = await prisma.auditLog.update({
      where: { log_id: id },
      data
    });
    res.json({ log });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Audit log not found' });
    console.error(e);
    res.status(500).json({ message: 'Update audit log failed' });
  }
}

async function deleteAuditLog(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid log id required' });
  }

  try {
    await prisma.auditLog.delete({ where: { log_id: id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Audit log not found' });
    console.error(e);
    res.status(500).json({ message: 'Delete audit log failed' });
  }
}

async function getAuditLogStats(req, res) {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from || to) {
      const start = from ? toDate(from) : null;
      const end = to ? toDate(to) : null;
      if ((from && !start) || (to && !end)) {
        return res.status(400).json({ message: 'Invalid from/to timestamp' });
      }
      where.created_at = {};
      if (start) where.created_at.gte = start;
      if (end) where.created_at.lte = end;
    }

    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { _all: true },
      where: Object.keys(where).length ? where : undefined
    });

    res.json({
      stats: stats.map((s) => ({
        action: s.action,
        count: s._count._all
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Fetch audit stats failed' });
  }
}

module.exports = {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogById,
  updateAuditLog,
  deleteAuditLog,
  getAuditLogStats
};