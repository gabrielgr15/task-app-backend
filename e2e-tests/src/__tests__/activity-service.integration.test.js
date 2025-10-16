const axios = require('axios')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')


const API_GATEWAY_BASE_URL = 'http://localhost:4000'



describe('API Gateway Activity Integration', () => {
    it('should return 200 and activities', async () => {
        try {
            const jar = new CookieJar();
            const sessionClient = wrapper(axios.create({
                baseURL: API_GATEWAY_BASE_URL,
                jar
            }));

            const uniqueId = Date.now();
            const username = `Justatest${uniqueId}`;
            const email = `justaemailtest${uniqueId}@gmail.com`;
            const password = "Testpsw";

            const tokens = await sessionClient.post('/api/users/auth/register', {
                email,
                password,
                username
            });
            const accessToken = tokens.data.accessToken;
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
            await new Promise(resolve => setTimeout(resolve, 4000))
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