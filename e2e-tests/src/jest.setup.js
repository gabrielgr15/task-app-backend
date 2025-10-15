
//require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const { connectDB, disconnectDB } = require('./helpers/dbUtils');
const { TestUser, TestRefreshToken } = require('./helpers/testModels');

console.log('[SetupFile] Running setup file...');

beforeAll(async () => {
  console.log('[SetupFile - beforeAll] Connecting to DB...');
  try {
    await connectDB();
    console.log('[SetupFile - beforeAll] DB Connected.');
  } catch (error) {
    console.error('[SetupFile - beforeAll] FATAL: DB connection failed:', process.env.MONGO_URI_FOR_TESTS, error);
    process.exit(1);
  }
}, 60000);

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
    await TestUser.deleteMany({});
    await TestRefreshToken.deleteMany({});
  } catch (error) {
    console.error('!!! Failed to clear test DB in beforeEach:', error);
    throw error;
  }
});