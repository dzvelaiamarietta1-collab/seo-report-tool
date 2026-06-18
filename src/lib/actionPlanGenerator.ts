// Map audit check labels (the ones src/lib/checks.ts produces) onto
// action-plan task ids. When a check fires fail/warn the corresponding
// task is flagged as "site-detected" so the plan can highlight the
// work that addresses real problems on this specific domain.

const CHECK_TO_TASK_IDS: Record<string, string[]> = {
  // On-page basics
  "Title Tag": ["onpage-title-tags"],
  "Meta Description": ["onpage-meta-desc"],
  "H1 სათაური": ["onpage-headings"],
  "სათაურების იერარქია": ["onpage-headings"],
  "ALT ტექსტები": ["onpage-alt-text"],

  // Performance / Core Web Vitals
  "Image Format": ["perf-images"],
  "Lazy Loading": ["perf-lazy-loading"],
  LCP: ["perf-lcp"],
  INP: ["perf-inp"],
  CLS: ["perf-cls"],
  Performance: ["perf-lcp", "perf-inp", "perf-cls"],
  "Core Web Vitals": ["perf-lcp", "perf-inp", "perf-cls"],

  // Technical
  HTTPS: ["tech-https-audit", "tech-security-headers"],
  "robots.txt": ["tech-robots-txt"],
  "XML Sitemap": ["tech-sitemap"],
  "sitemap.xml": ["tech-sitemap"],
  "Canonical Tag": ["tech-canonicals"],
  hreflang: ["tech-hreflang"],
  "Security Headers": ["tech-security-headers"],
  "Server-Side Rendering": ["tech-mobile-first"],
  "Mobile-First": ["tech-mobile-first"],
  "Cache-Control": ["tech-cache-control"],
  "URL სტრუქტურა": ["tech-url-structure"],

  // Link health
  "გატეხილი ბმულები": ["tech-broken-links"],
  რედირექტები: ["tech-redirect-chains"],
  "llms.txt": [],

  // Social cards
  "Open Graph": ["onpage-meta-desc"],
  "Twitter Card": ["onpage-meta-desc"],

  // Schema
  "Organization Schema": ["schema-organization"],
  "Product Schema": ["schema-product"],
  "FAQ Schema": ["schema-faq"],
  "Article Schema": ["schema-article"],
  "Breadcrumb Schema": ["schema-breadcrumb"],
  "LocalBusiness Schema": ["schema-localbusiness"],
  Schema: ["schema-organization", "schema-breadcrumb"],
};

type CheckLike = { label?: unknown; status?: unknown };
type CategoryLike = { checks?: CheckLike[] };
type AnalysisLike = { categories?: Record<string, CategoryLike> };

export function detectTaskIdsFromAnalysis(
  analysis: AnalysisLike | null | undefined
): Set<string> {
  const detected = new Set<string>();
  if (!analysis?.categories) return detected;
  for (const cat of Object.values(analysis.categories)) {
    const checks = Array.isArray(cat?.checks) ? cat.checks : [];
    for (const check of checks) {
      if (check.status !== "fail" && check.status !== "warn") continue;
      const label = typeof check.label === "string" ? check.label : "";
      const ids = CHECK_TO_TASK_IDS[label] ?? [];
      for (const id of ids) detected.add(id);
    }
  }
  return detected;
}

export function countFailWarn(analysis: AnalysisLike | null | undefined): {
  fails: number;
  warns: number;
} {
  let fails = 0;
  let warns = 0;
  if (!analysis?.categories) return { fails, warns };
  for (const cat of Object.values(analysis.categories)) {
    const checks = Array.isArray(cat?.checks) ? cat.checks : [];
    for (const check of checks) {
      if (check.status === "fail") fails++;
      else if (check.status === "warn") warns++;
    }
  }
  return { fails, warns };
}
