import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 8s is enough for any sane image; we don't want to block other requests
// behind a slow upstream. PageSpeed/analyze have their own longer windows.
export const maxDuration = 10;

const ALLOWED_CONTENT_TYPES = /^image\//i;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — enough for any logo / OG image

// Proxies external image URLs so the browser fetches them via our own
// origin. Solves three things in one shot:
//   1. Hotlink protection — some sites (e.g. infinity.ge) return 403 when
//      Referer is foreign. Our server fetches without a Referer header.
//   2. Mixed content — http images load fine through our https origin.
//   3. CORS — only matters for canvas/ImageData, not <img>, but doesn't
//      hurt to keep it inside our origin.
//
// Safety: only http/https schemes, max 5MB body, must return image/* content
// type. No private-IP filtering yet — production deploys should put this
// behind an egress firewall if SSRF is in scope.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return new Response("invalid scheme", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.href, {
      // Explicitly omit Referer; some hosts hotlink-block based on it.
      // User-Agent matches the rest of the tool so logs are coherent.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOReportToolBot/0.1; +https://seo-report-tool.local)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });
  } catch {
    return new Response("upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("upstream status " + upstream.status, {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!ALLOWED_CONTENT_TYPES.test(contentType)) {
    return new Response("not an image", { status: 415 });
  }

  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return new Response("image too large", { status: 413 });
  }

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // 1 hour cache — enough that hot pages don't re-fetch, short enough
      // that re-analysing after a fix doesn't show stale assets.
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
