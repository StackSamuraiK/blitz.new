import { test, expect } from '@playwright/test';

test.describe('Builder interactions', () => {
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
          response: '<boltArtifact id="project-files" title="Project Files"><boltAction type="file" filePath="src/App.tsx">import React from "react";\nexport default function App() { return <div>Hello</div>; }</boltAction><boltAction type="file" filePath="src/index.tsx">import React from "react";\nimport App from "./App";</boltAction></boltArtifact>',
        }),
      });
    });
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          skills: [
            { id: 'responsive', name: 'Responsive Design', description: 'Mobile-friendly', premium: false },
            { id: 'seo', name: 'SEO Optimized', description: 'Search engine optimization', premium: true },
          ],
        }),
      });
    });

    // Navigate to builder with a prompt
    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a website REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 10000 });
  });

  test('should click a file in file explorer and show it in code editor', async ({ page }) => {
    // Expand the src folder using exact text match (targets file explorer, not step headings)
    await page.getByText('src', { exact: true }).click();
    await page.waitForTimeout(200);

    // Now App.tsx should be visible in file explorer (not the step heading)
    await expect(page.getByText('App.tsx', { exact: true })).toBeVisible();

    // Click on App.tsx in the file explorer
    await page.getByText('App.tsx', { exact: true }).click();

    // The code editor should no longer show "No file selected"
    await expect(page.locator('text=No file selected')).not.toBeVisible();
  });

  test('should toggle between code and preview tabs', async ({ page }) => {
    const codeTab = page.locator('button', { hasText: 'Code' });
    const previewTab = page.locator('button', { hasText: 'Preview' });

    await expect(codeTab).toBeVisible();
    await expect(previewTab).toBeVisible();

    // Click preview tab
    await previewTab.click();
    await expect(previewTab).toBeVisible();

    // Click back to code tab
    await codeTab.click();
    await expect(codeTab).toBeVisible();
  });

  test('should show design templates with premium badges', async ({ page }) => {
    await expect(page.locator('text=Design Templates')).toBeVisible();

    // Free skill should be visible
    await expect(page.locator('text=Responsive Design')).toBeVisible();

    // Premium skill should be visible
    await expect(page.locator('text=SEO Optimized')).toBeVisible();
  });

  test('should have chat textarea and send button in AI Assistant panel', async ({ page }) => {
    await expect(page.locator('text=AI Assistant')).toBeVisible();

    // Chat input area should be accessible
    const chatTextarea = page.locator('textarea').last();
    await expect(chatTextarea).toBeVisible();

    // Send button should be present
    const sendButton = page.locator('button', { hasText: 'Send Request' });
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled();
  });

  test('should enable chat send button when text is typed', async ({ page }) => {
    const chatTextarea = page.locator('textarea').last();
    await expect(chatTextarea).toBeVisible();

    await chatTextarea.fill('Add a dark mode toggle');
    const sendButton = page.locator('button', { hasText: 'Send Request' });
    await expect(sendButton).toBeEnabled();
  });

  test('should show no file selected state in code editor', async ({ page }) => {
    // Without clicking any file, the code editor should show "No file selected"
    await expect(page.locator('text=No file selected')).toBeVisible();
    await expect(page.locator('text=Choose a file from the explorer to view its code')).toBeVisible();
  });
});
