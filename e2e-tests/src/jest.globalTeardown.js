// File: e2e-tests/src/jest.global.teardown.js

const { execSync } = require('child_process');
const path = require('path');

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCKER_COMPOSE_FILE = path.resolve(MONOREPO_ROOT, 'docker-compose.yml');

module.exports = async () => {
    console.log('\n[GlobalTeardown] Tearing down Docker Compose environment...');
    try {
        const command = `docker compose -f "${DOCKER_COMPOSE_FILE}" down -v --timeout 0`;
        console.log(`[GlobalTeardown] Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
        console.log('[GlobalTeardown] Cleanup finished successfully.');
    } catch (error) {
        console.error('[GlobalTeardown] Error during cleanup:', error);
    }
};