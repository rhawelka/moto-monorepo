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
});
