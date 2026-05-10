import type PptxGenJS from "pptxgenjs";
import type {
  PresentationSlide,
  PassEntry,
  PresentationGroup,
  ProblemEntry,
  RecommendationItem,
  ServiceBlock,
} from "./presentation";
import { GROUP_LABEL } from "./presentation";

type Pptx = PptxGenJS;
type Slide = PptxGenJS.Slide;
type TextRun = PptxGenJS.TextProps;

const NAVY = "08086D";
const CYAN = "22D3EE";
const WHITE = "FFFFFF";
const WHITE_BRIGHT = "E6E6F2";
const WHITE_MUTED = "B8B8D6";
const WHITE_DIM = "8888B0";
const WHITE_FAINT = "5C5C8C";
const RED = "EF4444";
const RED_TEXT = "F87171";
const AMBER = "FCD34D";
const AMBER_DARK = "78350F";
const BLUE_LINK = "1D4ED8";

const FONT = "Sylfaen";
const FONT_MONO = "Consolas";

const SLIDE_W = 13.333;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function navySlide(pptx: Pptx): Slide {
  const slide = pptx.addSlide();
  slide.background = { color: NAVY };
  return slide;
}

function addFooter(
  slide: Slide,
  slideNum: number,
  total: number,
  middleLabel?: string
) {
  slide.addText("INFINITY SOLUTIONS", {
    x: 0.5,
    y: 7.05,
    w: 4,
    h: 0.3,
    fontSize: 9,
    color: WHITE_FAINT,
    fontFace: FONT,
    charSpacing: 4,
  });

  if (middleLabel) {
    slide.addText(middleLabel, {
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

function addGeometricSquares(slide: Slide, baseX: number, baseY: number) {
  const lineLight = { color: WHITE, width: 0.75, transparency: 55 };

  slide.addShape("rect", {
    x: baseX,
    y: baseY,
    w: 2.4,
    h: 2.4,
    fill: { color: WHITE, transparency: 100 },
    line: lineLight,
  });

  slide.addShape("rect", {
    x: baseX + 0.7,
    y: baseY + 0.7,
    w: 2.4,
    h: 2.4,
    fill: { color: WHITE, transparency: 96 },
    line: lineLight,
  });

  slide.addShape("rect", {
    x: baseX,
    y: baseY + 2.6,
    w: 1.95,
    h: 1.65,
    fill: { color: WHITE, transparency: 100 },
    line: { color: WHITE, width: 0.75, transparency: 70 },
  });
}

function addCoverSlide(
  pptx: Pptx,
  data: Extract<PresentationSlide, { kind: "cover" }>
) {
  const slide = navySlide(pptx);

  addGeometricSquares(slide, 0.6, 1.2);

  slide.addText("SEO REPORT", {
    x: 5.5,
    y: 2.5,
    w: 7.3,
    h: 0.4,
    fontSize: 11,
    color: WHITE_MUTED,
    fontFace: FONT,
    bold: true,
    charSpacing: 8,
  });

  slide.addText(data.siteName, {
    x: 5.5,
    y: 2.95,
    w: 7.3,
    h: 1.5,
    fontSize: 56,
    color: WHITE,
    fontFace: FONT,
    bold: true,
    valign: "top",
  });

  slide.addText(data.siteUrl, {
    x: 5.5,
    y: 4.55,
    w: 7.3,
    h: 0.3,
    fontSize: 10,
    color: WHITE_FAINT,
    fontFace: FONT_MONO,
  });

  slide.addShape("roundRect", {
    x: 5.5,
    y: 5,
    w: 2.4,
    h: 0.55,
    fill: { color: WHITE },
    line: { color: WHITE, width: 0 },
    rectRadius: 0.06,
  });
  slide.addText(data.date, {
    x: 5.5,
    y: 5,
    w: 2.4,
    h: 0.55,
    fontSize: 13,
    color: NAVY,
    fontFace: FONT,
    bold: true,
    align: "center",
    valign: "middle",
  });

  slide.addText(
    [
      { text: "made by ", options: { color: WHITE_DIM } },
      {
        text: "INFINITY SOLUTIONS",
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

function addSummarySlide(
  pptx: Pptx,
  data: Extract<PresentationSlide, { kind: "summary" }>,
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("რა მუშაობს კარგად", {
    x: 0.5,
    y: 0.5,
    w: 12.3,
    h: 0.4,
    fontSize: 10,
    color: WHITE_DIM,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });

  slide.addText("ძლიერი მხარეები", {
    x: 0.5,
    y: 0.95,
    w: 12.3,
    h: 0.8,
    fontSize: 36,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  const totalPasses =
    data.groups.technical.length +
    data.groups.onPage.length +
    data.groups.offPage.length;
  slide.addText(
    `ამ ${totalPasses} პუნქტში თქვენი საიტი უკვე SEO-სტანდარტს აკმაყოფილებს.`,
    {
      x: 0.5,
      y: 1.85,
      w: 12.3,
      h: 0.4,
      fontSize: 11,
      color: WHITE_MUTED,
      fontFace: FONT,
    }
  );

  const groupKeys: PresentationGroup[] = ["technical", "onPage", "offPage"];
  const colW = 4;
  const gap = 0.165;
  const colY = 2.55;
  const colH = 4.3;
  const baseX = 0.5;

  groupKeys.forEach((key, i) => {
    const x = baseX + i * (colW + gap);
    addSummaryColumn(
      slide,
      x,
      colY,
      colW,
      colH,
      i,
      GROUP_LABEL[key],
      data.groups[key]
    );
  });

  addFooter(slide, slideNum, total, data.siteName);
}

function addSummaryColumn(
  slide: Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
  label: string,
  items: PassEntry[]
) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: WHITE, transparency: 95 },
    line: { color: WHITE, width: 0.5, transparency: 90 },
    rectRadius: 0.05,
  });

  slide.addText(String(index + 1).padStart(2, "0"), {
    x: x + 0.2,
    y: y + 0.18,
    w: 0.85,
    h: 0.5,
    fontSize: 22,
    color: WHITE_FAINT,
    fontFace: FONT,
    bold: true,
  });

  slide.addText(label, {
    x: x + 1,
    y: y + 0.22,
    w: w - 1.15,
    h: 0.3,
    fontSize: 12,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  slide.addText(`${items.length} პუნქტი`, {
    x: x + 1,
    y: y + 0.55,
    w: w - 1.15,
    h: 0.25,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT,
    charSpacing: 4,
  });

  if (items.length === 0) {
    slide.addText("ჯერ-ჯერობით კარგი არაფერია.", {
      x: x + 0.2,
      y: y + 1.1,
      w: w - 0.4,
      h: 0.4,
      fontSize: 10,
      color: WHITE_FAINT,
      fontFace: FONT,
      italic: true,
    });
    return;
  }

  const visible = items.slice(0, 12);
  const moreCount = items.length - visible.length;

  const runs: TextRun[] = [];
  visible.forEach((item, i) => {
    runs.push({
      text: "✓ ",
      options: { color: CYAN, bold: true },
    });
    runs.push({
      text: item.check.label,
      options: {
        color: WHITE_BRIGHT,
        breakLine: i < visible.length - 1 || moreCount > 0,
      },
    });
  });
  if (moreCount > 0) {
    runs.push({
      text: `+ ${moreCount} მეტი`,
      options: { color: WHITE_FAINT, italic: true },
    });
  }

  slide.addText(runs, {
    x: x + 0.2,
    y: y + 1.05,
    w: w - 0.4,
    h: h - 1.2,
    fontSize: 10,
    fontFace: FONT,
    paraSpaceAfter: 2,
    valign: "top",
  });
}

function addProblemSlide(
  pptx: Pptx,
  data: Extract<PresentationSlide, { kind: "problem" }>,
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);
  const { problem } = data;
  const isFail = problem.check.status === "fail";
  const noVisual = problem.visual === "noVisual";

  const number = String(data.slideIndex + 1).padStart(2, "0");
  const statusLabel = isFail ? "კრიტიკული" : "გაფრთხილება";
  const statusBg = isFail ? RED : AMBER;
  const statusColor = isFail ? WHITE : AMBER_DARK;

  let contentX: number;
  let contentW: number;
  if (noVisual) {
    contentX = 0.7;
    contentW = 11.93;
  } else {
    contentX = 7;
    contentW = 5.83;
    addProblemVisual(slide, problem, 0.6, 1, 5.8, 5.5);
  }

  slide.addText(number, {
    x: contentX,
    y: 0.6,
    w: 1.5,
    h: noVisual ? 1.1 : 0.9,
    fontSize: noVisual ? 60 : 44,
    color: WHITE_FAINT,
    fontFace: FONT,
    bold: true,
  });

  slide.addShape("roundRect", {
    x: contentX + (noVisual ? 1.6 : 1.3),
    y: 0.7,
    w: 2.3,
    h: 0.32,
    fill: { color: WHITE, transparency: 90 },
    line: { color: WHITE, width: 0, transparency: 100 },
    rectRadius: 0.04,
  });
  slide.addText(problem.categoryName, {
    x: contentX + (noVisual ? 1.6 : 1.3),
    y: 0.7,
    w: 2.3,
    h: 0.32,
    fontSize: 9,
    color: WHITE_BRIGHT,
    fontFace: FONT,
    bold: true,
    align: "center",
    valign: "middle",
    charSpacing: 4,
  });

  slide.addShape("roundRect", {
    x: contentX + (noVisual ? 1.6 : 1.3),
    y: 1.08,
    w: 1.7,
    h: 0.32,
    fill: { color: statusBg },
    line: { color: statusBg, width: 0 },
    rectRadius: 0.04,
  });
  slide.addText(statusLabel, {
    x: contentX + (noVisual ? 1.6 : 1.3),
    y: 1.08,
    w: 1.7,
    h: 0.32,
    fontSize: 9,
    color: statusColor,
    fontFace: FONT,
    bold: true,
    align: "center",
    valign: "middle",
    charSpacing: 4,
  });

  slide.addText(problem.check.label, {
    x: contentX,
    y: noVisual ? 1.85 : 1.6,
    w: contentW,
    h: noVisual ? 1 : 0.85,
    fontSize: noVisual ? 40 : 28,
    color: WHITE,
    fontFace: FONT,
    bold: true,
    valign: "top",
  });

  if (problem.impact) {
    slide.addText(problem.impact, {
      x: contentX,
      y: noVisual ? 2.85 : 2.45,
      w: contentW,
      h: 0.3,
      fontSize: 9,
      color: WHITE_FAINT,
      fontFace: FONT,
      charSpacing: 5,
    });
  }

  let cursor = noVisual ? 3.2 : 2.85;

  slide.addText("პრობლემის აღწერა", {
    x: contentX,
    y: cursor,
    w: contentW,
    h: 0.25,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT,
    bold: true,
    charSpacing: 5,
  });
  cursor += 0.3;

  slide.addText(problem.check.message, {
    x: contentX,
    y: cursor,
    w: contentW,
    h: noVisual ? 0.7 : 0.6,
    fontSize: noVisual ? 13 : 11,
    color: WHITE_BRIGHT,
    fontFace: FONT,
    valign: "top",
  });
  cursor += noVisual ? 0.9 : 0.75;

  if (problem.seoImpact) {
    slide.addText("გავლენა SEO-ზე", {
      x: contentX,
      y: cursor,
      w: contentW,
      h: 0.25,
      fontSize: 9,
      color: AMBER,
      fontFace: FONT,
      bold: true,
      charSpacing: 5,
    });
    cursor += 0.3;

    slide.addText(problem.seoImpact, {
      x: contentX,
      y: cursor,
      w: contentW,
      h: noVisual ? 1.3 : 1.5,
      fontSize: noVisual ? 11 : 10,
      color: WHITE_MUTED,
      fontFace: FONT,
      valign: "top",
    });
    cursor += noVisual ? 1.5 : 1.65;
  }

  if (problem.check.recommendation) {
    slide.addShape("line", {
      x: contentX,
      y: cursor - 0.05,
      w: contentW,
      h: 0,
      line: { color: WHITE, width: 0.5, transparency: 85 },
    });
    cursor += 0.1;

    slide.addText("✦ გადაწყვეტა", {
      x: contentX,
      y: cursor,
      w: contentW,
      h: 0.25,
      fontSize: 9,
      color: CYAN,
      fontFace: FONT,
      bold: true,
      charSpacing: 5,
    });
    cursor += 0.3;

    slide.addText(problem.check.recommendation, {
      x: contentX,
      y: cursor,
      w: contentW,
      h: 1.3,
      fontSize: noVisual ? 12 : 10,
      color: WHITE_BRIGHT,
      fontFace: FONT,
      valign: "top",
    });
  }

  addFooter(
    slide,
    slideNum,
    total,
    `${data.slideIndex + 1} / ${data.totalProblems} პრობლემა`
  );
}

function addWhiteCard(
  slide: Slide,
  x: number,
  y: number,
  w: number,
  h: number
) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: WHITE },
    line: { color: WHITE, width: 0 },
    rectRadius: 0.08,
  });
}

function addProblemVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  switch (problem.visual) {
    case "serp":
      return drawSerpVisual(slide, problem, x, y, w, h);
    case "facebook":
      return drawFacebookVisual(slide, problem, x, y, w, h);
    case "twitter":
      return drawTwitterVisual(slide, problem, x, y, w, h);
    case "code-empty":
      return drawCodeEmptyVisual(slide, problem, x, y, w, h);
    case "file-missing":
      return drawFileMissingVisual(slide, problem, x, y, w, h);
    case "sitemap-missing":
      return drawSitemapMissingVisual(slide, x, y, w, h);
    case "broken-links":
      return drawBrokenLinksVisual(slide, problem, x, y, w, h);
    case "stats":
      return drawStatsVisual(slide, problem, x, y, w, h);
    case "alt-missing":
      return drawAltMissingVisual(slide, x, y, w, h);
    case "https-warning":
      return drawHttpsWarningVisual(slide, problem, x, y, w, h);
    case "headings":
      return drawHeadingsVisual(slide, x, y, w, h);
    case "noVisual":
      return;
    default:
      return drawGenericVisual(slide, problem, x, y, w, h);
  }
}

function centerCard(x: number, y: number, w: number, h: number) {
  const cardW = Math.min(w * 0.92, 5.2);
  const cardH = Math.min(h * 0.85, 4.8);
  const cardX = x + (w - cardW) / 2;
  const cardY = y + (h - cardH) / 2;
  return { cardX, cardY, cardW, cardH };
}

function drawSerpVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  const value =
    typeof problem.check.value === "string" ? problem.check.value : "";
  const isTitleCheck = problem.check.label === "Title Tag";
  const isDescCheck = problem.check.label === "Meta Description";

  slide.addText("Google ძიების შედეგი", {
    x: cardX + 0.3,
    y: cardY + 0.3,
    w: cardW - 0.6,
    h: 0.3,
    fontSize: 9,
    color: "9CA3AF",
    fontFace: FONT,
    charSpacing: 5,
  });

  slide.addText("თქვენი საიტი", {
    x: cardX + 0.3,
    y: cardY + 0.75,
    w: cardW - 0.6,
    h: 0.3,
    fontSize: 11,
    color: "374151",
    fontFace: FONT,
  });

  const titleText = isTitleCheck && value ? truncate(value, 60) : "გვერდის სათაური";
  slide.addText(titleText, {
    x: cardX + 0.3,
    y: cardY + 1.15,
    w: cardW - 0.6,
    h: 0.7,
    fontSize: 18,
    color: BLUE_LINK,
    fontFace: FONT,
    valign: "top",
  });

  if (isDescCheck && !value) {
    slide.addText(
      "Description-ი არ არის — Google ავტომატურად აიღებს შემთხვევით ტექსტს.",
      {
        x: cardX + 0.3,
        y: cardY + 1.95,
        w: cardW - 0.6,
        h: 1,
        fontSize: 11,
        color: RED,
        fontFace: FONT,
        italic: true,
        valign: "top",
      }
    );
  } else {
    const descText =
      isDescCheck && value
        ? truncate(value, 160)
        : "გვერდის აღწერა გამოჩნდება ძიების შედეგებში.";
    slide.addText(descText, {
      x: cardX + 0.3,
      y: cardY + 1.95,
      w: cardW - 0.6,
      h: 1.4,
      fontSize: 11,
      color: "4B5563",
      fontFace: FONT,
      valign: "top",
    });
  }
}

function drawFacebookVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  const imageH = cardH * 0.55;
  slide.addShape("rect", {
    x: cardX + 0.2,
    y: cardY + 0.2,
    w: cardW - 0.4,
    h: imageH - 0.2,
    fill: { color: "F3F4F6" },
    line: { color: "F3F4F6", width: 0 },
  });
  slide.addText("✕", {
    x: cardX,
    y: cardY + 0.5,
    w: cardW,
    h: 0.5,
    fontSize: 24,
    color: RED,
    fontFace: FONT,
    align: "center",
    bold: true,
  });
  slide.addText(
    problem.check.label === "Open Graph"
      ? "Open Graph tags არ არის"
      : "სურათი ვერ ჩატვირთა",
    {
      x: cardX,
      y: cardY + 1.1,
      w: cardW,
      h: 0.4,
      fontSize: 10,
      color: "6B7280",
      fontFace: FONT,
      align: "center",
    }
  );

  slide.addText("yoursite.com", {
    x: cardX + 0.3,
    y: cardY + imageH + 0.2,
    w: cardW - 0.6,
    h: 0.25,
    fontSize: 9,
    color: "9CA3AF",
    fontFace: FONT,
    charSpacing: 4,
  });

  slide.addText("(სათაური არ არის)", {
    x: cardX + 0.3,
    y: cardY + imageH + 0.5,
    w: cardW - 0.6,
    h: 0.4,
    fontSize: 13,
    color: "9CA3AF",
    fontFace: FONT,
    italic: true,
    bold: true,
  });

  slide.addText("Facebook გაზიარება", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawTwitterVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  drawFacebookVisual(slide, problem, x, y, w, h);
  // Override the bottom label
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  slide.addShape("rect", {
    x: cardX,
    y: cardY + cardH - 0.45,
    w: cardW,
    h: 0.4,
    fill: { color: WHITE },
    line: { color: WHITE, width: 0 },
  });
  slide.addText("Twitter / X გაზიარება", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawCodeEmptyVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);

  slide.addShape("roundRect", {
    x: cardX,
    y: cardY,
    w: cardW,
    h: cardH,
    fill: { color: "0A0A0F" },
    line: { color: "0A0A0F", width: 0 },
    rectRadius: 0.08,
  });

  slide.addText("JSON-LD", {
    x: cardX + 0.3,
    y: cardY + 0.25,
    w: cardW - 0.6,
    h: 0.3,
    fontSize: 9,
    color: "6B7280",
    fontFace: FONT_MONO,
    charSpacing: 4,
  });

  const codeRuns: TextRun[] = [
    {
      text: `<!-- ${problem.check.label} -->`,
      options: { color: "6B7280", breakLine: true },
    },
    {
      text: `<script type="application/ld+json">`,
      options: { color: "9CA3AF", breakLine: true },
    },
    {
      text: `   // ❌ schema არ არის გენერირებული`,
      options: { color: "F87171", breakLine: true },
    },
    {
      text: `</script>`,
      options: { color: "9CA3AF" },
    },
  ];

  slide.addText(codeRuns, {
    x: cardX + 0.3,
    y: cardY + 0.7,
    w: cardW - 0.6,
    h: cardH - 1,
    fontSize: 11,
    fontFace: FONT_MONO,
    paraSpaceAfter: 4,
    valign: "top",
  });

  slide.addText("HTML <head>", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "6B7280",
    fontFace: FONT_MONO,
    align: "center",
    charSpacing: 5,
  });
}

function drawFileMissingVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  slide.addShape("rect", {
    x: cardX + 0.2,
    y: cardY + 0.2,
    w: cardW - 0.4,
    h: 0.5,
    fill: { color: "F3F4F6" },
    line: { color: "F3F4F6", width: 0 },
  });
  slide.addText(
    [
      { text: "GET ", options: { color: "9CA3AF" } },
      {
        text: `/${problem.check.label.toLowerCase()}`,
        options: { color: "111827" },
      },
    ],
    {
      x: cardX + 0.4,
      y: cardY + 0.2,
      w: cardW - 0.8,
      h: 0.5,
      fontSize: 11,
      fontFace: FONT_MONO,
      valign: "middle",
    }
  );

  slide.addText("✕", {
    x: cardX,
    y: cardY + 1.4,
    w: cardW,
    h: 0.8,
    fontSize: 50,
    color: RED,
    fontFace: FONT,
    align: "center",
    bold: true,
  });

  slide.addText("404", {
    x: cardX,
    y: cardY + 2.4,
    w: cardW,
    h: 0.6,
    fontSize: 32,
    color: RED,
    fontFace: FONT,
    align: "center",
    bold: true,
  });

  slide.addText("ფაილი ვერ მოიძებნა", {
    x: cardX,
    y: cardY + 3.05,
    w: cardW,
    h: 0.4,
    fontSize: 12,
    color: "6B7280",
    fontFace: FONT,
    align: "center",
  });

  slide.addText("HTTP REQUEST", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawSitemapMissingVisual(
  slide: Slide,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  slide.addShape("rect", {
    x: cardX + 0.2,
    y: cardY + 0.2,
    w: cardW - 0.4,
    h: 0.4,
    fill: { color: "F3F4F6" },
    line: { color: "F3F4F6", width: 0 },
  });
  slide.addText("sitemap.xml", {
    x: cardX + 0.4,
    y: cardY + 0.2,
    w: cardW - 0.8,
    h: 0.4,
    fontSize: 10,
    color: "6B7280",
    fontFace: FONT_MONO,
    valign: "middle",
  });

  const xmlRuns: TextRun[] = [
    { text: `<?xml version="1.0" encoding="UTF-8"?>`, options: { breakLine: true, color: "9CA3AF" } },
    { text: `<urlset xmlns="...">`, options: { breakLine: true, color: "9CA3AF" } },
    { text: `   <url>`, options: { breakLine: true, color: "9CA3AF" } },
    { text: `      <loc>https://...</loc>`, options: { breakLine: true, color: "9CA3AF" } },
    { text: `   </url>`, options: { breakLine: true, color: "9CA3AF" } },
    { text: `</urlset>`, options: { color: "9CA3AF" } },
  ];

  slide.addText(xmlRuns, {
    x: cardX + 0.3,
    y: cardY + 0.85,
    w: cardW - 0.6,
    h: cardH - 1.5,
    fontSize: 10,
    fontFace: FONT_MONO,
    paraSpaceAfter: 3,
    valign: "top",
  });

  // Big "Missing" overlay
  slide.addShape("roundRect", {
    x: cardX + cardW / 2 - 1.4,
    y: cardY + cardH / 2 - 0.5,
    w: 2.8,
    h: 1,
    fill: { color: WHITE, transparency: 10 },
    line: { color: RED, width: 1.5 },
    rectRadius: 0.05,
  });
  slide.addText("Sitemap არ არსებობს", {
    x: cardX + cardW / 2 - 1.4,
    y: cardY + cardH / 2 - 0.5,
    w: 2.8,
    h: 1,
    fontSize: 13,
    color: RED,
    fontFace: FONT,
    bold: true,
    align: "center",
    valign: "middle",
  });

  slide.addText("XML SITEMAP", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawBrokenLinksVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  const items = Array.isArray(problem.check.value)
    ? (problem.check.value as string[]).slice(0, 5)
    : [];

  const lineH = 0.55;
  const startY = cardY + 0.3;

  if (items.length === 0) {
    slide.addText("ბმულები ვერ ვნახე", {
      x: cardX + 0.3,
      y: cardY + 0.5,
      w: cardW - 0.6,
      h: 0.4,
      fontSize: 11,
      color: "9CA3AF",
      fontFace: FONT,
      italic: true,
    });
  } else {
    items.forEach((item, i) => {
      const itemY = startY + i * lineH;
      slide.addText(
        [
          { text: "✕  ", options: { color: RED, bold: true } },
          {
            text: truncate(item, 50),
            options: { color: "374151" },
          },
        ],
        {
          x: cardX + 0.3,
          y: itemY,
          w: cardW - 0.6,
          h: lineH - 0.05,
          fontSize: 9,
          fontFace: FONT_MONO,
          valign: "middle",
        }
      );
      if (i < items.length - 1) {
        slide.addShape("line", {
          x: cardX + 0.3,
          y: itemY + lineH - 0.05,
          w: cardW - 0.6,
          h: 0,
          line: { color: "E5E7EB", width: 0.5 },
        });
      }
    });
  }

  slide.addText("გატეხილი ბმულები", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawStatsVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  const value = String(problem.check.value ?? "");
  let current = 0;
  let total = 0;
  if (value.includes("/")) {
    const parts = value.split("/").map((s) => parseInt(s.trim(), 10));
    if (!Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      current = parts[0];
      total = parts[1];
    }
  }
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const fillColor =
    percentage >= 70 ? "10B981" : percentage >= 30 ? "F59E0B" : "EF4444";

  slide.addText(
    [
      { text: String(current), options: { fontSize: 60, color: "111827", bold: true } },
      { text: " / ", options: { fontSize: 28, color: "D1D5DB" } },
      { text: String(total), options: { fontSize: 28, color: "6B7280" } },
    ],
    {
      x: cardX + 0.3,
      y: cardY + 0.4,
      w: cardW - 0.6,
      h: 1.3,
      fontFace: FONT,
      align: "center",
      valign: "middle",
    }
  );

  const subtext = problem.check.label.includes("ALT")
    ? "სურათი ALT ტექსტით"
    : problem.check.label === "Image Format"
    ? "სურათი WebP/AVIF ფორმატში"
    : problem.check.label === "Lazy Loading"
    ? "სურათი lazy load-ით"
    : problem.check.label;

  slide.addText(subtext, {
    x: cardX + 0.3,
    y: cardY + 1.85,
    w: cardW - 0.6,
    h: 0.3,
    fontSize: 10,
    color: "6B7280",
    fontFace: FONT,
    align: "center",
    charSpacing: 4,
  });

  // Progress bar
  const barX = cardX + 0.5;
  const barY = cardY + 2.4;
  const barW = cardW - 1;
  const barH = 0.2;
  slide.addShape("roundRect", {
    x: barX,
    y: barY,
    w: barW,
    h: barH,
    fill: { color: "F3F4F6" },
    line: { color: "F3F4F6", width: 0 },
    rectRadius: 0.1,
  });
  if (percentage > 0) {
    slide.addShape("roundRect", {
      x: barX,
      y: barY,
      w: Math.max(0.2, barW * (percentage / 100)),
      h: barH,
      fill: { color: fillColor },
      line: { color: fillColor, width: 0 },
      rectRadius: 0.1,
    });
  }

  slide.addText(
    `${percentage}% ${
      percentage >= 70 ? "ოპტიმიზებული" : percentage >= 30 ? "ნაწილობრივ" : "კრიტიკული"
    }`,
    {
      x: cardX,
      y: cardY + 2.85,
      w: cardW,
      h: 0.3,
      fontSize: 10,
      color: "9CA3AF",
      fontFace: FONT,
      align: "center",
      charSpacing: 4,
    }
  );

  slide.addText("სტატისტიკა", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawAltMissingVisual(
  slide: Slide,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  slide.addShape("rect", {
    x: cardX + 0.3,
    y: cardY + 0.3,
    w: cardW - 0.6,
    h: 1.8,
    fill: { color: "F3F4F6" },
    line: { color: "F3F4F6", width: 0 },
  });

  slide.addText("🖼", {
    x: cardX,
    y: cardY + 0.7,
    w: cardW,
    h: 0.8,
    fontSize: 36,
    color: "D1D5DB",
    align: "center",
    valign: "middle",
  });

  slide.addShape("roundRect", {
    x: cardX + cardW - 1.1,
    y: cardY + 0.45,
    w: 0.7,
    h: 0.3,
    fill: { color: RED },
    line: { color: RED, width: 0 },
    rectRadius: 0.04,
  });
  slide.addText("no alt", {
    x: cardX + cardW - 1.1,
    y: cardY + 0.45,
    w: 0.7,
    h: 0.3,
    fontSize: 9,
    color: WHITE,
    fontFace: FONT_MONO,
    bold: true,
    align: "center",
    valign: "middle",
  });

  slide.addText('<img src="..." />', {
    x: cardX + 0.3,
    y: cardY + 2.3,
    w: cardW - 0.6,
    h: 0.4,
    fontSize: 10,
    color: "6B7280",
    fontFace: FONT_MONO,
  });

  slide.addText("alt ატრიბუტი არ არის", {
    x: cardX + 0.3,
    y: cardY + 2.7,
    w: cardW - 0.6,
    h: 0.3,
    fontSize: 10,
    color: RED,
    fontFace: FONT,
  });

  slide.addText("ALT ტექსტი", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawHttpsWarningVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  // URL bar mockup
  slide.addShape("roundRect", {
    x: cardX + 0.3,
    y: cardY + 0.3,
    w: cardW - 0.6,
    h: 0.6,
    fill: { color: "F3F4F6" },
    line: { color: "F3F4F6", width: 0 },
    rectRadius: 0.05,
  });

  slide.addText(
    [
      { text: "🔓 ", options: { color: RED } },
      {
        text: problem.check.label,
        options: { color: RED, bold: true },
      },
    ],
    {
      x: cardX + 0.5,
      y: cardY + 0.3,
      w: cardW - 1,
      h: 0.6,
      fontSize: 12,
      fontFace: FONT_MONO,
      valign: "middle",
    }
  );

  const warnText =
    problem.check.label === "HTTPS"
      ? "ბრაუზერი მომხმარებელს აფრთხილებს ცუდი დაცვის შესახებ."
      : "კონფიგურაცია არ აკმაყოფილებს თანამედროვე SEO სტანდარტებს.";

  slide.addText(warnText, {
    x: cardX + 0.3,
    y: cardY + 1.3,
    w: cardW - 0.6,
    h: 1.5,
    fontSize: 11,
    color: "6B7280",
    fontFace: FONT,
    valign: "top",
  });

  slide.addText("ბრაუზერის მისამართი", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawHeadingsVisual(
  slide: Slide,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  const lines: TextRun[] = [
    { text: "H1 — გვერდის სათაური", options: { color: "374151", breakLine: true } },
    { text: "    (H2 აკლია)", options: { color: "9CA3AF", breakLine: true } },
    { text: "        ⚠ H4 პირდაპირ H1-ის ქვეშ — გადახტომა", options: { color: "D97706" } },
  ];

  slide.addText(lines, {
    x: cardX + 0.3,
    y: cardY + 0.4,
    w: cardW - 0.6,
    h: cardH - 0.8,
    fontSize: 12,
    fontFace: FONT_MONO,
    paraSpaceAfter: 4,
    valign: "top",
  });

  slide.addText("სათაურების იერარქია", {
    x: cardX,
    y: cardY + cardH - 0.4,
    w: cardW,
    h: 0.3,
    fontSize: 8,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function drawGenericVisual(
  slide: Slide,
  problem: ProblemEntry,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const { cardX, cardY, cardW, cardH } = centerCard(x, y, w, h);
  addWhiteCard(slide, cardX, cardY, cardW, cardH);

  const isFail = problem.check.status === "fail";

  slide.addShape("ellipse", {
    x: cardX + cardW / 2 - 0.5,
    y: cardY + 0.6,
    w: 1,
    h: 1,
    fill: { color: isFail ? RED : "F59E0B", transparency: 90 },
    line: { color: isFail ? RED : "F59E0B", width: 0 },
  });

  slide.addText(isFail ? "✕" : "⚠", {
    x: cardX,
    y: cardY + 0.6,
    w: cardW,
    h: 1,
    fontSize: 40,
    color: isFail ? RED : "F59E0B",
    fontFace: FONT,
    align: "center",
    bold: true,
  });

  slide.addText(problem.check.label, {
    x: cardX,
    y: cardY + 2,
    w: cardW,
    h: 0.5,
    fontSize: 16,
    color: "111827",
    fontFace: FONT,
    align: "center",
    bold: true,
  });

  slide.addText(isFail ? "კრიტიკული პრობლემა" : "გაფრთხილება", {
    x: cardX,
    y: cardY + 2.6,
    w: cardW,
    h: 0.4,
    fontSize: 10,
    color: "9CA3AF",
    fontFace: FONT,
    align: "center",
    charSpacing: 5,
  });
}

function addRecommendationsSlide(
  pptx: Pptx,
  data: Extract<PresentationSlide, { kind: "recommendations" }>,
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText(`${data.siteUrl} · ვებსაიტის SEO აუდიტი`, {
    x: 0.5,
    y: 0.5,
    w: 12.3,
    h: 0.35,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 6,
  });

  slide.addText("შეჯამება და რეკომენდაციები", {
    x: 0.5,
    y: 0.95,
    w: 12.3,
    h: 0.8,
    fontSize: 36,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  const items = data.items.slice(0, 5);
  const startY = 2.1;
  const itemH = 0.95;

  items.forEach((item, i) => {
    const y = startY + i * itemH;

    // Cyan dot
    slide.addShape("ellipse", {
      x: 0.6,
      y: y + 0.15,
      w: 0.15,
      h: 0.15,
      fill: { color: CYAN },
      line: { color: CYAN, width: 0 },
    });

    // Title
    slide.addText(item.title, {
      x: 1,
      y,
      w: 11.7,
      h: 0.4,
      fontSize: 14,
      color: WHITE,
      fontFace: FONT,
      bold: true,
    });

    // Body
    slide.addText(item.text, {
      x: 1,
      y: y + 0.4,
      w: 11.7,
      h: itemH - 0.4,
      fontSize: 10.5,
      color: WHITE_MUTED,
      fontFace: FONT,
      valign: "top",
    });
  });

  addFooter(slide, slideNum, total, data.siteName);
}

function addServicesSlide(
  pptx: Pptx,
  data: Extract<PresentationSlide, { kind: "services" }>,
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  slide.addText("INFINITY SOLUTIONS", {
    x: 0.5,
    y: 0.5,
    w: 12.3,
    h: 0.35,
    fontSize: 10,
    color: CYAN,
    fontFace: FONT,
    bold: true,
    charSpacing: 8,
  });

  slide.addText("რას მოიცავს SEO სერვისი?", {
    x: 0.5,
    y: 0.9,
    w: 12.3,
    h: 0.7,
    fontSize: 32,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  const blockW = 6;
  const blockH = 2.6;
  const gapX = 0.333;
  const gapY = 0.25;
  const startX = 0.5;
  const startY = 1.85;

  data.blocks.forEach((block, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (blockW + gapX);
    const y = startY + row * (blockH + gapY);
    addServiceBlock(slide, block, i, x, y, blockW, blockH);
  });

  addFooter(slide, slideNum, total, data.siteName);
}

function addServiceBlock(
  slide: Slide,
  block: ServiceBlock,
  index: number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: WHITE, transparency: 95 },
    line: { color: WHITE, width: 0.5, transparency: 90 },
    rectRadius: 0.05,
  });

  // Number
  slide.addText(String(index + 1).padStart(2, "0"), {
    x: x + 0.2,
    y: y + 0.15,
    w: 0.6,
    h: 0.4,
    fontSize: 16,
    color: WHITE_FAINT,
    fontFace: FONT,
    bold: true,
  });

  // Title
  slide.addText(block.title, {
    x: x + 0.75,
    y: y + 0.2,
    w: w - 0.95,
    h: 0.35,
    fontSize: 12,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  // Divider
  slide.addShape("line", {
    x: x + 0.2,
    y: y + 0.65,
    w: w - 0.4,
    h: 0,
    line: { color: WHITE, width: 0.5, transparency: 85 },
  });

  // Items
  const runs: TextRun[] = [];
  block.items.forEach((item, i) => {
    runs.push({ text: "✓ ", options: { color: CYAN, bold: true } });
    runs.push({
      text: item,
      options: {
        color: WHITE_BRIGHT,
        breakLine: i < block.items.length - 1,
      },
    });
  });

  slide.addText(runs, {
    x: x + 0.2,
    y: y + 0.78,
    w: w - 0.4,
    h: h - 0.95,
    fontSize: 8.5,
    fontFace: FONT,
    paraSpaceAfter: 1.5,
    valign: "top",
  });
}

export async function exportToPptx(
  slides: PresentationSlide[],
  fileName?: string
): Promise<void> {
  const pptxModule = await import("pptxgenjs");
  const PptxGen = pptxModule.default;
  const pptx = new PptxGen();
  pptx.layout = "LAYOUT_WIDE";

  slides.forEach((data, i) => {
    addSlide(pptx, data, i + 1, slides.length);
  });

  const safeFileName =
    fileName ?? `seo-report-${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: safeFileName });
}

function addProblemPagesSlide(
  pptx: Pptx,
  data: Extract<PresentationSlide, { kind: "problem-pages" }>,
  slideNum: number,
  total: number
) {
  const slide = navySlide(pptx);

  // Section label
  slide.addText("მთლიანი საიტი", {
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

  // Title
  slide.addText("პრობლემური გვერდები", {
    x: 0.5,
    y: 0.95,
    w: 8,
    h: 0.8,
    fontSize: 36,
    color: WHITE,
    fontFace: FONT,
    bold: true,
  });

  // Average score on the right
  const avgColor =
    data.averageScore >= 80 ? CYAN : data.averageScore >= 50 ? AMBER : RED_TEXT;

  slide.addText("საშუალო ქულა", {
    x: 9,
    y: 0.5,
    w: 3.8,
    h: 0.4,
    fontSize: 10,
    color: WHITE_DIM,
    fontFace: FONT,
    align: "right",
    charSpacing: 4,
  });
  slide.addText(String(data.averageScore), {
    x: 9,
    y: 0.85,
    w: 3.8,
    h: 1.2,
    fontSize: 60,
    color: avgColor,
    fontFace: FONT,
    align: "right",
    bold: true,
  });

  // Table header
  const tableY = 2.55;
  slide.addText("#", {
    x: 0.5,
    y: tableY,
    w: 0.4,
    h: 0.3,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT_MONO,
    charSpacing: 4,
  });
  slide.addText("გვერდი", {
    x: 0.95,
    y: tableY,
    w: 6.5,
    h: 0.3,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT,
    bold: true,
    charSpacing: 4,
  });
  slide.addText("ხარვეზები", {
    x: 7.5,
    y: tableY,
    w: 1.5,
    h: 0.3,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT,
    bold: true,
    align: "right",
    charSpacing: 4,
  });
  slide.addText("მთავარი ხარვეზი", {
    x: 9.1,
    y: tableY,
    w: 2.5,
    h: 0.3,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT,
    bold: true,
    charSpacing: 4,
  });
  slide.addText("ქულა", {
    x: 11.7,
    y: tableY,
    w: 1.1,
    h: 0.3,
    fontSize: 9,
    color: WHITE_DIM,
    fontFace: FONT,
    bold: true,
    align: "right",
    charSpacing: 4,
  });

  slide.addShape("line", {
    x: 0.5,
    y: tableY + 0.3,
    w: 12.3,
    h: 0,
    line: { color: WHITE_FAINT, width: 0.5 },
  });

  const rows = data.pages.slice(0, 12);
  const rowH = 0.42;
  const startY = tableY + 0.45;

  rows.forEach((row, i) => {
    const rowY = startY + i * rowH;
    const cleanUrl = row.url.replace(/^https?:\/\//, "");

    slide.addText(String(i + 1), {
      x: 0.5,
      y: rowY,
      w: 0.4,
      h: 0.35,
      fontSize: 10,
      color: WHITE_FAINT,
      fontFace: FONT_MONO,
    });

    const urlRuns: TextRun[] = [
      {
        text: truncate(cleanUrl, 60),
        options: { color: WHITE_BRIGHT, fontFace: FONT, fontSize: 11 },
      },
    ];
    if (row.isHome) {
      urlRuns.push({
        text: "  მთავარი",
        options: {
          color: CYAN,
          fontFace: FONT_MONO,
          fontSize: 8,
          charSpacing: 4,
        },
      });
    }
    slide.addText(urlRuns, { x: 0.95, y: rowY, w: 6.5, h: 0.35 });

    if (!row.error) {
      slide.addText(
        [
          {
            text: `${row.warnings}w`,
            options: { color: AMBER, fontFace: FONT_MONO, fontSize: 11 },
          },
          {
            text: " · ",
            options: { color: WHITE_FAINT, fontFace: FONT_MONO, fontSize: 11 },
          },
          {
            text: `${row.failed}f`,
            options: { color: RED_TEXT, fontFace: FONT_MONO, fontSize: 11 },
          },
        ],
        { x: 7.5, y: rowY, w: 1.5, h: 0.35, align: "right" }
      );
    } else {
      slide.addText("—", {
        x: 7.5,
        y: rowY,
        w: 1.5,
        h: 0.35,
        align: "right",
        color: WHITE_FAINT,
        fontSize: 11,
        fontFace: FONT_MONO,
      });
    }

    slide.addText(truncate(row.topIssue, 28), {
      x: 9.1,
      y: rowY,
      w: 2.5,
      h: 0.35,
      color: WHITE_MUTED,
      fontFace: FONT,
      fontSize: 10,
    });

    const scoreColor = row.error
      ? WHITE_FAINT
      : row.score >= 80
      ? CYAN
      : row.score >= 50
      ? AMBER
      : RED_TEXT;
    slide.addText(row.error ? "—" : String(row.score), {
      x: 11.7,
      y: rowY,
      w: 1.1,
      h: 0.35,
      align: "right",
      color: scoreColor,
      fontFace: FONT_MONO,
      fontSize: 16,
      bold: true,
    });
  });

  if (data.pages.length > 12) {
    slide.addText(`+ ${data.pages.length - 12} დამატებითი გვერდი`, {
      x: 0.5,
      y: startY + 12 * rowH + 0.1,
      w: 12.3,
      h: 0.3,
      fontSize: 9,
      color: WHITE_FAINT,
      fontFace: FONT,
      italic: true,
    });
  }

  addFooter(slide, slideNum, total, data.siteName);
}

function addSlide(
  pptx: Pptx,
  data: PresentationSlide,
  slideNum: number,
  total: number
) {
  switch (data.kind) {
    case "cover":
      return addCoverSlide(pptx, data);
    case "summary":
      return addSummarySlide(pptx, data, slideNum, total);
    case "problem-pages":
      return addProblemPagesSlide(pptx, data, slideNum, total);
    case "problem":
      return addProblemSlide(pptx, data, slideNum, total);
    case "recommendations":
      return addRecommendationsSlide(pptx, data, slideNum, total);
    case "services":
      return addServicesSlide(pptx, data, slideNum, total);
  }
}
