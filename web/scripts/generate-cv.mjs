/**
 * Prints scripts/cv.html into public/cv.pdf — the résumé the site offers for
 * download.
 *
 * Run by hand after editing the HTML, and commit the result:
 *
 *   CHROMIUM_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe" \
 *     node scripts/generate-cv.mjs
 *
 * Kept out of `pnpm build` for the same reason generate-og.mjs is: printing
 * needs a browser, and CI should not install one to redraw a document that
 * changes a few times a year. The PDF in public/ is the artifact; this script
 * is how it is made.
 *
 * Chrome's own --print-to-pdf is used instead of Playwright because the résumé
 * needs no page interaction before printing, and this way regenerating it costs
 * no dependency install at all.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const output = join(here, '..', 'public', 'cv.pdf');

/*
  Any Chromium works. The candidates are the two browsers a Windows machine
  almost certainly already has; $CHROMIUM_PATH overrides them everywhere else.
 */
const candidates = [
  process.env.CHROMIUM_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const chromium = candidates.find((path) => existsSync(path));
if (!chromium) {
  console.error(`no Chromium found. Set $CHROMIUM_PATH. Tried:\n  ${candidates.join('\n  ')}`);
  process.exit(1);
}

execFileSync(chromium, [
  '--headless',
  '--disable-gpu',
  // Page size and margins come from the @page rule in cv.html, not from here.
  '--no-pdf-header-footer',
  `--print-to-pdf=${output}`,
  `file:///${join(here, 'cv.html').replaceAll('\\', '/')}`,
]);

console.log('wrote public/cv.pdf');
