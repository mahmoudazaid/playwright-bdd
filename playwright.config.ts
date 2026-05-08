import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const baseURL = process.env.BASE_URL || 'https://www.saucedemo.com/';

export default defineConfig({
  testDir: './features',
  outputDir: './test-results/playwright-output',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './test-results/playwright-report' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});



