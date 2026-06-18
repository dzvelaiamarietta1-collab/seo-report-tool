import * as cheerio from "cheerio";
import axios from "axios";
import type { CategoryResult, CheckResult } from "./types";

// Real browser UA — earlier "SEOReportToolBot" UA tripped WordPress/
// WooCommerce/LiteSpeed throttling on slow shared hosts (tabatea.ge
// took 6-8s per HEAD because of this). Matching a current Chrome UA
// gets us the cached fast path most origins use for browsers.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
// Tightened from 8s/30/8: with maxDuration=30s on Vercel Hobby, a single
// slow site could max out the function on link checking alone. 5s is
// still generous (most CDNs answer in <1s; only truly broken sites take
// longer) and the sample of 20 links is large enough to spot patterns.
const LINK_TIMEOUT = 5000;
const MAX_LINKS_TO_CHECK = 20;
// 5 parallel beats 10 on slow shared hosts. tabatea.ge serves a single
// GET in 1.5s but queues 10 parallel GETs to 7-10s each because the WP
// process pool can't keep up — backing off to 5 keeps per-request time
// healthy, which actually finishes the stage faster overall. Fast sites
// (Cloudfront, Vercel-hosted etc.) feel a ~2s extra at 20 links — fair.
const CONCURRENCY = 5;

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
  // Links the stage hard-cap aborted before we could verify. Reported
  // separately from `broken` so a slow site doesn't get accused of
  // having broken links it doesn't have.
  unchecked: number;
  brokenLinks: LinkCheckResult[];
  redirectLinks: LinkCheckResult[];
  uncheckedLinks: LinkCheckResult[];
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

// Per-link timing: try HEAD fast first, then GET as a fallback.
// Many WordPress/LiteSpeed/WooCommerce origins (e.g. tabatea.ge) cache
// GET responses but generate the full page on HEAD, which makes HEAD
// requests time out while the same URL loads instantly in a browser.
// Reporting these as "broken" was a false positive — the GET fallback
// fixes it without making the check meaningfully slower (3s HEAD + 5s
// GET = 8s worst case per link, still inside the 18s stage cap).
const HEAD_TIMEOUT = 3000;
const GET_FALLBACK_TIMEOUT = 10000;

async function tryGet(
  url: string,
  signal: AbortSignal | undefined
): Promise<LinkCheckResult | null> {
  try {
    const res = await axios({
      url,
      method: "GET",
      timeout: GET_FALLBACK_TIMEOUT,
      maxRedirects: 5,
      headers: { "User-Agent": UA, Accept: "*/*", Range: "bytes=0-0" },
      validateStatus: () => true,
      signal,
      responseType: "arraybuffer",
      maxContentLength: 1024,
    });
    const finalUrl: string = res.request?.res?.responseUrl ?? url;
    return {
      url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
      redirected: finalUrl !== url,
      finalUrl: finalUrl !== url ? finalUrl : undefined,
    };
  } catch {
    return null;
  }
}

async function checkSingleLink(
  url: string,
  signal?: AbortSignal
): Promise<LinkCheckResult> {
  try {
    const headRes = await axios({
      url,
      method: "HEAD",
      timeout: HEAD_TIMEOUT,
      maxRedirects: 5,
      headers: { "User-Agent": UA, Accept: "*/*" },
      validateStatus: () => true,
      signal,
    });

    // HEAD worked — but if the server claimed it doesn't support HEAD
    // (405/501) or returned 0, fall back to GET. The same fallback path
    // also covers HEAD-blocking proxies.
    if (
      headRes.status === 405 ||
      headRes.status === 501 ||
      headRes.status === 0
    ) {
      const getResult = await tryGet(url, signal);
      if (getResult) return getResult;
    }

    const finalUrl: string = headRes.request?.res?.responseUrl ?? url;
    return {
      url,
      status: headRes.status,
      ok: headRes.status >= 200 && headRes.status < 400,
      redirected: finalUrl !== url,
      finalUrl: finalUrl !== url ? finalUrl : undefined,
    };
  } catch (headErr) {
    // HEAD failed (timeout / connection error). Retry as GET — origins
    // like tabatea.ge time out on HEAD but serve GET from cache.
    const getResult = await tryGet(url, signal);
    if (getResult) return getResult;

    return {
      url,
      status: 0,
      ok: false,
      redirected: false,
      error: headErr instanceof Error ? headErr.message : "ქსელის შეცდომა",
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

// Hard cap on the whole link-check stage. Per-link axios timeout alone
// has proven unreliable on bot-protected / LiteSpeed origins where a
// stalled TLS handshake can keep the request alive long past the timeout.
// The AbortController guarantees we ship results within this window
// regardless. 18s leaves room under the 30s function maxDuration.
const LINK_STAGE_HARD_CAP_MS = 30_000;

export async function checkLinkHealth(
  links: string[]
): Promise<LinkHealthSummary> {
  const total = links.length;
  const toCheck = links.slice(0, MAX_LINKS_TO_CHECK);

  const ac = new AbortController();
  const hardTimer = setTimeout(() => ac.abort(), LINK_STAGE_HARD_CAP_MS);

  // Mutate a shared array as workers progress so we can ship partials if
  // the hard cap trips before pMap finishes.
  const partial: (LinkCheckResult | undefined)[] = new Array(toCheck.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, toCheck.length) },
    async () => {
      while (cursor < toCheck.length && !ac.signal.aborted) {
        const idx = cursor++;
        partial[idx] = await checkSingleLink(toCheck[idx], ac.signal);
      }
    }
  );

  // Race the worker pool against the hard cap. If the cap wins we still
  // return whatever partial slots were populated; un-checked links are
  // marked as ERR ("stage timed out") so the user sees coverage.
  await Promise.race([
    Promise.all(workers),
    new Promise<void>((resolve) => {
      ac.signal.addEventListener("abort", () => resolve(), { once: true });
    }),
  ]);
  clearTimeout(hardTimer);

  const results: LinkCheckResult[] = toCheck.map((url, i) =>
    partial[i] ?? {
      url,
      status: 0,
      ok: false,
      redirected: false,
      error: "stage timed out",
    }
  );

  // Split "stage timed out" off from "broken". A timeout is "we couldn't
  // tell"; a broken link is "the server actively said no". Lumping them
  // together produced false positives on slow shared hosts (tabatea.ge:
  // every link reported as broken when the site is actually live, just
  // slow). The UI surfaces these as a separate `unchecked` bucket.
  //
  // Rate-limit + anti-bot statuses also go in `unchecked`, not `broken`:
  //   429 Too Many Requests
  //   503 Service Unavailable (often rate-limit on shared hosts)
  //   508 Loop Detected (in practice — LiteSpeed/Apache anti-flood signal)
  //   520-527 Cloudflare origin-protection codes
  // A real browser opens these URLs fine — our parallel scanner just
  // tripped the host's bot-protection. Reporting them as "broken" was
  // a false positive on coridoor.ge (LiteSpeed) and similar hosts.
  const isAmbiguousStatus = (s: number) =>
    s === 429 || s === 503 || s === 508 || (s >= 520 && s <= 527);
  const unchecked = results.filter(
    (r) =>
      !r.ok &&
      (r.error === "stage timed out" ||
        r.status === 0 ||
        isAmbiguousStatus(r.status))
  );
  const broken = results.filter(
    (r) => !r.ok && !unchecked.includes(r)
  );
  const redirects = results.filter((r) => r.ok && r.redirected);
  const ok = results.filter((r) => r.ok && !r.redirected).length;

  return {
    total,
    checked: toCheck.length,
    ok,
    redirects: redirects.length,
    broken: broken.length,
    unchecked: unchecked.length,
    brokenLinks: broken,
    redirectLinks: redirects,
    uncheckedLinks: unchecked,
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

  // Slow-host bucket: links that we couldn't verify because the link
  // stage ran out of time. Surfacing this honestly is better than
  // calling them broken — the user can rerun on a faster connection.
  if (summary.unchecked > 0) {
    checks.push({
      status: "info",
      label: "ვერ შემოწმდა",
      message: `${summary.unchecked} ბმული — სერვერი ძალიან ნელია, link stage timed out.`,
      recommendation:
        "ეს ბმულები არ ნიშნავს რომ გატეხილია — სავარაუდოდ საიტი slow hosting-ზეა. ხელახლა გაუშვი ანალიზი ან ხელით შეამოწმე.",
      value: summary.uncheckedLinks.slice(0, 5).map(brokenLine),
    });
  }

  if (summary.broken === 0) {
    checks.push({
      status: "pass",
      label: "გატეხილი ბმულები",
      message: `გატეხილი ბმული არ არის — ყველა ${summary.ok + summary.redirects} შემოწმებული ბმული ცოცხალია ✓`,
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
