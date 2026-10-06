import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { E2E_DATABASE_URL } from '../support/e2e-config';

let registeredEmail: string | undefined;

afterAll(async () => {
  if (!registeredEmail) return;

  const prisma = new PrismaClient({
    datasources: { db: { url: E2E_DATABASE_URL } },
  });

  try {
    await prisma.user.deleteMany({ where: { email: registeredEmail } });
  } finally {
    await prisma.$disconnect();
  }
});

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

  describe('authentication flow', () => {
    it('registers, reads the profile, and logs in', async () => {
      const id = randomUUID();
      const username = `e2e-${id}`;
      const email = `e2e-${id}@example.com`;
      const password = 'e2e-password-123';
      registeredEmail = email;

      const registration = await axios.post('/api/v1/auth/register', {
        username,
        email,
        password,
      });

      expect(registration.status).toBe(201);
      expect(registration.data.user).toMatchObject({
        username,
        email,
        role: 'USER',
      });
      expect(registration.data.user).not.toHaveProperty('passwordHash');
      expect(registration.data.access_token).toEqual(expect.any(String));

      const registeredProfile = await axios.get('/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${registration.data.access_token}` },
      });

      expect(registeredProfile.data).toEqual({
        userId: registration.data.user.id,
        email,
        role: 'USER',
      });

      const login = await axios.post('/api/v1/auth/login', {
        email,
        password,
      });

      expect(login.status).toBe(201);
      expect(login.data.user).toEqual({
        id: registration.data.user.id,
        email,
        role: 'USER',
      });
      expect(login.data.access_token).toEqual(expect.any(String));

      const loggedInProfile = await axios.get('/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${login.data.access_token}` },
      });

      expect(loggedInProfile.data).toEqual(registeredProfile.data);
    });
  });
});
