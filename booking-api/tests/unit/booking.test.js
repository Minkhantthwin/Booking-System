const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const app = require('../../index');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TestHelpers = require('../helpers/testHelpers');

describe('Booking API', () => {
  let adminToken;
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
    if (!admin || !customer || !staff || !resource || !service) {
      throw new Error('Seed data missing required user/resource/service records');
    }
    adminToken = TestHelpers.generateToken(admin);
    customerId = customer.user_id;
    staffId = staff.user_id;
    resourceId = resource.resource_id;
    serviceId = service.service_id;
  });

  afterAll(async () => {
    if (bookingId) {
      try { await prisma.booking.delete({ where: { booking_id: bookingId } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('create booking', async () => {
    const res = await request(app)
      .post('/booking')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        staff_id: staffId,
        resource_id: resourceId,
        service_id: serviceId,
        start_datetime: '2024-10-20T09:00:00Z',
        end_datetime: '2024-10-20T10:00:00Z',
        notes: 'Unit test booking'
      })
      .expect(201);

    bookingId = res.body.booking.booking_id;
    expect(res.body.booking.staff_id).toBe(staffId);
  });

  test('list bookings', async () => {
    const res = await request(app)
      .get('/booking?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.bookings).toBeInstanceOf(Array);
    expect(res.body.pagination.page).toBe(1);
  });

  test('check overlap conflicts', async () => {
    const res = await request(app)
      .get('/booking/check')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        staff_id: staffId,
        resource_id: resourceId,
        start_datetime: '2024-10-20T09:30:00Z',
        end_datetime: '2024-10-20T09:45:00Z'
      })
      .expect(200);

    expect(res.body.hasConflict).toBe(true);
  });

  test('get booking by id', async () => {
    const res = await request(app)
      .get(`/booking/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.booking.booking_id).toBe(bookingId);
  });

  test('update booking', async () => {
    const res = await request(app)
      .put(`/booking/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Updated note' })
      .expect(200);

    expect(res.body.booking.notes).toBe('Updated note');
  });

  test('delete booking', async () => {
    await request(app)
      .delete(`/booking/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/booking/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    bookingId = undefined;
  });
});