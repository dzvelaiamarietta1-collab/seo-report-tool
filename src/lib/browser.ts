import { existsSync } from "fs";

const LOCAL_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const NAVIGATION_TIMEOUT = 25000;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

function findLocalChrome(): string | undefined {
  for (const p of LOCAL_CHROME_PATHS) {
    try {
      if (existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export interface BrowserFetchResult {
  html: string;
  status: number;
  headers: Record<string, string>;
  finalUrl: string;
  responseTimeMs: number;
}

export async function fetchPageWithBrowser(
  url: string
): Promise<BrowserFetchResult | null> {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION;

  type AnyBrowser = { newPage: () => Promise<unknown>; close: () => Promise<void> };
  let browser: AnyBrowser | null = null;

  try {
    const puppeteerModule = await import("puppeteer-core");
    const puppeteer = (puppeteerModule.default ?? puppeteerModule) as unknown as {
      launch: (opts: Record<string, unknown>) => Promise<AnyBrowser>;
    };

    if (isServerless) {
      const chromiumModule = await import("@sparticuz/chromium");
      const chromium = (chromiumModule.default ?? chromiumModule) as unknown as {
        args: string[];
        defaultViewport: { width: number; height: number } | null;
        executablePath: () => Promise<string>;
      };
      browser = await puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      const executablePath = findLocalChrome();
      if (!executablePath) {
        console.warn(
          "Local Chrome not found in standard paths — falling back to axios."
        );
        return null;
      }
      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--hide-scrollbars",
        ],
      });
    }

    type Page = {
      setUserAgent: (ua: string) => Promise<void>;
      setViewport: (vp: { width: number; height: number }) => Promise<void>;
      setExtraHTTPHeaders: (h: Record<string, string>) => Promise<void>;
      goto: (
        url: string,
        opts: { waitUntil?: string; timeout?: number }
      ) => Promise<{
        status: () => number;
        headers: () => Record<string, string>;
      } | null>;
      content: () => Promise<string>;
      url: () => string;
      close: () => Promise<void>;
      evaluate: <T>(fn: () => Promise<T> | T) => Promise<T>;
    };

    const page = (await browser.newPage()) as Page;
    await page.setUserAgent(BROWSER_UA);
    await page.setViewport({ width: 1280, height: 720 });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9,ka;q=0.8",
    });

    const start = Date.now();
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: NAVIGATION_TIMEOUT,
    });

    if (!response) {
      throw new Error("No response from page.goto");
    }

    await page
      .evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 200;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight - window.innerHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 80);
          window.setTimeout(() => {
            clearInterval(timer);
            resolve();
          }, 4000);
        });
      })
      .catch(() => {
        // ignore scroll errors
      });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const html = await page.content();
    const status = response.status();
    const headers = response.headers();
    const finalUrl = page.url();

    return {
      html,
      status,
      headers,
      finalUrl,
      responseTimeMs: Date.now() - start,
    };
  } catch (e) {
    console.warn(
      "Headless browser fetch failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
}
