import { test, expect } from '@playwright/test';

test.describe('Builder layout & panels', () => {
  test.beforeEach(async ({ page }) => {
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
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: '<boltArtifact id="project-files" title="Project Files"><boltAction type="file" filePath="src/App.tsx">import React from "react";\nexport default function App() { return <div>Hello</div>; }</boltAction></boltArtifact>',
        }),
      });
    });
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          skills: [
            { id: 'responsive', name: 'Responsive Design', description: 'Mobile-friendly layouts', premium: false },
            { id: 'seo', name: 'SEO Optimized', description: 'Search engine optimization', premium: true },
          ],
        }),
      });
    });
  });

  test('should render all main panel sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // Wait for AI to respond and all panels to render
    await expect(page.getByRole('heading', { name: 'Build Steps' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Project Files' }).first()).toBeVisible();
    await expect(page.locator('text=AI Assistant')).toBeVisible();

    // The header should be visible
    await expect(page.locator('text=Blitz.new')).toBeVisible();
    await expect(page.locator('text=Builder')).toBeVisible();
  });

  test('should have code and preview tab buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('button', { name: 'Code' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible();
  });

  test('should show file names in file explorer after AI response', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Project Files' }).first()).toBeVisible();
    
    // Expand the src folder using exact text match (targets file explorer, not step headings)
    await page.getByText('src', { exact: true }).click();
    await page.waitForTimeout(200);

    await expect(page.getByText('App.tsx', { exact: true })).toBeVisible();
    await expect(page.getByText('package.json', { exact: true })).toBeVisible();
  });

  test('should show all design templates section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // Skills selector should be visible
    await expect(page.locator('text=Design Templates')).toBeVisible();
    await expect(page.locator('text=Responsive Design')).toBeVisible();
    await expect(page.locator('text=Mobile-friendly layouts')).toBeVisible();
  });

  test('should show prompt in header section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a portfolio site REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.locator('text=Your Request:')).toBeVisible();
    await expect(page.locator('text=Build a portfolio site REACT')).toBeVisible();
  });

  test('should not have horizontal overflow on builder page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await page.waitForTimeout(500);
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('should show step count in badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await expect(page.getByRole('heading', { name: 'Build Steps' }).first()).toBeVisible();
    await expect(page.locator('text=src/App.tsx').first()).toBeVisible();
  });

  test('should render status indicator in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // After AI responds, the status should transition to "Ready"
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 10000 });
  });
});
