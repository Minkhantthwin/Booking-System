const prisma = require('../prismaClient');

function toDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function overlapFilter(start, end) {
  return {
    AND: [
      { start_datetime: { lt: end } },
      { end_datetime: { gt: start } }
    ]
  };
}

async function createBooking(req, res) {
  try {
    const { customer_id, staff_id, resource_id, service_id, start_datetime, end_datetime, notes } = req.body;

    if ([customer_id, staff_id, resource_id, service_id].some(v => v == null) || !start_datetime || !end_datetime) {
      return res.status(400).json({ message: 'customer_id, staff_id, resource_id, service_id, start_datetime, end_datetime are required' });
    }

    const start = toDate(start_datetime);
    const end = toDate(end_datetime);
    if (!start || !end || start >= end) {
      return res.status(400).json({ message: 'Invalid date range: start_datetime must be before end_datetime' });
    }

    // Validate foreign keys
    const [customer, staff, resource, service] = await Promise.all([
      prisma.user.findUnique({ where: { user_id: Number(customer_id) } }),
      prisma.user.findUnique({ where: { user_id: Number(staff_id) } }),
      prisma.resource.findUnique({ where: { resource_id: Number(resource_id) } }),
      prisma.service.findUnique({ where: { service_id: Number(service_id) } }),
    ]);
    if (!customer) return res.status(400).json({ message: 'Invalid customer_id' });
    if (!staff) return res.status(400).json({ message: 'Invalid staff_id' });
    if (!resource) return res.status(400).json({ message: 'Invalid resource_id' });
    if (!service) return res.status(400).json({ message: 'Invalid service_id' });

    // Optional: ensure duration meets service minimum
    const mins = (end.getTime() - start.getTime()) / 60000;
    if (service.duration_min && mins < service.duration_min) {
      return res.status(400).json({ message: `Booking duration must be at least ${service.duration_min} minutes` });
    }

    // Conflicts with other bookings (staff or resource busy)
    const bookingConflict = await prisma.booking.findFirst({
      where: {
        OR: [{ staff_id: Number(staff_id) }, { resource_id: Number(resource_id) }],
        ...overlapFilter(start, end)
      }
    });
    if (bookingConflict) {
      return res.status(409).json({ message: 'Time overlaps an existing booking' });
    }

    // Conflicts with blocked slots (staff or resource blocked)
    const blockedConflict = await prisma.blockedSlot.findFirst({
      where: {
        OR: [{ user_id: Number(staff_id) }, { resource_id: Number(resource_id) }],
        ...overlapFilter(start, end)
      }
    });
    if (blockedConflict) {
      return res.status(409).json({ message: 'Time overlaps a blocked slot' });
    }

    const booking = await prisma.booking.create({
      data: {
        customer_id: Number(customer_id),
        staff_id: Number(staff_id),
        resource_id: Number(resource_id),
        service_id: Number(service_id),
        start_datetime: start,
        end_datetime: end,
        notes
      }
    });

    return res.status(201).json({ booking });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Create booking failed' });
  }
}

async function getAllBookings(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const where = {};
    const { customer_id, staff_id, resource_id, service_id, status, from, to } = req.query;

    if (customer_id) where.customer_id = Number(customer_id);
    if (staff_id) where.staff_id = Number(staff_id);
    if (resource_id) where.resource_id = Number(resource_id);
    if (service_id) where.service_id = Number(service_id);
    if (status) where.status = status;

    if (from || to) {
      const start = from ? toDate(from) : null;
      const end = to ? toDate(to) : null;
      if ((from && !start) || (to && !end)) {
        return res.status(400).json({ message: 'Invalid from/to date' });
      }
      if (start && end) {
        Object.assign(where, overlapFilter(start, end));
      } else if (start) {
        Object.assign(where, { end_datetime: { gt: start } });
      } else if (end) {
        Object.assign(where, { start_datetime: { lt: end } });
      }
    }

    const select = {
      booking_id: true,
      customer_id: true,
      staff_id: true,
      resource_id: true,
      service_id: true,
      start_datetime: true,
      end_datetime: true,
      notes: true,
      status: true,
      created_at: true,
      updated_at: true
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select,
        skip,
        take: limit,
        orderBy: { start_datetime: 'asc' }
      }),
      prisma.booking.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({ bookings, pagination: { page, limit, total, totalPages } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Fetch bookings failed' });
  }
}

async function getBookingById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid booking ID required' });
  }
  try {
    const booking = await prisma.booking.findUnique({ where: { booking_id: id } });
    if (!booking) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ booking });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Get booking failed' });
  }
}

async function updateBooking(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid booking ID required' });
  }

  try {
    const current = await prisma.booking.findUnique({ where: { booking_id: id } });
    if (!current) return res.status(404).json({ message: 'Not found' });

    const { customer_id, staff_id, resource_id, service_id, start_datetime, end_datetime, notes, status } = req.body;

    const data = {};
    if (customer_id !== undefined) {
      const user = await prisma.user.findUnique({ where: { user_id: Number(customer_id) } });
      if (!user) return res.status(400).json({ message: 'Invalid customer_id' });
      data.customer_id = Number(customer_id);
    }
    if (staff_id !== undefined) {
      const user = await prisma.user.findUnique({ where: { user_id: Number(staff_id) } });
      if (!user) return res.status(400).json({ message: 'Invalid staff_id' });
      data.staff_id = Number(staff_id);
    }
    if (resource_id !== undefined) {
      const resource = await prisma.resource.findUnique({ where: { resource_id: Number(resource_id) } });
      if (!resource) return res.status(400).json({ message: 'Invalid resource_id' });
      data.resource_id = Number(resource_id);
    }
    if (service_id !== undefined) {
      const service = await prisma.service.findUnique({ where: { service_id: Number(service_id) } });
      if (!service) return res.status(400).json({ message: 'Invalid service_id' });
      data.service_id = Number(service_id);
    }
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) data.status = status;

    let start = current.start_datetime;
    let end = current.end_datetime;
    let svc = null;

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

    const effectiveStaffId = data.staff_id ?? current.staff_id;
    const effectiveResourceId = data.resource_id ?? current.resource_id;
    const effectiveServiceId = data.service_id ?? current.service_id;

    // Optional: check service duration minimum
    svc = await prisma.service.findUnique({ where: { service_id: effectiveServiceId } });
    if (svc?.duration_min) {
      const mins = (end.getTime() - start.getTime()) / 60000;
      if (mins < svc.duration_min) {
        return res.status(400).json({ message: `Booking duration must be at least ${svc.duration_min} minutes` });
      }
    }

    // Conflicts (exclude self)
    const bookingConflict = await prisma.booking.findFirst({
      where: {
        booking_id: { not: id },
        OR: [{ staff_id: effectiveStaffId }, { resource_id: effectiveResourceId }],
        ...overlapFilter(start, end)
      }
    });
    if (bookingConflict) {
      return res.status(409).json({ message: 'Time overlaps an existing booking' });
    }

    const blockedConflict = await prisma.blockedSlot.findFirst({
      where: {
        OR: [{ user_id: effectiveStaffId }, { resource_id: effectiveResourceId }],
        ...overlapFilter(start, end)
      }
    });
    if (blockedConflict) {
      return res.status(409).json({ message: 'Time overlaps a blocked slot' });
    }

    const updated = await prisma.booking.update({
      where: { booking_id: id },
      data
    });

    return res.status(200).json({ booking: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Update booking failed' });
  }
}

async function deleteBooking(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid booking ID required' });
  }
  try {
    await prisma.booking.delete({ where: { booking_id: id } });
    return res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Not found' });
    console.error(e);
    return res.status(500).json({ message: 'Delete booking failed' });
  }
}

async function checkOverlap(req, res) {
  try {
    const { staff_id, resource_id, start_datetime, end_datetime } = req.query;
    if (!staff_id || !resource_id || !start_datetime || !end_datetime) {
      return res.status(400).json({ message: 'staff_id, resource_id, start_datetime and end_datetime are required' });
    }
    const start = toDate(start_datetime);
    const end = toDate(end_datetime);
    if (!start || !end || start >= end) {
      return res.status(400).json({ message: 'Invalid date range: start_datetime must be before end_datetime' });
    }

    const [bookings, blocked] = await Promise.all([
      prisma.booking.findMany({
        where: {
          OR: [{ staff_id: Number(staff_id) }, { resource_id: Number(resource_id) }],
          ...overlapFilter(start, end)
        },
        orderBy: { start_datetime: 'asc' }
      }),
      prisma.blockedSlot.findMany({
        where: {
          OR: [{ user_id: Number(staff_id) }, { resource_id: Number(resource_id) }],
          ...overlapFilter(start, end)
        },
        orderBy: { start_datetime: 'asc' }
      })
    ]);

    return res.status(200).json({
      conflicts: {
        bookings,
        blocked
      },
      hasConflict: bookings.length > 0 || blocked.length > 0
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Check overlap failed' });
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  checkOverlap
};