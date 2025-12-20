import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { SearchPage } from '../pages/SearchPage';

let searchPage: SearchPage;

Given('I open the Search & Map page', async function (this: CustomWorld) {
  searchPage = new SearchPage(this.page);
});

When('I search for {string}', async function (this: CustomWorld, location: string) {
  await searchPage.searchForLocation(location);
});

Then('I should see results loaded', async function (this: CustomWorld) {
  await this.page.waitForTimeout(2000);  
  const hasResults = await searchPage.hasResults();
  expect(hasResults).toBeTruthy();
});