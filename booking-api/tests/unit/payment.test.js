const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const app = require('../../index');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TestHelpers = require('../helpers/testHelpers');

describe('Payment API', () => {
  let adminToken;
  let paymentId;
  let bookingId;
  let customerId;
  let staffId;
  let resourceId;
  let serviceId;

  beforeAll(async () => {
    const [admin, customer, staff, resource, service] = await Promise.all([
      prisma.user.findFirst({ where: { email: 'admin@test.com' }, include: { role: true } }),
      prisma.user.findFirst({ where: { email: 'customer@test.com' }, include: { role: true } }),
      prisma.user.findFirst({ where: { email: 'staff@test.com' }, include: { role: true } }),
      prisma.resource.findFirst({ where: { name: 'Test Resource' } }),
      prisma.service.findFirst({ where: { name: 'Standard Service' } })
    ]);
    adminToken = TestHelpers.generateToken(admin);
    customerId = customer.user_id;
    staffId = staff.user_id;
    resourceId = resource.resource_id;
    serviceId = service.service_id;

    const booking = await prisma.booking.create({
      data: {
        customer_id: customerId,
        staff_id: staffId,
        resource_id: resourceId,
        service_id: serviceId,
        start_datetime: new Date('2024-10-21T09:00:00Z'),
        end_datetime: new Date('2024-10-21T10:00:00Z')
      }
    });
    bookingId = booking.booking_id;
  });

  afterAll(async () => {
    if (paymentId) {
      try { await prisma.payment.delete({ where: { payment_id: paymentId } }); } catch (_) {}
    }
    if (bookingId) {
      try { await prisma.booking.delete({ where: { booking_id: bookingId } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('create payment', async () => {
    const res = await request(app)
      .post('/payment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        booking_id: bookingId,
        amount: 75,
        method: 'credit_card',
        status: 'paid',
        transaction_ref: 'txn_test_1'
      })
      .expect(201);

    paymentId = res.body.payment.payment_id;
    expect(res.body.payment.status).toBe('paid');
  });

  test('list payments', async () => {
    const res = await request(app)
      .get('/payment?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.payments).toBeInstanceOf(Array);
  });

  test('get payment stats', async () => {
    const res = await request(app)
      .get('/payment/stats/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.stats).toBeInstanceOf(Array);
  });

  test('get payment by id', async () => {
    const res = await request(app)
      .get(`/payment/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.payment.payment_id).toBe(paymentId);
  });

  test('update payment', async () => {
    const res = await request(app)
      .put(`/payment/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'refunded' })
      .expect(200);

    expect(res.body.payment.status).toBe('refunded');
  });

  test('delete payment', async () => {
    await request(app)
      .delete(`/payment/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/payment/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    paymentId = undefined;
  });
});