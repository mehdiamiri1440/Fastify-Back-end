/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync } = require('node:fs');

const config = JSON.parse(readFileSync('./.swcrc', 'utf-8'));

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', config],
  },
  moduleNameMapper: {
    '$src/(.*)': '<rootDir>/src/$1',
  },
};
