// Load environment variables from .env file
// This is automatically loaded by cucumber.js via the require path
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { setDefaultTimeout } from '@cucumber/cucumber';

// Resolve .env file path - handle both compiled and source locations
const envPath = path.resolve(process.cwd(), '.env');

// Load .env file from project root if it exists
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Fallback: try relative to this file
  const fallbackPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(fallbackPath)) {
    dotenv.config({ path: fallbackPath });
  }
}

// Explicitly set Cucumber default timeout to 120 seconds (2 minutes)
// This ensures steps have enough time to complete, especially for slow network operations
// The defaultTimeout in cucumber.js should work, but this provides an additional safeguard
setDefaultTimeout(120 * 1000); // 120 seconds in milliseconds

