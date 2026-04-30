import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

// Auto-increment filename: screenshot-N[-label].png
function nextFilename(label) {
  const files = fs.readdirSync(screenshotsDir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  let max = 0;
  for (const f of files) {
    const n = parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? 0);
    if (n > max) max = n;
  }
  const suffix = label ? `-${label}` : '';
  return path.join(screenshotsDir, `screenshot-${max + 1}${suffix}.png`);
}

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Let fonts/animations settle
await new Promise(r => setTimeout(r, 800));

const file = nextFilename(label);
await page.screenshot({ path: file, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${file}`);
