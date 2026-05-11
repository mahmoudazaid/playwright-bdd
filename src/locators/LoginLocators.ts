import { Locator, Page } from '@playwright/test';

/**
 * Login screen selectors only — no actions or waits.
 * Keys in healedSelectors must match the selector string Playwright puts in error messages.
 */
export class LoginLocators {
  private static readonly USERNAME = '[data-test="username"]';
  private static readonly PASSWORD = '[data-test="password"]';
  private static readonly LOGIN_BTN = '//input[@id="signin-button"]';

  constructor(
    private readonly page: Page,
    private readonly healedSelectors?: ReadonlyMap<string, string>
  ) {}

  private pick(canonical: string): Locator {
    const xpath = this.healedSelectors?.get(canonical);
    if (xpath) {
      return this.page.locator(`xpath=${xpath}`);
    }
    return this.page.locator(canonical);
  }

  get usernameInput(): Locator {
    return this.pick(LoginLocators.USERNAME);
  }

  get passwordInput(): Locator {
    return this.pick(LoginLocators.PASSWORD);
  }

  get loginButton(): Locator {
    return this.pick(LoginLocators.LOGIN_BTN);
  }
}
