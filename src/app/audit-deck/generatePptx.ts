// Generates a PowerPoint file from the current AuditData. Mirrors the
// on-screen deck structure (cover, assessment, sources, chapters w/
// findings, competition, keywords, goals, offering) so the exported file
// reads like a polished version of what the user sees in the browser.
//
// Lazy-import pptxgenjs so the ~270KB library only loads when the user
// actually clicks the export button.

type Status = "bad" | "partial" | "good";
type Severity = "high" | "medium" | "low";

type Finding = {
  num: string;
  title: string;
  status: Status;
  problem: string[];
  solution: string;
  screens?: string[];
};

type Chapter = {
  num: number;
  caption: string;
  title: string;
  findings: Finding[];
};

type KeyFinding = { category: string; text: string; severity: Severity };

type CompetitorRow = {
  name: string;
  type: string;
  strength: string;
  opportunity: string;
};

type KeywordRow = {
  priority: "მაღალი" | "საშუალო" | "დაბალი";
  phrase: string;
  type: string;
  realism: string;
};

type Goal = { color: string; title: string; body: string };
type ServiceColumn = { color: string; title: string; items: string[] };

export type AuditDataLite = {
  domain: string;
  brandName: string;
  description: string;
  scores: { rankMath: string; passed: string; failed: string; warnings: string };
  keyFindings: KeyFinding[];
  chapters: Chapter[];
  competition: { intro: string; rows: CompetitorRow[] };
  keywordStrategy: { intro: string; rows: KeywordRow[] };
  goals: Goal[];
  services: ServiceColumn[];
};

export type GeneratePptxOptions = {
  data: AuditDataLite;
  primary?: string;
  accent?: string;
  filename?: string;
};

const SERIF = "Sylfaen";
const SANS = "Sylfaen";
const INK_DEFAULT = "0A2540";
const ACCENT_DEFAULT = "DC2626";
const MUTED = "6B7280";
const BG = "F9FAFB";
const BAD = "DC2626";
const WARN = "D97706";

// Strip the leading "#" so pptxgenjs accepts the colour.
function hex(c: string): string {
  return c.replace(/^#/, "");
}

export async function generatePptx({
  data,
  primary = "#0A2540",
  accent = "#DC2626",
  filename = "audit-deck.pptx",
}: GeneratePptxOptions): Promise<void> {
  const PptxGenJSModule = await import("pptxgenjs");
  const PptxGenJS = (PptxGenJSModule as { default: new () => unknown }).default;
  // pptxgenjs types are loose; cast to any-shaped to keep this file
  // self-contained without pulling the full types into the bundle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pres: any = new (PptxGenJS as any)();

  pres.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in
  pres.title = `${data.domain} - SEO აუდიტი`;
  pres.author = "INFINITY SOLUTIONS";
  pres.company = "INFINITY SOLUTIONS";

  const INK = hex(primary) || INK_DEFAULT;
  const ACCENT = hex(accent) || ACCENT_DEFAULT;

  // ─── helpers ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addHeader = (slide: any, caption?: string) => {
    slide.addText("INFINITY SOLUTIONS", {
      x: 0.5, y: 0.3, w: 4, h: 0.3,
      fontSize: 9, color: MUTED, fontFace: SANS, bold: true, charSpacing: 2,
    });
    if (caption) {
      slide.addText(caption.toUpperCase(), {
        x: 8.83, y: 0.3, w: 4, h: 0.3,
        fontSize: 9, color: ACCENT, fontFace: SANS, bold: true, charSpacing: 2,
        align: "right",
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addFooter = (slide: any, page: number, total: number) => {
    slide.addText(`${page} / ${total}`, {
      x: 0.5, y: 7.0, w: 12.33, h: 0.3,
      fontSize: 9, color: MUTED, fontFace: SANS, align: "right",
    });
    slide.addText(`${data.domain} SEO აუდიტი`, {
      x: 0.5, y: 7.0, w: 12.33, h: 0.3,
      fontSize: 9, color: MUTED, fontFace: SANS, align: "left",
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slides: any[] = [];

  // 1. Cover ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: INK };
    s.addText("SEO აუდიტი", {
      x: 0.5, y: 2.4, w: 12.33, h: 1.2,
      fontSize: 60, color: "FFFFFF", fontFace: SERIF, bold: true,
    });
    s.addText(data.domain, {
      x: 0.5, y: 3.7, w: 12.33, h: 0.8,
      fontSize: 36, color: ACCENT, fontFace: SERIF,
    });
    s.addText("მომზადებული: INFINITY SOLUTIONS", {
      x: 0.5, y: 5.8, w: 12.33, h: 0.4,
      fontSize: 14, color: "D1D5DB", fontFace: SANS,
    });
    slides.push(s);
  }

  // 2. Assessment ───────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: BG };
    addHeader(s, "შეჯამება");
    s.addText("ჩვენი მოსაზრება", {
      x: 0.5, y: 0.8, w: 12.33, h: 0.8,
      fontSize: 36, color: INK, fontFace: SERIF, bold: true,
    });
    s.addText(`${data.domain} - ${data.description}`, {
      x: 0.5, y: 1.7, w: 7.5, h: 2.0,
      fontSize: 13, color: "374151", fontFace: SANS, lineSpacingMultiple: 1.4,
    });

    const cards = [
      { label: "Rank Math", value: data.scores.rankMath, color: WARN },
      { label: "Passed", value: data.scores.passed, color: "16A34A" },
      { label: "Failed", value: data.scores.failed, color: BAD },
      { label: "გაფრთხილება", value: data.scores.warnings, color: WARN },
    ];
    cards.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 8.5 + col * 2.2;
      const y = 1.7 + row * 1.3;
      s.addShape("rect", {
        x, y, w: 2.0, h: 1.1,
        fill: { color: "FFFFFF" }, line: { color: "E5E7EB" },
      });
      s.addText(c.value, {
        x, y: y + 0.1, w: 2.0, h: 0.5,
        fontSize: 22, color: c.color, fontFace: SERIF, bold: true, align: "center",
      });
      s.addText(c.label, {
        x, y: y + 0.65, w: 2.0, h: 0.3,
        fontSize: 10, color: MUTED, fontFace: SANS, align: "center",
      });
    });

    if (data.keyFindings.length > 0) {
      s.addText("მთავარი მიგნებები:", {
        x: 0.5, y: 4.0, w: 7.5, h: 0.4,
        fontSize: 14, color: INK, fontFace: SANS, bold: true,
      });
      data.keyFindings.slice(0, 6).forEach((f, i) => {
        const y = 4.5 + i * 0.4;
        const color =
          f.severity === "high" ? BAD : f.severity === "medium" ? WARN : MUTED;
        s.addShape("rect", { x: 0.5, y, w: 0.5, h: 0.25, fill: { color } });
        s.addText(
          f.severity === "high" ? "მაღ" : f.severity === "medium" ? "საშ" : "დაბ",
          {
            x: 0.5, y, w: 0.5, h: 0.25,
            fontSize: 9, color: "FFFFFF", fontFace: SANS, bold: true, align: "center",
          }
        );
        s.addText(`${f.category} - ${f.text}`, {
          x: 1.1, y: y - 0.02, w: 11.5, h: 0.35,
          fontSize: 11, color: "374151", fontFace: SANS,
        });
      });
    }
    slides.push(s);
  }

  // 3. Chapters + findings ─────────────────────────────────────────────
  data.chapters.forEach((chapter) => {
    // Chapter divider
    {
      const s = pres.addSlide();
      s.background = { color: INK };
      s.addText(String(chapter.num).padStart(2, "0"), {
        x: 0.5, y: 0.5, w: 2, h: 1.2,
        fontSize: 96, color: ACCENT, fontFace: SERIF, bold: true,
      });
      s.addText(chapter.title, {
        x: 0.5, y: 3.0, w: 12, h: 1.2,
        fontSize: 56, color: "FFFFFF", fontFace: SERIF, bold: true,
      });
      s.addText(`${chapter.findings.length} ხარვეზი`, {
        x: 0.5, y: 4.2, w: 12, h: 0.6,
        fontSize: 18, color: "D1D5DB", fontFace: SANS,
      });
      slides.push(s);
    }

    // Per-finding slides
    chapter.findings.forEach((f) => {
      const s = pres.addSlide();
      s.background = { color: BG };
      addHeader(s, chapter.caption);
      const sevColor = f.status === "bad" ? BAD : WARN;
      s.addText(f.num, {
        x: 0.5, y: 0.7, w: 1.5, h: 0.5,
        fontSize: 14, color: sevColor, fontFace: SANS, bold: true,
      });
      s.addText(f.title, {
        x: 0.5, y: 1.1, w: 12, h: 0.9,
        fontSize: 26, color: INK, fontFace: SERIF, bold: true,
      });

      const hasScreens = f.screens && f.screens.length > 0;

      if (hasScreens) {
        // Layout: left half = problem+solution stacked, right half = screenshots
        const screens = f.screens!;

        // Problem (left top)
        s.addShape("rect", {
          x: 0.5, y: 2.3, w: 6.0, h: 2.0,
          fill: { color: "FFFFFF" }, line: { color: "E5E7EB" },
        });
        s.addText("პრობლემა", {
          x: 0.7, y: 2.4, w: 5.6, h: 0.35,
          fontSize: 11, color: sevColor, fontFace: SANS, bold: true, charSpacing: 2,
        });
        const problemBlock = f.problem.map((p) => ({ text: "• " + p + "\n", options: {} }));
        s.addText(problemBlock, {
          x: 0.7, y: 2.8, w: 5.6, h: 1.3,
          fontSize: 11, color: "374151", fontFace: SANS,
          lineSpacingMultiple: 1.3, valign: "top",
        });

        // Solution (left bottom)
        s.addShape("rect", {
          x: 0.5, y: 4.45, w: 6.0, h: 2.05,
          fill: { color: "E0F2FE" }, line: { color: "BAE6FD" },
        });
        s.addText("გადაწყვეტა", {
          x: 0.7, y: 4.55, w: 5.6, h: 0.35,
          fontSize: 11, color: "0369A1", fontFace: SANS, bold: true, charSpacing: 2,
        });
        s.addText(f.solution, {
          x: 0.7, y: 4.95, w: 5.6, h: 1.4,
          fontSize: 11, color: "0C4A6E", fontFace: SANS,
          lineSpacingMultiple: 1.3, valign: "top",
        });

        // Screenshots (right side) — up to 2
        if (screens.length === 1) {
          // Single screenshot takes full right column
          s.addImage({
            data: screens[0],
            x: 6.83, y: 2.3, w: 6.0, h: 4.2,
            sizing: { type: "contain", w: 6.0, h: 4.2 },
          });
        } else {
          // Two screenshots stacked
          s.addImage({
            data: screens[0],
            x: 6.83, y: 2.3, w: 6.0, h: 2.0,
            sizing: { type: "contain", w: 6.0, h: 2.0 },
          });
          s.addImage({
            data: screens[1],
            x: 6.83, y: 4.45, w: 6.0, h: 2.05,
            sizing: { type: "contain", w: 6.0, h: 2.05 },
          });
        }
      } else {
        // No screenshots — original two-column layout
        s.addShape("rect", {
          x: 0.5, y: 2.3, w: 6.0, h: 4.2,
          fill: { color: "FFFFFF" }, line: { color: "E5E7EB" },
        });
        s.addText("პრობლემა", {
          x: 0.7, y: 2.4, w: 5.6, h: 0.4,
          fontSize: 12, color: sevColor, fontFace: SANS, bold: true, charSpacing: 2,
        });
        const problemBlock = f.problem.map((p) => ({ text: "• " + p + "\n", options: {} }));
        s.addText(problemBlock, {
          x: 0.7, y: 2.9, w: 5.6, h: 3.4,
          fontSize: 12, color: "374151", fontFace: SANS,
          lineSpacingMultiple: 1.3, valign: "top",
        });

        s.addShape("rect", {
          x: 6.83, y: 2.3, w: 6.0, h: 4.2,
          fill: { color: "E0F2FE" }, line: { color: "BAE6FD" },
        });
        s.addText("გადაწყვეტა", {
          x: 7.03, y: 2.4, w: 5.6, h: 0.4,
          fontSize: 12, color: "0369A1", fontFace: SANS, bold: true, charSpacing: 2,
        });
        s.addText(f.solution, {
          x: 7.03, y: 2.9, w: 5.6, h: 3.4,
          fontSize: 12, color: "0C4A6E", fontFace: SANS,
          lineSpacingMultiple: 1.3, valign: "top",
        });
      }

      slides.push(s);
    });
  });

  // 4. Competition ──────────────────────────────────────────────────────
  if (data.competition.rows.length > 0) {
    const s = pres.addSlide();
    s.background = { color: BG };
    addHeader(s, "კონკურენცია");
    s.addText("კონკურენტული გარემო", {
      x: 0.5, y: 0.8, w: 12.33, h: 0.7,
      fontSize: 30, color: INK, fontFace: SERIF, bold: true,
    });
    s.addText(data.competition.intro, {
      x: 0.5, y: 1.5, w: 12, h: 0.8,
      fontSize: 12, color: "374151", fontFace: SANS,
    });

    const headers = ["კონკურენტი", "ტიპი", "ძლიერი მხარე", "შანსი"];
    const tableRows = [
      headers.map((h) => ({
        text: h,
        options: {
          bold: true,
          color: "FFFFFF",
          fill: { color: INK },
          align: "left",
        },
      })),
      ...data.competition.rows.map((r) => [
        { text: r.name, options: { bold: true } },
        { text: r.type, options: {} },
        { text: r.strength, options: {} },
        { text: r.opportunity, options: {} },
      ]),
    ];
    s.addTable(tableRows, {
      x: 0.5, y: 2.5, w: 12.33,
      fontFace: SANS, fontSize: 11, color: "111111",
      colW: [2.6, 2.6, 3.6, 3.53],
      border: { type: "solid", pt: 0.5, color: "E5E7EB" },
      autoPage: false,
    });
    slides.push(s);
  }

  // 5. Keyword strategy ─────────────────────────────────────────────────
  if (data.keywordStrategy.rows.length > 0) {
    const s = pres.addSlide();
    s.background = { color: BG };
    addHeader(s, "KEYWORD სტრატეგია");
    s.addText("საძიებო სიტყვების სტრატეგია", {
      x: 0.5, y: 0.8, w: 12.33, h: 0.7,
      fontSize: 30, color: INK, fontFace: SERIF, bold: true,
    });
    s.addText(data.keywordStrategy.intro, {
      x: 0.5, y: 1.5, w: 12, h: 0.8,
      fontSize: 12, color: "374151", fontFace: SANS,
    });
    const headers = ["პრიორიტეტი", "საძიებო ფრაზა", "ტიპი", "რეალისტურობა"];
    const tableRows = [
      headers.map((h) => ({
        text: h,
        options: {
          bold: true,
          color: "FFFFFF",
          fill: { color: INK },
          align: "left",
        },
      })),
      ...data.keywordStrategy.rows.map((r) => {
        const pc =
          r.priority === "მაღალი"
            ? "16A34A"
            : r.priority === "საშუალო"
            ? "D97706"
            : "DC2626";
        return [
          { text: r.priority, options: { bold: true, color: pc } },
          { text: r.phrase, options: {} },
          { text: r.type, options: {} },
          { text: r.realism, options: {} },
        ];
      }),
    ];
    s.addTable(tableRows, {
      x: 0.5, y: 2.5, w: 12.33,
      fontFace: SANS, fontSize: 11, color: "111111",
      colW: [2.0, 4.5, 2.5, 3.33],
      border: { type: "solid", pt: 0.5, color: "E5E7EB" },
      autoPage: false,
    });
    slides.push(s);
  }

  // 6. Goals ─────────────────────────────────────────────────────────────
  if (data.goals.length > 0) {
    const s = pres.addSlide();
    s.background = { color: BG };
    addHeader(s, "ჩვენ რას ვაკეთებთ");
    s.addText("ჩვენ რას ვაკეთებთ", {
      x: 0.5, y: 0.8, w: 12.33, h: 0.7,
      fontSize: 30, color: INK, fontFace: SERIF, bold: true,
    });
    data.goals.slice(0, 4).forEach((g, i) => {
      const y = 1.8 + i * 1.25;
      s.addShape("rect", {
        x: 0.5, y, w: 12.33, h: 1.1,
        fill: { color: "FFFFFF" }, line: { color: "E5E7EB" },
      });
      s.addShape("rect", {
        x: 0.5, y, w: 0.15, h: 1.1,
        fill: { color: hex(g.color) }, line: { color: hex(g.color) },
      });
      s.addText(g.title, {
        x: 0.85, y: y + 0.15, w: 3.5, h: 0.8,
        fontSize: 13, color: INK, fontFace: SANS, bold: true, valign: "middle",
      });
      s.addText(g.body, {
        x: 4.5, y: y + 0.15, w: 8.2, h: 0.8,
        fontSize: 12, color: "374151", fontFace: SANS, valign: "middle",
      });
    });
    slides.push(s);
  }

  // 7. Closing ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: INK };
    s.addText("გმადლობთ", {
      x: 0.5, y: 2.2, w: 12.33, h: 1.2,
      fontSize: 64, color: "FFFFFF", fontFace: SERIF, bold: true,
    });
    s.addText("INFINITY SOLUTIONS", {
      x: 0.5, y: 3.5, w: 12.33, h: 0.6,
      fontSize: 22, color: ACCENT, fontFace: SANS, bold: true,
    });
    s.addText("webinfinity12@gmail.com  ·  infinity.ge", {
      x: 0.5, y: 4.2, w: 12.33, h: 0.4,
      fontSize: 14, color: "D1D5DB", fontFace: SANS,
    });
    slides.push(s);
  }

  // ─── footers ────────────────────────────────────────────────────────
  const total = slides.length;
  slides.forEach((slide, idx) => {
    if (idx === 0 || idx === total - 1) return;
    addFooter(slide, idx + 1, total);
  });

  await pres.writeFile({ fileName: filename });
}
