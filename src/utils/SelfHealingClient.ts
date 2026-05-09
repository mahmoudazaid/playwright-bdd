import { promisify } from 'util';
import { gzip } from 'zlib';
import { Page } from '@playwright/test';

const gzipAsync = promisify(gzip);

/** Element block returned when healing succeeds */
export interface HealedElement {
  tag: string;
  id: string;
  classes: string[];
  name: string;
  text: string;
  score: number;
  healing_method: string;
  healed_xpath: string;
}

/** Parsed JSON body from POST /api/v1/heal-locator */
export interface HealLocatorResponse {
  status: string;
  healed_element: HealedElement | null;
  message: string | null;
  error: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  throw new Error(`heal-locator response: invalid "${field}" (expected string or null)`);
}

function isHealedElement(value: unknown): value is HealedElement {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.tag === 'string' &&
    typeof value.id === 'string' &&
    Array.isArray(value.classes) &&
    value.classes.every((c) => typeof c === 'string') &&
    typeof value.name === 'string' &&
    typeof value.text === 'string' &&
    typeof value.score === 'number' &&
    typeof value.healing_method === 'string' &&
    typeof value.healed_xpath === 'string'
  );
}

/**
 * Parse and validate the heal-locator JSON body.
 *
 * @throws Error if shape is invalid, healed_element is present but malformed,
 *   status is not "success", or success response lacks healed xpath.
 */
export function parseHealLocatorResponse(body: unknown): HealLocatorResponse {
  if (!isRecord(body)) {
    throw new Error('heal-locator response: expected JSON object');
  }

  const status = body.status;
  if (typeof status !== 'string') {
    throw new Error('heal-locator response: missing or invalid "status"');
  }

  let healed_element: HealedElement | null = null;
  if (body.healed_element !== null && body.healed_element !== undefined) {
    if (!isHealedElement(body.healed_element)) {
      throw new Error('heal-locator response: invalid "healed_element" shape');
    }
    healed_element = body.healed_element;
  }

  const message = parseNullableString(body.message, 'message');
  const error = parseNullableString(body.error, 'error');

  const response: HealLocatorResponse = {
    status,
    healed_element,
    message,
    error,
  };

  if (response.status !== 'success') {
    const detail = [response.error, response.message].filter(Boolean).join(' — ') || 'unknown error';
    throw new Error(`heal-locator returned status "${response.status}": ${detail}`);
  }

  if (!response.healed_element?.healed_xpath?.trim()) {
    throw new Error('heal-locator success response missing healed_element or healed_xpath');
  }

  return response;
}

/** Returns the healed XPath from a successful parsed response */
export function getHealedXpath(response: HealLocatorResponse): string {
  const xpath = response.healed_element?.healed_xpath;
  if (!xpath) {
    throw new Error('heal-locator response has no healed_xpath');
  }
  return xpath;
}

/**
 * HTTP client for the self-healing locator service.
 *
 * POSTs the failed selector and a gzip+base64 encoded DOM snapshot to
 * `{baseUrl}/api/v1/heal-locator` and returns a validated {@link HealLocatorResponse}.
 */
export class SelfHealingClient {
  constructor(
    private readonly baseUrl: string = process.env.HEAL_API_URL ?? 'http://localhost:8787',
    private readonly defaultThreshold: number = Number(process.env.HEAL_THRESHOLD ?? 0.4)
  ) {}

  async heal(
    failedElement: string,
    domHtml: string,
    threshold: number = this.defaultThreshold
  ): Promise<HealLocatorResponse> {
    const dom_snapshot = (await gzipAsync(Buffer.from(domHtml, 'utf8'))).toString('base64');

    const res = await fetch(`${this.baseUrl}/api/v1/heal-locator`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        failed_element: failedElement,
        is_base64: true,
        is_gzip: true,
        threshold,
        dom_snapshot,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `heal-locator failed: ${res.status} ${res.statusText} ${text}`.trim()
      );
    }

    const raw: unknown = await res.json();
    return parseHealLocatorResponse(raw);
  }

  async healFromPage(
    failedElement: string,
    page: Page,
    threshold: number = this.defaultThreshold
  ): Promise<HealLocatorResponse> {
    const html = await page.content();
    return this.heal(failedElement, html, threshold);
  }
}
