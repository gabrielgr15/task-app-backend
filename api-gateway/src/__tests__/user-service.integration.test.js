const axios = require('axios')
const { TestUser, TestRefreshToken } = require('./helpers/testModels')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')


const API_GATEWAY_BASE_URL = 'http://localhost:4000'


describe('API Gateway Authentication Integration', () => {
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

      expect(typeof response.data.accessToken).toBe('string');
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

      expect(typeof response.data.accessToken).toBe('string');
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