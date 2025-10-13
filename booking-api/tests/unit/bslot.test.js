const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const app = require('../../index');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TestHelpers = require('../helpers/testHelpers');

describe('Blocked slot API', () => {
  let staffToken;
  let createdId;
  let staffId;
  let resourceId;

  beforeAll(async () => {
    const [staff, resource] = await Promise.all([
      prisma.user.findFirst({ where: { email: 'staff@test.com' }, include: { role: true } }),
      prisma.resource.findFirst({ where: { name: 'Test Resource' } })
    ]);
    if (!staff || !resource) {
      throw new Error('Seed data missing required staff/resource records');
    }
    staffToken = TestHelpers.generateToken(staff);
    staffId = staff.user_id;
    resourceId = resource.resource_id;
  });

  afterAll(async () => {
    if (createdId) {
      try { await prisma.blockedSlot.delete({ where: { blocked_id: createdId } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('create blocked slot', async () => {
    const res = await request(app)
      .post('/bslot')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        user_id: staffId,
        resource_id: resourceId,
        start_datetime: '2024-10-15T09:00:00Z',
        end_datetime: '2024-10-15T10:30:00Z'
      })
      .expect(201);

    expect(res.body.blocked).toHaveProperty('blocked_id');
    createdId = res.body.blocked.blocked_id;
  });

  test('list blocked slots', async () => {
    const res = await request(app)
  .get(`/bslot?user_id=${staffId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);

    expect(res.body.blocked).toBeInstanceOf(Array);
  });

  test('check overlap', async () => {
    const res = await request(app)
      .get('/bslot/check')
      .set('Authorization', `Bearer ${staffToken}`)
      .query({
        user_id: staffId,
        resource_id: resourceId,
        start_datetime: '2024-10-15T09:30:00Z',
        end_datetime: '2024-10-15T09:45:00Z'
      })
      .expect(200);

    expect(res.body).toHaveProperty('hasConflict', true);
  });

  test('update blocked slot', async () => {
    const res = await request(app)
      .put(`/bslot/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ end_datetime: '2024-10-15T11:00:00Z' })
      .expect(200);

  expect(new Date(res.body.blocked.end_datetime).toISOString()).toBe('2024-10-15T11:00:00.000Z');
  });

  test('get blocked slot by id', async () => {
    const res = await request(app)
      .get(`/bslot/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);

    expect(res.body.blocked.blocked_id).toBe(createdId);
  });

  test('delete blocked slot', async () => {
    await request(app)
      .delete(`/bslot/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(204);

    await request(app)
      .get(`/bslot/${createdId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(404);

    createdId = undefined;
  });
});