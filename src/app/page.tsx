"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";

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

export default function Home() {
  const [url, setUrl] = useState("");
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
    router.push(`/results?url=${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-12">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mb-4">
            SEO Report Tool · 2026
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4 leading-tight">
            ვებგვერდის SEO ანალიზი
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
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
              className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium active:scale-[0.98] transition shadow-sm shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  ანალიზი
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-500 mb-3">{error}</p>
          )}
        </form>

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-900">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              რას ვამოწმებთ
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
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
                  className="group flex items-start gap-2 px-3 py-2 -mx-3 rounded-md hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-100">
                      <span className="font-medium truncate">{r.label}</span>
                      <ArrowUpRight
                        className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition shrink-0"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-500 leading-snug truncate">
                      {r.description}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-12">
          v0.1 MVP · მხოლოდ საჯარო ვებგვერდები
        </p>
      </div>
    </div>
  );
}
