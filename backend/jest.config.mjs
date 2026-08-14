export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.mjs', '**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.*'],
  moduleFileExtensions: ['js', 'mjs'],
  transform: {},
  verbose: true,
  testTimeout: 10000,
  rootDir: '.',
};