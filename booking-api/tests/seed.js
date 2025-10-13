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

    const staffRole = await prisma.role.upsert({
      where: { name: 'Staff' },
      update: {},
      create: {
        name: 'Staff',
        description: 'Staff role'
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

    // Create staff user
    const staffPassword = await bcrypt.hash('staff123', 10);
    await prisma.user.upsert({
      where: { email: 'staff@test.com' },
      update: {},
      create: {
        email: 'staff@test.com',
        password_hash: staffPassword,
        name: 'Test Staff',
        phone: '+1987654321',
        role_id: staffRole.role_id,
        status: 'active'
      }
    });

    // Create customer user
    const customerPassword = await bcrypt.hash('customer123', 10);
    await prisma.user.upsert({
      where: { email: 'customer@test.com' },
      update: {},
      create: {
        email: 'customer@test.com',
        password_hash: customerPassword,
        name: 'Test Customer',
        phone: '+1123456789',
        role_id: userRole.role_id,
        status: 'active'
      }
    });

    // Ensure base service exists
    const existingService = await prisma.service.findFirst({ where: { name: 'Standard Service' } });
    if (!existingService) {
      await prisma.service.create({
        data: {
          name: 'Standard Service',
          description: 'Default service for tests',
          duration_min: 60,
          price: 50,
          status: 'active'
        }
      });
    }

    // Ensure base resource exists
    const existingResource = await prisma.resource.findFirst({ where: { name: 'Test Resource' } });
    if (!existingResource) {
      await prisma.resource.create({
        data: {
          name: 'Test Resource',
          description: 'Default resource for tests',
          status: 'available'
        }
      });
    }

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