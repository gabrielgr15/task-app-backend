const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const path = require('path')

const DOCKER_COMPOSE_FILE = path.resolve(__dirname, '../docker-compose.yml')


async function teardownServices() {
    try {
        const cmd = `docker compose -f "${DOCKER_COMPOSE_FILE}" down -v --timeout 0`;
        console.log(`[GlobalTeardown] Tearing down services... Executing: ${cmd}`);
        const { stdout, stderr } = await execPromise(cmd);
        console.log('[GlobalTeardown] Docker Compose Down STDOUT:', stdout);
        if (stderr) {
            console.log('[GlobalTeardown] Docker Compose Down STDERR:', stderr);
        }
        console.log('[GlobalTeardown] Services torn down.');
    } catch (error) {
        console.error('[GlobalTeardown] Failed to tear down services:', error)
    }
}

module.exports = async () => {
    console.log('\n[GlobalTeardown] Initializing global teardown...');
    await teardownServices();
    console.log('[GlobalTeardown] Global teardown complete.');
};