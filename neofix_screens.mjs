import { chromium, devices } from 'playwright';
import { mkdir } from 'fs/promises';

const OUT_DIR = 'C:/Users/INFINITY/Downloads/neofix_audit_screens';
await mkdir(OUT_DIR, { recursive: true });

const PAGES = [
  { name: 'home', url: 'https://www.neofix.ge/' },
  { name: 'wylis-jonvis', url: 'https://www.neofix.ge/wylis-jonvis-diagnostika/' },
  { name: 'kanalizacia', url: 'https://www.neofix.ge/kanalizaciis-gawmenda/' },
  { name: 'santeqniki', url: 'https://www.neofix.ge/santeqnikosis-momsaxureba/' },
  { name: 'faq', url: 'https://www.neofix.ge/faq/' },
  { name: 'contact', url: 'https://www.neofix.ge/contact/' },
];

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const mobile = await browser.newContext(devices['iPhone 13']);

for (const p of PAGES) {
  // Desktop above-the-fold
  try {
    const page = await desktop.newPage();
    const t0 = Date.now();
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const ttDom = Date.now() - t0;
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const ttNet = Date.now() - t0;
    await page.screenshot({ path: `${OUT_DIR}/desktop_${p.name}.png`, fullPage: false });
    console.log(`desktop ${p.name}  DOM=${ttDom}ms  NET=${ttNet}ms`);
    await page.close();
  } catch (e) {
    console.log(`desktop ${p.name}  FAIL: ${e.message}`);
  }

  // Mobile above-the-fold
  try {
    const page = await mobile.newPage();
    const t0 = Date.now();
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const ttDom = Date.now() - t0;
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const ttNet = Date.now() - t0;
    await page.screenshot({ path: `${OUT_DIR}/mobile_${p.name}.png`, fullPage: false });
    console.log(`mobile  ${p.name}  DOM=${ttDom}ms  NET=${ttNet}ms`);
    await page.close();
  } catch (e) {
    console.log(`mobile  ${p.name}  FAIL: ${e.message}`);
  }
}

await browser.close();
console.log('DONE');
