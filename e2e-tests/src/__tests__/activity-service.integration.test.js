const axios = require('axios')
const { TestUser } = require('../helpers/testModels')
const bcrypt = require('bcryptjs')


const API_GATEWAY_BASE_URL = 'http://localhost:4000'



describe('API Gateway Activity Integration', () => {
    it('should return 200 and activities', async () => {
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
            await new Promise(resolve => setTimeout(resolve,4000))
            const response = await axios.get(`${API_GATEWAY_BASE_URL}/api/activity`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })            
            expect(response.status).toBe(200)
            expect(response.data).toHaveProperty('activities')
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
})