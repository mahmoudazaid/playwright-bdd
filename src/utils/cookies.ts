import { Page } from '@playwright/test';

/**
 * Automatically accept cookies by clicking common cookie consent buttons
 * This handles cookie consent banners that appear on many websites
 */
export async function acceptCookies(page: Page): Promise<void> {
  try {
    // Common cookie consent button selectors (try multiple strategies)
    const cookieSelectors = [
      // Common button texts
      page.getByRole('button', { name: /accept|akzeptieren|annehmen|zulassen|ok|einverstanden/i }),
      page.getByRole('button', { name: /accept all|alle akzeptieren|alle cookies/i }),
      page.getByRole('button', { name: /agree|zustimmen/i }),
      // Common aria-labels
      page.locator('[aria-label*="accept" i], [aria-label*="akzeptieren" i]'),
      // Common IDs and classes
      page.locator('#accept-cookies, #cookie-accept, .cookie-accept, .accept-cookies'),
      // Common button with cookie-related text
      page.locator('button:has-text("Cookie"), button:has-text("cookie")'),
    ];

    // Try each selector with a short timeout
    for (const selector of cookieSelectors) {
      try {
        const element = selector.first();
        // Wait for element to be visible (with short timeout)
        await element.waitFor({ state: 'visible', timeout: 2000 });
        await element.click();
        // Wait a bit for the banner to disappear
        await page.waitForTimeout(500);
        return; // Successfully clicked, exit
      } catch (error) {
        // Try next selector
        continue;
      }
    }
  } catch (error) {
    // No cookie banner found or already accepted - this is fine
    // Silently continue as not all sites have cookie banners
  }
}

