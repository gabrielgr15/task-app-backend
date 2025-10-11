const { execSync } = require('child_process');
const path = require('path');

// --- THIS IS THE CORRECT PATH LOGIC. IT WILL NOT FAIL. ---
const MONOREPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCKER_COMPOSE_FILE = path.resolve(MONOREPO_ROOT, 'docker-compose.yml');
// --- END OF PATH FIX ---

module.exports = async () => {
    console.log('\n[GlobalTeardown] Tearing down the test environment...');
    try {
        const command = `docker compose -f "${DOCKER_COMPOSE_FILE}" down -v --timeout 0`;
        console.log(`[GlobalTeardown] Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
        console.log('[GlobalTeardown] Cleanup finished successfully.');
    } catch (error) {
        console.error('[GlobalTeardown] Error during cleanup:', error);
    }
};