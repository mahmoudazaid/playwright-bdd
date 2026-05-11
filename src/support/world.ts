import { setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';
import {
  getBrowserConfig,
  launchBrowser,
  createBrowserContext,
  getBaseUrl,
} from '../utils/browser';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  /** Failed selector string (as in Playwright errors) → healed XPath from the heal service */
  readonly healedSelectors = new Map<string, string>();
  private browserConfig = getBrowserConfig();

  async initBrowser() {
    this.browser = await launchBrowser(this.browserConfig);
  }

  async createContext() {
    this.context = await createBrowserContext(this.browser, this.browserConfig);
    this.page = await this.context.newPage();
  }

  async navigateToBaseUrl(): Promise<void> {
    // Get baseURL from helper (reads from environment variable)
    const baseURL = getBaseUrl();
    // Navigate to the base URL - uses Playwright's default timeout (30 seconds)
    await this.page.goto(baseURL, {
      waitUntil: 'domcontentloaded',
    });
  }

  async closeBrowser() {
    try {
      if (this.context) {
        await this.context.close();
      }
    } catch (error) {
      // Context might already be closed
    }
    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      // Browser might already be closed
    }
  }
}

setWorldConstructor(CustomWorld);

