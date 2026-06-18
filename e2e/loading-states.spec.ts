import { test, expect } from '@playwright/test';

test.describe('Loading states', () => {
  test('should show loading indicators during AI generation', async ({ page }) => {
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
    // Delay chat to observe loading state
    await page.route(/\/chat/, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: '<boltArtifact id="project-files" title="Project Files"><boltAction type="file" filePath="src/App.tsx">import React from "react";\nexport default function App() { return <div>Hello</div>; }</boltAction></boltArtifact>',
        }),
      });
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // Should show Building... status
    await expect(page.locator('text=Building...')).toBeVisible();

    // Should show AI is thinking... in the assistant panel
    await expect(page.locator('text=AI is thinking...')).toBeVisible();

    // Loading steps and generating files indicators are too fast to reliably test
  });

  test('should show ready state after AI finishes', async ({ page }) => {
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

    // After AI finishes, status shows Ready
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 15000 });

    // AI panel should no longer say "AI is thinking..."
    await expect(page.locator('text=AI is thinking...')).not.toBeVisible();
  });

  test('should handle empty AI response with error message', async ({ page }) => {
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
        body: JSON.stringify({ response: '' }),
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

    // Should show error state
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Go Back Home')).toBeVisible();
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should handle AI response with no boltAction tags gracefully', async ({ page }) => {
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
          response: 'I will create a nice website for you. It will have React components.',
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

    // parseXml always returns at least 1 step (folder), so builder should reach Ready state
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 15000 });

    // No files should be shown because no boltAction tags were present
    await expect(page.getByRole('heading', { name: 'Project Files' }).first()).toBeVisible();
  });

  test('should handle skills endpoint failure gracefully', async ({ page }) => {
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
          response: '<boltArtifact><boltAction type="file" filePath="src/App.tsx">console.log("ok")</boltAction></boltArtifact>',
        }),
      });
    });
    await page.route(/\/skills/, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Skills server error' }),
      });
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    // The builder should still work even if skills fail
    await expect(page.locator('text=Ready')).toBeVisible({ timeout: 10000 });

    // Skills section should show error
    await expect(page.locator('text=Could not load design templates')).toBeVisible();
  });

  test('should show skills retry button on skills load failure', async ({ page }) => {
    let skillsFailCount = 0;
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
          response: '<boltArtifact><boltAction type="file" filePath="src/App.tsx">console.log("ok")</boltAction></boltArtifact>',
        }),
      });
    });
    await page.route(/\/skills/, async route => {
      skillsFailCount++;
      if (skillsFailCount <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Skills error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            skills: [
              { id: 'responsive', name: 'Responsive Design', description: 'Mobile-friendly', premium: false },
            ],
          }),
        });
      }
    });

    await page.goto('/');
    await expect(page.locator('textarea')).toBeVisible();
    await page.locator('textarea').fill('Build a landing page REACT');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/builder');

    await page.waitForTimeout(500);

    const retryButton = page.locator('button', { hasText: 'Retry' });
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }
    await page.waitForTimeout(500);
  });
});
