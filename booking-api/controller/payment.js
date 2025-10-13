const prisma = require('../prismaClient');

function toDecimal(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function createPayment(req, res) {
  try {
    const { booking_id, amount, method, status, transaction_ref } = req.body;

    if (booking_id == null || amount == null || !method) {
      return res.status(400).json({ message: 'booking_id, amount, and method are required' });
    }

    const amt = toDecimal(amount);
    if (amt == null || amt < 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    const booking = await prisma.booking.findUnique({ where: { booking_id: Number(booking_id) } });
    if (!booking) {
      return res.status(400).json({ message: 'Invalid booking_id' });
    }

    const payment = await prisma.payment.create({
      data: {
        booking_id: Number(booking_id),
        amount: amt,
        method,
        status: status ?? 'pending',
        transaction_ref: transaction_ref ?? null
      }
    });

    return res.status(201).json({ payment });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Create payment failed' });
  }
}

async function getAllPayments(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200);
    const skip = (page - 1) * limit;

    const { booking_id, method, status, from, to } = req.query;
    const where = {};

    if (booking_id) where.booking_id = Number(booking_id);
    if (method) where.method = method;
    if (status) where.status = status;

    if (from || to) {
      const start = toDate(from);
      const end = toDate(to);
      if ((from && !start) || (to && !end)) {
        return res.status(400).json({ message: 'Invalid from/to timestamp' });
      }
      where.created_at = {};
      if (start) where.created_at.gte = start;
      if (end) where.created_at.lte = end;
    }

    const select = {
      payment_id: true,
      booking_id: true,
      amount: true,
      method: true,
      status: true,
      transaction_ref: true,
      created_at: true
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        select,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({ payments, pagination: { page, limit, total, totalPages } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Fetch payments failed' });
  }
}

async function getPaymentById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid payment id required' });
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { payment_id: id } });
    if (!payment) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ payment });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Fetch payment failed' });
  }
}

async function updatePayment(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid payment id required' });
  }

  const { booking_id, amount, method, status, transaction_ref } = req.body;
  const data = {};

  try {
    if (booking_id !== undefined) {
      const booking = await prisma.booking.findUnique({ where: { booking_id: Number(booking_id) } });
      if (!booking) return res.status(400).json({ message: 'Invalid booking_id' });
      data.booking_id = Number(booking_id);
    }

    if (amount !== undefined) {
      const amt = toDecimal(amount);
      if (amt == null || amt < 0) {
        return res.status(400).json({ message: 'amount must be a positive number' });
      }
      data.amount = amt;
    }

    if (method !== undefined) data.method = method;
    if (status !== undefined) data.status = status;
    if (transaction_ref !== undefined) data.transaction_ref = transaction_ref ?? null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const payment = await prisma.payment.update({
      where: { payment_id: id },
      data
    });

    return res.status(200).json({ payment });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Not found' });
    console.error(e);
    return res.status(500).json({ message: 'Update payment failed' });
  }
}

async function deletePayment(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid payment id required' });
  }

  try {
    await prisma.payment.delete({ where: { payment_id: id } });
    return res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Not found' });
    console.error(e);
    return res.status(500).json({ message: 'Delete payment failed' });
  }
}

async function getPaymentStats(req, res) {
  try {
    const { from, to } = req.query;
    const where = {};

    if (from || to) {
      const start = toDate(from);
      const end = toDate(to);
      if ((from && !start) || (to && !end)) {
        return res.status(400).json({ message: 'Invalid from/to timestamp' });
      }
      where.created_at = {};
      if (start) where.created_at.gte = start;
      if (end) where.created_at.lte = end;
    }

    const grouped = await prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
      where: Object.keys(where).length ? where : undefined
    });

    return res.status(200).json({
      stats: grouped.map((g) => ({
        status: g.status,
        count: g._count._all,
        totalAmount: g._sum.amount ? Number(g._sum.amount) : 0
      }))
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Fetch payment stats failed' });
  }
}

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentStats
};