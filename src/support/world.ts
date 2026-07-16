import type { Page } from '@playwright/test';
import type { AttachFn } from '../utils/attachSelfHealToReport';

/** Per-scenario state for Cucumber-style steps (`this` when using `worldFixture`). */
export class BddWorld {
  readonly healedSelectors = new Map<string, string>();
  /** Used by AfterStep to detect errors raised during the current step. */
  errorsAtStepStart = 0;

  constructor(
    readonly page: Page,
    readonly attach: AttachFn
  ) {}
}
