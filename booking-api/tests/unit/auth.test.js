const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../../prismaClient');
const { userRouter } = require('../../routers/user');
const TestHelpers = require('../helpers/testHelpers');

// Create test app
const app = express();
app.use(express.json());
app.use('/user', userRouter);

describe('Authentication Tests', () => {
  let testUsersToCleanup = [];

  beforeEach(async () => {
    testUsersToCleanup = [];
  });

  afterEach(async () => {
    await TestHelpers.cleanupUsers(testUsersToCleanup);
  });

  describe('POST /user/register', () => {
    describe('Successful Registration', () => {
      test('should register a new user with valid data', async () => {
        const userData = {
          role_id: 1,
          email: 'newuser@example.com',
          phone: '+1234567890',
          password: 'securePassword123',
          name: 'New User'
        };

        testUsersToCleanup.push(userData.email);

        const response = await request(app)
          .post('/user/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');

        TestHelpers.expectValidUser(response.body.user);
        TestHelpers.expectValidToken(response.body.token);

        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.name).toBe(userData.name);
        expect(response.body.user.phone).toBe(userData.phone);
        expect(response.body.user.role_id).toBe(userData.role_id);
      });

      test('should register user without optional phone number', async () => {
        const userData = {
          role_id: 1,
          email: 'nophone@example.com',
          password: 'securePassword123',
          name: 'No Phone User'
        };

        testUsersToCleanup.push(userData.email);

        const response = await request(app)
          .post('/user/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.phone).toBeNull();
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 for missing required fields', async () => {
        const testCases = [
          {},
          { email: 'test@example.com' },
          { password: 'password123' },
          { name: 'Test User' },
          { role_id: 1 },
          { role_id: 1, email: 'test@example.com' },
          { role_id: 1, password: 'password123' },
          { role_id: 1, name: 'Test User' }
        ];

        for (const testCase of testCases) {
          const response = await request(app)
            .post('/user/register')
            .send(testCase)
            .expect(400);

          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toBe('Missing required fields.');
        }
      });

      test('should return 400 for duplicate email', async () => {
        const userData = {
          role_id: 1,
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User'
        };

        testUsersToCleanup.push(userData.email);

        // Register first user
        await request(app)
          .post('/user/register')
          .send(userData)
          .expect(201);

        // Try to register with same email
        const duplicateData = {
          ...userData,
          name: 'Second User'
        };

        const response = await request(app)
          .post('/user/register')
          .send(duplicateData)
          .expect(400);

        expect(response.body.error).toBe('Email already registered.');
      });
    });
  });

  describe('POST /user/login', () => {
    let testUser;
    const testPassword = 'testPassword123';

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser({
        email: 'logintest@example.com',
        password: testPassword
      });
      testUsersToCleanup.push(testUser.email);
    });

    describe('Successful Login', () => {
      test('should login with valid credentials', async () => {
        const loginData = {
          email: testUser.email,
          password: testPassword
        };

        const response = await request(app)
          .post('/user/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');

        TestHelpers.expectValidUser(response.body.user);
        TestHelpers.expectValidToken(response.body.token);

        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.user_id).toBe(testUser.user_id);
      });
    });

    describe('Authentication Failures', () => {
      test('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/user/login')
          .send({ password: testPassword })
          .expect(400);

        expect(response.body.msg).toBe('Email and password are required');
      });

      test('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/user/login')
          .send({ email: testUser.email })
          .expect(400);

        expect(response.body.msg).toBe('Email and password are required');
      });

      test('should return 401 for non-existent email', async () => {
        const response = await request(app)
          .post('/user/login')
          .send({
            email: 'nonexistent@example.com',
            password: testPassword
          })
          .expect(401);

        expect(response.body.msg).toBe('Invalid credentials');
      });

      test('should return 401 for incorrect password', async () => {
        const response = await request(app)
          .post('/user/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.msg).toBe('Invalid credentials');
      });
    });
  });
});