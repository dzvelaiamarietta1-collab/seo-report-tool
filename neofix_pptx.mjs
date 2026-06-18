// Generate a NeoFix audit PPTX from the data we collected.
// Uses pptxgenjs (CommonJS) via interop import.
import pptxgen from 'pptxgenjs';
import { existsSync } from 'fs';

const OUT = 'C:/Users/INFINITY/Downloads/neofix_audit.pptx';
const SCREEN_DIR = 'C:/Users/INFINITY/Downloads/neofix_audit_screens';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
pres.title = 'neofix.ge - SEO აუდიტი';
pres.author = 'INFINITY SOLUTIONS';
pres.company = 'INFINITY SOLUTIONS';

const INK = '0A2540';
const ACCENT = 'DC2626';
const MUTED = '6B7280';
const BG = 'F9FAFB';
const BAD = 'DC2626';
const WARN = 'D97706';
const GOOD = '16A34A';
const SERIF = 'Sylfaen'; // ships on Windows, renders Georgian well
const SANS = 'BPG Nino Mtavruli';
const SANS_FB = 'Sylfaen';

function addHeader(slide, caption) {
  slide.addText('INFINITY SOLUTIONS', {
    x: 0.5, y: 0.3, w: 4, h: 0.3,
    fontSize: 9, color: MUTED, fontFace: SANS_FB, bold: true, charSpacing: 2,
  });
  if (caption) {
    slide.addText(caption.toUpperCase(), {
      x: 8.83, y: 0.3, w: 4, h: 0.3,
      fontSize: 9, color: ACCENT, fontFace: SANS_FB, bold: true, charSpacing: 2,
      align: 'right',
    });
  }
}

function addFooter(slide, pageNum, total) {
  slide.addText(`${pageNum} / ${total}`, {
    x: 0.5, y: 7.0, w: 12.33, h: 0.3,
    fontSize: 9, color: MUTED, fontFace: SANS_FB, align: 'right',
  });
  slide.addText('neofix.ge SEO აუდიტი - 2026-06-17', {
    x: 0.5, y: 7.0, w: 12.33, h: 0.3,
    fontSize: 9, color: MUTED, fontFace: SANS_FB, align: 'left',
  });
}

// ─── slides ────────────────────────────────────────────────────────────
const slides = [];

// 1. Cover
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('SEO აუდიტი', {
    x: 0.5, y: 2.5, w: 12.33, h: 1.2,
    fontSize: 60, color: 'FFFFFF', fontFace: SERIF, bold: true,
  });
  s.addText('neofix.ge', {
    x: 0.5, y: 3.7, w: 12.33, h: 0.8,
    fontSize: 36, color: 'FFA071', fontFace: SERIF,
  });
  s.addText('მომზადებული: INFINITY SOLUTIONS · 2026-06-17', {
    x: 0.5, y: 5.8, w: 12.33, h: 0.4,
    fontSize: 14, color: 'D1D5DB', fontFace: SANS_FB,
  });
  slides.push(s);
}

// 2. Summary
{
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'შეჯამება');
  s.addText('ჩვენი მოსაზრება', {
    x: 0.5, y: 0.8, w: 12.33, h: 0.8,
    fontSize: 36, color: INK, fontFace: SERIF, bold: true,
  });
  s.addText(
    'neofix.ge - სანტექნიკური სერვისის საიტი თბილისში. ცოცხალი HTTP და DOM ანალიზის შედეგად ' +
    '18 გვერდი დასკანერდა - 11 ძირითადი + 7 ბლოგ პოსტი. გამოვლინდა 4 კრიტიკული, 6 მნიშვნელოვანი ' +
    'და 5 ტექნიკური ხარვეზი, რომელთა გასწორებაც გააუმჯობესებს რანჟირებას და მობილური ' +
    'ვერსიის სიჩქარეს.',
    {
      x: 0.5, y: 1.7, w: 7.5, h: 1.8,
      fontSize: 14, color: '374151', fontFace: SANS_FB, lineSpacingMultiple: 1.4,
    }
  );

  // Score cards
  const cards = [
    { label: 'Rank Math', value: '74/100', color: WARN },
    { label: 'სკანერდა', value: '18 გვერდი', color: INK },
    { label: 'კრიტიკული', value: '4 ხარვეზი', color: BAD },
    { label: 'მნიშვნელოვანი', value: '6 ხარვეზი', color: WARN },
  ];
  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 8.5 + col * 2.2;
    const y = 1.7 + row * 1.3;
    s.addShape('rect', { x, y, w: 2.0, h: 1.1, fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB' } });
    s.addText(c.value, { x, y: y + 0.1, w: 2.0, h: 0.5, fontSize: 22, color: c.color, fontFace: SERIF, bold: true, align: 'center' });
    s.addText(c.label, { x, y: y + 0.65, w: 2.0, h: 0.3, fontSize: 10, color: MUTED, fontFace: SANS_FB, align: 'center' });
  });

  // Key issues list
  s.addText('მთავარი მიგნებები:', {
    x: 0.5, y: 4.0, w: 7.5, h: 0.4,
    fontSize: 14, color: INK, fontFace: SANS_FB, bold: true,
  });
  const findings = [
    { sev: 'P0', text: 'მთავარ გვერდს H1 სათაური საერთოდ აკლია', color: BAD },
    { sev: 'P0', text: 'სლაგების transliteration ქაოსი (tsqhlis / cklis / wylis)', color: BAD },
    { sev: 'P0', text: 'OG image აკლია FAQ, ჩვენ შესახებ, კონტაქტი გვერდებს', color: BAD },
    { sev: 'P0', text: 'Mobile preloader splash აზიანებს Core Web Vitals LCP-ს', color: BAD },
    { sev: 'P1', text: 'ბლოგის Title-ები 75-103 სიმბ (Google 60-ზე ჭრის)', color: WARN },
    { sev: 'P1', text: '"ნეოფოქსი" typo homepage H2-ში (უნდა იყოს "ნეოფიქსი")', color: WARN },
  ];
  findings.forEach((f, i) => {
    const y = 4.5 + i * 0.35;
    s.addShape('rect', { x: 0.5, y, w: 0.5, h: 0.25, fill: { color: f.color } });
    s.addText(f.sev, { x: 0.5, y, w: 0.5, h: 0.25, fontSize: 9, color: 'FFFFFF', fontFace: SANS_FB, bold: true, align: 'center' });
    s.addText(f.text, { x: 1.1, y: y - 0.02, w: 11.5, h: 0.3, fontSize: 12, color: '374151', fontFace: SANS_FB });
  });
  slides.push(s);
}

// 3. Sources
{
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'წყაროები');
  s.addText('ანალიზის წყაროები', {
    x: 0.5, y: 0.8, w: 12.33, h: 0.8,
    fontSize: 36, color: INK, fontFace: SERIF, bold: true,
  });
  s.addText(
    'ეს აუდიტი დაფუძნებულია 4 დამოუკიდებელ წყაროზე. თითო წყარო ცალკეული მხრიდან ' +
    'ამოწმებს საიტს, რათა მონაცემები ერთმანეთს ადასტურებდეს.',
    {
      x: 0.5, y: 1.6, w: 11, h: 0.7, fontSize: 13, color: '374151', fontFace: SANS_FB,
    }
  );
  const sources = [
    { title: 'ცოცხალი HTTP ანალიზი', detail: '18 გვერდის HTML parse, headers, redirect chain, robots.txt + 3 sitemap', color: '0EA5E9' },
    { title: 'Rank Math PDF', detail: '74/100 - 27 ტესტიდან 6 Failed + 1 Warning', color: '7C3AED' },
    { title: 'Playwright სკრინები', detail: '12 ცოცხალი სკრინი - Desktop 1440 + Mobile iPhone 13', color: '2563EB' },
    { title: 'DOM ანალიზი', detail: 'Title/H1/H2/canonical/OG/Schema/ALT სტრუქტურა ყოველ გვერდზე', color: '059669' },
  ];
  sources.forEach((src, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.2;
    const y = 2.6 + row * 1.7;
    s.addShape('rect', { x, y, w: 6.0, h: 1.5, fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB' } });
    s.addShape('rect', { x, y, w: 0.15, h: 1.5, fill: { color: src.color }, line: { color: src.color } });
    s.addText(src.title, { x: x + 0.3, y: y + 0.2, w: 5.5, h: 0.4, fontSize: 16, color: INK, fontFace: SANS_FB, bold: true });
    s.addText(src.detail, { x: x + 0.3, y: y + 0.7, w: 5.5, h: 0.7, fontSize: 11, color: MUTED, fontFace: SANS_FB });
  });
  slides.push(s);
}

// 4. Chapter divider - კრიტიკული
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('01', { x: 0.5, y: 0.5, w: 2, h: 1.2, fontSize: 96, color: 'FFA071', fontFace: SERIF, bold: true });
  s.addText('კრიტიკული ხარვეზები', { x: 0.5, y: 3.0, w: 12, h: 1.2, fontSize: 56, color: 'FFFFFF', fontFace: SERIF, bold: true });
  s.addText('4 ხარვეზი - დაუყოვნებლივი მოქმედება', { x: 0.5, y: 4.2, w: 12, h: 0.6, fontSize: 18, color: 'D1D5DB', fontFace: SANS_FB });
  slides.push(s);
}

// 5-8. P0 finding slides
const p0Findings = [
  {
    num: '1.1',
    title: 'მთავარ გვერდს H1 სათაური აკლია',
    problem: [
      'HTML-ში 0 ცალი <h1> ტეგი ფიქსირდება.',
      'Hero ბანერის "წყლის ჟონვის დიაგნოსტიკა" ვიზუალურად დიდია, მაგრამ <h2>-ით არის გაკეთებული.',
      'Rank Math-მაც დააფიქსირა - "No H1 tag was found".',
    ],
    solution: 'Elementor-ში hero section-ში "წყლის ჟონვის დიაგნოსტიკა" სათაური გადაიყვანო H2-დან H1-ზე. Heading widget -> HTML Tag -> H1.',
  },
  {
    num: '1.2',
    title: 'სლაგების transliteration არათანმიმდევრულია',
    problem: [
      '"წყლის ჟონვა" ერთსავე ფრაზაში 3 სხვადასხვა transliteration-ით:',
      'tsqhlis-zhonva, cklis-jonvis, wylis-jonvis.',
      '"კანალიზაცია"-ც ხან kanalizatsia, ხან kanalizacia.',
      'Google slug-ს რანჟირების სიგნალად იყენებს - არათანმიმდევრულობა ანადგურებს topical authority-ს.',
    ],
    solution: 'მიიღო ერთი სტანდარტი (გავრცელებული - Georgian National BGN/PCGN). ყველა slug გადასახედია, 301 გადამისამართება ძველი slug-იდან ახალზე.',
  },
  {
    num: '1.3',
    title: 'OpenGraph image აკლია 3 გვერდს',
    problem: [
      'FAQ, ჩვენ შესახებ, კონტაქტი გვერდებს <meta property="og:image"> საერთოდ არ აქვს.',
      'Facebook/Messenger/Telegram-ში ლინკის გაზიარებისას სურათი არ ჩანს - ეცემა CTR.',
      'სერვის გვერდები და ბლოგ პოსტები OK.',
    ],
    solution: 'Rank Math -> Titles & Meta -> Pages -> Default OpenGraph Image ჩაიდოს ბრენდის სტანდარტული სურათი. შემდეგ თითო გვერდს ცალკეც შეიძლება მიენიჭოს.',
  },
  {
    num: '1.4',
    title: 'Mobile preloader splash აზიანებს LCP-ს',
    problem: [
      'iPhone 13 viewport-ში მთავარი გვერდი ჯერ აჩვენებს შავ ფონს დიდი NeoFix ლოგოთი.',
      'რეალური კონტენტი ჩნდება 2-3 წამის შემდეგ.',
      'Core Web Vitals LCP (Largest Contentful Paint) ხელოვნურად ცუდდება.',
      'Mobile-first ინდექსირებაში Google ფაქტობრივად მხოლოდ Mobile ვერსიას ამოწმებს.',
    ],
    solution: 'Blocksy theme -> Customize -> Performance -> Pre-loader = Off. ან Elementor Pro -> Site Settings -> Preloader = None.',
  },
];

p0Findings.forEach((f) => {
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'კრიტიკული');
  s.addText(f.num, { x: 0.5, y: 0.7, w: 1.5, h: 0.5, fontSize: 14, color: BAD, fontFace: SANS_FB, bold: true });
  s.addText(f.title, { x: 0.5, y: 1.1, w: 12, h: 0.9, fontSize: 28, color: INK, fontFace: SERIF, bold: true });

  // Problem
  s.addShape('rect', { x: 0.5, y: 2.3, w: 6.0, h: 4.2, fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB' } });
  s.addText('პრობლემა', { x: 0.7, y: 2.4, w: 5.6, h: 0.4, fontSize: 12, color: BAD, fontFace: SANS_FB, bold: true, charSpacing: 2 });
  const problemBlock = f.problem.map((p) => ({ text: '• ' + p + '\n', options: {} }));
  s.addText(problemBlock, { x: 0.7, y: 2.9, w: 5.6, h: 3.4, fontSize: 12, color: '374151', fontFace: SANS_FB, lineSpacingMultiple: 1.3, valign: 'top' });

  // Solution
  s.addShape('rect', { x: 6.83, y: 2.3, w: 6.0, h: 4.2, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD' } });
  s.addText('გადაწყვეტა', { x: 7.03, y: 2.4, w: 5.6, h: 0.4, fontSize: 12, color: '0369A1', fontFace: SANS_FB, bold: true, charSpacing: 2 });
  s.addText(f.solution, { x: 7.03, y: 2.9, w: 5.6, h: 3.4, fontSize: 12, color: '0C4A6E', fontFace: SANS_FB, lineSpacingMultiple: 1.3, valign: 'top' });

  slides.push(s);
});

// 9. Chapter divider - მნიშვნელოვანი
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('02', { x: 0.5, y: 0.5, w: 2, h: 1.2, fontSize: 96, color: 'FFA071', fontFace: SERIF, bold: true });
  s.addText('მნიშვნელოვანი ხარვეზები', { x: 0.5, y: 3.0, w: 12, h: 1.2, fontSize: 56, color: 'FFFFFF', fontFace: SERIF, bold: true });
  s.addText('6 ხარვეზი - 2 კვირაში გასასწორებელი', { x: 0.5, y: 4.2, w: 12, h: 0.6, fontSize: 18, color: 'D1D5DB', fontFace: SANS_FB });
  slides.push(s);
}

// 10-15. P1 finding slides
const p1Findings = [
  {
    num: '2.1',
    title: 'გრძელი Title-ები ბლოგ პოსტებში',
    problem: [
      '7-დან 7-ვე ბლოგ პოსტს Title-ი 75-103 სიმბ.',
      'Google საძიებო შედეგებში 60 სიმბ ცემს ადგილს - დანარჩენი ჩამოეჭრება.',
      'მაგ. "კანალიზაციის გაწმენდა - როგორ ავიცილოთ თავიდან..." = 103 სიმბ.',
    ],
    solution: 'თითო Title-ი დაიხვეწოს Rank Math-ში 55-60 სიმბ-მდე. მთავარი საკვანძო ფრაზა თავში, NeoFix ბრენდი ბოლოს.',
  },
  {
    num: '2.2',
    title: 'მოკლე Title-ები ძირითად გვერდებზე',
    problem: [
      'Contact: "კონტაქტი - NeoFix" = 17 სიმბ.',
      'Blog: "ბლოგი - NeoFix" = 14 სიმბ.',
      'About: "ჩვენ შესახებ - NeoFix" = 21 სიმბ.',
      'ვერ იყენებს Google-ის შედეგებში არსებულ ხელმისაწვდომ ადგილს.',
    ],
    solution: 'მაგ. Contact-ისთვის: "სანტექნიკოსის გამოძახება თბილისში - კონტაქტი | NeoFix" (55 სიმბ).',
  },
  {
    num: '2.3',
    title: 'Contact გვერდი - Local SEO ფანდი',
    problem: [
      'მისამართი = "თბილისი, საქართველო" - კონკრეტული ქუჩა და ნომერი არ უწერია.',
      'Local SEO რანჟირებაში მისამართის სიზუსტე ერთ-ერთი მთავარი სიგნალია.',
      'ფოსტა infoneofix@gmail.com - Gmail-ი ბრენდის ნდობას აზიანებს.',
    ],
    solution: 'კონკრეტული ქუჩა + ნომერი დაემატოს. Schema LocalBusiness-ში streetAddress, postalCode, geo. ფოსტა გადავიდეს info@neofix.ge-ზე.',
  },
  {
    num: '2.4',
    title: 'სურათების ცარიელი ALT-ები',
    problem: [
      'ყველა გვერდზე 3 სურათი ცარიელი ALT-ით (header/footer global სურათები).',
      'ბლოგ პოსტებში დამატებითი 4-5 ცარიელი ALT.',
      'ALT ეხმარება Google-ს გაიგოს რა ჩანს სურათზე და მოაქვს ტრაფიკი სურათების ძიებიდან.',
    ],
    solution: 'WP Admin -> Media -> თითო სურათს Alt Text მიენიჭოს (5-10 სიტყვა, აღწერითი).',
  },
  {
    num: '2.5',
    title: '"ნეოფოქსი" typo homepage-ის H2-ში',
    problem: [
      'Homepage-ში H2-ად წერია: "რა ღირს ნეოფოქსის მომსახურება?"',
      'სხვა ადგილებში სწორად: "ნეოფიქსი".',
      'ბრენდის სახელის შეცდომა ნდობას აზიანებს.',
    ],
    solution: 'WP Admin -> Pages -> Home -> Edit -> H2 ჩასწორება "ნეოფიქსის"-ად.',
  },
  {
    num: '2.6',
    title: 'En-dash ბლოგ Title-ებში',
    problem: [
      'Title-ებში გვხვდება – (en-dash).',
      'მაგ. "კანალიზაციის გაწმენდა – როგორ ავიცილოთ..."',
      'ქართული პუნქტუაცია ცნობს მხოლოდ ჩვეულებრივ დეფისს - .',
    ],
    solution: 'Rank Math-ში თითო Title გადასახედია; – ჩაანაცვლოს ჩვეულებრივი დეფისით - .',
  },
];

p1Findings.forEach((f) => {
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'მნიშვნელოვანი');
  s.addText(f.num, { x: 0.5, y: 0.7, w: 1.5, h: 0.5, fontSize: 14, color: WARN, fontFace: SANS_FB, bold: true });
  s.addText(f.title, { x: 0.5, y: 1.1, w: 12, h: 0.9, fontSize: 28, color: INK, fontFace: SERIF, bold: true });

  s.addShape('rect', { x: 0.5, y: 2.3, w: 6.0, h: 4.2, fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB' } });
  s.addText('პრობლემა', { x: 0.7, y: 2.4, w: 5.6, h: 0.4, fontSize: 12, color: WARN, fontFace: SANS_FB, bold: true, charSpacing: 2 });
  const problemBlock = f.problem.map((p) => ({ text: '• ' + p + '\n', options: {} }));
  s.addText(problemBlock, { x: 0.7, y: 2.9, w: 5.6, h: 3.4, fontSize: 12, color: '374151', fontFace: SANS_FB, lineSpacingMultiple: 1.3, valign: 'top' });

  s.addShape('rect', { x: 6.83, y: 2.3, w: 6.0, h: 4.2, fill: { color: 'E0F2FE' }, line: { color: 'BAE6FD' } });
  s.addText('გადაწყვეტა', { x: 7.03, y: 2.4, w: 5.6, h: 0.4, fontSize: 12, color: '0369A1', fontFace: SANS_FB, bold: true, charSpacing: 2 });
  s.addText(f.solution, { x: 7.03, y: 2.9, w: 5.6, h: 3.4, fontSize: 12, color: '0C4A6E', fontFace: SANS_FB, lineSpacingMultiple: 1.3, valign: 'top' });

  slides.push(s);
});

// 16. Mobile screenshot evidence
{
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'მტკიცებულება');
  s.addText('Mobile preloader - ცოცხალი მტკიცებულება', {
    x: 0.5, y: 0.8, w: 12.33, h: 0.7,
    fontSize: 24, color: INK, fontFace: SERIF, bold: true,
  });
  s.addText('iPhone 13 viewport-ში მთავარი გვერდი ჯერ ხანგრძლივად აჩვენებს splash-ს, რეალური hero ბანერი 2-3 წამის შემდეგ ჩნდება.', {
    x: 0.5, y: 1.5, w: 12.33, h: 0.6,
    fontSize: 13, color: '374151', fontFace: SANS_FB,
  });

  const homeMob = `${SCREEN_DIR}/mobile_home.png`;
  const serviceMob = `${SCREEN_DIR}/mobile_wylis-jonvis.png`;
  if (existsSync(homeMob)) {
    s.addImage({ path: homeMob, x: 2.0, y: 2.2, w: 2.3, h: 4.6 });
    s.addText('Mobile homepage - preloader splash', { x: 2.0, y: 6.8, w: 2.3, h: 0.25, fontSize: 10, color: MUTED, fontFace: SANS_FB, align: 'center' });
  }
  if (existsSync(serviceMob)) {
    s.addImage({ path: serviceMob, x: 8.5, y: 2.2, w: 2.3, h: 4.6 });
    s.addText('Mobile სერვის გვერდი - კარგად ჩატვირთული', { x: 8.5, y: 6.8, w: 2.3, h: 0.25, fontSize: 10, color: MUTED, fontFace: SANS_FB, align: 'center' });
  }
  slides.push(s);
}

// 17. Contact screenshot
{
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'მტკიცებულება');
  s.addText('Contact გვერდი - Local SEO ფანდი', {
    x: 0.5, y: 0.8, w: 12.33, h: 0.7,
    fontSize: 24, color: INK, fontFace: SERIF, bold: true,
  });
  s.addText('მისამართი ბუნდოვანია ("თბილისი, საქართველო"), ფოსტა Gmail-ზე - ვერც Google My Business-სა და ვერც კლიენტის ნდობას ვერ აუმჯობესებს.', {
    x: 0.5, y: 1.5, w: 12.33, h: 0.6,
    fontSize: 13, color: '374151', fontFace: SANS_FB,
  });
  const cont = `${SCREEN_DIR}/mobile_contact.png`;
  if (existsSync(cont)) {
    s.addImage({ path: cont, x: 4.5, y: 2.2, w: 2.3, h: 4.6 });
    s.addText('Contact (Mobile)', { x: 4.5, y: 6.8, w: 2.3, h: 0.25, fontSize: 10, color: MUTED, fontFace: SANS_FB, align: 'center' });
  }
  s.addText([
    { text: 'რა უნდა გასწორდეს:\n\n', options: { bold: true, fontSize: 14, color: INK } },
    { text: '• კონკრეტული ქუჩა + ნომერი (მაგ. ვაჟა-ფშაველას 76)\n', options: { fontSize: 12, color: '374151' } },
    { text: '• ფოსტა info@neofix.ge\n', options: { fontSize: 12, color: '374151' } },
    { text: '• Schema LocalBusiness: streetAddress, postalCode, geo\n', options: { fontSize: 12, color: '374151' } },
    { text: '• Google My Business პროფილი დაკავშირდეს\n', options: { fontSize: 12, color: '374151' } },
  ], { x: 7.5, y: 2.4, w: 5.5, h: 4.4, fontFace: SANS_FB, lineSpacingMultiple: 1.4, valign: 'top' });
  slides.push(s);
}

// 18. 60-day plan
{
  const s = pres.addSlide();
  s.background = { color: BG };
  addHeader(s, 'გეგმა');
  s.addText('60-დღიანი გეგმა', {
    x: 0.5, y: 0.8, w: 12.33, h: 0.8,
    fontSize: 36, color: INK, fontFace: SERIF, bold: true,
  });

  const cols = [
    {
      title: '1-2 კვირა',
      sub: 'კრიტიკული (P0)',
      color: BAD,
      items: [
        'Homepage H1 ჩასწორება',
        'OG image 3 გვერდს',
        'Mobile preloader გათიშვა',
        '"ნეოფოქსი" typo',
      ],
    },
    {
      title: '3-4 კვირა',
      sub: 'მნიშვნელოვანი (P1)',
      color: WARN,
      items: [
        'Title-ების მასობრივი დახვეწა',
        'Contact + Schema LocalBusiness',
        'info@neofix.ge ფოსტა',
        'ALT-ების შევსება',
        'En-dash -> hyphen',
      ],
    },
    {
      title: '5-8 კვირა',
      sub: 'ტექნიკური (P2)',
      color: '0EA5E9',
      items: [
        'LiteSpeed/WP Rocket optimization',
        'Slug უნიფიკაცია + 301',
        'Cloudflare HSTS + Cache',
        'AI bot ბლოკის გადახედვა',
        'Blog კონტენტ-კალენდარი',
      ],
    },
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 4.27;
    s.addShape('rect', { x, y: 1.9, w: 4.0, h: 4.5, fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB' } });
    s.addShape('rect', { x, y: 1.9, w: 4.0, h: 0.6, fill: { color: c.color }, line: { color: c.color } });
    s.addText(c.title, { x: x + 0.2, y: 1.95, w: 3.6, h: 0.5, fontSize: 16, color: 'FFFFFF', fontFace: SANS_FB, bold: true });
    s.addText(c.sub, { x: x + 0.2, y: 2.65, w: 3.6, h: 0.3, fontSize: 11, color: MUTED, fontFace: SANS_FB, charSpacing: 1 });
    const items = c.items.map((it) => ({ text: '☐  ' + it + '\n', options: {} }));
    s.addText(items, { x: x + 0.2, y: 3.05, w: 3.6, h: 3.3, fontSize: 12, color: '374151', fontFace: SANS_FB, lineSpacingMultiple: 1.6, valign: 'top' });
  });
  slides.push(s);
}

// 19. Final / contact
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('გმადლობთ', { x: 0.5, y: 2.2, w: 12.33, h: 1.2, fontSize: 64, color: 'FFFFFF', fontFace: SERIF, bold: true });
  s.addText('INFINITY SOLUTIONS', { x: 0.5, y: 3.5, w: 12.33, h: 0.6, fontSize: 22, color: 'FFA071', fontFace: SANS_FB, bold: true });
  s.addText('webinfinity12@gmail.com  ·  infinity.ge', { x: 0.5, y: 4.2, w: 12.33, h: 0.4, fontSize: 14, color: 'D1D5DB', fontFace: SANS_FB });
  slides.push(s);
}

// ─── footers ──────────────────────────────────────────────────────────
const total = slides.length;
slides.forEach((slide, idx) => {
  // skip footer on cover (1) and final (last)
  if (idx === 0 || idx === total - 1) return;
  addFooter(slide, idx + 1, total);
});

// ─── save ──────────────────────────────────────────────────────────────
const buffer = await pres.write({ outputType: 'nodebuffer' });
const { writeFile } = await import('fs/promises');
await writeFile(OUT, buffer);
console.log(`OK - ${total} slides -> ${OUT}`);
