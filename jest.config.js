/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync } = require('node:fs');

const config = JSON.parse(readFileSync('./.swcrc', 'utf-8'));

/**
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  reporters: ['default', 'jest-junit'],
  coverageReporters: ['cobertura'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', config],
  },
  moduleNameMapper: {
    '$src/(.*)': '<rootDir>/src/$1',
  },
};
