import type { CheckResult } from "./types";

export interface FixTemplate {
  title: string;
  language: string;
  filename?: string;
  code: string;
  note?: string;
}

export interface FixContext {
  url: string;
  finalUrl: string;
  host: string;
  origin: string;
}

export function buildFixContext(rawUrl: string, finalUrl?: string): FixContext {
  const target = finalUrl ?? rawUrl;
  let host = "example.com";
  let origin = "https://example.com";
  try {
    const u = new URL(target.startsWith("http") ? target : `https://${target}`);
    host = u.host;
    origin = u.origin;
  } catch {
    // ignore
  }
  return { url: rawUrl, finalUrl: target, host, origin };
}

type FixGenerator = (
  ctx: FixContext,
  value?: CheckResult["value"]
) => FixTemplate[] | null;

const today = () => new Date().toISOString().slice(0, 10);

const FIX_GENERATORS: Record<string, FixGenerator> = {
  "Title Tag": (_, value) => {
    const current = typeof value === "string" ? value.trim() : "";
    return [
      {
        title: "Title tag - შაბლონი",
        language: "html",
        code: `<title>${current || "თქვენი ბრენდი"} | მთავარი საკვანძო სიტყვა - ლოკაცია/სერვისი</title>`,
        note: "ოპტიმალური 50-60 სიმბოლო. მთავარი საკვანძო სიტყვა დასაწყისში.",
      },
    ];
  },

  "Meta Description": () => [
    {
      title: "Meta Description",
      language: "html",
      code: `<meta name="description" content="თქვენი საიტის ხანმოკლე აღწერა - რას სთავაზობთ, ვის ეხმარებით და რა არის უნიკალური. 140-160 სიმბოლო - Google ჩამოაჭრის უფრო გრძელს.">`,
      note: "Active voice. CTR-ზე გავლენას ახდენს - წერეთ მიმზიდველად.",
    },
  ],

  "Canonical Tag": (ctx) => [
    {
      title: "Canonical link",
      language: "html",
      code: `<link rel="canonical" href="${ctx.finalUrl}">`,
      note: "ყოველი გვერდის canonical უნდა მიუთითებდეს მის საკუთარ URL-ზე ან master ვერსიაზე.",
    },
  ],

  "Mobile Viewport": () => [
    {
      title: "Viewport meta tag",
      language: "html",
      code: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
      note: "Mobile-friendly საიტებისთვის აუცილებელია - Google-ის Mobile-First Indexing.",
    },
  ],

  "Meta Robots": (_, value) => {
    const current = typeof value === "string" ? value : "";
    if (/noindex/i.test(current)) {
      return [
        {
          title: "ჩაანაცვლეთ noindex",
          language: "html",
          code: `<meta name="robots" content="index, follow">`,
          note: "noindex ნიშნავს რომ Google-ი ვერ ინდექსაციას უკეთებს გვერდს. შეცვალეთ ან ამოიღეთ tag.",
        },
      ];
    }
    return null;
  },

  "Security Headers": () => [
    {
      title: "Apache (.htaccess)",
      language: "apache",
      code: `# უსაფრთხოების headers
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'"`,
    },
    {
      title: "Nginx",
      language: "nginx",
      code: `# უსაფრთხოების headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'" always;`,
    },
  ],

  hreflang: (ctx) => [
    {
      title: "hreflang მაგალითი (3 ენა)",
      language: "html",
      code: `<link rel="alternate" hreflang="ka" href="${ctx.origin}/ka/">
<link rel="alternate" hreflang="en" href="${ctx.origin}/en/">
<link rel="alternate" hreflang="ru" href="${ctx.origin}/ru/">
<link rel="alternate" hreflang="x-default" href="${ctx.origin}/">`,
      note: "მხოლოდ მრავალენოვანი საიტებისთვის. x-default - ნაგულისხმევი ვერსია.",
    },
  ],

  "robots.txt": (ctx) => [
    {
      title: "robots.txt",
      language: "txt",
      filename: "robots.txt",
      code: `User-agent: *
Allow: /

# AI კრაულერები (2026)
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# Sitemap
Sitemap: ${ctx.origin}/sitemap.xml`,
      note: "ჩაწერეთ საიტის root-ში. AI-ბოტების Allow/Disallow თქვენი არჩევანია - ბრენდის AI-ხილვადობისთვის რეკომენდებულია Allow.",
    },
  ],

  "XML Sitemap": (ctx) => [
    {
      title: "sitemap.xml - საბაზო შაბლონი",
      language: "xml",
      filename: "sitemap.xml",
      code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ctx.origin}/</loc>
    <lastmod>${today()}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${ctx.origin}/about</loc>
    <lastmod>${today()}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${ctx.origin}/services</loc>
    <lastmod>${today()}</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>`,
      note: "WordPress-ისთვის - Yoast/RankMath ავტომატურად ქმნის. Google Search Console-ში დაარეგისტრირეთ შემდეგ.",
    },
  ],

  "Schema Markup (JSON-LD)": (ctx) => [
    {
      title: "Organization Schema (მთავარი გვერდისთვის)",
      language: "json",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "თქვენი კომპანიის სახელი",
  "url": "${ctx.origin}",
  "logo": "${ctx.origin}/logo.png",
  "description": "კომპანიის ხანმოკლე აღწერა",
  "sameAs": [
    "https://facebook.com/yourpage",
    "https://instagram.com/yourpage"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+995 XXX XXX XXX",
    "email": "info@${ctx.host}",
    "contactType": "customer service"
  }
}
</script>`,
      note: "მთავარი გვერდისთვის. პროდუქტებისთვის - Product schema, სტატიებისთვის - Article. sameAs-ში ჩასვით მხოლოდ ნამდვილი ანგარიშები.",
    },
  ],

  "Organization Schema": (ctx) => [
    {
      title: "Organization Schema (sameAs რგოლებით)",
      language: "json",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "თქვენი კომპანიის სახელი",
  "url": "${ctx.origin}",
  "logo": "${ctx.origin}/logo.png",
  "sameAs": [
    "https://facebook.com/yourpage",
    "https://instagram.com/yourpage",
    "https://linkedin.com/company/yourpage"
  ]
}
</script>`,
      note: "sameAs-ში ჩასვით მხოლოდ ნამდვილი ანგარიშები სოც.მედიაში ან ცნობარებში (Google Business Profile, ინდუსტრიული ცნობარები). Wikipedia მხოლოდ მაშინ, თუ ბრენდს ნამდვილად აქვს გვერდი - ცრუ ბმულები საზიანოა.",
    },
  ],

  "FAQ Schema": () => [
    {
      title: "FAQPage Schema",
      language: "json",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "რა არის თქვენი სერვისის ფასი?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "დეტალური პასუხი 1-3 წინადადებით."
      }
    },
    {
      "@type": "Question",
      "name": "რამდენ ხანში მოგაწვდით პროდუქტს?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "3-5 სამუშაო დღე საქართველოში."
      }
    }
  ]
}
</script>`,
      note: "AI Overviews-ში ციტირების ერთ-ერთი ყველაზე ძლიერი სიგნალი. გამოიყენეთ მხოლოდ რეალური Q&A კონტენტისთვის.",
    },
  ],

  "Open Graph": (ctx) => [
    {
      title: "Open Graph meta tags",
      language: "html",
      code: `<meta property="og:title" content="გვერდის სათაური">
<meta property="og:description" content="გვერდის აღწერა - 140-160 სიმბოლო.">
<meta property="og:image" content="${ctx.origin}/og-image.jpg">
<meta property="og:url" content="${ctx.finalUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${ctx.host}">
<meta property="og:locale" content="ka_GE">`,
      note: "og:image - 1200x630px, JPG/PNG, max 8MB. Facebook/LinkedIn გაზიარების preview-სთვის.",
    },
  ],

  "Twitter Card": (ctx) => [
    {
      title: "Twitter Card meta tags",
      language: "html",
      code: `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="გვერდის სათაური">
<meta name="twitter:description" content="გვერდის აღწერა.">
<meta name="twitter:image" content="${ctx.origin}/og-image.jpg">
<meta name="twitter:site" content="@yourtwitterhandle">`,
      note: "summary_large_image - დიდი ბანერით; summary - პატარა thumbnail-ით.",
    },
  ],

  "llms.txt": (ctx) => [
    {
      title: "llms.txt",
      language: "markdown",
      filename: "llms.txt",
      code: `# ${ctx.host}

> ერთი წინადადება - რას სთავაზობთ, ვის ეხმარებით.

## მთავარი გვერდები
- [მთავარი](${ctx.origin}/): საიტის ზოგადი აღწერა
- [სერვისები](${ctx.origin}/services): რა სერვისებია
- [ჩვენ შესახებ](${ctx.origin}/about): კომპანიის ისტორია

## პროდუქტები / რესურსები
- [ბლოგი](${ctx.origin}/blog): სტატიები და ცოდნის ბაზა

## კონტაქტი
- ელ-ფოსტა: info@${ctx.host}
- ტელეფონი: +995 XXX XXX XXX
`,
      note: "ჩაწერეთ საიტის root-ში. 2026 სტანდარტი ChatGPT, Claude, Perplexity-სთვის.",
    },
  ],

  "ALT ტექსტები": () => [
    {
      title: "სურათის სრული შაბლონი",
      language: "html",
      code: `<img
  src="image.webp"
  alt="აღწერითი ტექსტი - რა ჩანს სურათზე"
  width="800"
  height="600"
  loading="lazy">`,
      note: 'alt - აღწერითი (არა keyword stuffing). loading="lazy" below-the-fold-ისთვის. width/height - CLS-ის წინააღმდეგ.',
    },
  ],

  "Lazy Loading": () => [
    {
      title: "Lazy loading attribute",
      language: "html",
      code: `<img src="image.webp" alt="..." loading="lazy" width="800" height="600">`,
      note: "მხოლოდ below-the-fold სურათებისთვის. LCP სურათისთვის - НЕ lazy.",
    },
  ],

  "Image Format": () => [
    {
      title: "Picture element fallback-ით",
      language: "html",
      code: `<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="..." loading="lazy" width="800" height="600">
</picture>`,
      note: "AVIF - 50% უფრო პატარა; WebP - 30% უფრო პატარა. fallback ძველი ბრაუზერებისთვის.",
    },
  ],
};

export function getFixesForCheck(
  label: string,
  ctx: FixContext,
  value?: CheckResult["value"]
): FixTemplate[] {
  const generator = FIX_GENERATORS[label];
  if (!generator) return [];
  const result = generator(ctx, value);
  return result ?? [];
}
