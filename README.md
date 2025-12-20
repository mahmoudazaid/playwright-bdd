# Playwright + Cucumber BDD Test Framework

A maintainable BDD test framework using Playwright and Cucumber for web application testing.

## Tech Stack

- **Node.js** 18+
- **TypeScript**
- **Playwright** - Browser automation
- **Cucumber.js** - BDD framework

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

## Framework Architecture

### Project Structure

```
playwright-bdd/
├── features/
│   └── search.feature              # Gherkin feature files (BDD scenarios)
├── src/
│   ├── pages/
│   │   └── SearchPage.ts           # Page Object Model (locators + actions)
│   ├── step_definitions/
│   │   └── search.steps.ts         # Step definitions (Gherkin → code)
│   ├── support/
│   │   ├── world.ts                # CustomWorld (browser/page management)
│   │   ├── hooks.ts                # Before/After hooks (setup/teardown)
│   │   └── env.ts                  # Environment configuration
│   └── utils/
│       ├── browser.ts              # Browser configuration helper
│       └── cookies.ts             # Cookie consent handler
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
Feature: Search functionality
  @smoke
  Scenario: Search for location
    Given I open the Search & Map page
    When I search for "Berlin"
    Then I should see results loaded
```

#### 2. **Step Definitions** (`src/step_definitions/`)
- Maps Gherkin steps to executable code
- Thin layer that delegates to Page Objects
- Example:
```typescript
When('I search for {string}', async function (this: CustomWorld, location: string) {
  await searchPage.searchForLocation(location);
});
```

#### 3. **Page Objects** (`src/pages/`)
- Encapsulates page-specific logic
- Contains locators (getters) and actions (methods)
- Follows Page Object Model pattern
- Example:
```typescript
export class SearchPage {
  get searchInputLocator(): Locator {
    return this.page.locator('input[type="search"]');
  }
  
  async searchForLocation(location: string): Promise<void> {
    await this.searchInputLocator.fill(location);
    await this.searchInputLocator.press('Enter');
  }
}
```

#### 4. **World & Hooks** (`src/support/`)
- **World** (`world.ts`): Custom Cucumber World with browser/page context
- **Hooks** (`hooks.ts`): Setup (Before) and teardown (After) logic
  - Browser initialization
  - Navigation to base URL
  - Cookie acceptance
  - Screenshots on failure

#### 5. **Utilities** (`src/utils/`)
- **browser.ts**: Browser configuration and context creation
- **cookies.ts**: Automatic cookie consent handling

## How It Works

1. **Feature File** defines test scenario in plain English
2. **Step Definitions** map Gherkin steps to code
3. **Page Objects** contain reusable page interactions
4. **Hooks** handle setup/teardown (browser, navigation, cookies)
5. **World** provides shared context (page, browser) to all steps

### Test Execution Flow

```
Feature File (Gherkin)
    ↓
Step Definitions (maps steps to code)
    ↓
Page Objects (performs actions)
    ↓
Playwright (interacts with browser)
```

## Configuration

### Environment Variables (`.env`)

```bash
BASE_URL=https://gruppenplatz.healthycloud.de/HC_GP_Public_Pages/
BROWSER=chrome          # chrome, firefox, safari
HEADED=false            # true to see browser
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
```

### Key Design Decisions

1. **Page Object Model**: Locators and actions together in one class
2. **Selector Strategy**: Prefer `getByRole()`, `getByLabel()` over XPath/CSS
3. **Automatic Setup**: Browser initialization and navigation in Before hook
4. **Cookie Handling**: Automatic cookie consent in hooks
5. **Environment-Based Config**: All settings via `.env` file

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

1. ✅ **Page Objects** - Centralize locators and actions
2. ✅ **Resilient Selectors** - Use role/label over CSS/XPath
3. ✅ **Thin Step Definitions** - Delegate logic to Page Objects
4. ✅ **Reusable Hooks** - Setup/teardown in hooks, not steps
5. ✅ **Environment Config** - All settings in `.env` file
