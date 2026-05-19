"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Loader2, Plus, X } from "lucide-react";
import { BRAND } from "@/lib/brand";

const RESOURCES: { label: string; href: string; description: string }[] = [
  {
    label: "Title & Meta",
    href: "https://ahrefs.com/blog/seo-meta-tags/",
    description: "CTR-ის მთავარი სიგნალი ძიების შედეგებში",
  },
  {
    label: "Core Web Vitals",
    href: "https://ahrefs.com/blog/core-web-vitals/",
    description: "LCP, CLS, INP — Google-ის UX მეტრიკები",
  },
  {
    label: "Schema Markup",
    href: "https://ahrefs.com/blog/schema-markup/",
    description: "Rich Results + AI Overviews-სთვის სიგნალი",
  },
  {
    label: "ALT ტექსტები",
    href: "https://ahrefs.com/blog/alt-text/",
    description: "სურათების SEO + accessibility",
  },
  {
    label: "robots.txt",
    href: "https://ahrefs.com/blog/robots-txt/",
    description: "Crawler-ების და AI-ბოტების კონტროლი",
  },
  {
    label: "Mobile-friendly",
    href: "https://ahrefs.com/blog/mobile-seo/",
    description: "Google-ის Mobile-First Indexing",
  },
  {
    label: "AI-Ready (GEO)",
    href: "https://ahrefs.com/blog/llm-optimization/",
    description: "ბრენდის ხილვადობა ChatGPT, Claude-ში",
  },
  {
    label: "llms.txt",
    href: "https://ahrefs.com/blog/what-is-llms-txt/",
    description: "ახალი 2026 სტანდარტი AI კრაულერებისთვის",
  },
];

type Depth = 1 | 5 | 10;
type Mode = "single" | "compare";

const DEPTH_OPTIONS: { value: Depth; label: string; hint: string }[] = [
  { value: 1, label: "მთავარი", hint: "5-15წ · მხოლოდ მთავარი გვერდი" },
  { value: 5, label: "ღრმა (5)", hint: "30-60წ · მთავარი + 4 ქვეგვერდი" },
  { value: 10, label: "სრული (10)", hint: "60-120წ · მთავარი + 9 ქვეგვერდი" },
];

const MAX_COMPETITORS = 3;

function normalizeUrl(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}

function validateUrl(value: string): string {
  if (!value.trim()) return "გთხოვთ, შეიყვანოთ ვებგვერდის მისამართი";
  try {
    const u = new URL(normalizeUrl(value));
    if (!u.hostname.includes(".")) return "არასწორი მისამართის ფორმატი";
    return "";
  } catch {
    return "არასწორი URL";
  }
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<Depth>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Compare mode state. mainUrl is the user's own site; competitors are
  // home-page URLs to benchmark against. We keep them in a fixed-length
  // array (always MAX_COMPETITORS) so the "+ კონკურენტი" button toggles
  // visibility rather than mutating array length — simpler form state.
  const [mainUrl, setMainUrl] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(
    Array(MAX_COMPETITORS).fill("")
  );
  const [visibleCompetitors, setVisibleCompetitors] = useState(1);
  const [compareErrors, setCompareErrors] = useState<string[]>([]);

  const router = useRouter();

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUrl(url);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    const normalized = normalizeUrl(url);
    const depthParam = depth > 1 ? `&depth=${depth}` : "";
    router.push(`/results?url=${encodeURIComponent(normalized)}${depthParam}`);
  };

  const handleCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCompetitors = competitors.slice(0, visibleCompetitors);
    const allRaw = [mainUrl, ...activeCompetitors];
    const errs = allRaw.map((v) => validateUrl(v));
    if (errs.some((e) => e !== "")) {
      setCompareErrors(errs);
      return;
    }
    setCompareErrors([]);
    setLoading(true);
    const urls = allRaw.map(normalizeUrl);
    const param = urls.map(encodeURIComponent).join(",");
    router.push(`/compare?urls=${param}`);
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Hero — video background + branded headline. The video sits absolutely
          inside the hero (not the whole page) so the SEO content below stays
          readable on the cream theme. Cream overlay keeps body text contrast
          high; on mobile the video is replaced by the poster image via
          `poster` attribute to save bandwidth. prefers-reduced-motion users
          see the static poster too. */}
      {/* Hero — Resend / Router.so / BaseHub inspired. Two soft accent
          orbs glow behind the content for warmth, layered over a faint
          grid that anchors the page in the cream palette. Everything is
          CSS — zero assets, prefers-reduced-motion friendly. */}
      <section className="relative overflow-hidden">
        {/* Large gold orb top-right — earlier 0.35 opacity / 520px width was
            so subtle the user reported the change as invisible. Bumping to
            0.65 opacity and 780px so it reads as a clear ambient glow. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-40 w-[780px] h-[780px] rounded-full motion-safe:animate-pulse-slow"
          style={{
            background:
              "radial-gradient(circle, rgba(201,169,97,0.65) 0%, rgba(201,169,97,0.25) 40%, rgba(201,169,97,0) 75%)",
            filter: "blur(60px)",
          }}
        />
        {/* Soft navy orb bottom-left — second accent at higher visibility. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 w-[720px] h-[720px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(30,58,138,0.35) 0%, rgba(30,58,138,0.12) 45%, rgba(30,58,138,0) 75%)",
            filter: "blur(55px)",
          }}
        />
        {/* Third orb — warm pink/coral hint upper-left for tonal richness,
            inspired by the Stripe/Resend multi-orb hero treatment. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 -left-20 w-[420px] h-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(214,140,120,0.30) 0%, rgba(214,140,120,0) 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Subtle grid — anchors the page in the editorial palette. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,27,61,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,27,61,0.035) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
          }}
        />
        <div className="relative px-4 py-20 sm:py-28 flex flex-col items-center">
          <div className="w-full max-w-xl">
            <div className="mb-10">
              <p className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.3em] text-accent mb-5">
                <span className="inline-block w-6 h-px bg-accent" />
                {BRAND.toolName} · 2026
              </p>
              <h1
                className="font-semibold tracking-tight text-foreground mb-5 leading-[1.05]"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.25rem)" }}
              >
                ვებგვერდის{" "}
                <span className="text-accent">SEO ანალიზი</span>
              </h1>
              <p className="text-lg text-foreground-muted leading-relaxed max-w-lg">
                ტექნიკური, On-Page, Performance და AI-ეპოქის სრული აუდიტი —
                ერთი წამში, უფასოდ, ქართულად.
              </p>
            </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border mb-5">
          <button
            type="button"
            onClick={() => setMode("single")}
            disabled={loading}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 ${
              mode === "single"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            ერთი საიტი
          </button>
          <button
            type="button"
            onClick={() => setMode("compare")}
            disabled={loading}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 ${
              mode === "compare"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            კონკურენტებთან შედარება
          </button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit}>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
                placeholder="example.com"
                disabled={loading}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="flex-1 px-4 py-3 rounded-lg border border-border-strong bg-transparent text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold active:scale-[0.98] transition shadow-sm shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    ანალიზი
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-sm text-error mb-3">{error}</p>}

            <div className="mt-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2">
                ანალიზის სიღრმე
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEPTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDepth(opt.value)}
                    disabled={loading}
                    className={`text-left rounded-lg border px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      depth === opt.value
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:border-border-strong"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        depth === opt.value ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-foreground-muted leading-snug mt-0.5">
                      {opt.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCompareSubmit}>
            <div className="space-y-2 mb-3">
              <label className="block">
                <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-1.5 block">
                  თქვენი საიტი
                </span>
                <input
                  type="text"
                  value={mainUrl}
                  onChange={(e) => {
                    setMainUrl(e.target.value);
                    if (compareErrors.length) setCompareErrors([]);
                  }}
                  placeholder="example.com"
                  disabled={loading}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-lg border border-border-strong bg-transparent text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
                />
                {compareErrors[0] && (
                  <p className="text-sm text-error mt-1">{compareErrors[0]}</p>
                )}
              </label>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-1.5 block mt-3">
                  კონკურენტები ({visibleCompetitors}/{MAX_COMPETITORS})
                </span>
                <div className="space-y-2">
                  {Array.from({ length: visibleCompetitors }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={competitors[i]}
                        onChange={(e) => {
                          const next = [...competitors];
                          next[i] = e.target.value;
                          setCompetitors(next);
                          if (compareErrors.length) setCompareErrors([]);
                        }}
                        placeholder={`კონკურენტი ${i + 1}`}
                        disabled={loading}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="flex-1 px-4 py-3 rounded-lg border border-border bg-transparent text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
                      />
                      {visibleCompetitors > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...competitors];
                            next.splice(i, 1);
                            next.push("");
                            setCompetitors(next);
                            setVisibleCompetitors(visibleCompetitors - 1);
                          }}
                          disabled={loading}
                          className="px-3 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-border-strong transition disabled:opacity-50"
                          aria-label="წაშლა"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {compareErrors.slice(1).map(
                    (err, i) =>
                      err && (
                        <p key={i} className="text-sm text-error">
                          კონკურენტი {i + 1}: {err}
                        </p>
                      )
                  )}
                </div>

                {visibleCompetitors < MAX_COMPETITORS && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCompetitors(visibleCompetitors + 1)
                    }
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    კონკურენტის დამატება
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold active:scale-[0.98] transition shadow-sm shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  შედარების ანალიზი
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </>
              )}
            </button>

            <p className="text-[11px] text-foreground-subtle mt-3 leading-snug">
              ⚡ პარალელური ანალიზი · მხოლოდ მთავარი გვერდი თითო საიტიდან · ~15-30 წამი
            </p>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground-muted">
              რას ვამოწმებთ
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
              წყარო: ahrefs.com
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RESOURCES.map((r) => (
              <li key={r.label}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 px-3 py-2 -mx-3 rounded-md hover:bg-surface transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <span className="font-medium truncate">{r.label}</span>
                      <ArrowUpRight
                        className="w-3 h-3 text-foreground-subtle group-hover:text-accent transition shrink-0"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="text-[12px] text-foreground-muted leading-snug truncate">
                      {r.description}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-foreground-subtle mt-12">
          v0.1 MVP · მხოლოდ საჯარო ვებგვერდები
        </p>
          </div>
        </div>
      </section>

      {/* Hairline divider — keeps the editorial feel as we transition out
          of the hero into long-form content. */}
      <div
        className="relative mx-auto w-full max-w-3xl px-4"
        aria-hidden="true"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      </div>

      {/* How it works — three-step explainer below the fold. Resend/Router.so
          style: numbered cards on a subtle band, dense enough to read in one
          glance, decorative enough to break up the page rhythm. */}
      <HowItWorks />

      {/* Hairline divider before the long-form SEO content. */}
      <div
        className="relative mx-auto w-full max-w-3xl px-4"
        aria-hidden="true"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      </div>

      {/* SEO content block — full keyword target ("SEO ანალიზი", "SEO აუდიტი",
          "ვებგვერდის ანალიზი") for Google + Georgian audience.
          Min ~800 words to satisfy E-E-A-T + Helpful Content signals. */}
      <article className="w-full max-w-3xl mx-auto px-4 sm:px-2 py-16">
        <SeoContentBlock />
        <FaqBlock />
      </article>

      {/* Brand footer — single source of brand attribution at page bottom,
          mirrors the editorial slide-deck signoff (made by INFINITY SOLUTIONS). */}
      <SiteFooter />

      {/* FAQPage JSON-LD — AI Overviews + Rich Results target. The
          questions/answers mirror the FaqBlock content exactly so Google's
          validator is happy. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
    </div>
  );
}

// ── Long-form SEO content ──────────────────────────────────────────────
// Lives below the fold but is server-rendered so Google's crawler indexes
// every paragraph. Headings are H2/H3 so the page has a clear hierarchy
// under the H1 "ვებგვერდის SEO ანალიზი" above.

function SeoContentBlock() {
  return (
    <section className="text-foreground leading-relaxed">
      <h2 className="text-3xl font-semibold tracking-tight mb-4 mt-8">
        რა არის SEO ანალიზი და რატომ სჭირდება თქვენს საიტს
      </h2>
      <p className="mb-4 text-foreground-muted">
        SEO ანალიზი არის ვებგვერდის სრული შემოწმება — ვამოწმებთ რამდენად
        მოწესრიგებულია გვერდი Google-ის და სხვა საძიებო სისტემების
        გასაგებად. პროცესი ფარავს ტექნიკურ SEO-ს (HTTPS, robots.txt,
        sitemap, schema markup), On-Page ოპტიმიზაციას (title, meta
        description, headings, ALT ტექსტები), Performance მეტრიკებს (Core
        Web Vitals — LCP, INP, CLS) და 2026-ის AI-ერის სიგნალებს (llms.txt,
        FAQ schema, BLUF format).
      </p>
      <p className="mb-4 text-foreground-muted">
        ჩვენი უფასო SEO აუდიტის ხელსაწყო ერთ-ერთი წამში გვერდი ფიქსირდება და
        გადასცემს კონკრეტულ ანგარიშს — სად მუშაობს ძლიერად, რა საჭიროებს
        გასწორებას, რა შეიძლება იყოს კონკურენტებზე უპირატესობის წყარო.
        განსხვავებით სხვა SEO checker-ებისგან, ანალიზი ქართულადაც სრულდება
        და მუშტრების მისახვედრად ცხადი ენით აღწერს თითო პრობლემას.
      </p>

      <h3 className="text-2xl font-semibold tracking-tight mb-3 mt-8">
        რას მოიცავს ჩვენი SEO აუდიტი
      </h3>
      <p className="mb-3 text-foreground-muted">
        ხელსაწყო შემოწმებას ფარავს 6 ძირითად კატეგორიად, თითო კატეგორიაში
        10-15 ცალკეული check-ი. სრულად 50+ პუნქტი — საკმარისი იმისთვის, რომ
        წარმოიდგინოთ თუ რა მდგომარეობაშია თქვენი საიტი.
      </p>
      <ul className="space-y-3 mb-4 text-foreground-muted">
        <li>
          <strong className="text-foreground">ტექნიკური SEO</strong> — HTTPS,
          HTTP→HTTPS რედირექტი, Soft 404 detection, Cache-Control
          configuration, security headers (CSP/HSTS/X-Frame-Options),
          hreflang, canonical, robots.txt-ისა და XML sitemap-ის შემოწმება.
          URL/lang mismatch-ის (მაგ. /en/ URL ქართული `&lt;html lang&gt;`-ით)
          ცნობა.
        </li>
        <li>
          <strong className="text-foreground">On-Page</strong> — Title tag
          (50-60 სიმბოლო, keyword-ის პოზიცია), Meta description (140-160
          სიმბოლო), H1-H6 იერარქია, ALT ტექსტები, შიდა და გარე ბმულების
          სტრუქტურა, content depth.
        </li>
        <li>
          <strong className="text-foreground">Performance</strong> — Google
          PageSpeed Insights-ის რეალური მონაცემები: LCP (Largest Contentful
          Paint &lt;2.5წ), INP (Interaction to Next Paint &lt;200ms), CLS
          (Cumulative Layout Shift &lt;0.1).
        </li>
        <li>
          <strong className="text-foreground">Schema & სოც.მედია</strong> —
          JSON-LD ვალიდაცია (Organization, Product, FAQ, Article), Open
          Graph (og:title, og:image 1200×630), Twitter Card,
          ცალკეული ველების ფორმატის ღრმა შემოწმება (telephone, email, URL).
        </li>
        <li>
          <strong className="text-foreground">Link Health</strong> — შიდა
          ბმულების real-time გადამოწმება, broken links, redirect chains.
        </li>
        <li>
          <strong className="text-foreground">AI-ერა (2026)</strong> —
          llms.txt სტანდარტი ChatGPT/Claude/Perplexity-სთვის, FAQ schema, SSR
          ვალიდაცია, BLUF (Bottom Line Up Front) format-ის შემოწმება.
        </li>
      </ul>

      <h3 className="text-2xl font-semibold tracking-tight mb-3 mt-8">
        რატომ მნიშვნელოვანია SEO 2026 წელს
      </h3>
      <p className="mb-4 text-foreground-muted">
        Google-ის ალგორითმი 2024-2026 წლებში მნიშვნელოვნად შეიცვალა — Core
        Web Vitals გახდა რანკინგ ფაქტორი, AI Overviews-ი ცვლის ტრადიციულ
        ძიების შედეგებს, ChatGPT-ი და Claude-ი დღეს იყენებენ მონაცემებს
        პასუხებში ციტირებისთვის. ბრენდის ხილვადობა მხოლოდ Google-ში
        ხილვადობად აღარ ითარგმნება — საჭიროა ხილვადობა AI-ის ეპოქის
        infrastructure-შიც.
      </p>
      <p className="mb-4 text-foreground-muted">
        ჩვენი ხელსაწყო შემოწმებას აკეთებს როგორც ტრადიციული SEO-ის (Title,
        meta, Schema), ასევე ახალი 2026-ის სტანდარტების (llms.txt, FAQ
        schema, SSR rendering) მიხედვით. შედეგი — სრული ხედვა იმისა, თუ
        როგორ ხვდება თქვენი საიტი როგორც Google-ის ბოტებს, ისე AI-ის
        crawler-ებს.
      </p>

      <h3 className="text-2xl font-semibold tracking-tight mb-3 mt-8">
        კონკურენტებთან შედარების ფუნქცია
      </h3>
      <p className="mb-4 text-foreground-muted">
        ცალკეული SEO ანალიზის გარდა, ხელსაწყო გვერდი იძლევა "კონკურენტებთან
        შედარების" mode-ს — შეიყვანე შენი საიტი + 1-3 კონკურენტი და მიიღე
        side-by-side შედარება. გაცემს scoreboard-ს (ვინ რა პოზიციაშია), per-
        category matrix-ს, "რატომ კონკურენტი წინ" ანალიზს და კონკრეტული
        action plan-ი — რა ნაბიჯები მიიღო, რომ მათ წინ გასცილდე. ეს
        ნაწილი არის ის, რასაც ფასიანი SEO საიტები ნორმალურად $100+/თვე-ად
        ყიდიან — ჩვენი ვერსია უფასოა.
      </p>

      <h3 className="text-2xl font-semibold tracking-tight mb-3 mt-8">
        SEO Service Offer
      </h3>
      <p className="mb-4 text-foreground-muted">
        თუ აუდიტმა გვერდი მრავალი პრობლემა აღმოაჩინა და თვითონ გასწორება
        არ გრძნობთ, ჩვენი ხელსაწყო თვითონ ქმნის სრულ "SEO შეთავაზებას" — 12
        თვის roadmap-ი, ცალკეული სერვისის აღწერა, კლიენტის ვალდებულებების
        გასახედი ჩამონათვალი (კონტენტი, backlinks, ფასიანი რეკლამა). სრულად
        client-facing PDF-ად ექსპორტადია.
      </p>
    </section>
  );
}

// ── FAQ block + FAQPage JSON-LD ────────────────────────────────────────

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "რა არის SEO ანალიზი?",
    a: "SEO ანალიზი არის ვებგვერდის სრული შემოწმება — რამდენად მოწესრიგებულია გვერდი Google-ისთვის. ფარავს ტექნიკურ SEO-ს, on-page ოპტიმიზაციას, performance-ს და AI-ერის სიგნალებს. ჩვენი ხელსაწყო ერთ წამში გაცემს ანგარიშს 50+ პუნქტით.",
  },
  {
    q: "უფასოა SEO აუდიტი?",
    a: "დიახ — ერთჯერადი ანალიზი მთლიანად უფასოა, რეგისტრაციის გარეშე. გაუშვი ნებისმიერი საჯარო ვებგვერდის URL-ი და მიიღე სრული ანგარიში. გაცილებითი მაგალითები (კონკურენტებთან შედარება, PPTX ექსპორტი, SEO შეთავაზება) ასევე ფასიანი არ არის.",
  },
  {
    q: "რა განსხვავებაა ჩვენი ხელსაწყოს და სხვა SEO checker-ების შორის?",
    a: "მრავალი SEO checker დიდი ხნის ან გენერიული. ჩვენი ხელსაწყო (1) ქართულადაც სრულად მუშაობს, (2) ფარავს 2026-ის AI-ერის სტანდარტებს (llms.txt, FAQ schema, BLUF), (3) რეალურ PageSpeed Insights მონაცემებს იყენებს, (4) კონკურენტებთან შედარების mode-ი — 4 საიტი ერთდროულად, (5) კლიენტ-ფეისინგი ექსპორტი (PPTX + PDF).",
  },
  {
    q: "რა Core Web Vitals-ი ცნობს ხელსაწყო?",
    a: "Google PageSpeed Insights API-ით ცნობს LCP-ს (Largest Contentful Paint, კარგი &lt;2.5წ), INP-ს (Interaction to Next Paint, კარგი &lt;200ms) და CLS-ს (Cumulative Layout Shift, კარგი &lt;0.1). მონაცემები რეალური მომხმარებლების Field data-ია, არა lab simulation.",
  },
  {
    q: "რა არის llms.txt და რატომ აკრიტიკულია 2026-ში?",
    a: "llms.txt არის 2026-ის ახალი სტანდარტი, რომელიც AI კრაულერებს (ChatGPT, Claude, Perplexity) ეუბნება საიტის სტრუქტურის შესახებ. /llms.txt ფაილში Markdown-ით აღწერთ მთავარ გვერდებს. შედეგად — AI-ის პასუხებში თქვენი ბრენდი უფრო ხშირად ციტირდება. ჩვენი ხელსაწყო ცნობს არსებობს თუ არა llms.txt და სრულდება თუ არა სტანდარტი.",
  },
  {
    q: "რას მოიცავს SEO შეთავაზება?",
    a: "ანალიზის ბოლოს ხელსაწყო თვითონ ქმნის სრულ SEO Service Proposal-ს — 12 თვის roadmap-ი, ცალკეული სერვისები (Technical SEO, On-Page, Schema, Performance, Content Strategy, Monitoring), მუშტრის ვალდებულებები (backlinks, კონტენტი, ფასიანი რეკლამა), realistic outcome estimates. PDF-ად დაიწერება და ცალკეულ კლიენტს ცნობს.",
  },
  {
    q: "რა საიტებზე მუშაობს ხელსაწყო?",
    a: "ნებისმიერ საჯარო ვებგვერდი — WordPress, Shopify, Webflow, Wix, Magento, custom build, SPA, Next.js, etc. შემოწმდება როგორც HTTPS, ისე ცალკეული გვერდები. Bot-protected საიტებიც (Cloudflare challenge, DDoS-Guard) აღმოაჩინდება — მათზე HTTP+Header ანალიზი მაინც ცარიელ მონაცემს იძლევა.",
  },
  {
    q: "სად ვინახე ანალიზის ისტორია?",
    a: "ბრაუზერის localStorage-ში ვინახავთ ბოლო audit-ს — refresh-ი არ ცარიელდება. გრძელვადიანი ისტორია (პროგრესის ვიზუალი 3 თვის გასახედი) — დაგეგმილია მომავალ ვერსიაში.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

function FaqBlock() {
  return (
    <section className="mt-12">
      <h2 className="text-3xl font-semibold tracking-tight mb-6">
        ხშირი კითხვები
      </h2>
      <div className="divide-y divide-border border-y border-border">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={i}
            className="group py-4"
            open={i < 2}
          >
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-foreground hover:text-accent transition">
              <span>{item.q}</span>
              <span className="text-foreground-muted group-open:rotate-45 transition-transform text-xl leading-none shrink-0">
                +
              </span>
            </summary>
            <p
              className="mt-3 text-foreground-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: item.a }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}

// ── How it works (3-step explainer) ────────────────────────────────────
// Sits between hero and long-form SEO content. Each step is a numbered
// card so the user scanning the page gets the gist in 3 seconds. Hover
// state lifts the card to make the section feel interactive but quiet.

const HOW_IT_WORKS: { num: string; title: string; body: string }[] = [
  {
    num: "01",
    title: "შეიყვანე URL",
    body: "ნებისმიერი საჯარო ვებგვერდის მისამართი. რეგისტრაცია არ სჭირდება. გვერდი ფიქსირდება უსაფრთხო proxy-ით — შენი მონაცემები არ ვინახავთ.",
  },
  {
    num: "02",
    title: "ანალიზი 5-15 წამში",
    body: "50+ შემოწმება ექვს კატეგორიად: ტექნიკური, On-Page, Performance, Schema, Link Health, AI-ერა. Real-time progress, ცოცხალი stream.",
  },
  {
    num: "03",
    title: "შედეგი + Action Plan",
    body: "სრული ანგარიში ქართულად, AI-ის შემაჯამებელი, კონკურენტებთან შედარება, კონკრეტული ნაბიჯები. PPTX / PDF ექსპორტი ერთი ღილაკით.",
  },
];

function HowItWorks() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-accent mb-3">
          როგორ მუშაობს
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          სამი ნაბიჯი — სრული SEO აუდიტი
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {HOW_IT_WORKS.map((step) => (
          <div
            key={step.num}
            className="group relative rounded-xl border border-border bg-surface/60 backdrop-blur-sm px-6 py-7 transition hover:border-accent/40 hover:bg-surface hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">
              {step.num}
            </p>
            <h3 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
              {step.title}
            </h3>
            <p className="text-[14px] text-foreground-muted leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Site footer ────────────────────────────────────────────────────────
// Editorial signoff. Mirrors the slide-deck "made by INFINITY SOLUTIONS"
// footer so the web view and the exported decks read as one product.

function SiteFooter() {
  return (
    <footer className="relative mt-8 border-t border-border bg-surface/40 print-keep-together">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/infinity-logo.png"
            alt=""
            className="w-7 h-7 object-contain"
          />
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted">
            made by{" "}
            <span className="text-foreground font-medium">
              {BRAND.agency.toUpperCase()}
            </span>
          </p>
        </div>
        <p className="text-[11px] font-mono text-foreground-subtle">
          v0.1 MVP · საქართველო · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
