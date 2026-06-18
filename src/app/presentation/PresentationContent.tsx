"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Download,
  Sparkles,
  Globe,
  Image as ImageIcon,
  Lock,
  Presentation as PresentationIcon,
  Loader2,
} from "lucide-react";
import type { AnalysisResult, PageReport, PreviewData } from "@/lib/types";
import {
  buildSlides,
  storageKey,
  STATS_LABELS,
  type PresentationSlide,
  type ProblemEntry,
  type ProblemPageRow,
  type PassEntry,
  type PresentationGroup,
  type ServiceBlock,
  GROUP_LABEL,
} from "@/lib/presentation";
import { BRAND } from "@/lib/brand";

// Editorial / financial-report palette for slides - McKinsey / FT vibe.
// Cream page + deep-navy text + restrained status colours read as a
// professional client deliverable rather than a dashboard screenshot.
// (NAVY_BG name kept for legacy references in slide code.)
const NAVY_BG = "#E8ECE0";

const SLIDE_BG = `
  linear-gradient(rgba(15,27,61,0.04) 1px, transparent 1px) 0 0 / 80px 80px,
  linear-gradient(90deg, rgba(15,27,61,0.04) 1px, transparent 1px) 0 0 / 80px 80px,
  linear-gradient(180deg, #E8ECE0 0%, #E2E7D9 100%)
`;

interface StoredAnalysis {
  url: string;
  fetchedAt: string;
  analysis: AnalysisResult;
  preview?: PreviewData | null;
  subPages?: PageReport[] | null;
}

export default function PresentationContent() {
  const params = useSearchParams();
  const url = params.get("url");
  const [stored, setStored] = useState<StoredAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError("URL არ არის მოწოდებული");
      return;
    }
    try {
      const raw =
        (typeof localStorage !== "undefined"
          ? localStorage.getItem(storageKey(url))
          : null) ??
        (typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(storageKey(url))
          : null);
      if (!raw) {
        setError(
          "ანალიზი ვერ მოიძებნა - ჯერ შეიყვანე URL მთავარ გვერდზე და გაუშვი ანალიზი."
        );
        return;
      }
      const parsed = JSON.parse(raw) as StoredAnalysis;
      setStored(parsed);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "შეცდომა მონაცემების კითხვისას"
      );
    }
  }, [url]);

  const slides = useMemo<PresentationSlide[]>(() => {
    if (!stored) return [];
    return buildSlides(stored.analysis, stored.preview, stored.subPages);
  }, [stored]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-error mb-2">
            პრეზენტაცია ვერ შეიქმნა
          </p>
          <p className="text-sm text-foreground-muted mb-6">
            {error}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-foreground-muted transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            მთავარ გვერდზე
          </Link>
        </div>
      </div>
    );
  }

  if (!stored) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <p className="text-sm text-foreground-muted">იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="presentation-root bg-background min-h-screen">
      <Toolbar slideCount={slides.length} slides={slides} stored={stored} />
      <div className="presentation-deck mx-auto max-w-[1280px] py-8 px-4 sm:px-8 space-y-8">
        {slides.map((slide, i) => (
          <SlideFrame key={i} index={i} total={slides.length} slide={slide} />
        ))}
      </div>
    </div>
  );
}

function Toolbar({
  slideCount,
  slides,
  stored,
}: {
  slideCount: number;
  slides: PresentationSlide[];
  stored: StoredAnalysis;
}) {
  const [exporting, setExporting] = useState(false);

  const handlePrint = () => window.print();

  const handleExportPptx = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { exportToPptx } = await import("@/lib/pptxExport");
      const host = (() => {
        try {
          return new URL(stored.url).host.replace(/^www\./, "");
        } catch {
          return "site";
        }
      })();
      const date = new Date(stored.fetchedAt).toISOString().slice(0, 10);
      await exportToPptx(slides, `seo-report-${host}-${date}.pptx`);
    } catch (e) {
      console.error("PPTX export failed", e);
      alert(
        "PowerPoint ექსპორტი ვერ მოხერხდა - სცადე ხელახლა, ან გამოიყენე PDF."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      data-print-hide
      className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b border-border"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          ანალიზიდან გასვლა
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted">
            {slideCount} სლაიდი
          </span>
          <button
            type="button"
            onClick={handleExportPptx}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-info/40 bg-info/10 hover:bg-info/20 text-info text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PresentationIcon className="w-3.5 h-3.5" />
            )}
            {exporting ? "ექსპორტი..." : "PowerPoint (.pptx)"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-medium transition shadow-sm shadow-accent/20"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function SlideFrame({
  index,
  total,
  slide,
}: {
  index: number;
  total: number;
  slide: PresentationSlide;
}) {
  return (
    <article
      className="slide rounded-lg shadow-2xl shadow-black/20 overflow-hidden"
      style={{ aspectRatio: "16 / 9" }}
    >
      <SlideRenderer slide={slide} slideNumber={index + 1} total={total} />
    </article>
  );
}

function SlideRenderer({
  slide,
  slideNumber,
  total,
}: {
  slide: PresentationSlide;
  slideNumber: number;
  total: number;
}) {
  switch (slide.kind) {
    case "cover":
      return <CoverSlide slide={slide} />;
    case "summary":
      return (
        <SummarySlide slide={slide} slideNumber={slideNumber} total={total} />
      );
    case "problem-pages":
      return (
        <ProblemPagesSlide
          slide={slide}
          slideNumber={slideNumber}
          total={total}
        />
      );
    case "problem":
      return (
        <ProblemSlide slide={slide} slideNumber={slideNumber} total={total} />
      );
    case "recommendations":
      return (
        <RecommendationsSlide
          slide={slide}
          slideNumber={slideNumber}
          total={total}
        />
      );
    case "services":
      return (
        <ServicesSlide
          slide={slide}
          slideNumber={slideNumber}
          total={total}
        />
      );
  }
}

function ProblemPagesSlide({
  slide,
  slideNumber,
  total,
}: {
  slide: Extract<PresentationSlide, { kind: "problem-pages" }>;
  slideNumber: number;
  total: number;
}) {
  const scoreColor = (score: number, error?: string): string => {
    if (error) return "text-[#A4B09B]";
    if (score >= 80) return "text-[#1F6F4A]";
    if (score >= 50) return "text-[#B8843E]";
    return "text-[#A03A3A]";
  };

  const avgColor = scoreColor(slide.averageScore);

  return (
    <div
      className="w-full h-full relative px-12 pt-10 pb-14 text-[#2F3E2E] flex flex-col"
      style={{ background: SLIDE_BG }}
    >
      <header className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#1E3A8A] mb-2">
            მთლიანი საიტი
          </p>
          <h2 className="text-5xl font-semibold tracking-tight">
            პრობლემური გვერდები
          </h2>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#A4B09B] mb-1">
            საშუალო ქულა
          </p>
          <p className={`text-5xl font-semibold tabular-nums ${avgColor}`}>
            {slide.averageScore}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-[#C2CCBA] bg-[#F1F4EC]">
        <div className="grid grid-cols-[2.5rem_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 border-b border-[#C2CCBA] text-[10px] font-mono uppercase tracking-wider text-[#A4B09B]">
          <span>#</span>
          <span>გვერდი</span>
          <span className="text-right">პრობლემები</span>
          <span>მთავარი ხარვეზი</span>
          <span className="text-right">ქულა</span>
        </div>
        <ul className="divide-y divide-[#C2CCBA]">
          {slide.pages.slice(0, 12).map((p, i) => (
            <li
              key={`${p.url}-${i}`}
              className="grid grid-cols-[2.5rem_1fr_auto_auto_auto] gap-x-4 px-5 py-3 items-center"
            >
              <span className="text-[11px] font-mono text-[#A4B09B] tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] text-[#2F3E2E] truncate">
                  {p.url.replace(/^https?:\/\//, "")}
                  {p.isHome && (
                    <span className="ml-2 text-[9px] font-mono uppercase tracking-wider text-[#1E3A8A]">
                      მთავარი
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right text-[11px] font-mono tabular-nums whitespace-nowrap">
                {p.error ? (
                  <span className="text-foreground-muted">-</span>
                ) : (
                  <>
                    <span className="text-[#B8843E]">{p.warnings}w</span>
                    <span className="mx-1.5 text-[#CFD7CA]">·</span>
                    <span className="text-[#A03A3A]">{p.failed}f</span>
                  </>
                )}
              </div>
              <div className="min-w-0 max-w-[14rem]">
                <p className="text-[11px] text-[#6E7C68] truncate">
                  {p.topIssue}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-lg font-semibold tabular-nums ${scoreColor(
                    p.score,
                    p.error
                  )}`}
                >
                  {p.error ? "-" : p.score}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {slide.pages.length > 12 && (
          <p className="px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-[#A4B09B] border-t border-[#C2CCBA]">
            + {slide.pages.length - 12} დამატებითი გვერდი
          </p>
        )}
      </div>

      <SlideFooter
        slideNumber={slideNumber}
        total={total}
        label={slide.siteName}
      />
    </div>
  );
}

function GeometricSquares({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" preserveAspectRatio="xMidYMid meet">
      <rect
        x="30"
        y="20"
        width="200"
        height="200"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.5"
      />
      <rect
        x="100"
        y="90"
        width="200"
        height="200"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.5"
        fill="rgba(255,255,255,0.04)"
      />
      <rect
        x="30"
        y="220"
        width="160"
        height="160"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SlideFooter({
  slideNumber,
  total,
  label,
}: {
  slideNumber: number;
  total: number;
  label?: string;
}) {
  return (
    <footer className="absolute bottom-6 left-10 right-10 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-[#A4B09B]">
      <span className="inline-flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/infinity-logo.png"
          alt=""
          className="w-3.5 h-3.5 object-contain opacity-70"
        />
        {BRAND.agency.toUpperCase()}
      </span>
      {label && <span className="text-[#A4B09B]">{label}</span>}
      <span>
        {slideNumber} / {total}
      </span>
    </footer>
  );
}

function CoverSlide({
  slide,
}: {
  slide: Extract<PresentationSlide, { kind: "cover" }>;
}) {
  const serifFamily = 'Georgia, "Times New Roman", "Playfair Display", serif';

  // Try logoUrl (og:image / twitter:image) first, then siteLogoUrl
  // (apple-touch-icon, Organization schema, body <img class="logo">),
  // then favicon, and finally hide if everything fails. Each URL is
  // routed through /api/image - that proxy strips the Referer (some
  // sites like infinity.ge hotlink-block when Referer is foreign,
  // returning 403) and normalises content-type. Local /logo paths from
  // our own public/ folder skip the proxy.
  const proxy = (u: string) =>
    u.startsWith("/") ? u : `/api/image?url=${encodeURIComponent(u)}`;
  const candidates = [
    slide.logoUrl,
    slide.siteLogoUrl,
    slide.faviconUrl,
  ]
    .filter(
      (u, i, arr): u is string =>
        typeof u === "string" && u.length > 0 && arr.indexOf(u) === i
    )
    .map(proxy);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const currentSrc = candidates[attemptIndex];
  const exhausted = !currentSrc;

  return (
    <div
      className="w-full h-full relative overflow-hidden flex"
      style={{ background: SLIDE_BG }}
    >
      {/* Decorative concentric arcs - top-right corner */}
      <svg
        className="absolute top-0 right-0 pointer-events-none"
        width="420"
        height="420"
        viewBox="0 0 420 420"
        aria-hidden="true"
      >
        <g stroke="#2F3E2E" fill="none" opacity="0.13" strokeWidth="1.5">
          <circle cx="420" cy="0" r="100" />
          <circle cx="420" cy="0" r="190" />
          <circle cx="420" cy="0" r="280" />
          <circle cx="420" cy="0" r="370" />
        </g>
        <g stroke="#2F3E2E" fill="none" opacity="0.07" strokeWidth="1">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * (Math.PI / 2) + Math.PI;
            return (
              <line
                key={i}
                x1={420}
                y1={0}
                x2={420 + Math.cos(a) * 380}
                y2={Math.sin(a) * 380}
              />
            );
          })}
        </g>
      </svg>

      {/* Decorative dot ring - bottom-left, behind GeometricSquares */}
      <svg
        className="absolute -bottom-16 -left-16 pointer-events-none"
        width="280"
        height="280"
        viewBox="0 0 280 280"
        aria-hidden="true"
      >
        <g fill="#2F3E2E" opacity="0.2">
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={140 + Math.cos(a) * 95}
                cy={140 + Math.sin(a) * 95}
                r="2"
              />
            );
          })}
        </g>
        <g fill="#2F3E2E" opacity="0.11">
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={140 + Math.cos(a) * 130}
                cy={140 + Math.sin(a) * 130}
                r="1.3"
              />
            );
          })}
        </g>
      </svg>

      <div className="w-2/5 relative">
        <GeometricSquares className="absolute inset-0 w-full h-full" />
        {!exhausted && (
          <div
            className="absolute bg-white rounded-md overflow-hidden flex items-center justify-center"
            style={{
              top: "30%",
              left: "16%",
              width: "58%",
              aspectRatio: "1 / 1",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={currentSrc}
              src={currentSrc}
              alt={slide.siteName}
              className="w-full h-full object-contain p-3"
              onError={() => setAttemptIndex((i) => i + 1)}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center px-12 py-10 text-[#2F3E2E]">
        <h1
          className="font-semibold tracking-tight leading-[1.05] mb-3"
          style={{
            fontSize: "5.5rem",
            fontFamily: serifFamily,
            wordBreak: "break-word",
          }}
        >
          SEO აუდიტი
        </h1>
        {exhausted && (
          <p
            className="text-2xl text-[#6E7C68] mb-3"
            style={{ fontFamily: serifFamily }}
          >
            {slide.siteName}
          </p>
        )}
        <p className="text-sm font-mono text-[#A4B09B] mb-7 break-all">
          {slide.siteUrl}
        </p>
        <div className="inline-flex">
          <span
            className="px-6 py-2.5 rounded font-medium text-base"
            style={{
              background: "white",
              // Hardcoded deep navy - NAVY_BG used to be navy but after
              // the editorial palette flip it became cream, which made
              // the date invisible on a white pill. Pin to the navy text
              // colour so the pill always reads cleanly.
              color: "#2F3E2E",
              fontFamily: serifFamily,
            }}
          >
            {slide.date}
          </span>
        </div>
      </div>

      <footer className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/infinity-logo.png"
          alt=""
          className="w-6 h-6 object-contain"
        />
        <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-[#A4B09B]">
          made by{" "}
          <span className="text-[#2F3E2E] font-medium">{BRAND.agency.toUpperCase()}</span>
        </p>
      </footer>
    </div>
  );
}

function SummarySlide({
  slide,
  slideNumber,
  total,
}: {
  slide: Extract<PresentationSlide, { kind: "summary" }>;
  slideNumber: number;
  total: number;
}) {
  const groups: PresentationGroup[] = ["technical", "onPage", "offPage"];
  const totalPasses =
    slide.groups.technical.length +
    slide.groups.onPage.length +
    slide.groups.offPage.length;

  return (
    <div
      className="w-full h-full relative px-12 pt-12 pb-14 text-[#2F3E2E]"
      style={{ background: SLIDE_BG }}
    >
      <header className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#A4B09B] mb-2">
          რა მუშაობს კარგად
        </p>
        <h2 className="text-5xl font-semibold tracking-tight mb-3">
          ძლიერი მხარეები
        </h2>
        <p className="text-sm text-[#A4B09B] max-w-2xl">
          ამ{" "}
          <span className="text-[#2F3E2E] font-medium">{totalPasses} პუნქტში</span>{" "}
          თქვენი საიტი უკვე SEO-სტანდარტს აკმაყოფილებს.
        </p>
      </header>
      <div className="grid grid-cols-3 gap-5">
        {groups.map((g, i) => (
          <SummaryColumn
            key={g}
            index={i}
            label={GROUP_LABEL[g]}
            items={slide.groups[g]}
          />
        ))}
      </div>
      <SlideFooter
        slideNumber={slideNumber}
        total={total}
        label={slide.siteName}
      />
    </div>
  );
}

function SummaryColumn({
  index,
  label,
  items,
}: {
  index: number;
  label: string;
  items: PassEntry[];
}) {
  return (
    <div className="rounded-lg bg-[#F1F4EC] border border-[#C2CCBA] p-5">
      <header className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-semibold text-[#B6BFAE] tabular-nums leading-none">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-medium text-[#2F3E2E]">{label}</h3>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#A4B09B]">
            {items.length} პუნქტი
          </p>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="text-xs text-[#A4B09B] italic">
          ჯერ-ჯერობით კარგი არაფერია.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 12).map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[12px] leading-snug text-[#2F3E2E]"
            >
              <Check
                className="w-3 h-3 text-[#1E3A8A] mt-0.5 shrink-0"
                strokeWidth={2.5}
              />
              <span>{item.check.label}</span>
            </li>
          ))}
          {items.length > 12 && (
            <li className="text-[11px] text-[#A4B09B] italic mt-1">
              + {items.length - 12} მეტი
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

const STATUS_DISPLAY = {
  fail: {
    Icon: X,
    label: "კრიტიკული",
    chipBg: "bg-[#A03A3A]",
    chipText: "text-white",
  },
  warn: {
    Icon: AlertTriangle,
    label: "გაფრთხილება",
    chipBg: "bg-[#B8843E]",
    chipText: "text-amber-950",
  },
} as const;

function ProblemSlide({
  slide,
  slideNumber,
  total,
}: {
  slide: Extract<PresentationSlide, { kind: "problem" }>;
  slideNumber: number;
  total: number;
}) {
  const { problem } = slide;
  const isFail = problem.check.status === "fail";
  const status = isFail ? STATUS_DISPLAY.fail : STATUS_DISPLAY.warn;
  const StatusIcon = status.Icon;
  const number = String(slide.slideIndex + 1).padStart(2, "0");
  const noVisual = problem.visual === "noVisual";

  const Header = (
    <header className="mb-5">
      <div className="flex items-start gap-4 mb-4">
        <span
          className={`${
            noVisual ? "text-7xl" : "text-5xl"
          } font-semibold tabular-nums leading-none ${
            isFail ? "text-[#A03A3A]/50" : "text-[#B8843E]/50"
          }`}
        >
          {number}
        </span>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#E1E7DA] text-[#6E7C68] self-start">
            {problem.categoryName}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${status.chipBg} ${status.chipText} self-start`}
          >
            <StatusIcon className="w-3 h-3" strokeWidth={2.25} />
            {status.label}
          </span>
        </div>
      </div>
      <h2
        className={`${
          noVisual ? "text-6xl" : "text-4xl"
        } font-semibold tracking-tight leading-tight mb-2`}
      >
        {problem.check.label}
      </h2>
      {problem.impact && (
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A4B09B]">
          {problem.impact}
        </p>
      )}
    </header>
  );

  const Description = (
    <section className="mb-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A4B09B] mb-2">
        პრობლემის აღწერა
      </p>
      <p
        className={`${
          noVisual ? "text-[16px]" : "text-[15px]"
        } text-[#2F3E2E] leading-relaxed`}
      >
        {problem.check.message}
      </p>
    </section>
  );

  const SeoImpact = problem.seoImpact ? (
    <section className="mb-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8843E] mb-2">
        გავლენა SEO-ზე
      </p>
      <p
        className={`${
          noVisual ? "text-[14px]" : "text-[13px]"
        } text-[#6E7C68] leading-relaxed`}
      >
        {problem.seoImpact}
      </p>
    </section>
  ) : null;

  const Solution = problem.check.recommendation ? (
    <section className="mt-auto pt-5 border-t border-[#C2CCBA]">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#1E3A8A] mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" strokeWidth={2} />
        გადაწყვეტა
      </p>
      <p
        className={`${
          noVisual ? "text-[14px]" : "text-[13px]"
        } text-[#6E7C68] leading-relaxed`}
      >
        {problem.check.recommendation}
      </p>
    </section>
  ) : null;

  if (noVisual) {
    return (
      <div
        className="w-full h-full relative px-16 py-12 text-[#2F3E2E] flex flex-col"
        style={{ background: SLIDE_BG }}
      >
        <div className="max-w-3xl flex flex-col flex-1">
          {Header}
          {Description}
          {SeoImpact}
          {Solution}
        </div>
        <SlideFooter
          slideNumber={slideNumber}
          total={total}
          label={`${slide.slideIndex + 1} / ${slide.totalProblems} პრობლემა`}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative grid grid-cols-2"
      style={{ background: SLIDE_BG }}
    >
      <div className="relative p-10 flex items-center justify-center">
        <ProblemVisual problem={problem} />
      </div>

      <div className="text-[#2F3E2E] p-10 pb-16 flex flex-col">
        {Header}
        {Description}
        {SeoImpact}
        {Solution}

        <SlideFooter
          slideNumber={slideNumber}
          total={total}
          label={`${slide.slideIndex + 1} / ${slide.totalProblems} პრობლემა`}
        />
      </div>
    </div>
  );
}

function RecommendationsSlide({
  slide,
  slideNumber,
  total,
}: {
  slide: Extract<PresentationSlide, { kind: "recommendations" }>;
  slideNumber: number;
  total: number;
}) {
  return (
    <div
      className="w-full h-full relative px-12 pt-10 pb-14 text-[#2F3E2E] flex flex-col"
      style={{ background: SLIDE_BG }}
    >
      <header className="mb-7">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#1E3A8A] mb-2">
          {slide.siteUrl} · ვებსაიტის SEO აუდიტი
        </p>
        <h2 className="text-5xl font-semibold tracking-tight">
          შეჯამება და რეკომენდაციები
        </h2>
      </header>

      <ul className="flex-1 space-y-4 overflow-hidden">
        {slide.items.slice(0, 5).map((item, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className="shrink-0 w-2 h-2 mt-2 rounded-full bg-[#1E3A8A]" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#2F3E2E] mb-1.5 leading-snug">
                {item.title}
              </p>
              <p className="text-[12.5px] text-[#6E7C68] leading-relaxed">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <SlideFooter
        slideNumber={slideNumber}
        total={total}
        label={slide.siteName}
      />
    </div>
  );
}

function ServicesSlide({
  slide,
  slideNumber,
  total,
}: {
  slide: Extract<PresentationSlide, { kind: "services" }>;
  slideNumber: number;
  total: number;
}) {
  return (
    <div
      className="w-full h-full relative px-12 pt-10 pb-14 text-[#2F3E2E] flex flex-col"
      style={{ background: SLIDE_BG }}
    >
      <header className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#1E3A8A] mb-2">
          {BRAND.agency.toUpperCase()}
        </p>
        <h2 className="text-4xl font-semibold tracking-tight text-[#2F3E2E]">
          რას მოიცავს SEO სერვისი?
        </h2>
      </header>

      <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
        {slide.blocks.map((block, i) => (
          <ServiceBlockCard key={i} block={block} index={i} />
        ))}
      </div>

      <SlideFooter
        slideNumber={slideNumber}
        total={total}
        label={slide.siteName}
      />
    </div>
  );
}

function ServiceBlockCard({
  block,
  index,
}: {
  block: ServiceBlock;
  index: number;
}) {
  return (
    <div className="rounded-lg bg-[#F1F4EC] border border-[#C2CCBA] p-4 flex flex-col min-h-0">
      <header className="flex items-center gap-2.5 mb-3 pb-2 border-b border-[#C2CCBA]">
        <span className="text-xl font-semibold text-[#B6BFAE] tabular-nums leading-none shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-[14px] font-semibold text-[#2F3E2E] leading-tight">
          {block.title}
        </h3>
      </header>
      <ul className="space-y-1 overflow-hidden">
        {block.items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-1.5 text-[10.5px] leading-snug text-[#2F3E2E]"
          >
            <Check
              className="w-2.5 h-2.5 text-[#1E3A8A] mt-0.5 shrink-0"
              strokeWidth={3}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemVisual({ problem }: { problem: ProblemEntry }) {
  const { visual, check } = problem;
  switch (visual) {
    case "serp":
      return <SerpVisual check={check} />;
    case "facebook":
      return <FacebookVisual check={check} />;
    case "twitter":
      return <TwitterVisual check={check} />;
    case "code-empty":
      return <CodeEmptyVisual check={check} />;
    case "file-missing":
      return <FileMissingVisual check={check} />;
    case "sitemap-missing":
      return <SitemapMissingVisual />;
    case "broken-links":
      return <BrokenLinksVisual check={check} />;
    case "stats":
      return <StatsVisual check={check} />;
    case "alt-missing":
      return <AltMissingVisual />;
    case "https-warning":
      return <HttpsWarningVisual check={check} />;
    case "headings":
      return <HeadingsVisual check={check} />;
    case "noVisual":
      return null;
    case "generic":
    default:
      return <GenericVisual check={check} />;
  }
}

function VisualCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl shadow-black/20 text-zinc-900">
      {children}
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function SerpVisual({
  check,
}: {
  check: { value?: unknown; label: string };
}) {
  const value = typeof check.value === "string" ? check.value : "";
  const isTitleCheck = check.label === "Title Tag";
  const isDescCheck = check.label === "Meta Description";
  return (
    <VisualCard>
      <div className="flex items-center gap-2 mb-1.5">
        <Globe className="w-[18px] h-[18px] text-foreground-subtle" strokeWidth={1.5} />
        <span className="text-[12px] text-zinc-700">თქვენი საიტი</span>
      </div>
      <h4 className="text-blue-700 text-[18px] leading-snug mb-1.5 break-words">
        {isTitleCheck && value
          ? truncate(value, 60)
          : "გვერდის სათაური"}
      </h4>
      {isDescCheck && !value ? (
        <p className="text-sm text-error italic leading-snug">
          Description-ი არ არის - Google ავტომატურად აიღებს შემთხვევით ტექსტს.
        </p>
      ) : (
        <p className="text-sm text-zinc-700 leading-snug">
          {isDescCheck && value
            ? truncate(value, 160)
            : "გვერდის აღწერა გამოჩნდება ძიების შედეგებში."}
        </p>
      )}
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        Google ძიების შედეგი
      </p>
    </VisualCard>
  );
}

function FacebookVisual({ check }: { check: { label: string } }) {
  return (
    <VisualCard>
      <div className="rounded-md overflow-hidden border border-zinc-200">
        <div className="aspect-[1.91/1] bg-zinc-100 flex items-center justify-center">
          <div className="text-center px-4">
            <X
              className="w-8 h-8 mx-auto mb-2 text-error"
              strokeWidth={1.5}
            />
            <p className="text-xs text-zinc-600">
              {check.label === "Open Graph"
                ? "Open Graph tags არ არის"
                : "სურათი ვერ ჩატვირთა"}
            </p>
          </div>
        </div>
        <div className="px-3 py-2.5 bg-zinc-50">
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">
            yoursite.com
          </p>
          <p className="text-sm font-semibold text-foreground-subtle italic">
            (სათაური არ არის)
          </p>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        Facebook გაზიარება
      </p>
    </VisualCard>
  );
}

function TwitterVisual({ check }: { check: { label: string } }) {
  return (
    <VisualCard>
      <div className="rounded-2xl overflow-hidden border border-zinc-200">
        <div className="aspect-[1.91/1] bg-zinc-100 flex items-center justify-center">
          <div className="text-center px-4">
            <X
              className="w-8 h-8 mx-auto mb-2 text-error"
              strokeWidth={1.5}
            />
            <p className="text-xs text-zinc-600">
              {check.label === "Twitter Card"
                ? "Twitter Card tag არ არის"
                : "სურათი არ არის"}
            </p>
          </div>
        </div>
        <div className="px-3 py-3">
          <p className="text-sm font-semibold text-foreground-subtle italic">
            (Twitter Card არ არის)
          </p>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        Twitter / X გაზიარება
      </p>
    </VisualCard>
  );
}

function CodeEmptyVisual({ check }: { check: { label: string } }) {
  return (
    <VisualCard>
      <div className="rounded-md overflow-hidden border border-zinc-200 bg-zinc-950 text-zinc-300 font-mono text-[12px]">
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="ml-2 text-[10px] uppercase tracking-wider text-foreground-muted">
            JSON-LD
          </span>
        </div>
        <div className="p-4 space-y-1 leading-relaxed">
          <div className="text-foreground-muted">{`<!-- ${check.label} -->`}</div>
          <div className="opacity-40 text-zinc-600">{`<script type="application/ld+json">`}</div>
          <div className="ml-4 text-red-400/70">{`// ❌ schema არ არის გენერირებული`}</div>
          <div className="opacity-40 text-zinc-600">{`</script>`}</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        HTML &lt;head&gt;
      </p>
    </VisualCard>
  );
}

function FileMissingVisual({ check }: { check: { label: string } }) {
  return (
    <VisualCard>
      <div className="px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-t-md font-mono text-[13px]">
        <span className="text-foreground-muted">GET</span>{" "}
        <span className="text-zinc-900">/{check.label.toLowerCase()}</span>
      </div>
      <div className="border border-t-0 border-zinc-200 rounded-b-md p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-3">
          <X className="w-8 h-8 text-error" strokeWidth={2} />
        </div>
        <p className="text-2xl font-mono font-semibold text-error mb-1">404</p>
        <p className="text-sm text-foreground-muted">ფაილი ვერ მოიძებნა</p>
      </div>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        HTTP REQUEST
      </p>
    </VisualCard>
  );
}

function BrokenLinksVisual({ check }: { check: { value?: unknown } }) {
  const items = Array.isArray(check.value)
    ? (check.value as string[]).slice(0, 5)
    : [];
  return (
    <VisualCard>
      <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-md overflow-hidden">
        {items.length === 0 && (
          <li className="px-4 py-4 text-xs text-foreground-muted italic">
            ბმულები ვერ ვნახე
          </li>
        )}
        {items.map((item, i) => (
          <li
            key={i}
            className="px-4 py-3 flex items-start gap-2 font-mono text-[11px]"
          >
            <X
              className="w-3.5 h-3.5 text-error mt-0.5 shrink-0"
              strokeWidth={2.5}
            />
            <span className="break-all text-zinc-700">{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        გატეხილი ბმულები
      </p>
    </VisualCard>
  );
}

function ImageBadVisual() {
  return (
    <VisualCard>
      <div className="aspect-video rounded bg-gradient-to-br from-zinc-100 to-zinc-200 mb-3 flex items-center justify-center">
        <ImageIcon
          className="w-12 h-12 text-zinc-300"
          strokeWidth={1.25}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-foreground-muted">image.jpg</span>
        <span className="text-error">2.4 MB · JPG</span>
      </div>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        სურათების ოპტიმიზაცია
      </p>
    </VisualCard>
  );
}

function StatsVisual({ check }: { check: { value?: unknown; label: string } }) {
  const value = String(check.value ?? "");
  let current = 0;
  let total = 0;
  let parsed = false;
  if (value.includes("/")) {
    const parts = value.split("/").map((s) => parseInt(s.trim(), 10));
    if (!Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      current = parts[0];
      total = parts[1];
      parsed = true;
    }
  }
  const subtext = STATS_LABELS[check.label] ?? check.label;

  // No measurable data - either the page genuinely has zero items of this
  // type (e.g. no <img> tags in HTML - often means JS-rendered content)
  // or the check returned without a numeric value. Show an honest
  // "not measurable" state instead of a misleading "0% კრიტიკული" chip.
  if (!parsed || total === 0) {
    return (
      <VisualCard>
        <div className="text-center pb-1">
          <div className="text-5xl font-semibold text-zinc-400 tabular-nums leading-none">
            -
          </div>
          <p className="text-[11px] text-foreground-muted uppercase tracking-wider mt-3">
            {subtext}
          </p>
        </div>
        <p className="text-center text-[10.5px] leading-snug text-foreground-muted mt-6 mb-1 px-2">
          ამ გვერდის HTML-ში ელემენტი ვერ მოიძებნა.
          <br />
          შესაძლოა საიტი კონტენტს JavaScript-ით ხატავს, რასაც სტატიკური სკანერი
          ვერ ხედავს.
        </p>
        <p className="text-center text-[9.5px] font-mono uppercase tracking-wider text-foreground-subtle mt-4">
          მონაცემები არ არის
        </p>
      </VisualCard>
    );
  }

  const percentage = Math.round((current / total) * 100);
  const displayTotal = Math.min(total, 60);
  const displayCurrent = Math.round((current / total) * displayTotal);
  const dots = Array.from({ length: displayTotal }, (_, i) => i < displayCurrent);
  const fillColor =
    percentage >= 70
      ? "bg-emerald-500"
      : percentage >= 30
      ? "bg-amber-500"
      : "bg-red-500";

  // Percentage label phrased as *coverage* not severity. Previous wording
  // ("0% კრიტიკული") read like a severity rating which confused readers -
  // it actually means "0% of items are good", i.e. coverage rate.
  const coverageLabel =
    percentage >= 70
      ? "კარგი დაფარვა"
      : percentage >= 30
      ? "ნაწილობრივი დაფარვა"
      : "სუსტი დაფარვა";

  return (
    <VisualCard>
      <div className="text-center pb-1">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl font-semibold text-zinc-900 tabular-nums leading-none">
            {current}
          </span>
          <span className="text-2xl text-zinc-300">/</span>
          <span className="text-2xl text-foreground-muted tabular-nums">{total}</span>
        </div>
        <p className="text-[11px] text-foreground-muted uppercase tracking-wider mt-2">
          {subtext}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-1 my-5">
        {dots.map((filled, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${
              filled ? fillColor : "bg-zinc-100"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        {percentage}% {coverageLabel}
      </p>
    </VisualCard>
  );
}

function SitemapMissingVisual() {
  return (
    <VisualCard>
      <div className="rounded-md overflow-hidden border border-zinc-200 font-mono text-[11px] relative bg-white">
        <div className="px-3 py-2 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
          <span className="text-foreground-muted">sitemap.xml</span>
        </div>
        <div className="p-4 space-y-1 leading-relaxed text-zinc-700 opacity-30 select-none">
          <div>{`<?xml version="1.0" encoding="UTF-8"?>`}</div>
          <div>{`<urlset xmlns="...">`}</div>
          <div className="ml-3">{`<url>`}</div>
          <div className="ml-6">{`<loc>https://...</loc>`}</div>
          <div className="ml-6">{`<lastmod>2026-05-07</lastmod>`}</div>
          <div className="ml-3">{`</url>`}</div>
          <div className="ml-3">{`<url>`}</div>
          <div className="ml-6">{`<loc>https://.../about</loc>`}</div>
          <div className="ml-3">{`</url>`}</div>
          <div>{`</urlset>`}</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="text-center">
            <X
              className="w-12 h-12 mx-auto mb-2 text-error"
              strokeWidth={2}
            />
            <p className="text-base font-semibold text-error">
              Sitemap არ არსებობს
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        XML SITEMAP
      </p>
    </VisualCard>
  );
}

function AltMissingVisual() {
  return (
    <VisualCard>
      <div className="aspect-video rounded bg-gradient-to-br from-zinc-100 to-zinc-200 mb-4 flex items-center justify-center relative">
        <ImageIcon
          className="w-12 h-12 text-zinc-300"
          strokeWidth={1.25}
        />
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/90 text-white">
          no alt
        </span>
      </div>
      <pre className="text-[11px] font-mono leading-relaxed text-foreground-muted whitespace-pre-wrap">{`<img src="..." />`}</pre>
      <p className="mt-2 text-[11px] text-error">alt ატრიბუტი არ არის</p>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        ALT ტექსტი
      </p>
    </VisualCard>
  );
}

function HttpsWarningVisual({ check }: { check: { label: string } }) {
  return (
    <VisualCard>
      <div className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-100 font-mono text-[12px]">
        <Lock className="w-3.5 h-3.5 text-error" strokeWidth={2} />
        <span className="text-error font-medium">{check.label}</span>
        <span className="ml-auto text-foreground-subtle truncate">
          {check.label === "HTTPS"
            ? "http://yoursite.com"
            : "yoursite.com"}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-foreground-muted leading-relaxed">
        {check.label === "HTTPS"
          ? "ბრაუზერი მომხმარებელს აფრთხილებს ცუდი დაცვის შესახებ."
          : "კონფიგურაცია არ აკმაყოფილებს თანამედროვე SEO სტანდარტებს."}
      </p>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        ბრაუზერის მისამართი
      </p>
    </VisualCard>
  );
}

function HeadingsVisual({ check }: { check: { value?: unknown } }) {
  const display =
    typeof check.value === "string" ? check.value : "H2: 0, H3: 0, H4: 0";
  return (
    <VisualCard>
      <div className="font-mono text-[12px] leading-relaxed">
        <div className="text-zinc-700">H1 - გვერდის სათაური</div>
        <div className="ml-4 text-foreground-subtle">(H2 აკლია)</div>
        <div className="ml-8 text-amber-600">⚠ H4 პირდაპირ H1-ის ქვეშ</div>
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-wider text-foreground-subtle">
        გვერდზე: {display}
      </p>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
        სათაურების იერარქია
      </p>
    </VisualCard>
  );
}

function GenericVisual({
  check,
}: {
  check: { label: string; status: string };
}) {
  const isFail = check.status === "fail";
  return (
    <VisualCard>
      <div className="text-center py-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            isFail ? "bg-red-500/10" : "bg-amber-500/10"
          }`}
        >
          {isFail ? (
            <X className="w-10 h-10 text-error" strokeWidth={2} />
          ) : (
            <AlertTriangle
              className="w-10 h-10 text-warning"
              strokeWidth={2}
            />
          )}
        </div>
        <p className="text-base font-medium text-zinc-900">{check.label}</p>
        <p className="mt-2 text-[11px] uppercase tracking-wider font-mono text-foreground-muted">
          {isFail ? "კრიტიკული პრობლემა" : "გაფრთხილება"}
        </p>
      </div>
    </VisualCard>
  );
}
