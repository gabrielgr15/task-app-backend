const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const axios = require('axios')
const path = require('path')
console.log('[GlobalSetup] Initial process.env check:');
console.log('GATEWAY_PORT=', process.env.GATEWAY_PORT);
console.log('MONGO_USER_URI=', process.env.MONGO_USER_URI)
console.log('JWT_SECRET exists?', !!process.env.JWT_SECRET)

const SERVICES_TO_START = [
    'api-gateway',
    'tasks-service',
    'mongo',
    'redis',
    'rabbitmq',
    'user-service',
    'activity-service'
]

const DOCKER_COMPOSE_FILE = path.resolve(__dirname, '../docker-compose.yml')
const API_GATEWAY_BASE_URL = 'http://127.0.0.1:3000'
const API_GATEWAY_HEALTH_URL = `${API_GATEWAY_BASE_URL}/health`

async function waitForService(url, timeout = 600000) {
    const startTime = Date.now();
    console.log(`[GlobalSetup] Waiting for service at ${url} (timeout: ${timeout / 1000}s)...`);
    while (Date.now() - startTime < timeout) {
        try {
            const response = await axios.get(url, { timeout: 4500 })
            if (response.status === 200) {
                 console.log(`[GlobalSetup] Service at ${url} is ready.`);
                 return true
            } else {
                 console.log(`[GlobalSetup] Service at ${url} returned status ${response.status}. Retrying...`);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
                 console.log(`[GlobalSetup] Service at ${url} not ready (${error.code || error.message}). Retrying...`);
            } else {
                 console.error(`[GlobalSetup] Unexpected error waiting for ${url}:`, error.message);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
    throw new Error(`[GlobalSetup] Service at ${url} did not become ready within ${timeout}ms`);
}

async function startServices() {
    console.log(`[GlobalSetup] Starting services: ${SERVICES_TO_START.join(', ')}`)
    const cmd = `docker compose -f "${DOCKER_COMPOSE_FILE}" up --force-recreate -d ${SERVICES_TO_START.join(' ')}`;
    console.log(`[GlobalSetup] Executing: ${cmd}`);
    try {
        const { stdout, stderr } = await execPromise(cmd) 
        console.log('[GlobalSetup] Docker Compose Up STDOUT:', stdout);
        if (stderr) {
            console.error('[GlobalSetup] Docker Compose Up STDERR:', stderr)
        }

        console.log('[GlobalSetup] Waiting for API Gateway health check...');
        await waitForService(API_GATEWAY_HEALTH_URL)
        console.log('[GlobalSetup] Services seem ready.')
    } catch (error) {
        console.error('[GlobalSetup] FATAL: Failed to start or wait for services:', error)
        try {
            console.error('[GlobalSetup] Attempting cleanup via docker compose down...')
            await execPromise(`docker compose -f "${DOCKER_COMPOSE_FILE}" down -v --timeout 0`);
            console.error('[GlobalSetup] Cleanup finished.');
        } catch (downError) {
            console.error('[GlobalSetup] Cleanup failed:', downError);
        }
        process.exit(1);
    }
}

module.exports = async () => {
    console.log('\n[GlobalSetup] Initializing global setup...')
    await startServices();
    console.log('[GlobalSetup] Global setup initialization complete.')
}
