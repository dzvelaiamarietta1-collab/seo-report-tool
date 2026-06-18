import type { AnalysisResult, CategoryKey, CheckResult } from "./types";

// SEO Offer - a client-facing service proposal generated from the audit
// data. It frames the audit findings as "what we'll fix" and pairs that
// with an honest "what's on you" section so the client doesn't expect us
// to magically conjure backlinks or run paid ads from this engagement.

export type ServicePriority = "critical" | "high" | "medium" | "low";

export interface ServiceItem {
  // Short name shown as a bullet/heading.
  title: string;
  // 1-2 sentence justification - why this matters for THIS site, based on
  // the audit data. e.g. "Title-ი 92 სიმბოლოა - Google ჩამოაჭრის".
  rationale: string;
  // Concrete deliverables this work produces.
  deliverables: string[];
  priority: ServicePriority;
}

export interface ServiceCategory {
  id: CategoryKey | "content-strategy" | "monitoring";
  icon: string; // Lucide icon name
  title: string;
  // Single-paragraph what-we-do summary.
  overview: string;
  // Specific items derived from the audit; empty if nothing to fix here.
  items: ServiceItem[];
  // Static deliverables we always provide for this category.
  staticDeliverables: string[];
}

export interface ClientResponsibility {
  icon: string;
  title: string;
  // Why this stays on the client side - important to manage expectations.
  reason: string;
  // What the client actually needs to do or decide.
  examples: string[];
  // How we can ASSIST without owning it (advisory only).
  ourSupport?: string;
}

export interface TimelinePhase {
  label: string; // e.g. "თვე 1"
  title: string;
  items: string[];
}

export interface ExpectedOutcome {
  metric: string; // e.g. "ტექნიკური SEO ქულა"
  current: string;
  target: string;
  timeframe: string; // e.g. "3 თვე"
}

export interface SeoOffer {
  siteUrl: string;
  hostname: string;
  generatedAt: string;
  currentScore: number;
  // 1-2 paragraph executive summary in Georgian, generated from score +
  // top gaps. No AI required - template-driven.
  executiveSummary: string;
  // Top 3 priority actions surfaced from the audit.
  topPriorities: string[];
  // What we deliver, grouped by category.
  services: ServiceCategory[];
  // What the client owns. This is the section the user explicitly
  // asked for - making "ads/backlinks/PR is on you" crystal clear.
  clientResponsibilities: ClientResponsibility[];
  // 3/6/12-month roadmap.
  timeline: TimelinePhase[];
  // Realistic outcome estimates.
  expectedOutcomes: ExpectedOutcome[];
  // What this offer doesn't include (set expectations).
  exclusions: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

// Map a check status to a priority bucket for the offer.
function statusToPriority(status: CheckResult["status"]): ServicePriority {
  if (status === "fail") return "critical";
  if (status === "warn") return "high";
  return "low";
}

// Group audit failures/warnings by category. Pass checks are skipped -
// we don't sell work for things the site already does well.
function collectIssues(
  analysis: AnalysisResult
): Map<CategoryKey, CheckResult[]> {
  const out = new Map<CategoryKey, CheckResult[]>();
  (Object.keys(analysis.categories) as CategoryKey[]).forEach((catKey) => {
    const cat = analysis.categories[catKey];
    if (!cat) return;
    const issues = cat.checks.filter(
      (c) => c.status === "fail" || c.status === "warn"
    );
    if (issues.length > 0) out.set(catKey, issues);
  });
  return out;
}

// Build dynamic service items from the audit issues. Each fail/warn
// becomes a tailored "we'll fix X" item - concrete and traceable to
// the audit, not boilerplate.
function issuesToItems(issues: CheckResult[]): ServiceItem[] {
  return issues.slice(0, 6).map((issue) => ({
    title: issue.label,
    rationale: issue.message,
    deliverables:
      issue.recommendation != null
        ? [issue.recommendation]
        : ["კონკრეტული ფიქსი audit-ის რეკომენდაციის მიხედვით"],
    priority: statusToPriority(issue.status),
  }));
}

// Static service definitions. Each category has a stable overview and
// list of standard deliverables; the per-site items are spliced in from
// the audit. Keeps the offer professional even for clean audits where
// few issues surfaced.
const STATIC_SERVICES: Record<
  ServiceCategory["id"],
  Omit<ServiceCategory, "items">
> = {
  technical: {
    id: "technical",
    icon: "Wrench",
    title: "ტექნიკური SEO",
    overview:
      "საიტის ფუნდამენტი - Google-ის crawler-ი როგორ ხედავს თქვენს გვერდებს. ვაკეთებთ სრულ ტექნიკურ აუდიტს და ვუსწორებთ ყველაფერს HTML-დან server-ის headers-მდე.",
    staticDeliverables: [
      "HTTPS კონფიგურაცია + mixed content გასუფთავება",
      "robots.txt-ის შექმნა / გადახედვა",
      "XML sitemap-ის შექმნა და Google Search Console-ში დარეგისტრირება",
      "Canonical tags-ის სწორი დაყენება დუბლირების თავიდან ასაცილებლად",
      "Security headers: CSP, HSTS, X-Frame-Options",
      "hreflang multilingual საიტებისთვის",
      "Meta robots-ის სტრატეგია",
    ],
  },
  onPage: {
    id: "onPage",
    icon: "FileText",
    title: "On-Page SEO",
    overview:
      "ყოველი გვერდის შინაარსი ოპტიმიზებული უნდა იყოს როგორც Google-ის, ისე მომხმარებლის გასაგებად. ვამუშავებთ HTML structure-ს, headings-ს, links-ს, images-ს.",
    staticDeliverables: [
      "Title tags ყოველი გვერდისთვის (50-60 სიმბოლო, keyword-ით)",
      "Meta descriptions (140-160 სიმბოლო, აქტიური ხმით)",
      "H1-H6 იერარქიის გასწორება",
      "ALT ტექსტები ყველა სურათისთვის (accessibility + Image SEO)",
      "შიდა ბმულების სტრუქტურა (pillar + cluster მოდელი)",
      "გვერდის content-ის optimization (კონტენტს თვით კლიენტი ქმნის - იხ. ქვემოთ)",
    ],
  },
  schema: {
    id: "schema",
    icon: "Tag",
    title: "Structured Data (Schema Markup)",
    overview:
      "JSON-LD schema Google-ისთვის გვერდის შინაარსის \"მთარგმნელია\". აქედან გამოდის Rich Results (FAQ, Recipe, Product cards) და AI Overviews-ში ციტირების შანსი.",
    staticDeliverables: [
      "Organization schema - ბრენდის graph-ისთვის",
      "BreadcrumbList - navigation",
      "FAQPage / HowTo / Product / Article - საიტის ტიპის მიხედვით",
      "Open Graph (og:title, og:description, og:image 1200×630)",
      "Twitter Card (summary_large_image)",
      "Google Rich Results Test-ით ვალიდაცია",
    ],
  },
  performance: {
    id: "performance",
    icon: "Zap",
    title: "Performance - Core Web Vitals",
    overview:
      "LCP, INP, CLS - Google-ის ოფიციალური რანკინგ ფაქტორებია 2021-დან. ნელი საიტი = დაბალი ranking + მაღალი bounce rate.",
    staticDeliverables: [
      "LCP optimization: სურათების preload, WebP/AVIF კონვერსია",
      "INP optimization: JavaScript bundle splitting, third-party სკრიპტების audit",
      "CLS გასწორება: image dimensions, font-display strategy",
      "Critical CSS extraction",
      "CDN setup-ის რეკომენდაცია (კლიენტი ხარჯავს)",
      "PageSpeed Insights მონიტორინგი - ყოველთვიური",
    ],
  },
  aiEra: {
    id: "aiEra",
    icon: "Bot",
    title: "AI-ერის SEO (2026)",
    overview:
      "ChatGPT, Claude, Perplexity და Google AI Overviews - ახალი ძიების landscape-ი. ვამზადებთ თქვენს საიტს AI კრაულერებისთვის, რომ ბრენდი მათ პასუხებში გამოჩნდეს.",
    staticDeliverables: [
      "llms.txt სტანდარტის დანერგვა (2026 ახალი)",
      "FAQ Schema - AI Overviews-ში ციტირების სიგნალი",
      "BLUF (Bottom Line Up Front) კონტენტის სტრუქტურა",
      "SSR/SSG ვალიდაცია - AI კრაულერები JS-ს არ ასრულებენ",
      "Organization schema sameAs-ით - ბრენდის graph",
      "robots.txt-ში AI bot rules (GPTBot, ClaudeBot, etc.)",
    ],
  },
  linkHealth: {
    id: "linkHealth",
    icon: "Link",
    title: "Link Health Audit",
    overview:
      "გატეხილი ბმულები აქცევს crawler budget-ს და UX-ს აზიანებს. ვამოწმებთ ყველა შიდა ბმულს და გასწორებას ვაკეთებთ.",
    staticDeliverables: [
      "სრული შიდა ბმულების სკანი",
      "404 errors-ის გასწორება ან redirect",
      "Redirect chains-ის გასწორება",
      "Anchor text optimization",
    ],
  },
  "content-strategy": {
    id: "content-strategy",
    icon: "Lightbulb",
    title: "Content Strategy Consulting",
    overview:
      "კონტენტს თვით კლიენტი ქმნის (იხ. ქვემოთ), მაგრამ ჩვენ ვაძლევთ strategy-ის ჩარჩოს - რომელ თემებზე, რა keyword-ებით, რა სიგრძით.",
    staticDeliverables: [
      "Keyword research - სამიზნე keywords-ის სია",
      "Content gap analysis - რა აკლია კონკურენტებთან შედარებით",
      "Topic clusters - pillar + cluster მოდელის რუკა",
      "Content brief templates ცალკეული სტატიისთვის",
      "User intent mapping - keyword-ის უკან რა აქვს მომხმარებელს",
    ],
  },
  monitoring: {
    id: "monitoring",
    icon: "Target",
    title: "Monitoring & Reporting",
    overview:
      "SEO გრძელვადიანი მუშაობაა - შედეგი 3-6 თვეში ჩანს. ვამზადებთ ყოველთვიურ ანგარიშებს და ვცვლით სტრატეგიას მონაცემების მიხედვით.",
    staticDeliverables: [
      "Google Search Console setup + ვერიფიკაცია",
      "Google Analytics 4 setup (თუ კლიენტი არ ჰქონია)",
      "ყოველთვიური SEO ანგარიში (ranking, traffic, technical health)",
      "Algorithm update monitoring (Google core updates)",
      "Quarterly strategy review",
    ],
  },
};

const CATEGORY_SERVICE_ORDER: ServiceCategory["id"][] = [
  "technical",
  "onPage",
  "schema",
  "performance",
  "aiEra",
  "linkHealth",
  "content-strategy",
  "monitoring",
];

// ── Client Responsibilities (static, doesn't depend on audit) ──────────

const CLIENT_RESPONSIBILITIES: ClientResponsibility[] = [
  {
    icon: "PenTool",
    title: "კონტენტის შექმნა",
    reason:
      "კონტენტი თქვენი ბრენდის ცოდნა და ხედვაა - ვერც AI ვერც გარე სპეციალისტი ვერ შექმნის ისეთს, როგორც თქვენ. ჩვენ ვაძლევთ structure-ს და briefs-ს, კონტენტს თვით უნდა დაწეროთ ან თარგმნოთ.",
    examples: [
      "Blog სტატიები (1500+ სიტყვა საფუძვლიანი თემებისთვის)",
      "Product აღწერები / სერვისების გვერდები",
      "FAQ კონტენტი",
      "About / Team გვერდები",
      "სურათები და ფოტოები (პროდუქცია, გუნდი, ფასილიტი)",
    ],
    ourSupport:
      "ვაძლევთ content briefs-ს ცალკეული გვერდისთვის: სათაური, structure, keywords, target word count, internal links.",
  },
  {
    icon: "Users",
    title: "Brand Outreach & PR",
    reason:
      "ბრენდის ცნობადობა გრძელვადიანი მუშაობაა - ჟურნალისტებთან, ბლოგერებთან, industry partners-თან კავშირები. ეს თქვენი ბრენდის voice და სანდოობაა - ვერ outsourcing-ით ხდება.",
    examples: [
      "Industry-ის ბლოგერებთან კავშირები",
      "PR სტატიები ადგილობრივ მედიაში",
      "Industry conferences / podcasts-ში მონაწილეობა",
      "Partner-ებთან მცირე kollaboraciebi (cross-promotion)",
    ],
    ourSupport:
      "ვაძლევთ რეკომენდაციებს ვის უნდა ეცადოს - relevant ბლოგერების / publications-ის სია.",
  },
  {
    icon: "ExternalLink",
    title: "Backlinks-ის მოპოვება",
    reason:
      "ხარისხიანი backlink ისეთი საიტიდან, რომელიც თქვენ ბუნებრივად ცნობს. შემოწირული ან ფასიანი backlinks Google-ის penalty-ის რისკია. ცხოვრებითი კავშირები საუკეთესო წყაროა.",
    examples: [
      "Guest posts industry blogs-ში",
      "Partner companies-ის შემოწირული links",
      "Local business directories",
      "Industry awards / certifications-ის გვერდები",
      "Conference / event partner pages",
    ],
    ourSupport:
      "ვაანალიზებთ რომელი domains იქნებოდა მნიშვნელოვანი backlinks-ის წყაროდ + outreach template-ებს.",
  },
  {
    icon: "Megaphone",
    title: "Paid Advertising (Google Ads, Meta, etc.)",
    reason:
      "Ads-ის ბიუჯეტი, ROI-ის ციფრები, target audience - ბიზნესის გადაწყვეტილებებია. SEO ორგანულ traffic-ს ეხება; ფასიანი ads ცალკე channel-ია.",
    examples: [
      "Google Ads campaigns (Search, Display, Shopping)",
      "Meta Ads (Facebook, Instagram)",
      "LinkedIn Ads B2B-სთვის",
      "ბიუჯეტის გადაწყვეტა და ROI tracking",
      "ad creatives - სათაურები, banners, video",
    ],
    ourSupport:
      "ვაკავშირებთ SEO და SEM strategy-ს - რომელ keyword-ებზე ღირს paid-ი იქამდე, სანამ organic ranking-ი მოვა.",
  },
  {
    icon: "Star",
    title: "Customer Reviews & Reputation",
    reason:
      "Google Business Profile reviews, Trustpilot, industry directories - მუშტრები წერენ, არა SEO სპეციალისტი. Review-ების ხარისხი ლოკალური SEO-ისთვის კრიტიკულია.",
    examples: [
      "Google Business Profile-ის update და reviews-ის წახალისება",
      "Trustpilot / Facebook reviews-ის მართვა",
      "უარყოფითი review-ების professional response",
      "Industry awards / certifications",
    ],
    ourSupport:
      "GBP setup-ისა და review request-ის automation-ის რჩევები.",
  },
  {
    icon: "Building",
    title: "ბიზნეს გადაწყვეტილებები",
    reason:
      "რა პროდუქცია/სერვისს გაყიდით, რა ფასი, რა საბაზრო პოზიცია - ბიზნესის strategy-ია. SEO ეხმარება უკვე გადაწყვეტილ ბიზნესს მეტი ხილვადობის მიღწევაში.",
    examples: [
      "Service offering / pricing",
      "Target market segment",
      "Brand voice და tone",
      "Customer support quality (UX signal Google-ისთვის)",
    ],
  },
];

// ── Timeline (static template, can be customized later) ────────────────

const STANDARD_TIMELINE: TimelinePhase[] = [
  {
    label: "თვე 1",
    title: "Audit + Technical Foundation",
    items: [
      "სრული SEO აუდიტი (ეს რაც გავაკეთეთ)",
      "ტექნიკური ფიქსები - robots.txt, sitemap, canonical, HTTPS, headers",
      "Google Search Console + Analytics 4 setup",
      "Initial keyword research",
    ],
  },
  {
    label: "თვე 2-3",
    title: "On-Page + Schema",
    items: [
      "ყოველი მთავარი გვერდის title/meta optimization",
      "JSON-LD schema implementation (Organization, FAQ, Product)",
      "Open Graph + Twitter Card-ის გასწორება",
      "Internal linking structure (pillar + cluster)",
      "Performance optimization round 1 (LCP, images)",
    ],
  },
  {
    label: "თვე 4-6",
    title: "Content Strategy + AI-era",
    items: [
      "Content briefs ცალკეული target keyword-ისთვის",
      "llms.txt + AI bot rules",
      "FAQ Schema massive deployment",
      "Internal linking density optimization",
      "First quarterly review",
    ],
  },
  {
    label: "თვე 7-12",
    title: "Ongoing optimization",
    items: [
      "ყოველთვიური SEO ანგარიში",
      "Algorithm update response (Google core updates)",
      "Content gap analysis vs competitors (quarterly)",
      "Continuous performance optimization",
      "Strategy adjustments",
    ],
  },
];

// ── Expected Outcomes (template) ──────────────────────────────────────

function buildOutcomes(currentScore: number): ExpectedOutcome[] {
  return [
    {
      metric: "ტექნიკური SEO ქულა",
      current: `${currentScore}/100`,
      target: "90+/100",
      timeframe: "3 თვე",
    },
    {
      metric: "Google ხილვადობა (impressions)",
      current: "baseline",
      target: "+50-150%",
      timeframe: "6 თვე",
    },
    {
      metric: "ორგანული traffic",
      current: "baseline",
      target: "+30-100%",
      timeframe: "6-12 თვე",
    },
    {
      metric: "Core Web Vitals - სრულად მწვანე",
      current: "მერყევი",
      target: "ყველა LCP/INP/CLS მწვანე ზონაში",
      timeframe: "2-3 თვე",
    },
    {
      metric: "AI ციტირება (ChatGPT/Perplexity)",
      current: "უხილავი",
      target: "ცნობადობა AI-ის პასუხებში",
      timeframe: "6-9 თვე",
    },
  ];
}

// ── Exclusions (what's NOT in this offer) ──────────────────────────────

const STANDARD_EXCLUSIONS: string[] = [
  "კონტენტის წერა (blog სტატიები, product copy) - separate retainer სჭირდება ან კლიენტი თვით ქმნის",
  "Paid advertising management (Google Ads, Meta Ads) - ცალკე სერვისია",
  "ვებსაიტის development / რედიზაინი - საჭიროების შემთხვევაში გვაქვს partner-ები",
  "Email marketing კამპანიები",
  "Social media management",
  "Direct outreach (PR, ბლოგერებთან cold contact)",
  "Reputation management - Crisis PR ცალკე ექსპერტიზაა",
  "Translation / localization - ცალკე ენაში გაცემული გვერდები",
];

// ── Executive Summary template ─────────────────────────────────────────

function buildExecutiveSummary(
  hostname: string,
  score: number,
  topIssues: CheckResult[]
): string {
  const standing =
    score >= 85
      ? "ძლიერ მდგომარეობაში"
      : score >= 65
      ? "კარგ მდგომარეობაში"
      : score >= 45
      ? "საშუალო მდგომარეობაში"
      : "გასაუმჯობესებელ მდგომარეობაში";

  const focus =
    topIssues.length > 0
      ? topIssues
          .slice(0, 3)
          .map((c) => c.label)
          .join(", ")
      : "ცალკეული fine-tuning";

  return `თქვენი საიტი - ${hostname} - ტექნიკურად ${standing}ა (${score}/100 ქულა). მთავარი გასაუმჯობესებელი წერტილებია: ${focus}. ეს შეთავაზება გადახედავს როგორ ვაუმჯობესებთ თქვენი საიტის ხილვადობას Google-სა და AI ძიებაში მომდევნო 12 თვის განმავლობაში - რას ჩვენ ვაკეთებთ და რა თქვენი ვალდებულებაა.`;
}

function topPriorityList(issues: Map<CategoryKey, CheckResult[]>): string[] {
  // Flatten all issues sorted by status severity, take top 3 distinct labels.
  const all: CheckResult[] = [];
  for (const checks of issues.values()) {
    all.push(...checks);
  }
  all.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "fail" ? -1 : 1;
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of all) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    out.push(`${c.label} - ${c.message}`);
    if (out.length >= 3) break;
  }
  return out;
}

// ── Public builder ─────────────────────────────────────────────────────

export function buildSeoOffer(
  analysis: AnalysisResult,
  options?: { finalUrl?: string }
): SeoOffer {
  const siteUrl = options?.finalUrl ?? analysis.url;
  const hostname = hostFromUrl(siteUrl);
  const score = analysis.summary.score;

  const issuesByCategory = collectIssues(analysis);
  // Flatten for top priorities and exec summary.
  const allFails: CheckResult[] = [];
  for (const checks of issuesByCategory.values()) {
    for (const c of checks) {
      if (c.status === "fail") allFails.push(c);
    }
  }

  const services: ServiceCategory[] = CATEGORY_SERVICE_ORDER.map((id) => {
    const base = STATIC_SERVICES[id];
    // Audit-driven items come from the matching analysis category. For
    // content-strategy and monitoring we have no audit data - items stay
    // empty and the static deliverables carry the section.
    let items: ServiceItem[] = [];
    if (id !== "content-strategy" && id !== "monitoring") {
      const catIssues = issuesByCategory.get(id as CategoryKey) ?? [];
      items = issuesToItems(catIssues);
    }
    return { ...base, items };
  });

  return {
    siteUrl,
    hostname,
    generatedAt: new Date().toISOString(),
    currentScore: score,
    executiveSummary: buildExecutiveSummary(hostname, score, allFails),
    topPriorities: topPriorityList(issuesByCategory),
    services,
    clientResponsibilities: CLIENT_RESPONSIBILITIES,
    timeline: STANDARD_TIMELINE,
    expectedOutcomes: buildOutcomes(score),
    exclusions: STANDARD_EXCLUSIONS,
  };
}
