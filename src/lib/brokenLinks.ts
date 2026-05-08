import * as cheerio from "cheerio";
import axios from "axios";
import type { CategoryResult, CheckResult } from "./types";

const UA =
  "Mozilla/5.0 (compatible; SEOReportToolBot/0.1; +https://seo-report-tool.local)";
const LINK_TIMEOUT = 8000;
const MAX_LINKS_TO_CHECK = 30;
const CONCURRENCY = 8;

export interface LinkCheckResult {
  url: string;
  status: number;
  ok: boolean;
  redirected: boolean;
  finalUrl?: string;
  error?: string;
}

export interface LinkHealthSummary {
  total: number;
  checked: number;
  ok: number;
  redirects: number;
  broken: number;
  brokenLinks: LinkCheckResult[];
  redirectLinks: LinkCheckResult[];
}

export function extractInternalLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string[] {
  let host = "";
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    return [];
  }

  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    )
      return;
    try {
      const full = new URL(href, baseUrl);
      if (full.hostname === host && (full.protocol === "http:" || full.protocol === "https:")) {
        full.hash = "";
        links.add(full.toString());
      }
    } catch {
      // ignore malformed URLs
    }
  });

  return Array.from(links);
}

async function checkSingleLink(url: string): Promise<LinkCheckResult> {
  const baseConfig = {
    timeout: LINK_TIMEOUT,
    maxRedirects: 5,
    headers: { "User-Agent": UA, Accept: "*/*" },
    validateStatus: () => true,
  } as const;

  try {
    const headRes = await axios({
      ...baseConfig,
      url,
      method: "HEAD",
    });

    let status = headRes.status;
    let response = headRes;

    if (status === 405 || status === 501 || status === 0) {
      const getRes = await axios({
        ...baseConfig,
        url,
        method: "GET",
        headers: { ...baseConfig.headers, Range: "bytes=0-0" },
        responseType: "arraybuffer",
        maxContentLength: 1024,
      });
      status = getRes.status;
      response = getRes;
    }

    const finalUrl: string = response.request?.res?.responseUrl ?? url;
    const redirected = finalUrl !== url;

    return {
      url,
      status,
      ok: status >= 200 && status < 400,
      redirected,
      finalUrl: redirected ? finalUrl : undefined,
    };
  } catch (e) {
    return {
      url,
      status: 0,
      ok: false,
      redirected: false,
      error: e instanceof Error ? e.message : "ქსელის შეცდომა",
    };
  }
}

async function pMap<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const idx = cursor++;
        results[idx] = await mapper(items[idx]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

export async function checkLinkHealth(
  links: string[]
): Promise<LinkHealthSummary> {
  const total = links.length;
  const toCheck = links.slice(0, MAX_LINKS_TO_CHECK);
  const results = await pMap(toCheck, CONCURRENCY, checkSingleLink);

  const broken = results.filter((r) => !r.ok);
  const redirects = results.filter((r) => r.ok && r.redirected);
  const ok = results.filter((r) => r.ok && !r.redirected).length;

  return {
    total,
    checked: toCheck.length,
    ok,
    redirects: redirects.length,
    broken: broken.length,
    brokenLinks: broken,
    redirectLinks: redirects,
  };
}

function brokenLine(r: LinkCheckResult): string {
  const code = r.status > 0 ? String(r.status) : r.error ?? "ERR";
  return `${code} · ${r.url}`;
}

function redirectLine(r: LinkCheckResult): string {
  return `${r.url} → ${r.finalUrl ?? "?"}`;
}

export function buildLinkHealthCategory(
  summary: LinkHealthSummary
): CategoryResult {
  const checks: CheckResult[] = [];

  if (summary.total === 0) {
    checks.push({
      status: "info",
      label: "შიდა ბმულები",
      message: "გვერდზე შიდა ბმული არ მოიძებნა.",
    });
    return {
      name: "ბმულების ჯანმრთელობა",
      icon: "Link",
      checks,
    };
  }

  if (summary.total > summary.checked) {
    checks.push({
      status: "info",
      label: "შემოწმდა",
      message: `${summary.checked} ბმული ${summary.total}-დან (max ${MAX_LINKS_TO_CHECK} პერ ანალიზი).`,
      value: `${summary.checked}/${summary.total}`,
    });
  } else {
    checks.push({
      status: "info",
      label: "შემოწმდა",
      message: `ყველა ${summary.checked} შიდა ბმული.`,
      value: summary.checked,
    });
  }

  if (summary.broken === 0) {
    checks.push({
      status: "pass",
      label: "გატეხილი ბმულები",
      message: `გატეხილი ბმული არ არის — ყველა ${summary.checked} ბმული ცოცხალია ✓`,
    });
  } else if (summary.broken <= 2) {
    checks.push({
      status: "warn",
      label: "გატეხილი ბმულები",
      message: `${summary.broken} ბმული აბრუნებს შეცდომას ან ვერ პასუხობს.`,
      recommendation:
        "გასწორეთ ან 301 რედირექტი დააყენეთ — გატეხილი ბმულები აზიანებს UX-ს და crawl budget-ს.",
      value: summary.brokenLinks.map(brokenLine),
    });
  } else {
    checks.push({
      status: "fail",
      label: "გატეხილი ბმულები",
      message: `${summary.broken} ბმული გატეხილია (${summary.checked}-დან).`,
      recommendation:
        "კრიტიკული — გასწორეთ მაშინვე ან 301 რედირექტი დააყენეთ. ბევრი 404 ბმული Google-ისთვის ცუდი ხარისხის სიგნალია.",
      value: summary.brokenLinks.map(brokenLine),
    });
  }

  if (summary.redirects > 0) {
    const isWarn = summary.redirects > 5;
    checks.push({
      status: isWarn ? "warn" : "info",
      label: "რედირექტები",
      message: `${summary.redirects} შიდა ბმული გადადის რედირექტით.`,
      recommendation: isWarn
        ? "შიდა ბმულები პირდაპირ ფინალურ URL-ზე უნდა მიუთითებდნენ — რედირექტი ანელებს და ხარჯავს crawl budget-ს."
        : undefined,
      value: summary.redirectLinks.slice(0, 8).map(redirectLine),
    });
  }

  return {
    name: "ბმულების ჯანმრთელობა",
    icon: "Link",
    checks,
  };
}
