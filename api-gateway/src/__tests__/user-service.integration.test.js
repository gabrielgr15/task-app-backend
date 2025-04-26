const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const axios = require('axios')
const { TestUser, TestRefreshToken } = require('./helpers/testModels')
const { connectDB, disconnectDB } = require('./helpers/dbUtils')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')



const DOCKER_COMPOSE_FILE = '../docker-compose.yml';
const SERVICES_TO_START = [
  'api-gateway',
  'user-service',
  'mongo',
  'redis',
]


const API_GATEWAY_BASE_URL = 'http://localhost:3000'
const API_GATEWAY_HEALTH_URL = `${API_GATEWAY_BASE_URL}/health`


async function waitForService(url, timeout = 60000) {
  const startTime = Date.now();
  console.log(`Waiting for service at ${url} to be ready...`);
  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(url)
      console.log(`Service at ${url} is ready.`);
      return true;
    } catch (error) {
      console.log(`Service at ${url} not ready, retrying... (${error.message})`);
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}


describe('API Gateway Authentication Integration', () => {
  beforeAll(async () => {
    console.log(`Starting minimal services for authentication integration test: ${SERVICES_TO_START.join(', ')}`)
    try {
      const { stdout, stderr } = await execPromise(
        `docker compose -f ${DOCKER_COMPOSE_FILE} up --build --detach ${SERVICES_TO_START.join(' ')}`
      )
      console.log('Docker Compose Up STDOUT:', stdout);
      if (stderr) {
        console.error('Docker Compose Up STDERR:', stderr);
      }
      console.log('Waiting for services to become ready...')
      await waitForService(API_GATEWAY_HEALTH_URL)
      await new Promise(resolve => setTimeout(resolve, 1000));
      await connectDB()
      console.log('Minimal services are up and ready.')
    } catch (error) {
      console.error('Failed to start minimal services:', error)
      await execPromise(`docker compose -f ${DOCKER_COMPOSE_FILE} down ${SERVICES_TO_START.join(' ')} || true`)
      throw error
    }
  }, 120000);


  afterAll(async () => {
    console.log(`Tearing down services after authentication integration tests: ${SERVICES_TO_START.join(', ')}`)
    try {
      await disconnectDB()
      const { stdout, stderr } = await execPromise(
        `docker compose -f ${DOCKER_COMPOSE_FILE} down ${SERVICES_TO_START.join(' ')}`
      );
      console.log('Docker Compose Down STDOUT:', stdout);
      if (stderr) {
        console.error('Docker Compose Down STDERR:', stderr);
      }
      console.log('Services torn down.');
    } catch (error) {
      console.error('Failed to tear down services:', error);
    }
  }, 60000)


  beforeEach(async () => {
    try {
      await TestUser.deleteMany({})
      await TestRefreshToken.deleteMany({})
    } catch (error) {
      console.error('!!! Failed to clear test DB in beforeEach:', error)
      throw error;
    }
  }, 10000)


  it('should return 201, access and refresh tokens for valid register credentials', async () => {
    try {
      const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/register`, {
        username: "Justatest",
        email: "justaemailtest@gmail.com",
        password: "Testpsw"
      })
      expect(response.status).toBe(201)

      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');

      expect(typeof response.data.accessToken).toBe('string');
      expect(typeof response.data.refreshToken).toBe('string');
    } catch (error) {
      throw error
    }
  })

  it('should return 200, access and refresh tokens for valid login credentials', async () => {
    try {
      const username = "Justatest"
      const email = "justaemailtest@gmail.com"
      const password = "Testpsw"
      const user = new TestUser({ username, email })
      user.password = await bcrypt.hash(password, 10)
      await user.save()
      const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/login`, {
        email,
        password
      })
      expect(response.status).toBe(200)

      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');

      expect(typeof response.data.accessToken).toBe('string');
      expect(typeof response.data.refreshToken).toBe('string');
    } catch (error) {
      throw error
    }
  })


  it('should return 200, access and refresh tokens for valid refresh token', async () => {
    try {
      const username = "Justatest"
      const email = "justaemailtest@gmail.com"
      const password = "Testpsw"
      const user = new TestUser({ username, email })
      user.password = await bcrypt.hash(password, 10)
      await user.save()
      const newToken = crypto.randomBytes(64).toString('hex')
      const refreshTokenLifespanDays = 7
      const refreshTokenLifespanMilliseconds = refreshTokenLifespanDays * 24 * 60 * 60 * 1000;
      const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenLifespanMilliseconds);
      let refreshToken = new TestRefreshToken({
        token: newToken,
        user: user,
        expiresAt: refreshTokenExpiresAt,
      })
      await refreshToken.save()

      const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/refresh`, {
        token: newToken
      })
      expect(response.status).toBe(200)

      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');

      expect(typeof response.data.accessToken).toBe('string');
      expect(typeof response.data.refreshToken).toBe('string');
    } catch (error) {
      throw error
    }
  })

  it('should return 204 for valid access token, protected route', async () => {
    try {
      const username = "Justatest"
      const email = "justaemailtest@gmail.com"
      const password = "Testpsw"
      const user = new TestUser({ username, email })
      user.password = await bcrypt.hash(password, 10)
      await user.save()
      const tokens = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/login`, {
        email,
        password
      })
      const accessToken = tokens.data.accessToken
      const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/logout`, null, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      expect(response.status).toBe(204)
    } catch (error) {
      console.error('Logout test catch block, error:',error)
      throw error
    }
  })

})