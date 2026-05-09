import type { AnalysisResult } from "./types";

export function calculateSummary(
  categories: Partial<AnalysisResult["categories"]>
): AnalysisResult["summary"] {
  let passed = 0;
  let warnings = 0;
  let failed = 0;
  let total = 0;

  for (const cat of Object.values(categories)) {
    if (!cat) continue;
    for (const c of cat.checks) {
      if (c.status === "info") continue;
      total++;
      if (c.status === "pass") passed++;
      else if (c.status === "warn") warnings++;
      else if (c.status === "fail") failed++;
    }
  }

  const score =
    total === 0 ? 0 : Math.round(((passed + warnings * 0.5) / total) * 100);
  return { score, passed, warnings, failed, totalChecks: total };
}
