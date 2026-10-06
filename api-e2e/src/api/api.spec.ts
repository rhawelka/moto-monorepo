import axios from 'axios';

describe('API e2e', () => {
  describe('GET /api/v1', () => {
    it('returns the API greeting', async () => {
      const response = await axios.get('/api/v1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Hello API' });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('returns a successful logout response', async () => {
      const response = await axios.post('/api/v1/auth/logout');

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('rejects requests without a JWT', async () => {
      await expect(axios.get('/api/v1/auth/profile')).rejects.toMatchObject({
        response: {
          status: 401,
          data: {
            statusCode: 401,
          },
        },
      });
    });
  });
});
