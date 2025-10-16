module.exports = {
    "globalSetup": './src/jest.globalSetup.js',
    "globalTeardown": './src/jest.globalTeardown.js',
    "testTimeout": 30000,
    //preset: 'ts-jest',  

    testEnvironment: 'node',
    testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/helpers/'
    ],

    transformIgnorePatterns: [
        '/node_modules/(?!axios-cookiejar-support|tough-cookie|http-cookie-agent).+\\.js$'
    ],

    // You might also need this if using other async/await features in non-test files
    transform: {
        '^.+\\.[jt]sx?$': 'babel-jest',
    },

    verbose: true,

    //clearMocks: true,

    setupFilesAfterEnv: ['./src/jest.setup.js'],

    // Optional: Where to look for test files (defaults work well usually)
    // testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8", // or 'babel'

    globals: {
        'process.env': {
            MONGO_URI_FOR_TESTS: process.env.MONGO_URI_FOR_TESTS,
        }
      }
}

