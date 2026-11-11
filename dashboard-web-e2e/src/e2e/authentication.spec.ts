import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test.describe('dashboard-web authentication', () => {
  test('should display the login page for unauthenticated users', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Welcome back', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Login', exact: true }),
    ).toBeVisible();
  });

  test('should start Google OAuth login', async ({ page }) => {
    await page.route('http://localhost:3000/api/v1/auth/google', (route) =>
      route.fulfill({
        status: 200,
        body: 'OAuth flow started',
      }),
    );

    await page.goto('/login');
    const oauthRequest = page.waitForRequest(
      'http://localhost:3000/api/v1/auth/google',
    );
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    expect((await oauthRequest).method()).toBe('GET');
    await expect(page).toHaveURL('http://localhost:3000/api/v1/auth/google');
  });

  test('should register a user, verify it exists, and remove it', async ({
    page,
  }) => {
    const databaseUrl = process.env['E2E_DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error(
        'E2E_DATABASE_URL is required to run dashboard E2E tests.',
      );
    }

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const id = randomUUID();
    const username = `e2e-${id}`;
    const email = `${username}@example.com`;
    const password = 'e2e-password-123';

    try {
      await page.route('http://localhost:3000/api/v1/**', (route) => {
        const apiUrl = new URL(route.request().url());
        apiUrl.hostname = '127.0.0.1';
        apiUrl.port = '3101';
        return route.continue({ url: apiUrl.toString() });
      });

      await page.goto('/register');
      await page.getByLabel('Username').fill(username);
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByLabel('Confirm Password').fill(password);

      const registrationResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/auth/register') &&
          response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Register User' }).click();
      const response = await registrationResponse;
      expect(response.status()).toBe(201);
      await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);

      await expect
        .poll(async () => {
          const user = await prisma.user.findUnique({ where: { email } });
          return (
            user && {
              username: user.username,
              email: user.email,
              role: user.role,
            }
          );
        })
        .toMatchObject({ username, email, role: 'USER' });
    } finally {
      try {
        await prisma.user.deleteMany({ where: { email } });
      } finally {
        await prisma.$disconnect();
      }
    }
  });
});
