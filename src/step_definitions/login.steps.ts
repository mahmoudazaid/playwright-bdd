import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';

let loginPage: LoginPage;

Given('I am on the login page', async function (this: CustomWorld) {
  loginPage = new LoginPage(this.page);
  await loginPage.assertLoginFormVisible();
});

When(
  'I log in as {string} with password {string}',
  async function (this: CustomWorld, username: string, password: string) {
    loginPage = new LoginPage(this.page);
    await loginPage.login(username, password);
  }
);

Then('I should land on the inventory page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/inventory\.html$/);
  await expect(this.page.locator('.title')).toHaveText('Products');
});
