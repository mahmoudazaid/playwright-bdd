import { Page } from '@playwright/test';
import { LoginLocators } from '../locators/LoginLocators';

export class LoginPage {
  private readonly locators: LoginLocators;

  constructor(page: Page, healedSelectors?: ReadonlyMap<string, string>) {
    this.locators = new LoginLocators(page, healedSelectors);
  }

  async assertLoginFormVisible(): Promise<void> {
    const visible = { state: 'visible' as const, timeout: 500 };
    await this.locators.usernameInput.waitFor(visible);
    await this.locators.passwordInput.waitFor(visible);
    await this.locators.loginButton.waitFor(visible);
  }

  async login(username: string, password: string): Promise<void> {
    await this.locators.usernameInput.fill(username);
    await this.locators.passwordInput.fill(password);
    await this.locators.loginButton.click();
  }
}
