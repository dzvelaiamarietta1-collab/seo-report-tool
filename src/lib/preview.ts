import type { CheerioAPI } from "cheerio";
import axios from "axios";
import type {
  ImageProbe,
  PreviewData,
  ShareImageCheck,
  ShareImageVerdict,
} from "./types";

const PROBE_UA =
  "Mozilla/5.0 (compatible; SEOReportToolBot/0.1; +https://seo-report-tool.local)";
const PROBE_TIMEOUT = 5000;
const PROBE_MAX_BYTES = 65536;

function parseImageDimensions(buf: Buffer): ImageProbe | null {
  if (buf.length < 16) return null;

  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf.length >= 24
  ) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) {
      return { width, height, aspectRatio: width / height, format: "png" };
    }
  }

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const segLen = buf.readUInt16BE(offset + 2);
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) {
          return { width, height, aspectRatio: width / height, format: "jpeg" };
        }
      }
      offset += 2 + segLen;
    }
  }

  if (
    buf.length >= 30 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8 ") {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      if (width > 0 && height > 0) {
        return { width, height, aspectRatio: width / height, format: "webp" };
      }
    } else if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      const width = (b & 0x3fff) + 1;
      const height = ((b >> 14) & 0x3fff) + 1;
      return { width, height, aspectRatio: width / height, format: "webp" };
    } else if (chunk === "VP8X") {
      const width =
        ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) & 0xffffff) + 1;
      const height =
        ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) & 0xffffff) + 1;
      return { width, height, aspectRatio: width / height, format: "webp" };
    }
  }

  if (
    buf.length >= 10 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46
  ) {
    const width = buf.readUInt16LE(6);
    const height = buf.readUInt16LE(8);
    if (width > 0 && height > 0) {
      return { width, height, aspectRatio: width / height, format: "gif" };
    }
  }

  if (buf[0] === 0x3c) {
    const text = buf.toString("utf-8", 0, Math.min(4096, buf.length));
    if (/<svg/i.test(text)) {
      const widthMatch = text.match(/<svg[^>]*\swidth\s*=\s*["']([^"']+)["']/i);
      const heightMatch = text.match(
        /<svg[^>]*\sheight\s*=\s*["']([^"']+)["']/i
      );
      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        if (width > 0 && height > 0) {
          return {
            width,
            height,
            aspectRatio: width / height,
            format: "svg",
          };
        }
      }
      const viewBox = text.match(/<svg[^>]*\sviewBox\s*=\s*["']([^"']+)["']/i);
      if (viewBox) {
        const parts = viewBox[1].split(/[\s,]+/);
        if (parts.length === 4) {
          const width = parseFloat(parts[2]);
          const height = parseFloat(parts[3]);
          if (width > 0 && height > 0) {
            return {
              width,
              height,
              aspectRatio: width / height,
              format: "svg",
            };
          }
        }
      }
      return { width: 0, height: 0, aspectRatio: 1, format: "svg" };
    }
  }

  return null;
}

async function probeImage(url: string): Promise<ImageProbe | null> {
  if (!url) return null;
  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: PROBE_TIMEOUT,
      maxContentLength: PROBE_MAX_BYTES * 4,
      headers: {
        "User-Agent": PROBE_UA,
        Accept: "image/*",
        Range: `bytes=0-${PROBE_MAX_BYTES}`,
      },
      validateStatus: () => true,
      decompress: true,
    });
    if (res.status >= 400) return null;
    const buf = Buffer.from(res.data);
    const probe = parseImageDimensions(buf);
    if (probe) {
      const lengthHeader = res.headers["content-length"];
      const totalSize =
        typeof lengthHeader === "string"
          ? parseInt(lengthHeader, 10)
          : undefined;
      return {
        ...probe,
        sizeBytes: totalSize && !Number.isNaN(totalSize) ? totalSize : buf.length,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function classifyShareImage(
  url: string,
  probe: ImageProbe | null,
  faviconUrl: string
): { verdict: ShareImageVerdict; reason: string; recommendation?: string } {
  if (!url) {
    return {
      verdict: "missing",
      reason: "სურათი მითითებული არ არის.",
      recommendation:
        "დაამატეთ 1200×630px JPG/PNG სურათი ბრენდინგით — Facebook/LinkedIn/Twitter გაზიარებისთვის.",
    };
  }

  const lowerUrl = url.toLowerCase();
  const isFavicon = url === faviconUrl;
  const looksLikeLogoUrl =
    /\b(logo|icon|favicon)\b/.test(lowerUrl) ||
    /\bavatar\b/.test(lowerUrl) ||
    isFavicon;

  if (!probe) {
    if (looksLikeLogoUrl) {
      return {
        verdict: "warn",
        reason: "სურათის გადამოწმება ვერ მოხერხდა, მაგრამ URL ლოგოს ჰგავს.",
        recommendation:
          "გადაამოწმეთ — Facebook/Twitter ვერ აჩვენებენ ლოგოს სწორად share-ში. გამოიყენეთ ცალკე 1200×630px share-სურათი.",
      };
    }
    return {
      verdict: "unknown",
      reason: "სურათი ვერ მოიძებნა ან ხელმიუწვდომელია.",
      recommendation: "გადაამოწმეთ რომ URL სწორია და სურათი საჯაროა.",
    };
  }

  if (probe.format === "svg") {
    return {
      verdict: "fail",
      reason: "SVG ფორმატი — Facebook/Twitter არ უჭერენ მხარს share-სურათში.",
      recommendation:
        "გადააქცეთ JPG ან PNG ფორმატში, 1200×630px ზომით.",
    };
  }

  if (isFavicon) {
    return {
      verdict: "fail",
      reason: "ეს favicon-ია, არა share-სურათი.",
      recommendation:
        "შექმენით ცალკე 1200×630px JPG/PNG სურათი ბრენდინგით.",
    };
  }

  if (probe.width === 0 || probe.height === 0) {
    return {
      verdict: "warn",
      reason: "სურათის ზომები ვერ წავიკითხეთ.",
    };
  }

  const ar = probe.aspectRatio;
  const isSquareLike = ar >= 0.85 && ar <= 1.15;
  const isTooSmall = probe.width < 600 || probe.height < 315;
  const isWrongRatio = ar < 1.5 || ar > 2.5;

  if (isSquareLike) {
    return {
      verdict: "fail",
      reason: `სურათი თითქმის კვადრატულია (${probe.width}×${probe.height}) — სავარაუდოდ ლოგოა.`,
      recommendation:
        "Facebook/Twitter share-სურათი 1.91:1 (1200×630px). კვადრატული ლოგო ცუდად გამოიყურება feed-ში.",
    };
  }

  if (isTooSmall) {
    return {
      verdict: "fail",
      reason: `სურათი ძალიან პატარაა (${probe.width}×${probe.height}).`,
      recommendation:
        "მინიმუმი — 600×315px. რეკომენდებული — 1200×630px.",
    };
  }

  if (looksLikeLogoUrl) {
    return {
      verdict: "warn",
      reason: `URL მიგვითითებს, რომ ეს ლოგოა (${probe.width}×${probe.height}).`,
      recommendation:
        "ჩანაცვლეთ ცალკე share-სურათით ბრენდინგით — სათაური + ლოგო + ფონი.",
    };
  }

  if (isWrongRatio) {
    return {
      verdict: "warn",
      reason: `Aspect ratio ${ar.toFixed(2)}:1 — Facebook/Twitter ფიდში ცუდად ჩნდება.`,
      recommendation: "რეკომენდებული 1.91:1 (1200×630px).",
    };
  }

  return {
    verdict: "good",
    reason: `${probe.width}×${probe.height} (${probe.format.toUpperCase()})`,
  };
}

// Parses a `sizes` attribute like "180x180" or "16x16 32x32 192x192" and
// returns the largest declared width. Returns 0 if nothing parseable.
function parseSizesAttr(sizes: string | undefined | null): number {
  if (!sizes) return 0;
  let max = 0;
  for (const match of sizes.matchAll(/(\d+)\s*[xX]\s*(\d+)/g)) {
    const w = parseInt(match[1], 10);
    if (w > max) max = w;
  }
  return max;
}

// Ranked search for the best high-res logo source. Used by the
// presentation cover slide, which scales whatever we return up to
// ~290px wide — so a 32×32 favicon looks blurry there. Order matters:
//   1. apple-touch-icon (typically 180×180, sometimes larger)
//   2. <link rel="icon"> with a usable sizes attribute, biggest first
//   3. JSON-LD Organization.logo
//   4. body <img> with "logo" in src/alt/class — last-resort heuristic
//      that catches sites like agroit.ge which have no head icon tags
//      at all but render their brand mark as a regular <img>.
// SVG icons are treated as effectively infinite resolution.
function findBestLogo(
  $: CheerioAPI,
  resolve: (raw: string) => string
): string | undefined {
  type Candidate = { href: string; size: number };
  const candidates: Candidate[] = [];

  $(
    'link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
  ).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const size = parseSizesAttr($(el).attr("sizes")) || 180;
    candidates.push({ href: resolve(href), size });
  });

  $('link[rel="icon"], link[rel="shortcut icon"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const sizesAttr = $(el).attr("sizes");
    let size = parseSizesAttr(sizesAttr);
    if (!size) {
      const isSvg =
        /\.svg(\?|$)/i.test(href) ||
        sizesAttr === "any" ||
        $(el).attr("type") === "image/svg+xml";
      size = isSvg ? 1024 : 0;
    }
    if (size >= 96) candidates.push({ href: resolve(href), size });
  });

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed: unknown = JSON.parse($(el).text() || "null");
      const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const raw of list) {
        if (!raw || typeof raw !== "object") continue;
        const item = raw as Record<string, unknown>;
        const type = item["@type"];
        const types: unknown[] = Array.isArray(type) ? type : [type];
        const isOrg = types.some(
          (t) =>
            typeof t === "string" && /Organization|LocalBusiness/i.test(t)
        );
        if (!isOrg) continue;
        const logo = item.logo;
        let url: string | undefined;
        if (typeof logo === "string") {
          url = logo;
        } else if (logo && typeof logo === "object") {
          const inner = (logo as Record<string, unknown>).url;
          if (typeof inner === "string") url = inner;
        }
        if (url) candidates.push({ href: resolve(url), size: 512 });
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  $("img").each((_, el) => {
    const $img = $(el);
    const src = $img.attr("src") || $img.attr("data-src") || "";
    if (!src) return;
    const alt = ($img.attr("alt") || "").toLowerCase();
    const cls = ($img.attr("class") || "").toLowerCase();
    const lowerSrc = src.toLowerCase();
    const looksLikeLogo =
      /\blogo\b/.test(lowerSrc) ||
      /\blogo\b/.test(alt) ||
      /\blogo\b/.test(cls);
    if (!looksLikeLogo) return;
    // Body images don't expose dimensions reliably from HTML alone; assume
    // a modest 200px so we still prefer apple-touch-icon (180) when both
    // are present but beat a bare 32px favicon.
    candidates.push({ href: resolve(src), size: 200 });
  });

  if (candidates.length === 0) return undefined;

  const byHref = new Map<string, number>();
  for (const c of candidates) {
    const prev = byHref.get(c.href) ?? 0;
    if (c.size > prev) byHref.set(c.href, c.size);
  }
  const sorted = [...byHref.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

export async function extractPreview(
  $: CheerioAPI,
  baseUrl: string
): Promise<PreviewData> {
  const meta = (
    name: string,
    attr: "name" | "property" = "name"
  ): string => $(`meta[${attr}="${name}"]`).attr("content")?.trim() ?? "";

  const resolve = (raw: string): string => {
    if (!raw) return "";
    try {
      return new URL(raw, baseUrl).href;
    } catch {
      return raw;
    }
  };

  let origin = baseUrl;
  let hostname = "";
  let pathname = "/";
  try {
    const u = new URL(baseUrl);
    origin = u.origin;
    hostname = u.host;
    pathname = u.pathname;
  } catch {
    // ignore
  }

  const linkIcon =
    $('link[rel="icon"]').attr("href") ??
    $('link[rel="shortcut icon"]').attr("href") ??
    $('link[rel="apple-touch-icon"]').attr("href") ??
    "";
  const favicon = linkIcon ? resolve(linkIcon) : `${origin}/favicon.ico`;
  const siteLogo = findBestLogo($, resolve);

  const ogImage = resolve(meta("og:image", "property"));
  const twitterImage = resolve(meta("twitter:image"));

  const sameImage = ogImage && ogImage === twitterImage;
  const [ogProbe, twitterProbe] = await Promise.all([
    ogImage ? probeImage(ogImage) : Promise.resolve(null),
    twitterImage && !sameImage
      ? probeImage(twitterImage)
      : Promise.resolve(null),
  ]);

  const resolvedTwitterProbe = sameImage ? ogProbe : twitterProbe;

  const ogVerdict = classifyShareImage(ogImage, ogProbe, favicon);
  const twitterVerdict = classifyShareImage(
    twitterImage,
    resolvedTwitterProbe,
    favicon
  );

  const ogImageCheck: ShareImageCheck = {
    url: ogImage,
    probe: ogProbe,
    ...ogVerdict,
  };
  const twitterImageCheck: ShareImageCheck = {
    url: twitterImage,
    probe: resolvedTwitterProbe,
    ...twitterVerdict,
  };

  return {
    title: $("title").first().text().trim(),
    description: meta("description"),
    canonical: $('link[rel="canonical"]').attr("href")?.trim() ?? baseUrl,
    favicon,
    siteLogo,
    hostname,
    pathname,
    og: {
      title: meta("og:title", "property"),
      description: meta("og:description", "property"),
      image: ogImage,
      url: meta("og:url", "property"),
      type: meta("og:type", "property"),
      siteName: meta("og:site_name", "property"),
    },
    twitter: {
      card: meta("twitter:card"),
      title: meta("twitter:title"),
      description: meta("twitter:description"),
      image: twitterImage,
      site: meta("twitter:site"),
    },
    ogImageCheck,
    twitterImageCheck,
  };
}
