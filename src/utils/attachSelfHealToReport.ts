import type { Page } from '@playwright/test';
import { SelfHealingClient, getHealedXpath } from './SelfHealingClient';
import { extractLocatorFromPlaywrightError } from './extractLocatorFromPlaywrightError';

export type AttachFn = (
  data: string | Buffer,
  mediaTypeOrOptions?: string | { mediaType?: string; fileName?: string }
) => void | Promise<void>;

function healOnFailureEnabled(): boolean {
  return process.env.HEAL_ON_FAILURE !== 'false';
}

/** When false: do not retry steps with healed XPath; fail fast. Heal diagnostics still attach when HEAL_ON_FAILURE is true. */
export function healLocatorRetryEnabled(): boolean {
  const v = process.env.HEAL_LOCATOR_RETRY?.trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'off' || v === 'no') return false;
  if (v === 'true' || v === '1' || v === 'on' || v === 'yes') return true;
  return healOnFailureEnabled();
}

function meta(): { healLocatorRetryEnabled: boolean } {
  return { healLocatorRetryEnabled: healLocatorRetryEnabled() };
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
  failureMessage: string,
  /** When healing succeeds, invoked so locators can retry with the XPath (e.g. CustomWorld.healedSelectors). */
  onSuccessfulHeal?: (failedLocator: string, healedXpath: string) => void
): Promise<void> {
  try {
    if (!healOnFailureEnabled()) {
      await safeAttach(attach, { skipped: true, reason: 'disabled', ...meta() });
      return;
    }

    const failedLocator = extractLocatorFromPlaywrightError(failureMessage);
    if (!failedLocator) {
      await safeAttach(attach, {
        skipped: true,
        reason: 'no_locator_in_message',
        failureMessageSnippet: failureMessage.slice(0, 500),
        ...meta(),
      });
      return;
    }

    if (!page) {
      await safeAttach(attach, { skipped: true, reason: 'no_page', failedLocator, ...meta() });
      return;
    }

    try {
      const client = new SelfHealingClient();
      const heal = await client.healFromPage(failedLocator, page);
      if (onSuccessfulHeal) {
        try {
          onSuccessfulHeal(failedLocator, getHealedXpath(heal));
        } catch {
          // ignore callback errors
        }
      }
      await safeAttach(attach, { failedLocator, heal, ...meta() });
    } catch (healError) {
      await safeAttach(attach, {
        failedLocator,
        healError: healError instanceof Error ? healError.message : String(healError),
        ...meta(),
      });
    }
  } catch (attachError) {
    console.warn('[self-heal] attach to report failed:', attachError);
  }
}
