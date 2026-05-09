/**
 * Patches multiple-cucumber-html-reporter so hidden steps still render when they carry
 * useful data (fixes typo `step.attachment` vs `step.attachments`, and shows failed hooks
 * that only have error_message or JSON embeddings).
 *
 * Run automatically before `npm run report`. Re-applies after `npm install` (idempotent).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'multiple-cucumber-html-reporter',
  'templates',
  'components',
  'scenarios.tmpl'
);

const OLD =
  '<% if(!step.hidden || step.image || step.video || step.text || step.html || step.attachment) { %>';
const NEW =
  '<% if(!step.hidden || step.image || step.video || step.text || step.html || !_.isEmpty(step.attachments) || (step.result && step.result.error_message) || (step.json && step.json.length)) { %>';

if (!fs.existsSync(target)) {
  console.warn('[patch-mchr] scenarios.tmpl not found (npm install?). Skipping.');
  process.exit(0);
}

let s = fs.readFileSync(target, 'utf8');
if (s.includes(NEW)) {
  console.log('[patch-mchr] scenarios.tmpl already patched.');
  process.exit(0);
}
if (!s.includes(OLD)) {
  console.warn(
    '[patch-mchr] Expected line not found; multiple-cucumber-html-reporter version may differ. Skipping.'
  );
  process.exit(0);
}

fs.writeFileSync(target, s.replace(OLD, NEW), 'utf8');
console.log('[patch-mchr] Patched scenarios.tmpl for embeddings / hidden steps.');
