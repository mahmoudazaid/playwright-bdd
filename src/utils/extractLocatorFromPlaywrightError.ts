/**
 * Best-effort extraction of the selector string from a Playwright/Cucumber failure message.
 * Custom errors or non-Playwright messages may not contain a parseable locator.
 */
export function extractLocatorFromPlaywrightError(message: string): string | null {
  if (!message?.trim()) {
    return null;
  }

  const patterns: RegExp[] = [
    /locator\(`([\s\S]*?)`\)/,
    /locator\('((?:\\.|[^'\\])*)'\)/,
    /locator\("((?:\\.|[^"\\])*)"\)/,
  ];

  for (const re of patterns) {
    const m = message.match(re);
    if (m?.[1]) {
      return m[1].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\`/g, '`');
    }
  }

  return null;
}
