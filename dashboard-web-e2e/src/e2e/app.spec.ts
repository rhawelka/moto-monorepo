import { expect, test } from '@playwright/test';

test.describe('dashboard-web', () => {
  test('should display the welcome message', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Welcome');
  });
});