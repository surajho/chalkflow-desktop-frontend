import { test, expect } from '@playwright/test';

test.describe('E2E Test Example: Login Flow', () => {
  test('should display login form on app load', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await expect(page.getByText('Chalkflow')).toBeVisible();
    await expect(page.getByText('Login to BTWB')).toBeVisible();
    await expect(page.getByLabel('Email:')).toBeVisible();
    await expect(page.getByLabel('Password:')).toBeVisible();
  });

  test('should allow typing in email and password fields', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const emailInput = page.getByLabel('Email:');
    const passwordInput = page.getByLabel('Password:');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });
});
