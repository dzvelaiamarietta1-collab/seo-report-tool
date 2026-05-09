"use client";

import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  FileText,
  Zap,
  Tag,
  Bot,
  Link as LinkIcon,
  Lightbulb,
  Check,
  X,
  AlertTriangle,
  Info,
  ArrowLeft,
  Loader2,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  Target,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type {
  AnalysisResult,
  CategoryKey,
  CategoryResult,
  CheckResult,
  CheckStatus,
  PreviewData,
  ShareImageCheck,
  StageId,
  StreamEvent,
  BotProtection,
} from "@/lib/types";
import {
  buildFixContext,
  getFixesForCheck,
  type FixContext,
  type FixTemplate,
} from "@/lib/fixes";
import {
  CHECK_IMPACT,
  checkAnchorId,
  getTopPriorities,
  type PriorityItem,
} from "@/lib/checkMeta";
import { storageKey } from "@/lib/presentation";
import { calculateSummary } from "@/lib/summary";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wrench,
  FileText,
  Zap,
  Tag,
  Bot,
  Link: LinkIcon,
};

const CATEGORY_ORDER: CategoryKey[] = [
  "technical",
  "onPage",
  "linkHealth",
  "performance",
  "schema",
  "aiEra",
];

const CATEGORY_FALLBACK: Record<CategoryKey, { name: string; icon: string }> = {
  technical: { name: "ტექნიკური SEO", icon: "Wrench" },
  onPage: { name: "On-Page SEO", icon: "FileText" },
  linkHealth: { name: "ბმულების ჯანმრთელობა", icon: "Link" },
  performance: { name: "Performance (Core Web Vitals)", icon: "Zap" },
  schema: { name: "Schema & სოც.მედია", icon: "Tag" },
  aiEra: { name: "GEO — Generative Engine", icon: "Bot" },
};

const STAGE_LABELS: Record<StageId, string> = {
  fetch: "გვერდის HTML-ის ჩამოტვირთვა",
  extras: "robots.txt, sitemap, llms.txt",
  analyze: "HTML ანალიზი",
  links: "შიდა ბმულების შემოწმება",
  pagespeed: "Google PageSpeed Insights",
};

const ALL_STAGES: StageId[] = [
  "fetch",
  "extras",
  "analyze",
  "links",
  "pagespeed",
];

const STATUS_META = {
  pass: {
    Icon: Check,
    border: "border-zinc-200 dark:border-zinc-900",
    accent: "",
    iconColor: "text-emerald-500",
    label: "გავიდა",
  },
  warn: {
    Icon: AlertTriangle,
    border: "border-zinc-200 dark:border-zinc-900",
    accent: "border-l-2 border-l-amber-500",
    iconColor: "text-amber-500",
    label: "გაფრთხილება",
  },
  fail: {
    Icon: X,
    border: "border-zinc-200 dark:border-zinc-900",
    accent: "border-l-2 border-l-red-500",
    iconColor: "text-red-500",
    label: "ჩაიჭრა",
  },
  info: {
    Icon: Info,
    border: "border-zinc-200 dark:border-zinc-900",
    accent: "border-l-2 border-l-cyan-500",
    iconColor: "text-cyan-500",
    label: "info",
  },
};

const CODE_PATTERN = /(<[^>]+>|`[^`]+`|"[^"]{3,}")/g;

function formatMessage(text: string): ReactNode[] {
  const parts = text.split(CODE_PATTERN);
  return parts.map((part, i) => {
    if (/^<[^>]+>$/.test(part) || /^`.+`$/.test(part)) {
      const clean = part.replace(/^`|`$/g, "");
      return (
        <code
          key={i}
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[0.85em] font-mono text-zinc-900 dark:text-zinc-200 align-baseline"
        >
          {clean}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function FixSnippet({ template }: { template: FixTemplate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failure
    }
  };

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50/40 dark:bg-zinc-950">
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600 shrink-0">
            {template.language}
          </span>
          {template.filename && (
            <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 truncate">
              {template.filename}
            </span>
          )}
          <span className="text-[12px] text-zinc-600 dark:text-zinc-400 truncate">
            {template.title}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          data-print-hide
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
              კოპირდა
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </header>
      <pre className="overflow-x-auto px-3 py-3 text-[12px] font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre">
        <code>{template.code}</code>
      </pre>
      {template.note && (
        <p className="px-3 py-2 text-[11px] text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 leading-relaxed">
          {template.note}
        </p>
      )}
    </div>
  );
}

function CheckCard({
  check,
  fixContext,
  anchorId,
}: {
  check: CheckResult;
  fixContext: FixContext | null;
  anchorId?: string;
}) {
  const meta = STATUS_META[check.status];
  const StatusIcon = meta.Icon;
  const fixes =
    check.status !== "pass" && fixContext
      ? getFixesForCheck(check.label, fixContext, check.value)
      : [];
  const impact = CHECK_IMPACT[check.label];

  return (
    <div
      id={anchorId}
      className={`group scroll-mt-24 rounded-lg border ${meta.border} ${meta.accent} bg-white dark:bg-zinc-950 p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-800`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-medium text-[15px] text-zinc-900 dark:text-zinc-100 leading-snug">
          {check.label}
        </h4>
        {check.status !== "pass" && (
          <StatusIcon
            strokeWidth={2}
            className={`w-4 h-4 shrink-0 mt-0.5 ${meta.iconColor}`}
          />
        )}
        {check.status === "pass" && (
          <StatusIcon
            strokeWidth={2.5}
            className="w-4 h-4 shrink-0 mt-0.5 text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500/70 transition-colors"
          />
        )}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">
        {formatMessage(check.message)}
      </p>
      {check.recommendation && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex items-start gap-2.5">
            <Lightbulb
              strokeWidth={1.75}
              className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400 dark:text-zinc-600"
            />
            <p className="text-[13px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
              {formatMessage(check.recommendation)}
            </p>
          </div>
        </div>
      )}
      {Array.isArray(check.value) &&
        check.value.length > 0 &&
        check.status !== "pass" && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
            <ul className="space-y-1 text-[12px] font-mono text-zinc-600 dark:text-zinc-400 max-h-48 overflow-y-auto pr-1">
              {check.value.map((v, i) => (
                <li key={i} className="break-all leading-snug" title={v}>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      {impact && (
        <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          {impact}
        </p>
      )}
      {fixes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
          {fixes.map((f, i) => (
            <FixSnippet key={`${f.title}-${i}`} template={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function PassedList({ checks }: { checks: CheckResult[] }) {
  const [expanded, setExpanded] = useState(false);
  if (checks.length === 0) return null;
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        )}
        <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
        წესრიგშია ({checks.length})
      </button>
      {expanded && (
        <ul className="mt-3 ml-1 space-y-1.5">
          {checks.map((c, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] leading-snug"
            >
              <Check
                className="w-3 h-3 text-emerald-500 mt-1 shrink-0"
                strokeWidth={2.5}
              />
              <span className="min-w-0">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {c.label}
                </span>
                <span className="text-zinc-500 dark:text-zinc-500"> · </span>
                <span className="text-zinc-500 dark:text-zinc-500">
                  {c.message}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategorySection({
  category,
  categoryKey,
  fixContext,
  filter,
}: {
  category: CategoryResult;
  categoryKey: CategoryKey;
  fixContext: FixContext | null;
  filter: CheckStatus | null;
}) {
  const stats = category.checks.reduce(
    (acc, c) => {
      if (c.status === "pass") acc.pass++;
      else if (c.status === "warn") acc.warn++;
      else if (c.status === "fail") acc.fail++;
      else acc.info++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, info: 0 }
  );
  const scored = stats.pass + stats.warn + stats.fail;
  const passRate = scored > 0 ? Math.round((stats.pass / scored) * 100) : 0;
  const Icon = CATEGORY_ICONS[category.icon] ?? FileText;

  const visibleCards = category.checks
    .map((c, originalIdx) => ({ check: c, originalIdx }))
    .filter(({ check }) => {
      if (filter) return check.status === filter;
      return check.status !== "pass";
    });
  const passedChecks =
    filter === null
      ? category.checks.filter((c) => c.status === "pass")
      : [];

  if (
    filter &&
    visibleCards.length === 0 &&
    passedChecks.length === 0
  )
    return null;

  return (
    <section>
      <header className="flex items-end justify-between gap-4 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-900">
        <h2 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2.5">
          <Icon
            strokeWidth={1.75}
            className="w-4 h-4 text-zinc-400 dark:text-zinc-500"
          />
          {category.name}
        </h2>
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          {scored > 0 && (
            <>
              <div className="hidden sm:block w-24 h-1 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passRate >= 80
                      ? "bg-emerald-500/70"
                      : passRate >= 50
                      ? "bg-amber-500/70"
                      : "bg-red-500/70"
                  }`}
                  style={{ width: `${passRate}%` }}
                />
              </div>
              <span className="text-zinc-500 dark:text-zinc-500">
                <span className="text-zinc-900 dark:text-zinc-100">
                  {stats.pass}
                </span>
                <span className="mx-1">/</span>
                <span>{scored}</span>
              </span>
              {stats.warn > 0 && (
                <span className="text-amber-600 dark:text-amber-500">
                  {stats.warn}w
                </span>
              )}
              {stats.fail > 0 && (
                <span className="text-red-600 dark:text-red-500">
                  {stats.fail}f
                </span>
              )}
            </>
          )}
        </div>
      </header>
      {visibleCards.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleCards.map(({ check: c, originalIdx }) => (
            <CheckCard
              key={`${c.label}-${originalIdx}`}
              check={c}
              fixContext={fixContext}
              anchorId={checkAnchorId(categoryKey, originalIdx)}
            />
          ))}
        </div>
      )}
      <PassedList checks={passedChecks} />
    </section>
  );
}

function CategoryPlaceholder({ categoryKey }: { categoryKey: CategoryKey }) {
  const meta = CATEGORY_FALLBACK[categoryKey];
  const Icon = CATEGORY_ICONS[meta.icon] ?? FileText;
  return (
    <section data-print-hide>
      <header className="flex items-end justify-between gap-4 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-900">
        <h2 className="text-[15px] font-medium text-zinc-400 dark:text-zinc-600 inline-flex items-center gap-2.5">
          <Icon
            strokeWidth={1.75}
            className="w-4 h-4 text-zinc-300 dark:text-zinc-700"
          />
          {meta.name}
        </h2>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-600" />
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 h-24 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

type PreviewStatus = "full" | "partial" | "empty";

function PreviewCard({
  label,
  status,
  children,
}: {
  label: string;
  status: PreviewStatus;
  children: ReactNode;
}) {
  const statusMeta = {
    full: { label: "სრული", color: "text-emerald-500", Icon: Check },
    partial: { label: "ნაწილობრივი", color: "text-amber-500", Icon: AlertTriangle },
    empty: { label: "ცარიელი", color: "text-red-500", Icon: X },
  }[status];
  const StatusIcon = statusMeta.Icon;
  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </p>
        <span
          className={`inline-flex items-center gap-1 text-[11px] ${statusMeta.color}`}
        >
          <StatusIcon className="w-3 h-3" strokeWidth={2.25} />
          {statusMeta.label}
        </span>
      </div>
      {children}
    </div>
  );
}

function GoogleSerpCard({ data }: { data: PreviewData }) {
  const title = data.title.trim();
  const description = data.description.trim();
  const truncatedTitle = truncate(title || "(სათაური აკლია)", 60);
  const truncatedDesc = truncate(description, 160);

  let segments: string[] = [];
  let displayHost = data.hostname;
  try {
    const u = new URL(data.canonical);
    segments = u.pathname.split("/").filter(Boolean).slice(0, 4);
    if (!displayHost) displayHost = u.host;
  } catch {
    // ignore
  }

  const status: PreviewStatus = !title
    ? "empty"
    : !description || title.length > 60 || description.length > 160
    ? "partial"
    : "full";

  return (
    <PreviewCard label="Google ძიება" status={status}>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2 mb-1.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.favicon}
            alt=""
            width={18}
            height={18}
            className="w-[18px] h-[18px] rounded-full bg-zinc-100 dark:bg-zinc-900 shrink-0"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
          <div className="min-w-0">
            <div className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-tight truncate">
              {displayHost}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-500 leading-tight truncate">
              https://{displayHost}
              {segments.length > 0 && " › " + segments.join(" › ")}
            </div>
          </div>
        </div>
        <h4 className="text-[18px] text-blue-700 dark:text-blue-400 leading-snug mb-1 break-words">
          {truncatedTitle}
        </h4>
        {description ? (
          <p className="text-[13px] text-zinc-700 dark:text-zinc-400 leading-snug break-words">
            {truncatedDesc}
          </p>
        ) : (
          <p className="text-[13px] text-red-500 dark:text-red-400 leading-snug italic">
            Description-ი არ არის — Google ავტომატურად შეარჩევს ტექსტს გვერდიდან.
          </p>
        )}
      </div>
    </PreviewCard>
  );
}

function ShareImageWarning({ check }: { check: ShareImageCheck }) {
  if (check.verdict === "good") return null;
  if (check.verdict === "missing") return null;
  const colorMap = {
    fail: "border-red-500/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400",
    warn: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-500",
    unknown:
      "border-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400",
  } as const;
  type Severity = keyof typeof colorMap;
  const severityKey: Severity = check.verdict === "fail" ? "fail" : check.verdict === "warn" ? "warn" : "unknown";
  const Icon =
    check.verdict === "fail"
      ? X
      : check.verdict === "warn"
      ? AlertTriangle
      : Info;
  return (
    <div
      className={`mt-2 rounded-md border-l-2 px-3 py-2 ${colorMap[severityKey]}`}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-snug font-medium">{check.reason}</p>
          {check.recommendation && (
            <p className="text-[11px] leading-snug opacity-80 mt-0.5">
              {check.recommendation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareImageDisplay({
  imageUrl,
  check,
  layout,
}: {
  imageUrl: string;
  check: ShareImageCheck;
  layout: "large" | "small";
}) {
  if (!imageUrl) {
    return (
      <div
        className={`${
          layout === "large" ? "aspect-[1.91/1]" : "w-full h-full"
        } bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center`}
      >
        <div className="text-center px-4">
          <X className="w-6 h-6 mx-auto mb-2 text-red-500" strokeWidth={1.5} />
          <p className="text-[12px] text-zinc-600 dark:text-zinc-400">
            სურათი არ არის
          </p>
        </div>
      </div>
    );
  }

  const isProblematic =
    check.verdict === "fail" || check.verdict === "warn";
  const objectFit =
    isProblematic || (check.probe && (check.probe.aspectRatio < 1.5 || check.probe.aspectRatio > 2.5))
      ? "object-contain"
      : "object-cover";

  return (
    <div
      className={`${
        layout === "large" ? "aspect-[1.91/1]" : "w-full h-full"
      } relative bg-zinc-100 dark:bg-zinc-900`}
      style={
        isProblematic
          ? {
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(244,63,94,0.06) 0 8px, transparent 8px 16px)",
            }
          : undefined
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className={`w-full h-full ${objectFit}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {check.probe && (check.probe.width > 0 || check.probe.height > 0) && (
        <span className="absolute bottom-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white">
          {check.probe.width}×{check.probe.height}
        </span>
      )}
    </div>
  );
}

function FacebookCard({ data }: { data: PreviewData }) {
  const title = data.og.title || data.title;
  const description = data.og.description || data.description;
  const image = data.og.image;
  const displayHost = data.hostname;
  const imageCheck = data.ogImageCheck;

  const hasAnyOg =
    !!(data.og.title || data.og.description || data.og.image || data.og.url);
  const allCorePresent =
    !!data.og.title && !!data.og.description && !!data.og.image;
  const imageBad =
    imageCheck.verdict === "fail" || imageCheck.verdict === "warn";

  const status: PreviewStatus = !hasAnyOg
    ? "empty"
    : allCorePresent && !imageBad
    ? "full"
    : "partial";

  return (
    <PreviewCard label="Facebook / LinkedIn" status={status}>
      <div className="rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <ShareImageDisplay
          imageUrl={image}
          check={imageCheck}
          layout="large"
        />
        <div className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/40">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 truncate">
            {displayHost}
          </p>
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug mb-1 line-clamp-2 break-words">
            {truncate(title || "(სათაური აკლია)", 90)}
          </p>
          {description ? (
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 break-words">
              {truncate(description, 200)}
            </p>
          ) : (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-600 italic">
              აღწერა აკლია
            </p>
          )}
        </div>
      </div>
      <ShareImageWarning check={imageCheck} />
    </PreviewCard>
  );
}

function TwitterCard({ data }: { data: PreviewData }) {
  const title = data.twitter.title || data.og.title || data.title;
  const description =
    data.twitter.description || data.og.description || data.description;
  const image = data.twitter.image || data.og.image;
  const isLargeImage = data.twitter.card === "summary_large_image";
  const displayHost = data.hostname;

  const imageCheck: ShareImageCheck = data.twitter.image
    ? data.twitterImageCheck
    : data.ogImageCheck;

  const hasTwitter = !!(
    data.twitter.card ||
    data.twitter.title ||
    data.twitter.description ||
    data.twitter.image
  );
  const hasFallback = !!image;
  const imageBad =
    imageCheck.verdict === "fail" || imageCheck.verdict === "warn";

  const status: PreviewStatus =
    !hasTwitter && !hasFallback
      ? "empty"
      : hasTwitter && !imageBad
      ? "full"
      : "partial";

  return (
    <PreviewCard label="Twitter / X" status={status}>
      <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {isLargeImage && (
          <ShareImageDisplay
            imageUrl={image}
            check={imageCheck}
            layout="large"
          />
        )}
        {!isLargeImage && image && (
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-24 h-24 shrink-0">
              <ShareImageDisplay
                imageUrl={image}
                check={imageCheck}
                layout="small"
              />
            </div>
            <div className="flex-1 px-3 py-2 min-w-0">
              <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug break-words">
                {truncate(title || "(სათაური აკლია)", 70)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                {displayHost}
              </p>
            </div>
          </div>
        )}
        {!image && (
          <ShareImageDisplay
            imageUrl=""
            check={imageCheck}
            layout="large"
          />
        )}
        {(isLargeImage || !image) && (
          <div className="px-3 py-2.5">
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 mb-0.5 break-words">
              {truncate(title || "(სათაური აკლია)", 70)}
            </p>
            {description && (
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 mb-1 break-words">
                {truncate(description, 200)}
              </p>
            )}
            <p className="text-[11px] text-zinc-500 truncate">{displayHost}</p>
          </div>
        )}
      </div>
      <ShareImageWarning check={imageCheck} />
    </PreviewCard>
  );
}

function PreviewSection({ data }: { data: PreviewData }) {
  return (
    <section className="mb-14">
      <header className="flex items-end justify-between gap-4 mb-6 pb-3 border-b border-zinc-200 dark:border-zinc-900">
        <h2 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
          როგორ ჩანს გვერდი
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Preview
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GoogleSerpCard data={data} />
        <FacebookCard data={data} />
        <TwitterCard data={data} />
      </div>
    </section>
  );
}

function TopPrioritiesBanner({
  items,
}: {
  items: PriorityItem[];
}) {
  if (items.length === 0) return null;
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-purple-500/50");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-purple-500/50");
      }, 1600);
    }
  };
  return (
    <section
      className="mb-14 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.04] to-transparent p-5 sm:p-6"
    >
      <header className="flex items-center gap-2.5 mb-4">
        <Target
          className="w-4 h-4 text-purple-500 dark:text-purple-400"
          strokeWidth={2}
        />
        <h2 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
          პრიორიტეტული ცვლილებები
        </h2>
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          ({items.length})
        </span>
      </header>
      <ol className="space-y-2">
        {items.map((item, i) => {
          const isFail = item.check.status === "fail";
          return (
            <li
              key={`${item.categoryKey}-${item.originalIndex}`}
              className="flex items-center gap-3 group"
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-mono font-medium ${
                  isFail
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 leading-snug truncate">
                  {item.check.label}
                  <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                    {item.categoryName}
                  </span>
                </p>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-500 truncate leading-snug">
                  {item.check.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleScroll(
                    checkAnchorId(item.categoryKey, item.originalIndex)
                  )
                }
                data-print-hide
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 transition"
              >
                გასწორება
                <ChevronRight className="w-3 h-3" strokeWidth={2.25} />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  label,
  colorClass,
  activeRing,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  colorClass: string;
  activeRing: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-baseline gap-1.5 px-2 py-1 rounded-md transition ${
        active
          ? `bg-zinc-100 dark:bg-zinc-900 ring-1 ${activeRing}`
          : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      <span className={`font-medium ${colorClass}`}>{count}</span>
      <span className="text-zinc-500 dark:text-zinc-500">{label}</span>
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const colorClass =
    score >= 80
      ? "stroke-emerald-500"
      : score >= 50
      ? "stroke-amber-500"
      : "stroke-red-500";
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          className="stroke-zinc-200 dark:stroke-zinc-900"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          className={colorClass}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums leading-none">
          {score}
        </span>
      </div>
    </div>
  );
}

function RunningTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-600">
      {elapsed}წ
    </span>
  );
}

interface StageState {
  id: StageId;
  label: string;
  status: "pending" | "running" | "done" | "error";
  durationMs?: number;
  error?: string;
}

function ProgressTimeline({ stages }: { stages: StageState[] }) {
  return (
    <ul className="space-y-2">
      {stages.map((s) => (
        <li key={s.id} className="flex items-center gap-3 text-sm">
          <span className="w-4 h-4 shrink-0 inline-flex items-center justify-center">
            {s.status === "pending" && (
              <span className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-700" />
            )}
            {s.status === "running" && (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-400" />
            )}
            {s.status === "done" && (
              <Check
                strokeWidth={2.5}
                className="w-4 h-4 text-emerald-500"
              />
            )}
            {s.status === "error" && (
              <X strokeWidth={2.5} className="w-4 h-4 text-red-500" />
            )}
          </span>
          <span
            className={`flex-1 ${
              s.status === "pending"
                ? "text-zinc-400 dark:text-zinc-600"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {s.label}
          </span>
          {s.status === "running" && <RunningTimer />}
          {(s.status === "done" || s.status === "error") &&
            s.durationMs !== undefined && (
              <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-600">
                {(s.durationMs / 1000).toFixed(1)}წ
              </span>
            )}
        </li>
      ))}
    </ul>
  );
}

interface AnalysisState {
  meta: {
    url: string;
    finalUrl: string;
    httpStatus: number;
    responseTimeMs: number;
    botProtection: BotProtection;
    fetchedAt: string;
  } | null;
  preview: PreviewData | null;
  categories: Partial<AnalysisResult["categories"]>;
  summary: AnalysisResult["summary"] | null;
  stages: StageState[];
  done: boolean; // /api/analyze stream complete
  pagespeedFetched: boolean; // /api/pagespeed responded (ok or error)
  pagespeedSkipped: boolean; // bot-protected → pagespeed not run
  error: string | null;
}

const initialStages = (): StageState[] =>
  ALL_STAGES.map((id) => ({
    id,
    label: STAGE_LABELS[id],
    status: "pending",
  }));

const initialState = (): AnalysisState => ({
  meta: null,
  preview: null,
  categories: {},
  summary: null,
  stages: initialStages(),
  done: false,
  pagespeedFetched: false,
  pagespeedSkipped: false,
  error: null,
});

export default function ResultsContent() {
  const params = useSearchParams();
  const url = params.get("url");
  const [state, setState] = useState<AnalysisState>(initialState);
  const [filter, setFilter] = useState<CheckStatus | null>(null);

  // Recompute summary client-side because /api/pagespeed lands AFTER
  // /api/analyze's `complete` event — the server's pre-pagespeed summary
  // would otherwise miss the performance category.
  const summary = useMemo(() => {
    if (!state.done) return null;
    if (Object.keys(state.categories).length === 0) return null;
    return calculateSummary(state.categories);
  }, [state.done, state.categories]);

  // "fully done" = analyze stream complete AND pagespeed terminal (or
  // skipped because of bot-protection). Export buttons gate on this so
  // PDF/Presentation never miss the performance section.
  const fullyDone =
    state.done && (state.pagespeedSkipped || state.pagespeedFetched);

  useEffect(() => {
    if (!url) {
      setState((s) => ({ ...s, error: "URL არ არის მოწოდებული" }));
      return;
    }

    setState(initialState());
    const ac = new AbortController();
    let pagespeedFired = false;

    const applyEvent = (event: StreamEvent) => {
      setState((prev) => {
        switch (event.type) {
          case "stage": {
            const stages = prev.stages.map((s) => {
              if (s.id !== event.id) return s;
              if (event.status === "running") {
                return { ...s, status: "running" as const, label: event.label };
              }
              if (event.status === "done") {
                return {
                  ...s,
                  status: "done" as const,
                  durationMs: event.durationMs,
                };
              }
              return {
                ...s,
                status: "error" as const,
                durationMs: event.durationMs,
                error: event.error,
              };
            });
            return { ...prev, stages };
          }
          case "meta": {
            return {
              ...prev,
              meta: {
                url: event.url,
                finalUrl: event.finalUrl,
                httpStatus: event.httpStatus,
                responseTimeMs: event.responseTimeMs,
                botProtection: event.botProtection,
                fetchedAt: event.fetchedAt,
              },
            };
          }
          case "preview": {
            return { ...prev, preview: event.data };
          }
          case "category": {
            return {
              ...prev,
              categories: { ...prev.categories, [event.key]: event.data },
            };
          }
          case "complete": {
            return { ...prev, summary: event.summary, done: true };
          }
          case "error": {
            return { ...prev, error: event.message, done: true };
          }
        }
      });
    };

    const firePagespeed = async (targetUrl: string) => {
      setState((prev) => ({
        ...prev,
        stages: prev.stages.map((s) =>
          s.id === "pagespeed"
            ? { ...s, status: "running" as const, label: STAGE_LABELS.pagespeed }
            : s
        ),
      }));

      const start = Date.now();
      try {
        const res = await fetch(
          `/api/pagespeed?url=${encodeURIComponent(targetUrl)}`,
          { signal: ac.signal }
        );
        const data = (await res.json()) as {
          category?: CategoryResult;
          error?: string;
        };
        const durationMs = Date.now() - start;
        setState((prev) => {
          const ok = !!data.category;
          return {
            ...prev,
            stages: prev.stages.map((s) =>
              s.id !== "pagespeed"
                ? s
                : ok
                ? { ...s, status: "done" as const, durationMs }
                : {
                    ...s,
                    status: "error" as const,
                    durationMs,
                    error: data.error ?? "PageSpeed შეცდომა",
                  }
            ),
            categories: ok
              ? { ...prev.categories, performance: data.category }
              : prev.categories,
            pagespeedFetched: true,
          };
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        const durationMs = Date.now() - start;
        setState((prev) => ({
          ...prev,
          stages: prev.stages.map((s) =>
            s.id === "pagespeed"
              ? {
                  ...s,
                  status: "error" as const,
                  durationMs,
                  error: e instanceof Error ? e.message : "ქსელის შეცდომა",
                }
              : s
          ),
          pagespeedFetched: true,
        }));
      }
    };

    const consume = async () => {
      let response: Response;
      try {
        response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`, {
          signal: ac.signal,
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : "ქსელის შეცდომა",
          done: true,
        }));
        return;
      }

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "უცნობი შეცდომა" }));
        setState((s) => ({
          ...s,
          error: err.error ?? `HTTP ${response.status}`,
          done: true,
        }));
        return;
      }

      if (!response.body) {
        setState((s) => ({
          ...s,
          error: "Streaming მხარდაჭერა არ არის",
          done: true,
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(trimmed) as StreamEvent;
            } catch (parseErr) {
              console.warn("Failed to parse stream event", trimmed, parseErr);
              continue;
            }
            applyEvent(event);

            // Fire /api/pagespeed in parallel after we know whether
            // the site is bot-protected (skip pagespeed in that case —
            // PSI would just fail on a challenge page).
            if (event.type === "meta" && !pagespeedFired) {
              pagespeedFired = true;
              if (event.botProtection.detected) {
                setState((s) => ({ ...s, pagespeedSkipped: true }));
              } else {
                void firePagespeed(event.url);
              }
            }
          }
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : "სტრიმის შეცდომა",
          done: true,
        }));
      }
    };

    consume();
    return () => ac.abort();
  }, [url]);

  useEffect(() => {
    if (!state.meta) return;
    let host = "site";
    try {
      host = new URL(state.meta.finalUrl ?? state.meta.url).hostname.replace(
        /^www\./,
        ""
      );
    } catch {
      // ignore
    }
    const date = new Date(state.meta.fetchedAt).toISOString().slice(0, 10);
    document.title = `SEO Report — ${host} — ${date}`;
    return () => {
      document.title = "ანალიზის შედეგები · SEO Report Tool";
    };
  }, [state.meta]);

  const handlePrint = () => window.print();

  const handlePresentation = () => {
    if (!state.meta || !summary || !fullyDone) return;
    const targetUrl = state.meta.finalUrl ?? state.meta.url;
    const fullAnalysis = {
      url: state.meta.url,
      finalUrl: state.meta.finalUrl,
      fetchedAt: state.meta.fetchedAt,
      status: state.error ? "partial" : "success",
      httpStatus: state.meta.httpStatus,
      responseTimeMs: state.meta.responseTimeMs,
      botProtection: state.meta.botProtection,
      categories: state.categories,
      summary,
    };
    const payload = {
      url: targetUrl,
      fetchedAt: state.meta.fetchedAt,
      analysis: fullAnalysis,
      preview: state.preview,
    };
    try {
      localStorage.setItem(storageKey(targetUrl), JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save presentation data", e);
      return;
    }
    window.open(
      `/presentation?url=${encodeURIComponent(targetUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!state.meta && !state.error) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm w-full">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-2">
            მიმდინარეობს ანალიზი...
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 break-all font-mono mb-8">
            {url}
          </p>
          <div className="text-left">
            <ProgressTimeline stages={state.stages} />
          </div>
        </div>
      </div>
    );
  }

  if (state.error && !state.meta) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-red-500 mb-2">
            ანალიზი ვერ მოხერხდა
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
            {state.error}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            უკან დაბრუნება
          </Link>
        </div>
      </div>
    );
  }

  const meta = state.meta!;
  const blocked = meta.botProtection.detected;
  const fixContext = buildFixContext(meta.url, meta.finalUrl);
  const statusLabel = !summary
    ? ""
    : summary.score >= 80
    ? "შესანიშნავი"
    : summary.score >= 50
    ? "საშუალო"
    : "სუსტი";
  const statusColor = !summary
    ? ""
    : summary.score >= 80
    ? "text-emerald-500"
    : summary.score >= 50
    ? "text-amber-500"
    : "text-red-500";

  return (
    <div className="flex-1 px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div
          data-print-hide
          className="flex items-center justify-between mb-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ახალი ანალიზი
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePresentation}
              disabled={!fullyDone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 hover:border-purple-500/40 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-500/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Presentation className="w-3.5 h-3.5" />
              პრეზენტაცია
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!fullyDone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 hover:border-purple-500/40 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-500/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>

        {blocked && (
          <div className="mb-10 border-l-2 border-amber-500 pl-5 py-2">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                ბოტ-დაცვა აღმოჩენილია
              </p>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                {meta.botProtection.provider}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed">
              საიტი არ გვაძლევს რეალურ HTML-ს — Title, H1, Schema და სხვა
              გვერდულივი შემოწმებები გამოვტოვეთ, რადგან მათი შედეგი ცრუ იქნებოდა.
              ქვემოთ მხოლოდ HTTP/header-დონის რეალური სიგნალებია.
            </p>
            <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 break-all">
              {meta.botProtection.reason}
            </p>
          </div>
        )}

        <header className="mb-14">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mb-2">
            ანალიზის შედეგი
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-50 break-all leading-tight mb-8">
            {meta.finalUrl ?? meta.url}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-12">
            {state.done && summary ? (
              <ScoreRing score={summary.score} />
            ) : (
              <div
                data-print-hide
                className="w-40 h-40 shrink-0 rounded-full border border-dashed border-zinc-200 dark:border-zinc-900 flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400 dark:text-zinc-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {state.done && summary ? (
                <>
                  <p className={`text-2xl font-semibold ${statusColor} mb-1`}>
                    {statusLabel}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 mb-6 text-sm tabular-nums">
                    <FilterChip
                      active={filter === "pass"}
                      onClick={() =>
                        setFilter((f) => (f === "pass" ? null : "pass"))
                      }
                      count={summary.passed}
                      label="გავიდა"
                      colorClass="text-zinc-900 dark:text-zinc-100"
                      activeRing="ring-emerald-500/40"
                      disabled={summary.passed === 0}
                    />
                    <span className="text-zinc-300 dark:text-zinc-700 px-1">·</span>
                    <FilterChip
                      active={filter === "warn"}
                      onClick={() =>
                        setFilter((f) => (f === "warn" ? null : "warn"))
                      }
                      count={summary.warnings}
                      label="გაფრთხილება"
                      colorClass="text-amber-600 dark:text-amber-500"
                      activeRing="ring-amber-500/40"
                      disabled={summary.warnings === 0}
                    />
                    <span className="text-zinc-300 dark:text-zinc-700 px-1">·</span>
                    <FilterChip
                      active={filter === "fail"}
                      onClick={() =>
                        setFilter((f) => (f === "fail" ? null : "fail"))
                      }
                      count={summary.failed}
                      label="ჩაიჭრა"
                      colorClass="text-red-600 dark:text-red-500"
                      activeRing="ring-red-500/40"
                      disabled={summary.failed === 0}
                    />
                    {filter && (
                      <button
                        type="button"
                        onClick={() => setFilter(null)}
                        data-print-hide
                        className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                        ფილტრის გასუფთავება
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-6" data-print-hide>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
                    ანალიზდება...
                  </p>
                  <ProgressTimeline stages={state.stages} />
                </div>
              )}

              <dl className="grid grid-cols-3 gap-x-8 gap-y-2 text-xs">
                <div>
                  <dt className="font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-1">
                    თარიღი
                  </dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {new Date(meta.fetchedAt).toLocaleString("ka-GE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-1">
                    პასუხი
                  </dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {meta.responseTimeMs}ms
                  </dd>
                </div>
                <div>
                  <dt className="font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-1">
                    HTTP
                  </dt>
                  <dd
                    className={`tabular-nums font-medium ${
                      meta.httpStatus >= 200 && meta.httpStatus < 300
                        ? "text-emerald-600 dark:text-emerald-500"
                        : meta.httpStatus >= 300 && meta.httpStatus < 400
                        ? "text-amber-600 dark:text-amber-500"
                        : "text-red-600 dark:text-red-500"
                    }`}
                  >
                    {meta.httpStatus}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        {state.done && (
          <TopPrioritiesBanner
            items={getTopPriorities(state.categories, 3)}
          />
        )}

        {state.preview && <PreviewSection data={state.preview} />}

        {state.error && (
          <div className="mb-10 border-l-2 border-red-500 pl-5 py-2">
            <p className="text-sm font-medium text-red-600 dark:text-red-500 mb-1">
              ანალიზი შეფერხდა
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {state.error}
            </p>
          </div>
        )}

        <div className="space-y-12">
          {CATEGORY_ORDER.map((key) => {
            const cat = state.categories[key];
            if (cat)
              return (
                <CategorySection
                  key={key}
                  category={cat}
                  categoryKey={key}
                  fixContext={fixContext}
                  filter={filter}
                />
              );
            if (state.done) {
              // Performance lands separately from /api/pagespeed — keep its
              // placeholder visible until pagespeed terminates.
              if (
                key === "performance" &&
                !state.pagespeedSkipped &&
                !state.pagespeedFetched
              ) {
                return <CategoryPlaceholder key={key} categoryKey={key} />;
              }
              return null;
            }
            return <CategoryPlaceholder key={key} categoryKey={key} />;
          })}
        </div>

        <p className="text-center text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mt-20">
          SEO Report Tool · v0.1 MVP
        </p>
      </div>
    </div>
  );
}
