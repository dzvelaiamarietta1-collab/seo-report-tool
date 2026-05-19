import type { MetadataRoute } from "next";

const SITE_URL = "https://seo-report-tool-pi.vercel.app";

// robots.txt — generated at build time via the Next.js metadata route.
// Allows all bots on the public surfaces and explicitly welcomes the
// 2026 AI crawlers (GPTBot / ClaudeBot / PerplexityBot) so the brand
// surfaces in AI-overview answers as well. Internal /api and /presentation
// endpoints get noindex since they're tool plumbing, not content pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/temp/"],
      },
      // Explicit allow for major AI crawlers — some sites blanket-ban
      // these by default. We want INFINITY's brand cited in AI answers.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
