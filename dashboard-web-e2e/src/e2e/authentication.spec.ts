import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { getAuthenticationLocators } from './locators/authentication';
import { installApiRoute, withPrisma } from './helpers';

test.describe('dashboard-web authentication', () => {
  test('should display the login page for unauthenticated users', async ({
    page,
  }) => {
    const locators = getAuthenticationLocators(page);
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(locators.welcomeBack).toBeVisible();
    await expect(locators.loginButton).toBeVisible();
  });

  test('should start Google OAuth login', async ({ page }) => {
    const locators = getAuthenticationLocators(page);
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
    await locators.googleLoginButton.click();

    expect((await oauthRequest).method()).toBe('GET');
    await expect(page).toHaveURL('http://localhost:3000/api/v1/auth/google');
  });

  test('should register a user, verify it exists, and remove it', async ({
    page,
  }) => {
    const locators = getAuthenticationLocators(page);
    const id = randomUUID();
    const username = `e2e-${id}`;
    const email = `${username}@example.com`;
    const password = 'e2e-password-123';

    await withPrisma(
      async (prisma) => {
        await installApiRoute(page);
        await page.goto('/register');
        await locators.username.fill(username);
        await locators.email.fill(email);
        await locators.registrationPassword.fill(password);
        await locators.confirmPassword.fill(password);

        const registrationResponse = page.waitForResponse(
          (response) =>
            response.url().includes('/api/v1/auth/register') &&
            response.request().method() === 'POST',
        );
        await locators.registerButton.click();
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
      },
      (prisma) => prisma.user.deleteMany({ where: { email } }),
    );
  });
});
