import { Browser, BrowserContext, chromium, firefox, webkit } from '@playwright/test';

export interface BrowserConfig {
  browserType: string;
  headless: boolean;
  baseURL: string;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Get browser configuration from environment variables
 * @throws Error if required environment variables are not set
 */
export function getBrowserConfig(): BrowserConfig {
  const browserType = process.env.BROWSER;
  if (!browserType) {
    throw new Error('BROWSER environment variable is not set. Please set it in .env file');
  }

  const headless = process.env.HEADED !== 'true';
  
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not set. Please set it in .env file');
  }

  // Viewport can be set via env vars or use defaults
  const viewportWidth = process.env.VIEWPORT_WIDTH ? parseInt(process.env.VIEWPORT_WIDTH, 10) : 1920;
  const viewportHeight = process.env.VIEWPORT_HEIGHT ? parseInt(process.env.VIEWPORT_HEIGHT, 10) : 1080;

  return {
    browserType: browserType.toLowerCase(),
    headless,
    baseURL,
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
  };
}

/**
 * Get browser launcher based on browser type
 * @throws Error if browser type is not supported
 */
export function getBrowserLauncher(browserType: string) {
  switch (browserType) {
    case 'firefox':
      return firefox;
    case 'safari':
      return webkit;
    case 'chrome':
      return chromium;
    default:
      throw new Error(
        `Unsupported browser type: "${browserType}". ` +
        `Please set BROWSER environment variable to one of: chrome, firefox, safari. ` +
        `Set it in .env file.`
      );
  }
}

/**
 * Launch browser with configuration
 */
export async function launchBrowser(config: BrowserConfig): Promise<Browser> {
  const browserLauncher = getBrowserLauncher(config.browserType);
  return await browserLauncher.launch({
    headless: config.headless,
  });
}

/**
 * Create browser context with base URL and viewport
 * Cookies are accepted by default in Playwright contexts
 */
export async function createBrowserContext(
  browser: Browser,
  config: BrowserConfig
): Promise<BrowserContext> {
  return await browser.newContext({
    baseURL: config.baseURL,
    viewport: config.viewport,
  });
}

/**
 * Get base URL from environment variable
 * @throws Error if BASE_URL is not set
 */
export function getBaseUrl(): string {
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL environment variable is not set. Please set it in .env file');
  }
  return baseURL;
}

