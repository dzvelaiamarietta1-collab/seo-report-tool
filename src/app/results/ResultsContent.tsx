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
  PageReport,
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
import { BRAND } from "@/lib/brand";

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
    border: "border-border",
    accent: "",
    iconColor: "text-success",
    label: "გავიდა",
  },
  warn: {
    Icon: AlertTriangle,
    border: "border-border",
    accent: "border-l-2 border-l-warning",
    iconColor: "text-warning",
    label: "გაფრთხილება",
  },
  fail: {
    Icon: X,
    border: "border-border",
    accent: "border-l-2 border-l-error",
    iconColor: "text-error",
    label: "ჩაიჭრა",
  },
  info: {
    Icon: Info,
    border: "border-border",
    accent: "border-l-2 border-l-info",
    iconColor: "text-info",
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
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-surface text-[0.85em] font-mono text-foreground align-baseline"
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
    <div className="rounded-md border border-border overflow-hidden bg-surface">
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle shrink-0">
            {template.language}
          </span>
          {template.filename && (
            <span className="text-[11px] font-mono text-foreground truncate">
              {template.filename}
            </span>
          )}
          <span className="text-[12px] text-foreground-muted truncate">
            {template.title}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          data-print-hide
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-foreground hover:bg-surface transition shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" strokeWidth={2.5} />
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
      <pre className="overflow-x-auto px-3 py-3 text-[12px] font-mono text-foreground leading-relaxed whitespace-pre">
        <code>{template.code}</code>
      </pre>
      {template.note && (
        <p className="px-3 py-2 text-[11px] text-foreground-muted border-t border-border leading-relaxed">
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
      className={`group scroll-mt-24 rounded-lg border ${meta.border} ${meta.accent} bg-background p-5 transition-colors hover:border-border-strong`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-medium text-[15px] text-foreground leading-snug">
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
            className="w-4 h-4 shrink-0 mt-0.5 text-foreground-subtle group-hover:text-success/70 transition-colors"
          />
        )}
      </div>
      <p className="text-sm text-foreground-muted leading-relaxed break-words">
        {formatMessage(check.message)}
      </p>
      {check.recommendation && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-start gap-2.5">
            <Lightbulb
              strokeWidth={1.75}
              className="w-3.5 h-3.5 shrink-0 mt-0.5 text-foreground-subtle"
            />
            <p className="text-[13px] text-foreground-muted leading-relaxed">
              {formatMessage(check.recommendation)}
            </p>
          </div>
        </div>
      )}
      {Array.isArray(check.value) &&
        check.value.length > 0 &&
        check.status !== "pass" && (
          <div className="mt-3 pt-3 border-t border-border">
            <ul className="space-y-1 text-[12px] font-mono text-foreground-muted max-h-48 overflow-y-auto pr-1">
              {check.value.map((v, i) => (
                <li key={i} className="break-all leading-snug" title={v}>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      {impact && (
        <p className="mt-3 text-[11px] font-mono uppercase tracking-wider text-foreground-subtle">
          {impact}
        </p>
      )}
      {fixes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
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
        className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        )}
        <Check className="w-3 h-3 text-success" strokeWidth={2.5} />
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
                className="w-3 h-3 text-success mt-1 shrink-0"
                strokeWidth={2.5}
              />
              <span className="min-w-0">
                <span className="text-foreground font-medium">
                  {c.label}
                </span>
                <span className="text-foreground-muted"> · </span>
                <span className="text-foreground-muted">
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
      <header className="flex items-end justify-between gap-4 mb-4 pb-3 border-b border-border">
        <h2 className="text-[15px] font-medium text-foreground inline-flex items-center gap-2.5">
          <Icon
            strokeWidth={1.75}
            className="w-4 h-4 text-foreground-subtle"
          />
          {category.name}
        </h2>
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          {scored > 0 && (
            <>
              <div className="hidden sm:block w-24 h-1 rounded-full bg-surface overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passRate >= 80
                      ? "bg-success/70"
                      : passRate >= 50
                      ? "bg-warning/70"
                      : "bg-error/70"
                  }`}
                  style={{ width: `${passRate}%` }}
                />
              </div>
              <span className="text-foreground-muted">
                <span className="text-foreground">
                  {stats.pass}
                </span>
                <span className="mx-1">/</span>
                <span>{scored}</span>
              </span>
              {stats.warn > 0 && (
                <span className="text-warning">
                  {stats.warn}w
                </span>
              )}
              {stats.fail > 0 && (
                <span className="text-error">
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
      <header className="flex items-end justify-between gap-4 mb-4 pb-3 border-b border-border">
        <h2 className="text-[15px] font-medium text-foreground-subtle inline-flex items-center gap-2.5">
          <Icon
            strokeWidth={1.75}
            className="w-4 h-4 text-foreground-subtle"
          />
          {meta.name}
        </h2>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-subtle" />
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface h-24 animate-pulse"
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
    full: { label: "სრული", color: "text-success", Icon: Check },
    partial: { label: "ნაწილობრივი", color: "text-warning", Icon: AlertTriangle },
    empty: { label: "ცარიელი", color: "text-error", Icon: X },
  }[status];
  const StatusIcon = statusMeta.Icon;
  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-foreground-muted">
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
      <div className="rounded-lg border border-border p-4 bg-background">
        <div className="flex items-center gap-2 mb-1.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.favicon}
            alt=""
            width={18}
            height={18}
            className="w-[18px] h-[18px] rounded-full bg-surface shrink-0"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
          <div className="min-w-0">
            <div className="text-[12px] text-foreground leading-tight truncate">
              {displayHost}
            </div>
            <div className="text-[11px] text-foreground-muted leading-tight truncate">
              https://{displayHost}
              {segments.length > 0 && " › " + segments.join(" › ")}
            </div>
          </div>
        </div>
        <h4 className="text-[18px] text-info leading-snug mb-1 break-words">
          {truncatedTitle}
        </h4>
        {description ? (
          <p className="text-[13px] text-foreground-muted leading-snug break-words">
            {truncatedDesc}
          </p>
        ) : (
          <p className="text-[13px] text-error leading-snug italic">
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
    fail: "border-error/30 bg-error/10 text-error",
    warn: "border-warning/30 bg-warning/10 text-warning",
    unknown:
      "border-border bg-surface text-foreground-muted",
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
        } bg-surface flex items-center justify-center`}
      >
        <div className="text-center px-4">
          <X className="w-6 h-6 mx-auto mb-2 text-error" strokeWidth={1.5} />
          <p className="text-[12px] text-foreground-muted">
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
      } relative bg-surface`}
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
      <div className="rounded-md overflow-hidden border border-border">
        <ShareImageDisplay
          imageUrl={image}
          check={imageCheck}
          layout="large"
        />
        <div className="px-3 py-2.5 bg-surface">
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1 truncate">
            {displayHost}
          </p>
          <p className="text-[14px] font-semibold text-foreground leading-snug mb-1 line-clamp-2 break-words">
            {truncate(title || "(სათაური აკლია)", 90)}
          </p>
          {description ? (
            <p className="text-[12px] text-foreground-muted leading-snug line-clamp-2 break-words">
              {truncate(description, 200)}
            </p>
          ) : (
            <p className="text-[12px] text-foreground-subtle italic">
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
      <div className="rounded-2xl overflow-hidden border border-border bg-background">
        {isLargeImage && (
          <ShareImageDisplay
            imageUrl={image}
            check={imageCheck}
            layout="large"
          />
        )}
        {!isLargeImage && image && (
          <div className="flex border-b border-border">
            <div className="w-24 h-24 shrink-0">
              <ShareImageDisplay
                imageUrl={image}
                check={imageCheck}
                layout="small"
              />
            </div>
            <div className="flex-1 px-3 py-2 min-w-0">
              <p className="text-[14px] font-semibold text-foreground line-clamp-2 leading-snug break-words">
                {truncate(title || "(სათაური აკლია)", 70)}
              </p>
              <p className="text-[11px] text-foreground-muted mt-0.5 truncate">
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
            <p className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2 mb-0.5 break-words">
              {truncate(title || "(სათაური აკლია)", 70)}
            </p>
            {description && (
              <p className="text-[12px] text-foreground-muted leading-snug line-clamp-2 mb-1 break-words">
                {truncate(description, 200)}
              </p>
            )}
            <p className="text-[11px] text-foreground-muted truncate">{displayHost}</p>
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
      <header className="flex items-end justify-between gap-4 mb-6 pb-3 border-b border-border">
        <h2 className="text-[15px] font-medium text-foreground">
          როგორ ჩანს გვერდი
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted">
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
      el.classList.add("ring-2", "ring-accent/50");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-accent/50");
      }, 1600);
    }
  };
  return (
    <section
      // Inverted callout: deep-navy panel with gold typography so the
      // priorities band pops against the cream page.
      className="mb-14 rounded-xl border border-accent/40 bg-foreground p-5 sm:p-6"
    >
      <header className="flex items-center gap-2.5 mb-4">
        <Target className="w-4 h-4 text-accent" strokeWidth={2} />
        <h2 className="text-[13px] font-medium text-accent">
          პრიორიტეტული ცვლილებები
        </h2>
        <span className="text-[11px] font-mono uppercase tracking-wider text-accent/60">
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
                    ? "bg-error/20 text-error"
                    : "bg-warning/20 text-warning"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-accent leading-snug truncate">
                  {item.check.label}
                  <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-accent/55">
                    {item.categoryName}
                  </span>
                </p>
                <p className="text-[12px] text-[#C9CDD9] truncate leading-snug">
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
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-accent text-foreground hover:bg-accent-hover transition"
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
          ? `bg-surface ring-1 ${activeRing}`
          : "hover:bg-surface"
      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      <span className={`font-medium ${colorClass}`}>{count}</span>
      <span className="text-foreground-muted">{label}</span>
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const colorClass =
    score >= 80
      ? "stroke-success"
      : score >= 50
      ? "stroke-warning"
      : "stroke-error";
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
          className="stroke-border"
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
        <span className="text-5xl font-semibold text-foreground tabular-nums leading-none">
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
    <span className="text-xs font-mono tabular-nums text-foreground-subtle">
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
              <span className="w-2.5 h-2.5 rounded-full border border-border-strong" />
            )}
            {s.status === "running" && (
              <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
            )}
            {s.status === "done" && (
              <Check
                strokeWidth={2.5}
                className="w-4 h-4 text-success"
              />
            )}
            {s.status === "error" && (
              <X strokeWidth={2.5} className="w-4 h-4 text-error" />
            )}
          </span>
          <span
            className={`flex-1 ${
              s.status === "pending"
                ? "text-foreground-subtle"
                : "text-foreground"
            }`}
          >
            {s.label}
          </span>
          {s.status === "running" && <RunningTimer />}
          {(s.status === "done" || s.status === "error") &&
            s.durationMs !== undefined && (
              <span className="text-xs font-mono tabular-nums text-foreground-subtle">
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

// Consume a single /api/analyze stream and aggregate it into a PageReport.
// Used for sub-page crawls in deep mode — we don't show their per-event
// progress, just collect the final shape.
async function fetchPageReport(
  targetUrl: string,
  signal: AbortSignal
): Promise<PageReport> {
  const report: PageReport = {
    url: targetUrl,
    finalUrl: targetUrl,
    fetchedAt: new Date().toISOString(),
    httpStatus: 0,
    botProtection: { detected: false, provider: "", reason: "" },
    categories: {},
    summary: null,
    preview: null,
  };

  let response: Response;
  try {
    response = await fetch(`/api/analyze?url=${encodeURIComponent(targetUrl)}`, {
      signal,
    });
  } catch (e) {
    report.error = e instanceof Error ? e.message : "ქსელის შეცდომა";
    return report;
  }

  if (!response.ok || !response.body) {
    report.error = `HTTP ${response.status}`;
    return report;
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
        } catch {
          continue;
        }
        switch (event.type) {
          case "meta":
            report.url = event.url;
            report.finalUrl = event.finalUrl;
            report.fetchedAt = event.fetchedAt;
            report.httpStatus = event.httpStatus;
            report.botProtection = event.botProtection;
            break;
          case "preview":
            report.preview = event.data;
            break;
          case "category":
            report.categories[event.key] = event.data;
            break;
          case "complete":
            // Recompute summary client-side after pagespeed; for sub-pages
            // we skip pagespeed (covered below), so server's value is fine.
            report.summary = event.summary;
            break;
          case "error":
            report.error = event.message;
            break;
        }
      }
    }
  } catch (e) {
    if (signal.aborted) return report;
    report.error = e instanceof Error ? e.message : "სტრიმის შეცდომა";
  }

  // Recompute summary across all categories we got, since server's
  // summary excludes performance (pagespeed runs separately).
  if (Object.keys(report.categories).length > 0) {
    report.summary = calculateSummary(report.categories);
  }

  return report;
}

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
  const depthRaw = parseInt(params.get("depth") ?? "1", 10);
  const depth = depthRaw === 5 || depthRaw === 10 ? depthRaw : 1;
  const [state, setState] = useState<AnalysisState>(initialState);
  const [filter, setFilter] = useState<CheckStatus | null>(null);
  const [presentationError, setPresentationError] = useState<string | null>(
    null
  );
  const [subPages, setSubPages] = useState<PageReport[]>([]);
  const [subPagesTotal, setSubPagesTotal] = useState(0);

  // Recompute summary client-side because /api/pagespeed lands AFTER
  // /api/analyze's `complete` event — the server's pre-pagespeed summary
  // would otherwise miss the performance category.
  const summary = useMemo(() => {
    if (!state.done) return null;
    if (Object.keys(state.categories).length === 0) return null;
    return calculateSummary(state.categories);
  }, [state.done, state.categories]);

  // "fully done" = analyze stream complete AND pagespeed terminal (or
  // skipped because of bot-protection) AND all queued sub-pages finished.
  // Export buttons gate on this so PDF/Presentation never miss data.
  const subPagesDone = subPagesTotal === 0 || subPages.length >= subPagesTotal;
  const fullyDone =
    state.done &&
    (state.pagespeedSkipped || state.pagespeedFetched) &&
    subPagesDone;

  useEffect(() => {
    if (!url) {
      setState((s) => ({ ...s, error: "URL არ არის მოწოდებული" }));
      return;
    }

    setState(initialState());
    setSubPages([]);
    setSubPagesTotal(0);
    const ac = new AbortController();
    let pagespeedFired = false;
    let subPagesFired = false;
    let homeFinalUrl = url;

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
          case "internalUrls": {
            // Handled as a side effect outside applyEvent (kicks off
            // sub-page crawls); no state mutation here.
            return prev;
          }
        }
      });
    };

    const fireSubPages = async (urls: string[]) => {
      // Sequential to keep load on Vercel Hobby low — 5 pages × ~10s = ~50s.
      // Parallel would be faster but easily trips concurrent-function limits
      // and burns more compute time per analysis.
      for (const subUrl of urls) {
        if (ac.signal.aborted) return;
        const report = await fetchPageReport(subUrl, ac.signal);
        if (ac.signal.aborted) return;
        setSubPages((prev) => [...prev, report]);
      }
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
            if (event.type === "meta") {
              homeFinalUrl = event.finalUrl || event.url;
              if (!pagespeedFired) {
                pagespeedFired = true;
                if (event.botProtection.detected) {
                  setState((s) => ({ ...s, pagespeedSkipped: true }));
                } else {
                  void firePagespeed(event.url);
                }
              }
            }

            // Multi-page crawl: when depth > 1, fan out to additional
            // internal URLs once the home page exposes them. Skipped on
            // bot-protected sites (subpages would also be blocked).
            if (
              event.type === "internalUrls" &&
              !subPagesFired &&
              depth > 1
            ) {
              subPagesFired = true;
              const candidates = event.urls
                .filter((u) => u !== homeFinalUrl)
                .slice(0, depth - 1);
              if (candidates.length > 0) {
                setSubPagesTotal(candidates.length);
                void fireSubPages(candidates);
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
    document.title = `${BRAND.toolName} — ${host} — ${date}`;
    return () => {
      document.title = `ანალიზის შედეგები · ${BRAND.toolName}`;
    };
  }, [state.meta]);

  const handlePrint = () => window.print();

  const handlePresentation = () => {
    if (!state.meta || !summary || !fullyDone) return;
    setPresentationError(null);
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
    const fullPayload = {
      url: targetUrl,
      fetchedAt: state.meta.fetchedAt,
      analysis: fullAnalysis,
      preview: state.preview,
      subPages: subPages.length > 0 ? subPages : undefined,
    };

    const isQuotaError = (e: unknown): boolean =>
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        // Some browsers report it via code 22 / 1014 instead of name
        e.code === 22 ||
        e.code === 1014);

    const trySave = (payload: typeof fullPayload): "ok" | "quota" | "error" => {
      try {
        localStorage.setItem(storageKey(targetUrl), JSON.stringify(payload));
        return "ok";
      } catch (e) {
        return isQuotaError(e) ? "quota" : "error";
      }
    };

    let result = trySave(fullPayload);
    if (result === "quota") {
      // Preview (especially share-image probes with sizeBytes) is the
      // largest dispensable chunk — drop it and retry. Presentation page
      // already tolerates a missing preview.
      result = trySave({ ...fullPayload, preview: null });
    }

    if (result === "ok") {
      window.open(
        `/presentation?url=${encodeURIComponent(targetUrl)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (result === "quota") {
      setPresentationError(
        "მონაცემები ძალიან დიდია ლოკალური საცავისთვის — გასუფთავეთ ბრაუზერის storage და სცადეთ ხელახლა."
      );
    } else {
      setPresentationError(
        "პრეზენტაციის მონაცემების შენახვა ვერ მოხერხდა."
      );
    }
  };

  if (!state.meta && !state.error) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm w-full">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-subtle mx-auto mb-4" />
          <p className="text-sm text-foreground-muted mb-2">
            მიმდინარეობს ანალიზი...
          </p>
          <p className="text-xs text-foreground-subtle break-all font-mono mb-8">
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
          <p className="text-sm font-medium text-error mb-2">
            ანალიზი ვერ მოხერხდა
          </p>
          <p className="text-sm text-foreground-muted mb-6">
            {state.error}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-foreground-muted transition"
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
    ? "text-success"
    : summary.score >= 50
    ? "text-warning"
    : "text-error";

  return (
    <div className="flex-1 px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        {presentationError && (
          <div
            data-print-hide
            className="mb-4 rounded-md border-l-2 border-error bg-error/10 px-4 py-2.5 text-sm text-error"
          >
            {presentationError}
          </div>
        )}
        <div
          data-print-hide
          className="flex items-center justify-between mb-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            ახალი ანალიზი
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePresentation}
              disabled={!fullyDone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:border-accent/40 hover:text-accent hover:bg-accent-soft transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Presentation className="w-3.5 h-3.5" />
              პრეზენტაცია
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!fullyDone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:border-accent/40 hover:text-accent hover:bg-accent-soft transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>

        {blocked && (
          <div className="mb-10 border-l-2 border-warning pl-5 py-2">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-sm font-medium text-foreground">
                ბოტ-დაცვა აღმოჩენილია
              </p>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-surface text-foreground-muted">
                {meta.botProtection.provider}
              </span>
            </div>
            <p className="text-sm text-foreground-muted mb-2 leading-relaxed">
              საიტი არ გვაძლევს რეალურ HTML-ს — Title, H1, Schema და სხვა
              გვერდულივი შემოწმებები გამოვტოვეთ, რადგან მათი შედეგი ცრუ იქნებოდა.
              ქვემოთ მხოლოდ HTTP/header-დონის რეალური სიგნალებია.
            </p>
            <p className="text-xs font-mono text-foreground-subtle break-all">
              {meta.botProtection.reason}
            </p>
          </div>
        )}

        <header className="mb-14">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground-muted mb-2">
            ანალიზის შედეგი
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground break-all leading-tight mb-8">
            {meta.finalUrl ?? meta.url}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-12">
            {state.done && summary ? (
              <ScoreRing score={summary.score} />
            ) : (
              <div
                data-print-hide
                className="w-40 h-40 shrink-0 rounded-full border border-dashed border-border flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 animate-spin text-foreground-subtle" />
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
                      colorClass="text-foreground"
                      activeRing="ring-success/40"
                      disabled={summary.passed === 0}
                    />
                    <span className="text-foreground-subtle px-1">·</span>
                    <FilterChip
                      active={filter === "warn"}
                      onClick={() =>
                        setFilter((f) => (f === "warn" ? null : "warn"))
                      }
                      count={summary.warnings}
                      label="გაფრთხილება"
                      colorClass="text-warning"
                      activeRing="ring-warning/40"
                      disabled={summary.warnings === 0}
                    />
                    <span className="text-foreground-subtle px-1">·</span>
                    <FilterChip
                      active={filter === "fail"}
                      onClick={() =>
                        setFilter((f) => (f === "fail" ? null : "fail"))
                      }
                      count={summary.failed}
                      label="ჩაიჭრა"
                      colorClass="text-error"
                      activeRing="ring-error/40"
                      disabled={summary.failed === 0}
                    />
                    {filter && (
                      <button
                        type="button"
                        onClick={() => setFilter(null)}
                        data-print-hide
                        className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-foreground-muted hover:text-foreground hover:bg-surface transition"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                        ფილტრის გასუფთავება
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-6" data-print-hide>
                  <p className="text-sm font-medium text-foreground mb-4">
                    ანალიზდება...
                  </p>
                  <ProgressTimeline stages={state.stages} />
                </div>
              )}

              <dl className="grid grid-cols-3 gap-x-8 gap-y-2 text-xs">
                <div>
                  <dt className="font-mono uppercase tracking-wider text-foreground-subtle mb-1">
                    თარიღი
                  </dt>
                  <dd className="text-foreground tabular-nums">
                    {new Date(meta.fetchedAt).toLocaleString("ka-GE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono uppercase tracking-wider text-foreground-subtle mb-1">
                    პასუხი
                  </dt>
                  <dd className="text-foreground tabular-nums">
                    {meta.responseTimeMs}ms
                  </dd>
                </div>
                <div>
                  <dt className="font-mono uppercase tracking-wider text-foreground-subtle mb-1">
                    HTTP
                  </dt>
                  <dd
                    className={`tabular-nums font-medium ${
                      meta.httpStatus >= 200 && meta.httpStatus < 300
                        ? "text-success"
                        : meta.httpStatus >= 300 && meta.httpStatus < 400
                        ? "text-warning"
                        : "text-error"
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
          <div className="mb-10 border-l-2 border-error pl-5 py-2">
            <p className="text-sm font-medium text-error mb-1">
              ანალიზი შეფერხდა
            </p>
            <p className="text-sm text-foreground-muted">
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

        {depth > 1 && subPagesTotal > 0 && (
          <section className="mt-16">
            <header className="flex items-end justify-between mb-4 pb-3 border-b border-border">
              <h2 className="text-[15px] font-medium text-foreground">
                ქვე-გვერდები
              </h2>
              <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted tabular-nums">
                {subPages.length} / {subPagesTotal}
              </p>
            </header>
            <ul className="space-y-2">
              {subPages.map((p, i) => {
                const score = p.summary?.score ?? null;
                const scoreColor =
                  score === null
                    ? "text-foreground-subtle"
                    : score >= 80
                    ? "text-success"
                    : score >= 50
                    ? "text-warning"
                    : "text-error";
                return (
                  <li
                    key={`${p.url}-${i}`}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border"
                  >
                    <span className="font-mono text-[11px] text-foreground-subtle tabular-nums w-5">
                      {i + 1}
                    </span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-[13px] text-foreground hover:text-accent transition"
                      title={p.url}
                    >
                      {p.url}
                    </a>
                    {p.error ? (
                      <span className="text-[11px] text-error truncate max-w-[200px]">
                        {p.error}
                      </span>
                    ) : p.summary ? (
                      <>
                        <span className="text-[11px] text-foreground-muted tabular-nums">
                          <span className="text-warning">
                            {p.summary.warnings}w
                          </span>
                          <span className="mx-1">·</span>
                          <span className="text-error">
                            {p.summary.failed}f
                          </span>
                        </span>
                        <span
                          className={`text-sm font-semibold tabular-nums ${scoreColor} w-9 text-right`}
                        >
                          {score}
                        </span>
                      </>
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-subtle" />
                    )}
                  </li>
                );
              })}
              {Array.from({
                length: Math.max(0, subPagesTotal - subPages.length),
              }).map((_, i) => (
                <li
                  key={`pending-${i}`}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg border border-dashed border-border opacity-50"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-subtle" />
                  <span className="text-[13px] text-foreground-muted">
                    გვერდი {subPages.length + i + 1} ანალიზდება...
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-[10px] font-mono uppercase tracking-wider text-foreground-subtle mt-20">
          {BRAND.toolName} · v0.1 MVP
        </p>
      </div>
    </div>
  );
}
