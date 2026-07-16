import { test as base, createBdd } from 'playwright-bdd';
import type { TestInfo } from '@playwright/test';
import { BddWorld } from './world';
import type { AttachFn } from '../utils/attachSelfHealToReport';

function createAttach(testInfo: TestInfo): AttachFn {
  return async (data, mediaTypeOrOptions) => {
    if (typeof mediaTypeOrOptions === 'string') {
      await testInfo.attach('attachment', {
        body: data as Buffer,
        contentType: mediaTypeOrOptions,
      });
      return;
    }
    if (mediaTypeOrOptions && typeof mediaTypeOrOptions === 'object') {
      const opts = mediaTypeOrOptions as { mediaType?: string; fileName?: string };
      await testInfo.attach(opts.fileName ?? 'attachment', {
        body: data as Buffer,
        contentType: opts.mediaType ?? 'application/octet-stream',
      });
      return;
    }
    await testInfo.attach('attachment', {
      body: data as Buffer,
      contentType: 'text/plain',
    });
  };
}

export const test = base.extend<{ world: BddWorld }>({
  world: async ({ page }, use, testInfo) => {
    await use(new BddWorld(page, createAttach(testInfo)));
  },
});

export const { Given, When, Then, Before, After, BeforeStep, AfterStep } = createBdd(test, {
  worldFixture: 'world',
});
