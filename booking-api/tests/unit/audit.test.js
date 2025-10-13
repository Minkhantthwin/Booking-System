const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const app = require('../../index');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TestHelpers = require('../helpers/testHelpers');

describe('Audit API', () => {
  let adminToken;
  let createdIds = [];
  let adminId;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@test.com' }, include: { role: true } });
    adminToken = TestHelpers.generateToken(admin);
    adminId = admin.user_id;
  });

  afterAll(async () => {
    for (const id of createdIds) {
      try { await prisma.auditLog.delete({ where: { log_id: id } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('create audit log', async () => {
    const res = await request(app)
      .post('/audit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: adminId,
        action: 'TEST_ACTION',
        entity: 'Booking',
        entity_id: 1,
        details: 'Unit test log'
      })
      .expect(201);

    expect(res.body.log).toMatchObject({ action: 'TEST_ACTION', entity: 'Booking' });
    createdIds.push(res.body.log.log_id);
  });

  test('list audit logs with pagination', async () => {
    const res = await request(app)
      .get('/audit?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.logs).toBeInstanceOf(Array);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  test('get audit log stats', async () => {
    const res = await request(app)
      .get('/audit/stats/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.stats).toBeInstanceOf(Array);
  });

  test('get audit log by id', async () => {
    const id = createdIds[0];
    const res = await request(app)
      .get(`/audit/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.log.log_id).toBe(id);
  });

  test('update audit log', async () => {
    const id = createdIds[0];
    const res = await request(app)
      .put(`/audit/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ details: 'Updated detail' })
      .expect(200);

    expect(res.body.log.details).toBe('Updated detail');
  });

  test('delete audit log', async () => {
    const id = createdIds.pop();
    await request(app)
      .delete(`/audit/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/audit/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});