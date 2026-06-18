import { test, expect } from '@playwright/test';

test.describe('Home to Builder flow', () => {
  test('should navigate from home to builder when prompt is submitted', async ({ page }) => {
    // Intercept all API calls so no real backend is needed
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
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: '<boltArtifact><boltAction type="file" filePath="src/App.tsx">console.log("hi")</boltAction></boltArtifact>',
        }),
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

    // Verify home page elements are visible
    await expect(page.locator('h1')).toContainText('Blitz');
    await expect(page.locator('h1')).toContainText('.new');

    // Find the textarea and enter a prompt
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Build a landing page REACT');

    // Verify the submit button is enabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();

    // Click the submit button
    await submitButton.click();

    // Should navigate to /builder
    await page.waitForURL('**/builder');
    await expect(page).toHaveURL(/\/builder/);

    // The builder page should display the prompt in the "Your Request" section
    await expect(page.locator('text=Your Request:')).toBeVisible();
    await expect(page.locator('text=Build a landing page REACT')).toBeVisible();

    // The builder should show the "Building..." status (loading state)
    await expect(page.locator('text=Building...')).toBeVisible();
  });

  test('should keep submit button disabled when prompt is empty', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when text is typed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    const textarea = page.locator('textarea');
    await textarea.fill('Build a landing page');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('should render home page on mobile without layout breakage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();

    // Verify key elements are visible on mobile
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // Verify no horizontal overflow
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('should show step count after ai responds', async ({ page }) => {
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
          response: '<boltArtifact id="project-files" title="Project Files"><boltAction type="file" filePath="src/App.tsx">import React from "react";\nexport default function App() { return <div>Hello</div>; }</boltAction><boltAction type="file" filePath="src/index.tsx">import React from "react";</boltAction></boltArtifact>',
        }),
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

    // Wait for steps to appear
    await expect(page.getByRole('heading', { name: 'Build Steps' }).first()).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
  });

  test('should show project files after ai generates code', async ({ page }) => {
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
        body: JSON.stringify({ skills: [] }),
      });
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // Wait for files to appear in the file explorer
    await expect(page.getByRole('heading', { name: 'Project Files' }).first()).toBeVisible();
    
    // Expand the src folder using exact text match (targets file explorer, not step headings)
    await page.getByText('src', { exact: true }).click();
    await page.waitForTimeout(200);

    await expect(page.getByText('App.tsx', { exact: true })).toBeVisible();
  });

  test('should show ai thinking state while generating', async ({ page }) => {
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
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ skills: [] }),
      });
    });
    // Delay /chat so we can observe the thinking state
    await page.route(/\/chat/, async route => {
      await new Promise(r => setTimeout(r, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: '<boltArtifact><boltAction type="file" filePath="src/App.tsx">console.log("done")</boltAction></boltArtifact>',
        }),
      });
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // AI Assistant panel should show "AI is thinking..."
    await expect(page.locator('text=AI Assistant')).toBeVisible();
    await expect(page.locator('text=AI is thinking...')).toBeVisible();
  });
});
