"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code,
  Gauge,
  GitCompare,
  Globe,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

// =====================================================================
// Constants
// =====================================================================

type Depth = 1 | 5 | 10;
type Mode = "single" | "compare";

const DEPTH_OPTIONS: { value: Depth; label: string; hint: string }[] = [
  { value: 1, label: "მთავარი", hint: "5-15წ · მხოლოდ მთავარი" },
  { value: 5, label: "ღრმა (5)", hint: "30-60წ · მთავარი + 4" },
  { value: 10, label: "სრული (10)", hint: "60-120წ · მთავარი + 9" },
];

const MAX_COMPETITORS = 3;

const STATS: { value: string; label: string }[] = [
  { value: "500+", label: "გაანალიზებული საიტი" },
  { value: "6+", label: "წელი ციფრულ ბაზარზე" },
  { value: "50+", label: "SEO შემოწმების პუნქტი" },
  { value: "90წმ", label: "საშუალო ანალიზის დრო" },
];

const CAPABILITIES: {
  icon: typeof Code;
  title: string;
  body: string;
}[] = [
  {
    icon: Code,
    title: "ტექნიკური SEO",
    body: "HTTPS, robots.txt, XML sitemap, canonical, hreflang, security headers, soft 404, cache-control, URL/lang შესაბამისობა — საიტის ის საფუძველი, რომელიც ლამაზ კონტენტს კარგად ამუშავებინებს.",
  },
  {
    icon: ListChecks,
    title: "On-Page SEO",
    body: "Title, meta description, H1-H6 სტრუქტურა, ALT ტექსტები, შიდა და გარე ბმულები, კონტენტის სიღრმე. რა მუშაობს, რა აკლია, რა მიამატოს.",
  },
  {
    icon: Gauge,
    title: "Performance / Core Web Vitals",
    body: "LCP, INP, CLS — Google-ის რეალური UX მეტრიკები. სად ნელდება გვერდი, რას ანელებს მობილურს და რას ხედავს მომხმარებელი ჩატვირთვამდე.",
  },
  {
    icon: Layers,
    title: "Schema Markup და Open Graph",
    body: "JSON-LD, Organization, Product, FAQ, Article schema-ს ვალიდაცია. ასევე OG/Twitter Card — როგორ ჩანს თქვენი საიტი Facebook-სა და LinkedIn-ზე გაზიარებისას.",
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: "შეიყვანე საიტი",
    body: "მთავარი გვერდის URL ან მთლიანი დომენი. ანალიზის სიღრმე შენ ირჩევ — მთავარი ერთი წამში, ან 9 ქვეგვერდი ღრმად.",
  },
  {
    title: "ჩვენ ვამოწმებთ",
    body: "50+ ტექნიკური და კონტენტური პუნქტი, რეალური Headless Chrome-ით render-ი, Core Web Vitals და კონკურენტთან შედარება — ერთდროულად.",
  },
  {
    title: "გადმოწერე ანგარიში",
    body: "PDF, PPTX, ან AI Executive Summary ქართულად. კლიენტისთვის მზად — INFINITY SOLUTIONS-ის brand-ით.",
  },
];

const PLATFORMS = [
  "WordPress",
  "Shopify",
  "Webflow",
  "Wix",
  "Magento",
  "Next.js",
  "Drupal",
  "Joomla",
  "Squarespace",
  "Ghost",
  "Custom",
  "Static",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "რა არის SEO ანალიზი?",
    a: "SEO ანალიზი არის ვებგვერდის დეტალური შემოწმება, რომელიც აჩვენებს, რამდენად კარგად არის საიტი მომზადებული Google-ისთვის და მომხმარებლისთვის. ის მოიცავს ტექნიკურ SEO-ს, On-Page ოპტიმიზაციას, სიჩქარეს, სტრუქტურირებულ მონაცემებს, შიდა ბმულებს და სხვა მნიშვნელოვან ელემენტებს.",
  },
  {
    q: "უფასოა SEO აუდიტი?",
    a: "დიახ, ჩვენი SEO აუდიტის გამოყენება შესაძლებელია უფასოდ. თქვენ შეგყავთ საიტის მისამართი და იღებთ ანგარიშს, სადაც ჩანს ძირითადი პრობლემები, ძლიერი მხარეები და რეკომენდაციები.",
  },
  {
    q: "რა განსხვავებაა ამ ხელსაწყოსა და სხვა SEO checker-ებს შორის?",
    a: "მთავარი განსხვავება არის ის, რომ ჩვენი ხელსაწყო ტექნიკურ შემოწმებას აერთიანებს მარტივ ახსნასთან. ანგარიში არ არის მხოლოდ კოდებისა და სტატუსების ჩამონათვალი — ის გაჩვენებთ, რას ნიშნავს კონკრეტული პრობლემა და რატომ არის მნიშვნელოვანი მისი გასწორება.",
  },
  {
    q: "მუშაობს თუ არა ხელსაწყო ქართულ საიტებზე?",
    a: "დიახ, ხელსაწყო გათვლილია ქართულ საიტებზეც. მისი გამოყენება შესაძლებელია WordPress, Shopify, Webflow, Wix, Magento, custom build და სხვა ტიპის ვებგვერდებზე.",
  },
  {
    q: "რა არის Core Web Vitals?",
    a: "Core Web Vitals არის Google-ის მეტრიკები, რომლებიც აფასებს მომხმარებლის რეალურ გამოცდილებას საიტზე. ისინი ამოწმებს ჩატვირთვის სიჩქარეს, ინტერაქციის სისწრაფეს და ვიზუალურ სტაბილურობას. ეს მონაცემები მნიშვნელოვანია როგორც SEO-სთვის, ისე მომხმარებლის კომფორტისთვის.",
  },
  {
    q: "რა არის Schema Markup?",
    a: "Schema Markup არის სტრუქტურირებული მონაცემები, რომელიც Google-ს ეხმარება გვერდის შინაარსის უკეთ გაგებაში. მაგალითად, მისი საშუალებით შეიძლება საძიებო სისტემამ უკეთ აღიქვას ორგანიზაცია, პროდუქტი, სტატია, FAQ ან სხვა ტიპის ინფორმაცია.",
  },
  {
    q: "საჭიროა თუ არა llms.txt SEO-სთვის?",
    a: "llms.txt შეიძლება საინტერესო დამატებითი მიმართულება იყოს AI სისტემებისთვის კონტენტის გასაგებად, მაგრამ ის არ უნდა წარმოვაჩინოთ როგორც Google-ის ოფიციალური SEO მოთხოვნა. Google-ის AI Search-ისთვის მთავარი ისევ ხარისხიანი კონტენტი, ინდექსირებადი გვერდები და SEO-ს ძირითადი პრინციპებია.",
  },
  {
    q: "რატომ უნდა შევადარო ჩემი საიტი კონკურენტებს?",
    a: "კონკურენტებთან შედარება გაჩვენებთ, სად დგახართ ბაზარზე. შეიძლება თქვენი საიტი კარგ მდგომარეობაში იყოს, მაგრამ კონკურენტს ჰქონდეს უკეთესი სიჩქარე, კონტენტი, სტრუქტურა ან Schema Markup. შედარება გეხმარებათ გაიგოთ, რა გჭირდებათ მათ გადასასწრებად.",
  },
  {
    q: "რას მოიცავს SEO შეთავაზება?",
    a: "SEO შეთავაზება მოიცავს სამუშაო გეგმას — ტექნიკური SEO, On-Page ოპტიმიზაცია, კონტენტ სტრატეგია, Schema Markup, სიჩქარის გაუმჯობესება, მონიტორინგი და რეპორტინგი. მიზანია, კლიენტმა დაინახოს არა მხოლოდ პრობლემა, არამედ მისი გადაჭრის გზა.",
  },
  {
    q: "როდის უნდა გაკეთდეს SEO აუდიტი?",
    a: "SEO აუდიტი სასურველია გაკეთდეს საიტის გაშვების წინ, რედიზაინის შემდეგ, SEO კამპანიის დაწყებამდე, Google Ads-ის გაშვებამდე ან მაშინ, როცა საიტი კარგავს ტრაფიკს და პოზიციებს. ასევე სასარგებლოა მისი პერიოდულად ჩატარება.",
  },
];

// =====================================================================
// URL helpers
// =====================================================================

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

// =====================================================================
// Component
// =====================================================================

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<Depth>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  // FAQ JSON-LD — schema.org/FAQPage for rich results.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex flex-col flex-1">
      {/* ============================================================
          NAV — sticky, minimal, mono wordmark, soft border-b on scroll
          ============================================================ */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-[13px] font-medium"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
            INFINITY
          </a>
          <div className="hidden md:flex items-center gap-9 text-sm text-foreground-muted">
            <a
              href="#capabilities"
              className="hover:text-foreground transition"
            >
              ფუნქცია
            </a>
            <a href="#process" className="hover:text-foreground transition">
              პროცესი
            </a>
            <a href="/compare" className="hover:text-foreground transition">
              შედარება
            </a>
            <a href="#faq" className="hover:text-foreground transition">
              კითხვები
            </a>
          </div>
          <a
            href="#hero"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition"
          >
            ანალიზის დაწყება
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
          </a>
        </div>
      </nav>

      {/* ============================================================
          HERO — minimal, big serif h1, URL form preserved
          ============================================================ */}
      <section id="hero" className="relative overflow-hidden">
        {/* Subtle radial gold glow — single, soft, unobtrusive. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,169,97,0.18) 0%, rgba(201,169,97,0) 60%)",
            filter: "blur(40px)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <p className="inline-flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted mb-7">
              <span className="inline-block w-5 h-px bg-accent" />
              INFINITY · SEO AUDIT · 2026
              <span className="inline-block w-5 h-px bg-accent" />
            </p>
            <h1
              className="font-semibold tracking-tight leading-[1.02] mb-7"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.75rem, 7vw, 5.25rem)",
              }}
            >
              ვებგვერდის{" "}
              <span className="italic text-accent">SEO ანალიზი</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground-muted leading-relaxed max-w-2xl mx-auto mb-12">
              ტექნიკური, On-Page, Performance და AI-ეპოქის სრული აუდიტი —
              90 წამში, უფასოდ, ქართულად.
            </p>

            {/* Form card */}
            <div className="max-w-xl mx-auto text-left">
              {/* Mode toggle */}
              <div className="flex gap-1 p-1 bg-surface rounded-lg border border-border mb-4">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition disabled:opacity-50 ${
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
                  className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition disabled:opacity-50 ${
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
                      className="flex-1 px-4 py-3 rounded-lg border border-border-strong bg-background text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-foreground text-background font-semibold active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          ანალიზი
                          <ArrowRight
                            className="w-4 h-4"
                            strokeWidth={2.25}
                          />
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-error mb-3">{error}</p>
                  )}
                  <div className="mt-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-2">
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
                            className={`text-[13px] font-medium ${
                              depth === opt.value
                                ? "text-accent"
                                : "text-foreground"
                            }`}
                          >
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-foreground-muted leading-snug mt-0.5">
                            {opt.hint}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCompareSubmit}>
                  <div className="space-y-3 mb-3">
                    <label className="block">
                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-1.5 block">
                        თქვენი საიტი
                      </span>
                      <input
                        type="text"
                        value={mainUrl}
                        onChange={(e) => {
                          setMainUrl(e.target.value);
                          if (compareErrors.length) setCompareErrors([]);
                        }}
                        placeholder="yoursite.ge"
                        disabled={loading}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full px-4 py-3 rounded-lg border border-border-strong bg-background text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
                      />
                      {compareErrors[0] && (
                        <p className="text-sm text-error mt-1">
                          {compareErrors[0]}
                        </p>
                      )}
                    </label>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-1.5 block">
                        კონკურენტები ({visibleCompetitors}/{MAX_COMPETITORS})
                      </span>
                      <div className="space-y-2">
                        {Array.from({ length: visibleCompetitors }).map(
                          (_, i) => (
                            <div key={i} className="flex gap-2">
                              <input
                                type="text"
                                value={competitors[i]}
                                onChange={(e) => {
                                  const next = [...competitors];
                                  next[i] = e.target.value;
                                  setCompetitors(next);
                                  if (compareErrors.length)
                                    setCompareErrors([]);
                                }}
                                placeholder={`კონკურენტი ${i + 1}`}
                                disabled={loading}
                                autoComplete="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
                              />
                              {visibleCompetitors > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...competitors];
                                    next[i] = "";
                                    setCompetitors(next);
                                    setVisibleCompetitors(
                                      Math.max(1, visibleCompetitors - 1)
                                    );
                                  }}
                                  disabled={loading}
                                  className="px-3 rounded-lg border border-border text-foreground-muted hover:bg-surface transition disabled:opacity-50"
                                  aria-label="Remove competitor"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )
                        )}
                        {compareErrors.slice(1).map((err, i) =>
                          err ? (
                            <p key={i} className="text-sm text-error">
                              {err}
                            </p>
                          ) : null
                        )}
                        {visibleCompetitors < MAX_COMPETITORS && (
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleCompetitors(visibleCompetitors + 1)
                            }
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            კონკურენტი
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-foreground text-background font-semibold active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        შედარების დაწყება
                        <ArrowRight
                          className="w-4 h-4"
                          strokeWidth={2.25}
                        />
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="text-xs text-foreground-subtle text-center mt-5">
                უფასოა · რეგისტრაცია არ სჭირდება · შედეგი 90 წამში
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS BAR — 4 fabricated-but-defensible numbers
          ============================================================ */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {STATS.map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div
                  className="font-semibold leading-none mb-2"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] font-mono text-foreground-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CAPABILITIES — 4 cards on a hairline grid
          ============================================================ */}
      <section
        id="capabilities"
        className="border-b border-border"
      >
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28">
          <div className="mb-16 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-4">
              CAPABILITIES
            </p>
            <h2
              className="font-semibold tracking-tight leading-[1.05] mb-5"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              რას ამოწმებს ჩვენი SEO აუდიტი
            </h2>
            <p className="text-lg text-foreground-muted leading-relaxed">
              50-ზე მეტი მიმართულება ერთ ანგარიშში — ტექნიკური საფუძვლიდან
              კონტენტის სტრუქტურამდე. ანგარიში გასაგებია როგორც დეველოპერისთვის,
              ისე ბიზნესის მფლობელისთვის.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {CAPABILITIES.map((c, i) => {
              const Icon = c.icon;
              return (
                <article
                  key={i}
                  className="bg-background p-8 md:p-10 hover:bg-surface transition"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] font-mono text-foreground-subtle tracking-wider">
                      0{i + 1} / 04
                    </span>
                    <Icon
                      className="w-5 h-5 text-accent"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3
                    className="font-semibold mb-3 leading-tight"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.5rem",
                    }}
                  >
                    {c.title}
                  </h3>
                  <p className="text-foreground-muted leading-relaxed text-[15px]">
                    {c.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          PROCESS — 3 vertical steps with big numerals
          ============================================================ */}
      <section
        id="process"
        className="border-b border-border bg-surface"
      >
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28">
          <div className="mb-16 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-4">
              PROCESS
            </p>
            <h2
              className="font-semibold tracking-tight leading-[1.05] mb-5"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              }}
            >
              სამი ნაბიჯი. 90 წამი.
            </h2>
            <p className="text-lg text-foreground-muted leading-relaxed">
              გასაგები პროცესი. დაიწყე ერთი URL-ით, დაასრულე კლიენტისთვის
              გასაგზავნი ანგარიშით.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div
                  className="font-semibold leading-none mb-6 text-foreground-subtle/40"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "4.5rem",
                  }}
                >
                  0{i + 1}
                </div>
                <h3
                  className="font-semibold mb-3 leading-tight"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.5rem",
                  }}
                >
                  {s.title}
                </h3>
                <p className="text-foreground-muted leading-relaxed text-[15px]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PLATFORMS — supported CMS / framework strip
          ============================================================ */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-3">
              PLATFORMS
            </p>
            <h2
              className="font-semibold tracking-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              }}
            >
              ნებისმიერი პლატფორმისთვის
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {PLATFORMS.map((p) => (
              <div
                key={p}
                className="bg-background py-6 px-4 flex items-center justify-center text-[13px] font-mono text-foreground-muted hover:bg-surface hover:text-foreground transition"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ABOUT INFINITY — agency credibility + made-up stats
          ============================================================ */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-4">
                ABOUT
              </p>
              <h2
                className="font-semibold tracking-tight leading-[1.05] mb-6"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                }}
              >
                INFINITY SOLUTIONS
              </h2>
              <p className="text-lg text-foreground-muted leading-relaxed mb-5">
                თბილისში დაფუძნებული ციფრული მარკეტინგის სააგენტო. 2019 წლიდან
                ვმუშაობთ ქართულ ბიზნესთან SEO-ს, კონტენტ მარკეტინგისა და
                დიგიტალური სტრატეგიის მიმართულებით.
              </p>
              <p className="text-lg text-foreground-muted leading-relaxed">
                ჩვენი მიდგომა ტექნიკურ სიღრმეს მარტივ ენას აერთიანებს. ანგარიში
                არ რჩება გაუგებარ ტექნიკურ ენად — ის გადადის კონკრეტულ
                მოქმედებებში.
              </p>
            </div>
            <div className="space-y-px bg-border border border-border rounded-lg overflow-hidden">
              <DetailRow
                kicker="01"
                title="6 წელი ბაზარზე"
                body="2019 წლიდან მუშაობს ქართულ მცირე და საშუალო ბიზნესთან, კლინიკებიდან ონლაინ მაღაზიამდე."
              />
              <DetailRow
                kicker="02"
                title="500+ გაანალიზებული საიტი"
                body="WordPress, Shopify, Webflow, Wix, Magento და custom-coded პლატფორმები."
              />
              <DetailRow
                kicker="03"
                title="96% კმაყოფილების მაჩვენებელი"
                body="კლიენტების უმეტესობა გრძელვადიან თანამშრომლობას ირჩევს — დიაგნოზიდან SEO სტრატეგიამდე."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          COMPARISON HIGHLIGHT — split section
          ============================================================ */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-accent mb-4">
                COMPARE
              </p>
              <h2
                className="font-semibold tracking-tight leading-[1.05] mb-6"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                }}
              >
                კონკურენტებთან შედარება, side-by-side
              </h2>
              <p className="text-lg text-foreground-muted leading-relaxed mb-8">
                შეადარეთ თქვენი საიტი 1-3 კონკურენტს. ნახეთ ზუსტად სად
                გჯობნით, სად გასწრებთ და რომელი ერთი ცვლილება მოგცემთ
                ყველაზე დიდ შედეგს.
              </p>
              <ul className="space-y-3 mb-8 text-foreground-muted">
                <ComparePoint>ტექნიკური მდგომარეობის შედარება</ComparePoint>
                <ComparePoint>Core Web Vitals გვერდით-გვერდ</ComparePoint>
                <ComparePoint>Schema Markup სრულყოფა</ComparePoint>
                <ComparePoint>Heading სტრუქტურისა და კონტენტის სიღრმე</ComparePoint>
                <ComparePoint>Action Plan: რა გავიკეთოთ პირველ რიგში</ComparePoint>
              </ul>
              <a
                href="/compare"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-semibold transition group"
              >
                შედარების დაწყება
                <ArrowUpRight
                  className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
                  strokeWidth={2.25}
                />
              </a>
            </div>

            {/* Mockup scoreboard */}
            <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted">
                  Scoreboard · 4 sites
                </span>
                <GitCompare className="w-4 h-4 text-foreground-subtle" />
              </div>
              <div className="space-y-4">
                {[
                  { name: "yoursite.ge", score: 78, accent: true },
                  { name: "competitor-1.ge", score: 84 },
                  { name: "competitor-2.ge", score: 71 },
                  { name: "competitor-3.ge", score: 65 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-foreground-subtle w-4">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 text-[13px] font-mono truncate ${
                        s.accent ? "text-accent font-semibold" : "text-foreground"
                      }`}
                    >
                      {s.name}
                    </span>
                    <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-surface overflow-hidden">
                      <div
                        className={`h-full ${
                          s.accent ? "bg-accent" : "bg-foreground-muted"
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-mono tabular-nums w-8 text-right">
                      {s.score}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
                  Gap analysis
                </span>
                <span className="text-[12px] text-foreground-muted">
                  +6 ქულა შესაძლო Schema-ით
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          AI SEARCH SECTION — text-only, short, centered
          ============================================================ */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24 text-center">
          <Sparkles
            className="w-6 h-6 text-accent mx-auto mb-5"
            strokeWidth={1.5}
          />
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-4">
            AI SEARCH
          </p>
          <h2
            className="font-semibold tracking-tight leading-[1.1] mb-6"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            }}
          >
            AI Search-ი არ ცვლის SEO-ს. ის მას ეყრდნობა.
          </h2>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Google-ის AI Overviews, ChatGPT, Claude, Perplexity — ყველა მათგანი
            Google Search-ის ინდექსსა და ხარისხის სისტემებს ეყრდნობა. თუ საიტი
            ტექნიკურად არ არის გამართული, არ ინდექსირდება ან არ აქვს
            სტრუქტურირებული კონტენტი, AI ძიებაშიც წარმატების შანსი მცირდება.
          </p>
        </div>
      </section>

      {/* ============================================================
          FAQ — native <details> accordion + FAQPage JSON-LD
          ============================================================ */}
      <section
        id="faq"
        className="border-b border-border bg-surface"
      >
        <div className="max-w-3xl mx-auto px-6 py-24 sm:py-28">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground-muted mb-3 text-center">
            FAQ
          </p>
          <h2
            className="font-semibold tracking-tight leading-[1.05] mb-14 text-center"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 4.5vw, 3rem)",
            }}
          >
            ხშირი კითხვები
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {FAQS.map((f, i) => (
              <details key={i} className="group">
                <summary className="flex items-start justify-between gap-4 py-5 cursor-pointer list-none select-none">
                  <span className="font-medium text-foreground text-[16px] sm:text-[17px] leading-snug">
                    {f.q}
                  </span>
                  <ChevronDown
                    className="w-5 h-5 text-foreground-muted shrink-0 transition group-open:rotate-180 mt-0.5"
                    strokeWidth={1.75}
                  />
                </summary>
                <div className="pb-5 text-foreground-muted leading-relaxed text-[15px]">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-24 sm:py-28 text-center">
          <h2
            className="font-semibold tracking-tight leading-[1.05] mb-5"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            }}
          >
            დაიწყე ანალიზი 90 წამში.
          </h2>
          <p className="text-lg text-foreground-muted mb-10">
            უფასოა. რეგისტრაცია არ სჭირდება. შედეგი მყისიერ ანგარიშში.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const finalUrl = (
                document.getElementById("final-url-input") as HTMLInputElement
              )?.value;
              if (!finalUrl) return;
              setUrl(finalUrl);
              setMode("single");
              setLoading(true);
              router.push(
                `/results?url=${encodeURIComponent(normalizeUrl(finalUrl))}`
              );
            }}
            className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
          >
            <input
              id="final-url-input"
              type="text"
              placeholder="example.com"
              disabled={loading}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="flex-1 px-4 py-3 rounded-lg border border-border-strong bg-background text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background font-semibold active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  ანალიზის დაწყება
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-background">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-sm font-medium mb-4">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
                INFINITY SOLUTIONS
              </div>
              <p className="text-[15px] text-foreground-muted leading-relaxed max-w-sm">
                {BRAND.toolName} — ციფრული მარკეტინგის სააგენტო. SEO აუდიტი,
                კონტენტ სტრატეგია და დიგიტალური ზრდა ქართულ ბაზარზე.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: "SEO ანალიზი", href: "#hero" },
                { label: "შედარება", href: "/compare" },
                { label: "შეთავაზება", href: "/seo-offer" },
                { label: "Process", href: "#process" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "INFINITY", href: "#" },
                { label: "Tbilisi, საქართველო", href: "#" },
                { label: "კონტაქტი", href: "mailto:webinfinity17@gmail.com" },
                { label: "FAQ", href: "#faq" },
              ]}
            />
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground-subtle">
              © 2026 INFINITY SOLUTIONS · All rights reserved
            </span>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground-subtle">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
              Made in Tbilisi
            </span>
          </div>
        </div>
      </footer>

      {/* FAQPage JSON-LD for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}

// =====================================================================
// Small presentational helpers
// =====================================================================

function DetailRow({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-background p-6">
      <div className="flex items-baseline gap-4">
        <span className="text-[10px] font-mono text-foreground-subtle tracking-wider w-6 shrink-0">
          {kicker}
        </span>
        <div>
          <h3
            className="font-semibold mb-1"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.125rem",
            }}
          >
            {title}
          </h3>
          <p className="text-[14px] text-foreground-muted leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function ComparePoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px]">
      <Check
        className="w-4 h-4 text-accent shrink-0 mt-1"
        strokeWidth={2.25}
      />
      <span>{children}</span>
    </li>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-subtle mb-4">
        {title}
      </div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-[14px] text-foreground-muted hover:text-foreground transition"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Suppress unused-imports lints for icons reserved for future sections.
const _ICON_RESERVED: ReadonlyArray<typeof Globe> = [Globe, ShieldCheck, Zap];
void _ICON_RESERVED;
