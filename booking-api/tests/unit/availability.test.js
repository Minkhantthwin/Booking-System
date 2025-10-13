const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const app = require('../../index');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TestHelpers = require('../helpers/testHelpers');

describe('Availability API', () => {
  let adminToken;
  let createdId;
  let staffId;
  let resourceId;

  beforeAll(async () => {
    const [admin, staff, resource] = await Promise.all([
      prisma.user.findFirst({ where: { email: 'admin@test.com' }, include: { role: true } }),
      prisma.user.findFirst({ where: { email: 'staff@test.com' }, include: { role: true } }),
      prisma.resource.findFirst({ where: { name: 'Test Resource' } })
    ]);
    if (!admin || !staff || !resource) {
      throw new Error('Seed data missing required admin/staff/resource records');
    }
    adminToken = TestHelpers.generateToken(admin);
    staffId = staff.user_id;
    resourceId = resource.resource_id;
  });

  afterAll(async () => {
    if (createdId) {
      try { await prisma.availability.delete({ where: { availability_id: createdId } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('create availability', async () => {
    const res = await request(app)
      .post('/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: staffId,
        resource_id: resourceId,
        day_of_week: 'Mon',
        start_datetime: '2024-10-14T09:00:00Z',
        end_datetime: '2024-10-14T12:00:00Z'
      })
      .expect(201);

    expect(res.body.availability.day_of_week).toBe('Mon');
    createdId = res.body.availability.availability_id;
  });

  test('list availability', async () => {
    const res = await request(app)
  .get(`/availability?user_id=${staffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.availability).toBeInstanceOf(Array);
  });

  test('get availability by id', async () => {
    const res = await request(app)
      .get(`/availability/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.availability.availability_id).toBe(createdId);
  });

  test('update availability', async () => {
    const res = await request(app)
      .put(`/availability/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ end_datetime: '2024-10-14T13:00:00Z' })
      .expect(200);

    expect(new Date(res.body.availability.end_datetime).toISOString()).toBe('2024-10-14T13:00:00.000Z');
  });

  test('delete availability', async () => {
    await request(app)
      .delete(`/availability/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/availability/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    createdId = undefined;
  });
});