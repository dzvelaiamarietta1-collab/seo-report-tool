"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";
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

const DEPTH_OPTIONS: { value: Depth; label: string; hint: string }[] = [
  { value: 1, label: "მთავარი", hint: "5-15წ · მხოლოდ მთავარი გვერდი" },
  { value: 5, label: "ღრმა (5)", hint: "30-60წ · მთავარი + 4 ქვეგვერდი" },
  { value: 10, label: "სრული (10)", hint: "60-120წ · მთავარი + 9 ქვეგვერდი" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<Depth>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateUrl = (value: string): string => {
    if (!value.trim()) return "გთხოვთ, შეიყვანოთ ვებგვერდის მისამართი";
    try {
      const u = new URL(value.startsWith("http") ? value : `https://${value}`);
      if (!u.hostname.includes(".")) return "არასწორი მისამართის ფორმატი";
      return "";
    } catch {
      return "არასწორი URL";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUrl(url);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const depthParam = depth > 1 ? `&depth=${depth}` : "";
    router.push(`/results?url=${encodeURIComponent(normalized)}${depthParam}`);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-foreground-muted mb-4">
            {BRAND.name} · 2026
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
            {BRAND.tagline}
          </h1>
          <p className="text-base text-foreground-muted leading-relaxed">
            ტექნიკური, On-Page, Performance და AI-ეპოქის სრული აუდიტი.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
          {error && (
            <p className="text-sm text-error mb-3">{error}</p>
          )}

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
  );
}
