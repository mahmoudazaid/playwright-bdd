# Playwright + Cucumber BDD Test Framework

A maintainable BDD test framework using Playwright and Cucumber for web application testing.

The sample scenarios target **[Sauce Demo (Swag Labs)](https://www.saucedemo.com/)** — a demo e-commerce site used for learning automation. Point `BASE_URL` at your own app when you add real tests.

## Tech Stack

- **Node.js** 18+
- **TypeScript**
- **Playwright** - Browser automation
- **Cucumber.js** - BDD framework
- **VS Code** (recommended) - Code editor with Cucumber extensions

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Create .env file (optional)
cp .env.example .env
```

**VS Code Extensions** (optional, but recommended for better development experience):
- Install **Cucumber (Gherkin) Full Support** extension (`alexkrechik.cucumberautocomplete`)
- Optional: Install **Playwright Test for VSCode** extension

### Running Tests

```bash
# Run all tests (HTML report is generated automatically when the run finishes)
npm run test:bdd

# Run smoke tests only (report also generated afterward)
npm run test:bdd:smoke

# Run tests in headed mode (see browser; report generated afterward)
npm run test:bdd:headed

# Cucumber only, skip HTML report (sets SKIP_AUTO_HTML_REPORT=1; faster iteration)
npm run test:bdd:no-report

# Regenerate report from the last JSON without re-running tests
npm run report
# Or generate and open the HTML file in the browser
npm run report:open
```

## VS Code Setup (Optional)

VS Code configuration is **optional but recommended** for a better development experience. Tests can be run from the command line without these configurations.

### Recommended Extensions

Install the following VS Code extensions for optimal Cucumber/Gherkin support:

1. **Cucumber (Gherkin) Full Support** (`alexkrechik.cucumberautocomplete`)
   - Provides syntax highlighting, autocomplete, and step definition navigation
   - Install: Open VS Code → Extensions → Search "Cucumber (Gherkin) Full Support"

2. **Cucumber** (`cucumber.cucumber`) - Optional alternative
   - Official Cucumber extension
   - Alternative to the above if preferred

3. **Playwright Test for VSCode** (`ms-playwright.playwright`) - Optional
   - Enhanced Playwright support and debugging
   - Install: Open VS Code → Extensions → Search "Playwright Test"

### Configuration Files (Nice to Have)

To enable running and debugging tests directly from VS Code, optionally create the following configuration files:

### Create `.vscode/launch.json`

Create `.vscode/launch.json` in the project root to enable running tests with tags:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Run Tests",
      "runtimeExecutable": "npx",
      "runtimeArgs": [
        "cucumber-js",
        "-c",
        "cucumber.js",
        "--tags",
        "${input:tagName}"
      ],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/.env"
    }
  ],
  "inputs": [
    {
      "id": "tagName",
      "type": "promptString",
      "description": "Enter tag (e.g., @smoke, @regression, or leave empty for all)",
      "default": ""
    }
  ]
}
```

**Usage**: Press `F5` or use the Debug panel → Select "Run Tests" → Enter tag (or leave empty for all tests). The HTML report is still generated when the debug session ends (same `beforeExit` hook as CLI). To skip that, add `"SKIP_AUTO_HTML_REPORT": "1"` under `env` in the launch configuration.

### Create `.vscode/settings.json`

Create `.vscode/settings.json` in the project root to enable Cucumber/Gherkin support:

```json
{
  "cucumber.features": [
    "features/**/*.feature"
  ],
  "cucumber.glue": [
    "src/step_definitions/**/*.ts",
    "src/support/**/*.ts"
  ],
  "cucumber.command": "npx cucumber-js -c cucumber.js",
  "cucumber.options": "",
  "cucumberTestExplorer.debug": false
}
```

**What this enables** (all optional features):
- Syntax highlighting for `.feature` files
- CodeLens (play buttons) on feature files
- Step definition navigation
- Cucumber extension integration

**Note**: These configuration files are optional. You can run tests from the command line using `npm run test:bdd` without any VS Code setup.

## Framework Architecture

### Project Structure

```
playwright-bdd/
├── features/
│   └── login.feature               # Gherkin feature files (BDD scenarios)
├── src/
│   ├── locators/
│   │   └── LoginLocators.ts        # Selectors only (no actions)
│   ├── pages/
│   │   └── LoginPage.ts            # Page Object Model (actions; uses locators)
│   ├── step_definitions/
│   │   └── login.steps.ts          # Step definitions (Gherkin → code)
│   ├── support/
│   │   ├── world.ts                # CustomWorld (browser/page management)
│   │   ├── hooks.ts                # Before/After hooks (setup/teardown)
│   │   └── env.ts                  # Environment configuration
│   └── utils/
│       ├── browser.ts                      # Browser configuration helper
│       ├── cookies.ts                      # Cookie consent handler
│       ├── extractLocatorFromPlaywrightError.ts  # Parse locator from failure text
│       ├── SelfHealingClient.ts            # HTTP client for heal-locator API
│       ├── attachSelfHealToReport.ts       # Failed-step JSON attach (self-heal)
│       └── generate-report.ts              # multiple-cucumber-html-reporter driver
├── .vscode/                        # VS Code configuration
│   ├── launch.json                 # Debug/run configurations
│   └── settings.json               # Cucumber/Gherkin settings
├── .env                            # Environment variables
├── cucumber.js                     # Cucumber configuration
├── reporting/
│   └── patch-mchr-scenarios.cjs    # Patches HTML reporter before `npm run report`
└── playwright.config.ts            # Playwright configuration
```

### Framework Components

#### 1. **Feature Files** (`features/`)
- Written in Gherkin syntax (Given/When/Then)
- Business-readable test scenarios
- Example:
```gherkin
Feature: Login
  @smoke @test
  Scenario: Successful login with standard user
    Given I am on the login page
    When I log in as "standard_user" with password "secret_sauce"
    Then I should land on the inventory page
```

#### 2. **Step Definitions** (`src/step_definitions/`)
- Maps Gherkin steps to executable code
- Thin layer that delegates to Page Objects
- Example:
```typescript
import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';

let loginPage: LoginPage;

When(
  'I log in as {string} with password {string}',
  async function (this: CustomWorld, username: string, password: string) {
    loginPage = new LoginPage(this.page);
    await loginPage.login(username, password);
  }
);
```

#### 3. **Locators** (`src/locators/`)
- Selector definitions only (`Locator` getters); no clicks, fills, or assertions
- Keeps selectors in one place so page objects stay focused on behavior

#### 4. **Page Objects** (`src/pages/`)
- Encapsulates page-specific actions and flows
- Composes locators from `src/locators/` and implements methods the steps call
- Example:
```typescript
import { Page } from '@playwright/test';
import { LoginLocators } from '../locators/LoginLocators';

export class LoginPage {
  private readonly locators: LoginLocators;

  constructor(page: Page) {
    this.locators = new LoginLocators(page);
  }

  async login(username: string, password: string): Promise<void> {
    await this.locators.usernameInput.fill(username);
    await this.locators.passwordInput.fill(password);
    await this.locators.loginButton.click();
  }
}
```

#### 5. **World & Hooks** (`src/support/`)
- **World** (`world.ts`): Custom Cucumber World with browser/page context
- **Hooks** (`hooks.ts`): Setup (Before) and teardown (After) logic
  - Browser initialization
  - Navigation to base URL
  - Cookie acceptance
  - On failed steps: screenshot, optional self-heal JSON attachment (`attachSelfHealToReport`), trace zip on failed scenarios

#### 6. **Utilities** (`src/utils/`)
- **browser.ts**: Browser configuration and context creation
- **cookies.ts**: Automatic cookie consent handling

#### 7. **Reporting & self-heal** (`src/utils/`)

These modules support the HTML report and optional **heal-on-failure** diagnostics. Environment variables for the heal service live in **`.env.example`** (`HEAL_API_URL`, `HEAL_THRESHOLD`, `HEAL_ON_FAILURE`).

**`extractLocatorFromPlaywrightError.ts`**  
Exports `extractLocatorFromPlaywrightError(message)`. Uses regexes to pull the selector string from Playwright-style failure text (for example `locator('...')` / `` locator(`...`) ``). Returns `null` if nothing matches (custom errors or non-Playwright messages). Used by `attachSelfHealToReport` so the heal API knows which locator broke.

**`SelfHealingClient.ts`**  
HTTP client for a self-healing service compatible with **`POST {baseUrl}/api/v1/heal-locator`**. Defaults: `HEAL_API_URL` (fallback `http://localhost:8787`), `HEAL_THRESHOLD` (fallback `0.4`). Sends `failed_element`, `threshold`, and a **gzip + base64** DOM snapshot (`page.content()`). Exports `parseHealLocatorResponse`, `getHealedXpath`, and types `HealLocatorResponse` / `HealedElement`. Throws if the JSON shape is wrong or status is not `"success"`. `healFromPage(failedElement, page)` gathers HTML and calls `heal`.

**`attachSelfHealToReport.ts`**  
Exports `attachSelfHealToReport(attach, page, failureMessage)`. Intended from **`AfterStep`** on `Status.FAILED`. If `HEAL_ON_FAILURE` is not `"false"`, extracts a locator via `extractLocatorFromPlaywrightError`, calls `SelfHealingClient.healFromPage`, and **`attach`**es a JSON payload (`failedLocator` + `heal`, or `healError`, or a small `skipped` object with `reason`). Uses `application/json` so the Cucumber HTML report shows **+ Show Info**. Never rethrows so failures in healing do not mask the original step failure.

**`generate-report.ts`**  
Script run by **`npm run report`** (after `reporting/patch-mchr-scenarios.cjs`). Waits until Cucumber JSON exists (poll under **`CUCUMBER_HTML_REPORT_WAIT_MS`**, default **1500ms** when invoked manually), normalizes **`test-results/cucumber/cucumber-report.json`** (including legacy **`test-results/cucumber-report.json`** or cwd variants), then calls **multiple-cucumber-html-reporter** with `jsonDir: test-results/cucumber` so trace `*.json` files under `test-results/` are not scanned. Writes **`test-results/cucumber-html-report/`**. See **Test Reports** for auto-generation after runs.

## How It Works

1. **Feature File** defines test scenario in plain English
2. **Step Definitions** map Gherkin steps to code
3. **Locators** define selectors; **Page Objects** contain reusable interactions
4. **Hooks** handle setup/teardown (browser, navigation, cookies)
5. **World** provides shared context (page, browser) to all steps

### Test Execution Flow

```
Feature File (Gherkin)
    ↓
Step Definitions (maps steps to code)
    ↓
Page Objects (actions via locators)
    ↓
Playwright (interacts with browser)
```

## Adding New Tests

To add new tests to the framework, follow this structured approach:

### 1. Create Feature File

Create a new `.feature` file in `features/` directory with Gherkin scenarios:

```gherkin
Feature: My new feature
  @smoke
  Scenario: Test scenario description
    Given I am on the page
    When I perform an action
    Then I should see expected result
```

### 2. Create Locators (if needed)

Add a locator class in `src/locators/` for selectors only:

```typescript
import { Locator, Page } from '@playwright/test';

export class MyLocators {
  constructor(private readonly page: Page) {}

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit' });
  }
}
```

### 3. Create Page Object (if needed)

Add a Page Object in `src/pages/` that uses your locators and implements actions:

```typescript
import { Page } from '@playwright/test';
import { MyLocators } from '../locators/MyLocators';

export class MyPage {
  private readonly locators: MyLocators;

  constructor(page: Page) {
    this.locators = new MyLocators(page);
  }

  async performAction(): Promise<void> {
    await this.locators.submitButton.click();
  }
}
```

### 4. Create Step Definitions

Add or update step definitions in `src/step_definitions/`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { MyPage } from '../pages/MyPage';

let myPage: MyPage;

Given('I am on the page', async function (this: CustomWorld) {
  myPage = new MyPage(this.page);
  // Additional setup if needed
});

When('I perform an action', async function (this: CustomWorld) {
  await myPage.performAction();
});

Then('I should see expected result', async function (this: CustomWorld) {
  // Assertions using expect from @playwright/test
});
```

### Framework Structure for New Tests

- **One feature file per feature/functionality** (`features/my-feature.feature`)
- **One locator file per page/screen** (`src/locators/MyLocators.ts`) when you want selectors separated
- **One Page Object per page/section** (`src/pages/MyPage.ts`)
- **One step definitions file per feature** (`src/step_definitions/my-feature.steps.ts`)
- **Reuse existing support files** (world.ts, hooks.ts) - no changes needed
- **Use tags** (@smoke, @regression) to organize and filter tests

### Best Practices for New Tests

1. **Reuse locators and page objects** - Do not duplicate selectors or flows across files
2. **Keep steps generic** - Step definitions should delegate to Page Objects
3. **Use descriptive Gherkin** - Write clear, business-readable scenarios
4. **Tag appropriately** - Use tags to categorize tests (@smoke, @regression, @e2e)
5. **Follow selector strategy** - Prefer `getByRole()`, `getByLabel()` over CSS/XPath

## Configuration

### Environment Variables (`.env`)

```bash
# Default sample app (Sauce Demo). Override for your own environment.
BASE_URL=https://www.saucedemo.com/
BROWSER=chrome          # chrome, firefox, safari
HEADED=false            # true to see browser
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
```

`BASE_URL` is read from `.env` (and from VS Code `launch.json` via `envFile`). It overrides the fallback in `playwright.config.ts`. If tests open the wrong site, check **`.env`** first.

Optional variables (see **`.env.example`**):

| Variable | Purpose |
|----------|---------|
| `HEAL_API_URL` | Base URL of the heal-locator service (`SelfHealingClient`) |
| `HEAL_THRESHOLD` | Default score threshold sent to the API |
| `HEAL_ON_FAILURE` | Set to `false` to skip self-heal JSON attachments on failed steps |
| `CUCUMBER_HTML_REPORT_WAIT_MS` | If set, used as the max wait (ms) for Cucumber JSON in **both** the post-run hook and `generate-report`. If unset, the hook defaults to **30000** and `generate-report` defaults to **1500** |
| `SKIP_AUTO_HTML_REPORT` | Set to `1` to skip the post-run `npm run report` hook |

### Key Design Decisions

1. **Page Object Model**: Locators live under `src/locators/`; page objects under `src/pages/` orchestrate behavior
2. **Selector Strategy**: Prefer `getByRole()`, `getByLabel()`, or stable `data-test` attributes where the app provides them
3. **Automatic Setup**: Browser initialization and navigation to `BASE_URL` in the Before hook
4. **Cookie Handling**: Automatic cookie consent in hooks (useful for sites with consent banners)
5. **Environment-Based Config**: Browser, URL, and viewport come from `.env` (see `.env.example`)

## Test Reports

When any Cucumber run finishes (including **`npx cucumber-js`** from **`.vscode/launch.json`**), `src/support/hooks.ts` waits on Node’s **`beforeExit`** event, then **polls every 200ms** (up to **`CUCUMBER_HTML_REPORT_WAIT_MS`**, default **30000**) until the Cucumber JSON exists on disk. Only then does it run **`npm run report`**, so the parent process is never blocked by `execSync` before the formatter can flush (blocking early was breaking VS Code runs). The report child env strips **`NODE_OPTIONS`** / VS Code inspector variables. The **`generate-report.ts`** step performs its own wait for the JSON file (see **Reporting & self-heal** under Framework Architecture). Set **`SKIP_AUTO_HTML_REPORT=1`** to disable auto-report (for example `npm run test:bdd:no-report`).

To rebuild from the last JSON without re-running tests, or after copying a JSON file:

```bash
npm run report
```

To open the report in your default browser:

```bash
npm run report:open
```

`npm run report` will:
- Apply a small patch to `multiple-cucumber-html-reporter` so hidden steps and attachments (errors, self-heal JSON, trace zip) show correctly (see `reporting/patch-mchr-scenarios.cjs`; re-runs after `npm install` are safe).
- Generate an HTML report from the Cucumber JSON report
- Show test results, scenarios, step details, and execution times

On failed steps, use **+ Show Error**, **+ Show Info** (JSON, including self-heal), **+ Screenshot**, and **Attachment** links on the failed step row. The **After** row contains the Playwright trace zip.

**Report Location**: `test-results/cucumber-html-report/index.html`

**Other Artifacts**:
- **Cucumber JSON Report**: `test-results/cucumber/cucumber-report.json` (isolated from other `test-results/*.json` so the HTML reporter does not mis-parse Playwright trace JSON)
- **Screenshots**: Auto-captured on failure in `test-results/`
- **Traces**: Available for debugging failed tests in `test-results/`

## Best Practices

1. ✅ **Locators + Page Objects** - Centralize selectors in `src/locators/`, actions in `src/pages/`
2. ✅ **Resilient Selectors** - Use role/label over CSS/XPath
3. ✅ **Thin Step Definitions** - Delegate logic to Page Objects
4. ✅ **Reusable Hooks** - Setup/teardown in hooks, not steps
5. ✅ **Environment Config** - All settings in `.env` file
