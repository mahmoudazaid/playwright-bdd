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
# Run all tests
npm run test:bdd

# Run smoke tests only
npm run test:bdd:smoke

# Run tests in headed mode (see browser)
npm run test:bdd:headed

# Generate and open HTML report
npm run report
# Or just generate report (auto-opens in browser)
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

**Usage**: Press `F5` or use the Debug panel → Select "Run Tests" → Enter tag (or leave empty for all tests)

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
│       ├── browser.ts              # Browser configuration helper
│       ├── cookies.ts              # Cookie consent handler
│       └── generate-report.ts      # HTML report generator
├── .vscode/                        # VS Code configuration
│   ├── launch.json                 # Debug/run configurations
│   └── settings.json               # Cucumber/Gherkin settings
├── .env                            # Environment variables
├── cucumber.js                     # Cucumber configuration
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
  - Screenshots on failure

#### 6. **Utilities** (`src/utils/`)
- **browser.ts**: Browser configuration and context creation
- **cookies.ts**: Automatic cookie consent handling

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

### Key Design Decisions

1. **Page Object Model**: Locators live under `src/locators/`; page objects under `src/pages/` orchestrate behavior
2. **Selector Strategy**: Prefer `getByRole()`, `getByLabel()`, or stable `data-test` attributes where the app provides them
3. **Automatic Setup**: Browser initialization and navigation to `BASE_URL` in the Before hook
4. **Cookie Handling**: Automatic cookie consent in hooks (useful for sites with consent banners)
5. **Environment-Based Config**: Browser, URL, and viewport come from `.env` (see `.env.example`)

## Test Reports

After running tests, generate and view the HTML report:

```bash
npm run report
```

This will:
- Generate an HTML report from the Cucumber JSON report
- Automatically open it in your default browser
- Show test results, scenarios, step details, and execution times

**Report Location**: `test-results/cucumber-html-report/index.html`

**Other Artifacts**:
- **Cucumber JSON Report**: `test-results/cucumber-report.json`
- **Screenshots**: Auto-captured on failure in `test-results/`
- **Traces**: Available for debugging failed tests in `test-results/`

## Best Practices

1. ✅ **Locators + Page Objects** - Centralize selectors in `src/locators/`, actions in `src/pages/`
2. ✅ **Resilient Selectors** - Use role/label over CSS/XPath
3. ✅ **Thin Step Definitions** - Delegate logic to Page Objects
4. ✅ **Reusable Hooks** - Setup/teardown in hooks, not steps
5. ✅ **Environment Config** - All settings in `.env` file
