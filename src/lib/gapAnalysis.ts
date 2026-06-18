import type { AnalysisResult, CategoryKey, CheckResult } from "./types";

// A single instance where a competitor passes a check that the user's
// site fails or warns on (or doesn't run at all). "missing" means the
// user's analysis didn't include this category - usually because the
// site was bot-protected or fetch failed for some category. We treat it
// as an advantage anyway since the gap is real from the user's POV.
export interface CompetitorAdvantage {
  competitor: string;
  category: CategoryKey;
  checkLabel: string;
  severity: "critical" | "important" | "minor";
  competitorValue: CheckResult["value"];
  competitorMessage: string;
  mainStatus: "fail" | "warn" | "missing";
  mainMessage: string;
}

export interface ActionRecommendation {
  id: string;
  category: CategoryKey;
  title: string;
  // 0-100, higher = more urgent. Combines severity, breadth of
  // competitor coverage, and category strategic weight.
  priority: number;
  rationale: string;
  steps: string[];
  estimatedImpact: string;
  // How many of the analysed competitors already do this. Useful UX
  // signal - "all 3 competitors do this" is more pressing than "1 of 3".
  competitorsCount: number;
  totalCompetitors: number;
}

// All fail/warn checks on the user's own site, regardless of competitor
// status. Annotated with how many competitors share the same issue so the
// UI can distinguish "you alone fail" (urgent) from "industry-wide fail"
// (still a fix worth doing, just not a competitive disadvantage).
export interface SelfIssue {
  category: CategoryKey;
  checkLabel: string;
  status: "fail" | "warn";
  message: string;
  recommendation?: string;
  // 0..totalCompetitors - how many competitors hit the same fail/warn.
  competitorsAlsoFailing: number;
  // 0..totalCompetitors - how many competitors pass this. competitorsPassing > 0
  // means there's a known way to fix this; competitive disadvantage.
  competitorsPassing: number;
  totalCompetitors: number;
}

export interface GapReport {
  // Keyed by competitor hostname. Order matches the input array minus index 0.
  advantagesByCompetitor: { hostname: string; advantages: CompetitorAdvantage[] }[];
  totalAdvantages: number;
  // Sorted by priority descending. Each entry is deduped - if 3 competitors
  // all do FAQ schema, this appears once with competitorsCount=3.
  recommendations: ActionRecommendation[];
  // The user's full fail/warn list, annotated with competitor signals.
  // Useful when "why they're ahead" surfaces few items (because competitors
  // have similar profiles) but the user's site still has real issues.
  selfIssues: SelfIssue[];
}

function severityScore(s: CompetitorAdvantage["severity"]): number {
  return s === "critical" ? 10 : s === "important" ? 5 : 1;
}

// Strategic weight per category. Performance and AI-era are weighted
// higher because they reflect the 2026 SEO landscape (Core Web Vitals
// is a Google ranking factor; AI search visibility is the new front).
const CATEGORY_PRIORITY: Record<CategoryKey, number> = {
  performance: 30,
  schema: 25,
  aiEra: 25,
  onPage: 20,
  technical: 15,
  linkHealth: 10,
};

interface RecTemplate {
  category: CategoryKey;
  title: string;
  rationale: string;
  steps: string[];
  estimatedImpact: string;
}

// Recommendations keyed by check label. Each one is grounded in a
// specific technical gap that the comparison surfaced - never generic
// advice. If a label isn't in this table we still generate a recommendation
// via the fallback at the bottom of analyseGaps.
const RECOMMENDATION_TEMPLATES: Record<string, RecTemplate> = {
  // ── On-Page ──────────────────────────────────────────────────────────
  "Title Tag": {
    category: "onPage",
    title: "Title tag-ის ოპტიმიზაცია",
    rationale:
      "Title არის SERP-ში #1 CTR სიგნალი. კონკურენტს უკეთესი title-ის სტრუქტურა აქვს - keyword + ბრენდი 50-60 სიმბოლოში.",
    steps: [
      "შეცვალე title 50-60 სიმბოლომდე",
      "მთავარი keyword დააყენე დასაწყისში",
      "ბრენდი დაამატე ბოლოში | სიმბოლოს შემდეგ",
      "ცალკე title ყოველი გვერდისთვის - დუბლირება არ უნდა იყოს",
    ],
    estimatedImpact: "CTR +10-25%",
  },
  "Meta Description": {
    category: "onPage",
    title: "Meta description-ის გამოწერა",
    rationale:
      "Meta description SERP-ში pitch-ია. კარგი description კონკურენტს 5-15% უფრო მაღალ CTR-ს აძლევს.",
    steps: [
      "დაამატე meta description 140-160 სიმბოლოთი",
      'გამოიყენე active voice ("გაიგე", "სცადე", "შეუკვეთე")',
      "ჩართე CTA - მოქმედებაზე მოწოდება",
    ],
    estimatedImpact: "CTR +5-15%",
  },
  "H1 სათაური": {
    category: "onPage",
    title: "H1 სტრუქტურის გასწორება",
    rationale:
      "H1 გვერდის თემის Google-ისთვის გასაგებად ცენტრალურია. კონკურენტს სუფთა H1 აქვს - ერთი, აღწერითი.",
    steps: [
      "გვერდზე ერთი H1 უნდა იყოს",
      "H1 უნდა შეიცავდეს მთავარ keyword-ს",
      "H1 და title არ უნდა იყოს იდენტური",
    ],
    estimatedImpact: "Topical relevance +10%",
  },
  "ALT ტექსტები": {
    category: "onPage",
    title: "სურათების ALT ტექსტი",
    rationale:
      "ALT ტექსტი Google Images-ის SEO-სა და accessibility-ისთვის აუცილებელია. კონკურენტი ყველა სურათს აღწერს.",
    steps: [
      "ყოველ <img>-ს დაამატე aria/SEO-ფრიენდლი alt ტექსტი",
      "ალტ უნდა იყოს აღწერითი, არა keyword-stuffing",
      "დეკორაციული სურათებისთვის alt='' (empty)",
    ],
    estimatedImpact: "Image SEO + accessibility",
  },
  "შიდა ბმულები": {
    category: "onPage",
    title: "შიდა ბმულების სტრუქტურა",
    rationale:
      "შიდა ბმულები Google-ისთვის \"topic authority\"-ის სიგნალია. კონკურენტს უფრო ღრმა შიდა ბმულების ქსელი აქვს.",
    steps: [
      "ყოველი მთავარი გვერდიდან 3+ შიდა ბმული",
      "Pillar + cluster model: მთავარი თემები ↔ ქვე-თემები",
      "ბუნებრივი anchor text - არ stuff-ი keyword-ით",
    ],
    estimatedImpact: "Internal PageRank +15-30%",
  },

  // ── Technical ────────────────────────────────────────────────────────
  HTTPS: {
    category: "technical",
    title: "HTTPS-ის ჩართვა",
    rationale:
      "HTTPS Google-ის რანკინგის ფაქტორია 2014-დან. კონკურენტი დაცული კავშირით მუშაობს, შენ - არა.",
    steps: [
      "მიიღე SSL/TLS სერტიფიკატი (Let's Encrypt უფასოა)",
      "ყველა HTTP-ი დაარედირექტე HTTPS-ზე (301)",
      "Mixed content გადახედე - ყველა რესურსი HTTPS-ით",
    ],
    estimatedImpact: "Ranking signal + browser trust",
  },
  "robots.txt": {
    category: "technical",
    title: "robots.txt ფაილის შექმნა",
    rationale:
      "robots.txt არის crawler-ების კონტროლის სტანდარტული მექანიზმი. კონკურენტი მართავს რა გვერდი როდის იქნება scanned.",
    steps: [
      "შექმენი /robots.txt",
      "მიუთითე sitemap-ის URL",
      "გამორიცხე ადმინი, კალათა, ფინანსური გვერდები",
    ],
    estimatedImpact: "Crawl efficiency",
  },
  "XML Sitemap": {
    category: "technical",
    title: "XML Sitemap-ის შექმნა",
    rationale:
      "Sitemap Google-ს ეუბნება რა გვერდები არსებობს და როდის განახლდა. კონკურენტი ჩქარა და სრულად ინდექსდება - შენ ვერა.",
    steps: [
      "გენერირება - Yoast/RankMath/AIOSEO ან კოდით",
      "URL მიუთითე robots.txt-ში",
      "დაარეგისტრირე Google Search Console-ში",
    ],
    estimatedImpact: "Indexing speed + completeness",
  },
  "Canonical Tag": {
    category: "technical",
    title: "Canonical tag-ის დამატება",
    rationale:
      "Canonical Google-ს უთითებს რომელია მთავარი URL დუბლირებული კონტენტის შემთხვევაში. კონკურენტი ამით თავიდან იცილებს დუბლირების ჯარიმას.",
    steps: [
      'ყოველ გვერდს დაამატე <link rel="canonical" href="...">',
      "Self-canonical: გვერდი თავის თავზე უთითებს",
      'წყვილი www/non-www - ერთი canonical-ად აირჩიე',
    ],
    estimatedImpact: "Duplicate content protection",
  },
  "Security Headers": {
    category: "technical",
    title: "Security Headers-ის გაუმჯობესება",
    rationale:
      "CSP, X-Frame-Options, HSTS Google-ის trust ფაქტორებია. კონკურენტი უსაფრთხო კონფიგურაციით მუშაობს.",
    steps: [
      "Content-Security-Policy header",
      "X-Frame-Options: SAMEORIGIN ან DENY",
      "Strict-Transport-Security (HSTS)",
    ],
    estimatedImpact: "Browser trust + security score",
  },

  // ── Schema ───────────────────────────────────────────────────────────
  "JSON-LD Schema": {
    category: "schema",
    title: "Structured Data (JSON-LD) დამატება",
    rationale:
      "JSON-LD Google-ისთვის გვერდის შინაარსის გასაგებად მთავარია. კონკურენტი Rich Results-ში ჩანს - შენ უბრალო ლისტინგი ხარ.",
    steps: [
      "Organization schema - ბრენდის graph-ისთვის",
      "BreadcrumbList - navigation",
      "FAQPage / HowTo / Product - შენი კონტენტის ტიპის მიხედვით",
      "სცადე Google Rich Results Test",
    ],
    estimatedImpact: "Rich Results +30%, AI citations +20-40%",
  },
  "Open Graph": {
    category: "schema",
    title: "Open Graph tags დამატება",
    rationale:
      "OG tags Facebook/LinkedIn-ში გაზიარების prevuew-ს აკონტროლებს. კონკურენტი share-ში პროფესიონალურად გამოიყურება - შენ ცარიელად.",
    steps: [
      'og:title, og:description, og:image (1200×630px), og:url, og:type - ყველა აუცილებელია',
      "og:image - JPG/PNG, არა SVG",
      "ცალკე image ყოველი მნიშვნელოვანი გვერდისთვის",
    ],
    estimatedImpact: "Social CTR +20-50%",
  },
  "Twitter Card": {
    category: "schema",
    title: "Twitter Card tags",
    rationale:
      "Twitter/X-ში გაზიარების preview. კონკურენტი feed-ში outstanding-ი ჩანს.",
    steps: [
      'twitter:card - "summary_large_image"',
      "twitter:title, twitter:description, twitter:image",
      "twitter:site - შენი @handle",
    ],
    estimatedImpact: "Twitter CTR +15-30%",
  },
  "FAQ Schema": {
    category: "schema",
    title: "FAQ Schema-ის ჩაშენება",
    rationale:
      "FAQ schema Google AI Overviews-ში ციტირების მთავარი სიგნალია. კონკურენტი AI პასუხებში გამოჩნდება, შენ - არა.",
    steps: [
      "JSON-LD FAQPage schema საიტის ხშირი კითხვებისთვის",
      "კითხვა-პასუხი წყვილებად",
      "Google Rich Results Test-ით ვალიდაცია",
    ],
    estimatedImpact: "AI Overview visibility +20-40%",
  },

  // ── AI Era ───────────────────────────────────────────────────────────
  "llms.txt": {
    category: "aiEra",
    title: "llms.txt სტანდარტის დანერგვა",
    rationale:
      "llms.txt 2026 ახალი სტანდარტია AI კრაულერებისთვის (ChatGPT, Claude, Perplexity). კონკურენტი AI ძიებაში გამოჩნდება - შენ უხილავი ხარ.",
    steps: [
      "/llms.txt ფაილი მთავარ დონეზე",
      'ჩამოწერე საიტის სტრუქტურა და მთავარი გვერდები markdown-ით',
      "ჩართე robots.txt-ში: AI კრაულერებისთვის ნებართვები",
    ],
    estimatedImpact: "AI search visibility (ChatGPT, Claude, Perplexity)",
  },
  "SSR/SSG": {
    category: "aiEra",
    title: "Server-Side Rendering ან SSG",
    rationale:
      "AI კრაულერები JavaScript-ს არ ასრულებენ - მათ სუფთა HTML სჭირდებათ. კონკურენტი SSR-ით მუშაობს, შენი SPA AI-სთვის უხილავია.",
    steps: [
      "Next.js / Nuxt / Astro - SSR ან SSG mode-ით",
      "Critical content სერვერზე გენერირდეს, არა client-ზე",
      'Google Mobile Test-ით ვალიდაცია - ხედავს თუ არა შინაარსს',
    ],
    estimatedImpact: "AI indexing + Google First Paint",
  },
  "BLUF format": {
    category: "aiEra",
    title: "Bottom Line Up Front კონტენტის სტრუქტურა",
    rationale:
      "AI-ი ციტირებს მოკლე, თვითმყოფად პასუხებს. კონკურენტი BLUF სტრუქტურით წერს - AI Overviews-ში ციტირდება.",
    steps: [
      'ყოველი სტატია იწყებოდეს 1-2 ფრაზიანი answer-ით',
      "შემდეგ ღრმავდებოდე დეტალურ ანალიზში",
      "გამოიყენე ცხრილები, bullet-ები - AI მათ ციტირებას უპირატესობას ანიჭებს",
    ],
    estimatedImpact: "AI citation rate +30%",
  },

  // ── Performance (Core Web Vitals) ────────────────────────────────────
  LCP: {
    category: "performance",
    title: "LCP-ის გაუმჯობესება",
    rationale:
      "LCP (Largest Contentful Paint) Google-ის რანკინგ ფაქტორია. კონკურენტი ფიქსირდება 2.5წ-ში, შენი - გადაჭარბებული.",
    steps: [
      "Hero სურათი - preload + WebP/AVIF ფორმატი",
      "Render-blocking CSS/JS - defer ან async",
      "CDN - სტატიკური რესურსები ახლოს მომხმარებელთან",
      "Fonts - preload + font-display: swap",
    ],
    estimatedImpact: "Mobile ranking + bounce -15-25%",
  },
  INP: {
    category: "performance",
    title: "INP-ის ოპტიმიზაცია",
    rationale:
      "INP (Interaction to Next Paint) 2024-დან Core Web Vital გახდა. კონკურენტი 200ms-ში პასუხობს - შენ ნელია.",
    steps: [
      "JavaScript bundle გაყავი - code splitting",
      "Third-party სკრიპტები გადახედე - Analytics, Tag Manager",
      "Heavy computation - web workers-ში",
      "React → use deferred state, useTransition",
    ],
    estimatedImpact: "Interaction quality + ranking",
  },
  CLS: {
    category: "performance",
    title: "CLS-ის შემცირება",
    rationale:
      "CLS (Cumulative Layout Shift) მომხმარებლის გაღიზიანების მთავარი წყაროა. კონკურენტი stable layout-ით მუშაობს.",
    steps: [
      "<img>-ს ყოველთვის წერე width/height ან aspect-ratio",
      "Font swap - გამოიყენე size-adjust ან optional",
      "რეკლამის slots - წინასწარ დაიჯავშნე ფიქსირებული ზომა",
    ],
    estimatedImpact: "UX score + ranking",
  },
};

// Performance metrics are special - we compare actual numbers, not just
// pass/fail. This lets us say "their LCP is 1.8s, yours is 3.4s" instead
// of just "they pass LCP". Parses the value field which the checks store
// as a string like "1.8s" or "180ms".
function parsePerfValue(value: CheckResult["value"]): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const m = value.match(/([\d.]+)\s*(ms|s|%)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  if (m[2] === "s") return n * 1000;
  return n;
}

export function analyzeGaps(
  sites: {
    hostname: string;
    categories: Partial<AnalysisResult["categories"]>;
  }[]
): GapReport {
  if (sites.length < 2) {
    return {
      advantagesByCompetitor: [],
      totalAdvantages: 0,
      recommendations: [],
      selfIssues: [],
    };
  }

  const [main, ...competitors] = sites;
  const advantagesByCompetitor: GapReport["advantagesByCompetitor"] = [];

  // Track each gap globally so we can dedupe recommendations across
  // competitors and weight them by how many competitors share it.
  const gapCounts = new Map<
    string,
    {
      count: number;
      category: CategoryKey;
      severity: CompetitorAdvantage["severity"];
    }
  >();

  for (const comp of competitors) {
    const advantages: CompetitorAdvantage[] = [];
    for (const catKey of Object.keys(comp.categories) as CategoryKey[]) {
      const compCat = comp.categories[catKey];
      if (!compCat) continue;
      const mainCat = main.categories[catKey];

      for (const compCheck of compCat.checks) {
        if (compCheck.status !== "pass") continue;

        const mainCheck = mainCat?.checks.find(
          (c) => c.label === compCheck.label
        );

        let mainStatus: CompetitorAdvantage["mainStatus"] | null = null;
        let mainMessage = "ჩვენ ვერ ვამოწმეთ ეს კატეგორია";
        if (!mainCat) {
          mainStatus = "missing";
        } else if (!mainCheck) {
          mainStatus = "missing";
          mainMessage = "ჩვენთან ეს შემოწმება არ ჩატარდა";
        } else if (mainCheck.status === "fail") {
          mainStatus = "fail";
          mainMessage = mainCheck.message;
        } else if (mainCheck.status === "warn") {
          mainStatus = "warn";
          mainMessage = mainCheck.message;
        }

        if (!mainStatus) continue; // main passes too - no gap

        const severity: CompetitorAdvantage["severity"] =
          mainStatus === "fail"
            ? "critical"
            : mainStatus === "warn"
            ? "important"
            : "minor";

        advantages.push({
          competitor: comp.hostname,
          category: catKey,
          checkLabel: compCheck.label,
          severity,
          competitorValue: compCheck.value,
          competitorMessage: compCheck.message,
          mainStatus,
          mainMessage,
        });

        const existing = gapCounts.get(compCheck.label) ?? {
          count: 0,
          category: catKey,
          severity,
        };
        existing.count++;
        if (severityScore(severity) > severityScore(existing.severity)) {
          existing.severity = severity;
        }
        gapCounts.set(compCheck.label, existing);
      }
    }
    advantagesByCompetitor.push({
      hostname: comp.hostname,
      advantages,
    });
  }

  // Build deduped recommendations from gap counts.
  const recommendations: ActionRecommendation[] = [];
  for (const [label, info] of gapCounts) {
    const template = RECOMMENDATION_TEMPLATES[label];
    // Composite priority: severity × 10 + breadth × 5 + category weight.
    // Pegged to [0, 100] range so the UI can use it directly.
    const rawPriority =
      severityScore(info.severity) * 10 +
      info.count * 5 +
      (CATEGORY_PRIORITY[info.category] ?? 0);
    const priority = Math.min(100, rawPriority);

    if (template) {
      recommendations.push({
        id: label,
        category: template.category,
        title: template.title,
        priority,
        rationale: template.rationale,
        steps: template.steps,
        estimatedImpact: template.estimatedImpact,
        competitorsCount: info.count,
        totalCompetitors: competitors.length,
      });
    } else {
      // Generic fallback - still gives the user a structured recommendation
      // even for checks we don't have a hand-tuned template for.
      recommendations.push({
        id: label,
        category: info.category,
        title: `"${label}" - გასწორება`,
        priority,
        rationale: `${info.count}/${competitors.length} კონკურენტი ამ შემოწმებას აკმაყოფილებს, თქვენი საიტი - არა.`,
        steps: [
          "გადახედე check-ის რეკომენდაცია ცალკეული საიტის audit-ში",
          "შემდეგ რეგენერირე ანალიზი - გადაამოწმე გასწორება",
        ],
        estimatedImpact: "Technical SEO score +5-10%",
        competitorsCount: info.count,
        totalCompetitors: competitors.length,
      });
    }
  }

  // Build the self-issues list: every fail/warn on the user's own site,
  // annotated with competitor signal. This is the "comprehensive audit"
  // view - gap analysis alone hides issues that the user has but
  // competitors also have (industry-wide weaknesses), and those still
  // matter. The action plan below augments recommendations with the
  // ones that didn't already surface through the gap path.
  const selfIssues: SelfIssue[] = [];
  for (const catKey of Object.keys(main.categories) as CategoryKey[]) {
    const mainCat = main.categories[catKey];
    if (!mainCat) continue;
    for (const mainCheck of mainCat.checks) {
      if (mainCheck.status !== "fail" && mainCheck.status !== "warn") continue;

      let alsoFailing = 0;
      let passing = 0;
      for (const comp of competitors) {
        const compCat = comp.categories[catKey];
        const compCheck = compCat?.checks.find(
          (c) => c.label === mainCheck.label
        );
        if (!compCheck) continue;
        if (compCheck.status === "pass") passing++;
        else if (
          compCheck.status === "fail" ||
          compCheck.status === "warn"
        ) {
          alsoFailing++;
        }
      }

      selfIssues.push({
        category: catKey,
        checkLabel: mainCheck.label,
        status: mainCheck.status,
        message: mainCheck.message,
        recommendation: mainCheck.recommendation,
        competitorsAlsoFailing: alsoFailing,
        competitorsPassing: passing,
        totalCompetitors: competitors.length,
      });
    }
  }

  // Sort: fails before warns, then by "industry rarity" (lower
  // alsoFailing = rarer = more urgent because you're alone), then by
  // category strategic weight.
  selfIssues.sort((a, b) => {
    if (a.status !== b.status) return a.status === "fail" ? -1 : 1;
    if (a.competitorsAlsoFailing !== b.competitorsAlsoFailing) {
      return a.competitorsAlsoFailing - b.competitorsAlsoFailing;
    }
    return (
      (CATEGORY_PRIORITY[b.category] ?? 0) -
      (CATEGORY_PRIORITY[a.category] ?? 0)
    );
  });

  // Augment recommendations with the user's own fails that didn't already
  // surface via the competitor-gap path. Lower priority (since no
  // competitor proved this is winnable), but still actionable.
  const recommendedLabels = new Set(recommendations.map((r) => r.id));
  for (const issue of selfIssues) {
    if (recommendedLabels.has(issue.checkLabel)) continue;
    if (issue.competitorsPassing > 0) continue; // already covered

    const template = RECOMMENDATION_TEMPLATES[issue.checkLabel];
    const sev: CompetitorAdvantage["severity"] =
      issue.status === "fail" ? "critical" : "important";
    // Self-only issues get less priority than competitor-confirmed gaps
    // (no breadth signal). But criticals still beat trivial gaps.
    const priority = Math.min(
      100,
      severityScore(sev) * 8 + (CATEGORY_PRIORITY[issue.category] ?? 0)
    );

    if (template) {
      recommendations.push({
        id: issue.checkLabel,
        category: template.category,
        title: template.title,
        priority,
        rationale:
          issue.competitorsAlsoFailing === competitors.length
            ? `ყველა ${competitors.length} კონკურენტი ამ შემოწმებას ვერც აკმაყოფილებს - industry-wide სუსტი წერტილი. გასწორება საუკეთესო შანსია კონკურენტებზე გასაცილებლად.`
            : template.rationale,
        steps: template.steps,
        estimatedImpact: template.estimatedImpact,
        competitorsCount: 0,
        totalCompetitors: competitors.length,
      });
    } else {
      recommendations.push({
        id: issue.checkLabel,
        category: issue.category,
        title: `"${issue.checkLabel}" - ${issue.status === "fail" ? "გასწორება" : "გაუმჯობესება"}`,
        priority,
        rationale:
          issue.recommendation ??
          `თქვენი საიტი ამ შემოწმებას ${issue.status === "fail" ? "ვერ აკმაყოფილებს" : "მხოლოდ ნაწილობრივ აკმაყოფილებს"}. ${
            issue.competitorsAlsoFailing > 0
              ? `${issue.competitorsAlsoFailing}/${competitors.length} კონკურენტიც იგივე პრობლემას აწყდება - industry-wide გასაუმჯობესებელი წერტილი.`
              : "კონკურენტებიც პრობლემურები არიან, მაგრამ შენი გასწორება ცალკეული უპირატესობაა."
          }`,
        steps: [
          "გადახედე single-site audit-ში ცალკეული რეკომენდაცია",
          "გასწორების შემდეგ რეგენერირე ანალიზი - გადაამოწმე",
        ],
        estimatedImpact:
          issue.status === "fail"
            ? "Technical SEO +5-15%"
            : "Technical SEO +2-8%",
        competitorsCount: 0,
        totalCompetitors: competitors.length,
      });
    }
  }

  recommendations.sort((a, b) => b.priority - a.priority);

  const totalAdvantages = advantagesByCompetitor.reduce(
    (sum, e) => sum + e.advantages.length,
    0
  );

  return { advantagesByCompetitor, totalAdvantages, recommendations, selfIssues };
}

// ── Performance comparison helpers ──────────────────────────────────────
// These complement the gap analysis with numeric perf deltas. The Core
// Web Vitals are too important to flatten into pass/fail - we want to
// surface the actual difference ("LCP 1.8s vs 3.4s") in the UI.

export interface PerfComparison {
  metric: "LCP" | "INP" | "CLS" | "TBT" | "FCP";
  mainValue: number | null;
  bestCompetitor: { hostname: string; value: number } | null;
  // Lower is better for all CWV - so "gap" is mainValue - bestCompetitor.
  // Positive gap = main is worse.
  gap: number | null;
  unit: "ms" | "score";
}

export function comparePerformance(
  sites: {
    hostname: string;
    categories: Partial<AnalysisResult["categories"]>;
  }[]
): PerfComparison[] {
  if (sites.length < 2) return [];
  const [main, ...competitors] = sites;
  const mainPerf = main.categories.performance;
  if (!mainPerf) return [];

  const metrics: PerfComparison["metric"][] = [
    "LCP",
    "INP",
    "CLS",
    "TBT",
    "FCP",
  ];
  const result: PerfComparison[] = [];

  for (const metric of metrics) {
    const findValue = (cat: AnalysisResult["categories"]["performance"] | undefined) =>
      cat?.checks.find((c) => c.label === metric);

    const mainCheck = findValue(mainPerf);
    if (!mainCheck) continue;
    const mainValue = parsePerfValue(mainCheck.value);

    let best: PerfComparison["bestCompetitor"] = null;
    for (const c of competitors) {
      const cc = findValue(c.categories.performance);
      if (!cc) continue;
      const v = parsePerfValue(cc.value);
      if (v == null) continue;
      if (!best || v < best.value) best = { hostname: c.hostname, value: v };
    }

    const gap =
      mainValue != null && best ? mainValue - best.value : null;

    result.push({
      metric,
      mainValue,
      bestCompetitor: best,
      gap,
      unit: metric === "CLS" ? "score" : "ms",
    });
  }

  return result;
}
