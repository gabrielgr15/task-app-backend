const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)
const axios = require('axios')
const { TestUser } = require('./helpers/testModels')
const { connectDB, disconnectDB } = require('./helpers/dbUtils')
const bcrypt = require('bcryptjs')



const DOCKER_COMPOSE_FILE = '../docker-compose.yml';
const SERVICES_TO_START = [
    'api-gateway',
    'tasks-service',
    'mongo',
    'redis',
    'rabbitmq',
    'user-service'
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


describe('API Gateway Tasks Integration', () => {
    beforeAll(async () => {
        console.log(`Starting minimal services for tasks integration test: ${SERVICES_TO_START.join(', ')}`)
        try {
            const { stdout, stderr } = await execPromise(
                `docker compose -f ${DOCKER_COMPOSE_FILE} up ${SERVICES_TO_START.join(' ')}`
            )
            console.log('Docker Compose Up STDOUT:', stdout)
            if (stderr) {
                console.error('Docker Compose Up STDERR:', stderr)
            }
            console.log('Waiting for services to become ready...')
            await waitForService(API_GATEWAY_HEALTH_URL)
            await new Promise(resolve => setTimeout(resolve, 1000));
            await connectDB()
            console.log('Minimal services are up and ready.')
        } catch (error) {
            console.error('Failed to start minimal services:', error)
            await execPromise(`docker compose -f ${DOCKER_COMPOSE_FILE} down -v ${SERVICES_TO_START.join(' ')} || true`)
            throw error
        }
    }, 120000);


    afterAll(async () => {
        console.log(`Tearing down services after authentication integration tests: ${SERVICES_TO_START.join(', ')}`)
        try {
            await disconnectDB()
            const { stdout, stderr } = await execPromise(
                `docker compose -f ${DOCKER_COMPOSE_FILE} down -v ${SERVICES_TO_START.join(' ')}`
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
        } catch (error) {
            console.error('!!! Failed to clear test DB in beforeEach:', error)
            throw error;
        }
    }, 10000)


    it('should return 201, msg, taskId, title, status and description', async () => {
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
            const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/tasks`, {
                title: "Learn backend",
                status: "In progress",
                description: "Writing integration tests"
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            expect(response.status).toBe(201)

            expect(response.data).toHaveProperty('msg')
            expect(response.data).toHaveProperty('taskId')
            expect(response.data).toHaveProperty('title')
            expect(response.data).toHaveProperty('status')
            expect(response.data).toHaveProperty('description')
        } catch (error) {
            console.error('error in catch for post task test:', error)
            throw error
        }
    })


    it('should return 200, totalTasks and tasks', async () => {
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
            await axios.post(`${API_GATEWAY_BASE_URL}/api/tasks`, {
                title: "Learn backend",
                status: "In progress",
                description: "Writing integration tests"
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })            
            //get receives only two arguments, post recevies 3
            const response = await axios.get(`${API_GATEWAY_BASE_URL}/api/tasks`,{
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            expect(response.status).toBe(200)

            expect(response.data).toHaveProperty('totalTasks')
            expect(response.data).toHaveProperty('tasks')            
        } catch (error) {            
            const method = error.config?.method?.toUpperCase()
            const url = error.config?.url
            console.error(`Request: ${method || 'N/A'} ${url || 'N/A'}`)
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                try {
                    console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
                } catch {
                    console.error('Response Data (Raw):', error.response.data);
                }
            } else {
                console.error(`Error Code: ${error.code || 'N/A'}`);
                console.error(`Message: ${error.message}`);
            }
            throw new Error(`Test failed for ${method} ${url}. See logs.`);
        }
    })


    it('should return 200, msg, taskId, title, status  and description', async () => {
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
            const newTask = await axios.post(`${API_GATEWAY_BASE_URL}/api/tasks`, {
                title: "Learn backend",
                status: "In progress",
                description: "Writing integration tests"
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            const taskId = newTask.data.taskId 
            const response = await axios.patch(`${API_GATEWAY_BASE_URL}/api/tasks/${taskId}`, {
                title: "Learn more backend",
                status: "almost there",
                description: "Finishing integration tests"
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            expect(response.status).toBe(200)

            expect(response.data).toHaveProperty('msg')
            expect(response.data).toHaveProperty('taskId')
            expect(response.data).toHaveProperty('title')
            expect(response.data).toHaveProperty('status')
            expect(response.data).toHaveProperty('description')
        } catch (error) {
            console.error('error in catch for post task test:', error)
            throw error
        }
    })

    it('should return 200 and msg', async () => {
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
            const newTask = await axios.post(`${API_GATEWAY_BASE_URL}/api/tasks`, {
                title: "Learn backend",
                status: "In progress",
                description: "Writing integration tests"
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            const taskId = newTask.data.taskId 
            const response = await axios.delete(`${API_GATEWAY_BASE_URL}/api/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('msg')
        } catch (error) {
            console.error('error in catch for post task test:', error)
            throw error
        }
    })
})