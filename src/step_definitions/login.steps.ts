import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures';
import { BddWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { withHealRetry } from '../utils/withHealRetry';

let loginPage: LoginPage;

Given('I am on the login page', async function (this: BddWorld) {
  await withHealRetry(this.attach, this.page, this, async () => {
    loginPage = new LoginPage(this.page, this.healedSelectors);
    await loginPage.assertLoginFormVisible();
  });
});

When(
  'I log in as {string} with password {string}',
  async function (this: BddWorld, username: string, password: string) {
    await withHealRetry(this.attach, this.page, this, async () => {
      loginPage = new LoginPage(this.page, this.healedSelectors);
      await loginPage.login(username, password);
    });
  }
);

Then('I should land on the inventory page', async function (this: BddWorld) {
  await expect(this.page).toHaveURL(/\/inventory\.html$/);
  await expect(this.page.locator('.title')).toHaveText('Products');
});
