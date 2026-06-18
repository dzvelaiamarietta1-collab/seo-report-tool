"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import { AnimatedField } from "./AnimatedField";
import { useLocale } from "@/lib/locale";

type Mode = "single" | "compare";
type Depth = 1 | 5 | 10;

const DEPTH_VALUES: Depth[] = [1, 5, 10];
const MAX_COMPETITORS = 3;

export function HeroSection() {
  const { t } = useLocale();
  const router = useRouter();

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

  const [cycleIndex, setCycleIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setCycleIndex((i) => (i + 1) % t.hero.cycle.length),
      2600
    );
    return () => clearInterval(id);
  }, [t.hero.cycle.length]);

  const normalizeUrl = (v: string) => (v.startsWith("http") ? v : `https://${v}`);
  const validateUrl = (v: string) => {
    if (!v.trim()) return t.hero.errors.empty;
    try {
      const u = new URL(normalizeUrl(v));
      if (!u.hostname.includes(".")) return t.hero.errors.invalidFormat;
      return "";
    } catch {
      return t.hero.errors.invalidUrl;
    }
  };

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
    if (errs.some((x) => x !== "")) {
      setCompareErrors(errs);
      return;
    }
    setCompareErrors([]);
    setLoading(true);
    const urls = allRaw.map(normalizeUrl);
    const param = urls.map(encodeURIComponent).join(",");
    router.push(`/compare?urls=${param}`);
  };

  const word = t.hero.cycle[cycleIndex] ?? t.hero.cycle[0];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-28 pb-16"
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[560px] h-[560px] lg:w-[760px] lg:h-[760px] opacity-40 pointer-events-none">
        <AnimatedField />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-foreground/10"
            style={{ top: `${12.5 * (i + 1)}%` }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-foreground/10"
            style={{ left: `${(100 / 13) * (i + 1)}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 pt-10 lg:pt-16">
        <div className="mb-8">
          <span className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.32em] text-foreground/55">
            <span className="w-8 h-px bg-foreground/30" />
            {t.hero.eyebrow}
          </span>
        </div>

        <h1
          className="font-display tracking-tight leading-[0.95] mb-10"
          style={{ fontSize: "clamp(2.75rem, 11vw, 9rem)" }}
        >
          <span className="block">{t.hero.h1Line1}</span>
          <span className="block">
            <span className="relative inline-block">
              <span key={cycleIndex} className="inline-flex">
                {word.split("").map((ch, i) => (
                  <span
                    key={`${cycleIndex}-${i}`}
                    className="animate-char-in italic"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-3 bg-foreground/10 -z-10" />
            </span>
          </span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <div className="max-w-xl">
            <p className="text-lg lg:text-xl text-foreground/65 leading-relaxed mb-6">
              {t.hero.sub}
            </p>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-foreground/45 mb-4">
              {t.hero.freeNote}
            </p>
            <a
              href="/results?url=https%3A%2F%2Finfinity.ge"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors border-b border-foreground/20 hover:border-foreground/60 pb-0.5"
            >
              {t.hero.sampleLink}
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </a>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-sm p-5 lg:p-6 shadow-[0_4px_32px_-12px_rgba(10,10,10,0.12)]">
            <div className="flex gap-1 p-1 bg-foreground/[0.04] rounded-lg border border-foreground/10 mb-4">
              <button
                type="button"
                onClick={() => setMode("single")}
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition disabled:opacity-50 ${
                  mode === "single"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                }`}
              >
                {t.hero.modeSingle}
              </button>
              <button
                type="button"
                onClick={() => setMode("compare")}
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium transition disabled:opacity-50 ${
                  mode === "compare"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground/55 hover:text-foreground"
                }`}
              >
                {t.hero.modeCompare}
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
                    placeholder={t.hero.placeholder}
                    disabled={loading}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="flex-1 px-4 py-3 rounded-full border border-foreground/15 bg-background text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.02] transition disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-medium active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t.hero.analyzeBtn}
                        <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                      </>
                    )}
                  </button>
                </div>
                {error && <p className="text-sm text-[var(--error)] mb-3">{error}</p>}
                <div className="mt-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/55 mb-2">
                    {t.hero.depthLabel}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {DEPTH_VALUES.map((value, i) => {
                      const opt = t.hero.depth[i];
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDepth(value)}
                          disabled={loading}
                          className={`text-left rounded-lg border px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            depth === value
                              ? "border-foreground/40 bg-foreground/[0.04]"
                              : "border-foreground/10 hover:border-foreground/25"
                          }`}
                        >
                          <div
                            className={`text-[13px] font-medium ${
                              depth === value ? "text-foreground" : "text-foreground/85"
                            }`}
                          >
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-foreground/55 leading-snug mt-0.5">
                            {opt.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompareSubmit}>
                <div className="space-y-3 mb-3">
                  <label className="block">
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/55 mb-1.5 block">
                      {t.hero.yourSite}
                    </span>
                    <input
                      type="text"
                      value={mainUrl}
                      onChange={(e) => {
                        setMainUrl(e.target.value);
                        if (compareErrors.length) setCompareErrors([]);
                      }}
                      placeholder={t.hero.yourSitePlaceholder}
                      disabled={loading}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="w-full px-4 py-3 rounded-full border border-foreground/15 bg-background text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.02] transition disabled:opacity-50"
                    />
                    {compareErrors[0] && (
                      <p className="text-sm text-[var(--error)] mt-1">
                        {compareErrors[0]}
                      </p>
                    )}
                  </label>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground/55 mb-1.5 block">
                      {t.hero.competitorsLabel} ({visibleCompetitors}/{MAX_COMPETITORS})
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
                            placeholder={`${t.hero.competitor} ${i + 1}`}
                            disabled={loading}
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className="flex-1 px-4 py-3 rounded-full border border-foreground/10 bg-background text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.02] transition disabled:opacity-50"
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
                              className="px-3 rounded-full border border-foreground/10 text-foreground/55 hover:bg-foreground/[0.04] transition disabled:opacity-50"
                              aria-label={t.hero.removeAria}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {compareErrors.slice(1).map((err, i) =>
                        err ? (
                          <p key={i} className="text-sm text-[var(--error)]">
                            {err}
                          </p>
                        ) : null
                      )}
                      {visibleCompetitors < MAX_COMPETITORS && (
                        <button
                          type="button"
                          onClick={() => setVisibleCompetitors(visibleCompetitors + 1)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 text-sm text-foreground/55 hover:text-foreground transition disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t.hero.competitor}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-foreground text-background font-medium active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.hero.compareBtn}
                      <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-20 lg:mt-28 overflow-hidden border-y border-foreground/10 py-6">
        <div className="flex gap-16 marquee whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-16 shrink-0">
              {t.hero.stats.map((s, i) => (
                <div key={`${dup}-${i}`} className="flex items-baseline gap-3 px-2">
                  <span
                    className="font-display"
                    style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-foreground/55">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
