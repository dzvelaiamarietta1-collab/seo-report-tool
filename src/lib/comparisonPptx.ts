import type PptxGenJS from "pptxgenjs";
import { BRAND } from "./brand";
import { analyzeGaps, comparePerformance } from "./gapAnalysis";
import type {
  ActionRecommendation,
  CompetitorAdvantage,
  PerfComparison,
} from "./gapAnalysis";
import type { AnalysisResult, CategoryKey } from "./types";

type Pptx = PptxGenJS;
type Slide = PptxGenJS.Slide;

// ── Editorial palette ────────────────────────────────────────────────────
// Mirrors pptxExport.ts so single-site and comparison reports look like
// the same publication. Constants are duplicated rather than imported
// because pptxExport.ts didn't export them; pulling them out is a bigger
// refactor than this feature deserves.
const NAVY = "F1EBDD"; // page background — warm cream
const CYAN = "1E3A8A"; // brand accent — deep royal navy
const WHITE = "0F1B3D"; // primary text — deep navy on cream
const WHITE_MUTED = "4A5A7C";
const WHITE_DIM = "8B95A8";
const WHITE_FAINT = "8B95A8";
const RED_TEXT = "A03A3A";
const AMBER = "B8843E";
const BORDER = "D9D0BC";
const SURFACE = "FAF6ED";
const SUCCESS = "1F6F4A";

// Sylfaen ships with Windows by default and has full Georgian + Latin
// glyph coverage. FiraGO/JetBrains Mono were our web fonts but they don't
// ship with PowerPoint — Georgian text fell back to a font without the
// glyphs and rendered as empty boxes for clients.
const FONT = "Sylfaen";
const FONT_MONO = "Sylfaen";
const SLIDE_W = 13.333;

// ── Public types ─────────────────────────────────────────────────────────

export interface ComparisonSite {
  url: string;
  hostname: string;
  finalUrl: string;
  summary: AnalysisResult["summary"] | null;
  categories: Partial<AnalysisResult["categories"]>;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function navySlide(pptx: Pptx): Slide {
  const slide = pptx.addSlide();
  slide.background = { color: NAVY };
  return slide;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function addFooter(slide: Slide, slideNum: number, total: number, label?: string) {
  slide.addText(BRAND.agency.toUpperCase(), {
    x: 0.5,
    y: 7.05,
    w: 4,
    h: 0.3,
    fontSize: 9,
    color: WHITE_FAINT,
    fontFace: FONT,
    charSpacing: 4,
  });
  if (label) {
    slide.addText(label, {
      x: 4,
      y: 7.05,
      w: 5.333,
      h: 0.3,
      fontSize: 9,
      color: WHITE_DIM,
      fontFace: FONT,
      align: "center",
    });
  }
  slide.addText(`${slideNum} / ${total}`, {
    x: 9.333,
    y: 7.05,
    w: 3.5,
    h: 0.3,
    fontSize: 9,
    color: WHITE_FAINT,
    fontFace: FONT,
    align: "right",
  });
}

function scoreColor(score: number): string {
  if (score >= 80) return SUCCESS;
  if (score >= 50) return AMBER;
  return RED_TEXT;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  technical: "ტექნიკური",
  onPage: "On-Page",
  performance: "Performance",
  schema: "Schema",
  linkHealth: "ბმულები",
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

function categoryScore(
  sites: ComparisonSite[],
  i: number,
  catKey: CategoryKey
): { score: number; passed: number; total: number } | null {
  const cat = sites[i].categories[catKey];
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
  if (total === 0) return { score: 0, passed: 0, total: 0 };
  return {
    score: Math.round(((pass + warn * 0.5) / total) * 100),
    passed: pass,
    total,
  };
}

// ── Slide: Cover ─────────────────────────────────────────────────────────

function addCoverSlide(pptx: Pptx, sites: ComparisonSite[]) {
  const slide = navySlide(pptx);
  const main = sites[0];
  const competitors = sites.slice(1);

  // Section label
  slide.addText("კონკურენტების ანალიზი", {
    x: 0.5,
    y: 0.6,
    w: 8,
    h: 0.4,
    fontSize: 11,
    color: WHITE_MUTED,
    fontFace: FONT,
    bold: true,
    charSpacing: 8,
  });

  // Main title
  slide.addText("SEO Comparison Report", {
    x: 0.5,
    y: 1.3,
    w: 12.3,
    h: 1.5,
    fontSize: 56,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  // Subtitle
  slide.addText(
    `${main.hostname} vs ${competitors.length} კონკურენტი`,
    {
      x: 0.5,
      y: 2.95,
      w: 12.3,
      h: 0.5,
      fontSize: 20,
      color: WHITE_MUTED,
      fontFace: FONT,
    }
  );

  // Sites listed
  const listY = 4.0;
  slide.addText("ანალიზის ფარგლები", {
    x: 0.5,
    y: listY,
    w: 8,
    h: 0.3,
    fontSize: 10,
    color: WHITE_DIM,
    fontFace: FONT_MONO,
    charSpacing: 4,
  });

  sites.forEach((s, i) => {
    const isMain = i === 0;
    slide.addText(isMain ? "თქვენი საიტი" : `კონკურენტი ${i}`, {
      x: 0.5,
      y: listY + 0.45 + i * 0.45,
      w: 2.5,
      h: 0.35,
      fontSize: 10,
      color: WHITE_DIM,
      fontFace: FONT_MONO,
      charSpacing: 3,
    });
    slide.addText(s.hostname, {
      x: 3,
      y: listY + 0.45 + i * 0.45,
      w: 9.5,
      h: 0.35,
      fontSize: 14,
      color: isMain ? CYAN : WHITE,
      fontFace: FONT,
      bold: isMain,
    });
  });

  // Date pill
  slide.addShape("roundRect", {
    x: 0.5,
    y: 6.3,
    w: 2.6,
    h: 0.5,
    fill: { color: "FFFFFF" },
    line: { color: "FFFFFF", width: 0 },
    rectRadius: 0.06,
  });
  slide.addText(
    new Date().toLocaleDateString("ka-GE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    {
      x: 0.5,
      y: 6.3,
      w: 2.6,
      h: 0.5,
      fontSize: 12,
      color: WHITE,
      fontFace: FONT,
      bold: true,
      align: "center",
      valign: "middle",
    }
  );

  // Footer "made by"
  slide.addText(
    [
      { text: "made by ", options: { color: WHITE_DIM } },
      {
        text: BRAND.agency.toUpperCase(),
        options: { color: WHITE, bold: true },
      },
    ],
    {
      x: 0,
      y: 6.95,
      w: SLIDE_W,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT,
      align: "center",
      charSpacing: 8,
    }
  );
}

// ── Slide: Scoreboard ────────────────────────────────────────────────────

function addScoreboardSlide(
  pptx: Pptx,
  sites: ComparisonSite[],
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("საერთო რეიტინგი", {
    x: 0.5,
    y: 0.5,
    w: 8,
    h: 0.4,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });
  slide.addText("რომელ საიტს უკეთესი SEO-მდგომარეობა", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.8,
    fontSize: 36,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  // Ranked sites (sort by score desc)
  const ranked = [...sites]
    .map((s, i) => ({ site: s, originalIndex: i }))
    .filter((x) => x.site.summary)
    .sort(
      (a, b) => (b.site.summary!.score ?? 0) - (a.site.summary!.score ?? 0)
    );

  const rowY = 2.4;
  const rowH = 0.85;

  ranked.forEach((entry, rank) => {
    const y = rowY + rank * rowH;
    const isMain = entry.originalIndex === 0;
    const score = entry.site.summary!.score;
    const passed = entry.site.summary!.passed;
    const warns = entry.site.summary!.warnings;
    const fails = entry.site.summary!.failed;

    // Row background — highlight main
    if (isMain) {
      slide.addShape("rect", {
        x: 0.5,
        y,
        w: 12.3,
        h: rowH - 0.1,
        fill: { color: SURFACE },
        line: { color: BORDER, width: 0.5 },
      });
    } else {
      slide.addShape("rect", {
        x: 0.5,
        y: y + rowH - 0.1,
        w: 12.3,
        h: 0.01,
        fill: { color: BORDER },
        line: { color: BORDER, width: 0 },
      });
    }

    // Rank #
    slide.addText(`#${rank + 1}`, {
      x: 0.7,
      y: y + 0.15,
      w: 0.8,
      h: rowH - 0.3,
      fontSize: 18,
      color: WHITE_DIM,
      fontFace: FONT_MONO,
      bold: true,
      valign: "middle",
    });

    // Hostname
    slide.addText(entry.site.hostname, {
      x: 1.6,
      y: y + 0.1,
      w: 8,
      h: 0.35,
      fontSize: 16,
      color: isMain ? CYAN : WHITE,
      fontFace: FONT,
      bold: true,
      valign: "middle",
    });
    if (isMain) {
      slide.addText("თქვენი", {
        x: 4,
        y: y + 0.12,
        w: 1.2,
        h: 0.3,
        fontSize: 9,
        color: CYAN,
        fontFace: FONT_MONO,
        charSpacing: 4,
      });
    }

    // pass/warn/fail breakdown
    slide.addText(`✓ ${passed}    ⚠ ${warns}    ✗ ${fails}`, {
      x: 1.6,
      y: y + 0.45,
      w: 8,
      h: 0.3,
      fontSize: 11,
      color: WHITE_DIM,
      fontFace: FONT_MONO,
      valign: "top",
    });

    // Score
    slide.addText(String(score), {
      x: 10.5,
      y: y + 0.05,
      w: 2.2,
      h: rowH - 0.15,
      fontSize: 36,
      color: scoreColor(score),
      fontFace: FONT,
      bold: true,
      align: "right",
      valign: "middle",
    });
    slide.addText("ქულა", {
      x: 12.7,
      y: y + 0.32,
      w: 0.5,
      h: 0.3,
      fontSize: 8,
      color: WHITE_DIM,
      fontFace: FONT_MONO,
      align: "right",
      valign: "middle",
      charSpacing: 3,
    });
  });

  addFooter(slide, slideNum, total, "რეიტინგი");
}

// ── Slide: Matrix ────────────────────────────────────────────────────────

function addMatrixSlide(
  pptx: Pptx,
  sites: ComparisonSite[],
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("კატეგორიების შედარება", {
    x: 0.5,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });
  slide.addText("ვინ რას აკეთებს უკეთესად", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.8,
    fontSize: 36,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  // Matrix layout
  const tableX = 0.5;
  const tableY = 2.5;
  const labelW = 2.5;
  const totalSitesW = 12.3 - labelW;
  const siteW = totalSitesW / sites.length;
  const rowH = 0.55;

  // Header row — site names
  slide.addText("კატეგორია", {
    x: tableX,
    y: tableY,
    w: labelW,
    h: 0.5,
    fontSize: 10,
    color: WHITE_DIM,
    fontFace: FONT_MONO,
    bold: true,
    charSpacing: 4,
  });
  sites.forEach((s, i) => {
    const isMain = i === 0;
    slide.addText(truncate(s.hostname, 18), {
      x: tableX + labelW + i * siteW,
      y: tableY,
      w: siteW,
      h: 0.3,
      fontSize: 10,
      color: isMain ? CYAN : WHITE,
      fontFace: FONT,
      bold: isMain,
      align: "center",
    });
    if (isMain) {
      slide.addText("თქვენი", {
        x: tableX + labelW + i * siteW,
        y: tableY + 0.28,
        w: siteW,
        h: 0.25,
        fontSize: 8,
        color: CYAN,
        fontFace: FONT_MONO,
        align: "center",
        charSpacing: 3,
      });
    }
  });

  // Separator line
  slide.addShape("rect", {
    x: tableX,
    y: tableY + 0.55,
    w: 12.3,
    h: 0.01,
    fill: { color: BORDER },
    line: { color: BORDER, width: 0 },
  });

  // Rows
  CATEGORY_ORDER.forEach((catKey, rowIdx) => {
    const y = tableY + 0.7 + rowIdx * rowH;
    const cells = sites.map((_, i) => categoryScore(sites, i, catKey));
    const maxScore = Math.max(...cells.map((c) => (c ? c.score : -1)));

    // Row separator
    if (rowIdx > 0) {
      slide.addShape("rect", {
        x: tableX,
        y: y - 0.03,
        w: 12.3,
        h: 0.01,
        fill: { color: BORDER },
        line: { color: BORDER, transparency: 50, width: 0 },
      });
    }

    // Category label
    slide.addText(CATEGORY_LABELS[catKey], {
      x: tableX,
      y,
      w: labelW,
      h: rowH - 0.05,
      fontSize: 13,
      color: WHITE,
      fontFace: FONT,
      bold: true,
      valign: "middle",
    });

    // Site scores
    cells.forEach((cell, i) => {
      const xPos = tableX + labelW + i * siteW;
      if (!cell) {
        slide.addText("—", {
          x: xPos,
          y,
          w: siteW,
          h: rowH - 0.05,
          fontSize: 14,
          color: WHITE_DIM,
          fontFace: FONT,
          align: "center",
          valign: "middle",
        });
        return;
      }
      const isWinner = cell.score === maxScore && maxScore > 0;
      slide.addText(String(cell.score), {
        x: xPos,
        y,
        w: siteW,
        h: rowH - 0.2,
        fontSize: 18,
        color: isWinner ? SUCCESS : WHITE,
        fontFace: FONT,
        bold: isWinner,
        align: "center",
        valign: "middle",
      });
      slide.addText(`${cell.passed}/${cell.total}`, {
        x: xPos,
        y: y + 0.28,
        w: siteW,
        h: 0.2,
        fontSize: 8,
        color: WHITE_DIM,
        fontFace: FONT_MONO,
        align: "center",
      });
    });
  });

  // Legend
  slide.addText("მწვანე = კატეგორიის გამარჯვებული", {
    x: 0.5,
    y: 6.6,
    w: 6,
    h: 0.3,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT_MONO,
    charSpacing: 3,
  });

  addFooter(slide, slideNum, total, "შედარება");
}

// ── Slide: Performance ───────────────────────────────────────────────────

function addPerformanceSlide(
  pptx: Pptx,
  perfComparison: PerfComparison[],
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("Core Web Vitals", {
    x: 0.5,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });
  slide.addText("Performance — Google-ის რანკინგ ფაქტორი", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.8,
    fontSize: 32,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  const significant = perfComparison.filter(
    (p) => p.gap != null && p.gap > 0 && p.bestCompetitor
  );

  if (significant.length === 0) {
    slide.addText(
      "ცალკეული performance მონაცემები არ მოგროვდა, ან თქვენ ლიდერ ხართ.",
      {
        x: 0.5,
        y: 3,
        w: 12,
        h: 1,
        fontSize: 16,
        color: WHITE_MUTED,
        fontFace: FONT,
        italic: true,
      }
    );
  } else {
    const startY = 2.5;
    const cardH = 1.2;
    significant.slice(0, 3).forEach((p, i) => {
      const y = startY + i * (cardH + 0.2);
      const fmt = (v: number) =>
        p.unit === "ms" ? `${Math.round(v)}ms` : v.toFixed(2);

      slide.addShape("rect", {
        x: 0.5,
        y,
        w: 12.3,
        h: cardH,
        fill: { color: SURFACE },
        line: { color: BORDER, width: 0.5 },
      });

      slide.addText(p.metric, {
        x: 0.8,
        y: y + 0.1,
        w: 1.5,
        h: 0.5,
        fontSize: 24,
        color: WHITE,
        fontFace: FONT,
        bold: true,
        valign: "middle",
      });

      slide.addText("თქვენი", {
        x: 2.5,
        y: y + 0.1,
        w: 1.5,
        h: 0.3,
        fontSize: 10,
        color: WHITE_DIM,
        fontFace: FONT_MONO,
        charSpacing: 3,
      });
      slide.addText(p.mainValue != null ? fmt(p.mainValue) : "—", {
        x: 2.5,
        y: y + 0.4,
        w: 2,
        h: 0.5,
        fontSize: 20,
        color: RED_TEXT,
        fontFace: FONT,
        bold: true,
      });

      slide.addText(`საუკეთესო (${p.bestCompetitor!.hostname})`, {
        x: 5,
        y: y + 0.1,
        w: 4,
        h: 0.3,
        fontSize: 10,
        color: WHITE_DIM,
        fontFace: FONT_MONO,
        charSpacing: 3,
      });
      slide.addText(fmt(p.bestCompetitor!.value), {
        x: 5,
        y: y + 0.4,
        w: 3,
        h: 0.5,
        fontSize: 20,
        color: SUCCESS,
        fontFace: FONT,
        bold: true,
      });

      slide.addText(
        `+${fmt(p.gap!)} გასაუმჯობესებელი`,
        {
          x: 9,
          y: y + 0.4,
          w: 3.7,
          h: 0.5,
          fontSize: 14,
          color: AMBER,
          fontFace: FONT,
          bold: true,
          align: "right",
        }
      );
    });
  }

  addFooter(slide, slideNum, total, "Performance");
}

// ── Slide: Gap Summary ───────────────────────────────────────────────────

function addGapSummarySlide(
  pptx: Pptx,
  advantagesByCompetitor: { hostname: string; advantages: CompetitorAdvantage[] }[],
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("რატომ წინ კონკურენტები", {
    x: 0.5,
    y: 0.5,
    w: 12,
    h: 0.4,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });
  slide.addText("ტექნიკური უპირატესობები", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.8,
    fontSize: 36,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  // Column per competitor — only those with advantages
  const withAdvantages = advantagesByCompetitor.filter(
    (e) => e.advantages.length > 0
  );
  if (withAdvantages.length === 0) {
    slide.addText(
      "კონკურენტებზე ტექნიკურად წინ ხართ — არცერთი მათგანი არ აღემატება.",
      {
        x: 0.5,
        y: 3,
        w: 12,
        h: 1,
        fontSize: 18,
        color: SUCCESS,
        fontFace: FONT,
      }
    );
    addFooter(slide, slideNum, total, "Gap Analysis");
    return;
  }

  // Adaptive layout — the previous 4"-wide columns left the slide visually
  // empty when the user compares against just one competitor (the case
  // surfaced in the bug report). Single column gets centered and wide,
  // two share the full width, three keep the original tight grid.
  const showCount = Math.min(withAdvantages.length, 3);
  const gap = 0.2;
  const usable = 12.3;
  let colW: number;
  let startX: number;
  let perColumnMax: number;
  let msgTruncate: number;
  if (showCount === 1) {
    colW = 8.5;
    startX = (SLIDE_W - colW) / 2;
    perColumnMax = 6;
    msgTruncate = 200; // wider column fits a longer message tail
  } else if (showCount === 2) {
    colW = (usable - gap) / 2;
    startX = 0.5;
    perColumnMax = 6;
    msgTruncate = 130;
  } else {
    colW = (usable - 2 * gap) / 3;
    startX = 0.5;
    perColumnMax = 5;
    msgTruncate = 90;
  }
  const startY = 2.5;

  withAdvantages.slice(0, 3).forEach((entry, i) => {
    const x = startX + i * (colW + gap);

    // Header
    slide.addText(`vs. ${truncate(entry.hostname, 22)}`, {
      x,
      y: startY,
      w: colW,
      h: 0.4,
      fontSize: 14,
      color: WHITE,
      fontFace: FONT,
      bold: true,
    });
    slide.addText(`${entry.advantages.length} უპირატესობა`, {
      x,
      y: startY + 0.4,
      w: colW,
      h: 0.3,
      fontSize: 10,
      color: AMBER,
      fontFace: FONT_MONO,
      charSpacing: 3,
    });

    // Sort by severity and slice to whatever fits in this column's height.
    // Fewer competitors = wider column AND room for more advantages per
    // competitor since the page can't show extra rows beyond ~6.
    const top = [...entry.advantages]
      .sort((a, b) => {
        const sa =
          a.severity === "critical" ? 0 : a.severity === "important" ? 1 : 2;
        const sb =
          b.severity === "critical" ? 0 : b.severity === "important" ? 1 : 2;
        return sa - sb;
      })
      .slice(0, perColumnMax);

    top.forEach((adv, j) => {
      const y = startY + 0.85 + j * 0.65;
      const sevColor =
        adv.severity === "critical"
          ? RED_TEXT
          : adv.severity === "important"
          ? AMBER
          : WHITE_DIM;
      slide.addText("●", {
        x,
        y,
        w: 0.2,
        h: 0.3,
        fontSize: 14,
        color: sevColor,
        fontFace: FONT,
      });
      slide.addText(adv.checkLabel, {
        x: x + 0.2,
        y,
        w: colW - 0.2,
        h: 0.3,
        fontSize: 11,
        color: WHITE,
        fontFace: FONT,
        bold: true,
      });
      slide.addText(truncate(adv.competitorMessage, msgTruncate), {
        x: x + 0.2,
        y: y + 0.28,
        w: colW - 0.2,
        h: 0.35,
        fontSize: 8,
        color: WHITE_MUTED,
        fontFace: FONT,
      });
    });
  });

  addFooter(slide, slideNum, total, "Gap Analysis");
}

// ── Slide: Action Plan ───────────────────────────────────────────────────

function addActionPlanSlide(
  pptx: Pptx,
  recommendations: ActionRecommendation[],
  pageIndex: number,
  totalPages: number,
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("აქცია-პლანი", {
    x: 0.5,
    y: 0.5,
    w: 8,
    h: 0.4,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });
  slide.addText(
    totalPages > 1 ? `კონკრეტული ნაბიჯები (${pageIndex}/${totalPages})` : "კონკრეტული ნაბიჯები",
    {
      x: 0.5,
      y: 0.95,
      w: 12,
      h: 0.8,
      fontSize: 36,
      color: WHITE,
      fontFace: FONT,
      bold: true,
    }
  );

  const startY = 2.3;
  const cardH = 1.0;
  recommendations.forEach((rec, i) => {
    const y = startY + i * (cardH + 0.15);

    slide.addShape("rect", {
      x: 0.5,
      y,
      w: 12.3,
      h: cardH,
      fill: { color: SURFACE },
      line: { color: BORDER, width: 0.5 },
    });

    // Rank
    slide.addText(`#${(pageIndex - 1) * 4 + i + 1}`, {
      x: 0.7,
      y: y + 0.15,
      w: 0.7,
      h: 0.7,
      fontSize: 24,
      color: CYAN,
      fontFace: FONT_MONO,
      bold: true,
      valign: "middle",
    });

    // Title
    slide.addText(rec.title, {
      x: 1.5,
      y: y + 0.1,
      w: 8.5,
      h: 0.35,
      fontSize: 14,
      color: WHITE,
      fontFace: FONT,
      bold: true,
    });

    // Rationale (truncated)
    slide.addText(truncate(rec.rationale, 180), {
      x: 1.5,
      y: y + 0.42,
      w: 8.5,
      h: 0.5,
      fontSize: 10,
      color: WHITE_MUTED,
      fontFace: FONT,
    });

    // Right side: badges
    slide.addText(`${rec.competitorsCount}/${rec.totalCompetitors}`, {
      x: 10.3,
      y: y + 0.1,
      w: 2.4,
      h: 0.3,
      fontSize: 10,
      color: WHITE_DIM,
      fontFace: FONT_MONO,
      align: "right",
      charSpacing: 3,
    });
    slide.addText(rec.estimatedImpact, {
      x: 10.3,
      y: y + 0.4,
      w: 2.4,
      h: 0.5,
      fontSize: 10,
      color: SUCCESS,
      fontFace: FONT,
      bold: true,
      align: "right",
    });
  });

  addFooter(slide, slideNum, total, "Action Plan");
}

// ── Public API ───────────────────────────────────────────────────────────

export async function generateComparisonPptx(
  sites: ComparisonSite[],
  fileName?: string
): Promise<void> {
  if (sites.length < 2) {
    throw new Error("შედარებისთვის მინიმუმ 2 საიტი სჭირდება");
  }

  const validSites = sites.filter((s) => s.summary);
  if (validSites.length < 2) {
    throw new Error("მოგროვილი მონაცემები არასაკმარისია — სცადეთ ანალიზის გადატარება");
  }

  const gapInput = validSites.map((s) => ({
    hostname: s.hostname,
    categories: s.categories,
  }));
  const report = analyzeGaps(gapInput);
  const perfComparison = comparePerformance(gapInput);

  // Pre-compute total slide count for footer.
  const topRecs = report.recommendations.slice(0, 8);
  const actionPagesNeeded = Math.ceil(topRecs.length / 4);
  // cover + scoreboard + matrix + (performance?) + gaps + action pages
  const hasPerf = perfComparison.some(
    (p) => p.gap != null && p.gap > 0 && p.bestCompetitor
  );
  const totalSlides =
    1 + // cover
    1 + // scoreboard
    1 + // matrix
    (hasPerf ? 1 : 0) +
    1 + // gaps
    actionPagesNeeded;

  const pptxModule = await import("pptxgenjs");
  const PptxGen = pptxModule.default;
  const pptx = new PptxGen();
  pptx.layout = "LAYOUT_WIDE";

  let slideIdx = 1;
  addCoverSlide(pptx, validSites);
  slideIdx++;
  addScoreboardSlide(pptx, validSites, slideIdx, totalSlides);
  slideIdx++;
  addMatrixSlide(pptx, validSites, slideIdx, totalSlides);
  slideIdx++;
  if (hasPerf) {
    addPerformanceSlide(pptx, perfComparison, slideIdx, totalSlides);
    slideIdx++;
  }
  addGapSummarySlide(
    pptx,
    report.advantagesByCompetitor,
    slideIdx,
    totalSlides
  );
  slideIdx++;
  for (let p = 0; p < actionPagesNeeded; p++) {
    const slice = topRecs.slice(p * 4, (p + 1) * 4);
    addActionPlanSlide(pptx, slice, p + 1, actionPagesNeeded, slideIdx, totalSlides);
    slideIdx++;
  }

  const safe =
    fileName ?? `seo-comparison-${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: safe });
}
