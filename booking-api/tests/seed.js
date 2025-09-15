const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function seedTestData() {
  try {
    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrator role'
      }
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Regular user role'
      }
    });

    // Create test admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password_hash: hashedPassword,
        name: 'Test Admin',
        phone: '+1234567890',
        role_id: adminRole.role_id,
        status: 'active'
      }
    });

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedTestData();
}

module.exports = { seedTestData };