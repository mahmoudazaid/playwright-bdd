import { Locator, Page } from '@playwright/test';

/**
 * Login screen selectors only — no actions or waits.
 */
export class LoginLocators {
  constructor(private readonly page: Page) {}

  get usernameInput(): Locator {
    return this.page.locator('[data-test="username"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('[data-test="password"]');
  }

  get loginButton(): Locator {
    return this.page.locator('//input[@id="signin-button"]');
  }
}
