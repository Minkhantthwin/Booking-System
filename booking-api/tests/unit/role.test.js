const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const TestHelpers = require('../helpers/testHelpers');

// Import Express app
const app = require('../../index'); // Ensure index.js exports the Express app

describe('Role CRUD', () => {
  let adminToken;
  let createdRole;
  const createdNames = new Set();

  beforeAll(async () => {
    // Fetch seeded admin user and generate token
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
      include: { role: true }
    });
    adminToken = TestHelpers.generateToken(admin);
  });

  afterAll(async () => {
    // Cleanup created roles
    for (const name of createdNames) {
      try { await prisma.role.delete({ where: { name } }); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('Create role (201)', async () => {
    const name = `Tester_${Date.now()}`;
    createdNames.add(name);

    const res = await request(app)
      .post('/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name, description: 'Test role' })
      .expect(201);

    expect(res.body).toHaveProperty('role');
    expect(res.body.role).toHaveProperty('role_id');
    expect(res.body.role.name).toBe(name);

    createdRole = res.body.role;
  });

  test('Reject duplicate role name (409)', async () => {
    const res = await request(app)
      .post('/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: createdRole.name, description: 'Duplicate' })
      .expect(409);

    expect(res.body).toHaveProperty('message');
  });

  test('List roles (200)', async () => {
    const res = await request(app)
      .get('/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
    expect(res.body.roles.find(r => r.role_id === createdRole.role_id)).toBeTruthy();
  });

  test('Get role by ID (200)', async () => {
    const res = await request(app)
      .get(`/role/${createdRole.role_id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('role');
    expect(res.body.role.role_id).toBe(createdRole.role_id);
    expect(res.body.role.name).toBe(createdRole.name);
  });

  test('Update role (200)', async () => {
    const newName = `${createdRole.name}_updated`;
    createdNames.add(newName);

    const res = await request(app)
      .put(`/role/${createdRole.role_id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: newName, description: 'Updated description' })
      .expect(200);

    expect(res.body).toHaveProperty('role');
    expect(res.body.role.name).toBe(newName);

    // Update local reference
    createdRole = res.body.role;
  });

  test('Delete role (204) then get 404', async () => {
    await request(app)
      .delete(`/role/${createdRole.role_id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/role/${createdRole.role_id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});