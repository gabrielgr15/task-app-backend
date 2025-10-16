const axios = require('axios')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')


const API_GATEWAY_BASE_URL = 'http://localhost:4000'


describe('User Service e2e tests', () => {
  it('[USER SERVICE REGISTER TEST] should return 201 and access token for valid register credentials', async () => {
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

      const response = await sessionClient.post('/api/users/auth/register', {
        email,
        password,
        username
      });
      expect(response.status).toBe(201)

      expect(response.data).toHaveProperty('accessToken');

      expect(typeof response.data.accessToken).toBe('string');
    } catch (error) {
      throw error
    }
  })

  it('[USER SERVICE LOGIN TEST]should return 200, access token for valid login credentials', async () => {
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

      const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/login`, {
        email,
        password
      });
      expect(response.status).toBe(200)

      expect(response.data).toHaveProperty('accessToken');

      expect(typeof response.data.accessToken).toBe('string');
    } catch (error) {
      throw error
    }
  })


  it('[USER SERVICE LOGOUT TEST]should return 204 for valid access token, protected route (Cookie Jar Fix)', async () => {
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

      const logoutResponse = await sessionClient.post(`/api/users/auth/logout`, null, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })

      expect(logoutResponse.status).toBe(204);

      console.log("Logout successful using Cookie Jar client.");

    } catch (error) {
      if (error.response) {
        console.error('Logout failed with status:', error.response.status);
        console.error('Error details:', error.response.data);
      } else {
        console.error('Logout test catch block, error:', error);
      }
      throw error;
    }
  })

})