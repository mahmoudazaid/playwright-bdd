import { execSync } from 'child_process';
import * as fsSync from 'fs';
import { After, AfterStep, Before, Status } from '@cucumber/cucumber';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CustomWorld } from './world';
import { acceptCookies } from '../utils/cookies';
import { attachSelfHealToReport } from '../utils/attachSelfHealToReport';

function envForReportChild(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of [
    'NODE_OPTIONS',
    'VSCODE_INSPECTOR_OPTIONS',
    'ELECTRON_RUN_AS_NODE',
    'DEBUG',
    'DEBUGGER_WORKING_DIRECTORY',
  ]) {
    delete env[key];
  }
  return env;
}

const projectRoot = path.join(__dirname, '../..');

function cucumberJsonCandidatePaths(): string[] {
  const roots = [...new Set([path.resolve(projectRoot), path.resolve(process.cwd())])];
  const paths: string[] = [];
  for (const root of roots) {
    paths.push(
      path.join(root, 'test-results', 'cucumber', 'cucumber-report.json'),
      path.join(root, 'test-results', 'cucumber-report.json'),
    );
  }
  return paths;
}

function isCucumberJsonReady(): boolean {
  for (const p of cucumberJsonCandidatePaths()) {
    try {
      if (fsSync.existsSync(p) && fsSync.statSync(p).size >= 2) {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

// Runs after every Cucumber exit (CLI, VS Code / Cursor debugger, npx cucumber-js). We must NOT
// execSync('npm run report') immediately: that blocks this process's event loop so the JSON
// formatter cannot flush to disk. Poll with setTimeout until the file exists, then run the report.
if (process.env.SKIP_AUTO_HTML_REPORT !== '1') {
  process.once('beforeExit', () => {
    const waitMs = Number(process.env.CUCUMBER_HTML_REPORT_WAIT_MS) || 30000;
    const pollMs = 200;
    let elapsed = 0;
    const tryRunReport = (): void => {
      if (isCucumberJsonReady()) {
        try {
          execSync('npm run report', {
            cwd: process.cwd(),
            stdio: 'inherit',
            env: envForReportChild(),
          });
        } catch {
          console.warn('Auto HTML report failed; run manually: npm run report');
        }
        return;
      }
      elapsed += pollMs;
      if (elapsed >= waitMs) {
        console.warn(
          'Auto HTML report skipped: Cucumber JSON not found after waiting. Run manually: npm run report',
        );
        return;
      }
      setTimeout(tryRunReport, pollMs);
    };
    setImmediate(tryRunReport);
  });
}

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

AfterStep(async function (this: CustomWorld, { result }) {
  if (result?.status !== Status.FAILED) {
    return;
  }
  const message = result.message ?? '';

  try {
    if (this.page) {
      const screenshot = await this.page.screenshot({ fullPage: true });
      await this.attach(screenshot, {
        mediaType: 'image/png',
        fileName: 'step-failure-screenshot.png',
      });
    }
  } catch {
    // ignore
  }

  await attachSelfHealToReport(this.attach.bind(this), this.page, message, (failedLocator, healedXpath) => {
    this.healedSelectors.set(failedLocator, healedXpath);
  });
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    try {
      await this.attach(
        [
          'Playwright trace ZIP is attached on this After row.',
          'Error log is under "+ Show Error" on the failed step; screenshot and self-heal JSON use "+ Show Info" / "+ Screenshot".',
          'Open trace: npx playwright show-trace test-results/trace-<timestamp>.zip',
        ].join('\n'),
        { mediaType: 'text/plain', fileName: 'scenario-trace-hint.txt' }
      );
    } catch {
      // ignore
    }

    try {
      if (this.context) {
        const traceDir = path.join(process.cwd(), 'test-results');
        await fs.mkdir(traceDir, { recursive: true });
        const traceFileName = `trace-${Date.now()}.zip`;
        const tracePath = path.join(traceDir, traceFileName);
        await this.context.tracing.stop({ path: tracePath });
        const traceBuffer = await fs.readFile(tracePath);
        await this.attach(traceBuffer, {
          mediaType: 'application/zip',
          fileName: traceFileName,
        });
      }
    } catch {
      // Trace might not be available, ignore
    }
  }

  await this.closeBrowser();
});
