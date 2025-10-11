const axios = require('axios')
const { TestUser, TestRefreshToken } = require('../helpers/testModels')
const bcrypt = require('bcryptjs')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')


const API_GATEWAY_BASE_URL = 'http://localhost:4000'


describe('API Gateway Authentication Integration', () => {
  it('should return 201 and access token for valid register credentials', async () => {
    try {
      const response = await axios.post(`${API_GATEWAY_BASE_URL}/api/users/auth/register`, {
        username: "Justatest",
        email: "justaemailtest@gmail.com",
        password: "Testpsw"
      })
      expect(response.status).toBe(201)

      expect(response.data).toHaveProperty('accessToken');

      expect(typeof response.data.accessToken).toBe('string');
    } catch (error) {
      throw error
    }
  })

  it('should return 200, access token for valid login credentials', async () => {
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

      expect(typeof response.data.accessToken).toBe('string');
    } catch (error) {
      throw error
    }
  })


  it('should return 204 for valid access token, protected route (Cookie Jar Fix)', async () => {
    try {
      const jar = new CookieJar();
      const sessionClient = wrapper(axios.create({
        baseURL: API_GATEWAY_BASE_URL,
        jar
      }));

      const testEmail = "cookiejartest@gmail.com";
      const testUsername = "CookieJarUser";
      const testPassword = "Testpsw";
      
      const loginResponse = await sessionClient.post(`/api/users/auth/register`, {
        email: testEmail,
        password: testPassword,
        username: testUsername
      })

      const accessToken = loginResponse.data.accessToken;

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