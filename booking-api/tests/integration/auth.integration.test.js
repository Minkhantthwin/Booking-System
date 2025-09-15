const request = require('supertest');
const app = require('../../index');
const prisma = require('../../prismaClient');
const TestHelpers = require('../helpers/testHelpers');

describe('Authentication Integration Tests', () => {
  let testUsersToCleanup = [];

  afterEach(async () => {
    await TestHelpers.cleanupUsers(testUsersToCleanup);
  });

  describe('Registration and Login Flow', () => {
    test('should register user and then login successfully', async () => {
      const userData = {
        role_id: 1,
        email: 'integration@example.com',
        phone: '+1234567890',
        password: 'integrationTest123',
        name: 'Integration User'
      };

      testUsersToCleanup.push(userData.email);

      // Register user
      const registerResponse = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('token');

      // Login with same credentials
      const loginResponse = await request(app)
        .post('/user/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.user.user_id).toBe(registerResponse.body.user.user_id);
      expect(loginResponse.body.user.email).toBe(userData.email);
    });

    test('should access protected profile endpoint after login', async () => {
      const userData = {
        role_id: 1,
        email: 'profile@example.com',
        password: 'profileTest123',
        name: 'Profile User'
      };

      testUsersToCleanup.push(userData.email);

      // Register and get token
      const registerResponse = await request(app)
        .post('/user/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Access profile with token
      const profileResponse = await request(app)
        .get('/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.user.email).toBe(userData.email);
      expect(profileResponse.body.user.name).toBe(userData.name);
    });
  });
});