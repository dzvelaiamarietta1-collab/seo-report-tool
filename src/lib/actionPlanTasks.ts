// SEO action plan catalogue - clean Georgian task list spanning every
// SEO surface INFINITY commonly delivers. Each task carries:
//   - category (swimlane on the Gantt)
//   - weeks (how long the task takes)
//   - priority (1 critical → 3 nice-to-have)
//   - phase (audit → implement → optimize → monitor)
//   - minDuration (smallest engagement plan that includes this task)
//
// Adding a task: insert with a stable id, pick the smallest minDuration
// that the engagement realistically supports, and the scheduler will
// place it into the right week automatically.

export type TaskCategory =
  | "technical"
  | "onpage"
  | "performance"
  | "schema"
  | "content"
  | "offpage"
  | "local"
  | "analytics"
  | "reports";

export type TaskPhase = "audit" | "implement" | "optimize" | "monitor";

export type TaskPriority = 1 | 2 | 3;
export type PlanDuration = 1 | 3 | 6;

export type Task = {
  id: string;
  category: TaskCategory;
  title: string;
  description: string;
  deliverable: string;
  weeks: number;
  priority: TaskPriority;
  phase: TaskPhase;
  minDuration: PlanDuration;
};

export const CATEGORY_META: Record<
  TaskCategory,
  { label: string; short: string; color: string; order: number }
> = {
  technical: {
    label: "ტექნიკური SEO",
    short: "ტექნიკური",
    color: "#2F3E2E",
    order: 1,
  },
  onpage: {
    label: "On-Page ოპტიმიზაცია",
    short: "On-Page",
    color: "#4A5E48",
    order: 2,
  },
  performance: {
    label: "სიჩქარე / Core Web Vitals",
    short: "სიჩქარე",
    color: "#6E7C68",
    order: 3,
  },
  schema: {
    label: "Schema Markup",
    short: "Schema",
    color: "#8AA088",
    order: 4,
  },
  content: {
    label: "კონტენტ-სტრატეგია",
    short: "კონტენტი",
    color: "#A4B09B",
    order: 5,
  },
  offpage: {
    label: "Off-Page / Backlinks",
    short: "Off-Page",
    color: "#B8843E",
    order: 6,
  },
  local: {
    label: "Local SEO",
    short: "Local",
    color: "#6E867A",
    order: 7,
  },
  analytics: {
    label: "ანალიტიკა და ტრექინგი",
    short: "ანალიტიკა",
    color: "#5C6E6A",
    order: 8,
  },
  reports: {
    label: "მონიტორინგი და რეპორტინგი",
    short: "რეპორტი",
    color: "#7C8C7A",
    order: 9,
  },
};

export const TASKS: Task[] = [
  // ─── ფუძემდებლური (პირველ კვირაში) ───────────────────────────────────
  // Google Search Console ვერიფიკაცია ყველაფრის წინაპირობაა -
  // ამის გარეშე ranking, crawl errors, performance data არ მოგვცემს
  // Google-ის ჩვენებებს.
  {
    id: "analytics-gsc",
    category: "analytics",
    title: "Google Search Console-ის ვერიფიკაცია",
    description:
      "Domain property + URL property-ის შექმნა, sitemap-ის submit, baseline data-ის export. ეს ყველაფრის წინაპირობაა - ranking + crawl monitoring უამისოდ შეუძლებელია.",
    deliverable: "ცოცხალი GSC access + baseline რეპორტი.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },

  // ─── ტექნიკური SEO ──────────────────────────────────────────────────
  {
    id: "tech-https-audit",
    category: "technical",
    title: "HTTPS-ის სრული აუდიტი",
    description:
      "SSL სერტიფიკატის ვადის, weak cipher suite-ების, mixed content-ისა და HSTS-ის შემოწმება.",
    deliverable: "ანგარიში პრობლემური წერტილებით და გასწორების ნაბიჯებით.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "tech-robots-txt",
    category: "technical",
    title: "robots.txt-ის შემოწმება და განახლება",
    description:
      "Disallow წესების, sitemap-ის ბმულის და crawler-სპეციფიკური წესების ნორმალიზაცია.",
    deliverable: "გასწორებული robots.txt + ცვლილებების ლოგი.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "tech-sitemap",
    category: "technical",
    title: "XML sitemap-ის გენერაცია და GSC-ში დარეგისტრირება",
    description:
      "მთლიანი საიტის struktura, lastmod, priority-ის ლოგიკის შემოღება.",
    deliverable: "ცოცხალი sitemap.xml + GSC დადასტურება.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "tech-canonicals",
    category: "technical",
    title: "Canonical Tag-ების მთლიანი აუდიტი",
    description:
      "Duplicate URL-ების იდენტიფიკაცია, self-canonical დაცვა, parameter handling.",
    deliverable: "გასწორებული canonical strategy ყველა template-ზე.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "tech-hreflang",
    category: "technical",
    title: "Hreflang მარკაპის შემოწმება (ka/en)",
    description:
      "ენების შესაბამისობების სრული რუკა, reciprocal tag-ების ვალიდაცია.",
    deliverable: "ცოცხალი hreflang setup ან XML-ში სქოპირებული.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "tech-security-headers",
    category: "technical",
    title: "Security Headers-ის დაყენება",
    description:
      "CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy ჰედერების კონფიგურაცია.",
    deliverable: "სერვერის კონფიგი + Mozilla Observatory შემოწმება.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "tech-soft-404",
    category: "technical",
    title: "Soft 404 გვერდების იდენტიფიკაცია",
    description:
      "200-ით პასუხის გამცემი ცარიელი/მცდარი გვერდების ლოგი და გასწორება.",
    deliverable: "სია გასწორებული გვერდებით.",
    weeks: 1,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "tech-redirect-chains",
    category: "technical",
    title: "Redirect ჯაჭვების გასუფთავება",
    description:
      "ერთბიჯიანი 301-ებად გარდაქმნა, infinite loop-ების ლიკვიდაცია.",
    deliverable: "redirect map ფაილი + სერვერის კონფიგი.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "tech-cache-control",
    category: "technical",
    title: "Cache-Control headers-ის ოპტიმიზაცია",
    description:
      "სტატიკური რესურსების long-cache, HTML-ის short-cache, ETag პოლიტიკა.",
    deliverable: "cache strategy დოკუმენტი + ცოცხალი kanfig.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "tech-url-structure",
    category: "technical",
    title: "URL სტრუქტურის ნორმალიზაცია",
    description:
      "Trailing slash, lowercase, parameter cleanup, breadcrumb-friendly slug-ები.",
    deliverable: "URL ცვლილებების სია + 301 redirect map.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "tech-robots-meta",
    category: "technical",
    title: "Robots meta tag-ების შემოწმება",
    description:
      "შემთხვევითი noindex/nofollow flag-ების იდენტიფიკაცია, sensitive გვერდების ნორმალიზაცია.",
    deliverable: "სრული meta robots ცხრილი template-ების მიხედვით.",
    weeks: 1,
    priority: 2,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "tech-crawl-budget",
    category: "technical",
    title: "Crawl Budget-ის ანალიზი",
    description:
      "GSC log-ების ანალიზი - სად ხარჯავს Googlebot crawl-ის რესურსს და სად აკლია.",
    deliverable: "crawl strategy რეპორტი + სამოქმედო რეკომენდაციები.",
    weeks: 2,
    priority: 3,
    phase: "audit",
    minDuration: 6,
  },
  {
    id: "tech-pagination",
    category: "technical",
    title: "Pagination სტრუქტურის ნორმალიზაცია",
    description:
      "ბლოგისა და კატალოგის pagination - სწორი canonical, hreflang და crawl behavior.",
    deliverable: "გასწორებული pagination template.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "tech-mobile-first",
    category: "technical",
    title: "Mobile-First Indexing-ის გადახედვა",
    description:
      "მობილური ვერსიის სრული შემოწმება - content parity, viewport, tap target sizes.",
    deliverable: "მობილური audit რეპორტი + სამოქმედო სია.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "tech-broken-links",
    category: "technical",
    title: "გაფუჭებული ბმულების სრული სქანი",
    description:
      "შიდა და გარე 404 ბმულების სია, prioritised by traffic-ი და გასწორება.",
    deliverable: "broken-link რეპორტი + გასწორებული ბმულები.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "tech-rss-feed",
    category: "technical",
    title: "RSS feed-ის ვალიდურობა",
    description:
      "ბლოგის RSS/Atom feed-ის სტრუქტურის შემოწმება - feed reader-ებში სწორი render-ი, lastBuildDate, item-ების სრულფასოვანი metadata.",
    deliverable: "ვალიდური RSS feed + W3C Feed Validator გავლა.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },
  {
    id: "tech-sitemap-extensions",
    category: "technical",
    title: "Image / Video Sitemap-ის დანერგვა",
    description:
      "XML sitemap-ის გაფართოება image და video ცნობებით - Google Images და Video Search-ში უკეთესი ხილვადობა.",
    deliverable: "image-sitemap.xml + video-sitemap.xml + GSC submission.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },

  // ─── On-Page SEO ──────────────────────────────────────────────────────
  {
    id: "onpage-title-tags",
    category: "onpage",
    title: "Title Tag-ების სრულ-საიტიანი გადახედვა",
    description:
      "ყველა გვერდისთვის უნიკალური title - keyword + brand + CTR-ის ფოკუსით.",
    deliverable: "ცხრილი ძველი vs ახალი title-ებით + იმპლემენტაცია.",
    weeks: 2,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "onpage-meta-desc",
    category: "onpage",
    title: "Meta Description-ების ხელახლა დაწერა",
    description:
      "150-160 სიმბოლო, action verb-ით დაწყება, CTR-ის გასაუმჯობესებლად.",
    deliverable: "სრული meta description ცხრილი.",
    weeks: 2,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "onpage-headings",
    category: "onpage",
    title: "H1-H6 იერარქიის ნორმალიზაცია",
    description:
      "ერთი H1 თითო გვერდზე, ლოგიკური nesting, keyword-rich subheadings.",
    deliverable: "გასწორებული heading სტრუქტურა template-ის დონეზე.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "onpage-alt-text",
    category: "onpage",
    title: "ALT ტექსტების სრულფასოვანი დაწერა",
    description:
      "ყველა მნიშვნელოვანი სურათისთვის - accessible, descriptive, keyword-aware.",
    deliverable: "alt-text ცხრილი + იმპლემენტაცია CMS-ში.",
    weeks: 2,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "onpage-internal-linking",
    category: "onpage",
    title: "შიდა Linking სტრუქტურის რეფაქტორი",
    description:
      "Pillar/cluster ლოგიკის შემოღება - orphan გვერდების ლიკვიდაცია.",
    deliverable: "internal linking რუკა + იმპლემენტაცია.",
    weeks: 2,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "onpage-anchor-text",
    category: "onpage",
    title: "Anchor Text-ის გასუფთავება",
    description:
      "Over-optimised exact-match vs natural variation-ის ბალანსი.",
    deliverable: "anchor text ცხრილი + ცვლილებების ლოგი.",
    weeks: 1,
    priority: 3,
    phase: "optimize",
    minDuration: 6,
  },
  {
    id: "onpage-content-depth",
    category: "onpage",
    title: "Top 20 გვერდის Content Depth აუდიტი",
    description:
      "სიგრძე, ხარისხი, კონკურენტთან შედარება - გასაფართოვებელი გვერდების სია.",
    deliverable: "content depth რეპორტი + სამოქმედო პლანი.",
    weeks: 2,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "onpage-breadcrumbs",
    category: "onpage",
    title: "Breadcrumb Navigation-ის დანერგვა",
    description:
      "სრული breadcrumb trail ყველა გვერდზე + schema markup.",
    deliverable: "ცოცხალი breadcrumbs + JSON-LD.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "onpage-duplicate-content",
    category: "onpage",
    title: "Duplicate Content-ის სქანი",
    description:
      "Thin content, AI-generated boilerplate, parameter duplicates-ის გასუფთავება.",
    deliverable: "duplicate ცხრილი + canonical/noindex სტრატეგია.",
    weeks: 1,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "onpage-url-slugs",
    category: "onpage",
    title: "URL Slug-ების SEO-friendly გადახედვა",
    description:
      "მოკლე, keyword-rich, hyphen-separated, lowercase, ენისთვის ადაპტირებული.",
    deliverable: "slug ცვლილებების სია + 301 map.",
    weeks: 1,
    priority: 3,
    phase: "optimize",
    minDuration: 6,
  },
  {
    id: "onpage-top-pages",
    category: "onpage",
    title: "მთავარი Landing Page-ის ოპტიმიზაცია",
    description:
      "Hero copy, value proposition, CTA-ის გადახედვა SEO და CRO-ის თვალით.",
    deliverable: "ცოცხალი ოპტიმიზებული landing.",
    weeks: 2,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  // ─── სიჩქარე / Core Web Vitals ───────────────────────────────────────
  {
    id: "perf-lcp",
    category: "performance",
    title: "LCP-ის (Largest Contentful Paint) ოპტიმიზაცია",
    description:
      "Hero image preload, server response time, render-blocking resources.",
    deliverable: "ცოცხალი LCP <2.5s ყველა template-ზე.",
    weeks: 2,
    priority: 1,
    phase: "optimize",
    minDuration: 1,
  },
  {
    id: "perf-inp",
    category: "performance",
    title: "INP-ის (Interaction to Next Paint) გაუმჯობესება",
    description:
      "JavaScript execution-ის რეფაქტორი, long task-ების დაყოფა.",
    deliverable: "ცოცხალი INP <200ms.",
    weeks: 2,
    priority: 1,
    phase: "optimize",
    minDuration: 1,
  },
  {
    id: "perf-cls",
    category: "performance",
    title: "CLS-ის (Cumulative Layout Shift) გასწორება",
    description:
      "Reserved space სურათებისთვის, font-display strategy, web font swap.",
    deliverable: "ცოცხალი CLS <0.1.",
    weeks: 1,
    priority: 1,
    phase: "optimize",
    minDuration: 1,
  },
  {
    id: "perf-js-bundle",
    category: "performance",
    title: "JavaScript Bundle-ის შემცირება",
    description:
      "Code splitting, tree shaking, unused dependency-ების ლიკვიდაცია.",
    deliverable: "bundle size რეპორტი + cleaned build.",
    weeks: 2,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "perf-css",
    category: "performance",
    title: "CSS-ის ოპტიმიზაცია",
    description:
      "Unused CSS removal, critical CSS extraction, minification.",
    deliverable: "ცოცხალი ოპტიმიზებული CSS pipeline.",
    weeks: 1,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "perf-fonts",
    category: "performance",
    title: "Web Font-ების ჩატვირთვის ოპტიმიზაცია",
    description:
      "Preload critical fonts, font-display: swap, subset to Latin/Georgian only.",
    deliverable: "font loading strategy + ცოცხალი იმპლემენტაცია.",
    weeks: 1,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "perf-third-party",
    category: "performance",
    title: "Third-Party Script-ების აუდიტი",
    description:
      "Tag manager-ის გასუფთავება, async/defer, unused tracker-ების მოშორება.",
    deliverable: "third-party რეპორტი + cleaned tag manager.",
    weeks: 1,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "perf-cdn",
    category: "performance",
    title: "CDN Setup და სტატიკური Asset Distribution",
    description:
      "Cloudflare/Bunny/Vercel Edge - geographic distribution + image optimization.",
    deliverable: "ცოცხალი CDN setup.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "perf-images",
    category: "performance",
    title: "Image Optimization Pipeline",
    description:
      "WebP/AVIF conversion, responsive srcset, lazy loading.",
    deliverable: "ცოცხალი image pipeline + არსებული სურათების კონვერსია.",
    weeks: 2,
    priority: 1,
    phase: "optimize",
    minDuration: 1,
  },
  {
    id: "perf-lazy-loading",
    category: "performance",
    title: "Lazy Loading-ის იმპლემენტაცია",
    description:
      "Below-the-fold სურათების, iframe-ების და heavy widget-ების lazy load.",
    deliverable: "ცოცხალი lazy loading template-ის დონეზე.",
    weeks: 1,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "perf-http2",
    category: "performance",
    title: "HTTP/2 / HTTP/3-ის ჩართვა",
    description:
      "Multiplexed connection, server push (HTTP/2), QUIC support (HTTP/3).",
    deliverable: "ცოცხალი HTTP/3 ან HTTP/2 + ვერიფიკაცია.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },

  // ─── Schema Markup ────────────────────────────────────────────────────
  {
    id: "schema-organization",
    category: "schema",
    title: "Organization Schema-ს დანერგვა",
    description:
      "კომპანიის სრული Knowledge Graph profile - logo, address, sameAs links.",
    deliverable: "ცოცხალი JSON-LD + Rich Results Test გავლა.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "schema-product",
    category: "schema",
    title: "Product Schema-ს დანერგვა",
    description:
      "ფასი, ხელმისაწვდომობა, რეიტინგი, brand, GTIN/SKU - Google Shopping-თვის მზადყოფნა და SERP-ში rich result-ი.",
    deliverable: "ცოცხალი Product schema ყველა პროდუქტზე.",
    weeks: 2,
    priority: 1,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "schema-article",
    category: "schema",
    title: "Article / BlogPosting Schema",
    description:
      "Author, datePublished, dateModified, image, headline ყველა ბლოგ-პოსტზე.",
    deliverable: "ცოცხალი Article schema ცოცხალ ბლოგზე.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "schema-faq",
    category: "schema",
    title: "FAQ Schema-ს დანერგვა",
    description:
      "FAQ გვერდებზე question/answer pair-ების მარკაპი - SERP rich result.",
    deliverable: "ცოცხალი FAQ schema.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "schema-breadcrumb",
    category: "schema",
    title: "Breadcrumb Schema",
    description:
      "BreadcrumbList JSON-LD ყველა inner page-ზე.",
    deliverable: "ცოცხალი BreadcrumbList schema.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "schema-localbusiness",
    category: "schema",
    title: "LocalBusiness Schema",
    description:
      "Address, opening hours, geo coordinates, telephone - Local Pack ready.",
    deliverable: "ცოცხალი LocalBusiness schema.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "schema-review",
    category: "schema",
    title: "Review / AggregateRating Schema",
    description:
      "კლიენტების review-ების მარკაპი - yellow stars in SERP.",
    deliverable: "ცოცხალი Review schema.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },
  {
    id: "schema-howto",
    category: "schema",
    title: "HowTo / Recipe Schema-ს დანერგვა",
    description:
      "Step-by-step content-ის სტრუქტურირებული მარკაპი - instructional გვერდებზე rich result.",
    deliverable: "ცოცხალი HowTo schema.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },
  {
    id: "schema-event",
    category: "schema",
    title: "Event Schema-ს დანერგვა",
    description:
      "მომავალი event-ების სტრუქტურირებული მარკაპი - date, location, ticket info.",
    deliverable: "ცოცხალი Event schema.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },

  // ─── კონტენტ-სტრატეგია ────────────────────────────────────────────────
  {
    id: "content-keyword-research",
    category: "content",
    title: "Keyword Research - 50 ძირითადი ფრაზა",
    description:
      "მოცულობა, competition, intent - ცხრილი ქართულად + ინგლისურად.",
    deliverable: "keyword ცხრილი GoogleSheets-ში + GSC baseline.",
    weeks: 2,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "content-pillar-pages",
    category: "content",
    title: "Pillar Page-ების სტრუქტურის დიზაინი",
    description:
      "3-5 ძირითადი pillar page - comprehensive guide format.",
    deliverable: "pillar page-ის blueprint + outline.",
    weeks: 2,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "content-topic-clusters",
    category: "content",
    title: "Topic Cluster Mapping",
    description:
      "თითო pillar-ისთვის 5-10 supporting article-ი - internal linking-თ.",
    deliverable: "topic cluster რუკა + content brief-ები.",
    weeks: 2,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "content-gap-analysis",
    category: "content",
    title: "Content Gap Analysis",
    description:
      "კონკურენტებთან შედარებით - რა keyword-ებზე rank-დებიან ისინი და ჩვენ არ.",
    deliverable: "gap ცხრილი + prioritized content სია.",
    weeks: 2,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },
  {
    id: "content-calendar",
    category: "content",
    title: "Blog Content Calendar - 3-12 თვის გრაფიკი",
    description:
      "ყოველთვიური 4-8 article-ი, თარიღი, ავტორი, keyword-ი, brief.",
    deliverable: "content calendar GoogleSheets-ში + briefs.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "content-refresh",
    category: "content",
    title: "Top 10 Underperforming გვერდის Refresh",
    description:
      "არსებული content-ის გაფართოება - keyword expansion, depth, schema, internal links.",
    deliverable: "10 ცოცხალი refreshed გვერდი.",
    weeks: 3,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "content-faq-page",
    category: "content",
    title: "FAQ გვერდის შექმნა",
    description:
      "ხშირი კითხვები + answer-ები, organized by topic, schema markup-ით.",
    deliverable: "ცოცხალი FAQ გვერდი + FAQ schema.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "content-longtail-pages",
    category: "content",
    title: "Long-Tail Keyword Landing Pages",
    description:
      "10-20 long-tail keyword-ისთვის dedicated landing page-ი.",
    deliverable: "ცოცხალი 10-20 long-tail გვერდი.",
    weeks: 3,
    priority: 2,
    phase: "implement",
    minDuration: 6,
  },
  {
    id: "content-about-pages",
    category: "content",
    title: "About / Service Pages-ის SEO Copywriting",
    description:
      "Brand story, team, value proposition - E-A-T-friendly copy.",
    deliverable: "ცოცხალი ოპტიმიზებული about/service გვერდები.",
    weeks: 2,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "content-blog-posts",
    category: "content",
    title: "ბლოგ-პოსტების წერა - 4-8 თვეში",
    description:
      "Content calendar-ის მიხედვით ცოცხალი publishing - long-form, keyword-aware.",
    deliverable: "ცოცხალი ბლოგ-პოსტები CMS-ში.",
    weeks: 6,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "content-thought-leadership",
    category: "content",
    title: "Thought Leadership კონტენტი",
    description:
      "Industry insights, original research, data-driven articles - E-A-T-ის გასაძლიერებლად.",
    deliverable: "2-4 long-form research piece.",
    weeks: 4,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },

  // ─── Off-Page / Backlinks ────────────────────────────────────────────
  {
    id: "offpage-backlink-audit",
    category: "offpage",
    title: "Backlink Profile-ის სრული აუდიტი",
    description:
      "Ahrefs/SEMrush-ით ცოცხალი backlink-ების ცხრილი, DR/DA distribution.",
    deliverable: "backlink რეპორტი + toxic flags.",
    weeks: 1,
    priority: 1,
    phase: "audit",
    minDuration: 1,
  },
  {
    id: "offpage-disavow",
    category: "offpage",
    title: "Toxic Backlink Disavow",
    description:
      "Spammy domain-ების იდენტიფიკაცია, disavow file-ის შექმნა და GSC submit.",
    deliverable: "ცოცხალი disavow file + GSC დადასტურება.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "offpage-citations",
    category: "offpage",
    title: "Citation Building - ქართულ ბიზნეს-კატალოგებში",
    description:
      "info-tbilisi.com, business.gov.ge, allbiz.ge, yellowpages.ge და სხვა ქართულ ბიზნეს-დირექტორიებში პროფილების შექმნა + NAP-კონსისტენტობის დაცვა.",
    deliverable: "10+ ცოცხალი citation + NAP audit ცხრილი.",
    weeks: 2,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "offpage-guest-posts",
    category: "offpage",
    title: "Guest Posting Outreach",
    description:
      "5-10 publication-ის შერჩევა, pitch outreach, content-ის შექმნა და გამოქვეყნება backlink-ით.",
    deliverable: "ცოცხალი 3-5 guest post backlink.",
    weeks: 3,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },
  {
    id: "offpage-brand-mentions",
    category: "offpage",
    title: "Brand Mention Monitoring + Claiming",
    description:
      "Unlinked brand mention-ების იდენტიფიკაცია, owner-სთან გადაქცევა linked-ად.",
    deliverable: "ცოცხალი 3-5 ახალი linked mention.",
    weeks: 2,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },
  {
    id: "offpage-nap",
    category: "offpage",
    title: "NAP (Name/Address/Phone) Consistency Check",
    description:
      "ყველა online ბაზაში NAP-ის ერთგვაროვნება.",
    deliverable: "NAP audit + გასწორებული inconsistencies.",
    weeks: 1,
    priority: 2,
    phase: "audit",
    minDuration: 3,
  },

  // ─── Local SEO ────────────────────────────────────────────────────────
  {
    id: "local-gbp",
    category: "local",
    title: "Google Business Profile-ის სრული ოპტიმიზაცია",
    description:
      "სრული profile - categories, attributes, services, photos, posts.",
    deliverable: "ცოცხალი ოპტიმიზებული GBP.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "local-maps",
    category: "local",
    title: "Google Maps-ის ოპტიმიზაცია",
    description:
      "Pin location, geo-coordinates, embed code სრულ accuracy-თ.",
    deliverable: "ცოცხალი Maps-ის embed + verification.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "local-reviews",
    category: "local",
    title: "Review Generation Strategy",
    description:
      "კმაყოფილი კლიენტებიდან review-ების შეგროვების workflow.",
    deliverable: "review workflow + email template-ები.",
    weeks: 2,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "local-multi-city",
    category: "local",
    title: "Multi-City Landing Pages-ის შექმნა",
    description:
      "Location-specific გვერდები საქალაქო keyword-ებისთვის - თბილისი, ბათუმი, ქუთაისი და სხვა.",
    deliverable: "ცოცხალი 3+ ქალაქის landing.",
    weeks: 2,
    priority: 3,
    phase: "implement",
    minDuration: 6,
  },

  // ─── ანალიტიკა და ტრექინგი ──────────────────────────────────────────
  {
    id: "analytics-ga4",
    category: "analytics",
    title: "Google Analytics 4-ის სრული Setup",
    description:
      "Property creation, data stream, enhanced measurement, custom events.",
    deliverable: "ცოცხალი GA4 + ცხრილი დანერგილი event-ებით.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "analytics-goals",
    category: "analytics",
    title: "Conversion Goal-ების კონფიგურაცია",
    description:
      "Form submit, call click, purchase, scroll depth-ის ტრექინგი.",
    deliverable: "ცოცხალი conversion event-ები GA4-ში.",
    weeks: 1,
    priority: 1,
    phase: "implement",
    minDuration: 1,
  },
  {
    id: "analytics-heatmap",
    category: "analytics",
    title: "Heatmap და Session Recording Setup",
    description:
      "Microsoft Clarity ან Hotjar - ცოცხალი user behavior data.",
    deliverable: "ცოცხალი heatmap dashboard.",
    weeks: 1,
    priority: 2,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "analytics-utm",
    category: "analytics",
    title: "UTM Tagging Convention",
    description:
      "ერთიანი UTM სქემა ყველა marketing channel-ისთვის.",
    deliverable: "UTM playbook + ცოცხალი იმპლემენტაცია.",
    weeks: 1,
    priority: 3,
    phase: "implement",
    minDuration: 3,
  },
  {
    id: "analytics-gtm",
    category: "analytics",
    title: "Google Tag Manager Cleanup",
    description:
      "Unused tag-ების მოშორება, dataLayer normalization, version control.",
    deliverable: "გასუფთავებული GTM workspace.",
    weeks: 1,
    priority: 2,
    phase: "optimize",
    minDuration: 3,
  },
  {
    id: "analytics-attribution",
    category: "analytics",
    title: "Attribution Model-ის ანალიზი",
    description:
      "Multi-touch attribution - რომელი channel-ი მართლა ცვლის conversion-ს.",
    deliverable: "attribution რეპორტი + recommendation-ები.",
    weeks: 2,
    priority: 3,
    phase: "optimize",
    minDuration: 6,
  },

  // ─── მონიტორინგი და რეპორტინგი ──────────────────────────────────────
  {
    id: "reports-position-tracking",
    category: "reports",
    title: "Weekly Position Tracking",
    description:
      "20-50 ძირითადი keyword-ის ცოცხალი ranking - დიდი ცვლილებების alert-ით.",
    deliverable: "ცოცხალი ranking dashboard + weekly snapshot.",
    weeks: 1,
    priority: 1,
    phase: "monitor",
    minDuration: 1,
  },
  {
    id: "reports-monthly",
    category: "reports",
    title: "Monthly Traffic + Ranking რეპორტი",
    description:
      "INFINITY brand-ით PDF რეპორტი - traffic, conversions, ranking changes, action items.",
    deliverable: "ცოცხალი monthly PDF რეპორტი.",
    weeks: 1,
    priority: 1,
    phase: "monitor",
    minDuration: 1,
  },
  {
    id: "reports-competitor",
    category: "reports",
    title: "Competitor Monitoring Dashboard",
    description:
      "3-5 კონკურენტის ranking, traffic estimate, new content-ის ცოცხალი ტრექი.",
    deliverable: "ცოცხალი competitor dashboard.",
    weeks: 2,
    priority: 2,
    phase: "monitor",
    minDuration: 3,
  },
  {
    id: "reports-crawl-alerts",
    category: "reports",
    title: "Crawl Error Alerting",
    description:
      "GSC-დან crawl error-ების email/Slack alert-ი.",
    deliverable: "ცოცხალი alert pipeline.",
    weeks: 1,
    priority: 2,
    phase: "monitor",
    minDuration: 3,
  },
  {
    id: "reports-uptime",
    category: "reports",
    title: "Uptime Monitoring Setup",
    description:
      "UptimeRobot ან Better Stack - downtime-ის ცოცხალი ტრექი.",
    deliverable: "ცოცხალი uptime monitoring + alert-ი.",
    weeks: 1,
    priority: 2,
    phase: "monitor",
    minDuration: 3,
  },
  {
    id: "reports-cwv",
    category: "reports",
    title: "Core Web Vitals Continuous Monitoring",
    description:
      "CrUX data + lab data ცოცხალი ტრექი - regression-ის early warning.",
    deliverable: "ცოცხალი CWV dashboard.",
    weeks: 1,
    priority: 2,
    phase: "monitor",
    minDuration: 3,
  },
  {
    id: "reports-quarterly-review",
    category: "reports",
    title: "Quarterly Strategy Review",
    description:
      "Q-on-Q performance review + სტრატეგიის შესწორებები.",
    deliverable: "quarterly slide deck + meeting.",
    weeks: 1,
    priority: 2,
    phase: "monitor",
    minDuration: 6,
  },
];

export const PLAN_DURATIONS: { value: PlanDuration; label: string; weeks: number }[] = [
  { value: 1, label: "1 თვე", weeks: 4 },
  { value: 3, label: "3 თვე", weeks: 13 },
  { value: 6, label: "6 თვე", weeks: 26 },
];
