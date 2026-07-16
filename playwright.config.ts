import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import * as dotenv from 'dotenv';

dotenv.config();

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['src/support/fixtures.ts', 'src/support/hooks.ts', 'src/step_definitions/**/*.ts'],
  featuresRoot: 'features',
});

const baseURL = process.env.BASE_URL || 'https://www.saucedemo.com/';
const browser = (process.env.BROWSER || 'chrome').toLowerCase();
const headed = process.env.HEADED === 'true';

const viewport = {
  width: parseInt(process.env.VIEWPORT_WIDTH || '1920', 10),
  height: parseInt(process.env.VIEWPORT_HEIGHT || '1080', 10),
};

const browserProject =
  browser === 'firefox'
    ? { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
    : browser === 'safari'
      ? { name: 'webkit', use: { ...devices['Desktop Safari'] } }
      : { name: 'chromium', use: { ...devices['Desktop Chrome'] } };

export default defineConfig({
  testDir,
  outputDir: 'test-results/playwright-output',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: [
    ['list'],
    cucumberReporter('json', { outputFile: 'test-results/cucumber/cucumber-report.json' }),
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    headless: !headed,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    viewport,
  },
  projects: [browserProject],
});
