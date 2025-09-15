const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

const { execSync } = require('child_process');

beforeAll(async () => {
  // Reset test database
  try {
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    });
    
    // Run migrations
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    });
    
    // Seed test data
    execSync('node tests/seed.js', {
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Test setup failed:', error.message);
    process.exit(1);
  }
});