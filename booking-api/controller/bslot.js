const prisma = require('../prismaClient');

function toDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function dateRangeOverlapFilter(start, end) {
    return {
        AND: [
            { start_datetime: { lt: end } },
            { end_datetime: { gt: start } }
        ]
    };
}

async function createBlockedSlot(req, res) {
    try {
        const { user_id, resource_id, start_datetime, end_datetime } = req.body;

        if (user_id == null || resource_id == null || !start_datetime || !end_datetime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const start = toDate(start_datetime);
        const end = toDate(end_datetime);
        if (!start || !end || start >= end) {
            return res.status(400).json({ message: 'Invalid date range: start must be before end' });
        }

        const [user, resource] = await Promise.all([
            prisma.user.findUnique({ where: { user_id: Number(user_id) } }),
            prisma.resource.findUnique({ where: { resource_id: Number(resource_id) } })
        ]);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        const overlapping = await prisma.blockedSlot.findFirst({
            where: {
                user_id: Number(user_id),
                resource_id: Number(resource_id),
                ...dateRangeOverlapFilter(start, end)
            }
        });
        if (overlapping) {
            return res.status(409).json({ message: 'Overlapping blocked slot exists' });
        }

        const newBlockedSlot = await prisma.blockedSlot.create({
            data: {
                user_id: Number(user_id),
                resource_id: Number(resource_id),
                start_datetime: start,
                end_datetime: end
            }
        });
        return res.status(201).json(newBlockedSlot);

    } catch (error) {
        console.error('Error creating blocked slot:', error);
        return res.status(500).json({ message: 'Slot Creation Failed' });
    }    
}

async function getAllBlockedSlots(req, res) {
    try {
        const { user_id, resource_id, from, to } = req.query;

        const where = {};
        if (user_id != null) where.user_id = Number(user_id);
        if (resource_id != null) where.resource_id = Number(resource_id);

        if (from || to) {
            const start = from ? toDate(from) : null;
            const end = to ? toDate(to) : null;
            if ((from && !start) || (to && !end) || (start && end && start >= end)) {
                return res.status(400).json({ message: 'Invalid date range' });
            }
            if (start && end) {
                Object.assign(where, dateRangeOverlapFilter(start, end));
            } else if (start) {
                where.end_datetime = { gt: start };
            } else if (end) {
                where.start_datetime = { lt: end };
            }
        }
        const blockedSlots = await prisma.blockedSlot.findMany({ 
            where,
            orderBy: [{ start_datetime: 'asc' }]
            });
        return res.status(200).json(blockedSlots);
    } catch (error) {
        console.error('Error fetching blocked slots:', error);
        return res.status(500).json({ message: 'Failed to fetch blocked slots' });
    }
}

async function getBlockedSlotById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid blocked slot ID required' });
  }
  try {
    const blocked = await prisma.blockedSlot.findUnique({ where: { blocked_id: id } });
    if (!blocked) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ blocked });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Get by ID failed' });
  }
}

async function updateBlockedSlot(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid blocked slot ID required' });
  }

  const { user_id, resource_id, start_datetime, end_datetime } = req.body;

  try {
    const current = await prisma.blockedSlot.findUnique({ where: { blocked_id: id } });
    if (!current) return res.status(404).json({ message: 'Not found' });

    const data = {};
    let start = current.start_datetime;
    let end = current.end_datetime;

    if (user_id !== undefined) {
      const user = await prisma.user.findUnique({ where: { user_id: Number(user_id) } });
      if (!user) return res.status(400).json({ message: 'Invalid user_id' });
      data.user_id = Number(user_id);
    }
    if (resource_id !== undefined) {
      const resource = await prisma.resource.findUnique({ where: { resource_id: Number(resource_id) } });
      if (!resource) return res.status(400).json({ message: 'Invalid resource_id' });
      data.resource_id = Number(resource_id);
    }
    if (start_datetime !== undefined) {
      const parsed = toDate(start_datetime);
      if (!parsed) return res.status(400).json({ message: 'Invalid start_datetime' });
      start = parsed;
      data.start_datetime = parsed;
    }
    if (end_datetime !== undefined) {
      const parsed = toDate(end_datetime);
      if (!parsed) return res.status(400).json({ message: 'Invalid end_datetime' });
      end = parsed;
      data.end_datetime = parsed;
    }

    if (start >= end) {
      return res.status(400).json({ message: 'Invalid date range: start_datetime must be before end_datetime' });
    }

    const effectiveUserId = data.user_id !== undefined ? data.user_id : current.user_id;
    const effectiveResourceId = data.resource_id !== undefined ? data.resource_id : current.resource_id;

    // Prevent overlaps for the same user-resource pair (exclude self)
    const overlapping = await prisma.blockedSlot.findFirst({
      where: {
        blocked_id: { not: id },
        user_id: effectiveUserId,
        resource_id: effectiveResourceId,
        ...dateRangeOverlapFilter(start, end)
      }
    });
    if (overlapping) {
      return res.status(409).json({ message: 'Blocked slot overlaps an existing one' });
    }

    const updated = await prisma.blockedSlot.update({
      where: { blocked_id: id },
      data
    });

    return res.status(200).json({ blocked: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Update failed' });
  }
}

async function deleteBlockedSlot(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid blocked slot ID required' });
  }
  try {
    await prisma.blockedSlot.delete({ where: { blocked_id: id } });
    return res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ message: 'Not found' });
    }
    console.error(e);
    return res.status(500).json({ message: 'Delete failed' });
  }
}

async function checkOverlap(req, res) {
  try {
    const { user_id, resource_id, start_datetime, end_datetime } = req.query;

    if (user_id == null || resource_id == null || !start_datetime || !end_datetime) {
      return res.status(400).json({ message: 'user_id, resource_id, start_datetime and end_datetime are required' });
    }

    const start = toDate(start_datetime);
    const end = toDate(end_datetime);
    if (!start || !end || start >= end) {
      return res.status(400).json({ message: 'Invalid date range: start_datetime must be before end_datetime' });
    }

    const overlapping = await prisma.blockedSlot.findMany({
      where: {
        user_id: Number(user_id),
        resource_id: Number(resource_id),
        ...dateRangeOverlapFilter(start, end)
      },
      orderBy: [{ start_datetime: 'asc' }]
    });

    return res.status(200).json({ overlaps: overlapping, count: overlapping.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Check overlap failed' });
  }
}

module.exports = {
    createBlockedSlot,
    getAllBlockedSlots,
    getBlockedSlotById,
    updateBlockedSlot,
    deleteBlockedSlot,
    checkOverlap
};