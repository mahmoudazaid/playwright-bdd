import type { Page } from '@playwright/test';
import {
  attachSelfHealToReport,
  healLocatorRetryEnabled,
  type AttachFn,
} from './attachSelfHealToReport';

export interface HealRetryRegistry {
  healedSelectors: Map<string, string>;
}

/**
 * Run an action once; on failure, call heal-locator, store XPath on the registry, then run again once.
 * Cucumber AfterStep runs too late to retry — use this around UI actions that should self-heal.
 *
 * When HEAL_LOCATOR_RETRY is false: fail immediately (no heal-and-retry). AfterStep still attaches heal JSON.
 */
export async function withHealRetry<T>(
  attach: AttachFn,
  page: Page | undefined,
  registry: HealRetryRegistry,
  fn: () => Promise<T>
): Promise<T> {
  if (!healLocatorRetryEnabled()) {
    return await fn();
  }
  try {
    return await fn();
  } catch (firstError) {
    const message = firstError instanceof Error ? firstError.message : String(firstError);
    await attachSelfHealToReport(attach, page, message, (failedLocator, healedXpath) => {
      registry.healedSelectors.set(failedLocator, healedXpath);
    });
    return await fn();
  }
}
