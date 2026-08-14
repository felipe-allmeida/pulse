/**
 * Rasterises scripts/og-card.html into public/og.png (1200×630).
 *
 * Run by hand after editing the card, and commit the result:
 *
 *   pnpm dlx playwright-core@1 --help >/dev/null   # any Chromium works
 *   node scripts/generate-og.mjs                   # uses $CHROMIUM_PATH
 *
 * Kept out of `pnpm build` on purpose: rasterising needs a headless browser,
 * and CI should not install Chromium to redraw a card that changes about once
 * a year. The PNG in public/ is the artifact; this script is how it is made.
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const executablePath = process.env.CHROMIUM_PATH;

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  // Social and AI-preview crawlers fetch the PNG at its natural size; render
  // at 1× so the committed file stays small.
  deviceScaleFactor: 1,
});

await page.goto(`file://${join(here, 'og-card.html')}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: join(here, '..', 'public', 'og.png') });
await browser.close();

console.log('wrote public/og.png');
