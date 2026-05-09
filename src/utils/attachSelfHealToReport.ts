import type { Page } from '@playwright/test';
import type { IWorld } from '@cucumber/cucumber';
import { SelfHealingClient } from './SelfHealingClient';
import { extractLocatorFromPlaywrightError } from './extractLocatorFromPlaywrightError';

type AttachFn = IWorld['attach'];

function healOnFailureEnabled(): boolean {
  return process.env.HEAL_ON_FAILURE !== 'false';
}

async function safeAttach(attach: AttachFn, payload: unknown): Promise<void> {
  const body = JSON.stringify(payload, null, 2);
  await Promise.resolve(attach(body, 'application/json'));
}

/**
 * On step failure: extract locator from the error text, call heal-locator with current page DOM,
 * and attach the outcome to the Cucumber report (never throws).
 */
export async function attachSelfHealToReport(
  attach: AttachFn,
  page: Page | undefined,
  failureMessage: string
): Promise<void> {
  try {
    if (!healOnFailureEnabled()) {
      await safeAttach(attach, { skipped: true, reason: 'disabled' });
      return;
    }

    const failedLocator = extractLocatorFromPlaywrightError(failureMessage);
    if (!failedLocator) {
      await safeAttach(attach, {
        skipped: true,
        reason: 'no_locator_in_message',
        failureMessageSnippet: failureMessage.slice(0, 500),
      });
      return;
    }

    if (!page) {
      await safeAttach(attach, { skipped: true, reason: 'no_page', failedLocator });
      return;
    }

    try {
      const client = new SelfHealingClient();
      const heal = await client.healFromPage(failedLocator, page);
      await safeAttach(attach, { failedLocator, heal });
    } catch (healError) {
      await safeAttach(attach, {
        failedLocator,
        healError: healError instanceof Error ? healError.message : String(healError),
      });
    }
  } catch (attachError) {
    console.warn('[self-heal] attach to report failed:', attachError);
  }
}
