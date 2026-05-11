import type { Page } from '@playwright/test';
import type { IWorld } from '@cucumber/cucumber';
import { attachSelfHealToReport } from './attachSelfHealToReport';

type AttachFn = IWorld['attach'];

export interface HealRetryRegistry {
  healedSelectors: Map<string, string>;
}

/**
 * Run an action once; on failure, call heal-locator, store XPath on the registry, then run again once.
 * Cucumber AfterStep runs too late to retry — use this around UI actions that should self-heal.
 */
export async function withHealRetry<T>(
  attach: AttachFn,
  page: Page | undefined,
  registry: HealRetryRegistry,
  fn: () => Promise<T>
): Promise<T> {
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
