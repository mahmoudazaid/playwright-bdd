import './env';
import { BddWorld } from './world';
import { Before, After, BeforeStep, AfterStep } from './fixtures';
import { acceptCookies } from '../utils/cookies';
import { attachSelfHealToReport, healLocatorRetryEnabled } from '../utils/attachSelfHealToReport';

Before(async function (this: BddWorld) {
  await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  await acceptCookies(this.page);
});

BeforeStep(function (this: BddWorld, { $testInfo }) {
  this.errorsAtStepStart = $testInfo.errors.length;
});

AfterStep(async function (this: BddWorld, { $testInfo }) {
  const newErrors = $testInfo.errors.slice(this.errorsAtStepStart);
  if (newErrors.length === 0) {
    return;
  }

  const message = newErrors.map((e) => e.message ?? String(e)).join('\n');

  try {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, {
      mediaType: 'image/png',
      fileName: 'step-failure-screenshot.png',
    });
  } catch {
    // ignore
  }

  await attachSelfHealToReport(
    this.attach,
    this.page,
    message,
    healLocatorRetryEnabled()
      ? (failedLocator, healedXpath) => {
          this.healedSelectors.set(failedLocator, healedXpath);
        }
      : undefined
  );
});

After(async function (this: BddWorld, { $testInfo }) {
  if ($testInfo.status !== $testInfo.expectedStatus && $testInfo.error) {
    try {
      await this.attach(
        [
          'Playwright trace and video (if enabled) are in test-results/playwright-output.',
          'Step failure screenshot and self-heal JSON are on the failed step attachments.',
          'Open trace: npx playwright show-trace test-results/playwright-output/.../trace.zip',
        ].join('\n'),
        { mediaType: 'text/plain', fileName: 'scenario-trace-hint.txt' }
      );
    } catch {
      // ignore
    }
  }
});
