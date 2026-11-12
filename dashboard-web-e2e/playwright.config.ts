import { defineConfig, devices } from '@playwright/test';

const port = process.env['PORT'] || '4200';

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `npm run start:ui -- --port=${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'npx nx run api:serve-e2e',
      url: 'http://localhost:3101/api/v1/auth/profile',
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
