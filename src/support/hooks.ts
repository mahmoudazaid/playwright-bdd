import { After, Before, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { acceptCookies } from '../utils/cookies';

Before(async function (this: CustomWorld) {
  try {
    await this.initBrowser();
    await this.createContext();
    
    // Start tracing (optional, logs warning on failure)
    this.context.tracing.start({ screenshots: true, snapshots: true }).catch(() => {
      console.warn('Tracing start failed, continuing without trace');
    });
    
    await this.navigateToBaseUrl();
    
    // Automatically accept cookies if a consent banner appears
    await acceptCookies(this.page);
  } catch (error) {
    // Clean up on error
    try {
      await this.closeBrowser();
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error; // Re-throw to fail the scenario with clear error message
  }
});

After(async function (this: CustomWorld, scenario) {
  // Attach screenshot on failure
  if (scenario.result?.status === Status.FAILED) {
    try {
      if (this.page) {
        const screenshot = await this.page.screenshot({ fullPage: true });
        await this.attach(screenshot, 'image/png');
      }
    } catch (error) {
      // Screenshot might not be available if page wasn't created
    }
    
    // Attach trace if available
    try {
      if (this.context) {
        const tracePath = `test-results/trace-${Date.now()}.zip`;
        await this.context.tracing.stop({ path: tracePath });
        await this.attach(tracePath, 'application/zip');
      }
    } catch (error) {
      // Trace might not be available, ignore
    }
  }
  
  await this.closeBrowser();
});

