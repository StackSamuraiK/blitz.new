import { test, expect } from '@playwright/test';

test.describe('Builder error state', () => {
  test('should show error when navigating to /builder without a prompt', async ({ page }) => {
    // Intercept skills so it doesn't hang on remote URL
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [] }),
      });
    });

    await page.goto('/builder');

    // The builder should show an error state
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();

    // Should show navigation buttons
    await expect(page.locator('text=Go Back Home')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();

    // Clicking "Go Back Home" should navigate to /
    await page.locator('text=Go Back Home').click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to home on Go Back Home from empty builder', async ({ page }) => {
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [] }),
      });
    });

    await page.goto('/builder');
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
    await page.locator('text=Go Back Home').click();
    await page.waitForURL('/');
    await expect(page.locator('h1')).toContainText('Blitz');
  });

  test('should try to retry when Retry is clicked', async ({ page }) => {
    let templateCallCount = 0;
    await page.route(/\/template/, async route => {
      templateCallCount++;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [] }),
      });
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Retry')).toBeVisible();

    const beforeRetry = templateCallCount;

    await page.locator('text=Retry').click();

    await page.waitForTimeout(1000);
    expect(templateCallCount).toBeGreaterThan(beforeRetry);
  });

  test('should show error on invalid builder state (no router state object)', async ({ page }) => {
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [] }),
      });
    });

    await page.goto('/builder');
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go Back Home' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('should handle template 500 error gracefully', async ({ page }) => {
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Template server error' }),
      });
    });
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [] }),
      });
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('pre')).toContainText('Template server error');
  });
});
