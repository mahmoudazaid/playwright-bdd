const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Use Playwright's default timeout approach - simple default for Cucumber
// Playwright uses 30 seconds for most operations
// For hooks that do browser setup + navigation, we need more time
// 120 seconds provides buffer for slow CI environments and network issues
const cucumberTimeout = 120000; // 120 seconds (2 minutes) - works for both local and CI

module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      path.join(__dirname, 'src', 'support', 'env.ts'), // Load .env first
      path.join(__dirname, 'src', 'step_definitions', '**', '*.ts'),
      path.join(__dirname, 'src', 'support', '**', '*.ts'),
    ],
    format: [
      '@cucumber/pretty-formatter',
      'json:test-results/cucumber/cucumber-report.json',
      'rerun:@rerun.txt',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    paths: ['features/**/*.feature'],
    failFast: false,
    tags: '',
    defaultTimeout: cucumberTimeout,
  },
};

