"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Sparkles } from "lucide-react";
import {
  CATEGORY_META,
  PLAN_DURATIONS,
  type PlanDuration,
  type TaskCategory,
  type TaskPhase,
  type TaskPriority,
} from "@/lib/actionPlanTasks";
import { buildSchedule, type Schedule } from "@/lib/actionPlanScheduler";
import {
  detectTaskIdsFromAnalysis,
  countFailWarn,
} from "@/lib/actionPlanGenerator";
import { storageKey } from "@/lib/presentation";
import { BRAND } from "@/lib/brand";

const PHASE_META: Record<
  TaskPhase,
  { label: string; color: string }
> = {
  audit: { label: "აუდიტი", color: "#8B7FD5" }, // soft purple
  implement: { label: "დანერგვა", color: "#A8B89A" }, // sage
  optimize: { label: "ოპტიმიზაცია", color: "#E8D55C" }, // muted yellow
  monitor: { label: "მონიტორინგი", color: "#B5B8D8" }, // dusty lavender
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; opacity: number }
> = {
  1: { label: "P1", opacity: 1 },
  2: { label: "P2", opacity: 0.78 },
  3: { label: "P3", opacity: 0.55 },
};

function parseDuration(raw: string | null): PlanDuration {
  const n = parseInt(raw ?? "3", 10);
  return n === 1 || n === 3 || n === 6 ? n : 3;
}

export default function ActionPlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialDuration = parseDuration(searchParams.get("duration"));
  // Accept both ?url= (passed from /results) and ?domain= (manual link).
  // Extract a clean hostname for the header so the client immediately
  // sees which site this plan is built for. rawDomain keeps the original
  // URL string for sessionStorage lookup.
  const rawDomain =
    searchParams.get("url") ?? searchParams.get("domain") ?? "";
  let displayDomain = "ნიმუშის გეგმა";
  let hasRealDomain = false;
  if (rawDomain.trim()) {
    hasRealDomain = true;
    try {
      const candidate = rawDomain.startsWith("http")
        ? rawDomain
        : `https://${rawDomain}`;
      const parsed = new URL(candidate);
      displayDomain = parsed.hostname.replace(/^www\./, "");
    } catch {
      displayDomain = rawDomain.trim();
    }
  }
  const domain = displayDomain;

  const [duration, setDuration] = useState<PlanDuration>(initialDuration);
  const [viewMode, setViewMode] = useState<"detailed" | "plan-only">("detailed");

  // Site-specific detection - when the user lands here from /results,
  // pick up the analysis blob from storage and flag tasks that match
  // failed/warned checks. Empty set when no audit data is found.
  const [detectedIds, setDetectedIds] = useState<Set<string>>(new Set());
  const [auditCounts, setAuditCounts] = useState<{ fails: number; warns: number } | null>(null);

  useEffect(() => {
    if (!hasRealDomain || !rawDomain) return;
    if (typeof window === "undefined") return;
    try {
      const key = storageKey(rawDomain);
      const raw =
        window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { analysis?: unknown };
      const ids = detectTaskIdsFromAnalysis(parsed.analysis as never);
      const counts = countFailWarn(parsed.analysis as never);
      setDetectedIds(ids);
      setAuditCounts(counts);
    } catch {
      /* storage unavailable or corrupted - silently fall back to generic plan */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawDomain]);

  const schedule = useMemo<Schedule>(() => buildSchedule(duration), [duration]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("duration", String(duration));
    router.replace(`/action-plan?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const totalTasks = schedule.tasks.length;
  const categoryCount = Object.keys(schedule.byCategory).length;
  const totalDeliverables = totalTasks;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <main className="action-plan-root min-h-screen bg-background text-foreground">
      <HeaderSection
        domain={domain}
        hasRealDomain={hasRealDomain}
        duration={duration}
        onDurationChange={setDuration}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalTasks={totalTasks}
        totalWeeks={schedule.totalWeeks}
        categoryCount={categoryCount}
        totalDeliverables={totalDeliverables}
        onPrint={handlePrint}
        detectedCount={detectedIds.size}
        auditCounts={auditCounts}
      />
      <GanttSection schedule={schedule} detectedIds={detectedIds} />
      {viewMode === "detailed" && (
        <TaskListSection schedule={schedule} detectedIds={detectedIds} />
      )}
      <FooterSection />
    </main>
  );
}

function HeaderSection({
  domain,
  hasRealDomain,
  duration,
  onDurationChange,
  viewMode,
  onViewModeChange,
  totalTasks,
  totalWeeks,
  categoryCount,
  totalDeliverables,
  onPrint,
  detectedCount,
  auditCounts,
}: {
  domain: string;
  hasRealDomain: boolean;
  duration: PlanDuration;
  onDurationChange: (d: PlanDuration) => void;
  viewMode: "detailed" | "plan-only";
  onViewModeChange: (v: "detailed" | "plan-only") => void;
  totalTasks: number;
  totalWeeks: number;
  categoryCount: number;
  totalDeliverables: number;
  onPrint: () => void;
  detectedCount: number;
  auditCounts: { fails: number; warns: number } | null;
}) {
  return (
    <header className="relative border-b border-border bg-surface overflow-hidden">
      {/* Decorative concentric arcs - top-right */}
      <svg
        className="absolute top-0 right-0 text-foreground pointer-events-none hidden md:block"
        width="380"
        height="380"
        viewBox="0 0 380 380"
        aria-hidden="true"
      >
        <g stroke="currentColor" fill="none" opacity="0.12" strokeWidth="1.5">
          <circle cx="380" cy="0" r="90" />
          <circle cx="380" cy="0" r="170" />
          <circle cx="380" cy="0" r="250" />
          <circle cx="380" cy="0" r="340" />
        </g>
        <g stroke="currentColor" fill="none" opacity="0.06" strokeWidth="1">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * (Math.PI / 2) + Math.PI;
            return (
              <line
                key={i}
                x1={380}
                y1={0}
                x2={380 + Math.cos(a) * 340}
                y2={Math.sin(a) * 340}
              />
            );
          })}
        </g>
      </svg>

      {/* Decorative dot ring - bottom-left */}
      <svg
        className="absolute -bottom-12 -left-12 text-foreground pointer-events-none hidden md:block"
        width="240"
        height="240"
        viewBox="0 0 240 240"
        aria-hidden="true"
      >
        <g fill="currentColor" opacity="0.18">
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={120 + Math.cos(a) * 80}
                cy={120 + Math.sin(a) * 80}
                r="1.8"
              />
            );
          })}
        </g>
        <g fill="currentColor" opacity="0.1">
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={120 + Math.cos(a) * 110}
                cy={120 + Math.sin(a) * 110}
                r="1.2"
              />
            );
          })}
        </g>
      </svg>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="flex items-start justify-between gap-6 mb-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted">
            {BRAND.agency} · SEO ACTION PLAN · 2026
          </p>
          <button
            type="button"
            onClick={onPrint}
            data-print-hide
            className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition"
            title="გადარდე PDF-ად (ბრაუზერის Print → Save as PDF)"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2.25} />
            PDF
          </button>
        </div>
        <h1
          className="font-display tracking-tight leading-[1.05] mb-3"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
        >
          SEO სამოქმედო გეგმა
        </h1>
        {hasRealDomain ? (
          <p className="text-lg lg:text-xl mb-2">
            <span className="text-foreground-muted">საიტი: </span>
            <span className="font-medium text-foreground">{domain}</span>
          </p>
        ) : (
          <p className="text-lg lg:text-xl text-foreground-muted mb-2">
            ნიმუშის გეგმა
          </p>
        )}
        {!hasRealDomain && (
          <p className="text-sm text-foreground-muted mb-8 max-w-xl">
            ეს ცარიელი ნიმუშია. <strong className="text-foreground">თქვენი საიტისთვის</strong>{" "}
            გეგმის სანახავად გადადით <strong>SEO ანალიზის შედეგებზე</strong> და
            დააჭირეთ ღილაკს „სამოქმედო გეგმა".
          </p>
        )}
        {hasRealDomain && <div className="mb-8" />}

        {/* Site-specific detection banner - only when we picked up real
            audit data and at least one detected task. Shows the client
            this plan is built from their site's actual problems. */}
        {hasRealDomain && detectedCount > 0 && (
          <div className="mb-10 rounded-2xl border border-foreground/15 bg-background p-5 lg:p-6 flex items-start gap-4">
            <span className="shrink-0 inline-flex w-9 h-9 rounded-full bg-foreground text-background items-center justify-center">
              <Sparkles className="w-4 h-4" strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-1.5">
                ─ თქვენი საიტიდან აღმოჩენილია
              </p>
              <p className="text-base lg:text-lg text-foreground leading-snug mb-2">
                ეს გეგმა აიგო <strong className="font-semibold">{domain}</strong>-ის
                ცოცხალი audit-ის მიხედვით -{" "}
                <strong className="font-semibold">{detectedCount}</strong>{" "}
                ამოცანა პასუხობს დადასტურებულ პრობლემას.
              </p>
              {auditCounts && (
                <p className="text-[12px] text-foreground-muted">
                  Audit-მა იპოვა:{" "}
                  <span className="font-medium text-foreground">
                    {auditCounts.fails}
                  </span>{" "}
                  კრიტიკული · {" "}
                  <span className="font-medium text-foreground">
                    {auditCounts.warns}
                  </span>{" "}
                  გაფრთხილება. დანარჩენი ამოცანები ფარავს დარჩენილ SEO
                  მიმართულებებს.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Duration selector */}
        <div className="mb-6" data-print-hide>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-3">
            სერვისის ხანგრძლივობა
          </p>
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            {PLAN_DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => onDurationChange(d.value)}
                className={`px-5 lg:px-7 h-10 rounded-full text-sm font-medium transition ${
                  duration === d.value
                    ? "bg-foreground text-background"
                    : "text-foreground/65 hover:text-foreground"
                }`}
                aria-pressed={duration === d.value}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* View mode selector */}
        <div className="mb-10" data-print-hide>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-3">
            ხედვა
          </p>
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => onViewModeChange("detailed")}
              className={`px-5 lg:px-7 h-10 rounded-full text-sm font-medium transition ${
                viewMode === "detailed"
                  ? "bg-foreground text-background"
                  : "text-foreground/65 hover:text-foreground"
              }`}
              aria-pressed={viewMode === "detailed"}
            >
              დეტალური ახსნით
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("plan-only")}
              className={`px-5 lg:px-7 h-10 rounded-full text-sm font-medium transition ${
                viewMode === "plan-only"
                  ? "bg-foreground text-background"
                  : "text-foreground/65 hover:text-foreground"
              }`}
              aria-pressed={viewMode === "plan-only"}
            >
              მხოლოდ გეგმა
            </button>
          </div>
        </div>

        {/* Print-only duration label */}
        <p className="hidden print:block mb-6 text-base text-foreground-muted">
          ხანგრძლივობა: <strong className="text-foreground">{duration} თვე</strong> ({totalWeeks} კვირა)
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10 mb-12">
          <Stat label="ამოცანა" value={totalTasks} />
          <Stat label="კვირა" value={totalWeeks} />
          <Stat label="კატეგორია" value={categoryCount} />
          <Stat label="შედეგი" value={totalDeliverables} />
        </div>

        {/* Plan summary + phase progression - web-only, hidden in PDF */}
        <div
          data-print-hide
          className="grid lg:grid-cols-5 gap-10 lg:gap-16 pt-10 border-t border-border"
        >
          <div className="lg:col-span-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted mb-4">
              ─ გეგმის შესახებ
            </p>
            <p className="text-base lg:text-[17px] leading-relaxed text-foreground/85 mb-4">
              ეს {duration}-თვიანი სამოქმედო გეგმა აიგო {totalTasks}-პუნქტიანი
              ფრეიმვორქის საფუძველზე. ფაზები გადანაწილებულია ისე, რომ კრიტიკული
              გასწორებები პირველ კვირებში მოხდეს, ხოლო კონტენტ-სტრატეგია,
              ოპტიმიზაცია და მონიტორინგი ხანგრძლივ პერიოდში გაგრძელდეს.
            </p>
            <p className="text-sm leading-relaxed text-foreground-muted">
              თითო ამოცანა მოიცავს ცხად შედეგს - ფაილს, ვალიდაციას ან dashboard-ს,
              რომელიც კლიენტისთვის გადასაცემია. პრიორიტეტი P1 აღნიშნავს კრიტიკულ
              გასწორებას, P3 - სასურველს. წერტილოვანი ხაზები მაილსტოუნ-კვირებს
              მონიშნავს.
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted mb-4">
              ─ ფაზების თანმიმდევრობა
            </p>
            <ol className="space-y-3">
              {[
                {
                  label: "აუდიტი",
                  color: "#8B7FD5",
                  hint: "მდგომარეობის რუქა, baseline",
                },
                {
                  label: "დანერგვა",
                  color: "#A8B89A",
                  hint: "კრიტიკული გასწორებები",
                },
                {
                  label: "ოპტიმიზაცია",
                  color: "#E8D55C",
                  hint: "სიჩქარე, კონტენტი, schema",
                },
                {
                  label: "მონიტორინგი",
                  color: "#B5B8D8",
                  hint: "rankings, alerts, რეპორტი",
                },
              ].map((p, i) => (
                <li key={p.label} className="flex items-start gap-3">
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-foreground-muted mt-1.5 w-5">
                    0{i + 1}
                  </span>
                  <span
                    className="shrink-0 w-3 h-3 rounded-sm mt-1.5"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-foreground font-medium leading-tight">
                      {p.label}
                    </div>
                    <div className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                      {p.hint}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Bottom document metadata strip - web-only, hidden in PDF */}
        <div
          data-print-hide
          className="mt-12 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px] font-mono uppercase tracking-[0.18em]"
        >
          <div>
            <div className="text-foreground-muted mb-1">მომზადებულია</div>
            <div className="text-foreground/85">
              {new Date().toLocaleDateString("ka-GE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div>
            <div className="text-foreground-muted mb-1">ვალიდურია</div>
            <div className="text-foreground/85">{duration} თვის განმავლობაში</div>
          </div>
          <div>
            <div className="text-foreground-muted mb-1">ფრეიმვორქი</div>
            <div className="text-foreground/85">INFINITY SEO Stack</div>
          </div>
          <div>
            <div className="text-foreground-muted mb-1">გუნდი</div>
            <div className="text-foreground/85">INFINITY SOLUTIONS</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted mb-1.5">
        {label}
      </p>
      <p
        className="font-display tabular-nums leading-none"
        style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        {value}
      </p>
    </div>
  );
}

function PhaseLegend() {
  return (
    <section className="border-b border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-foreground-muted">
          ფაზები:
        </span>
        {(Object.entries(PHASE_META) as [TaskPhase, { label: string; color: string }][]).map(
          ([phase, meta]) => (
            <span key={phase} className="inline-flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: meta.color }}
              />
              <span className="text-foreground/85">{meta.label}</span>
            </span>
          )
        )}
        <span className="ml-auto text-[11px] font-mono uppercase tracking-[0.22em] text-foreground-muted">
          P1 = კრიტიკული · P2 = მნიშვნელოვანი · P3 = მოსალოდნელი
        </span>
      </div>
    </section>
  );
}

function GanttSection({
  schedule,
  detectedIds,
}: {
  schedule: Schedule;
  detectedIds: Set<string>;
}) {
  return (
    <section className="py-12 lg:py-16 border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted mb-3">
            ─ დროითი განრიგი
          </p>
          <h2
            className="font-display tracking-tight leading-tight mb-2"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            {schedule.totalWeeks}-კვირიანი გრაფიკი
          </h2>
          <p className="text-foreground-muted max-w-2xl">
            {schedule.tasks.length} ამოცანა გადანაწილებული 4 ფაზად. თითო ბარი -
            ერთი ამოცანა, კვირების მიხედვით.
          </p>
        </div>
        <GanttView schedule={schedule} detectedIds={detectedIds} />
      </div>
    </section>
  );
}

function GanttView({
  schedule,
  detectedIds,
}: {
  schedule: Schedule;
  detectedIds: Set<string>;
}) {
  const weeks = Array.from(
    { length: schedule.totalWeeks },
    (_, i) => i + 1
  );

  const orderedCategories = (Object.keys(schedule.byCategory) as TaskCategory[]).sort(
    (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order
  );

  const gridTemplate = `260px repeat(${schedule.totalWeeks}, minmax(40px, 1fr))`;

  // Milestone weeks - boundary between phase windows, used for dashed
  // vertical lines (visual cue for end-of-phase). Derived from the same
  // boundaries the scheduler uses.
  const milestones = [
    Math.max(2, Math.round(schedule.totalWeeks * 0.3)),
    Math.max(3, Math.round(schedule.totalWeeks * 0.65)),
    Math.max(4, Math.round(schedule.totalWeeks * 0.85)),
  ].filter((w, i, a) => a.indexOf(w) === i && w < schedule.totalWeeks);

  // Flatten swimlane rows so we can zebra-stripe by global index.
  type Row =
    | { kind: "category"; cat: TaskCategory; count: number }
    | {
        kind: "task";
        task: Schedule["tasks"][number];
        rowIdx: number;
      };
  const rows: Row[] = [];
  let zebraIdx = 0;
  for (const cat of orderedCategories) {
    const tasks = schedule.byCategory[cat];
    rows.push({ kind: "category", cat, count: tasks.length });
    for (const task of tasks) {
      rows.push({ kind: "task", task, rowIdx: zebraIdx });
      zebraIdx++;
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="min-w-[920px] relative">
        {/* Charcoal header */}
        <div
          className="grid bg-[#3D3D3D] text-white"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="px-4 py-3.5 text-[12px] font-medium">
            ამოცანა
          </div>
          {weeks.map((w) => (
            <div
              key={w}
              className="px-1 py-3.5 text-center text-[11px] font-medium tabular-nums border-l border-white/10"
            >
              კვ.{w}
            </div>
          ))}
        </div>

        {/* Body rows */}
        <div className="relative">
          {/* Milestone vertical lines - overlay across all rows */}
          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: gridTemplate }}
            aria-hidden="true"
          >
            <div />
            {weeks.map((w) => (
              <div
                key={w}
                className={
                  milestones.includes(w)
                    ? "border-l border-zinc-400 border-dashed"
                    : "border-l border-transparent"
                }
              />
            ))}
          </div>

          {rows.map((row, i) => {
            if (row.kind === "category") {
              const meta = CATEGORY_META[row.cat];
              return (
                <div
                  key={`cat-${row.cat}`}
                  className="grid bg-zinc-50 border-y border-zinc-200"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  <div className="px-4 py-2 flex items-center gap-2.5">
                    <span
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700">
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {row.count}
                    </span>
                  </div>
                  <div
                    style={{ gridColumn: `2 / ${schedule.totalWeeks + 2}` }}
                  />
                </div>
              );
            }
            const task = row.task;
            const stripe = row.rowIdx % 2 === 1 ? "bg-zinc-50/60" : "bg-white";
            return (
              <div
                key={task.id}
                className={`grid border-b border-zinc-100 ${stripe} hover:bg-zinc-50 transition-colors items-stretch`}
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="px-4 py-2.5 flex items-start gap-2 min-w-0">
                  {detectedIds.has(task.id) ? (
                    <span
                      className="shrink-0 w-2 h-2 rounded-full bg-[#A03A3A] mt-2"
                      title="თქვენი საიტიდან აღმოჩენილი პრობლემა"
                      aria-label="detected"
                    />
                  ) : (
                    <span className="shrink-0 w-2 mt-1" />
                  )}
                  <span
                    className={`text-[12.5px] leading-snug break-words ${
                      detectedIds.has(task.id)
                        ? "text-zinc-900 font-medium"
                        : "text-zinc-700"
                    }`}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                </div>
                <div
                  className="relative flex items-center py-1.5"
                  style={{
                    gridColumn: `${task.startWeek + 1} / ${task.endWeek + 2}`,
                  }}
                >
                  <div
                    className="h-7 w-full rounded-full mx-1 flex items-center px-3"
                    style={{
                      backgroundColor: PHASE_META[task.phase].color,
                      opacity: PRIORITY_META[task.priority].opacity,
                    }}
                    title={`${PHASE_META[task.phase].label} · ${task.weeks} კვ. · ${PRIORITY_META[task.priority].label}`}
                  >
                    <span className="text-[10px] text-white font-medium tabular-nums truncate drop-shadow-sm">
                      {task.weeks > 1
                        ? `${task.weeks} კვ.`
                        : PRIORITY_META[task.priority].label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline legend - phases + priority opacity + milestone */}
        <div className="border-t border-zinc-200 bg-white px-4 py-4 flex flex-wrap items-center gap-x-7 gap-y-3">
          {(Object.entries(PHASE_META) as [TaskPhase, { label: string; color: string }][]).map(
            ([phase, meta]) => (
              <span
                key={phase}
                className="inline-flex items-center gap-2 text-[12px] text-zinc-700"
              >
                <span
                  className="w-5 h-3 rounded-sm"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
              </span>
            )
          )}
          <span className="inline-flex items-center gap-2 text-[12px] text-zinc-700">
            <span className="inline-flex items-center gap-0.5">
              <span
                className="w-2.5 h-3 rounded-sm bg-zinc-500"
                style={{ opacity: 1 }}
              />
              <span
                className="w-2.5 h-3 rounded-sm bg-zinc-500"
                style={{ opacity: 0.78 }}
              />
              <span
                className="w-2.5 h-3 rounded-sm bg-zinc-500"
                style={{ opacity: 0.55 }}
              />
            </span>
            P1 → P3 (ბნელი → ღია = კრიტიკული → სასურველი)
          </span>
          <span className="ml-auto inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
            <span className="inline-block w-6 border-t border-dashed border-zinc-500" />
            მაილსტოუნი
          </span>
        </div>
      </div>
    </div>
  );
}

function TaskListSection({
  schedule,
  detectedIds,
}: {
  schedule: Schedule;
  detectedIds: Set<string>;
}) {
  const orderedCategories = (Object.keys(schedule.byCategory) as TaskCategory[]).sort(
    (a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order
  );

  return (
    <section className="py-12 lg:py-20 bg-surface">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <p className="text-[11px] font-mono uppercase tracking-[0.32em] text-foreground-muted mb-3">
            ─ დეტალური სია
          </p>
          <h2
            className="font-display tracking-tight leading-tight mb-2"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            თითო ამოცანის აღწერა
          </h2>
          <p className="text-foreground-muted max-w-2xl">
            ყველა ამოცანა კატეგორიის მიხედვით ჯგუფურად - აღწერა + დელივერი
            + დაგეგმილი კვირები.
          </p>
        </div>

        <div className="space-y-12">
          {orderedCategories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const tasks = schedule.byCategory[cat];
            return (
              <div key={cat}>
                <header className="flex items-baseline gap-3 mb-5 pb-3 border-b border-border">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <h3
                    className="font-display"
                    style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
                  >
                    {meta.label}
                  </h3>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted">
                    {tasks.length} ამოცანა
                  </span>
                </header>

                <ul className="grid md:grid-cols-2 gap-3">
                  {tasks.map((task) => {
                    const isDetected = detectedIds.has(task.id);
                    return (
                    <li
                      key={task.id}
                      className={`rounded-lg p-4 lg:p-5 transition ${
                        isDetected
                          ? "border-2 border-[#A03A3A]/40 bg-[#A03A3A]/[0.03]"
                          : "border border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3 flex-wrap">
                        <span
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-mono uppercase tracking-wider text-white"
                          style={{
                            backgroundColor: PHASE_META[task.phase].color,
                          }}
                        >
                          {PHASE_META[task.phase].label}
                        </span>
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase tracking-wider border border-border text-foreground/75">
                          {PRIORITY_META[task.priority].label}
                        </span>
                        {isDetected && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono uppercase tracking-wider bg-[#A03A3A] text-white">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
                            თქვენი საიტიდან
                          </span>
                        )}
                        <span className="ml-auto text-[10px] font-mono tabular-nums text-foreground-muted">
                          {task.startWeek === task.endWeek
                            ? `კვ. ${task.startWeek}`
                            : `კვ. ${task.startWeek}-${task.endWeek}`}
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground mb-1.5 leading-snug">
                        {task.title}
                      </h4>
                      <p className="text-[13px] text-foreground-muted mb-3 leading-relaxed">
                        {task.description}
                      </p>
                      <p className="text-[12px] text-foreground/85 leading-relaxed">
                        <span className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-foreground-muted mr-2 inline-block align-middle">
                          შედეგი
                        </span>
                        {task.deliverable}
                      </p>
                    </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border-border py-10 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-foreground-muted">
          {BRAND.agency} - SEO სააგენტო
        </p>
      </div>
    </footer>
  );
}
