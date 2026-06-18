// PPTX export for the /proposal page.
// Builds a 9-slide deck matching the on-screen proposal, with the user's
// chosen primary/accent colours and brand name. Georgian text uses Sylfaen
// (Windows-native; PowerPoint falls back to a Unicode font elsewhere).

import type pptxgen from "pptxgenjs";

const FONT = "Sylfaen";
const FONT_MONO = "Consolas";
const INK_DARK = "0F172A";
const ZINC_700 = "3F3F46";
const ZINC_500 = "71717A";
const ZINC_200 = "E4E4E7";
const ZINC_50 = "FAFAFA";

export type ProposalPptxOpts = {
  brand: string;
  hostname: string;
  primary: string;
  accent: string;
};

function hex(c: string): string {
  return c.replace(/^#/, "").toUpperCase();
}

function isLightHex(h: string): boolean {
  const c = hex(h);
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150;
}

export async function exportProposalPptx(opts: ProposalPptxOpts) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE16_9", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE16_9";

  const primary = hex(opts.primary);
  const accent = hex(opts.accent);
  const primaryLight = isLightHex(primary);
  const accentLight = isLightHex(accent);
  // Text colour on dark primary slides
  const onPrimary = primaryLight ? "0A0A0A" : "FFFFFF";
  const onPrimaryMuted = primaryLight ? "404040" : "D4D4D8";
  // Heading colour on white-bg slides (fall back if primary too pale)
  const ink = primaryLight ? INK_DARK : primary;
  const accentInk = accentLight ? INK_DARK : accent;

  const colours = { primary, accent, onPrimary, onPrimaryMuted, ink, accentInk };

  buildCoverSlide(pptx, opts, colours);
  buildPromiseSlide(pptx, opts, colours);
  buildFrontsSlide(pptx, opts, colours);
  buildKeywordsSlide(pptx, opts, colours);
  buildEasyWinsSlide(pptx, opts, colours);
  buildServiceSlide(pptx, opts, colours);
  buildRoadmapSlide(pptx, opts, colours);
  buildPricingSlide(pptx, opts, colours);
  buildClosingSlide(pptx, opts, colours);

  const safeDomain = (opts.hostname || "client").replace(/[^a-z0-9.-]/gi, "_");
  const date = new Date().toISOString().slice(0, 10);
  await pptx.writeFile({
    fileName: `proposal-${safeDomain}-${date}.pptx`,
  });
}

type Colours = {
  primary: string;
  accent: string;
  onPrimary: string;
  onPrimaryMuted: string;
  ink: string;
  accentInk: string;
};

// ─── shared chrome ─────────────────────────────────────────────────────

function lightFrame(
  slide: pptxgen.Slide,
  opts: ProposalPptxOpts,
  c: Colours,
  pageNum: number
) {
  slide.background = { color: "FFFFFF" };

  // Brand mark top-right
  slide.addText(opts.brand, {
    x: 11.0,
    y: 0.35,
    w: 2.0,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT_MONO,
    color: c.ink,
    bold: true,
    charSpacing: 4,
    align: "right",
  });

  // Footer brand | domain | page
  slide.addText(opts.brand, {
    x: 0.5,
    y: 7.15,
    w: 3,
    h: 0.25,
    fontSize: 8,
    fontFace: FONT_MONO,
    color: c.ink,
    charSpacing: 3,
  });
  slide.addText(opts.hostname, {
    x: 5,
    y: 7.15,
    w: 3.333,
    h: 0.25,
    fontSize: 8,
    fontFace: FONT_MONO,
    color: "777777",
    align: "center",
  });
  slide.addText(`Page ${pageNum} / 9`, {
    x: 10.5,
    y: 7.15,
    w: 2.5,
    h: 0.25,
    fontSize: 8,
    fontFace: FONT_MONO,
    color: "777777",
    align: "right",
  });
}

function darkFrame(slide: pptxgen.Slide, opts: ProposalPptxOpts, c: Colours) {
  slide.background = { color: c.primary };

  // Brand mark top-right
  slide.addText(opts.brand, {
    x: 11.0,
    y: 0.35,
    w: 2.0,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT_MONO,
    color: c.onPrimary,
    bold: true,
    charSpacing: 4,
    align: "right",
  });
}

function eyebrow(slide: pptxgen.Slide, text: string, color: string) {
  slide.addText(text, {
    x: 0.5,
    y: 0.85,
    w: 8,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT_MONO,
    color,
    charSpacing: 6,
    bold: true,
  });
}

function accentRule(
  slide: pptxgen.Slide,
  c: Colours,
  y: number,
  x = 0.5,
  w = 0.6
) {
  slide.addShape("rect", {
    x,
    y,
    w,
    h: 0.05,
    fill: { color: c.accent },
    line: { type: "none" },
  });
}

// ─── slides ────────────────────────────────────────────────────────────

function buildCoverSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  darkFrame(slide, opts, c);

  // Decorative squares bottom-left
  slide.addShape("rect", {
    x: 0.5, y: 4.5, w: 1.5, h: 1.5,
    fill: { type: "solid", color: c.primary },
    line: { color: "FFFFFF", width: 1, transparency: 75 },
  });
  slide.addShape("rect", {
    x: 1.0, y: 5.0, w: 1.5, h: 1.5,
    fill: { type: "solid", color: c.primary },
    line: { color: c.accent, width: 2 },
  });

  slide.addText("SEO წინადადება · საკვანძო სიტყვების სტრატეგია", {
    x: 5.5, y: 2.5, w: 7.3, h: 0.35,
    fontSize: 11, fontFace: FONT_MONO,
    color: c.accent, charSpacing: 6, bold: true,
  });

  slide.addText(opts.hostname, {
    x: 5.5, y: 2.95, w: 7.3, h: 2.0,
    fontSize: 54, fontFace: FONT, bold: true,
    color: c.onPrimary,
  });

  slide.addText("რას გპირდებით - 6 თვის გეგმა და მიზნები", {
    x: 5.5, y: 4.9, w: 7.3, h: 0.5,
    fontSize: 16, fontFace: FONT,
    color: c.onPrimaryMuted,
  });

  accentRule(slide, c, 5.45, 5.5, 0.8);

  slide.addText(
    [
      { text: "presented by  ", options: { color: c.onPrimaryMuted } },
      { text: "INFINITY SOLUTIONS", options: { color: c.onPrimary, bold: true } },
    ],
    {
      x: 0.5, y: 6.9, w: 12.333, h: 0.3,
      fontSize: 10, fontFace: FONT_MONO,
      charSpacing: 4, align: "center",
    }
  );
}

function buildPromiseSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  darkFrame(slide, opts, c);

  eyebrow(slide, "ჩვენი დაპირება", c.accent);

  slide.addText("6 თვეში - გაზომვადი შედეგი", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 36, fontFace: FONT, bold: true,
    color: c.onPrimary,
  });
  accentRule(slide, c, 2.15);

  slide.addText(
    `ჩვენი მიდგომა ფოკუსირებულია იქ, სადაც შედეგი ყველაზე სწრაფად მოდის - ვიწრო ქივორდები, მაღალი განზრახვის ქივორდები, სადაც ${opts.hostname}-ს რეალური შანსი აქვს პირველ ადგილებზე ასვლის.`,
    {
      x: 0.5, y: 2.4, w: 11, h: 1.0,
      fontSize: 14, fontFace: FONT,
      color: c.onPrimaryMuted,
    }
  );

  const stats = [
    { num: "20+", label: "ქივორდი #1-3-ზე", hint: "სამიზნე პოზიციები 6 თვის ბოლოს" },
    { num: "1500+", label: "სიტყვა / თვეში", hint: "ახალი ოპტიმიზებული კონტენტი" },
    { num: "თვიური", label: "გამჭვირვალე რეპორტი", hint: "Search Console + Analytics" },
  ];
  stats.forEach((s, i) => {
    const x = 0.5 + i * 4.2;
    // Left accent bar
    slide.addShape("rect", {
      x, y: 4.0, w: 0.06, h: 1.7,
      fill: { color: c.accent }, line: { type: "none" },
    });
    slide.addText(s.num, {
      x: x + 0.2, y: 3.9, w: 3.9, h: 0.85,
      fontSize: 38, fontFace: FONT, bold: true,
      color: c.onPrimary,
    });
    slide.addText(s.label, {
      x: x + 0.2, y: 4.85, w: 3.9, h: 0.35,
      fontSize: 12, fontFace: FONT, bold: true,
      color: c.accent,
    });
    slide.addText(s.hint, {
      x: x + 0.2, y: 5.2, w: 3.9, h: 0.5,
      fontSize: 10, fontFace: FONT,
      color: c.onPrimaryMuted,
    });
  });

  slide.addText(
    "ქვემოთ - ზუსტად სად და როგორ უზრუნველვყოფთ ამ შედეგებს.",
    {
      x: 0.5, y: 6.4, w: 11, h: 0.3,
      fontSize: 11, fontFace: FONT, italic: true,
      color: c.onPrimaryMuted,
    }
  );
}

function buildFrontsSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  lightFrame(slide, opts, c, 3);

  eyebrow(slide, "შესაძლებლობა", c.accentInk);

  slide.addText("სად უზრუნველვყოფთ შედეგს - სამი ფრონტი", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 32, fontFace: FONT, bold: true,
    color: c.ink,
  });
  accentRule(slide, c, 2.15);

  const cards = [
    { num: "3", color: "16A34A", title: "დაცვა და განმტკიცება", hint: "უკვე #1-ზე მყოფი სეგმენტი - ვინარჩუნებთ და ვამაგრებთ" },
    { num: "6+", color: c.accent, textColor: c.accentInk, title: "სწრაფი ზრდა", hint: "ვიწრო ქივორდები, სადაც #1-მდე მცირე ნაბიჯია" },
    { num: "2", color: "DC2626", title: "სტრატეგიული გაფართოება", hint: "ბრენდის ძირითადი პროდუქტების ახალ პოზიციებზე" },
  ];
  cards.forEach((card, i) => {
    const x = 0.5 + i * 4.2;
    slide.addShape("rect", {
      x, y: 2.7, w: 4.0, h: 2.0,
      fill: { color: "FAFAFA" }, line: { type: "none" },
    });
    slide.addShape("rect", {
      x, y: 2.7, w: 0.06, h: 2.0,
      fill: { color: card.color }, line: { type: "none" },
    });
    slide.addText(card.num, {
      x: x + 0.2, y: 2.75, w: 3.7, h: 0.8,
      fontSize: 36, fontFace: FONT, bold: true,
      color: (card as { textColor?: string }).textColor ?? card.color,
    });
    slide.addText(card.title, {
      x: x + 0.2, y: 3.55, w: 3.7, h: 0.35,
      fontSize: 13, fontFace: FONT, bold: true, color: "18181B",
    });
    slide.addText(card.hint, {
      x: x + 0.2, y: 3.95, w: 3.7, h: 0.7,
      fontSize: 10, fontFace: FONT, color: "52525B",
    });
  });

  // Focus box
  slide.addShape("rect", {
    x: 0.5, y: 5.2, w: 12.333, h: 1.5,
    fill: { color: c.primary }, line: { type: "none" },
  });
  slide.addShape("rect", {
    x: 0.5, y: 5.2, w: 0.08, h: 1.5,
    fill: { color: c.accent }, line: { type: "none" },
  });
  slide.addText("ჩვენი ფოკუსი", {
    x: 0.75, y: 5.3, w: 11, h: 0.3,
    fontSize: 10, fontFace: FONT_MONO,
    color: c.accent, charSpacing: 5, bold: true,
  });
  slide.addText(
    "მთელ ძალისხმევას ვამახვილებთ easy-win ჯგუფზე - დომინო ეფექტი: ერთი ვიწრო ქივორდი მეორეს ეხმარება, ვამაგრებთ #1-ის პოზიციებს და თანდათან ვაფართოვებთ ხილვადობას ბრენდის ძირითად პროდუქტებზე.",
    {
      x: 0.75, y: 5.65, w: 11.8, h: 1.0,
      fontSize: 12, fontFace: FONT,
      color: c.onPrimary,
    }
  );
}

function buildKeywordsSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  lightFrame(slide, opts, c, 4);

  eyebrow(slide, "სამიზნე ქივორდები", c.accentInk);

  slide.addText("რას გამოვაჩენთ პირველ გვერდზე", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 28, fontFace: FONT, bold: true,
    color: c.ink,
  });
  accentRule(slide, c, 2.05);

  const headerOpts = {
    fill: { color: c.primary },
    color: c.onPrimary,
    bold: true,
    fontSize: 11,
    fontFace: FONT,
  };
  const rows: pptxgen.TableRow[] = [
    [
      { text: "ქივორდი", options: headerOpts },
      { text: "სამიზნე", options: headerOpts },
      { text: "ჩვენი ქმედება", options: headerOpts },
    ],
    ...[
      { kw: "ბრენდის სახელი (navigational)", target: "#1", action: "ვინარჩუნებთ პოზიციას", color: "16A34A" },
      { kw: "მთავარი პროდუქტი / სერვისი", target: "#1", action: "ვინარჩუნებთ + ვამყარებთ", color: "16A34A" },
      { kw: "ლოკაცია + სერვისი (გეო-SEO)", target: "#1", action: "ვინარჩუნებთ + ვამყარებთ", color: "16A34A" },
      { kw: "მთავარი კატეგორია (transactional)", target: "→ #1", action: "ერთი ნაბიჯი - სამიზნე #1", color: "D97706" },
      { kw: "კონკურენტული transactional", target: "→ #2-3", action: "კატეგორიას ვაძლიერებთ", color: "D97706" },
      { kw: "Long-tail variations (10+)", target: "→ #1-3", action: "ცარიელი გვერდი მზადაა", color: "D97706" },
      { kw: "Informational queries", target: "→ #1-3", action: "სუსტი კონკურენცია", color: "D97706" },
      { kw: "ახალი კატეგორია / sub-product", target: "→ #1-3", action: "ვიწრო, მაღალი განზრახვა", color: "D97706" },
      { kw: "მომდევნო ეტაპის keyword", target: "→ 1-ლი გვერდი", action: "ახალი კონტენტი + ბმული", color: "DC2626" },
      { kw: "შემდგომი long-tail ფრაზები", target: "→ 1-ლი გვერდი", action: "long-tail სტრატეგია", color: "DC2626" },
    ].map((r): pptxgen.TableRow => [
      { text: r.kw, options: { color: "27272A", fontSize: 10, fontFace: FONT } },
      { text: r.target, options: { color: r.color, bold: true, fontSize: 10, fontFace: FONT } },
      { text: r.action, options: { color: "52525B", fontSize: 10, fontFace: FONT } },
    ]),
  ];

  slide.addTable(rows, {
    x: 0.5,
    y: 2.5,
    w: 12.333,
    colW: [7.0, 1.7, 3.633],
    border: { type: "solid", pt: 0.5, color: ZINC_200 },
    rowH: 0.35,
  });
}

function buildEasyWinsSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  lightFrame(slide, opts, c, 5);

  eyebrow(slide, "პრიორიტეტი · სწრაფი შედეგი", c.accentInk);

  slide.addText("Easy Wins - აქ უზრუნველვყოფთ #1-ს ჯერ", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 28, fontFace: FONT, bold: true,
    color: c.ink,
  });
  accentRule(slide, c, 2.05);

  const cards = [
    { kw: "მთავარი კატეგორია (transactional)", target: "სამიზნე #1", note: "title/H1 ოპტიმიზაცია + შიდა ბმულების გადანაწილება. ერთი ნაბიჯია #1-მდე." },
    { kw: "ლოკაცია-სპეციფიკური ფრაზა", target: "სამიზნე #2-3", note: "კატეგორიის გვერდს ვაძლიერებთ კონტენტით და მეტი მონაცემით. #1 - მისაღწევია." },
  ];
  cards.forEach((card, i) => {
    const x = 0.5 + i * 6.3;
    slide.addShape("rect", {
      x, y: 2.5, w: 6.0, h: 1.7,
      fill: { color: "FFFFFF" },
      line: { color: c.accent, width: 2 },
    });
    slide.addText(card.kw, {
      x: x + 0.2, y: 2.65, w: 4.2, h: 0.4,
      fontSize: 12, fontFace: FONT, bold: true, color: "18181B",
    });
    slide.addText(card.target, {
      x: x + 4.5, y: 2.65, w: 1.4, h: 0.4,
      fontSize: 11, fontFace: FONT, bold: true,
      color: c.accentInk, align: "right",
    });
    slide.addText(card.note, {
      x: x + 0.2, y: 3.1, w: 5.6, h: 1.0,
      fontSize: 10, fontFace: FONT, color: "52525B",
    });
  });

  slide.addText("+ ვიწრო ქივორდები, სადაც კონკურენცია სუსტია და გვერდები უკვე გვაქვს", {
    x: 0.5, y: 4.5, w: 12.333, h: 0.3,
    fontSize: 11, fontFace: FONT, bold: true, color: "3F3F46",
  });

  const chips = [
    "მთავარი sub-category", "Long-tail variation 1", "თავისუფალი ნიშა",
    "ბრენდი + სერვისი", "კონკურენტული informational", "სეზონური მოდიფიკაცია",
  ];
  chips.forEach((chip, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 0.5 + col * 4.2;
    const y = 4.95 + row * 0.55;
    slide.addShape("rect", {
      x, y, w: 4.0, h: 0.45,
      fill: { color: "FFFFFF" },
      line: { color: c.accent, width: 1 },
    });
    slide.addText(chip, {
      x: x + 0.15, y, w: 3.7, h: 0.45,
      fontSize: 10, fontFace: FONT, color: "3F3F46",
      valign: "middle",
    });
  });

  slide.addText("სწორი on-page-ით 6 თვეში #1-3 პოზიციები სრულად მიღწევადია.", {
    x: 0.5, y: 6.4, w: 12.333, h: 0.3,
    fontSize: 10, fontFace: FONT, italic: true, color: "71717A",
  });
}

function buildServiceSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  lightFrame(slide, opts, c, 6);

  eyebrow(slide, "სერვისის შემადგენლობა", c.accentInk);

  slide.addText("რას მოიცავს ჩვენი SEO სერვისი", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 28, fontFace: FONT, bold: true,
    color: c.ink,
  });
  accentRule(slide, c, 2.05);

  const cols = [
    { num: "01", title: "ტექნიკური ოპტიმიზაცია", items: ["სრული ტექნიკური აუდიტი", "Core Web Vitals - სიჩქარე", "Schema markup დანერგვა", "llms.txt AI ძიებისთვის"] },
    { num: "02", title: "On-Page", items: ["საძიებო სიტყვების კვლევა", "Keyword mapping ყველა გვერდს", "1500+ სიტყვა / თვეში კონტენტი", "Title & Meta ოპტიმიზაცია"] },
    { num: "03", title: "Off-Page", items: ["ბექლინკ პროფილის ანალიზი", "თვეში 3+ ბექლინკი", "PR სტატიები (შეთანხმებით)", "Domain Authority მონიტორინგი"] },
    { num: "04", title: "რეპორტინგი", items: ["თვიური სამუშაოს ანგარიში", "პოზიციების დინამიკა", "Clicks & Impressions", "Search Console + Analytics"] },
  ];
  cols.forEach((col, i) => {
    const x = 0.5 + i * 3.15;
    slide.addShape("rect", {
      x, y: 2.5, w: 3.0, h: 4.0,
      fill: { color: "FFFFFF" },
      line: { color: c.accent, width: 1 },
    });
    slide.addText(col.num, {
      x: x + 0.2, y: 2.6, w: 2.8, h: 0.5,
      fontSize: 22, fontFace: FONT, bold: true, color: c.accentInk,
    });
    slide.addText(col.title, {
      x: x + 0.2, y: 3.1, w: 2.8, h: 0.4,
      fontSize: 13, fontFace: FONT, bold: true, color: c.ink,
    });
    slide.addText(col.items.map((it) => ({ text: it, options: { bullet: true } })), {
      x: x + 0.2, y: 3.6, w: 2.8, h: 2.8,
      fontSize: 10, fontFace: FONT, color: "3F3F46",
      paraSpaceAfter: 4,
    });
  });
}

function buildRoadmapSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  lightFrame(slide, opts, c, 7);

  eyebrow(slide, "სამოქმედო გეგმა", c.accentInk);

  slide.addText("6-თვიანი როადმეფი", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 28, fontFace: FONT, bold: true,
    color: c.ink,
  });
  accentRule(slide, c, 2.05);

  // Alternate primary / accent months for clean brand-aligned rhythm.
  const primaryMonth = { color: c.primary, headerText: c.onPrimary };
  const accentMonth = {
    color: c.accent,
    headerText: isLightHex(c.accent) ? "0A0A0A" : "FFFFFF",
  };
  const months = [
    { label: "თვე 1", tag: "საფუძველი", ...primaryMonth, items: ["ტექნიკური აუდიტი + ხარვეზების გასწორება", "გაზომვების პოზიციების დაცვა", "title/H1/ბმულების ოპტიმიზაცია"] },
    { label: "თვე 2", tag: "ბიჯი", ...accentMonth, items: ["კატეგორიის გვერდების კონტენტი", "6 ვიწრო ქივორდი - გვერდების ოპტიმიზაცია", "სიღრმისეული კონტენტის დანერგვა"] },
    { label: "თვე 3", tag: "ზრდა", ...primaryMonth, items: ["Easy wins - #1 დამაგრება", "ვიწრო ქივორდები - #1-3 ფიქსაცია", "Long-tail - 1-ელ გვერდზე შესვლა"] },
    { label: "თვე 4", tag: "გაფართოება", ...accentMonth, items: ["ახალი კატეგორიების კონტენტი", "Long-tail ქივორდების მასშტაბი", "In-depth სტატიების სერია"] },
    { label: "თვე 5", tag: "ავტორიტეტი", ...primaryMonth, items: ["Off-page - 5+ ხარისხიანი ბექლინკი", "PR სტატიები პროფილურ ჟურნალებში", "Brand mention-ების ზრდა"] },
    { label: "თვე 6", tag: "დომინაცია", ...accentMonth, items: ["#1 პოზიციების სრული ფიქსაცია", "მომდევნო ეტაპის ქივორდები", "6-თვიანი შედეგების კონსოლიდაცია"] },
  ];
  months.forEach((m, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 0.5 + col * 4.2;
    const y = 2.5 + row * 2.15;
    slide.addShape("rect", {
      x, y, w: 4.0, h: 0.7,
      fill: { color: m.color }, line: { type: "none" },
    });
    slide.addText(m.label, {
      x: x + 0.15, y: y + 0.05, w: 3.7, h: 0.25,
      fontSize: 8, fontFace: FONT_MONO, color: m.headerText,
      charSpacing: 3, transparency: 30,
    });
    slide.addText(m.tag, {
      x: x + 0.15, y: y + 0.28, w: 3.7, h: 0.4,
      fontSize: 14, fontFace: FONT, bold: true, color: m.headerText,
    });
    slide.addShape("rect", {
      x, y: y + 0.7, w: 4.0, h: 1.3,
      fill: { color: "FFFFFF" },
      line: { color: ZINC_200, width: 0.5 },
    });
    slide.addText(m.items.map((it) => ({
      text: it,
      options: { bullet: { code: "2022" } },
    })), {
      x: x + 0.2, y: y + 0.78, w: 3.7, h: 1.2,
      fontSize: 9, fontFace: FONT, color: ZINC_700,
      paraSpaceAfter: 2,
    });
  });
}

function buildPricingSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  lightFrame(slide, opts, c, 8);

  eyebrow(slide, "ჩვენი პაკეტები", c.accentInk);

  slide.addText("აირჩიე შენი პაკეტი", {
    x: 0.5, y: 1.2, w: 12.333, h: 0.9,
    fontSize: 28, fontFace: FONT, bold: true,
    color: c.ink,
  });
  accentRule(slide, c, 2.05);

  const tiers = [
    {
      name: "ბაზისური", price: "1000₾", tagline: "თვიური · დასაწყისად",
      items: ["პროდუქტების ოპტიმიზაცია", "რესპონსიული დიზაინი", "საიტის არქიტექტურა", "ბრენდის ცნობადობა", "საიტის რუკა (Sitemap)", "პროდუქტების სორტირება", "ლოკალური SEO", "ტექნიკური SEO"],
      featured: false,
    },
    {
      name: "სტანდარტული", price: "1200₾", tagline: "თვიური · საუკეთესო ღირებულება",
      items: ["პროდუქტების ოპტიმიზაცია", "რესპონსიული დიზაინი", "საიტის არქიტექტურა", "ბრენდის ცნობადობა", "საიტის რუკა (Sitemap)", "პროდუქტების სორტირება", "ბექლინკების მშენებლობა", "ლოკალური SEO", "ტექნიკური SEO", "ბლოგის წერა", "CTR-ის გაუმჯობესება"],
      featured: true,
    },
    {
      name: "პრემიუმი", price: "1500₾", tagline: "თვიური · სრული პაკეტი",
      items: ["პროდუქტების ოპტიმიზაცია", "რესპონსიული დიზაინი", "საიტის არქიტექტურა", "ბრენდის ცნობადობა", "საიტის რუკა (Sitemap)", "პროდუქტების სორტირება", "ბექლინკების მშენებლობა", "ლოკალური SEO", "ტექნიკური SEO", "ბლოგის წერა", "CTR-ის გაუმჯობესება", "მობილური ვერსია + გასწორება", "Page Speed ოპტიმიზაცია", "მეტა-ტეგები (Title/Description)", "სურათების ოპტიმიზაცია (alt + შეკუმშვა)"],
      featured: false,
    },
  ];
  tiers.forEach((t, i) => {
    const x = 0.5 + i * 4.2;
    const cardBg = t.featured ? c.primary : "FFFFFF";
    const labelColor = t.featured ? c.onPrimaryMuted : ZINC_500;
    const priceColor = t.featured ? c.accent : c.ink;
    const itemColor = t.featured ? c.onPrimaryMuted : ZINC_700;
    const checkColor = t.featured ? c.accent : c.ink;

    slide.addShape("rect", {
      x, y: 2.4, w: 4.0, h: 4.55,
      fill: { color: cardBg },
      line: { color: t.featured ? c.accent : ZINC_200, width: t.featured ? 2 : 1 },
    });

    if (t.featured) {
      slide.addShape("roundRect", {
        x: x + 2.4, y: 2.55, w: 1.5, h: 0.3,
        fill: { color: c.accent },
        line: { type: "none" },
        rectRadius: 0.15,
      });
      slide.addText("★ პოპულარული", {
        x: x + 2.4, y: 2.55, w: 1.5, h: 0.3,
        fontSize: 8, fontFace: FONT, bold: true,
        color: isLightHex(c.accent) ? "0A0A0A" : "FFFFFF",
        align: "center", valign: "middle",
      });
    }

    slide.addText(t.name, {
      x: x + 0.2, y: 2.55, w: 2.2, h: 0.3,
      fontSize: 10, fontFace: FONT_MONO, color: labelColor,
      charSpacing: 4, bold: true,
    });
    slide.addText(
      [
        { text: t.price, options: { fontSize: 24, bold: true, color: priceColor } },
        { text: " -დან", options: { fontSize: 12, color: labelColor } },
      ],
      { x: x + 0.2, y: 2.85, w: 3.6, h: 0.5, fontFace: FONT }
    );
    slide.addText(t.tagline, {
      x: x + 0.2, y: 3.4, w: 3.6, h: 0.25,
      fontSize: 9, fontFace: FONT, color: labelColor,
    });

    slide.addText(
      t.items.map((it) => ({
        text: it,
        options: { bullet: { code: "2713" }, color: itemColor },
      })),
      {
        x: x + 0.2, y: 3.8, w: 3.6, h: 3.1,
        fontSize: 9, fontFace: FONT,
        paraSpaceAfter: 1,
      }
    );
    void checkColor;
  });
}

function buildClosingSlide(
  pptx: pptxgen,
  opts: ProposalPptxOpts,
  c: Colours
) {
  const slide = pptx.addSlide();
  darkFrame(slide, opts, c);

  // Decorative squares left
  slide.addShape("rect", {
    x: 0.8, y: 2.5, w: 1.5, h: 1.5,
    fill: { color: c.primary },
    line: { color: "FFFFFF", width: 1, transparency: 80 },
  });
  slide.addShape("rect", {
    x: 1.4, y: 3.1, w: 1.5, h: 1.5,
    fill: { color: c.primary },
    line: { color: c.accent, width: 2 },
  });

  slide.addText("დავიწყოთ", {
    x: 5.5, y: 2.2, w: 7.3, h: 0.35,
    fontSize: 11, fontFace: FONT_MONO,
    color: c.accent, charSpacing: 6, bold: true,
  });

  slide.addText("მზად ვართ უზრუნველვყოთ\nთქვენი #1 პოზიციები.", {
    x: 5.5, y: 2.7, w: 7.3, h: 1.6,
    fontSize: 36, fontFace: FONT, bold: true,
    color: c.onPrimary,
  });

  slide.addText(
    "ფოკუსირებული 6-თვიანი გეგმა, გაზომვადი შედეგი და სრული გამჭვირვალობა ყოველთვიური რეპორტინგით. დავიწყოთ ვიწრო ქივორდებით, სადაც შედეგი ყველაზე სწრაფად მოდის.",
    {
      x: 5.5, y: 4.4, w: 7.3, h: 1.2,
      fontSize: 14, fontFace: FONT,
      color: c.onPrimaryMuted,
    }
  );

  accentRule(slide, c, 5.7, 5.5, 0.8);

  slide.addText("INFINITY SOLUTIONS", {
    x: 5.5, y: 5.85, w: 7.3, h: 0.35,
    fontSize: 14, fontFace: FONT_MONO, bold: true,
    color: c.onPrimary, charSpacing: 6,
  });
  slide.addText("info@infinity.ge · +995 575 75 75 77", {
    x: 5.5, y: 6.25, w: 7.3, h: 0.3,
    fontSize: 11, fontFace: FONT_MONO, color: c.onPrimaryMuted,
  });
}
