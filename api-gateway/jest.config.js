require('dotenv').config({ path: './.env' })

module.exports = {
  "globalSetup": "./jest.globalSetup.js",
  "globalTeardown": "./jest.globalTeardown.js",
  "testTimeout": 60000,
  //preset: 'ts-jest',  

  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/helpers/'
  ],

  //clearMocks: true,

  setupFilesAfterEnv: ['./src/test/setup.js'],

  // Optional: Where to look for test files (defaults work well usually)
  // testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8", // or 'babel'
}