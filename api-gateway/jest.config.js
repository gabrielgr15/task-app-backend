require('dotenv').config({path: './.env'})

module.exports = {    
    //preset: 'ts-jest',  
    
    testEnvironment: 'node',  
    testPathIgnorePatterns: [
      '/node_modules/',
      '/__tests__/helpers/'
    ],
    
    //clearMocks: true,
  
    // Optional: If you create setup files later (e.g., for global beforeAll/afterAll)
    // setupFilesAfterEnv: ['./src/test/setup.ts'],
  
    // Optional: Where to look for test files (defaults work well usually)
    // testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  
    // Optional: Coverage reporting (uncomment and configure if needed)
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8", // or 'babel'
  }