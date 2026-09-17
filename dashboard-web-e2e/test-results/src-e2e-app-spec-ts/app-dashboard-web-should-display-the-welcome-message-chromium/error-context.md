# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> dashboard-web >> should display the welcome message
- Location: src/e2e/app.spec.ts:4:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Welcome"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- main:
  - text: Welcome back Sign in to continue to your dashboard Login (Email)
  - textbox "Login (Email)"
  - text: Password
  - textbox "Password"
  - button "Show password"
  - button "Login"
  - text: New here?
  - link "Register User":
    - /url: /register
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.describe('dashboard-web', () => {
  4  |   test('should display the welcome message', async ({ page }) => {
  5  |     await page.goto('/');
  6  | 
> 7  |     await expect(page.locator('h1')).toContainText('Welcome');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  8  |   });
  9  | });
  10 | 
```