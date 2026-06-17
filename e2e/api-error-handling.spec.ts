import { test, expect } from '@playwright/test';

test.describe('API error handling', () => {
  test('should show error state when /template returns 500', async ({ page }) => {
    // Intercept all API calls — prevent hanging on /skills, /chat etc
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
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
    // Wait for key home page element instead of networkidle
    await expect(page.locator('textarea')).toBeVisible();

    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();

    // Should navigate to /builder
    await page.waitForURL('**/builder');

    // Builder should show error state with navigation buttons
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Go Back Home')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should show error state when /chat returns 500', async ({ page }) => {
    // Intercept all API calls
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prompts: ['You are a developer.'],
          uiPrompts: ['<boltArtifact><boltAction type="file" filePath="package.json">{"name":"test"}</boltAction></boltArtifact>'],
        }),
      });
    });
    await page.route(/\/chat/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI generation failed' }),
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
    await expect(page.locator('text=Go Back Home')).toBeVisible();
  });

  test('should navigate back to home when "Go Back Home" is clicked', async ({ page }) => {
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Error' }),
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
    await page.locator('textarea').fill('Build a test');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');
    await expect(page.locator('text=Go Back Home')).toBeVisible();

    await page.locator('text=Go Back Home').click();
    await expect(page).toHaveURL('/');
  });

  test('should show error with retry button on API failure', async ({ page }) => {
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API error occurred' }),
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
    await page.locator('textarea').fill('Build a test');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Retry')).toBeVisible();
    await expect(page.locator('text=Go Back Home')).toBeVisible();
  });

  test('should show error details in pre element', async ({ page }) => {
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
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
    await page.locator('textarea').fill('Build a test REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });

    const pre = page.locator('pre');
    await expect(pre).toBeVisible();
    await expect(pre).toContainText('Internal server error');
  });

  test('should handle network error gracefully', async ({ page }) => {
    // Abort the request to simulate network failure
    await page.route(/\/template/, async route => {
      await route.abort('connectionrefused');
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
    await page.locator('textarea').fill('Build a test');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Go Back Home')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should handle malformed template response', async ({ page }) => {
    await page.route(/\/template/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ invalid: 'response format' }),
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
    await page.locator('textarea').fill('Build a test REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
  });

  test('should handle slow API response with timeout', async ({ page }) => {
    await page.route(/\/template/, async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prompts: ['You are a developer.'],
          uiPrompts: ['<boltArtifact><boltAction type="file" filePath="package.json">{}</boltAction></boltArtifact>'],
        }),
      });
    });
    await page.route(/\/chat/, async route => {
      await route.abort('connectionrefused');
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
    await page.locator('textarea').fill('Build a test');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // Should show loading while waiting for template & skills
    await expect(page.locator('text=Building...')).toBeVisible();

    // Eventually should show error when /chat fails
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 20000 });
  });
});
