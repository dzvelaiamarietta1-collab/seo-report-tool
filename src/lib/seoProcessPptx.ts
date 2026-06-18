// PPTX export for the client-facing /seo-process page.
// Builds a 6-slide deck in the sage palette and triggers a download.
// Reuses the shared seoProcessData so deck content matches the page.

import type pptxgen from "pptxgenjs";
import { MONTHS, SUMMARY_ROWS, type MonthPhase } from "./seoProcessData";

const FOREST = "2F3E2E";
const SAGE_DARK = "6E7C68";
const SAGE_MUTED = "A4B09B";
const CREAM = "F1F4EC";
const SURFACE = "E8ECE0";
const BORDER = "C2CCBA";
const WHITE = "FFFFFF";

// Use a Georgian-capable font that ships with most systems. Sylfaen is
// Windows-native; on macOS/Linux PowerPoint typically falls back to a
// system Unicode font that still renders Georgian.
const FONT = "Sylfaen";
const FONT_MONO = "Consolas";

type Opts = {
  domain: string;
  hasRealDomain: boolean;
  keywords: string[];
};

export async function exportSeoProcessPptx(opts: Opts) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE16_9", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE16_9";

  buildCoverSlide(pptx, opts);
  buildIntroSlide(pptx, opts);
  if (opts.keywords.length > 0) {
    buildKeywordsSlide(pptx, opts.keywords);
  }
  for (const month of MONTHS) {
    buildMonthSlide(pptx, month);
  }
  buildSummarySlide(pptx);
  buildReportSlide(pptx);

  const safeDomain = (opts.domain || "client").replace(/[^a-z0-9.-]/gi, "_");
  const date = new Date().toISOString().slice(0, 10);
  await pptx.writeFile({
    fileName: `seo-process-${safeDomain}-${date}.pptx`,
  });
}

// ─── slide helpers ──────────────────────────────────────────────────────

function pageFrame(slide: pptxgen.Slide, eyebrow: string) {
  slide.background = { color: CREAM };

  // Eyebrow strip top-left
  slide.addText(eyebrow, {
    x: 0.5,
    y: 0.35,
    w: 8,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
    bold: false,
  });

  // Brand mark top-right
  slide.addText("INFINITY", {
    x: 11.5,
    y: 0.35,
    w: 1.5,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
    align: "right",
  });

  // Bottom-left agency tag
  slide.addText("INFINITY SOLUTIONS - SEO სააგენტო", {
    x: 0.5,
    y: 7.1,
    w: 7,
    h: 0.3,
    fontSize: 8,
    fontFace: FONT_MONO,
    color: SAGE_MUTED,
    charSpacing: 3,
  });
}

function buildCoverSlide(pptx: pptxgen, opts: Opts) {
  const slide = pptx.addSlide();
  pageFrame(slide, "INFINITY - SEO PROCESS - 2026");

  // Decorative concentric arcs top-right (approximate with circles)
  for (const r of [3.5, 2.6, 1.7, 0.9]) {
    slide.addShape("ellipse", {
      x: 13.333 - r,
      y: -r,
      w: r * 2,
      h: r * 2,
      fill: { type: "none" },
      line: { color: FOREST, width: 1, transparency: 88 },
    });
  }

  // Big title
  slide.addText("თქვენი SEO პროცესი", {
    x: 0.5,
    y: 2.0,
    w: 12,
    h: 1.2,
    fontSize: 56,
    fontFace: FONT,
    color: FOREST,
    bold: true,
  });

  // Domain line
  const subtitle = opts.hasRealDomain
    ? `საიტი: ${opts.domain}`
    : "ნიმუშის გვერდი";
  slide.addText(subtitle, {
    x: 0.5,
    y: 3.3,
    w: 12,
    h: 0.5,
    fontSize: 22,
    fontFace: FONT,
    color: SAGE_DARK,
  });

  // 3-step at-a-glance cards
  const steps = [
    { label: "I თვე", caption: "საფუძველი" },
    { label: "II თვე", caption: "გაძლიერება" },
    { label: "III თვე", caption: "მიმართულება" },
  ];
  const cardW = 3.6;
  const cardGap = 0.3;
  const totalW = cardW * 3 + cardGap * 2;
  const startX = (13.333 - totalW) / 2;
  steps.forEach((s, i) => {
    const x = startX + i * (cardW + cardGap);
    slide.addShape("roundRect", {
      x,
      y: 4.6,
      w: cardW,
      h: 1.5,
      fill: { color: SURFACE },
      line: { color: BORDER, width: 0.75 },
      rectRadius: 0.15,
    });
    slide.addText(String(i + 1).padStart(2, "0"), {
      x,
      y: 4.7,
      w: cardW,
      h: 0.3,
      fontSize: 9,
      fontFace: FONT_MONO,
      color: SAGE_MUTED,
      align: "center",
      charSpacing: 5,
    });
    slide.addText(s.label, {
      x,
      y: 5.0,
      w: cardW,
      h: 0.45,
      fontSize: 24,
      fontFace: FONT,
      color: FOREST,
      bold: true,
      align: "center",
    });
    slide.addText(s.caption, {
      x,
      y: 5.55,
      w: cardW,
      h: 0.4,
      fontSize: 14,
      fontFace: FONT,
      color: SAGE_DARK,
      align: "center",
    });
  });
}

function buildIntroSlide(pptx: pptxgen, _opts: Opts) {
  const slide = pptx.addSlide();
  pageFrame(slide, "INFINITY - SEO PROCESS - 2026");

  slide.addText("- გეგმის შესახებ", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
  });

  slide.addText("სამთვიანი ოპტიმიზაცია 3 ეტაპად", {
    x: 0.5,
    y: 1.35,
    w: 12,
    h: 0.9,
    fontSize: 36,
    fontFace: FONT,
    color: FOREST,
    bold: true,
  });

  const intro =
    "სამთვიანი ოპტიმიზაცია სამ მკაფიო ეტაპად იყოფა - პირველი თვე ქმნის საფუძველს, მეორე თვე აძლიერებს საიტს, მესამე თვე გვაჩვენებს მიმართულებას, საიდანაც უკვე უფრო სერიოზული ზრდის გაგრძელებაა შესაძლებელი.";

  slide.addText(intro, {
    x: 0.5,
    y: 2.5,
    w: 12.3,
    h: 1.4,
    fontSize: 18,
    fontFace: FONT,
    color: FOREST,
    valign: "top",
  });

  const note =
    "SEO არ იძლევა ერთ დღეში შედეგს - რეალური ცვლილებები 2-4 თვის შემდეგ ჩანს. პირველი ადგილის გარანტიას არც Google-ი იძლევა. ჩვენი მუშაობა ეფუძნება ეტაპობრივ ცვლილებას და მონაცემზე დაფუძნებულ გაზომვას.";
  slide.addText(note, {
    x: 0.5,
    y: 4.0,
    w: 12.3,
    h: 1.5,
    fontSize: 14,
    fontFace: FONT,
    color: SAGE_DARK,
    italic: false,
    valign: "top",
  });

  // 3 month cards
  const steps = [
    { label: "I თვე", caption: "ვაყენებთ საფუძველს" },
    { label: "II თვე", caption: "ვაძლიერებთ საიტს" },
    { label: "III თვე", caption: "ვაჩვენებთ მიმართულებას" },
  ];
  const cardW = 4;
  const cardGap = 0.15;
  const totalW = cardW * 3 + cardGap * 2;
  const startX = (13.333 - totalW) / 2;
  steps.forEach((s, i) => {
    const x = startX + i * (cardW + cardGap);
    slide.addShape("roundRect", {
      x,
      y: 5.6,
      w: cardW,
      h: 1.1,
      fill: { color: WHITE },
      line: { color: BORDER, width: 0.75 },
      rectRadius: 0.1,
    });
    slide.addText(s.label, {
      x,
      y: 5.7,
      w: cardW,
      h: 0.45,
      fontSize: 18,
      fontFace: FONT,
      color: FOREST,
      bold: true,
      align: "center",
    });
    slide.addText(s.caption, {
      x,
      y: 6.15,
      w: cardW,
      h: 0.4,
      fontSize: 13,
      fontFace: FONT,
      color: SAGE_DARK,
      align: "center",
    });
  });
}

function buildKeywordsSlide(pptx: pptxgen, keywords: string[]) {
  const slide = pptx.addSlide();
  pageFrame(slide, "INFINITY - SEO PROCESS - 2026");

  slide.addText("- საძიებო ფრაზები", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
  });

  slide.addText("რა ფრაზებზე ვმუშაობთ", {
    x: 0.5,
    y: 1.35,
    w: 12,
    h: 0.9,
    fontSize: 36,
    fontFace: FONT,
    color: FOREST,
    bold: true,
  });

  slide.addText(
    "ეს არის თქვენგან მოწოდებული საძიებო ფრაზები. Keyword Research-ის შემდეგ სია გაფართოვდება და დაზუსტდება - შემოვამატებთ კონკურენტთა მონაცემებს და რეალურ მოცულობას Google-დან.",
    {
      x: 0.5,
      y: 2.4,
      w: 12.3,
      h: 1.1,
      fontSize: 14,
      fontFace: FONT,
      color: SAGE_DARK,
    }
  );

  // Render keywords as pill list
  const cols = 3;
  const cellW = 4;
  const cellH = 0.5;
  const gap = 0.15;
  const totalW = cellW * cols + gap * (cols - 1);
  const startX = (13.333 - totalW) / 2;
  keywords.slice(0, 15).forEach((kw, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (cellW + gap);
    const y = 3.8 + row * (cellH + gap);
    slide.addShape("roundRect", {
      x,
      y,
      w: cellW,
      h: cellH,
      fill: { color: WHITE },
      line: { color: BORDER, width: 0.75 },
      rectRadius: 0.25,
    });
    slide.addText(`${String(i + 1).padStart(2, "0")}  ${kw}`, {
      x: x + 0.15,
      y,
      w: cellW - 0.3,
      h: cellH,
      fontSize: 12,
      fontFace: FONT,
      color: FOREST,
      valign: "middle",
    });
  });
}

function buildMonthSlide(pptx: pptxgen, month: MonthPhase) {
  const slide = pptx.addSlide();
  pageFrame(slide, `INFINITY - SEO PROCESS - ${month.num}`);

  slide.addText(month.num, {
    x: 0.5,
    y: 0.95,
    w: 4,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
  });

  slide.addText(month.title, {
    x: 0.5,
    y: 1.35,
    w: 12.3,
    h: 1.0,
    fontSize: 28,
    fontFace: FONT,
    color: FOREST,
    bold: true,
    valign: "top",
  });

  slide.addText(month.focus, {
    x: 0.5,
    y: 2.5,
    w: 12.3,
    h: 0.9,
    fontSize: 13,
    fontFace: FONT,
    color: FOREST,
    valign: "top",
  });

  // 2-column table (process | action)
  const tableRows: pptxgen.TableRow[] = month.rows.map((r, i) => {
    const bg = i % 2 === 0 ? WHITE : SURFACE;
    return [
      {
        text: r.process,
        options: {
          fontSize: 11,
          fontFace: FONT,
          color: FOREST,
          bold: true,
          fill: { color: bg },
          margin: 0.07,
          valign: "middle",
        },
      },
      {
        text: r.action,
        options: {
          fontSize: 11,
          fontFace: FONT,
          color: FOREST,
          fill: { color: bg },
          margin: 0.07,
          valign: "middle",
        },
      },
    ];
  });

  slide.addTable(tableRows, {
    x: 0.5,
    y: 3.6,
    w: 12.3,
    colW: [4, 8.3],
    border: { type: "solid", color: BORDER, pt: 0.5 },
    autoPage: false,
  });

  // Result strip at bottom
  slide.addShape("rect", {
    x: 0.5,
    y: 6.35,
    w: 12.3,
    h: 0.5,
    fill: { color: SAGE_MUTED, transparency: 75 },
    line: { type: "none" },
  });
  slide.addText(`ამ თვის შედეგი:  ${month.result}`, {
    x: 0.7,
    y: 6.35,
    w: 11.9,
    h: 0.5,
    fontSize: 11,
    fontFace: FONT,
    color: FOREST,
    italic: true,
    valign: "middle",
  });
}

function buildSummarySlide(pptx: pptxgen) {
  const slide = pptx.addSlide();
  pageFrame(slide, "INFINITY - SEO PROCESS - SUMMARY");

  slide.addText("- შემაჯამებლად", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
  });

  slide.addText("3-თვიანი SEO ოპტიმიზაცია - მოკლედ", {
    x: 0.5,
    y: 1.35,
    w: 12.3,
    h: 0.9,
    fontSize: 32,
    fontFace: FONT,
    color: FOREST,
    bold: true,
  });

  // Header row + data rows
  const headerOpts: pptxgen.TableCellProps = {
    fontSize: 12,
    fontFace: FONT,
    color: WHITE,
    bold: true,
    fill: { color: "3D3D3D" },
    margin: 0.1,
    valign: "middle",
  };
  const cellBase: pptxgen.TableCellProps = {
    fontSize: 13,
    fontFace: FONT,
    color: FOREST,
    margin: 0.12,
    valign: "middle",
  };

  const table: pptxgen.TableRow[] = [
    [
      { text: "თვე", options: headerOpts },
      { text: "მთავარი აქცენტი", options: headerOpts },
      { text: "მიზანი", options: headerOpts },
    ],
    ...SUMMARY_ROWS.map<pptxgen.TableRow>((r, i) => {
      const bg = i % 2 === 0 ? WHITE : SURFACE;
      return [
        {
          text: r.month,
          options: { ...cellBase, bold: true, fill: { color: bg } },
        },
        { text: r.focus, options: { ...cellBase, fill: { color: bg } } },
        { text: r.goal, options: { ...cellBase, fill: { color: bg } } },
      ];
    }),
  ];

  slide.addTable(table, {
    x: 0.5,
    y: 2.7,
    w: 12.3,
    colW: [2, 4.3, 6],
    border: { type: "solid", color: BORDER, pt: 0.5 },
    autoPage: false,
  });
}

function buildReportSlide(pptx: pptxgen) {
  const slide = pptx.addSlide();
  pageFrame(slide, "INFINITY - SEO PROCESS - REPORT");

  slide.addText("- ანგარიში", {
    x: 0.5,
    y: 0.95,
    w: 12,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_MONO,
    color: SAGE_DARK,
    charSpacing: 5,
  });

  slide.addText("რეპორტი ყოველი თვის ბოლოს", {
    x: 0.5,
    y: 1.35,
    w: 12.3,
    h: 0.9,
    fontSize: 32,
    fontFace: FONT,
    color: FOREST,
    bold: true,
  });

  slide.addShape("roundRect", {
    x: 0.5,
    y: 2.6,
    w: 12.3,
    h: 4.2,
    fill: { color: WHITE },
    line: { color: BORDER, width: 0.75 },
    rectRadius: 0.15,
  });

  const reportItems = [
    "შესრულებული სამუშაოები",
    "აღმოჩენილი პრობლემები",
    "გასწორებული გვერდები",
    "რეალური მონაცემები - ტრაფიკი, რანკი, კონვერსიები",
    "შემდეგი თვის პრიორიტეტი",
    "თქვენგან საჭირო მასალები - ტექსტი, ფოტო, აღწერა",
  ];

  reportItems.forEach((item, i) => {
    const y = 2.95 + i * 0.55;
    // Number badge
    slide.addShape("ellipse", {
      x: 1,
      y,
      w: 0.4,
      h: 0.4,
      fill: { color: FOREST },
      line: { type: "none" },
    });
    slide.addText(String(i + 1), {
      x: 1,
      y,
      w: 0.4,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT,
      color: WHITE,
      bold: true,
      align: "center",
      valign: "middle",
    });
    slide.addText(item, {
      x: 1.6,
      y,
      w: 10.5,
      h: 0.4,
      fontSize: 14,
      fontFace: FONT,
      color: FOREST,
      valign: "middle",
    });
  });
}
