import {
  TASKS,
  type PlanDuration,
  type Task,
  type TaskCategory,
} from "./actionPlanTasks";

// Scheduler turns the static task catalogue into a deterministic
// per-week plan for a given duration. It honours each task's `phase`
// (audit / implement / optimize / monitor) so the engagement front-loads
// discovery + fixes, then drifts into optimisation and monitoring.

export type ScheduledTask = Task & {
  startWeek: number;
  endWeek: number;
};

export type Schedule = {
  duration: PlanDuration;
  totalWeeks: number;
  tasks: ScheduledTask[];
  byCategory: Record<TaskCategory, ScheduledTask[]>;
};

const DURATION_WEEKS: Record<PlanDuration, number> = {
  1: 4,
  3: 13,
  6: 26,
};

export function buildSchedule(duration: PlanDuration): Schedule {
  const totalWeeks = DURATION_WEEKS[duration];
  const eligibleTasks = TASKS.filter((t) => t.minDuration <= duration);

  // Phase boundaries — front-loaded audit, then implement, optimize,
  // and monitor that overlaps with the late stretch.
  const auditEnd = Math.max(2, Math.round(totalWeeks * 0.3));
  const implementEnd = Math.max(auditEnd + 1, Math.round(totalWeeks * 0.65));
  const optimizeEnd = Math.max(implementEnd + 1, Math.round(totalWeeks * 0.85));

  const phaseWindow = (phase: ScheduledTask["phase"]): [number, number] => {
    switch (phase) {
      case "audit":
        return [1, auditEnd];
      case "implement":
        return [Math.max(2, auditEnd - 1), implementEnd];
      case "optimize":
        return [Math.max(2, implementEnd - 1), optimizeEnd];
      case "monitor":
        return [Math.max(1, optimizeEnd - 1), totalWeeks];
    }
  };

  // Bucket by (category × phase) and place sequentially within each
  // bucket using catalogue order — this preserves the curated hierarchy
  // (e.g. GSC verification first, then technical audits, ...). Tasks
  // within a bucket overlap by 1-week steps so a long task doesn't
  // monopolise the swimlane; tasks across categories run in parallel.
  const buckets = new Map<string, typeof eligibleTasks>();
  for (const task of eligibleTasks) {
    const key = `${task.category}|${task.phase}`;
    const arr = buckets.get(key) ?? [];
    arr.push(task);
    buckets.set(key, arr);
  }

  const scheduled: ScheduledTask[] = [];
  for (const [key, tasks] of buckets.entries()) {
    const phase = key.split("|")[1] as ScheduledTask["phase"];
    const [pStart, pEnd] = phaseWindow(phase);
    let cursor = pStart;
    for (const task of tasks) {
      const latestStart = Math.max(pStart, pEnd - task.weeks + 1);
      const startWeek = Math.max(
        1,
        Math.min(totalWeeks - task.weeks + 1, Math.min(cursor, latestStart))
      );
      const endWeek = Math.min(totalWeeks, startWeek + task.weeks - 1);
      scheduled.push({ ...task, startWeek, endWeek });
      // Advance cursor by 1 week so the next task in the same bucket
      // starts a week later (slight stagger, not strict serial).
      cursor = startWeek + 1;
    }
  }

  const byCategory = scheduled.reduce<Record<TaskCategory, ScheduledTask[]>>(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<TaskCategory, ScheduledTask[]>
  );

  for (const cat in byCategory) {
    byCategory[cat as TaskCategory].sort((a, b) => {
      if (a.startWeek !== b.startWeek) return a.startWeek - b.startWeek;
      return a.priority - b.priority;
    });
  }

  return { duration, totalWeeks, tasks: scheduled, byCategory };
}
