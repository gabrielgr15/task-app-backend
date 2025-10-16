// File: e2e-tests/src/jest.global.setup.js

const { execSync } = require('child_process');
const path = require('path');
const axios = require('axios');

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCKER_COMPOSE_FILE = path.resolve(MONOREPO_ROOT, 'docker-compose.yml');
const DOCKER_COMPOSE_DEV_FILE = path.resolve(MONOREPO_ROOT, 'docker-compose.dev.yml');

const API_GATEWAY_HEALTH_URL = 'http://localhost:4000/health';

async function waitForApiGateway(timeout = 180000) {
    const startTime = Date.now();
    console.log(`[GlobalSetup] Waiting for API Gateway at ${API_GATEWAY_HEALTH_URL}...`);
    while (Date.now() - startTime < timeout) {
        try {
            await axios.get(API_GATEWAY_HEALTH_URL, { timeout: 2000 });
            console.log('[GlobalSetup] API Gateway is ready!');
            return;
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    throw new Error(`API Gateway did not become healthy within ${timeout / 1000} seconds.`);
}

module.exports = async () => {
    console.log('\n[GlobalSetup] Starting Docker Compose...');
    try {
        const command = `NODE_ENV=test docker compose -f "${DOCKER_COMPOSE_FILE}" -f "${DOCKER_COMPOSE_DEV_FILE}" up --build --force-recreate -d`;
        console.log(`[GlobalSetup] Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });

        console.log('[GlobalSetup] Docker containers launched. Waiting for services to become healthy...');
        await waitForApiGateway();

        console.log('\n[GlobalSetup] Setup complete. Running tests...');
    } catch (error) {
        console.error('\n[GlobalSetup] FATAL: Setup failed.', error);
        try {
            console.error('\n[GlobalSetup] Dumping container logs...');
            execSync(`docker compose -f "${DOCKER_COMPOSE_FILE}" logs`, { stdio: 'inherit' });
        } catch (logError) {
            console.error('[GlobalSetup] Could not retrieve Docker logs.');
        } finally {
            console.error('\n[GlobalSetup] Cleaning up...');
            execSync(`docker compose -f "${DOCKER_COMPOSE_FILE}" down -v`);
            process.exit(1);
        }
    }
};