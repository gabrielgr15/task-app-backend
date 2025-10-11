const axios = require('axios')
const { TestUser } = require('../helpers/testModels')
const bcrypt = require('bcryptjs')


const API_GATEWAY_BASE_URL = 'http://localhost:4000'


describe('API Gateway Tasks Integration', () => {
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
            expect(response.data).toHaveProperty('task')
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
            //get receives only two arguments, post receives 3
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
            const taskId = newTask.data.task._id
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

            expect(response.data).toHaveProperty('msg');
            expect(response.data).toHaveProperty('task');
            
            expect(response.data.task).toHaveProperty('_id');
            expect(response.data.task).toHaveProperty('title');
            expect(response.data.task).toHaveProperty('status');
            expect(response.data.task).toHaveProperty('description')
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
            const taskId = newTask.data.task._id 
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