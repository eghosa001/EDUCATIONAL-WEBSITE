module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  moduleFileExtensions: ['js', 'mjs'],
  transform: {},
  verbose: true,
  testTimeout: 10000,
};