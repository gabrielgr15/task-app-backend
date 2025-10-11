// This file is now located in e2e-tests/src/

// The paths are now relative to this file's new location.
const { connectDB, disconnectDB } = require('./helpers/dbUtils');
const { TestUser, TestRefreshToken } = require('./helpers/testModels');

console.log('[SetupFile] Running setup file...');

beforeAll(async () => {
  console.log('[SetupFile - beforeAll] Connecting to DB...');
  try {
    await connectDB();
    console.log('[SetupFile - beforeAll] DB Connected.');
  } catch (error) {
    console.error('[SetupFile - beforeAll] FATAL: DB connection failed:', error);
    process.exit(1);
  }
}, 60000); // Increased timeout for DB connection

afterAll(async () => {
  console.log('[SetupFile - afterAll] Disconnecting from DB...');
  try {
    await disconnectDB();
    console.log('[SetupFile - afterAll] DB Disconnected.');
  } catch (error) {
    console.error('[SetupFile - afterAll] DB disconnection failed:', error);
  }
}, 30000);

beforeEach(async () => {
  try {
    // This ensures every single test starts with a clean slate.
    await TestUser.deleteMany({});
    await TestRefreshToken.deleteMany({});
  } catch (error) {
    console.error('!!! Failed to clear test DB in beforeEach:', error);
    throw error;
  }
});