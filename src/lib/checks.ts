import * as cheerio from "cheerio";
import axios, { AxiosResponse } from "axios";
import type { CheckResult, CategoryResult, AnalysisResult, BotProtection } from "./types";
import { fetchPageWithBrowser } from "./browser";

const UA =
  "Mozilla/5.0 (compatible; SEOReportToolBot/0.1; +https://seo-report-tool.local)";
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
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
      validateStatus: () => true,
      responseType: "text",
      transformResponse: [(data) => data],
    });
  } catch {
    return null;
  }
}

export async function fetchPage(url: string): Promise<{
  html: string;
  status: number;
  headers: Record<string, string>;
  finalUrl: string;
  responseTimeMs: number;
} | null> {
  const browserResult = await fetchPageWithBrowser(url);
  if (browserResult) {
    return {
      html: browserResult.html,
      status: browserResult.status,
      headers: Object.fromEntries(
        Object.entries(browserResult.headers).map(([k, v]) => [
          k.toLowerCase(),
          String(v),
        ])
      ),
      finalUrl: browserResult.finalUrl,
      responseTimeMs: browserResult.responseTimeMs,
    };
  }

  const start = Date.now();
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  return {
    html: typeof res.data === "string" ? res.data : "",
    status: res.status,
    headers: Object.fromEntries(
      Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), String(v)])
    ),
    finalUrl: res.request?.res?.responseUrl ?? url,
    responseTimeMs: Date.now() - start,
  };
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
  extras: { robotsTxt: boolean; sitemap: boolean; llmsTxt: boolean }
): CategoryResult {
  const checks: CheckResult[] = [];
  const isHttps = url.startsWith("https://");

  checks.push(
    isHttps
      ? check("pass", "HTTPS", "საიტი იყენებს HTTPS-ს — დაცული კავშირი ✓")
      : check(
          "fail",
          "HTTPS",
          "საიტი არ იყენებს HTTPS-ს",
          "გადაიყვანეთ საიტი HTTPS-ზე SSL სერტიფიკატით — Google-ის რანკინგისთვის აუცილებელია."
        )
  );

  if (status >= 200 && status < 300) {
    checks.push(check("pass", "HTTP სტატუსი", `მთავარი გვერდი აბრუნებს ${status} OK`, undefined, status));
  } else if (status >= 300 && status < 400) {
    checks.push(check("warn", "HTTP სტატუსი", `მთავარი გვერდი აბრუნებს ${status} (რედირექტი)`, "შეამოწმეთ რედირექტების ჯაჭვი — ზედმეტი hop-ები ანელებს საიტს.", status));
  } else {
    checks.push(check("fail", "HTTP სტატუსი", `მთავარი გვერდი აბრუნებს ${status}`, "გვერდი არ არის ხელმისაწვდომი — Google ვერ ინდექსაციას უკეთებს.", status));
  }

  checks.push(
    extras.robotsTxt
      ? check("pass", "robots.txt", "robots.txt ფაილი არსებობს ✓")
      : check("warn", "robots.txt", "robots.txt ფაილი ვერ მოიძებნა", "შექმენით /robots.txt ფაილი crawler-ების სამართავად.")
  );

  checks.push(
    extras.sitemap
      ? check("pass", "XML Sitemap", "sitemap.xml ფაილი არსებობს ✓")
      : check("warn", "XML Sitemap", "sitemap.xml ფაილი ვერ მოიძებნა", "შექმენით XML sitemap და დაარეგისტრირეთ Google Search Console-ში.")
  );

  const canonical = $('link[rel="canonical"]').attr("href");
  checks.push(
    canonical
      ? check("pass", "Canonical Tag", `Canonical tag მითითებულია: ${canonical}`, undefined, canonical)
      : check("warn", "Canonical Tag", "Canonical tag არ არის მითითებული", "დაამატეთ <link rel=\"canonical\"> დუბლირებული კონტენტის თავიდან ასაცილებლად.")
  );

  const metaRobots = $('meta[name="robots"]').attr("content");
  if (metaRobots) {
    if (/noindex/i.test(metaRobots)) {
      checks.push(check("fail", "Meta Robots", `noindex მითითებულია: "${metaRobots}"`, "მთავარ გვერდზე noindex Google-ს უკრძალავს ინდექსაციას — გადახედეთ.", metaRobots));
    } else {
      checks.push(check("pass", "Meta Robots", `Meta robots: "${metaRobots}"`, undefined, metaRobots));
    }
  } else {
    checks.push(check("info", "Meta Robots", "Meta robots tag არ არის — ნაგულისხმევად index, follow"));
  }

  const hasCSP = !!headers["content-security-policy"];
  const hasXFO = !!headers["x-frame-options"];
  const hasHSTS = !!headers["strict-transport-security"];
  const headersFound = [hasCSP && "CSP", hasXFO && "X-Frame-Options", hasHSTS && "HSTS"].filter(Boolean) as string[];
  if (headersFound.length >= 2) {
    checks.push(check("pass", "Security Headers", `მითითებულია: ${headersFound.join(", ")}`, undefined, headersFound));
  } else if (headersFound.length === 1) {
    checks.push(check("warn", "Security Headers", `მხოლოდ ${headersFound[0]} მითითებულია`, "დაამატეთ Content-Security-Policy, X-Frame-Options და Strict-Transport-Security headers."));
  } else {
    checks.push(check("warn", "Security Headers", "უსაფრთხოების headers ვერ მოიძებნა", "კონფიგურაცია გააკეთეთ სერვერზე CSP, X-Frame-Options, HSTS-სთვის."));
  }

  const hreflangs = $('link[rel="alternate"][hreflang]').map((_, el) => $(el).attr("hreflang")).get();
  if (hreflangs.length > 0) {
    checks.push(check("pass", "hreflang", `${hreflangs.length} hreflang მითითება ნაპოვნია`, undefined, hreflangs));
  } else {
    checks.push(check("info", "hreflang", "hreflang teag-ები არ არის (მხოლოდ ერთენოვანი საიტისთვის ნორმალურია)"));
  }

  return { name: "ტექნიკური SEO", icon: "Wrench", checks };
}

export function analyzeOnPage($: cheerio.CheerioAPI, baseUrl: string): CategoryResult {
  const checks: CheckResult[] = [];

  const title = $("title").first().text().trim();
  if (!title) {
    checks.push(check("fail", "Title Tag", "Title არ არსებობს", "დაამატეთ <title> tag — SEO-სთვის კრიტიკულია."));
  } else if (title.length < 30) {
    checks.push(check("warn", "Title Tag", `Title ძალიან მოკლეა (${title.length} სიმბ.): "${title}"`, "ოპტიმალური სიგრძე 50-60 სიმბოლოა.", title));
  } else if (title.length > 60) {
    checks.push(check("warn", "Title Tag", `Title ძალიან გრძელია (${title.length} სიმბ.): "${title}"`, "Google ჩამოაჭრის — შეამცირეთ 50-60 სიმბოლომდე.", title));
  } else {
    checks.push(check("pass", "Title Tag", `Title ოპტიმალური სიგრძისაა (${title.length} სიმბ.): "${title}"`, undefined, title));
  }

  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!desc) {
    checks.push(check("fail", "Meta Description", "Meta description არ არსებობს", "დაამატეთ <meta name=\"description\"> 140-160 სიმბოლოთი — CTR-ზე გავლენას ახდენს."));
  } else if (desc.length < 100) {
    checks.push(check("warn", "Meta Description", `Description ძალიან მოკლეა (${desc.length} სიმბ.)`, "ოპტიმალური სიგრძე 140-160 სიმბოლოა.", desc));
  } else if (desc.length > 160) {
    checks.push(check("warn", "Meta Description", `Description ძალიან გრძელია (${desc.length} სიმბ.)`, "Google ჩამოაჭრის 160 სიმბოლოზე — შეამცირეთ.", desc));
  } else {
    checks.push(check("pass", "Meta Description", `Description ოპტიმალური სიგრძისაა (${desc.length} სიმბ.)`, undefined, desc));
  }

  const h1Count = $("h1").length;
  const h1Text = $("h1").first().text().trim();
  if (h1Count === 0) {
    checks.push(check("fail", "H1 სათაური", "H1 tag არ არსებობს", "დაამატეთ ერთი H1 — გვერდის მთავარი სათაური."));
  } else if (h1Count > 1) {
    checks.push(check("warn", "H1 სათაური", `${h1Count} H1 ნაპოვნია — უნდა იყოს მხოლოდ ერთი`, "გვერდზე მხოლოდ ერთი H1 უნდა იყოს — დანარჩენები გადააქციეთ H2-ად.", h1Count));
  } else {
    checks.push(check("pass", "H1 სათაური", `H1 ერთია: "${h1Text}"`, undefined, h1Text));
  }

  const h2 = $("h2").length;
  const h3 = $("h3").length;
  const h4 = $("h4").length;
  const headingStructure = `H2: ${h2}, H3: ${h3}, H4: ${h4}`;
  if (h2 === 0 && h3 === 0) {
    checks.push(check("warn", "სათაურების იერარქია", "H2-H6 სათაურები არ არის", "დაამატეთ ქვესათაურები კონტენტის სტრუქტურირებისთვის."));
  } else {
    checks.push(check("pass", "სათაურების იერარქია", headingStructure, undefined, headingStructure));
  }

  const allImages = $("img");
  let totalImages = 0;
  let withAlt = 0;
  let withoutAlt = 0;
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
    if (alt !== undefined) {
      withAlt++;
    } else {
      withoutAlt++;
      if (missingAltSrcs.length < 5) missingAltSrcs.push(src);
    }
    const loading = $el.attr("loading");
    if (loading === "lazy") lazyImages++;
    if (/\.(webp|avif)(\?|$)/i.test(src)) modernFormat++;
  });

  const isLikelyJsRendered = totalImages > 0 && totalImages < 8;
  const jsNote = isLikelyJsRendered
    ? " (HTML-ში მოცემულ სურათებზე — JavaScript-ით დატვირთული სურათები არ ჩანს ბოტებისთვის)"
    : "";

  if (totalImages === 0) {
    checks.push(
      check(
        "info",
        "ALT ტექსტები",
        "HTML-ში სურათები არ მოიძებნა — შესაძლოა საიტი JavaScript-ით ხატავს კონტენტს, რასაც ჩვენი სკანერი ვერ ხედავს."
      )
    );
  } else if (withoutAlt === 0) {
    checks.push(
      check(
        "pass",
        "ALT ტექსტები",
        `ყველა ${totalImages} სურათს აქვს ALT ატრიბუტი ✓${jsNote}`,
        undefined,
        `${withAlt}/${totalImages}`
      )
    );
  } else if (withoutAlt / totalImages > 0.5) {
    checks.push(
      check(
        "fail",
        "ALT ტექსტები",
        `${withoutAlt}/${totalImages} სურათს არ აქვს alt ატრიბუტი${jsNote}.`,
        "დაამატეთ აღწერითი ALT ტექსტი — accessibility + SEO. დეკორატიული სურათებისთვის გამოიყენეთ alt=\"\" (ცარიელი).",
        missingAltSrcs.length > 0
          ? missingAltSrcs.map((s) => s.length > 80 ? s.slice(0, 80) + "…" : s)
          : `${withAlt}/${totalImages}`
      )
    );
  } else {
    checks.push(
      check(
        "warn",
        "ALT ტექსტები",
        `${withoutAlt}/${totalImages} სურათს არ აქვს alt ატრიბუტი${jsNote}.`,
        "შეავსეთ დარჩენილი ALT-ები. დეკორატიული სურათებისთვის გამოიყენეთ alt=\"\" (ცარიელი).",
        missingAltSrcs.length > 0
          ? missingAltSrcs.map((s) => s.length > 80 ? s.slice(0, 80) + "…" : s)
          : `${withAlt}/${totalImages}`
      )
    );
  }

  if (totalImages > 0) {
    if (lazyImages / totalImages > 0.5) {
      checks.push(check("pass", "Lazy Loading", `${lazyImages}/${totalImages} სურათი იყენებს lazy loading-ს`, undefined, `${lazyImages}/${totalImages}`));
    } else {
      checks.push(check("warn", "Lazy Loading", `მხოლოდ ${lazyImages}/${totalImages} სურათი lazy load-ით${jsNote}`, "დაამატეთ loading=\"lazy\" below-the-fold სურათებისთვის (LCP-ის გარდა).", `${lazyImages}/${totalImages}`));
    }
    if (modernFormat / totalImages > 0.3) {
      checks.push(check("pass", "Image Format", `${modernFormat}/${totalImages} თანამედროვე ფორმატში (WebP/AVIF)`, undefined, `${modernFormat}/${totalImages}`));
    } else {
      checks.push(check("warn", "Image Format", `${modernFormat}/${totalImages} მხოლოდ WebP/AVIF-ში`, "გადაიყვანეთ JPG/PNG WebP-ში — 30-50% უფრო მცირე ზომა."));
    }
  }

  let internal = 0;
  let external = 0;
  let host = "";
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    host = "";
  }
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const full = new URL(href, baseUrl);
      if (full.hostname === host) internal++;
      else external++;
    } catch {
      // ignore malformed
    }
  });

  if (internal < 3) {
    checks.push(check("warn", "შიდა ბმულები", `მხოლოდ ${internal} შიდა ბმული`, "დაამატეთ შიდა ბმულები სტრუქტურისა და topical authority-სთვის."));
  } else {
    checks.push(check("pass", "შიდა ბმულები", `${internal} შიდა ბმული`, undefined, internal));
  }

  if (external === 0) {
    checks.push(check("info", "გარე ბმულები", "გარე ბმულები არ არის", "ავტორიტეტულ წყაროებზე ბმულები ნდობას ზრდის."));
  } else {
    checks.push(check("pass", "გარე ბმულები", `${external} გარე ბმული`, undefined, external));
  }

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(" ").filter((w) => w.length > 1).length;
  if (wordCount < 300) {
    checks.push(check("warn", "კონტენტის მოცულობა", `${wordCount} სიტყვა — ცოტაა`, "მინიმუმ 600-1000 სიტყვა, იდეალურად 1500+.", wordCount));
  } else if (wordCount < 600) {
    checks.push(check("warn", "კონტენტის მოცულობა", `${wordCount} სიტყვა`, "ვრცელი კონტენტი (1500+ სიტყვა) ფრიად გაგიადვილებთ რანკინგს კონკურენტულ keyword-ებზე.", wordCount));
  } else {
    checks.push(check("pass", "კონტენტის მოცულობა", `${wordCount} სიტყვა`, undefined, wordCount));
  }

  return { name: "On-Page SEO", icon: "FileText", checks };
}

export function analyzeSchema($: cheerio.CheerioAPI): CategoryResult {
  const checks: CheckResult[] = [];

  const jsonLdScripts = $('script[type="application/ld+json"]');
  const types: string[] = [];
  jsonLdScripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "{}");
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item && typeof item === "object") {
          if (item["@type"]) {
            const t = Array.isArray(item["@type"]) ? item["@type"].join(", ") : item["@type"];
            types.push(t);
          }
          if (item["@graph"] && Array.isArray(item["@graph"])) {
            for (const g of item["@graph"]) {
              if (g["@type"]) {
                const t = Array.isArray(g["@type"]) ? g["@type"].join(", ") : g["@type"];
                types.push(t);
              }
            }
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  if (jsonLdScripts.length === 0) {
    checks.push(check("warn", "Schema Markup (JSON-LD)", "JSON-LD სტრუქტურირებული მონაცემები ვერ მოიძებნა", "დაამატეთ JSON-LD: Organization, Article, Product, FAQ — AI Overviews-ისთვის კრიტიკულია 2026-ში."));
  } else {
    checks.push(check("pass", "Schema Markup (JSON-LD)", `${jsonLdScripts.length} JSON-LD ბლოკი, ტიპები: ${types.join(", ") || "უცნობი"}`, undefined, types));
  }

  const ogProps = ["og:title", "og:description", "og:image", "og:url", "og:type"];
  const foundOg = ogProps.filter((p) => $(`meta[property="${p}"]`).length > 0);
  if (foundOg.length >= 4) {
    checks.push(check("pass", "Open Graph", `${foundOg.length}/${ogProps.length} OG tag მითითებულია`, undefined, foundOg));
  } else if (foundOg.length > 0) {
    checks.push(check("warn", "Open Graph", `მხოლოდ ${foundOg.length}/${ogProps.length} OG tag`, "დაამატეთ ყველა Open Graph tag სოციალური მედიის სანახავად."));
  } else {
    checks.push(check("warn", "Open Graph", "Open Graph tags არ არის", "დაამატეთ og:title, og:description, og:image — Facebook/LinkedIn გაზიარებისთვის."));
  }

  const twitterCard = $('meta[name="twitter:card"]').attr("content");
  if (twitterCard) {
    checks.push(check("pass", "Twitter Card", `Twitter Card: ${twitterCard}`, undefined, twitterCard));
  } else {
    checks.push(check("info", "Twitter Card", "Twitter Card არ არის", "დაამატეთ თუ Twitter/X-ზე ვიზიტორებს ელოდებით."));
  }

  return { name: "Schema & სოც.მედია", icon: "Tag", checks };
}

export function analyzeAiEra($: cheerio.CheerioAPI, llmsTxt: boolean): CategoryResult {
  const checks: CheckResult[] = [];

  checks.push(
    llmsTxt
      ? check("pass", "llms.txt", "llms.txt ფაილი არსებობს — AI კრაულერებისთვის მზადაა ✓")
      : check("warn", "llms.txt", "llms.txt ფაილი ვერ მოიძებნა", "შექმენით /llms.txt — ChatGPT, Claude, Perplexity-სთვის ახალი 2026 სტანდარტი.")
  );

  const faqSchema = $('script[type="application/ld+json"]').toArray().some((el) => {
    try {
      const data = JSON.parse($(el).html() ?? "{}");
      const items = Array.isArray(data) ? data : [data];
      return items.some((it) => it["@type"] === "FAQPage" || (it["@graph"] && it["@graph"].some?.((g: { "@type"?: string }) => g["@type"] === "FAQPage")));
    } catch {
      return false;
    }
  });

  checks.push(
    faqSchema
      ? check("pass", "FAQ Schema", "FAQPage schema ნაპოვნია — AI Overviews-ისთვის ღონიერი სიგნალი ✓")
      : check("info", "FAQ Schema", "FAQPage schema არ არის", "თუ გვერდზე კითხვა-პასუხია, FAQ schema მნიშვნელოვნად ზრდის AI Overviews-ში გამოჩენის შანსს.")
  );

  const orgSchema = $('script[type="application/ld+json"]').toArray().some((el) => {
    try {
      const data = JSON.parse($(el).html() ?? "{}");
      const items = Array.isArray(data) ? data : [data];
      return items.some((it) => it["@type"] === "Organization" || (it["@graph"] && it["@graph"].some?.((g: { "@type"?: string }) => g["@type"] === "Organization")));
    } catch {
      return false;
    }
  });

  checks.push(
    orgSchema
      ? check("pass", "Organization Schema", "Organization schema მითითებულია — ბრენდის ცნობადობა AI-სთვის ✓")
      : check("warn", "Organization Schema", "Organization schema არ არის", "დაამატეთ Organization schema sameAs ლინკებით სოც.მედიასა და Wikipedia-ზე.")
  );

  const noscriptContent = $("noscript").text().trim();
  const bodyTextLength = $("body").text().replace(/\s+/g, " ").trim().length;
  if (bodyTextLength < 500 && noscriptContent.length < 100) {
    checks.push(check("warn", "Server-Side Rendering", "გვერდი ცარიელი ჩანს server-რენდერში", "AI კრაულერები (ChatGPT, Claude, Perplexity) JavaScript-ს არ ასრულებენ — გამოიყენეთ SSR/SSG."));
  } else {
    checks.push(check("pass", "Server-Side Rendering", "კონტენტი ხელმისაწვდომია server-რენდერში — AI-სთვის ხილვადი ✓"));
  }

  return { name: "GEO — Generative Engine", icon: "Bot", checks };
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

export async function checkExtras(baseUrl: string): Promise<{
  robotsTxt: boolean;
  sitemap: boolean;
  llmsTxt: boolean;
}> {
  const origin = new URL(baseUrl).origin;

  const [robots, llms] = await Promise.all([
    fetchExtraFile(`${origin}/robots.txt`),
    fetchExtraFile(`${origin}/llms.txt`),
  ]);

  let sitemapFound = false;

  if (robots?.ok && robots.body) {
    const sitemapsInRobots = extractSitemapsFromRobots(robots.body);
    for (const url of sitemapsInRobots.slice(0, 3)) {
      const result = await fetchExtraFile(url);
      if (result?.ok) {
        sitemapFound = true;
        break;
      }
    }
  }

  if (!sitemapFound) {
    for (const path of SITEMAP_FALLBACK_PATHS) {
      const result = await fetchExtraFile(`${origin}${path}`);
      if (result?.ok) {
        sitemapFound = true;
        break;
      }
    }
  }

  return {
    robotsTxt: !!robots?.ok,
    sitemap: sitemapFound,
    llmsTxt: !!llms?.ok,
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
      checks.push(check("pass", "Performance Score", `${score}/100 — შესანიშნავი`, undefined, score));
    } else if (score >= 50) {
      checks.push(check("warn", "Performance Score", `${score}/100 — საჭიროებს გაუმჯობესებას`, "ოპტიმიზაცია: სურათების შემცირება, JS-ის გაყოფა, კეშირება.", score));
    } else {
      checks.push(check("fail", "Performance Score", `${score}/100 — სუსტი`, "კრიტიკული ოპტიმიზაცია სჭირდება — სიჩქარე SEO რანკინგის ფაქტორია.", score));
    }

    const lcp = audits["largest-contentful-paint"]?.numericValue;
    if (lcp !== undefined) {
      const lcpSec = (lcp / 1000).toFixed(2);
      if (lcp < 2500) {
        checks.push(check("pass", "LCP (Largest Contentful Paint)", `${lcpSec}წ — კარგი ✓`, undefined, lcpSec));
      } else if (lcp < 4000) {
        checks.push(check("warn", "LCP (Largest Contentful Paint)", `${lcpSec}წ — საჭიროებს გაუმჯობესებას`, "ოპტიმალური <2.5წ. შეამცირეთ hero-სურათი, preload LCP-ისთვის.", lcpSec));
      } else {
        checks.push(check("fail", "LCP (Largest Contentful Paint)", `${lcpSec}წ — სუსტი`, "კრიტიკული — ოპტიმალური <2.5წ.", lcpSec));
      }
    }

    const cls = audits["cumulative-layout-shift"]?.numericValue;
    if (cls !== undefined) {
      const clsVal = cls.toFixed(3);
      if (cls < 0.1) {
        checks.push(check("pass", "CLS (Cumulative Layout Shift)", `${clsVal} — სტაბილური ✓`, undefined, clsVal));
      } else if (cls < 0.25) {
        checks.push(check("warn", "CLS (Cumulative Layout Shift)", `${clsVal} — საჭიროებს გაუმჯობესებას`, "ოპტიმალური <0.1. დაამატეთ width/height სურათებზე, font-display: swap.", clsVal));
      } else {
        checks.push(check("fail", "CLS (Cumulative Layout Shift)", `${clsVal} — არასტაბილური`, "კრიტიკული — ოპტიმალური <0.1.", clsVal));
      }
    }

    const tbt = audits["total-blocking-time"]?.numericValue;
    if (tbt !== undefined) {
      const tbtMs = Math.round(tbt);
      if (tbt < 200) {
        checks.push(check("pass", "TBT (Total Blocking Time)", `${tbtMs}ms — სწრაფი ✓`, undefined, tbtMs));
      } else if (tbt < 600) {
        checks.push(check("warn", "TBT (Total Blocking Time)", `${tbtMs}ms`, "INP-ის გაუმჯობესებისთვის: გაჰყავით JS, მოაცილეთ third-party.", tbtMs));
      } else {
        checks.push(check("fail", "TBT (Total Blocking Time)", `${tbtMs}ms — ნელი`, "კრიტიკული — გაჰყავით JS bundle-ები.", tbtMs));
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
        checks.push(check("fail", "FCP (First Contentful Paint)", `${fcpSec}წ`, "სუსტი — ოპტიმალური <1.8წ.", fcpSec));
      }
    }

    const isMobile = audits.viewport?.score === 1;
    if (isMobile) {
      checks.push(check("pass", "Mobile Viewport", "viewport meta tag მითითებულია — mobile-friendly ✓"));
    } else {
      checks.push(check("fail", "Mobile Viewport", "viewport meta tag არ არის ან არასწორი", "დაამატეთ <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"));
    }
  } catch {
    checks.push(check("info", "PageSpeed Insights", "PageSpeed API მიუწვდომელია (anonymous limit ან network პრობლემა)", "სცადეთ მოგვიანებით — Google ანონიმური მოთხოვნები შეზღუდულია."));
  }

  return { name: "Performance (Core Web Vitals)", icon: "Zap", checks };
}

export function calculateSummary(result: AnalysisResult): AnalysisResult["summary"] {
  let passed = 0;
  let warnings = 0;
  let failed = 0;
  let total = 0;

  for (const cat of Object.values(result.categories)) {
    for (const c of cat.checks) {
      if (c.status === "info") continue;
      total++;
      if (c.status === "pass") passed++;
      else if (c.status === "warn") warnings++;
      else if (c.status === "fail") failed++;
    }
  }

  const score = total === 0 ? 0 : Math.round(((passed + warnings * 0.5) / total) * 100);
  return { score, passed, warnings, failed, totalChecks: total };
}
