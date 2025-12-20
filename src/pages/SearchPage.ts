import { Page, Locator } from '@playwright/test';

export class SearchPage {
  constructor(private page: Page) {}

  get searchInputLocator(): Locator {
    return this.page.locator('input[type="search"]');
  }

  get resultsList(): Locator {
    return this.page.locator('[id*="ResultListContainer"]').first();
  }

  async searchForLocation(location: string): Promise<void> {
    await this.searchInputLocator.waitFor({ state: 'visible' });
    await this.searchInputLocator.scrollIntoViewIfNeeded();
    await this.searchInputLocator.fill(location);
    await this.page.waitForTimeout(500)
    
    await this.searchInputLocator.press('Enter');
  }

  async hasResults(): Promise<boolean> {
    try {
      const resultItems = this.resultsList;
      const itemCount = await resultItems.count();      
      return itemCount > 0;
    } catch {
      return false;
    }
  }
}



