"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Download,
} from "lucide-react";
import type {
  AnalysisResult,
  CategoryKey,
  CategoryResult,
  PreviewData,
  StreamEvent,
  BotProtection,
} from "@/lib/types";
import { calculateSummary } from "@/lib/summary";
import { analyzeGaps, comparePerformance } from "@/lib/gapAnalysis";
import { generateComparisonPptx } from "@/lib/comparisonPptx";
import type { ComparisonSite } from "@/lib/comparisonPptx";
import { BRAND } from "@/lib/brand";

type SiteStatus = "pending" | "loading" | "done" | "error";

interface SiteState {
  // Index 0 is the user's own site; 1..N are competitors. Order is fixed
  // for the lifetime of the page so the UI can address sites positionally.
  url: string;
  hostname: string;
  status: SiteStatus;
  // Coarse progress: 0..100. We don't have fine-grained stage data here
  // because we consume the analyze stream to completion before rendering.
  progress: number;
  categories: Partial<AnalysisResult["categories"]>;
  preview: PreviewData | null;
  summary: AnalysisResult["summary"] | null;
  finalUrl: string;
  httpStatus: number;
  botProtection: BotProtection | null;
  error?: string;
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

function emptySite(url: string): SiteState {
  return {
    url,
    hostname: hostFromUrl(url),
    status: "pending",
    progress: 0,
    categories: {},
    preview: null,
    summary: null,
    finalUrl: url,
    httpStatus: 0,
    botProtection: null,
  };
}

// Streams /api/analyze for one URL and invokes onUpdate after each event so
// the parent can re-render progress. Resolves once the stream closes (with
// the final SiteState). Errors don't throw - they're attached to the state.
async function analyzeOneSite(
  url: string,
  signal: AbortSignal,
  onUpdate: (patch: Partial<SiteState>) => void
): Promise<void> {
  onUpdate({ status: "loading", progress: 5 });

  let response: Response;
  try {
    response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`, {
      signal,
    });
  } catch (e) {
    if (signal.aborted) return;
    onUpdate({
      status: "error",
      error: e instanceof Error ? e.message : "ქსელის შეცდომა",
    });
    return;
  }

  if (!response.ok || !response.body) {
    onUpdate({ status: "error", error: `HTTP ${response.status}` });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const categories: Partial<AnalysisResult["categories"]> = {};
  // We get ~6 category events; bump progress incrementally so the bar feels
  // alive even though we can't predict exact pacing.
  let progress = 10;
  const bump = (n: number) => {
    progress = Math.min(progress + n, 95);
    onUpdate({ progress });
  };

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
            onUpdate({
              finalUrl: event.finalUrl,
              httpStatus: event.httpStatus,
              botProtection: event.botProtection,
            });
            bump(5);
            break;
          case "preview":
            onUpdate({ preview: event.data });
            bump(5);
            break;
          case "category":
            categories[event.key] = event.data;
            onUpdate({
              categories: { ...categories },
              summary: calculateSummary(categories),
            });
            bump(10);
            break;
          case "complete":
            onUpdate({ summary: calculateSummary(categories) });
            break;
          case "error":
            onUpdate({ status: "error", error: event.message });
            return;
        }
      }
    }
  } catch (e) {
    if (signal.aborted) return;
    onUpdate({
      status: "error",
      error: e instanceof Error ? e.message : "სტრიმის შეცდომა",
    });
    return;
  }

  // Pagespeed runs in a separate route and adds the performance category.
  // Fire it after the main stream finishes; failure here is non-fatal -
  // we still show the rest of the audit.
  try {
    const psRes = await fetch(
      `/api/pagespeed?url=${encodeURIComponent(url)}`,
      { signal }
    );
    if (psRes.ok) {
      const psJson = (await psRes.json()) as {
        category?: CategoryResult;
        error?: string;
      };
      if (psJson.category) {
        categories.performance = psJson.category;
        onUpdate({
          categories: { ...categories },
          summary: calculateSummary(categories),
        });
      }
    }
  } catch {
    // ignore - performance category just won't appear
  }

  onUpdate({ status: "done", progress: 100 });
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  technical: "ტექნიკური",
  onPage: "On-Page",
  linkHealth: "ბმულები",
  schema: "Schema",
  performance: "Performance",
  aiEra: "AI ეპოქა",
};

const CATEGORY_ORDER: CategoryKey[] = [
  "technical",
  "onPage",
  "performance",
  "schema",
  "linkHealth",
  "aiEra",
];

function ProgressCard({ site, isMain }: { site: SiteState; isMain: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isMain ? "border-accent bg-accent-soft/30" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted mb-0.5">
            {isMain ? "თქვენი საიტი" : "კონკურენტი"}
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {site.hostname}
          </p>
        </div>
        <div className="shrink-0">
          {site.status === "done" && (
            <CheckCircle2 className="w-5 h-5 text-success" />
          )}
          {site.status === "error" && (
            <AlertCircle className="w-5 h-5 text-error" />
          )}
          {(site.status === "loading" || site.status === "pending") && (
            <Loader2 className="w-5 h-5 text-foreground-muted animate-spin" />
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            site.status === "error"
              ? "bg-error"
              : site.status === "done"
              ? "bg-success"
              : "bg-accent"
          }`}
          style={{ width: `${site.progress}%` }}
        />
      </div>
      {site.error && (
        <p className="text-xs text-error mt-2">{site.error}</p>
      )}
    </div>
  );
}

function Scoreboard({ sites }: { sites: SiteState[] }) {
  // Rank by overall score, descending. Ties broken by passed count, then
  // by alphabetical hostname so the order is deterministic across renders.
  const ranked = useMemo(
    () =>
      [...sites]
        .map((s, idx) => ({ site: s, originalIndex: idx }))
        .sort((a, b) => {
          const sa = a.site.summary?.score ?? 0;
          const sb = b.site.summary?.score ?? 0;
          if (sb !== sa) return sb - sa;
          const pa = a.site.summary?.passed ?? 0;
          const pb = b.site.summary?.passed ?? 0;
          if (pb !== pa) return pb - pa;
          return a.site.hostname.localeCompare(b.site.hostname);
        }),
    [sites]
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" />
          რეიტინგი
        </h2>
      </div>
      <div className="divide-y divide-border">
        {ranked.map(({ site, originalIndex }, rankIdx) => {
          const isMain = originalIndex === 0;
          const score = site.summary?.score ?? 0;
          const passed = site.summary?.passed ?? 0;
          const warns = site.summary?.warnings ?? 0;
          const fails = site.summary?.failed ?? 0;
          return (
            <div
              key={site.url}
              className={`px-4 py-3 flex items-center gap-4 ${
                isMain ? "bg-accent-soft/20" : ""
              }`}
            >
              <div className="w-6 text-center text-sm font-mono text-foreground-muted">
                #{rankIdx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm text-foreground truncate">
                    {site.hostname}
                  </p>
                  {isMain && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent px-1.5 py-0.5 rounded bg-accent-soft">
                      თქვენ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-foreground-muted">
                  ✓ {passed} · ⚠ {warns} · ✗ {fails}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-foreground tabular-nums">
                  {score}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted">
                  ქულა
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatrixTable({ sites }: { sites: SiteState[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-foreground">
          კატეგორიების შედარება
        </h2>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          ქულა კატეგორიის მიხედვით (pass × 1 + warn × 0.5) / სულ
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-4 py-2 font-medium text-foreground-muted text-[12px] uppercase tracking-wider">
                კატეგორია
              </th>
              {sites.map((s, i) => (
                <th
                  key={s.url}
                  className={`text-center px-3 py-2 font-medium text-[12px] ${
                    i === 0 ? "text-accent" : "text-foreground-muted"
                  }`}
                >
                  <div className="truncate max-w-[140px] mx-auto" title={s.hostname}>
                    {s.hostname}
                  </div>
                  {i === 0 && (
                    <div className="text-[9px] font-mono uppercase tracking-wider opacity-80">
                      თქვენ
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map((catKey) => {
              const cells = sites.map((s) => {
                const cat = s.categories[catKey];
                if (!cat) return null;
                let pass = 0;
                let warn = 0;
                let fail = 0;
                for (const c of cat.checks) {
                  if (c.status === "pass") pass++;
                  else if (c.status === "warn") warn++;
                  else if (c.status === "fail") fail++;
                }
                const total = pass + warn + fail;
                const score =
                  total === 0 ? 0 : Math.round(((pass + warn * 0.5) / total) * 100);
                return { pass, warn, fail, total, score };
              });
              // Find the winner (highest score) for this row, to bold them.
              const maxScore = Math.max(
                ...cells.map((c) => (c ? c.score : -1))
              );
              return (
                <tr key={catKey} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {CATEGORY_LABELS[catKey]}
                  </td>
                  {cells.map((cell, i) => {
                    if (!cell) {
                      return (
                        <td
                          key={i}
                          className="text-center px-3 py-2.5 text-foreground-subtle"
                        >
                          -
                        </td>
                      );
                    }
                    const isWinner =
                      cell.score === maxScore && maxScore > 0;
                    return (
                      <td
                        key={i}
                        className={`text-center px-3 py-2.5 ${
                          isWinner ? "font-semibold text-success" : "text-foreground"
                        }`}
                      >
                        <div className="tabular-nums">{cell.score}</div>
                        <div className="text-[10px] font-mono text-foreground-muted">
                          {cell.pass}/{cell.total}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "critical" | "important" | "minor";
}) {
  const config = {
    critical: { label: "კრიტიკული", className: "text-error bg-error/10" },
    important: { label: "მნიშვნელოვანი", className: "text-warning bg-warning/10" },
    minor: { label: "გასაუმჯობესებელი", className: "text-foreground-muted bg-surface" },
  }[severity];
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function GapsSection({
  sites,
}: {
  sites: SiteState[];
}) {
  const report = useMemo(() => analyzeGaps(sites), [sites]);
  const perf = useMemo(() => comparePerformance(sites), [sites]);

  if (report.totalAdvantages === 0 && perf.length === 0) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
        <p className="text-sm text-foreground">
          🎉 ტექნიკურად კონკურენტებზე უპირატესობა გაქვთ - არცერთი მათგანი არ
          აღემატება არცერთ შემოწმებაში.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          <Target className="w-4 h-4 text-warning" />
          რატომ კონკურენტები წინ - ტექნიკური სხვაობები
        </h2>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          ფაქტებზე დაფუძნებული შედარება - რას აკეთებენ ისინი, რასაც თქვენ არ
          აკეთებთ
        </p>
      </div>

      {perf.some((p) => p.gap != null && p.gap > 0) && (
        <div className="px-4 py-3 border-b border-border bg-warning/5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2">
            ⚡ Performance სხვაობები
          </p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {perf
              .filter((p) => p.gap != null && p.gap > 0 && p.bestCompetitor)
              .map((p) => (
                <div
                  key={p.metric}
                  className="bg-background rounded px-3 py-2 border border-border"
                >
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-xs font-medium text-foreground">
                      {p.metric}
                    </span>
                    <span className="text-[10px] font-mono text-error">
                      +{p.unit === "ms" ? `${Math.round(p.gap ?? 0)}ms` : (p.gap ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-snug">
                    თქვენი:{" "}
                    <span className="text-foreground tabular-nums">
                      {p.unit === "ms"
                        ? `${Math.round(p.mainValue ?? 0)}ms`
                        : (p.mainValue ?? 0).toFixed(2)}
                    </span>{" "}
                    · საუკეთესო ({p.bestCompetitor!.hostname}):{" "}
                    <span className="text-success tabular-nums">
                      {p.unit === "ms"
                        ? `${Math.round(p.bestCompetitor!.value)}ms`
                        : p.bestCompetitor!.value.toFixed(2)}
                    </span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {report.advantagesByCompetitor.map((entry) => {
          if (entry.advantages.length === 0) return null;
          // Sort within competitor by severity then alpha
          const sorted = [...entry.advantages].sort((a, b) => {
            const sa = a.severity === "critical" ? 0 : a.severity === "important" ? 1 : 2;
            const sb = b.severity === "critical" ? 0 : b.severity === "important" ? 1 : 2;
            if (sa !== sb) return sa - sb;
            return a.checkLabel.localeCompare(b.checkLabel);
          });
          return (
            <div key={entry.hostname} className="px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-2 truncate">
                vs. {entry.hostname}
                <span className="ml-2 text-[11px] font-mono text-foreground-muted">
                  {sorted.length} უპირატესობა
                </span>
              </p>
              <ul className="space-y-1.5">
                {sorted.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]">
                    <SeverityBadge severity={adv.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-medium">{adv.checkLabel}</span>
                        <span className="text-foreground-muted"> - </span>
                        <span className="text-foreground-muted">
                          {adv.competitorMessage}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SelfIssuesSection({ sites }: { sites: SiteState[] }) {
  const report = useMemo(() => analyzeGaps(sites), [sites]);
  if (report.selfIssues.length === 0) return null;

  // Group by category for readability - many issues without grouping is
  // overwhelming when the list runs long.
  const byCategory = new Map<CategoryKey, typeof report.selfIssues>();
  for (const issue of report.selfIssues) {
    if (!byCategory.has(issue.category)) byCategory.set(issue.category, []);
    byCategory.get(issue.category)!.push(issue);
  }
  const orderedCategories = [...CATEGORY_ORDER].filter((k) => byCategory.has(k));

  const failCount = report.selfIssues.filter((i) => i.status === "fail").length;
  const warnCount = report.selfIssues.filter((i) => i.status === "warn").length;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          თქვენი საიტის ყველა პრობლემა
        </h2>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          {failCount > 0 && (
            <>
              <span className="text-error font-medium">{failCount} fail</span>
              {warnCount > 0 ? " · " : ""}
            </>
          )}
          {warnCount > 0 && (
            <span className="text-warning font-medium">{warnCount} warn</span>
          )}
          {" "}- ანოტირებული "რამდენ კონკურენტს აქვს იგივე პრობლემა"
        </p>
      </div>
      <div className="divide-y divide-border">
        {orderedCategories.map((catKey) => {
          const issues = byCategory.get(catKey)!;
          return (
            <div key={catKey} className="px-4 py-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2">
                {CATEGORY_LABELS[catKey]}
              </p>
              <ul className="space-y-1.5">
                {issues.map((issue, i) => {
                  // "Alone" means only you fail among competitors - most urgent.
                  // "Industry" means everyone fails - least urgent in comparison,
                  // but still a real fix worth doing.
                  const isAlone =
                    issue.competitorsPassing > 0 &&
                    issue.competitorsAlsoFailing === 0;
                  const isIndustry =
                    issue.competitorsAlsoFailing > 0 &&
                    issue.competitorsPassing === 0;
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[12px]"
                    >
                      {issue.status === "fail" ? (
                        <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {issue.checkLabel}
                          </span>
                          {isAlone && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-error/10 text-error">
                              მხოლოდ თქვენ
                            </span>
                          )}
                          {isIndustry && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                              industry-wide
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-foreground-subtle">
                            ✓ {issue.competitorsPassing} · ✗{" "}
                            {issue.competitorsAlsoFailing} ·{" "}
                            {issue.totalCompetitors - issue.competitorsPassing - issue.competitorsAlsoFailing} n/a
                          </span>
                        </div>
                        <p className="text-foreground-muted leading-snug">
                          {issue.message}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionPlanSection({ sites }: { sites: SiteState[] }) {
  const report = useMemo(() => analyzeGaps(sites), [sites]);
  if (report.recommendations.length === 0) return null;

  // Top 8 - enough to be actionable, not overwhelming.
  const top = report.recommendations.slice(0, 8);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-foreground inline-flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          აქცია-პლანი - რა გავაკეთო კონკურენტებზე გასაცილებლად
        </h2>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          პრიორიტეტი მოწესრიგებულია severity-სა და კონკურენტთა ფარგლების
          მიხედვით
        </p>
      </div>
      <div className="divide-y divide-border">
        {top.map((rec, idx) => (
          <details key={rec.id} className="group" open={idx < 3}>
            <summary className="px-4 py-3 cursor-pointer hover:bg-surface/50 transition flex items-start gap-3">
              <div className="text-xs font-mono text-foreground-muted shrink-0 mt-0.5 w-6 text-center tabular-nums">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {rec.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-soft text-accent">
                    {rec.competitorsCount}/{rec.totalCompetitors} კონკურენტი
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-snug">
                  {rec.rationale}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted">
                  prio
                </div>
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {rec.priority}
                </div>
              </div>
            </summary>
            <div className="px-4 pb-3 pl-[60px]">
              <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2 mt-2">
                ნაბიჯები
              </p>
              <ol className="space-y-1.5 mb-3">
                {rec.steps.map((step, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-foreground flex items-start gap-2"
                  >
                    <span className="text-foreground-muted shrink-0 tabular-nums">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-success">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">სავარაუდო ეფექტი:</span>
                <span>{rec.estimatedImpact}</span>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function CompareContent() {
  const searchParams = useSearchParams();
  const urlsParam = searchParams.get("urls") ?? "";
  const urls = useMemo(
    () => urlsParam.split(",").filter(Boolean).map(decodeURIComponent),
    [urlsParam]
  );

  const [sites, setSites] = useState<SiteState[]>(() => urls.map(emptySite));
  const abortRef = useRef<AbortController | null>(null);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pptxError, setPptxError] = useState<string | null>(null);

  useEffect(() => {
    if (urls.length === 0) return;
    setSites(urls.map(emptySite));
    const controller = new AbortController();
    abortRef.current = controller;

    // Kick off all analyses in parallel. Each updates its own row via the
    // index it was launched with so order matches the URL ordering.
    urls.forEach((url, i) => {
      analyzeOneSite(url, controller.signal, (patch) => {
        setSites((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], ...patch };
          return next;
        });
      });
    });

    return () => controller.abort();
    // urls is stable across renders thanks to useMemo over the query string.
  }, [urls]);

  const allDone = sites.length > 0 && sites.every(
    (s) => s.status === "done" || s.status === "error"
  );
  const completed = sites.filter(
    (s) => s.status === "done" || s.status === "error"
  ).length;

  async function handleDownloadPptx() {
    if (pptxLoading) return;
    setPptxLoading(true);
    setPptxError(null);
    try {
      const payload: ComparisonSite[] = sites.map((s) => ({
        url: s.url,
        hostname: s.hostname,
        finalUrl: s.finalUrl,
        summary: s.summary,
        categories: s.categories,
      }));
      await generateComparisonPptx(payload);
    } catch (e) {
      setPptxError(e instanceof Error ? e.message : "PPTX-ის შექმნა ვერ მოხერხდა");
    } finally {
      setPptxLoading(false);
    }
  }

  if (urls.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <p className="text-foreground-muted mb-4">
            URL-ები არ არის მითითებული.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> მთავარზე დაბრუნება
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 px-4 py-10 max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> ახალი ანალიზი
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-foreground-muted mb-2">
              {BRAND.toolName} · შედარება
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">
              კონკურენტების ანალიზი
            </h1>
            <p className="text-base text-foreground-muted">
              {sites.length} საიტი · ტექნიკური SEO შედარება
            </p>
          </div>
          {allDone && sites.some((s) => s.summary) && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleDownloadPptx}
                disabled={pptxLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-medium text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pptxLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {pptxLoading ? "მზადდება..." : "PPTX ექსპორტი"}
              </button>
              {pptxError && (
                <p className="text-xs text-error">{pptxError}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">
            {allDone ? "ანალიზი დასრულდა" : "ანალიზი მიმდინარეობს..."}
          </h2>
          <span className="text-[11px] font-mono text-foreground-muted">
            {completed} / {sites.length}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sites.map((s, i) => (
            <ProgressCard key={s.url} site={s} isMain={i === 0} />
          ))}
        </div>
      </section>

      {allDone && sites.some((s) => s.summary) && (
        <>
          <section className="mb-8">
            <Scoreboard sites={sites} />
          </section>

          <section className="mb-8">
            <MatrixTable sites={sites} />
          </section>

          <section className="mb-8">
            <GapsSection sites={sites} />
          </section>

          <section className="mb-8">
            <SelfIssuesSection sites={sites} />
          </section>

          <section className="mb-8">
            <ActionPlanSection sites={sites} />
          </section>

          <section className="rounded-lg border border-border bg-surface/40 px-4 py-3">
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              📊 ეს არის <strong className="text-foreground">ტექნიკური</strong>{" "}
              შედარება - HTML სტრუქტურა, Performance, Schema. ვერ ვაჩვენებთ
              backlinks-ს, keyword rankings-ს ან traffic-ს - ეს მონაცემები
              ფასიან API-ებს ექვემდებარება (Ahrefs, Moz, SEMrush).
            </p>
          </section>
        </>
      )}
    </main>
  );
}
