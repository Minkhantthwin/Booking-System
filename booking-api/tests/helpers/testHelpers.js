const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.test') });

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

class TestHelpers {
  static async createTestUser(userData = {}) {
    let defaultRoleId = userData.role_id;
    if (defaultRoleId === undefined) {
      const userRole = await prisma.role.findFirst({ where: { name: 'User' } });
      defaultRoleId = userRole ? userRole.role_id : undefined;
    }

    const defaultUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      phone: '+1234567890',
      role_id: defaultRoleId
    };

    const user = { ...defaultUser, ...userData };
    if (user.role_id == null) {
      throw new Error('User role_id must be provided or seed must include a User role');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);

    return await prisma.user.create({
      data: {
        ...user,
        password_hash: hashedPassword,
        password: undefined
      },
      include: {
        role: true
      }
    });
  }

  static generateToken(user) {
    return jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: {
          id: user.role_id,
          name: user.role?.name
        }
      },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '1h' }
    );
  }

  static async cleanupUser(email) {
    try {
      await prisma.user.delete({
        where: { email }
      });
    } catch (error) {
      // User might not exist
    }
  }

  static async cleanupUsers(emails) {
    for (const email of emails) {
      await this.cleanupUser(email);
    }
  }

  static expectValidUser(user) {
    expect(user).toHaveProperty('user_id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('role_id');
    expect(user).toHaveProperty('status');
    expect(user).toHaveProperty('created_at');
    expect(user).not.toHaveProperty('password_hash');
  }

  static expectValidToken(token) {
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    
    // Verify token structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
    expect(decoded).toHaveProperty('role');
  }
}

module.exports = TestHelpers;
