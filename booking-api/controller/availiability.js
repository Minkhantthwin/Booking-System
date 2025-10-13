const prisma = require('../prismaClient');

const ALLOWED_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isValidDay(day) {
  return ALLOWED_DAYS.includes(day);
}

function toDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function createAvailability(req, res) {
  try {
    const { user_id, resource_id, day_of_week, start_datetime, end_datetime } = req.body;

    if (!day_of_week || !start_datetime || !end_datetime) {
      return res.status(400).json({ message: 'day_of_week, start_datetime and end_datetime are required' });
    }
    if (!isValidDay(day_of_week)) {
      return res.status(400).json({ message: 'Invalid day_of_week' });
    }
    if (user_id == null && resource_id == null) {
      return res.status(400).json({ message: 'Either user_id or resource_id must be provided' });
    }

    const start = toDate(start_datetime);
    const end = toDate(end_datetime);
    if (!start || !end || start >= end) {
      return res.status(400).json({ message: 'Invalid date range: start_datetime must be before end_datetime' });
    }

    // Validate foreign keys if provided
    if (user_id != null) {
      const user = await prisma.user.findUnique({ where: { user_id: Number(user_id) } });
      if (!user) return res.status(400).json({ message: 'Invalid user_id' });
    }
    if (resource_id != null) {
      const resource = await prisma.resource.findUnique({ where: { resource_id: Number(resource_id) } });
      if (!resource) return res.status(400).json({ message: 'Invalid resource_id' });
    }

    const availability = await prisma.availability.create({
      data: {
        user_id: user_id != null ? Number(user_id) : null,
        resource_id: resource_id != null ? Number(resource_id) : null,
        day_of_week,
        start_datetime: start,
        end_datetime: end
      }
    });

    return res.status(201).json({ availability });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Create failed' });
  }
}

async function getAllAvailabilities(req, res) {
  try {
    const { user_id, resource_id, day_of_week } = req.query;

    const where = {};
    if (user_id != null) where.user_id = Number(user_id);
    if (resource_id != null) where.resource_id = Number(resource_id);
    if (day_of_week != null) {
      if (!isValidDay(day_of_week)) {
        return res.status(400).json({ message: 'Invalid day_of_week' });
      }
      where.day_of_week = day_of_week;
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: [{ day_of_week: 'asc' }, { start_datetime: 'asc' }]
    });

    return res.status(200).json({ availability: availabilities });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Get all availabilities failed' });
  }
}

async function getAvailabilityById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid availability ID required' });
  }
  try {
    const availability = await prisma.availability.findUnique({
      where: { availability_id: id }
    });
    if (!availability) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ availability });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Get by ID failed' });
  }
}

async function updateAvailability(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid availability ID required' });
  }

  const { user_id, resource_id, day_of_week, start_datetime, end_datetime } = req.body;

  try {
    const current = await prisma.availability.findUnique({ where: { availability_id: id } });
    if (!current) return res.status(404).json({ message: 'Not found' });

    const data = {};

    if (day_of_week !== undefined) {
      if (!isValidDay(day_of_week)) return res.status(400).json({ message: 'Invalid day_of_week' });
      data.day_of_week = day_of_week;
    }

    if (user_id !== undefined) {
      if (user_id !== null) {
        const user = await prisma.user.findUnique({ where: { user_id: Number(user_id) } });
        if (!user) return res.status(400).json({ message: 'Invalid user_id' });
        data.user_id = Number(user_id);
      } else {
        data.user_id = null;
      }
    }

    if (resource_id !== undefined) {
      if (resource_id !== null) {
        const resource = await prisma.resource.findUnique({ where: { resource_id: Number(resource_id) } });
        if (!resource) return res.status(400).json({ message: 'Invalid resource_id' });
        data.resource_id = Number(resource_id);
      } else {
        data.resource_id = null;
      }
    }

    let start = current.start_datetime;
    let end = current.end_datetime;

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
    if (effectiveUserId == null && effectiveResourceId == null) {
      return res.status(400).json({ message: 'Either user_id or resource_id must be present' });
    }

    const updated = await prisma.availability.update({
      where: { availability_id: id },
      data
    });

    return res.status(200).json({ availability: updated, message: 'Update successful' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Update failed' });
  }
}

async function deleteAvailability(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid availability ID required' });
  }
  try {
    await prisma.availability.delete({ where: { availability_id: id } });
    return res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ message: 'Not found' });
    }
    console.error(e);
    return res.status(500).json({ message: 'Delete failed' });
  }
}

module.exports = {
  createAvailability,
  getAllAvailabilities,
  getAvailabilityById,
  updateAvailability,
  deleteAvailability
};