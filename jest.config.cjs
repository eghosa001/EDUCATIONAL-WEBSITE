module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/backend/src/**/*.test.js'],
  collectCoverageFrom: ['backend/src/**/*.js', '!backend/src/**/*.test.js'],
  moduleFileExtensions: ['js', 'mjs'],
  transform: {},
  verbose: true,
  testTimeout: 10000,
};