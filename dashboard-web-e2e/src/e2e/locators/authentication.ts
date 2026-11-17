import type { Page } from '@playwright/test';

export function getAuthenticationLocators(page: Page) {
  return {
    welcomeBack: page.getByText('Welcome back', { exact: true }),
    emailOrUsername: page.getByLabel('Email or username'),
    loginPassword: page.getByRole('textbox', { name: 'Password' }),
    loginButton: page.getByRole('button', {
      name: 'Login',
      exact: true,
    }),
    googleLoginButton: page.getByRole('button', {
      name: 'Continue with Google',
    }),
    username: page.getByLabel('Username'),
    email: page.getByLabel('Email'),
    registrationPassword: page.getByLabel('Password', { exact: true }),
    confirmPassword: page.getByLabel('Confirm Password'),
    registerButton: page.getByRole('button', { name: 'Register User' }),
  };
}
