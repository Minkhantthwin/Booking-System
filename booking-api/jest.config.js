module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'controller/**/*.js',
    'routers/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/generated/**',
    '!**/tests/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};