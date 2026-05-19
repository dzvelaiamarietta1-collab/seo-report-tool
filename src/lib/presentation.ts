import type {
  AnalysisResult,
  CategoryKey,
  CategoryResult,
  CheckResult,
  PageReport,
  PreviewData,
} from "./types";
import { CHECK_IMPACT, CHECK_SEO_IMPACT, getTopPriorities } from "./checkMeta";

export type PresentationGroup = "technical" | "onPage" | "offPage";

const GROUP_MAP: Record<CategoryKey, PresentationGroup> = {
  technical: "technical",
  performance: "technical",
  onPage: "onPage",
  schema: "onPage",
  linkHealth: "offPage",
  aiEra: "offPage",
};

const GROUP_LABEL: Record<PresentationGroup, string> = {
  technical: "ტექნიკური SEO",
  onPage: "გვერდულივი SEO",
  offPage: "გარე და AI ხილვადობა",
};

const PRIORITY: Record<string, number> = {
  HTTPS: 100,
  "HTTP სტატუსი": 100,
  "Mobile Viewport": 95,
  "Title Tag": 95,
  "Meta Description": 90,
  "H1 სათაური": 85,
  "გატეხილი ბმულები": 88,
  "Schema Markup (JSON-LD)": 80,
  "Performance Score": 80,
  "LCP (Largest Contentful Paint)": 78,
  "Server-Side Rendering": 75,
  "Open Graph": 75,
  "ALT ტექსტები": 72,
  "Canonical Tag": 70,
  "Organization Schema": 70,
  "XML Sitemap": 68,
  "llms.txt": 65,
  "robots.txt": 65,
  "CLS (Cumulative Layout Shift)": 62,
  "სათაურების იერარქია": 60,
  "Image Format": 55,
  "FAQ Schema": 55,
  "კონტენტის მოცულობა": 55,
  "Lazy Loading": 50,
  "Twitter Card": 45,
  "TBT (Total Blocking Time)": 45,
  "FCP (First Contentful Paint)": 42,
  "შიდა ბმულები": 40,
  რედირექტები: 35,
  "Security Headers": 35,
  "Meta Robots": 30,
  hreflang: 20,
  "გარე ბმულები": 20,
};

export type ProblemVisualKind =
  | "serp"
  | "facebook"
  | "twitter"
  | "code-empty"
  | "file-missing"
  | "sitemap-missing"
  | "broken-links"
  | "stats"
  | "alt-missing"
  | "https-warning"
  | "headings"
  | "noVisual"
  | "generic";

const VISUAL_BY_LABEL: Record<string, ProblemVisualKind> = {
  "Title Tag": "serp",
  "Meta Description": "serp",
  "H1 სათაური": "serp",
  "Open Graph": "facebook",
  "Twitter Card": "twitter",
  "Schema Markup (JSON-LD)": "code-empty",
  "Organization Schema": "code-empty",
  "FAQ Schema": "code-empty",
  "robots.txt": "file-missing",
  "XML Sitemap": "sitemap-missing",
  "llms.txt": "file-missing",
  "გატეხილი ბმულები": "broken-links",
  რედირექტები: "broken-links",
  "ALT ტექსტები": "stats",
  "Image Format": "stats",
  "Lazy Loading": "stats",
  HTTPS: "https-warning",
  "სათაურების იერარქია": "headings",
  "Canonical Tag": "noVisual",
  "Security Headers": "noVisual",
  "Mobile Viewport": "noVisual",
  "Meta Robots": "noVisual",
  hreflang: "noVisual",
  "Server-Side Rendering": "noVisual",
  "შიდა ბმულები": "noVisual",
  "კონტენტის მოცულობა": "noVisual",
  "Performance Score": "noVisual",
  "LCP (Largest Contentful Paint)": "noVisual",
  "CLS (Cumulative Layout Shift)": "noVisual",
  "TBT (Total Blocking Time)": "noVisual",
  "FCP (First Contentful Paint)": "noVisual",
};

export const STATS_LABELS: Record<string, string> = {
  "ALT ტექსტები": "სურათი ALT ტექსტით",
  "Image Format": "სურათი WebP/AVIF ფორმატში",
  "Lazy Loading": "სურათი lazy load-ით",
};

export interface ProblemEntry {
  check: CheckResult;
  categoryName: string;
  categoryKey: CategoryKey;
  group: PresentationGroup;
  visual: ProblemVisualKind;
  impact?: string;
  seoImpact?: string;
  priority: number;
}

export interface RecommendationItem {
  title: string;
  text: string;
}

export interface ServiceBlock {
  title: string;
  items: string[];
}

export const SEO_SERVICES: ServiceBlock[] = [
  {
    title: "ტექნიკური ოპტიმიზაცია",
    items: [
      "ვებსაიტის სრული ტექნიკური აუდიტი",
      "Sitemap.xml-ის ოპტიმიზაცია უკეთესი ხილვადობისთვის",
      "Robots.txt ფაილის გამართვა",
      "H-tag-ების ოპტიმიზაცია მთელ ვებსაიტზე",
      "Meta მონაცემების გამართვა მთელ ვებსაიტზე",
      "ვებსაიტის სიჩქარის ოპტიმიზაცია (Core Web Vitals)",
      "ბმულების სტრუქტურის გამართვა",
      "ვებსაიტზე არსებული ფოტომასალის ოპტიმიზაცია",
      "სხვადასხვა მოწყობილობაზე რესპონსიულობის უზრუნველყოფა",
      "Schema markup (სტრუქტურირებული მონაცემები) დანერგვა",
      "llms.txt დანერგვა AI ძიებებისთვის (ChatGPT, Claude, Perplexity)",
    ],
  },
  {
    title: "On-page ოპტიმიზაცია",
    items: [
      "ვებსაიტის On-page აუდიტი",
      "კონკურენტების კონტენტის ანალიზი",
      "საძიებო სიტყვების კვლევა (Keyword Research)",
      "Keyword Mapping-ი ყოველი გვერდისთვის",
      "კონტენტის სტრატეგიის შედგენა საძიებო სიტყვების ბაზაზე",
      "ყოველთვიურად 1500+ სიტყვიანი კონტენტის მომზადება (ბლოგები, ლენდინგ გვერდები)",
      "შიდა გადაკავშირებების ქსელის გამართვა რელევანტური Anchor ტექსტებით",
      "Footer-ისა და სხვა ინტერაქციული ელემენტების გამართულობის უზრუნველყოფა UX-ისთვის",
      "Title და Meta Description-ების ოპტიმიზაცია",
    ],
  },
  {
    title: "Off-page ოპტიმიზაცია",
    items: [
      "ვებსაიტის და კონკურენტების ბექლინქ პროფილის ანალიზი",
      "ბექლინქ სტრატეგიის დაგეგმვა",
      "ყოველთვიურად მინიმუმ 3 ბექლინქის მოპოვება უცხო ლისტინგ საიტებიდან",
      "დამკვეთის ფინანსური მხარის შემთხვევაში — ყოველთვიურად 2 PR სტატიის მომზადება და განთავსება რელევანტურ პლატფორმაზე",
      "Domain Authority-ს მუდმივი მონიტორინგი",
      "ბრენდის ნახსენებების (mentions) მონიტორინგი",
    ],
  },
  {
    title: "ყოველთვიური რეპორტინგი",
    items: [
      "ინფორმაცია თვის განმავლობაში ჩატარებული სამუშაოს შესახებ",
      "ინფორმაცია საიტის სისტემაში ვებსაიტის გვერდების პოზიციონის ცვლილებების შესახებ",
      "ანგარიში თვის ჭრილში დაფიქსირებული Click-ებისა და Impression-ების რაოდენობის შესახებ",
      "ცალკეული საძიებო სიტყვების ანალიზი, რომელმაც თვის ჭრილში Click-ები და Impression-ები დააგენერირა",
      "Last Month VS Previous Month შედარებითი რეპორტინგი",
      "Google Search Console-ისა და Analytics-ის მონაცემები",
    ],
  },
];

export interface PassEntry {
  check: CheckResult;
  categoryName: string;
  group: PresentationGroup;
}

export interface ProblemPageRow {
  url: string;
  score: number;
  failed: number;
  warnings: number;
  topIssue: string;
  isHome: boolean;
  error?: string;
}

export type PresentationSlide =
  | {
      kind: "cover";
      siteName: string;
      siteUrl: string;
      date: string;
      // Preferred logo (og:image → twitter:image). May be missing or 404.
      logoUrl?: string;
      // High-res discovered logo (apple-touch-icon, Organization schema,
      // body <img class="logo">). Sits between logoUrl and faviconUrl in
      // the cover-slide fallback chain — beats a tiny favicon when og:image
      // is missing or breaks at render time.
      siteLogoUrl?: string;
      // Site favicon — used as a final fallback in the cover slide when
      // both logoUrl and siteLogoUrl fail to load.
      faviconUrl?: string;
    }
  | {
      kind: "summary";
      groups: Record<PresentationGroup, PassEntry[]>;
      siteName: string;
    }
  | {
      kind: "problem-pages";
      siteName: string;
      siteUrl: string;
      pages: ProblemPageRow[];
      averageScore: number;
    }
  | {
      kind: "problem";
      problem: ProblemEntry;
      slideIndex: number;
      totalProblems: number;
    }
  | {
      kind: "recommendations";
      siteName: string;
      siteUrl: string;
      items: RecommendationItem[];
    }
  | {
      kind: "services";
      siteName: string;
      blocks: ServiceBlock[];
    };

function priorityFor(check: CheckResult): number {
  const base = PRIORITY[check.label] ?? 30;
  return check.status === "fail" ? base + 100 : base;
}

function visualFor(check: CheckResult): ProblemVisualKind {
  return VISUAL_BY_LABEL[check.label] ?? "generic";
}

export function collectProblems(
  categories: AnalysisResult["categories"]
): ProblemEntry[] {
  const items: ProblemEntry[] = [];
  for (const [key, cat] of Object.entries(categories)) {
    const ck = key as CategoryKey;
    const category = cat as CategoryResult;
    for (const check of category.checks) {
      if (check.status !== "fail" && check.status !== "warn") continue;
      items.push({
        check,
        categoryName: category.name,
        categoryKey: ck,
        group: GROUP_MAP[ck],
        visual: visualFor(check),
        impact: CHECK_IMPACT[check.label],
        seoImpact: CHECK_SEO_IMPACT[check.label],
        priority: priorityFor(check),
      });
    }
  }
  return items.sort((a, b) => b.priority - a.priority);
}

export function collectPasses(
  categories: AnalysisResult["categories"]
): Record<PresentationGroup, PassEntry[]> {
  const groups: Record<PresentationGroup, PassEntry[]> = {
    technical: [],
    onPage: [],
    offPage: [],
  };
  for (const [key, cat] of Object.entries(categories)) {
    const ck = key as CategoryKey;
    const category = cat as CategoryResult;
    const group = GROUP_MAP[ck];
    for (const check of category.checks) {
      if (check.status !== "pass") continue;
      groups[group].push({
        check,
        categoryName: category.name,
        group,
      });
    }
  }
  return groups;
}

export function hostFromUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).host.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

interface RecommendationDef {
  title: string;
  text: string;
  condition?: (problems: ProblemEntry[]) => boolean;
}

const RECOMMENDATION_DEFS: RecommendationDef[] = [
  {
    title: "ტექნიკური საფუძველი ჯერ — შემდეგ კონტენტი",
    text:
      "იმისათვის, რომ გვერდულივი SEO-მ ეფექტურად იმუშაოს, აუცილებლად უნდა გაიმართოს ვებსაიტის ტექნიკური საფუძველი. SEO სპეციალისტის ხელმძღვანელობით და დეველოპერების გუნდის ჩართულობით უნდა გასწორდეს ყველა ტექნიკური ხარვეზი, რომელიც ამ დოკუმენტში იხილეთ.",
    condition: (problems) => problems.some((p) => p.group === "technical"),
  },
  {
    title: "საკვანძო სიტყვების კვლევა და კონტენტ სტრატეგია",
    text:
      "SEO სპეციალისტის მიერ უნდა შედგეს საკვანძო სიტყვების ბაზა და მის მიხედვით უნდა მომზადდეს კონტენტ სტრატეგია. შემდეგ უნდა შეიქმნას ახალი გვერდები ვებსაიტზე იმ ფრაზების ასათვისებლად, რომლებიც ვებსაიტზე ტრაფიკის ზრდას განაპირობებს.",
  },
  {
    title: "გარე ავტორიტეტის გაზრდა",
    text:
      "გამომდინარე იქედან, რომ ვებსაიტს Google-ის საძიებო სისტემაში დაბალი ავტორიტეტი აქვს, კონკურენციაში მაღალი ავტორიტეტის მქონე საიტებთან გასათანასწორებლად სასურველია ყოველთვიურად სხვადასხვა მედიაპლატფორმებზე გამოქვეყნდეს სტატიები ბრენდის ხილვადობის გაზრდისთვის.",
  },
  {
    title: "Google Business Profile — ლოკალური ხილვადობა",
    text:
      "სასურველია SEO სპეციალისტის მიერ შეიქმნას და დაოპტიმიზდეს Google Business Profile, რომელიც მომხმარებელს ფიზიკურ მისამართამდე ნავიგაციას გაუმარტივებს და Google Maps-ში გამოჩენის შანსებს გაზრდის. ლოკალური ბიზნესისთვის ეს ერთ-ერთი მთავარი არხია ახალი მომხმარებლების მოსაზიდად.",
  },
  {
    title: "AI ეპოქის მზადყოფნა (2026)",
    text:
      "ChatGPT-სა, Claude-სა და Perplexity-ს AI ბოტებზე ხილვადობის ოპტიმიზაცია ცალკე სტრატეგიული მიმართულებაა — llms.txt ფაილი, FAQ Schema, სერვერ-მხარეს რენდერი. AI-ით ძიება ტრადიციული Google-ის ძიების ხარჯზე იზრდება ყოველთვიურად — წინასწარი მზადება უპირატესობას მოიტანს.",
    condition: (problems) =>
      problems.some(
        (p) =>
          p.group === "offPage" ||
          p.check.label === "llms.txt" ||
          p.check.label === "Server-Side Rendering" ||
          p.check.label === "FAQ Schema"
      ),
  },
];

export function buildRecommendations(
  problems: ProblemEntry[]
): RecommendationItem[] {
  return RECOMMENDATION_DEFS.filter(
    (r) => !r.condition || r.condition(problems)
  ).map(({ title, text }) => ({ title, text }));
}

function buildProblemPagesRows(
  homeAnalysis: AnalysisResult,
  subPages?: PageReport[] | null
): ProblemPageRow[] {
  const rows: ProblemPageRow[] = [];

  const homeTop = getTopPriorities(homeAnalysis.categories, 1)[0];
  rows.push({
    url: homeAnalysis.finalUrl ?? homeAnalysis.url,
    score: homeAnalysis.summary?.score ?? 0,
    failed: homeAnalysis.summary?.failed ?? 0,
    warnings: homeAnalysis.summary?.warnings ?? 0,
    topIssue: homeTop?.check.label ?? "—",
    isHome: true,
  });

  if (subPages) {
    for (const sub of subPages) {
      if (sub.error || !sub.summary) {
        rows.push({
          url: sub.finalUrl ?? sub.url,
          score: 0,
          failed: 0,
          warnings: 0,
          topIssue: "ანალიზი ვერ მოხერხდა",
          isHome: false,
          error: sub.error,
        });
        continue;
      }
      const subTop = getTopPriorities(sub.categories, 1)[0];
      rows.push({
        url: sub.finalUrl ?? sub.url,
        score: sub.summary.score,
        failed: sub.summary.failed,
        warnings: sub.summary.warnings,
        topIssue: subTop?.check.label ?? "—",
        isHome: false,
      });
    }
  }

  // Sort: errors last, then ascending by score (worst non-error first).
  return rows.sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return a.score - b.score;
  });
}

export function buildSlides(
  analysis: AnalysisResult,
  preview?: PreviewData | null,
  subPages?: PageReport[] | null
): PresentationSlide[] {
  const slides: PresentationSlide[] = [];
  const siteUrl = analysis.finalUrl ?? analysis.url;
  const siteName = hostFromUrl(siteUrl);

  // Primary logo for the cover slide: og:image > twitter:image. The
  // siteLogo (apple-touch-icon, Organization schema, body <img class="logo">)
  // and the favicon are passed separately so the cover can fall through
  // logoUrl → siteLogoUrl → faviconUrl when an image 404s or is CORS-blocked
  // at render time. siteLogoUrl sits before faviconUrl because a 32×32
  // favicon visibly blurs at cover-slide scale.
  const logoUrl =
    preview?.og?.image || preview?.twitter?.image || undefined;
  const siteLogoUrl = preview?.siteLogo || undefined;
  const faviconUrl = preview?.favicon || undefined;

  slides.push({
    kind: "cover",
    siteName,
    siteUrl,
    date: new Date(analysis.fetchedAt).toLocaleDateString("ka-GE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    logoUrl: logoUrl ?? siteLogoUrl ?? faviconUrl,
    siteLogoUrl,
    faviconUrl,
  });

  const passes = collectPasses(analysis.categories);
  slides.push({
    kind: "summary",
    groups: passes,
    siteName,
  });

  // Problem Pages slide — only when multi-page audit was run. Shows the
  // home page + each sub-page sorted by score (worst first), with the
  // top issue per page so the client can scan health at a glance.
  if (subPages && subPages.length > 0) {
    const pages = buildProblemPagesRows(analysis, subPages);
    const validScores = pages.filter((p) => !p.error).map((p) => p.score);
    const averageScore =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((sum, s) => sum + s, 0) / validScores.length
          )
        : 0;
    slides.push({
      kind: "problem-pages",
      siteName,
      siteUrl,
      pages,
      averageScore,
    });
  }

  const problems = collectProblems(analysis.categories);
  problems.forEach((problem, slideIndex) => {
    slides.push({
      kind: "problem",
      problem,
      slideIndex,
      totalProblems: problems.length,
    });
  });

  slides.push({
    kind: "recommendations",
    siteName,
    siteUrl,
    items: buildRecommendations(problems),
  });

  slides.push({
    kind: "services",
    siteName,
    blocks: SEO_SERVICES,
  });

  return slides;
}

export { GROUP_LABEL };

export interface StoredAnalysis {
  url: string;
  fetchedAt: string;
  analysis: AnalysisResult;
  preview?: PreviewData | null;
  subPages?: PageReport[] | null;
}

const STORAGE_KEY_PREFIX = "presentation:";

// Deterministic 32-bit hash so writer (results page) and reader
// (presentation page) agree without depending on URL encoding rules.
// Avoids special-character key collisions like ?utm=… or fragments.
function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h << 5) - h + url.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export function storageKey(url: string): string {
  return STORAGE_KEY_PREFIX + hashUrl(url);
}
