// File: e2e-tests/src/setupFile.js

console.log('[SetupFile] Running setup file...');

beforeAll(async () => {
  console.log('[SetupFile - beforeAll] E2E setup ready (HTTP-only tests).');
}, 6000);

afterAll(async () => {
  console.log('[SetupFile - afterAll] E2E teardown complete.');
}, 6000);

beforeEach(async () => {
  console.log('[SetupFile - beforeEach] Starting fresh test...');
});
