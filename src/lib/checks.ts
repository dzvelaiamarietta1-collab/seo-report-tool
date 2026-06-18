import * as cheerio from "cheerio";
import axios, { AxiosResponse } from "axios";
import type { CheckResult, CategoryResult, BotProtection } from "./types";
import { fetchPageWithBrowser } from "./browser";
import {
  inventorySchema,
  validateOrganizationFields,
  validateSchemaFields,
} from "./schemaTypes";
import type { ShareImageCheck } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(
  url: string,
  options: { method?: "GET" | "HEAD"; followRedirects?: boolean } = {}
): Promise<AxiosResponse | null> {
  try {
    return await axios({
      url,
      method: options.method ?? "GET",
      timeout: FETCH_TIMEOUT,
      maxRedirects: options.followRedirects === false ? 0 : 5,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,ka;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
      },
      validateStatus: () => true,
      responseType: "text",
      transformResponse: [(data) => data],
      decompress: true,
    });
  } catch {
    return null;
  }
}

type FetchPageResult = {
  html: string;
  status: number;
  headers: Record<string, string>;
  finalUrl: string;
  responseTimeMs: number;
  // True when the raw (no-JS) HTML was too thin to analyze, i.e. the page
  // is JS-rendered. This is the real SSR signal: it means AI bots like
  // GPTBot/ClaudeBot/PerplexityBot - which don't execute JavaScript -
  // would see a near-empty page even though end users see content.
  rawHtmlThin: boolean;
};

function lowercaseHeaders(
  headers: Record<string, unknown>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)])
  );
}

function looksThin(html: string): boolean {
  if (html.length < 2000) return true;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return true;
  const visibleText = bodyMatch[1]
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return visibleText.length < 200;
}

export async function fetchPage(url: string): Promise<FetchPageResult | null> {
  // Phase 1: try axios first (fast path, ~1-3s).
  // Most sites serve real HTML to plain HTTP - no need to spin up Chrome.
  const start = Date.now();
  const axiosRes = await fetchWithTimeout(url);
  const axiosHtml =
    axiosRes && typeof axiosRes.data === "string" ? axiosRes.data : "";
  const axiosOk =
    !!axiosRes && axiosRes.status >= 200 && axiosRes.status < 400;

  // Single source of truth for "is the no-JS HTML usable?" - used both
  // for the fast-path decision and the SSR signal we expose downstream.
  const rawAxiosThin = !axiosRes || !axiosOk || looksThin(axiosHtml);

  if (axiosRes && axiosOk && !rawAxiosThin) {
    return {
      html: axiosHtml,
      status: axiosRes.status,
      headers: lowercaseHeaders(axiosRes.headers),
      finalUrl: axiosRes.request?.res?.responseUrl ?? url,
      responseTimeMs: Date.now() - start,
      rawHtmlThin: false,
    };
  }

  // Phase 2: fallback to headless browser for SPAs, bot-protected sites,
  // or anything where raw HTML is too thin to analyze.
  const browserResult = await fetchPageWithBrowser(url);
  if (browserResult) {
    return {
      html: browserResult.html,
      status: browserResult.status,
      headers: lowercaseHeaders(browserResult.headers),
      finalUrl: browserResult.finalUrl,
      responseTimeMs: browserResult.responseTimeMs,
      // Browser was needed because raw HTML was thin → SSR concern is real.
      rawHtmlThin: rawAxiosThin,
    };
  }

  // Last resort: return whatever axios gave us, even if thin or 4xx -
  // the route will detect bot-protection downstream.
  if (axiosRes) {
    return {
      html: axiosHtml,
      status: axiosRes.status,
      headers: lowercaseHeaders(axiosRes.headers),
      finalUrl: axiosRes.request?.res?.responseUrl ?? url,
      responseTimeMs: Date.now() - start,
      rawHtmlThin: rawAxiosThin,
    };
  }

  return null;
}

function check(
  status: CheckResult["status"],
  label: string,
  message: string,
  recommendation?: string,
  value?: CheckResult["value"]
): CheckResult {
  return { status, label, message, recommendation, value };
}

const BOT_PROTECTION_TITLES =
  /Just a moment|Checking your browser|Access denied|Attention Required|DDoS protection|Verifying you are human|Please wait|Security check|Bot Verification|Pardon Our Interruption|Captcha/i;

const BOT_PROTECTION_BODY =
  /cf-ray|cloudflare|ddos-guard|incapsula|imperva|akamai bot manager|perimeterx|datadome|kasada|please complete the security check|enable javascript and cookies/i;

export function detectBotProtection(
  status: number,
  headers: Record<string, string>,
  $: cheerio.CheerioAPI
): BotProtection {
  const title = $("title").first().text().trim();
  const bodyText = $("body").text().slice(0, 5000);
  const server = (headers["server"] ?? "").toLowerCase();
  const cfRay = headers["cf-ray"];
  const cfMitigated = headers["cf-mitigated"];
  const xFwBlock = headers["x-firewall-block"];
  const setCookie = (headers["set-cookie"] ?? "").toLowerCase();

  let provider = "";
  if (cfRay || cfMitigated || server.includes("cloudflare") || setCookie.includes("__cf_bm")) {
    provider = "Cloudflare";
  } else if (server.includes("ddos-guard") || setCookie.includes("__ddg")) {
    provider = "DDoS-Guard";
  } else if (server.includes("imperva") || server.includes("incapsula")) {
    provider = "Imperva/Incapsula";
  } else if (setCookie.includes("datadome")) {
    provider = "DataDome";
  } else if (xFwBlock) {
    provider = "Web Application Firewall";
  }

  const titleMatch = BOT_PROTECTION_TITLES.test(title);
  const bodyMatch = BOT_PROTECTION_BODY.test(bodyText);
  const blockedStatus = status === 403 || status === 429 || status === 503;

  const challengeDetected = titleMatch || bodyMatch;

  if (blockedStatus && (challengeDetected || provider)) {
    return {
      detected: true,
      provider: provider || "უცნობი ბოტ-დაცვა",
      reason: `HTTP ${status}${titleMatch ? ` + Title: "${title}"` : ""}${
        !titleMatch && bodyMatch ? " + დაცვის სიგნალები HTML-ში" : ""
      }`,
    };
  }

  if (challengeDetected && (provider || titleMatch)) {
    return {
      detected: true,
      provider: provider || "უცნობი ბოტ-დაცვა",
      reason: `Challenge გვერდი${titleMatch ? `: "${title}"` : ""}`,
    };
  }

  return { detected: false, provider: "", reason: "" };
}

export function analyzeTechnical(
  url: string,
  status: number,
  headers: Record<string, string>,
  $: cheerio.CheerioAPI,
  extras: ExtrasResult,
  options?: { skipHtmlChecks?: boolean }
): CategoryResult {
  const checks: CheckResult[] = [];
  const isHttps = url.startsWith("https://");
  const skipHtml = options?.skipHtmlChecks === true;

  checks.push(
    isHttps
      ? check("pass", "HTTPS", "საიტი იყენებს HTTPS-ს - დაცული კავშირი ✓")
      : check(
          "fail",
          "HTTPS",
          "საიტი არ იყენებს HTTPS-ს",
          "საიტს გადავიყვანთ HTTPS-ზე SSL სერტიფიკატით - Google-ის რანკინგისთვის აუცილებელია."
        )
  );

  if (isHttps) {
    if (extras.httpToHttps === "ok") {
      checks.push(
        check(
          "pass",
          "HTTP→HTTPS Redirect",
          "http:// ვერსია 301-ით გადადის https://-ზე ✓"
        )
      );
    } else if (extras.httpToHttps === "missing") {
      checks.push(
        check(
          "fail",
          "HTTP→HTTPS Redirect",
          "http:// ვერსია ცოცხალია და redirect-ი არ აქვს",
          "მოაწყვეთ 301 redirect http:// → https:// (Apache: .htaccess; Nginx: server block; Cloudflare: Always Use HTTPS rule). სხვაგვარად Google ცალკე ინდექსაციას უკეთებს http ვერსიას - duplicate content."
        )
      );
    } else {
      checks.push(
        check(
          "info",
          "HTTP→HTTPS Redirect",
          "http:// ვერსია მიუწვდომელია - სავარაუდოდ მხოლოდ https გაშვება (კარგია)"
        )
      );
    }
  }

  if (status >= 200 && status < 300) {
    checks.push(check("pass", "HTTP სტატუსი", `მთავარი გვერდი აბრუნებს ${status} OK`, undefined, status));
  } else if (status >= 300 && status < 400) {
    checks.push(check("warn", "HTTP სტატუსი", `მთავარი გვერდი აბრუნებს ${status} (რედირექტი)`, "შეამოწმეთ რედირექტების ჯაჭვი - ზედმეტი hop-ები ანელებს საიტს.", status));
  } else {
    checks.push(check("fail", "HTTP სტატუსი", `მთავარი გვერდი აბრუნებს ${status}`, "გვერდი არ არის ხელმისაწვდომი - Google ვერ ინდექსაციას უკეთებს.", status));
  }

  // Soft 404 - page returns 200 but content screams "not found". Google
  // demotes these because they masquerade as real pages. We look at title
  // and visible body text; very short content combined with a "not found"
  // string is the strongest signal. Skip when bot-protected (challenge
  // pages would false-positive).
  if (!skipHtml && status >= 200 && status < 300) {
    const title = $("title").first().text().trim();
    // Strip script/style before measuring body to avoid counting JS bundles.
    const bodyClone = $("body").clone();
    bodyClone.find("script, style, noscript").remove();
    const bodyText = bodyClone.text().replace(/\s+/g, " ").trim();
    const notFoundPattern =
      /\b(?:404|page not found|not\s+found|page\s+doesn'?t\s+exist|page\s+unavailable|nothing\s+found)\b|გვერდი\s+ვერ\s+მოიძებნა|გვერდი\s+არ\s+არსებობს|გვერდი\s+აღარ\s+არსებობს|გვერდი\s+წაშლილია|შეცდომა\s*404/iu;
    const titleHits = notFoundPattern.test(title);
    const bodyHits = notFoundPattern.test(bodyText);
    const shortBody = bodyText.length < 600;
    if (titleHits && (bodyHits || shortBody)) {
      checks.push(
        check(
          "fail",
          "Soft 404",
          `გვერდი აბრუნებს 200 OK-ს, მაგრამ შინაარსი "ვერ მოიძებნა" ტიპისაა${title ? `: "${title}"` : ""}`,
          "Google ამას low-quality signal-ად აღიქვამს - გვერდმა უნდა დააბრუნოს რეალური 404/410 სტატუსი ან გასწორდეს content-ი.",
          title
        )
      );
    } else if (bodyHits && shortBody && bodyText.length < 200) {
      checks.push(
        check(
          "warn",
          "Soft 404",
          'შინაარსი ძალიან მცირეა და "ვერ მოიძებნა" pattern-ი ჩანს - შეიძლება soft 404 იყოს.',
          "თუ მართლა 404 გვერდია, შევცვლით HTTP status-ს 404-ად."
        )
      );
    }
  }

  // Cache-Control - Google's crawler benefits from sane HTML caching.
  // "no-store" / "private" on the main HTML costs crawl budget because
  // every revisit re-fetches the full page even if nothing changed.
  // Common WordPress / Cloudflare misconfiguration.
  const cacheCtl = (headers["cache-control"] ?? "").toLowerCase();
  if (cacheCtl) {
    if (/\bno-store\b/.test(cacheCtl)) {
      checks.push(
        check(
          "warn",
          "Cache-Control",
          `Cache-Control: ${cacheCtl} - HTML არ ქეშირდება`,
          "no-store გადავხედავთ - HTML გვერდისთვის თუ ნამდვილად დინამიკურია, ოკ; თუ სტატიკურია, შევცვლით public, max-age=300 (5 წუთი) ან მეტად. crawl budget-ისთვის მნიშვნელოვანია.",
          cacheCtl
        )
      );
    } else if (/\bprivate\b/.test(cacheCtl) && !/\bno-cache\b/.test(cacheCtl)) {
      checks.push(
        check(
          "info",
          "Cache-Control",
          `Cache-Control: ${cacheCtl} - proxy-ები ვერ ქეშირებენ`,
          undefined,
          cacheCtl
        )
      );
    } else {
      checks.push(
        check("pass", "Cache-Control", `Cache-Control: ${cacheCtl}`, undefined, cacheCtl)
      );
    }
  }

  checks.push(
    extras.robotsTxt
      ? check("pass", "robots.txt", "robots.txt ფაილი არსებობს ✓")
      : check("warn", "robots.txt", "robots.txt ფაილი ვერ მოიძებნა", "შევქმნით /robots.txt-ს ფაილი crawler-ების სამართავად.")
  );

  // Sitemap check uses 4-way status to distinguish "we verified it works"
  // from "robots.txt promised it but URL is 404" from "couldn't reach due
  // to anti-bot protection". The middle case (declared-broken) is a real
  // critical issue worth flagging hard.
  if (extras.sitemapStatus === "verified") {
    checks.push(
      check(
        "pass",
        "XML Sitemap",
        `Sitemap მუშაობს ✓${extras.sitemapUrl ? ` (${extras.sitemapUrl})` : ""}`
      )
    );
  } else if (extras.sitemapStatus === "declared-broken") {
    checks.push(
      check(
        "fail",
        "XML Sitemap",
        `Sitemap URL დარეგისტრირებულია robots.txt-ში, მაგრამ ფაილი არ პასუხობს (404/error)${
          extras.sitemapUrl ? `: ${extras.sitemapUrl}` : ""
        }.`,
        "Google ვერ აღმოაჩენს გვერდებს - გადავაგენერირებთ sitemap-ს (Yoast/Rank Math/WordPress core) ან გავასწორებთ robots.txt-ში Sitemap: ხაზს."
      )
    );
  } else if (extras.sitemapStatus === "declared-unverified") {
    checks.push(
      check(
        "warn",
        "XML Sitemap",
        `Sitemap დარეგისტრირებულია robots.txt-ში, მაგრამ ჩვენი scanner-ი სერვერმა ვერ უპასუხა (anti-bot დაცვა)${
          extras.sitemapUrl ? `: ${extras.sitemapUrl}` : ""
        }. გადაამოწმე ხელით ბრაუზერში - Google-ის crawler-ი whitelist-ში ხშირად დაიშვება.`,
        "ხელით ვამოწმებთ ბრაუზერში. თუ XML-ი ჩანს - OK. თუ არა - გადავაგენერირებთ sitemap-ს."
      )
    );
  } else {
    checks.push(
      check(
        "warn",
        "XML Sitemap",
        "sitemap.xml ფაილი ვერ მოიძებნა.",
        "შევქმნით XML sitemap-ს (Yoast/Rank Math/WordPress core) და დავარეგისტრირებთ Google Search Console-ში."
      )
    );
  }

  if (!skipHtml) {
    const canonical = $('link[rel="canonical"]').attr("href");
    checks.push(
      canonical
        ? check("pass", "Canonical Tag", `Canonical tag მითითებულია: ${canonical}`, undefined, canonical)
        : check("warn", "Canonical Tag", "Canonical tag არ არის მითითებული", "დავამატებთ <link rel=\"canonical\">-ს დუბლირებული კონტენტის თავიდან ასაცილებლად.")
    );

    const metaRobots = $('meta[name="robots"]').attr("content");
    if (metaRobots) {
      if (/noindex/i.test(metaRobots)) {
        checks.push(check("fail", "Meta Robots", `noindex მითითებულია: "${metaRobots}"`, "მთავარ გვერდზე noindex Google-ს უკრძალავს ინდექსაციას - გადავხედავთ და მოვხსნით.", metaRobots));
      } else {
        checks.push(check("pass", "Meta Robots", `Meta robots: "${metaRobots}"`, undefined, metaRobots));
      }
    } else {
      checks.push(check("info", "Meta Robots", "Meta robots tag არ არის - ნაგულისხმევად index, follow"));
    }
  }

  const hasCSP = !!headers["content-security-policy"];
  const hasXFO = !!headers["x-frame-options"];
  const hasHSTS = !!headers["strict-transport-security"];
  const headersFound = [hasCSP && "CSP", hasXFO && "X-Frame-Options", hasHSTS && "HSTS"].filter(Boolean) as string[];
  if (headersFound.length >= 2) {
    checks.push(check("pass", "Security Headers", `მითითებულია: ${headersFound.join(", ")}`, undefined, headersFound));
  } else if (headersFound.length === 1) {
    checks.push(check("warn", "Security Headers", `მხოლოდ ${headersFound[0]} მითითებულია`, "დავამატებთ Content-Security-Policy, X-Frame-Options და Strict-Transport-Security headers-ს."));
  } else {
    checks.push(check("warn", "Security Headers", "უსაფრთხოების headers ვერ მოიძებნა", "კონფიგურაცია გააკეთეთ სერვერზე CSP, X-Frame-Options, HSTS-სთვის."));
  }

  if (!skipHtml) {
    const hreflangs = $('link[rel="alternate"][hreflang]').map((_, el) => $(el).attr("hreflang")).get();
    if (hreflangs.length > 0) {
      checks.push(check("pass", "hreflang", `${hreflangs.length} hreflang მითითება ნაპოვნია`, undefined, hreflangs));
    } else {
      checks.push(check("info", "hreflang", "hreflang teag-ები არ არის (მხოლოდ ერთენოვანი საიტისთვის ნორმალურია)"));
    }

    // <html lang> - accessibility + Google's local search signal.
    // Common Georgian-site bug: lang="en" left over from a starter template.
    const htmlLang = $("html").attr("lang")?.trim() ?? "";
    if (!htmlLang) {
      checks.push(
        check(
          "warn",
          "HTML lang",
          "<html lang> ატრიბუტი არ არის",
          'დავამატებთ <html lang="ka">-ს (ქართულისთვის) ან შესაბამის კოდს - ეკრანის წამკითხავი ხელსაწყო და Google ლოკალური SEO ამას იყენებს.'
        )
      );
    } else if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(htmlLang)) {
      checks.push(
        check(
          "warn",
          "HTML lang",
          `<html lang="${htmlLang}"> ფორმატი ეჭვს ბადებს`,
          'სტანდარტული BCP-47 ფორმატი: ka, ka-GE, en, en-US.',
          htmlLang
        )
      );
    } else {
      checks.push(
        check("pass", "HTML lang", `<html lang="${htmlLang}">`, undefined, htmlLang)
      );
    }

    // URL/lang mismatch - if the URL path declares a locale (/en, /ru,
    // /de etc.) the <html lang> should match. Common WordPress/Webflow
    // bug: the English version of a Georgian site keeps lang="ka" because
    // the template wasn't customised per-locale. Google then sends the
    // wrong audience or demotes the page.
    if (htmlLang) {
      let pathLocale: string | null = null;
      try {
        const u = new URL(url);
        // Match the first segment if it looks like an ISO 639-1 locale.
        const m = u.pathname.match(
          /^\/(en|ka|ru|de|fr|es|it|pt|nl|pl|tr|ar|ja|zh|ko|uk|az|hy|cs|sv|fi|no|da|el|he|hi|id|th|vi)(?:\/|$)/i
        );
        if (m) pathLocale = m[1].toLowerCase();
      } catch {
        // ignore
      }
      const htmlLangBase = htmlLang.split("-")[0].toLowerCase();
      if (pathLocale && pathLocale !== htmlLangBase) {
        checks.push(
          check(
            "warn",
            "URL/lang mismatch",
            `URL მიუთითებს /${pathLocale}/, მაგრამ <html lang="${htmlLang}">`,
            "ცალკეული ენის ვერსიის lang ატრიბუტი უნდა შეესაბამებოდეს URL-ის ენას - Google იყენებს ამას audience targeting-ისთვის. შესწორე template-ი რომ თითო ენაზე ცალკე lang დააყენო.",
            `${pathLocale} ↔ ${htmlLang}`
          )
        );
      }
    }

    // Mixed content - only meaningful on HTTPS pages. <a href> excluded
    // since browsers don't fetch link targets (no mixed-content warning).
    if (isHttps) {
      const httpResources: string[] = [];
      $(
        "img[src], script[src], iframe[src], video[src], audio[src], source[src], " +
          'link[rel="stylesheet"][href], link[rel="preload"][href], ' +
          'link[rel="prefetch"][href], link[rel="manifest"][href], ' +
          'link[rel="icon"][href], link[rel="canonical"][href]'
      ).each((_, el) => {
        const $el = $(el);
        const ref = $el.attr("src") ?? $el.attr("href") ?? "";
        if (ref.startsWith("http://")) {
          if (httpResources.length < 5) httpResources.push(ref);
          else if (httpResources.length < 100) httpResources.push("");
        }
      });
      const httpCount = httpResources.length;
      const examples = httpResources
        .filter((r) => r !== "")
        .map((u) => (u.length > 80 ? u.slice(0, 80) + "…" : u));

      if (httpCount === 0) {
        checks.push(
          check("pass", "Mixed Content", "ყველა რესურსი HTTPS-ზე ✓")
        );
      } else {
        checks.push(
          check(
            "fail",
            "Mixed Content",
            `${httpCount}${httpCount >= 100 ? "+" : ""} HTTP რესურსი HTTPS გვერდზე`,
            "ბრაუზერი აქტიურ რესურსებს (script, iframe) დაბლოკავს, პასიურებზე (img) გაფრთხილებას აჩვენებს. ყველაფერს გადავიყვანთ https://-ზე ან გამოვიყენებთ პროტოკოლ-ნეიტრალურ `//`-ით დაწყებულ URL-ს.",
            examples.length > 0 ? examples : httpCount
          )
        );
      }
    }
  }

  return { name: "ტექნიკური SEO", icon: "Wrench", checks };
}

export function analyzeOnPage($: cheerio.CheerioAPI, baseUrl: string): CategoryResult {
  const checks: CheckResult[] = [];

  const title = $("title").first().text().trim();
  if (!title) {
    checks.push(check("fail", "Title Tag", "Title არ არსებობს", "დავამატებთ <title> tag-ს - SEO-სთვის კრიტიკულია."));
  } else if (title.length < 30) {
    checks.push(check("warn", "Title Tag", `Title ძალიან მოკლეა (${title.length} სიმბ.): "${title}"`, "ოპტიმალური სიგრძე 50-60 სიმბოლოა.", title));
  } else if (title.length > 60) {
    checks.push(check("warn", "Title Tag", `Title ძალიან გრძელია (${title.length} სიმბ.): "${title}"`, "Google ჩამოაჭრის - შეამცირეთ 50-60 სიმბოლომდე.", title));
  } else {
    checks.push(check("pass", "Title Tag", `Title ოპტიმალური სიგრძისაა (${title.length} სიმბ.): "${title}"`, undefined, title));
  }

  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!desc) {
    checks.push(check("fail", "Meta Description", "Meta description არ არსებობს", "დავამატებთ <meta name=\"description\">-ს 140-160 სიმბოლოთი - CTR-ზე გავლენას ახდენს."));
  } else if (desc.length < 100) {
    checks.push(check("warn", "Meta Description", `Description ძალიან მოკლეა (${desc.length} სიმბ.)`, "ოპტიმალური სიგრძე 140-160 სიმბოლოა.", desc));
  } else if (desc.length > 160) {
    checks.push(check("warn", "Meta Description", `Description ძალიან გრძელია (${desc.length} სიმბ.)`, "Google ჩამოაჭრის 160 სიმბოლოზე - შეამცირეთ.", desc));
  } else {
    checks.push(check("pass", "Meta Description", `Description ოპტიმალური სიგრძისაა (${desc.length} სიმბ.)`, undefined, desc));
  }

  const h1Count = $("h1").length;
  const h1Text = $("h1").first().text().trim();
  if (h1Count === 0) {
    checks.push(check("fail", "H1 სათაური", "H1 tag არ არსებობს", "დავამატებთ ერთ H1-ს - გვერდის მთავარ სათაურს."));
  } else if (h1Count > 1) {
    checks.push(check("warn", "H1 სათაური", `${h1Count} H1 ნაპოვნია - უნდა იყოს მხოლოდ ერთი`, "გვერდზე მხოლოდ ერთი H1 უნდა იყოს - დანარჩენებს გადავაქცევთ H2-ად.", h1Count));
  } else {
    checks.push(check("pass", "H1 სათაური", `H1 ერთია: "${h1Text}"`, undefined, h1Text));
  }

  // Walk headings in document order to detect skipped levels (H1 → H3 etc.)
  // Counting alone misses real accessibility issues - screen readers rely
  // on contiguous nesting.
  const headingLevels: number[] = [];
  const headingCounts: Record<string, number> = {
    h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0,
  };
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = (el as { tagName?: string }).tagName ?? "";
    const level = parseInt(tag.slice(1), 10);
    if (level >= 1 && level <= 6) {
      headingLevels.push(level);
      headingCounts[`h${level}`]++;
    }
  });

  const skipped: string[] = [];
  for (let i = 1; i < headingLevels.length; i++) {
    const prev = headingLevels[i - 1];
    const cur = headingLevels[i];
    if (cur > prev + 1) {
      skipped.push(`H${prev}→H${cur}`);
    }
  }

  const headingSummary =
    `H1: ${headingCounts.h1}, H2: ${headingCounts.h2}, H3: ${headingCounts.h3}, H4: ${headingCounts.h4}` +
    (headingCounts.h5 > 0 ? `, H5: ${headingCounts.h5}` : "") +
    (headingCounts.h6 > 0 ? `, H6: ${headingCounts.h6}` : "");

  if (headingCounts.h2 === 0 && headingCounts.h3 === 0) {
    checks.push(
      check(
        "warn",
        "სათაურების იერარქია",
        "H2-H6 სათაურები არ არის",
        "დავამატებთ ქვესათაურებს კონტენტის სტრუქტურირებისთვის.",
        headingSummary
      )
    );
  } else if (skipped.length > 0) {
    checks.push(
      check(
        "warn",
        "სათაურების იერარქია",
        `${headingSummary} - გადახტომები: ${skipped.slice(0, 3).join(", ")}`,
        "სათაურების დონეები გამოტოვებულია - ეკრანის წამკითხავი ხელსაწყო ვერ ცნობს სტრუქტურას სწორად. გავასწორებთ ისე, რომ მხოლოდ მომიჯნავე დონეები გამოვიყენოთ (H1→H2→H3).",
        skipped
      )
    );
  } else {
    checks.push(
      check("pass", "სათაურების იერარქია", headingSummary, undefined, headingSummary)
    );
  }

  // Three-bucket ALT analysis:
  //   descriptiveAlt - alt="actual text"  → good for content images
  //   emptyAlt       - alt=""             → correct only for decorative images
  //   missingAlt     - no alt attribute   → always wrong (screen readers read filename)
  // Previous code lumped empty + descriptive together as "with alt", masking
  // the common mistake of putting alt="" on content images.
  const allImages = $("img");
  let totalImages = 0;
  let descriptiveAlt = 0;
  let emptyAlt = 0;
  let missingAlt = 0;
  let lazyImages = 0;
  let modernFormat = 0;
  const missingAltSrcs: string[] = [];

  allImages.each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") ?? $el.attr("data-src") ?? "";
    if (!src) return;
    if (src.startsWith("data:")) return;
    if (/^\/?(pixel|tracking|spacer|blank)/i.test(src)) return;
    const widthAttr = parseInt($el.attr("width") ?? "0", 10);
    const heightAttr = parseInt($el.attr("height") ?? "0", 10);
    if (widthAttr > 0 && heightAttr > 0 && widthAttr <= 2 && heightAttr <= 2) {
      return;
    }

    totalImages++;
    const alt = $el.attr("alt");
    if (alt === undefined) {
      missingAlt++;
      if (missingAltSrcs.length < 5) missingAltSrcs.push(src);
    } else if (alt.trim() === "") {
      emptyAlt++;
    } else {
      descriptiveAlt++;
    }
    const loading = $el.attr("loading");
    if (loading === "lazy") lazyImages++;
    if (/\.(webp|avif)(\?|$)/i.test(src)) modernFormat++;
  });

  const isLikelyJsRendered = totalImages > 0 && totalImages < 8;
  const jsNote = isLikelyJsRendered
    ? " (HTML-ში მოცემულ სურათებზე - JavaScript-ით დატვირთული სურათები არ ჩანს ბოტებისთვის)"
    : "";

  const altRatio = `${descriptiveAlt}/${totalImages}`;
  const truncSrcs = missingAltSrcs.map((s) =>
    s.length > 80 ? s.slice(0, 80) + "…" : s
  );

  if (totalImages === 0) {
    checks.push(
      check(
        "info",
        "ALT ტექსტები",
        "HTML-ში სურათები არ მოიძებნა - შესაძლოა საიტი JavaScript-ით ხატავს კონტენტს, რასაც ჩვენი სკანერი ვერ ხედავს."
      )
    );
  } else if (missingAlt === 0 && emptyAlt === 0) {
    // All images have descriptive alt
    checks.push(
      check(
        "pass",
        "ALT ტექსტები",
        `ყველა ${totalImages} სურათს აქვს აღწერითი ALT ✓${jsNote}`,
        undefined,
        altRatio
      )
    );
  } else if (missingAlt === 0 && emptyAlt > 0) {
    // No missing, but some empty - could be decorative (correct) or
    // content image with wrong empty alt (false-pass risk). Warn so
    // the auditor checks in person.
    checks.push(
      check(
        "warn",
        "ALT ტექსტები",
        `${emptyAlt}/${totalImages} სურათს ცარიელი ALT (alt="") აქვს${jsNote}.`,
        "ცარიელი ALT სწორია მხოლოდ წმინდა დეკორატიული სურათებისთვის (ფონი, separator). თუ ეს კონტენტ-სურათია (პროდუქტი, ლოგო, ილუსტრაცია) - შევავსებთ აღწერითი ტექსტით.",
        `აღწერითი: ${descriptiveAlt}, ცარიელი: ${emptyAlt}, ამოკლული: 0 / სულ ${totalImages}`
      )
    );
  } else if (missingAlt / totalImages > 0.5) {
    checks.push(
      check(
        "fail",
        "ALT ტექსტები",
        `${missingAlt}/${totalImages} სურათს alt ატრიბუტი საერთოდ არ აქვს${jsNote}${
          emptyAlt > 0 ? `, ${emptyAlt} კი ცარიელი ALT-ით` : ""
        }.`,
        "დავამატებთ აღწერითი alt ტექსტს - accessibility + SEO. დეკორატიული სურათებისთვის alt=\"\" (ცარიელი) სწორია; კონტენტ-სურათისთვის - სავალდებულო აღწერა.",
        truncSrcs.length > 0 ? truncSrcs : altRatio
      )
    );
  } else {
    checks.push(
      check(
        "warn",
        "ALT ტექსტები",
        `${missingAlt}/${totalImages} სურათს alt ატრიბუტი არ აქვს${jsNote}${
          emptyAlt > 0 ? `, ${emptyAlt} ცარიელი ALT-ით` : ""
        }.`,
        "შევავსებთ დარჩენილ ALT-ებს. დეკორატიული სურათებისთვის alt=\"\" (ცარიელი).",
        truncSrcs.length > 0 ? truncSrcs : altRatio
      )
    );
  }

  if (totalImages > 0) {
    if (lazyImages / totalImages > 0.5) {
      checks.push(check("pass", "Lazy Loading", `${lazyImages}/${totalImages} სურათი იყენებს lazy loading-ს`, undefined, `${lazyImages}/${totalImages}`));
    } else {
      checks.push(check("warn", "Lazy Loading", `მხოლოდ ${lazyImages}/${totalImages} სურათი lazy load-ით${jsNote}`, "დავამატებთ loading=\"lazy\"-ს below-the-fold სურათებისთვის (LCP-ის გარდა).", `${lazyImages}/${totalImages}`));
    }
    if (modernFormat / totalImages > 0.3) {
      checks.push(check("pass", "Image Format", `${modernFormat}/${totalImages} თანამედროვე ფორმატში (WebP/AVIF)`, undefined, `${modernFormat}/${totalImages}`));
    } else {
      checks.push(check("warn", "Image Format", `${modernFormat}/${totalImages} მხოლოდ WebP/AVIF-ში`, "JPG/PNG-ს გადავიყვანთ WebP-ში - 30-50% უფრო მცირე ზომა.", `${modernFormat}/${totalImages}`));
    }
  }

  // Dedupe links (same URL counted once) and treat subdomains of the same
  // registrable domain as internal - blog.coridoor.ge and coridoor.ge
  // belong to the same site.
  const uniqueInternal = new Set<string>();
  const uniqueExternal = new Set<string>();
  let host = "";
  try {
    host = new URL(baseUrl).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }

  const sameSite = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    const aClean = a.replace(/^www\./, "");
    const bClean = b.replace(/^www\./, "");
    return (
      aClean === bClean ||
      aClean.endsWith("." + bClean) ||
      bClean.endsWith("." + aClean)
    );
  };

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
      full.hash = "";
      const normalized = full.toString();
      if (sameSite(full.hostname, host)) {
        uniqueInternal.add(normalized);
      } else {
        uniqueExternal.add(normalized);
      }
    } catch {
      // ignore malformed
    }
  });

  const internal = uniqueInternal.size;
  const external = uniqueExternal.size;

  if (internal < 3) {
    checks.push(check("warn", "შიდა ბმულები", `მხოლოდ ${internal} უნიკალური შიდა ბმული`, "დავამატებთ შიდა ბმულებს სტრუქტურისა და topical authority-სთვის."));
  } else {
    checks.push(check("pass", "შიდა ბმულები", `${internal} უნიკალური შიდა ბმული (subdomain-ებიც)`, undefined, internal));
  }

  if (external === 0) {
    checks.push(check("info", "გარე ბმულები", "გარე ბმულები არ არის", "ავტორიტეტულ წყაროებზე ბმულები ნდობას ზრდის."));
  } else {
    checks.push(check("pass", "გარე ბმულები", `${external} უნიკალური გარე ბმული`, undefined, external));
  }

  // Word count over CONTENT only - strip nav/header/footer/aside/script/
  // style/noscript before counting. Prefer <main>/<article> as content
  // root if the site is structured semantically; fall back to <body>.
  // Previous version counted entire body (incl. menus, cookie banners,
  // copyright) which inflated counts wildly on small sites.
  const $content = $("main").first().length > 0
    ? $("main").first()
    : $("article").first().length > 0
    ? $("article").first()
    : $("body");
  const $contentClone = $content.clone();
  $contentClone
    .find(
      "nav, header, footer, aside, script, style, noscript, " +
        "[role='navigation'], [role='banner'], [role='contentinfo']"
    )
    .remove();
  const contentText = $contentClone.text().replace(/\s+/g, " ").trim();
  const wordCount = contentText.split(" ").filter((w) => w.length > 1).length;

  if (wordCount < 300) {
    checks.push(check("warn", "კონტენტის მოცულობა", `${wordCount} სიტყვა - ცოტაა (nav/footer გამოთიშულია)`, "მინიმუმ 600-1000 სიტყვა, იდეალურად 1500+.", wordCount));
  } else if (wordCount < 600) {
    checks.push(check("warn", "კონტენტის მოცულობა", `${wordCount} სიტყვა (nav/footer გამოთიშულია)`, "ვრცელი კონტენტი (1500+ სიტყვა) ფრიად გაგიადვილებთ რანკინგს კონკურენტულ keyword-ებზე.", wordCount));
  } else {
    checks.push(check("pass", "კონტენტის მოცულობა", `${wordCount} სიტყვა (nav/footer გამოთიშულია)`, undefined, wordCount));
  }

  return { name: "On-Page SEO", icon: "FileText", checks };
}

export function analyzeSchema(
  $: cheerio.CheerioAPI,
  shareImages?: {
    ogImageCheck: ShareImageCheck;
    twitterImageCheck: ShareImageCheck;
  }
): CategoryResult {
  const checks: CheckResult[] = [];
  const inventory = inventorySchema($);

  if (!inventory.anyStructuredData) {
    checks.push(
      check(
        "warn",
        "Schema Markup (JSON-LD)",
        "სტრუქტურირებული მონაცემები ვერ მოიძებნა (არც JSON-LD, არც microdata)",
        "დავამატებთ JSON-LD-ს: Organization, Article, Product, FAQ - AI Overviews-ისთვის კრიტიკულია 2026-ში."
      )
    );
  } else if (inventory.jsonLdBlocks > 0) {
    const note =
      inventory.microdataBlocks > 0
        ? ` + ${inventory.microdataBlocks} microdata`
        : "";
    checks.push(
      check(
        "pass",
        "Schema Markup (JSON-LD)",
        `${inventory.jsonLdBlocks} JSON-LD ბლოკი${note}, ტიპები: ${
          inventory.types.join(", ") || "უცნობი"
        }`,
        undefined,
        inventory.types
      )
    );
  } else {
    // Microdata-only: works for Google but JSON-LD is the recommended modern path.
    checks.push(
      check(
        "warn",
        "Schema Markup (JSON-LD)",
        `${inventory.microdataBlocks} microdata ნოდი, JSON-LD არ არის. ტიპები: ${
          inventory.types.join(", ") || "უცნობი"
        }`,
        "Google იღებს microdata-ს, მაგრამ JSON-LD რეკომენდებულია 2026-ისთვის - უფრო მარტივი მოვლა, AI ბოტები უკეთ კითხულობენ.",
        inventory.types
      )
    );
  }

  const ogProps = ["og:title", "og:description", "og:image", "og:url", "og:type"];
  const foundOg = ogProps.filter((p) => $(`meta[property="${p}"]`).length > 0);
  if (foundOg.length >= 4) {
    checks.push(check("pass", "Open Graph", `${foundOg.length}/${ogProps.length} OG tag მითითებულია`, undefined, foundOg));
  } else if (foundOg.length > 0) {
    checks.push(check("warn", "Open Graph", `მხოლოდ ${foundOg.length}/${ogProps.length} OG tag`, "დავამატებთ ყველა Open Graph tag-ს სოციალური მედიის სანახავად."));
  } else {
    checks.push(check("warn", "Open Graph", "Open Graph tags არ არის", "დავამატებთ og:title-ს, og:description-ს და og:image-ს - Facebook/LinkedIn გაზიარებისთვის."));
  }

  // Surface the OG image probe verdict (already computed in extractPreview).
  // The Open Graph check above only verifies tag *presence*; this one
  // verifies the actual image is the right size/aspect/format. Without it
  // a site can have og:image="logo-100x100.png" and pass "Open Graph: 5/5"
  // while looking broken in Facebook share.
  if (shareImages) {
    const og = shareImages.ogImageCheck;
    if (og.verdict === "good") {
      checks.push(
        check(
          "pass",
          "OG Image",
          `OG image ვალიდურია - ${og.reason}`,
          undefined,
          og.url
        )
      );
    } else if (og.verdict === "missing") {
      // Already covered by Open Graph tag check - skip to avoid duplication.
    } else if (og.verdict === "fail") {
      checks.push(
        check(
          "fail",
          "OG Image",
          `OG image-ი პრობლემურია - ${og.reason}`,
          og.recommendation,
          og.url
        )
      );
    } else if (og.verdict === "warn") {
      checks.push(
        check(
          "warn",
          "OG Image",
          `OG image-ის გადახედვა საჭიროა - ${og.reason}`,
          og.recommendation,
          og.url
        )
      );
    } else {
      checks.push(
        check(
          "info",
          "OG Image",
          og.reason || "OG image ვერ შემოწმდა",
          og.recommendation,
          og.url
        )
      );
    }
  }

  const twitterCard = $('meta[name="twitter:card"]').attr("content");
  if (twitterCard) {
    checks.push(check("pass", "Twitter Card", `Twitter Card: ${twitterCard}`, undefined, twitterCard));
  } else {
    checks.push(check("info", "Twitter Card", "Twitter Card არ არის", "დავამატებთ თუ Twitter/X-ზე ვიზიტორებს ელოდებით."));
  }

  // Deep field validation - catches malformed values inside otherwise-
  // well-formed schemas (telephone "555-CALL", relative-URL images,
  // currency symbols instead of ISO codes). Google Rich Results Test
  // flags these as warnings, so surfacing them early saves a round-trip.
  if (inventory.jsonLdBlocks > 0) {
    const fieldIssues = validateSchemaFields($);
    const totalIssues =
      fieldIssues.invalidPhones.length +
      fieldIssues.invalidEmails.length +
      fieldIssues.invalidUrls.length +
      fieldIssues.invalidCurrencies.length;

    if (totalIssues === 0) {
      checks.push(
        check(
          "pass",
          "JSON-LD Field Validation",
          "ცალკეული ველების ფორმატი ვალიდურია (telephone, email, URL, currency) ✓"
        )
      );
    } else {
      const examples: string[] = [];
      const fmt = (issue: { type: string; field: string; value: string }) =>
        `${issue.type}.${issue.field}: "${
          issue.value.length > 50
            ? issue.value.slice(0, 50) + "…"
            : issue.value
        }"`;
      for (const i of fieldIssues.invalidPhones.slice(0, 2)) examples.push(`☎ ${fmt(i)}`);
      for (const i of fieldIssues.invalidEmails.slice(0, 2)) examples.push(`✉ ${fmt(i)}`);
      for (const i of fieldIssues.invalidUrls.slice(0, 2)) examples.push(`🔗 ${fmt(i)}`);
      for (const i of fieldIssues.invalidCurrencies.slice(0, 2)) examples.push(`💱 ${fmt(i)}`);

      const buckets: string[] = [];
      if (fieldIssues.invalidPhones.length > 0)
        buckets.push(`${fieldIssues.invalidPhones.length} telephone`);
      if (fieldIssues.invalidEmails.length > 0)
        buckets.push(`${fieldIssues.invalidEmails.length} email`);
      if (fieldIssues.invalidUrls.length > 0)
        buckets.push(`${fieldIssues.invalidUrls.length} URL`);
      if (fieldIssues.invalidCurrencies.length > 0)
        buckets.push(`${fieldIssues.invalidCurrencies.length} currency`);

      checks.push(
        check(
          totalIssues >= 3 ? "fail" : "warn",
          "JSON-LD Field Validation",
          `${totalIssues} ცალკეული ველი არასწორი ფორმატითაა (${buckets.join(", ")})`,
          "Google Rich Results Test-ი ამ ველებზე გადააქცევს warning-ს. გადავხედავთ - telephone უნდა იყოს E.164/ეროვნული ფორმატით, URL სრული http(s)://-ით, priceCurrency 3-ასოიანი ISO 4217 კოდი (USD/EUR/GEL).",
          examples
        )
      );
    }
  }

  return { name: "Schema & სოც.მედია", icon: "Tag", checks };
}

export function analyzeAiEra(
  $: cheerio.CheerioAPI,
  llmsTxt: boolean,
  rawHtmlThin: boolean = false
): CategoryResult {
  const checks: CheckResult[] = [];

  checks.push(
    llmsTxt
      ? check("pass", "llms.txt", "llms.txt ფაილი არსებობს - AI კრაულერებისთვის მზადაა ✓")
      : check("warn", "llms.txt", "llms.txt ფაილი ვერ მოიძებნა", "შევქმნით /llms.txt-ს - ChatGPT, Claude, Perplexity-სთვის ახალი 2026 სტანდარტი.")
  );

  const inventory = inventorySchema($);

  checks.push(
    inventory.hasFAQPage
      ? check(
          "pass",
          "FAQ Schema",
          "FAQPage schema ნაპოვნია - AI Overviews-ისთვის ღონიერი სიგნალი ✓"
        )
      : check(
          "info",
          "FAQ Schema",
          "FAQPage schema არ არის",
          "თუ გვერდზე კითხვა-პასუხია, FAQ schema მნიშვნელოვნად ზრდის AI Overviews-ში გამოჩენის შანსს."
        )
  );

  if (!inventory.hasOrganization) {
    checks.push(
      check(
        "warn",
        "Organization Schema",
        "Organization schema არ არის",
        "დავამატებთ Organization-ს (ან რელევანტურ ქვე-ტიპს - LocalBusiness ლოკალური ბიზნესისთვის, Restaurant რესტორნისთვის, Store მაღაზიისთვის) sameAs ლინკებით სოც.მედიაზე."
      )
    );
  } else if (!inventory.organizationNode) {
    // Microdata-based - we can't introspect fields without a separate
    // microdata parser, so just confirm presence.
    checks.push(
      check(
        "pass",
        "Organization Schema",
        "Organization schema მითითებულია (microdata) - ბრენდის ცნობადობა AI-სთვის ✓"
      )
    );
  } else {
    const fields = validateOrganizationFields(inventory.organizationNode);
    if (fields.missingRequired.length > 0) {
      checks.push(
        check(
          "fail",
          "Organization Schema",
          `Organization schema-ს აკლია სავალდებულო ველები: ${fields.missingRequired.join(", ")}`,
          "Google-ის Knowledge Graph-ში ბრენდის გამოსაჩენად name + url სავალდებულოა. დამატებითი - logo, sameAs (სოც.მედიის ბმულები) - Knowledge Panel-ში გამოჩენის შანსს ზრდის.",
          fields.missingRequired
        )
      );
    } else if (fields.missingRecommended.length > 0) {
      checks.push(
        check(
          "warn",
          "Organization Schema",
          `Organization schema სრულდება, მაგრამ აკლია რეკომენდებული ველები: ${fields.missingRecommended.join(", ")}`,
          "name + url არის - საფუძველი დადებულია. მიზანი: logo (Knowledge Panel-ისთვის), sameAs (Facebook/LinkedIn/Wikipedia ბმულები - Google ბრენდს ცნობს ერთი არსებობით).",
          fields.missingRecommended
        )
      );
    } else {
      checks.push(
        check(
          "pass",
          "Organization Schema",
          "Organization (ან მისი ქვე-ტიპი - LocalBusiness, Store და ა.შ.) schema სრულია: name, url, logo, sameAs, contact info ✓"
        )
      );
    }
  }

  // Real SSR check: rawHtmlThin is true when the no-JS axios fetch
  // returned thin content and we had to fall back to Puppeteer to see
  // anything. That's exactly the signal AI bots experience - they don't
  // run JavaScript, so they see what axios saw, not what Puppeteer renders.
  // The previous body-length check ran AFTER Puppeteer, so it always
  // passed even on full SPAs. Note: noscript fallback can rescue this -
  // if the page provides substantial <noscript> content, AI bots see that.
  const noscriptContent = $("noscript").text().trim();
  if (rawHtmlThin && noscriptContent.length < 200) {
    checks.push(
      check(
        "warn",
        "Server-Side Rendering",
        "გვერდი ცარიელი ჩანს JavaScript-ის გარეშე - AI კრაულერები ვერ ხედავენ კონტენტს",
        "AI კრაულერები (GPTBot, ClaudeBot, PerplexityBot) JavaScript-ს არ ასრულებენ. გამოსავალი: SSR (Next.js getServerSideProps), SSG (static export), ან მნიშვნელოვანი კონტენტის <noscript> ბლოკში დუბლირება."
      )
    );
  } else if (rawHtmlThin && noscriptContent.length >= 200) {
    checks.push(
      check(
        "warn",
        "Server-Side Rendering",
        "გვერდი JS-ს საჭიროებს, მაგრამ <noscript> ბლოკი არსებობს - ნაწილობრივ ფარავს AI ბოტებს",
        "უკეთესია სრული SSR/SSG. <noscript>-ი ხშირად მხოლოდ მცირე fallback-ია, არა სრული კონტენტი."
      )
    );
  } else {
    checks.push(
      check(
        "pass",
        "Server-Side Rendering",
        "კონტენტი ხელმისაწვდომია JavaScript-ის გარეშე - AI კრაულერებისთვის ხილვადი ✓"
      )
    );
  }

  return { name: "GEO - Generative Engine", icon: "Bot", checks };
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SITEMAP_FALLBACK_PATHS = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
  "/wp-sitemap.xml",
  "/sitemaps.xml",
  "/sitemap1.xml",
];

async function fetchExtraFile(url: string): Promise<{
  ok: boolean;
  body: string;
  status: number;
} | null> {
  try {
    const res = await axios({
      url,
      method: "GET",
      timeout: FETCH_TIMEOUT,
      maxRedirects: 5,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/xml,application/xml,text/plain,text/html,*/*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9,ka;q=0.8",
      },
      validateStatus: () => true,
      responseType: "text",
      transformResponse: [(data) => data],
    });
    const body = typeof res.data === "string" ? res.data : "";
    return {
      ok: res.status >= 200 && res.status < 300 && body.length > 0,
      body,
      status: res.status,
    };
  } catch {
    return null;
  }
}

function extractSitemapsFromRobots(robotsBody: string): string[] {
  const matches: string[] = [];
  for (const line of robotsBody.split(/\r?\n/)) {
    const m = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
    if (m) matches.push(m[1].trim());
  }
  return matches;
}

async function checkHttpToHttpsRedirect(
  origin: string
): Promise<"ok" | "missing" | "n/a"> {
  if (!origin.startsWith("https://")) return "n/a";
  const httpUrl = origin.replace(/^https:/, "http:");
  try {
    const res = await axios.get(httpUrl, {
      timeout: 10000,
      maxRedirects: 0,
      headers: { "User-Agent": BROWSER_UA, Accept: "*/*" },
      validateStatus: () => true,
      transformResponse: [(data) => data],
    });
    if (res.status >= 300 && res.status < 400) {
      const location = String(res.headers["location"] ?? "");
      if (location.startsWith("https://")) return "ok";
    }
    if (res.status >= 200 && res.status < 300) return "missing";
    return "n/a";
  } catch {
    // ECONNREFUSED on http means no insecure listener - that's fine.
    return "n/a";
  }
}

export type SitemapStatus =
  | "verified" // fetched successfully, body looks like a sitemap
  | "declared-broken" // robots.txt declared a URL but it returned 4xx/5xx (not rate-limit)
  | "declared-unverified" // robots.txt declared but we couldn't verify (rate-limited)
  | "missing"; // no declaration + no fallback path responded ok

export interface ExtrasResult {
  robotsTxt: boolean;
  sitemap: boolean; // back-compat: true when verified or declared-unverified
  sitemapStatus: SitemapStatus;
  sitemapUrl: string | null;
  llmsTxt: boolean;
  httpToHttps: "ok" | "missing" | "n/a";
}

// Sitemap fetch with one retry - if the first attempt gets a rate-limit
// signal, wait a moment and try again. Distinguishes "definitely 404"
// from "couldn't verify because the host blocked us" so the check above
// can emit accurate guidance (fail vs warn).
async function fetchSitemap(
  url: string
): Promise<{ ok: boolean; status: number; rateLimited: boolean } | null> {
  const isRateLimited = (s: number) =>
    s === 429 || s === 503 || s === 508 || (s >= 520 && s <= 527);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1400));
    const result = await fetchExtraFile(url);
    if (!result) {
      if (attempt === 1) return null;
      continue;
    }
    if (result.ok) {
      // Sanity check - body should at least mention <urlset|<sitemapindex
      const looksLikeSitemap =
        /<urlset|<sitemapindex/i.test(result.body) || result.body.length > 50;
      return {
        ok: looksLikeSitemap,
        status: result.status,
        rateLimited: false,
      };
    }
    if (isRateLimited(result.status)) {
      if (attempt === 1) {
        return { ok: false, status: result.status, rateLimited: true };
      }
      continue;
    }
    // Definite non-200 (404, 403, 410, 500) - no retry needed
    return { ok: false, status: result.status, rateLimited: false };
  }
  return null;
}

export async function checkExtras(baseUrl: string): Promise<ExtrasResult> {
  const origin = new URL(baseUrl).origin;

  const [robots, llms, httpToHttps] = await Promise.all([
    fetchExtraFile(`${origin}/robots.txt`),
    fetchExtraFile(`${origin}/llms.txt`),
    checkHttpToHttpsRedirect(origin),
  ]);

  let sitemapStatus: SitemapStatus = "missing";
  let sitemapUrl: string | null = null;
  const declaredUrls: string[] = [];

  if (robots?.ok && robots.body) {
    declaredUrls.push(...extractSitemapsFromRobots(robots.body).slice(0, 3));
  }

  if (declaredUrls.length > 0) {
    // Walk each declared URL. Outcomes:
    //   - any verified → "verified"
    //   - all hit rate-limit → "declared-unverified" (couldn't verify)
    //   - any got a definite 4xx/5xx that wasn't rate-limit → "declared-broken"
    //     (overrides unverified - if owner-stated URL is genuinely 404,
    //     that's a real problem worth surfacing)
    let anyVerified = false;
    let anyBroken = false;
    let anyRateLimited = false;
    for (const url of declaredUrls) {
      const result = await fetchSitemap(url);
      if (!result) continue;
      if (result.ok) {
        anyVerified = true;
        sitemapUrl = url;
        break;
      }
      if (result.rateLimited) {
        anyRateLimited = true;
      } else {
        // 404 / 403 / 410 / 500 etc. - real broken URL
        anyBroken = true;
        sitemapUrl = url;
      }
    }
    if (anyVerified) sitemapStatus = "verified";
    else if (anyBroken) sitemapStatus = "declared-broken";
    else if (anyRateLimited) sitemapStatus = "declared-unverified";
  }

  if (sitemapStatus === "missing") {
    for (const path of SITEMAP_FALLBACK_PATHS) {
      const url = `${origin}${path}`;
      const result = await fetchSitemap(url);
      if (result?.ok) {
        sitemapStatus = "verified";
        sitemapUrl = url;
        break;
      }
      // Don't keep hammering a rate-limited host across many fallback
      // paths - stop after the first ambiguous signal.
      if (result?.rateLimited) break;
    }
  }

  return {
    robotsTxt: !!robots?.ok,
    sitemap: sitemapStatus === "verified" || sitemapStatus === "declared-unverified",
    sitemapStatus,
    sitemapUrl,
    llmsTxt: !!llms?.ok,
    httpToHttps,
  };
}

export async function fetchPageSpeed(url: string): Promise<CategoryResult> {
  const checks: CheckResult[] = [];
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    const data = res.data;
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse?.audits ?? {};
    const score = Math.round((lighthouse?.categories?.performance?.score ?? 0) * 100);

    if (score >= 90) {
      checks.push(check("pass", "Performance Score", `${score}/100 - შესანიშნავი`, undefined, score));
    } else if (score >= 50) {
      checks.push(check("warn", "Performance Score", `${score}/100 - საჭიროებს გაუმჯობესებას`, "ოპტიმიზაცია: სურათების შემცირება, JS-ის გაყოფა, კეშირება.", score));
    } else {
      checks.push(check("fail", "Performance Score", `${score}/100 - სუსტი`, "კრიტიკული ოპტიმიზაცია სჭირდება - სიჩქარე SEO რანკინგის ფაქტორია.", score));
    }

    const lcp = audits["largest-contentful-paint"]?.numericValue;
    if (lcp !== undefined) {
      const lcpSec = (lcp / 1000).toFixed(2);
      if (lcp < 2500) {
        checks.push(check("pass", "LCP (Largest Contentful Paint)", `${lcpSec}წ - კარგი ✓`, undefined, lcpSec));
      } else if (lcp < 4000) {
        checks.push(check("warn", "LCP (Largest Contentful Paint)", `${lcpSec}წ - საჭიროებს გაუმჯობესებას`, "ოპტიმალური <2.5წ. შეამცირეთ hero-სურათი, preload LCP-ისთვის.", lcpSec));
      } else {
        checks.push(check("fail", "LCP (Largest Contentful Paint)", `${lcpSec}წ - სუსტი`, "კრიტიკული - ოპტიმალური <2.5წ.", lcpSec));
      }
    }

    const cls = audits["cumulative-layout-shift"]?.numericValue;
    if (cls !== undefined) {
      const clsVal = cls.toFixed(3);
      if (cls < 0.1) {
        checks.push(check("pass", "CLS (Cumulative Layout Shift)", `${clsVal} - სტაბილური ✓`, undefined, clsVal));
      } else if (cls < 0.25) {
        checks.push(check("warn", "CLS (Cumulative Layout Shift)", `${clsVal} - საჭიროებს გაუმჯობესებას`, "ოპტიმალური <0.1. დავამატებთ width/height-ს სურათებზე და font-display: swap-ს.", clsVal));
      } else {
        checks.push(check("fail", "CLS (Cumulative Layout Shift)", `${clsVal} - არასტაბილური`, "კრიტიკული - ოპტიმალური <0.1.", clsVal));
      }
    }

    const tbt = audits["total-blocking-time"]?.numericValue;
    if (tbt !== undefined) {
      const tbtMs = Math.round(tbt);
      if (tbt < 200) {
        checks.push(check("pass", "TBT (Total Blocking Time)", `${tbtMs}ms - სწრაფი ✓`, undefined, tbtMs));
      } else if (tbt < 600) {
        checks.push(check("warn", "TBT (Total Blocking Time)", `${tbtMs}ms`, "INP-ის გაუმჯობესებისთვის: გაჰყავით JS, მოაცილეთ third-party.", tbtMs));
      } else {
        checks.push(check("fail", "TBT (Total Blocking Time)", `${tbtMs}ms - ნელი`, "კრიტიკული - გაჰყავით JS bundle-ები.", tbtMs));
      }
    }

    const fcp = audits["first-contentful-paint"]?.numericValue;
    if (fcp !== undefined) {
      const fcpSec = (fcp / 1000).toFixed(2);
      if (fcp < 1800) {
        checks.push(check("pass", "FCP (First Contentful Paint)", `${fcpSec}წ ✓`, undefined, fcpSec));
      } else if (fcp < 3000) {
        checks.push(check("warn", "FCP (First Contentful Paint)", `${fcpSec}წ`, "ოპტიმალური <1.8წ.", fcpSec));
      } else {
        checks.push(check("fail", "FCP (First Contentful Paint)", `${fcpSec}წ`, "სუსტი - ოპტიმალური <1.8წ.", fcpSec));
      }
    }

    const isMobile = audits.viewport?.score === 1;
    if (isMobile) {
      checks.push(check("pass", "Mobile Viewport", "viewport meta tag მითითებულია - mobile-friendly ✓"));
    } else {
      checks.push(check("fail", "Mobile Viewport", "viewport meta tag არ არის ან არასწორი", "დავამატებთ <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">-ს"));
    }
  } catch {
    checks.push(check("info", "PageSpeed Insights", "PageSpeed API მიუწვდომელია (anonymous limit ან network პრობლემა)", "სცადეთ მოგვიანებით - Google ანონიმური მოთხოვნები შეზღუდულია."));
  }

  return { name: "Performance (Core Web Vitals)", icon: "Zap", checks };
}

