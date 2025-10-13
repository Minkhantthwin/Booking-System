const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const app = require('../../index');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const TestHelpers = require('../helpers/testHelpers');

describe('Resource API', () => {
  let adminToken;
  let resourceId;
  const createdNames = new Set();

  beforeAll(async () => {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@test.com' }, include: { role: true } });
    adminToken = TestHelpers.generateToken(admin);
  });

  afterAll(async () => {
    for (const name of createdNames) {
      try { await prisma.resource.delete({ where: { name } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('create resource', async () => {
    const name = `Room_${Date.now()}`;
    createdNames.add(name);

    const res = await request(app)
      .post('/resource')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name, description: 'Unit test room' })
      .expect(201);

    resourceId = res.body.resource.resource_id;
    expect(res.body.resource.name).toBe(name);
  });

  test('list resources', async () => {
    const res = await request(app)
      .get('/resource')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.resources).toBeInstanceOf(Array);
  });

  test('get resource by id', async () => {
    const res = await request(app)
      .get(`/resource/${resourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.resource.resource_id).toBe(resourceId);
  });

  test('update resource', async () => {
    const res = await request(app)
      .put(`/resource/${resourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'unavailable' })
      .expect(200);

    expect(res.body.resource.status).toBe('unavailable');
  });

  test('delete resource', async () => {
    await request(app)
      .delete(`/resource/${resourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/resource/${resourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    resourceId = undefined;
  });
});