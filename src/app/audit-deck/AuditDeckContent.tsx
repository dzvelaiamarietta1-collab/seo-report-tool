"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Palette, Upload, X } from "lucide-react";
import { storageKey } from "@/lib/presentation";
import type { AnalysisResult, CheckResult, PageReport, PreviewData } from "@/lib/types";

interface StoredAnalysis {
  url: string;
  fetchedAt: string;
  analysis: AnalysisResult;
  preview?: PreviewData | null;
  subPages?: PageReport[] | null;
}

// 19-slide SEO audit deck modelled on the berberis.ge reference.
// Sections: cover, assessment, 4 chapters (Technical, On-page,
// Competition, Goals) with chapter dividers + finding slides, and a
// final service offering. Brand colours are CSS custom properties so
// the whole deck can be re-tinted for a different client without
// touching component code.

type Status = "bad" | "partial" | "good";
type Severity = "high" | "medium" | "low";

type Finding = {
  num: string; // "1.1"
  title: string;
  status: Status;
  problem: string[];
  explanation?: string; // plain-language explanation for non-technical clients
  solution: string;
};

type Chapter = {
  num: number;
  caption: string; // ALL CAPS upper-right caption: "ტექნიკური"
  title: string; // section-divider big title
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

type AuditData = {
  domain: string;
  brandName: string;
  description: string;
  coverTitle?: string;
  coverSubtitle?: string;
  scores: { rankMath: string; passed: string; failed: string; warnings: string };
  keyFindings: KeyFinding[];
  chapters: Chapter[];
  competition: { intro: string; rows: CompetitorRow[] };
  keywordStrategy: { intro: string; rows: KeywordRow[] };
  goals: Goal[];
  services: ServiceColumn[];
};

// ─── default audit data (berberis sample) ─────────────────────────────

const DEFAULT_DATA: AuditData = {
  domain: "berberis.ge",
  brandName: "BERBERIS",
  description:
    "ჩვენ მოვამზადეთ თქვენი ვებსაიტის სრული SEO აუდიტი. ანალიზმა გამოავლინა მნიშვნელოვანი ტექნიკური და კონტენტური ხარვეზები, რომელთა გასწორებაც გააუმჯობესებს რანჟირებას საძიებო სისტემებში.",
  scores: {
    rankMath: "52/100",
    passed: "15/28",
    failed: "10/28",
    warnings: "3/28",
  },
  keyFindings: [
    {
      category: "კონტენტი",
      text: "Meta Description აკლია · Canonical აკლია · 182 დაბალ-კონტენტიანი გვერდი",
      severity: "high",
    },
    {
      category: "სტრუქტურა",
      text: "193 Title <30 სიმბ. · 121 დუბლირებული Title · 221 დუბლირებული H1 · 194 გვერდს H2 აკლია",
      severity: "medium",
    },
    {
      category: "Off-page",
      text: "Sitemap არ არსებობს · Schema არ არსებობს · სუსტი backlink-პროფილი",
      severity: "high",
    },
    {
      category: "სიჩქარე/ფოტო",
      text: "Server response 2.28წმ · 96 ფოტო >100KB · ფოტოების ALT აკლია",
      severity: "medium",
    },
  ],
  chapters: [
    {
      num: 1,
      caption: "ტექნიკური",
      title: "ტექნიკური აუდიტი",
      findings: [
        {
          num: "1.1",
          title: "XML Sitemap არ არსებობს",
          status: "bad",
          problem: [
            "საიტს საერთოდ არ აქვს XML Sitemap.",
            "Sitemap არის რუკა Google-ისთვის - მის გარეშე საძიებო სისტემა ვერ პოულობს და ვერ აინდექსირებს ყველა გვერდს, განსაკუთრებით პროდუქტებს.",
          ],
          solution:
            "ჩვენ შევქმნით XML Sitemap-ს (ka/en ვერსიებით) და გავაგზავნით Google Search Console-ში.",
        },
        {
          num: "1.2",
          title: "Canonical Tag აკლია ყველა გვერდს",
          status: "bad",
          problem: [
            "Canonical tag აკლია 274 გვერდს.",
            "Canonical-ის გარეშე Google ვერ ხვდება რომელია „მთავარი“ ვერსია და დუბლირებულ კონტენტად აღიქვამს გვერდებს.",
          ],
          solution:
            "ჩვენ დავამატებთ თვითმიმთითებელ canonical tag-ს ყველა გვერდზე.",
        },
        {
          num: "1.3",
          title: "Meta Description აკლია ყველა გვერდს",
          status: "bad",
          problem: [
            "Meta Description აკლია 274 გვერდს (100%).",
            "Description არის ის ტექსტი, რომელსაც მომხმარებელი ხედავს Google-ის შედეგებში - მისი არარსებობა ამცირებს დაკლიკების მაჩვენებელს (CTR).",
          ],
          solution:
            "ჩვენ დავწერთ უნიკალურ, საკვანძო-სიტყვიან Description-ს ყველა პროდუქტსა და კატეგორიაზე.",
        },
        {
          num: "1.4",
          title: "Structured Data (Schema) არ არსებობს",
          status: "bad",
          problem: [
            "საიტს საერთოდ არ აქვს Schema.org მონაცემები.",
            "Schema ეხმარება Google-ს პროდუქტების, ფასების, მიმოხილვებისა და კომპანიის ამოცნობაში - მის გარეშე rich results-ში ვერ ჩანს.",
          ],
          solution:
            "ჩვენ დავნერგავთ Product, LocalBusiness და BreadcrumbList schema-ს - განსაკუთრებით პროდუქტებსა და სერვისებზე.",
        },
        {
          num: "1.5",
          title: "ვებსაიტის სიჩქარე",
          status: "partial",
          problem: [
            "სერვერის პასუხის დრო რეკომენდებულია <0.8 წმ, ახლა კი გაცილებით მეტია.",
            "გვერდი აკეთებს 48 request-ს; ფოტოებს არ აქვთ expires headers (caching).",
          ],
          solution:
            "ჩვენ ჩავრთავთ caching-ს (WP Rocket) და CDN-ს; ფოტოებს გადავიყვანთ WebP-ში lazy-load-ით.",
        },
        {
          num: "1.6",
          title: "ფოტოების ოპტიმიზაცია",
          status: "partial",
          problem: [
            "ფოტოების უმეტესობა აღემატება 100KB-ს.",
            "აკლია ALT ტექსტი - ეს ხელს უშლის Google Images-ში რანჟირებასა და ხელმისაწვდომობას.",
            "ფოტოებს აკლია ზომის ატრიბუტები (185 გვერდი).",
          ],
          solution:
            "ჩვენ გადავიყვანთ ფოტოებს WebP-ში და შევკუმშავთ; დავამატებთ აღწერით ALT-ს და width/height ატრიბუტებს.",
        },
        {
          num: "1.7",
          title: "უსაფრთხოების Headers",
          status: "partial",
          problem: [
            "480 გვერდს აკლია მნიშვნელოვანი უსაფრთხოების headers: HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options.",
            "274 გვერდს აქვს Unsafe Cross-Origin Links.",
          ],
          solution: "ჩვენ სერვერზე ჩავრთავთ ყველა საჭირო უსაფრთხოების header-ს.",
        },
      ],
    },
    {
      num: 2,
      caption: "ON-PAGE",
      title: "On-page და კონტენტი",
      findings: [
        {
          num: "2.1",
          title: "Title-ებისა და აღწერების პრობლემა",
          status: "bad",
          problem: [
            "193 გვერდის Title 30 სიმბოლოზე მოკლეა (მაგ. მთავარი - მხოლოდ „მთავარი“, 7 სიმბ.).",
            "121 გვერდს აქვს დუბლირებული Title; 26 გვერდის Title - ძალიან გრძელია.",
            "ასევე, გასასწორებელია აღწერებიც - არცერთ გვერდს არ აქვს description.",
          ],
          solution:
            "ჩვენ თითო გვერდს/პროდუქტს მივანიჭებთ უნიკალურ, საკვანძო-სიტყვიან Title-ს (50-60 სიმბ.) - ბრენდის სახელით.",
        },
        {
          num: "2.2",
          title: "H1 და H2 სტრუქტურა",
          status: "bad",
          problem: [
            "221 გვერდს აქვს დუბლირებული H1; 194 გვერდს საერთოდ აკლია H2.",
            "7 გვერდზე Multiple H1.",
          ],
          solution:
            "ჩვენ თითო გვერდს მივანიჭებთ ერთ უნიკალურ H1-ს; სათაურებს დავალაგებთ H1→H2→H3 იერარქიით.",
        },
      ],
    },
  ],
  competition: {
    intro:
      "კონკურენტული ფრაზებზე დიდი მოთამაშეები დომინირებენ - მაღალი დომენის ავტორიტეტითა და ბიუჯეტით. პირდაპირი დაპირისპირება ფართო ფრაზებზე არარეალურია; სტრატეგია ნიშურ და ბრენდულ ფრაზებზე უნდა აიგოს.",
    rows: [
      {
        name: "კონკურენტი 1",
        type: "მთავარი მოთამაშე",
        strength: "ფართო ბრენდი, დიდი ბიუჯეტი, მაღალი DR",
        opportunity: "ნიშური სეგმენტი",
      },
      {
        name: "კონკურენტი 2",
        type: "ლოკალური ლიდერი",
        strength: "ფიზიკური ფილიალები, ნდობა",
        opportunity: "ციფრული + ბრენდი",
      },
      {
        name: "კონკურენტი 3",
        type: "მცირე საიტი",
        strength: "ცოტა შემოგარენი, სუსტი SEO",
        opportunity: "მნიშვნელოვანი წინ. გასვლა",
      },
      {
        name: "თქვენი საიტი",
        type: "სერვისი + პროდუქცია",
        strength: "ექსპერტიზა, ფოკუსი",
        opportunity: "-",
      },
    ],
  },
  keywordStrategy: {
    intro:
      "ჩვენი ფოკუსი იქნება ფრაზები, სადაც კონკურენტები სუსტად დგანან ან საერთოდ არ ერევიან: კონკრეტული პროდუქტები, სერვისები და ლოკალური მომსახურება.",
    rows: [
      {
        priority: "მაღალი",
        phrase: "ბრენდის სახელი + ლოკაცია",
        type: "ბრენდული",
        realism: "მაღალი - ვიწრო ფრაზა",
      },
      {
        priority: "მაღალი",
        phrase: "მთავარი პროდუქტი/სერვისი + თბილისი",
        type: "კატეგორია",
        realism: "მაღალი",
      },
      {
        priority: "მაღალი",
        phrase: "სპეციფიკური სერვისი (long-tail)",
        type: "long-tail",
        realism: "მაღალი",
      },
      {
        priority: "საშუალო",
        phrase: "სერვისი + უბანი (ვაკე / გლდანი)",
        type: "ლოკალური",
        realism: "მაღალი",
      },
      {
        priority: "საშუალო",
        phrase: "კონკურენტი vs თქვენი ბრენდი",
        type: "შედარებითი",
        realism: "საშუალო",
      },
      {
        priority: "დაბალი",
        phrase: "ფართო კატეგორია (1 სიტყვა)",
        type: "ფართო",
        realism: "დაბალი",
      },
    ],
  },
  goals: [
    {
      color: "#16A34A",
      title: "მთავარი ფრაზების რანჟირება",
      body: "ვმუშაობთ იმაზე, რომ მთავარი ბრენდული და კატეგორიული ფრაზები Google-ის პირველ გვერდზე ავიყვანოთ.",
    },
    {
      color: "#4A90E2",
      title: "გასაყიდი პროდუქცია/სერვისი წინ",
      body: "გვერდებს ვამზადებთ ისე, რომ მთავარი პროდუქტი ან სერვისი მე-2/3 გვერდიდან წინ წამოვწიოთ.",
    },
    {
      color: "#D97706",
      title: "ლოკალური დომინაცია",
      body: "ლოკალურ ფრაზებზე (სერვისი + უბანი) ვმუშაობთ Google-ის რუკის და ორგანული შედეგების TOP-ში გასვლისთვის.",
    },
    {
      color: "#0A2540",
      title: "ტექნიკური საფუძველი",
      body: "ვაგებთ Sitemap, Schema, Canonical და Meta - საძიებო სისტემამ საიტი სრულად გასაგებად დაინახოს.",
    },
  ],
  services: [
    {
      color: "#4A90E2",
      title: "ტექნიკური ოპტიმიზაცია",
      items: [
        "Sitemap, robots.txt, Canonical",
        "Schema markup (Product/Local)",
        "სიჩქარის ოპტიმიზაცია",
        "ფოტოების ოპტიმიზაცია",
        "უსაფრთხოების headers",
      ],
    },
    {
      color: "#16A34A",
      title: "On-page ოპტიმიზაცია",
      items: [
        "Title & Meta ყველა გვერდზე",
        "H1/H2 სტრუქტურა",
        "Keyword mapping",
        "კონტენტის გამდიდრება",
        "შიდა გადალინკვა",
      ],
    },
    {
      color: "#D97706",
      title: "Off-page & რეპორტინგი",
      items: [
        "Backlink სტრატეგია",
        "ლოკალური SEO + GBP",
        "კონკურენტების მონიტორინგი",
        "ყოველთვიური რეპორტი",
        "პოზიციების თრექინგი",
      ],
    },
  ],
};

// ─── helpers ────────────────────────────────────────────────────────────

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150;
}

function brandFromDomain(raw: string): { hostname: string; brandName: string } {
  if (!raw.trim()) return { hostname: "client.ge", brandName: "CLIENT" };
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, "");
    return { hostname: host, brandName: host.split(".")[0].toUpperCase() };
  } catch {
    return { hostname: raw.trim(), brandName: raw.trim().toUpperCase() };
  }
}

// ─── analyzer → deck mapping ──────────────────────────────────────────
// Translates the /results audit output (AnalysisResult) into the shape the
// deck slides expect. Findings come from the technical+performance and
// onPage+schema categories; only failing/warning checks are surfaced (the
// passing ones live in the score-card summary, not as numbered findings).
// Competition, keyword strategy, goals, and services stay generic - the
// analyzer doesn't produce that data.

function checkToFinding(c: CheckResult, num: string): Finding {
  return {
    num,
    title: c.label,
    status: c.status === "fail" ? "bad" : "partial",
    problem: [c.message],
    solution:
      c.recommendation ??
      "გადასაჭრელად საჭიროა SEO სპეციალისტისა და დეველოპერის ჩართულობა.",
  };
}

// Build pooled Findings from the cached analyzer snapshot. Each check
// becomes a PooledFinding tagged source="analyzer" so it can compete
// against Rank Math / SF / PageSpeed entries.
function analyzerToPooledFindings(analysis: AnalysisResult): PooledFinding[] {
  const findings: PooledFinding[] = [];
  const push = (
    c: CheckResult,
    category: "tech" | "onpage",
    priority: number
  ) => {
    if (c.status !== "fail" && c.status !== "warn") return;
    findings.push({
      source: "analyzer",
      category,
      priority,
      status: c.status === "fail" ? "bad" : "partial",
      title: c.label,
      problem: [c.message],
      solution:
        c.recommendation ??
        "გადასაჭრელად საჭიროა SEO სპეციალისტისა და დეველოპერის ჩართულობა.",
    });
  };
  for (const c of analysis.categories.technical.checks) push(c, "tech", 60);
  for (const c of analysis.categories.performance.checks) push(c, "tech", 70);
  for (const c of analysis.categories.onPage.checks) push(c, "onpage", 60);
  for (const c of analysis.categories.schema.checks) push(c, "tech", 65);
  for (const c of analysis.categories.linkHealth.checks) push(c, "tech", 50);
  return findings;
}

function mapAnalysisToAuditData(stored: StoredAnalysis): {
  data: AuditData;
  analyzerFindings: PooledFinding[];
} {
  const analysis = stored.analysis;
  const targetUrl = analysis.finalUrl ?? analysis.url;
  const { hostname, brandName } = brandFromDomain(targetUrl);
  const summary = analysis.summary;

  const analyzerFindings = analyzerToPooledFindings(analysis);

  // Top 4 highest-priority failures populate the assessment slide
  // "key findings" list.
  const topIssues = [...analyzerFindings]
    .sort((a, b) => {
      const w = (s: Status) => (s === "bad" ? 2 : s === "partial" ? 1 : 0);
      return w(b.status) - w(a.status) || b.priority - a.priority;
    })
    .slice(0, 4);

  const keyFindings: KeyFinding[] = topIssues.map((p) => ({
    category: p.title,
    text: p.problem[0] ?? p.title,
    severity: p.status === "bad" ? "high" : "medium",
  }));

  const description = `${hostname}-ის SEO აუდიტი. ანალიზმა გამოავლინა ${summary.failed} კრიტიკული შეცდომა და ${summary.warnings} გასაუმჯობესებელი წერტილი ${summary.totalChecks} შემოწმებიდან.`;

  const data: AuditData = {
    domain: hostname,
    brandName,
    description,
    scores: {
      rankMath: `${summary.score}/100`,
      passed: `${summary.passed}/${summary.totalChecks}`,
      failed: `${summary.failed}/${summary.totalChecks}`,
      warnings: `${summary.warnings}/${summary.totalChecks}`,
    },
    keyFindings,
    // Chapters left as templates here; the runtime merger replaces them
    // from the multi-source pool.
    chapters: [
      { num: 1, caption: "ტექნიკური", title: "ტექნიკური აუდიტი", findings: [] },
      { num: 2, caption: "ON-PAGE", title: "On-page და კონტენტი", findings: [] },
    ],
    competition: DEFAULT_DATA.competition,
    keywordStrategy: DEFAULT_DATA.keywordStrategy,
    goals: DEFAULT_DATA.goals,
    services: DEFAULT_DATA.services,
  };

  return { data, analyzerFindings };
}

// ─── Screaming Frog CSV import ─────────────────────────────────────────
// Parses Screaming Frog's `internal_html.csv` export and converts the most
// common SEO issues (4xx/5xx, missing title, long/short title, missing
// meta description, missing H1, missing canonical, deep crawl depth) into
// our Finding[] shape so they show up in chapters 1 & 2 of the deck.
//
// Minimal RFC-4180 CSV parser: handles quoted fields, embedded commas,
// escaped double-quotes (""). Doesn't handle the very rare \r in fields,
// which SF doesn't produce anyway.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // ignore — handled by \n
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

// Build a header→index lookup, case-insensitive, trimmed.
function headerIndex(headers: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => {
    idx[h.trim().toLowerCase()] = i;
  });
  return idx;
}

// Convert a parsed SF internal_html.csv to pooled findings. Each finding
// is tagged with its category (tech/onpage) and priority so the
// multi-source merger can rank it against Rank Math / PageSpeed / Rich
// Results entries.
function mapScreamingFrogToFindings(rows: string[][]): {
  findings: PooledFinding[];
  pagesScanned: number;
} {
  if (rows.length < 2) {
    return { findings: [], pagesScanned: 0 };
  }
  const idx = headerIndex(rows[0]);
  const data = rows.slice(1);
  const pagesScanned = data.length;

  // Column getters — return "" when the header is absent so the counters
  // simply read 0 instead of throwing.
  const col = (row: string[], name: string): string => {
    const i = idx[name.toLowerCase()];
    return i !== undefined ? (row[i] ?? "").trim() : "";
  };
  const num = (s: string): number => {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  // Counters
  let status4xx = 0;
  let status5xx = 0;
  let titleMissing = 0;
  let titleTooShort = 0;
  let titleTooLong = 0;
  let metaMissing = 0;
  let metaTooShort = 0;
  let metaTooLong = 0;
  let h1Missing = 0;
  let canonicalMissing = 0;
  let lowWordCount = 0;
  let deepCrawl = 0;

  for (const row of data) {
    const code = num(col(row, "Status Code"));
    if (code >= 400 && code < 500) status4xx++;
    if (code >= 500 && code < 600) status5xx++;

    const title = col(row, "Title 1");
    const titleLen = num(col(row, "Title 1 Length"));
    if (!title) titleMissing++;
    else if (titleLen > 0 && titleLen < 30) titleTooShort++;
    else if (titleLen > 60) titleTooLong++;

    const meta = col(row, "Meta Description 1");
    const metaLen = num(col(row, "Meta Description 1 Length"));
    if (!meta) metaMissing++;
    else if (metaLen > 0 && metaLen < 70) metaTooShort++;
    else if (metaLen > 160) metaTooLong++;

    const h1 = col(row, "H1-1");
    if (!h1) h1Missing++;

    const canonical = col(row, "Canonical Link Element 1");
    if (!canonical) canonicalMissing++;

    const wc = num(col(row, "Word Count"));
    if (wc > 0 && wc < 300) lowWordCount++;

    const depth = num(col(row, "Crawl Depth"));
    if (depth >= 4) deepCrawl++;
  }

  const findings: PooledFinding[] = [];
  const sf = (
    cat: "tech" | "onpage",
    priority: number,
    status: Status,
    title: string,
    problem: string[],
    solution: string
  ) => {
    findings.push({
      source: "sf",
      category: cat,
      priority,
      status,
      title,
      problem,
      solution,
    });
  };

  if (status4xx > 0) {
    sf(
      "tech",
      95,
      "bad",
      `${status4xx} გვერდი აბრუნებს 4xx შეცდომას`,
      [
        `Screaming Frog-ის სკანმა აღმოაჩინა ${status4xx} URL, რომელიც კლიენტის შეცდომის სტატუსს აბრუნებს (404, 403 და მსგავსი).`,
        "გატეხილი ლინკები აზიანებს მომხმარებლის გამოცდილებას და კარგავს crawl budget-ს.",
      ],
      "გვერდები აღსადგენია ან გადასამისამართებელია 301-ით სწორ URL-ზე; გადასახედია შიდა ლინკები, რომელიც ამ მისამართებზე მიუთითებს."
    );
  }
  if (status5xx > 0) {
    sf(
      "tech",
      100,
      "bad",
      `${status5xx} გვერდი აბრუნებს 5xx შეცდომას`,
      [
        `Screaming Frog-მა აღმოაჩინა ${status5xx} URL სერვერის შეცდომით.`,
        "სერვერის შეცდომა გვერდს სრულად ხდის მიუწვდომელს როგორც მომხმარებლისთვის, ისე Googlebot-ისთვის.",
      ],
      "ჰოსტინგის ლოგების შემოწმება და სერვერული შეცდომის გამოსწორება სასწრაფოა."
    );
  }
  if (canonicalMissing > 0) {
    sf(
      "tech",
      65,
      "bad",
      `Canonical tag აკლია ${canonicalMissing} გვერდს`,
      [
        `${canonicalMissing} გვერდს არ აქვს canonical მონიშვნა.`,
        "ამის გამო Google ვერ ხვდება გვერდის სტანდარტულ ვერსიას და შესაძლოა დუბლირებული კონტენტი ვერ მოგვარდეს.",
      ],
      "ყველა გვერდის <head>-ში დაემატოს self-referencing canonical tag."
    );
  }
  if (deepCrawl > 0) {
    sf(
      "tech",
      40,
      "partial",
      `${deepCrawl} გვერდი ღრმად არის ჩამარხული`,
      [
        `Crawl depth ≥4 აქვს ${deepCrawl} URL-ს - მათამდე მისაღწევად საჭიროა 4 ან მეტი დაკლიკვა მთავარი გვერდიდან.`,
        "Google უპირატესობას ანიჭებს ზედაპირულ გვერდებს; ღრმად ჩამარხული URL-ები იშვიათად ინდექსირდება.",
      ],
      "შიდა ლინკების სტრუქტურა გადასახედია; მნიშვნელოვანი გვერდები მთავარი ნავიგაციიდან 3 ნაბიჯში უნდა იყოს ხელმისაწვდომი."
    );
  }
  if (titleMissing > 0) {
    sf(
      "onpage",
      85,
      "bad",
      `Title tag აკლია ${titleMissing} გვერდს`,
      [
        `${titleMissing} გვერდი მთლიანად დარჩა Title-ის გარეშე.`,
        "Title საძიებო შედეგებში პირველი ხილული ელემენტია; მისი არარსებობა CTR-ს მკვეთრად ამცირებს.",
      ],
      "ყველა გვერდს მიენიჭოს უნიკალური, 50-60 სიმბოლოიანი Title საკვანძო ფრაზით თავში."
    );
  }
  if (titleTooShort > 0) {
    sf(
      "onpage",
      35,
      "partial",
      `${titleTooShort} გვერდის Title - ძალიან მოკლეა`,
      [
        `${titleTooShort} Title-ი 30 სიმბოლოზე ნაკლებია.`,
        "მოკლე სათაურს გუგლი არ აფასებს ვალიდურად და არ აჩვენებს ვიზიტორს.",
      ],
      "Title გაფართოვდეს 50-60 სიმბოლომდე - საკვანძო ფრაზა + ბრენდი + ღირებულების შეთავაზება."
    );
  }
  if (titleTooLong > 0) {
    sf(
      "onpage",
      35,
      "partial",
      `${titleTooLong} გვერდის Title - ძალიან გრძელია`,
      [
        `${titleTooLong} Title-ი 60 სიმბოლოს აღემატება და Google-ის შედეგებში ჩამოეჭრება.`,
      ],
      "Title გადასახედია და დამოკლდეს 50-60 სიმბოლომდე ისე, რომ მთავარი ფრაზა თავში დარჩეს."
    );
  }
  if (metaMissing > 0) {
    sf(
      "onpage",
      75,
      "bad",
      `Meta Description აკლია ${metaMissing} გვერდს`,
      [
        `${metaMissing} გვერდს Meta Description საერთოდ არ აქვს.`,
        "ამის გამო Google შემთხვევითად ამოარჩევს ნაწყვეტს გვერდის ტექსტიდან, რომელიც ხშირად არარელევანტურია.",
      ],
      "ყველა გვერდს მიენიჭოს უნიკალური Meta Description 140-160 სიმბოლოს ფარგლებში, საკვანძო ფრაზით."
    );
  }
  if (metaTooShort > 0 || metaTooLong > 0) {
    sf(
      "onpage",
      30,
      "partial",
      `Meta Description-ის სიგრძე არასწორია ${metaTooShort + metaTooLong} გვერდზე`,
      [
        `${metaTooShort} გვერდს ძალიან მოკლე (<70 სიმბ.) Description აქვს, ${metaTooLong}-ს კი ძალიან გრძელი (>160 სიმბ.).`,
      ],
      "აღწერის ოპტიმალური სიგრძე არის 140-160 სიმბოლო - გუგლი ვრცელ აღწერას მიიჩნევს სანდოდ."
    );
  }
  if (h1Missing > 0) {
    sf(
      "onpage",
      90,
      "bad",
      `H1 სათაური აკლია ${h1Missing} გვერდს`,
      [
        `${h1Missing} გვერდს არ აქვს H1 ტეგი.`,
        "H1 ერთ-ერთი მთავარი on-page სიგნალია - ის ეუბნება Google-ს, თუ რას ეხება გვერდი.",
      ],
      "თითო გვერდს ერთი უნიკალური H1 უნდა ჰქონდეს, რომელშიც შევა მთავარი საკვანძო ფრაზა."
    );
  }
  if (lowWordCount > 0) {
    sf(
      "onpage",
      45,
      "partial",
      `${lowWordCount} გვერდი დაბალ-კონტენტიანია`,
      [
        `${lowWordCount} გვერდს 300 სიტყვაზე ნაკლები ტექსტი აქვს.`,
        "მცირე კონტენტი იშვიათად ხვდება პირველ გვერდზე - Google უპირატესობას ანიჭებს დეტალურ მასალას.",
      ],
      "ყველაზე მნიშვნელოვან გვერდებზე კონტენტი გაფართოვდეს 500+ სიტყვამდე - FAQ, განმარტება, გამოყენების შემთხვევები."
    );
  }

  return { findings, pagesScanned };
}

// ─── Rank Math PDF import ──────────────────────────────────────────────
// Reads a Rank Math "SEO Analysis" PDF (the one the user downloads from
// wp-admin → Rank Math → SEO Analysis) and pulls out the failed/warning
// tests as Findings. We use pdfjs-dist on the client; pdf.js is heavy so
// we lazy-load it only when the user clicks the upload button.
//
// The Rank Math PDF lays out each test as:
//   {Test Title}
//   {Failed / Passed / Warning}
//   {Short description / recommendation}
// They're separated by visual rules, but in the text stream they come as
// sequential lines. We scan line-by-line, collecting groups around a
// status keyword.

// Per-test Georgian metadata for every Rank Math check. The key is the
// English test title from the PDF; the value is the polished Georgian
// finding we want to show in the deck. `category` decides whether it
// lands in Chapter 1 (tech) or Chapter 2 (on-page). `priority` lets us
// sort the most damaging issues to the top when multiple sources merge.
type RmTestMeta = {
  title: string;
  category: "tech" | "onpage";
  priority: number; // higher = surfaces first in deck
  // result-line phrases that mean this test FAILED in the PDF
  failPhrases: string[];
  // result-line phrases that mean this test is a WARNING
  warnPhrases?: string[];
  // ready-to-show Georgian finding (problem + solution). If failOverride
  // / warnOverride is absent we fall back to the base ones.
  fail?: { problem: string[]; solution: string };
  warn?: { problem: string[]; solution: string };
};

const RM_TESTS: Record<string, RmTestMeta> = {
  "Common Keywords": {
    title: "საკვანძო სიტყვების სიხშირე",
    category: "onpage",
    priority: 30,
    failPhrases: ["could not find"],
    fail: {
      problem: [
        "გვერდის ტექსტში ვერ მოიძებნა ხშირად განმეორებადი საკვანძო ფრაზები.",
        "Google ხშირად მეორად საკვანძო სიგნალს იღებს ხშირად გამოყენებული ფრაზებიდან - მათი არარსებობა აქცევს თემატიკას ბუნდოვანს.",
      ],
      solution: "ჩვენ გვერდის ძირითად თემას გამოვკვეთავთ 4-6-ჯერ განმეორებადი საკვანძო ფრაზებით - ბუნებრივად, კონტექსტში.",
    },
  },
  "SEO Description": {
    title: "Meta Description-ის სიგრძე",
    category: "onpage",
    priority: 80,
    failPhrases: ["missing", "is missing", "no meta description"],
    warnPhrases: ["too short", "too long", "is too"],
    fail: {
      problem: [
        "გვერდს Meta Description საერთოდ არ აქვს ან ცარიელია.",
        "Google საძიებო შედეგებში გვერდის ქვეშ ნაჩვენებ ტექსტს თვითონ ამოარჩევს კონტენტიდან, რომელიც ხშირად არარელევანტურია და კარგავს კლიკებს.",
      ],
      solution: "ჩვენ თითო გვერდს მივანიჭებთ უნიკალურ Meta Description-ს 140-160 სიმბოლოს ფარგლებში - მთავარი საკვანძო ფრაზით და ღირებულების შეთავაზებით.",
    },
    warn: {
      problem: [
        "Meta Description არსებობს, მაგრამ მისი სიგრძე ოპტიმალურს ვერ აღწევს - ან ძალიან მოკლეა, ან Google-ის შედეგებში ჩამოეჭრება.",
      ],
      solution: "ჩვენ Description-ს გადავახედავთ 140-160 სიმბოლომდე - მთავარი ფრაზა და CTA თავში დარჩება.",
    },
  },
  "H1 Heading": {
    title: "H1 სათაური აკლია გვერდს",
    category: "onpage",
    priority: 90,
    failPhrases: ["no h1 tag was found", "no h1"],
    fail: {
      problem: [
        "გვერდს არ აქვს H1 ტეგი.",
        "H1 ერთ-ერთი მთავარი on-page სიგნალია - ის ეუბნება Google-ს თუ რას ეხება გვერდი. მისი არარსებობა აქცევს თემატიკას გაურკვევლად.",
      ],
      solution: "ჩვენ თითო გვერდს მივანიჭებთ ერთ უნიკალურ H1 ტეგს - მთავარი საკვანძო ფრაზით.",
    },
  },
  "H2 Headings": {
    title: "H2 ქვესათაურები აკლია",
    category: "onpage",
    priority: 50,
    failPhrases: ["no h2 tag", "couldn't find any h2"],
    fail: {
      problem: [
        "გვერდზე ვერ მოიძებნა H2 ქვესათაურები.",
        "H2 აუმჯობესებს კონტენტის აღქმადობას როგორც მკითხველისთვის, ასევე Google-ისთვის.",
      ],
      solution: "ჩვენ კონტენტს დავყოფთ 3-6 თემატურ ბლოკად H2-ებით - მეორადი საკვანძო ფრაზებით.",
    },
  },
  "Image ALT Attributes": {
    title: "სურათებს ALT ატრიბუტი აკლია",
    category: "onpage",
    priority: 60,
    failPhrases: ["no alt", "missing alt", "have no alt"],
    fail: {
      problem: [
        "გვერდზე ერთი ან მეტი სურათი ცარიელი ALT ატრიბუტით არის ატვირთული.",
        "ALT ტექსტი ეხმარება Google-ს გაიგოს რა ჩანს სურათზე, ხელმისაწვდომობას უწევს ხელს და ხშირად მოაქვს ტრაფიკი სურათების ძიებიდან.",
      ],
      solution: "ჩვენ თითო სურათს მივანიჭებთ მოკლე ALT-ს (5-10 სიტყვა) სურათის შინაარსის აღწერით და, სადაც ბუნებრივად ჯდება, საკვანძო ფრაზითაც.",
    },
  },
  "Keywords in Title & Description": {
    title: "საკვანძო ფრაზები Title-სა და Description-ში",
    category: "onpage",
    priority: 40,
    failPhrases: ["could not find", "no common keywords"],
    fail: {
      problem: [
        "Title-სა და Meta Description-ში არ ფიქსირდება გვერდის შინაარსიდან ხშირად განმეორებადი საკვანძო ფრაზები.",
        "ეს ნიშნავს რომ Google-ისთვის Title/Description-ი ვერ აისახავს გვერდის რეალურ თემატიკას.",
      ],
      solution: "ჩვენ Title-სა და Description-ში დავამატებთ 1-2 ფრაზას, რომელიც კონტენტში ბუნებრივად რამდენჯერმე მეორდება.",
    },
  },
  "Links Ratio": {
    title: "შიდა და გარე ლინკების თანაფარდობა",
    category: "tech",
    priority: 20,
    failPhrases: ["too many external", "too few internal"],
    fail: {
      problem: [
        "გვერდიდან გადამისამართებული ლინკების ბალანსი არასწორია - ან ძალიან ბევრი გარე ლინკია, ან ძალიან ცოტა შიდა.",
      ],
      solution: "ჩვენ შიდა ლინკებს გადავანაწილებთ თემატურად დაკავშირებულ გვერდებზე; გარე ლინკებს დავუმატებთ rel='noopener' ატრიბუტს.",
    },
  },
  "SEO Title": {
    title: "Title ტეგის ხარისხი",
    category: "onpage",
    priority: 70,
    failPhrases: ["missing", "no title"],
    warnPhrases: ["too long", "too short"],
    fail: {
      problem: [
        "გვერდს Title ტეგი არ აქვს ან ცარიელია.",
        "Title ის პირველი ხილული ელემენტია, რომელსაც Google საძიებო შედეგებში აჩვენებს - მისი არარსებობა მკვეთრად ამცირებს CTR-ს.",
      ],
      solution: "ჩვენ ყველა გვერდს მივანიჭებთ უნიკალურ Title-ს 50-60 სიმბოლოს ფარგლებში - მთავარი საკვანძო ფრაზა თავში.",
    },
    warn: {
      problem: [
        "Title არსებობს, მაგრამ ან 60 სიმბოლოს აღემატება და Google-ის შედეგებში ჩამოეჭრება, ან 30 სიმბოლოზე ნაკლებია და გუგლი ვერ იგებს შინაარსს.",
      ],
      solution: "ჩვენ Title-ს გადავახედავთ 50-60 სიმბოლომდე.",
    },
  },
  "Create a responsive site": {
    title: "Responsive დიზაინი (CSS media queries)",
    category: "tech",
    priority: 30,
    failPhrases: ["does not contain", "no media queries"],
    fail: {
      problem: [
        "გვერდის CSS-ში არ ფიქსირდება media query-ები.",
        "ეს ნიშნავს რომ მობილურ მოწყობილობაზე გვერდი არ ერგება ეკრანის ზომას - Google mobile-first ინდექსირებას იყენებს, ეს მძიმე უარყოფითი სიგნალია.",
      ],
      solution: "ჩვენ თემაში დავამატებთ responsive CSS @media query-ებს მინიმუმ 768px და 480px breakpoint-ებზე.",
    },
  },
  "Homepage Is Reachable": {
    title: "მთავარი გვერდის ხელმისაწვდომობა",
    category: "tech",
    priority: 100,
    failPhrases: ["not reachable", "unreachable", "could not"],
    fail: {
      problem: [
        "მთავარი გვერდი HTTP მოთხოვნაზე არ პასუხობს ან აბრუნებს შეცდომის სტატუსს.",
        "ეს ბლოკავს მთლიან ინდექსირებას - Google ვერ აღწევს საიტამდე.",
      ],
      solution: "ჩვენ სასწრაფოდ შევამოწმებთ ჰოსტინგს, DNS-ს და სერვერულ ლოგებს.",
    },
  },
  "Canonical Tag": {
    title: "Canonical tag-ი აკლია",
    category: "tech",
    priority: 60,
    failPhrases: ["missing", "not found", "no canonical"],
    fail: {
      problem: [
        "გვერდს არ აქვს canonical link tag.",
        "Google ვერ ხვდება გვერდის სტანდარტულ ვერსიას და შესაძლოა დუბლირებული კონტენტი ვერ მოგვარდეს.",
      ],
      solution: "ჩვენ ყველა გვერდის <head>-ში დავამატებთ self-referencing canonical tag-ს.",
    },
  },
  "Noindex Meta": {
    title: "Noindex meta tag",
    category: "tech",
    priority: 90,
    failPhrases: ["noindex", "blocked from indexing"],
    fail: {
      problem: [
        "გვერდი robots meta-ით ბლოკავს ინდექსირებას (noindex).",
        "ეს ნიშნავს რომ Google საერთოდ არ აჩვენებს გვერდს საძიებო შედეგებში - კრიტიკული პრობლემაა, თუ გვერდი მართლა ხილული უნდა იყოს.",
      ],
      solution: "ჩვენ noindex meta tag-ს მოვაშორებთ და გვერდს გადავიყვანთ index-ზე.",
    },
  },
  "WWW Canonicalization": {
    title: "www / non-www გადამისამართება",
    category: "tech",
    priority: 50,
    failPhrases: ["not redirected", "both versions"],
    fail: {
      problem: [
        "www და non-www ვერსიები ცალკეულად მუშაობს და ერთმანეთზე არ გადამისამართდება.",
        "Google ხედავს ორ ცალკეულ საიტს, რომელთა შორის უნდა გადანაწილდეს ავტორიტეტი - ეს ასუსტებს ორივეს რანჟირებას.",
      ],
      solution: "ჩვენ ერთ ვერსიას (ჩვეულებრივ non-www) გავხდით კანონიკურს და მეორიდან 301-ით გადავამისამართებთ.",
    },
  },
  "OpenGraph Meta": {
    title: "OpenGraph meta tag-ები",
    category: "onpage",
    priority: 40,
    failPhrases: ["missing", "are missing"],
    fail: {
      problem: [
        "OpenGraph meta tag-ების ნაწილი აკლია.",
        "ეს განსაზღვრავს როგორ ჩანს გვერდი Facebook-ზე, Twitter-ზე, Telegram-ში გაზიარებისას - არასწორი წინასწარი ჩვენება ამცირებს კლიკებს და გავრცელებას.",
      ],
      solution: "ჩვენ <head>-ში დავამატებთ og:title, og:description, og:image, og:type და twitter:card meta tag-ებს.",
    },
  },
  "Schema Meta Data": {
    title: "Schema.org სტრუქტურირებული მონაცემები",
    category: "tech",
    priority: 80,
    failPhrases: ["no schema", "not found", "is missing"],
    fail: {
      problem: [
        "გვერდზე Schema.org სტრუქტურირებული მონაცემები არ ფიქსირდება.",
        "Schema ეხმარება Google-ს გაიგოს კონტექსტი (კომპანია, პროდუქტი, სტატია, FAQ) და გვერდი მოახვედროს გამდიდრებულ შედეგებში - ვარსკვლავებით, ფასით, FAQ-ბლოკით.",
      ],
      solution: "ჩვენ დავამატებთ JSON-LD-ს: Organization, BreadcrumbList, პროდუქტ/სერვის გვერდებზე Product ან Service, FAQ გვერდებზე FAQPage.",
    },
  },
  "Sitemaps": {
    title: "XML Sitemap",
    category: "tech",
    priority: 70,
    failPhrases: ["no sitemap", "not found", "is missing"],
    fail: {
      problem: [
        "საიტს არ აქვს XML Sitemap.",
        "Sitemap ეუბნება Google-ს თუ რომელი გვერდები არსებობს და როდის განახლდა - მისი არარსებობა ანელებს ინდექსირებას, განსაკუთრებით ახალი გვერდებისთვის.",
      ],
      solution: "ჩვენ შევქმნით /sitemap.xml-ს (Rank Math-ით) და დავარეგისტრირებთ Google Search Console-ში.",
    },
  },
  "Robots.txt": {
    title: "Robots.txt ფაილი",
    category: "tech",
    priority: 60,
    failPhrases: ["no robots", "missing"],
    warnPhrases: ["disallow", "blocks"],
    fail: {
      problem: [
        "საიტს robots.txt ფაილი არ აქვს.",
        "ეს ფაილი ეუბნება Google-ის ბოტს რომელი ნაწილების სკანირება ნებადართულია - მისი არარსებობა ბოტს მთელ საიტს უხსნის, რაც კარგავს crawl budget-ს.",
      ],
      solution: "ჩვენ შევქმნით /robots.txt-ს სტანდარტული შინაარსით (Allow: /, Disallow: /wp-admin/, Sitemap: ...).",
    },
    warn: {
      problem: [
        "robots.txt არსებობს, მაგრამ შეიცავს Disallow დირექტივებს - გადასახედია რომ შემთხვევით არ იყოს დაბლოკილი მნიშვნელოვანი გვერდები.",
      ],
      solution: "ჩვენ robots.txt-ს გადავახედავთ და თითო Disallow ხაზს დავადასტურებთ - დაბლოკილი გვერდები კრიტიკული არ უნდა იყოს.",
    },
  },
  "Keep your content fresh": {
    title: "კონტენტის სიახლე",
    category: "onpage",
    priority: 30,
    failPhrases: ["not been updated", "stale", "outdated"],
    fail: {
      problem: [
        "გვერდი დიდი ხანია არ განახლებულა.",
        "Google უპირატესობას ანიჭებს უახლეს კონტენტს - განსაკუთრებით ცვალებად სფეროებში (ფასები, სიახლეები, სერვისები).",
      ],
      solution: "ჩვენ გვერდს გადავახედავთ და კონტენტს ნაწილობრივ განვაახლებთ - ფასები, თარიღები, შემთხვევები.",
    },
  },
  "Broken Links": {
    title: "გატეხილი ლინკები",
    category: "tech",
    priority: 70,
    failPhrases: ["broken links", "404", "dead links"],
    fail: {
      problem: [
        "გვერდიდან აღმოჩენილია გატეხილი ლინკები (404 ან 500).",
        "ეს აზიანებს როგორც მომხმარებლის გამოცდილებას, ასევე ნდობას, რომელსაც Google ენდობა - კარგავს crawl budget-ს.",
      ],
      solution: "ჩვენ გატეხილ ლინკებს აღვადგენთ ან 301 გადამისამართებას დავუყენებთ სწორ URL-ზე.",
    },
  },
  "Page Size": {
    title: "HTML დოკუმენტის ზომა",
    category: "tech",
    priority: 20,
    failPhrases: [],
    warnPhrases: ["over the average", "exceeds"],
    warn: {
      problem: [
        "HTML დოკუმენტი მოცულობით საშუალოს აღემატება.",
        "მძიმე HTML ანელებს გვერდის ჩატვირთვას მობილურ მოწყობილობებზე.",
      ],
      solution: "ჩვენ HTML-ს გავწმენდავთ - inline სტილებს და სკრიპტებს ცალკე ფაილებში გადავიტანთ, არასაჭირო კომენტარებს მოვაშორებთ.",
    },
  },
  "Response Time": {
    title: "სერვერის რეაგირების დრო",
    category: "tech",
    priority: 70,
    failPhrases: ["slow", "high response", "over"],
    fail: {
      problem: [
        "სერვერი დაგვიანებით პასუხობს მოთხოვნებზე.",
        "ნელი TTFB პირდაპირ აზიანებს Core Web Vitals-ს და ამცირებს რანჟირებას.",
      ],
      solution: "ჩვენ ჩავრთავთ კეშირებას (WP Rocket / LiteSpeed Cache), CDN-ს და გადავხედავთ ჰოსტინგის პარამეტრებს.",
    },
  },
  "Image Headers Expire": {
    title: "სურათების Cache header-ები",
    category: "tech",
    priority: 20,
    failPhrases: ["no expires", "missing expires"],
    fail: {
      problem: [
        "სურათები არ ისარგებლებენ ბრაუზერის cache header-ით.",
        "ეს ნიშნავს რომ მომხმარებელი ყოველ ვიზიტზე თავიდან ჩამოტვირთავს იმავე სურათებს.",
      ],
      solution: "ჩვენ სერვერზე ჩავრთავთ Expires ან Cache-Control header-ს სურათებისთვის - მინიმუმ 30 დღით.",
    },
  },
  "Minify CSS": {
    title: "CSS ფაილების მინიფიკაცია",
    category: "tech",
    priority: 30,
    failPhrases: [],
    warnPhrases: ["not minified", "don't seem", "do not seem"],
    warn: {
      problem: [
        "ერთი ან მეტი CSS ფაილი არ არის მინიფიცირებული.",
        "მინიფიკაცია ამცირებს ფაილის ზომას 20-40%-ით, რაც აჩქარებს ჩატვირთვას.",
      ],
      solution: "ჩვენ ჩავრთავთ CSS combine + minify-ს (LiteSpeed Cache, WP Rocket, Autoptimize).",
    },
  },
  "Page Objects": {
    title: "გვერდის რესურსების რაოდენობა",
    category: "tech",
    priority: 30,
    failPhrases: [],
    warnPhrases: ["large number", "makes", "requests"],
    warn: {
      problem: [
        "გვერდი ბევრ HTTP მოთხოვნას აკეთებს ჩასატვირთად.",
        "თითო რესურსი (CSS, JS, სურათი) ცალკე network მოთხოვნაა - ბევრი ანელებს გვერდის ღიასობის სიჩქარეს.",
      ],
      solution: "ჩვენ CSS/JS ფაილებს გავაერთიანებთ, არასაჭირო plugin-ებს გავთიშავთ და სურათებს lazy-loading-ს დავამატებთ.",
    },
  },
  "Minify Javascript": {
    title: "JavaScript ფაილების მინიფიკაცია",
    category: "tech",
    priority: 30,
    failPhrases: [],
    warnPhrases: ["not minified", "don't seem", "do not seem"],
    warn: {
      problem: [
        "ერთი ან მეტი JavaScript ფაილი არ არის მინიფიცირებული.",
      ],
      solution: "ჩვენ ჩავრთავთ JavaScript combine + minify-ს (LiteSpeed Cache ან WP Rocket).",
    },
  },
  "Mobile Speed": {
    title: "მობილური სიჩქარე",
    category: "tech",
    priority: 80,
    failPhrases: ["test execution failed", "slow", "poor"],
    fail: {
      problem: [
        "მობილური სიჩქარის ტესტი ვერ შესრულდა ან აჩვენა სუსტი შედეგი.",
        "Google mobile-first ინდექსირებას იყენებს - მობილური სიჩქარე პირდაპირ ფაქტორია რანჟირებაში.",
      ],
      solution: "ჩვენ შევამოწმებთ Core Web Vitals-ს (LCP, INP, CLS) PageSpeed Insights-ით და გავაუმჯობესებთ სურათების ფორმატს (WebP), lazy-loading-ს და კრიტიკულ CSS-ს.",
    },
  },
  "Theme Visibility": {
    title: "თემის ხილვადობა",
    category: "tech",
    priority: 10,
    failPhrases: ["visible", "easily identifiable"],
    warnPhrases: ["visible"],
    warn: {
      problem: [
        "გამოყენებული WordPress თემა საჯაროდ იდენტიფიცირებადია.",
      ],
      solution: "ჩვენ თემის ვერსიულ ინფორმაციას დავფარავთ - უსაფრთხოების პრევენციული ნაბიჯი.",
    },
  },
  "Visible Plugins": {
    title: "Plugin-ების საჯარო ხილვადობა",
    category: "tech",
    priority: 20,
    failPhrases: [],
    warnPhrases: ["publicly visible", "visible"],
    warn: {
      problem: [
        "WordPress plugin-ების ნაწილი საჯაროდ ხილულია (URL-ებიდან გამოცნობადია).",
        "ეს ხელს უწყობს რობოტებს უსაფრთხოების მოწყვლადობების მოძიებას.",
      ],
      solution: "ჩვენ plugin-ების ვერსიულ ინფორმაციას დავფარავთ და /readme.html ფაილებს წავშლით.",
    },
  },
  "Directory Listing": {
    title: "Directory Listing",
    category: "tech",
    priority: 30,
    failPhrases: ["enabled", "exposed"],
    fail: {
      problem: [
        "სერვერი ხილულად აჩვენებს ფოლდერების შინაარსს.",
        "ეს უსაფრთხოების სერიოზული რისკია - კონფიდენციალური ფაილების შინაარსი შესაძლოა გამოაშკარავდეს.",
      ],
      solution: "ჩვენ Apache-ში დავამატებთ 'Options -Indexes', Nginx-ში 'autoindex off;' - ფოლდერების ჩვენება გაითიშება.",
    },
  },
  "Secure Connection": {
    title: "HTTPS დაცული კავშირი",
    category: "tech",
    priority: 95,
    failPhrases: ["http://", "not secure", "no https"],
    fail: {
      problem: [
        "საიტი არ მუშაობს HTTPS პროტოკოლით.",
        "Google ბრაუზერი ნიშნავს ასეთ საიტებს 'Not Secure'-ად, რაც ამცირებს ნდობას და რანჟირებას.",
      ],
      solution: "ჩვენ ჰოსტინგის პანელიდან ჩავრთავთ Let's Encrypt SSL სერტიფიკატს - HTTPS უფასოდ.",
    },
  },
  // Tests that are typically informational (preview slides) — skipped in
  // findings because they don't produce actionable issues.
  "Search Preview": {
    title: "საძიებო რეზულტატის ვიზუალური ჩვენება",
    category: "onpage",
    priority: 0,
    failPhrases: [],
  },
  "Mobile Search Preview": {
    title: "მობილური საძიებო ჩვენება",
    category: "onpage",
    priority: 0,
    failPhrases: [],
  },
  "Mobile Snapshot": {
    title: "მობილური ეკრანის ფოტო",
    category: "tech",
    priority: 0,
    failPhrases: [],
  },
};

// Result-line classifier: matches against this test's fail/warn phrases.
function classifyRmTest(meta: RmTestMeta, resultLine: string): Status | null {
  const lower = resultLine.toLowerCase();
  for (const p of meta.failPhrases) {
    if (p && lower.includes(p.toLowerCase())) return "bad";
  }
  if (meta.warnPhrases) {
    for (const p of meta.warnPhrases) {
      if (p && lower.includes(p.toLowerCase())) return "partial";
    }
  }
  return null;
}

type RmFinding = Omit<Finding, "num"> & {
  category: "tech" | "onpage";
  priority: number;
};

async function parseRankMathPdf(file: File): Promise<{
  score: number | null;
  totals: { passed: number; warnings: number; failed: number; total: number } | null;
  findings: RmFinding[];
  rawTextLines: number;
}> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let current = "";
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      const y = item.transform?.[5] ?? 0;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (current.trim()) lines.push(current.trim());
        current = item.str;
      } else {
        current += " " + item.str;
      }
      lastY = y;
    }
    if (current.trim()) lines.push(current.trim());
  }

  // ─── Score: standalone `NN/100` near the "SEO Score" label ──────────
  let score: number | null = null;
  const scoreIdx = lines.findIndex((l) =>
    l.trim().toLowerCase().includes("seo score")
  );
  if (scoreIdx >= 0) {
    // Search a small window before & after for an "NN/100" token.
    const window = lines.slice(Math.max(0, scoreIdx - 3), scoreIdx + 3);
    for (const w of window) {
      const m = w.match(/(\d{1,3})\s*\/\s*100/);
      if (m) {
        score = Number(m[1]);
        break;
      }
    }
  }
  if (score === null) {
    // Fallback: any `NN/100` in the first 30 lines.
    for (const l of lines.slice(0, 30)) {
      const m = l.match(/(\d{1,3})\s*\/\s*100/);
      if (m) {
        score = Number(m[1]);
        break;
      }
    }
  }

  // ─── Totals: `X/27 Passed Tests`, `Y/27 Warnings`, `Z/27 Failed Tests` ─
  let totals: {
    passed: number;
    warnings: number;
    failed: number;
    total: number;
  } | null = null;
  let passedN = -1;
  let warnN = -1;
  let failN = -1;
  let totalN = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) continue;
    const x = Number(m[1]);
    const t = Number(m[2]);
    const after = (lines[i + 1] ?? "").toLowerCase();
    if (after.includes("passed tests")) {
      passedN = x;
      totalN = t;
    } else if (after.includes("warning")) {
      warnN = x;
    } else if (after.includes("failed tests")) {
      failN = x;
    }
  }
  if (passedN >= 0 && warnN >= 0 && failN >= 0 && totalN > 0) {
    totals = { passed: passedN, warnings: warnN, failed: failN, total: totalN };
  }

  // ─── Test sections: split lines into [title, body...] groups ────────
  const titleSet = new Set(Object.keys(RM_TESTS).map((t) => t.toLowerCase()));
  type Section = { title: string; body: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (titleSet.has(trimmed.toLowerCase())) {
      if (current) sections.push(current);
      current = { title: trimmed, body: [] };
    } else if (current) {
      current.body.push(trimmed);
    }
  }
  if (current) sections.push(current);

  // For each section, classify against THAT test's failPhrases/warnPhrases
  // (not a generic list) and emit a Georgian Finding.
  const findings: RmFinding[] = [];
  for (const sec of sections) {
    const meta = RM_TESTS[sec.title];
    if (!meta) continue;
    if (meta.priority === 0) continue; // informational/preview tests skipped
    if (sec.body.length < 1) continue;
    const candidateLines = sec.body.filter((b) => b.length > 0).slice(0, 6);
    let status: Status | null = null;
    for (const cl of candidateLines) {
      const s = classifyRmTest(meta, cl);
      if (s) {
        status = s;
        break;
      }
    }
    if (!status) continue;
    const payload =
      status === "bad" ? meta.fail : meta.warn ?? meta.fail;
    if (!payload) continue;
    findings.push({
      title: meta.title,
      status,
      problem: payload.problem,
      solution: payload.solution,
      category: meta.category,
      priority: meta.priority,
    });
  }

  return { score, totals, findings, rawTextLines: lines.length };
}

// ─── PageSpeed Insights ────────────────────────────────────────────────
// Hits the existing /api/pagespeed endpoint and converts its
// CheckResult[] into pooled Findings.
async function fetchPageSpeedFindings(url: string): Promise<{
  findings: PooledFinding[];
  score: number | null;
  checks: CheckResult[];
}> {
  const apiUrl = `/api/pagespeed?url=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`PageSpeed API მცდარი პასუხი: ${res.status}`);
  }
  const data = (await res.json()) as { category?: { checks?: CheckResult[] } };
  const checks = data.category?.checks ?? [];

  // Extract the headline performance score for display.
  const perfCheck = checks.find((c) => c.label === "Performance Score");
  let score: number | null = null;
  if (perfCheck?.message) {
    const m = perfCheck.message.match(/(\d{1,3})\s*\/\s*100/);
    if (m) score = Number(m[1]);
  }

  const findings: PooledFinding[] = [];
  for (const c of checks) {
    if (c.status === "pass" || c.status === "info") continue;
    const status: Status = c.status === "fail" ? "bad" : "partial";
    // Performance findings hit Chapter 1 (technical). LCP and CLS are
    // higher-priority because they're official Core Web Vitals.
    const isCoreVital =
      c.label.includes("LCP") ||
      c.label.includes("CLS") ||
      c.label.includes("INP") ||
      c.label === "Performance Score";
    findings.push({
      source: "psi",
      category: "tech",
      priority: isCoreVital ? 85 : 55,
      status,
      title: c.label,
      problem: [c.message],
      solution: c.recommendation ?? "ოპტიმიზაცია სასურველია - დეტალები Google PageSpeed Insights-ის რეპორტში.",
    });
  }
  return { findings, score, checks };
}

// ─── Rich Results / Schema validation ──────────────────────────────────
// Reads the schema checks from the cached analysis snapshot (the same
// data the /results page produced). We don't run a fresh analyzer call
// from here because /api/analyze is a streaming endpoint and would
// require a full SSE consumer; the snapshot is enough for showing what
// rich-results gaps exist.
function extractRichResultsFromAnalysis(analysis: AnalysisResult): {
  findings: PooledFinding[];
  schemaTypes: string[];
  hasSchema: boolean;
} {
  const schemaChecks = analysis.categories?.schema?.checks ?? [];

  let schemaTypes: string[] = [];
  let hasSchema = false;
  for (const c of schemaChecks) {
    if (c.label.includes("Schema") && typeof c.value === "string" && c.value) {
      const types = String(c.value)
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (types.length > 0) {
        schemaTypes = types;
        hasSchema = true;
        break;
      }
    }
    if (c.status === "pass" && c.label.includes("Schema")) {
      hasSchema = true;
    }
  }

  const findings: PooledFinding[] = [];
  for (const c of schemaChecks) {
    if (c.status === "pass" || c.status === "info") continue;
    const status: Status = c.status === "fail" ? "bad" : "partial";
    findings.push({
      source: "rich",
      category: "tech",
      priority: 75,
      status,
      title: c.label,
      problem: [c.message],
      solution:
        c.recommendation ??
        "გადასაჭრელად საჭიროა Schema.org JSON-LD-ის დამატება გვერდის HTML-ში.",
    });
  }
  return { findings, schemaTypes, hasSchema };
}

// ─── Multi-source Finding pool ─────────────────────────────────────────
// Findings flow in from 4 sources: Rank Math PDF, Screaming Frog CSV,
// PageSpeed API, Rich Results check. We tag each by source + priority,
// then pick the top N per chapter when (re)building the deck.
type PooledFinding = Omit<Finding, "num"> & {
  source: "rm" | "sf" | "psi" | "rich" | "analyzer";
  category: "tech" | "onpage";
  priority: number;
};

function selectTopFindings(
  pool: PooledFinding[],
  category: "tech" | "onpage",
  limit: number
): Finding[] {
  const seen = new Set<string>();
  const deduped: PooledFinding[] = [];
  // Sort first so the highest-priority entry wins when titles collide
  const sorted = pool
    .filter((p) => p.category === category)
    .sort((a, b) => {
      const w = (s: Status) => (s === "bad" ? 2 : s === "partial" ? 1 : 0);
      const dw = w(b.status) - w(a.status);
      if (dw !== 0) return dw;
      return b.priority - a.priority;
    });
  for (const p of sorted) {
    // Normalize title: lowercase + strip punctuation/spaces + first 30 chars
    const normTitle = p.title.toLowerCase().replace(/[\s.,:;()/\\-]+/g, "").slice(0, 30);
    // Also key on first 40 chars of problem text to catch same issue from different sources
    const normProblem = (p.problem[0] ?? "").toLowerCase().replace(/[\s.,:;()/\\-]+/g, "").slice(0, 40);
    const key = normTitle + "|" + normProblem;
    if (seen.has(normTitle) || seen.has(key)) continue;
    seen.add(normTitle);
    seen.add(key);
    deduped.push(p);
    if (deduped.length >= limit) break;
  }
  return deduped.map((p, i) => ({
    num: `${category === "tech" ? 1 : 2}.${i + 1}`,
    title: p.title,
    status: p.status,
    problem: p.problem,
    solution: p.solution,
  }));
}

// ─── main composition ──────────────────────────────────────────────────

export default function AuditDeckContent() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") ?? searchParams.get("domain") ?? "";

  const initial = useMemo(() => {
    const derived = brandFromDomain(rawUrl);
    return rawUrl
      ? { ...DEFAULT_DATA, domain: derived.hostname, brandName: derived.brandName }
      : DEFAULT_DATA;
  }, [rawUrl]);

  const [urlInput, setUrlInput] = useState(initial.domain);
  const [brandOverride, setBrandOverride] = useState("");
  const [primary, setPrimary] = useState("#0A2540");
  const [accent, setAccent] = useState("#DC2626");
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  // Per-finding uploaded screenshots: key = finding.num ("1.1"), value = array
  // of data URLs (up to 2 per finding). User uploads real evidence from
  // Rank Math, Lighthouse, Google Search Console, etc.
  const [screenshots, setScreenshots] = useState<Record<string, string[]>>({});

  const handleScreenshotUpload = (
    findingNum: string,
    slotIndex: number,
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setScreenshots((prev) => {
        const existing = prev[findingNum] ?? [];
        const next = [...existing];
        next[slotIndex] = reader.result as string;
        return { ...prev, [findingNum]: next };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotRemove = (findingNum: string, slotIndex: number) => {
    setScreenshots((prev) => {
      const existing = prev[findingNum] ?? [];
      const next = existing.filter((_, i) => i !== slotIndex);
      return { ...prev, [findingNum]: next };
    });
  };

  const { hostname, brandName: autoBrand } = useMemo(
    () => brandFromDomain(urlInput),
    [urlInput]
  );
  const brand = brandOverride.trim() || autoBrand;

  // Single source of truth for all editable deck content. Starts from the
  // generic template; gets replaced with real analyzer output if the user
  // landed here via the audit flow; further edits from the inline-editing
  // UI are applied immutably on top. domain/brandName are overridden at
  // render time from the toolbar inputs so the bind stays live.
  const [data, setData] = useState<AuditData>(DEFAULT_DATA);
  const [usingRealData, setUsingRealData] = useState(false);
  const [findingOverrides, setFindingOverrides] = useState<Record<string, Partial<Finding>>>({});
  const [missingSnapshot, setMissingSnapshot] = useState(false);

  // Per-source finding pools. Each handler updates ONE pool; the deck's
  // chapters are derived from the merged pool every render.
  const [analyzerPool, setAnalyzerPool] = useState<PooledFinding[]>([]);
  const [sfPool, setSfPool] = useState<PooledFinding[]>([]);
  const [rmPool, setRmPool] = useState<PooledFinding[]>([]);
  const [psiPool, setPsiPool] = useState<PooledFinding[]>([]);
  const [richPool, setRichPool] = useState<PooledFinding[]>([]);

  const [sfImportInfo, setSfImportInfo] = useState<{
    pages: number;
    count: number;
  } | null>(null);
  const sfInputRef = useRef<HTMLInputElement | null>(null);
  const [rmImportInfo, setRmImportInfo] = useState<{
    score: number | null;
    failed: number;
    warnings: number;
    total: number | null;
  } | null>(null);
  const [rmLoading, setRmLoading] = useState(false);
  const rmInputRef = useRef<HTMLInputElement | null>(null);

  const [psiInfo, setPsiInfo] = useState<{
    score: number | null;
    issues: number;
  } | null>(null);
  const [psiLoading, setPsiLoading] = useState(false);

  const [richInfo, setRichInfo] = useState<{
    hasSchema: boolean;
    types: string[];
    issues: number;
  } | null>(null);
  const [richLoading, setRichLoading] = useState(false);

  useEffect(() => {
    if (!rawUrl || typeof window === "undefined") return;
    try {
      const raw =
        localStorage.getItem(storageKey(rawUrl)) ??
        sessionStorage.getItem(storageKey(rawUrl));
      if (!raw) {
        setMissingSnapshot(true);
        return;
      }
      const stored = JSON.parse(raw) as StoredAnalysis;
      const { data: nextData, analyzerFindings } = mapAnalysisToAuditData(stored);
      setData(nextData);
      setAnalyzerPool(analyzerFindings);
      const rich = extractRichResultsFromAnalysis(stored.analysis);
      setRichPool(rich.findings);
      setRichInfo({
        hasSchema: rich.hasSchema,
        types: rich.schemaTypes,
        issues: rich.findings.length,
      });
      setUsingRealData(true);
      setMissingSnapshot(false);
    } catch {
      // Snapshot present but malformed; silently fall back to template.
    }
  }, [rawUrl]);

  // Warn before leaving when real data is loaded to prevent accidental loss
  useEffect(() => {
    if (!usingRealData) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [usingRealData]);

  // Merge all pools and pick top 10 + 10 per chapter every render. This
  // keeps chapter content perfectly in sync with whatever sources the
  // user has loaded so far.
  const mergedPool = useMemo(
    () => [...analyzerPool, ...sfPool, ...rmPool, ...psiPool, ...richPool],
    [analyzerPool, sfPool, rmPool, psiPool, richPool]
  );
  const derivedTech = useMemo(
    () => selectTopFindings(mergedPool, "tech", 10),
    [mergedPool]
  );
  const derivedOnPage = useMemo(
    () => selectTopFindings(mergedPool, "onpage", 10),
    [mergedPool]
  );
  // domain/brand come from the toolbar inputs, not the stored data, so
  // the deck reflects whatever the user typed even before they edit
  // anything else. Chapter findings are derived from the merged source
  // pool when any source has loaded; otherwise the template stays.
  const displayData = useMemo(() => {
    const usePool = mergedPool.length > 0;
    const rawChapters = usePool
      ? [
          {
            ...data.chapters[0],
            findings: derivedTech.length > 0 ? derivedTech : data.chapters[0].findings,
          },
          {
            ...data.chapters[1],
            findings: derivedOnPage.length > 0 ? derivedOnPage : data.chapters[1].findings,
          },
          ...data.chapters.slice(2),
        ]
      : data.chapters;
    const chapters = rawChapters.map((ch) => ({
      ...ch,
      findings: ch.findings.map((f) =>
        findingOverrides[f.num] ? { ...f, ...findingOverrides[f.num] } : f
      ),
    }));
    return {
      ...data,
      domain: hostname,
      brandName: brand,
      chapters,
    };
  }, [data, hostname, brand, mergedPool.length, derivedTech, derivedOnPage, findingOverrides]);

  // ─── editable-field setters (immutable updates over `data`) ─────────
  const setDescription = (v: string) =>
    setData((d) => ({ ...d, description: v }));

  const setFinding = (
    chapterIdx: number,
    findingIdx: number,
    updates: Partial<Finding>
  ) => {
    const num = `${chapterIdx === 0 ? 1 : 2}.${findingIdx + 1}`;
    setFindingOverrides((prev) => ({
      ...prev,
      [num]: { ...(prev[num] ?? {}), ...updates },
    }));
  };

  const setCompetitionRow = (
    rowIdx: number,
    updates: Partial<CompetitorRow>
  ) =>
    setData((d) => ({
      ...d,
      competition: {
        ...d.competition,
        rows: d.competition.rows.map((r, i) =>
          i === rowIdx ? { ...r, ...updates } : r
        ),
      },
    }));

  const setCompetitionIntro = (v: string) =>
    setData((d) => ({
      ...d,
      competition: { ...d.competition, intro: v },
    }));

  const setKeywordRow = (rowIdx: number, updates: Partial<KeywordRow>) =>
    setData((d) => ({
      ...d,
      keywordStrategy: {
        ...d.keywordStrategy,
        rows: d.keywordStrategy.rows.map((r, i) =>
          i === rowIdx ? { ...r, ...updates } : r
        ),
      },
    }));

  const setKeywordIntro = (v: string) =>
    setData((d) => ({
      ...d,
      keywordStrategy: { ...d.keywordStrategy, intro: v },
    }));

  const setGoal = (goalIdx: number, updates: Partial<Goal>) =>
    setData((d) => ({
      ...d,
      goals: d.goals.map((g, i) =>
        i === goalIdx ? { ...g, ...updates } : g
      ),
    }));

  const setCoverTitle = (v: string) =>
    setData((d) => ({ ...d, coverTitle: v }));

  const setCoverSubtitle = (v: string) =>
    setData((d) => ({ ...d, coverSubtitle: v }));

  const setServiceTitle = (colIdx: number, v: string) =>
    setData((d) => ({
      ...d,
      services: d.services.map((s, i) =>
        i === colIdx ? { ...s, title: v } : s
      ),
    }));

  const setServiceItem = (colIdx: number, itemIdx: number, v: string) =>
    setData((d) => ({
      ...d,
      services: d.services.map((s, i) =>
        i === colIdx
          ? { ...s, items: s.items.map((it, j) => (j === itemIdx ? v : it)) }
          : s
      ),
    }));

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector(".audit-root") as HTMLElement | null;
    if (!root) return;
    root.style.setProperty("--ad-primary", primary);
    root.style.setProperty("--ad-accent", accent);
    const primaryLight = isLightColor(primary);
    root.style.setProperty("--ad-on-primary", primaryLight ? "#0a0a0a" : "#FFFFFF");
    root.style.setProperty(
      "--ad-on-primary-muted",
      primaryLight ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.78)"
    );
    root.style.setProperty(
      "--ad-on-primary-subtle",
      primaryLight ? "rgba(10,10,10,0.5)" : "rgba(255,255,255,0.55)"
    );
    root.style.setProperty("--ad-ink", primaryLight ? "#0F172A" : primary);
  }, [primary, accent]);

  const handleScreamingFrogUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const { findings, pagesScanned } = mapScreamingFrogToFindings(rows);

      if (findings.length === 0) {
        alert(
          "ფაილში ვერ ვიპოვე ცნობილი Screaming Frog სვეტები. გთხოვ ატვირთო `internal_html.csv`."
        );
        return;
      }

      setSfPool(findings);
      setData((d) => ({
        ...d,
        description: `Screaming Frog-ის სკანმა გადაამოწმა ${pagesScanned} URL. გამოვლინდა ${findings.length} ხარვეზი, რომელთა გასწორებაც გააუმჯობესებს რანჟირებას.`,
      }));
      setSfImportInfo({ pages: pagesScanned, count: findings.length });
      setUsingRealData(true);
    } catch (err) {
      console.error("[audit-deck] SF parse error", err);
      alert("CSV ფაილის წაკითხვა ვერ მოხერხდა. გადაამოწმე, რომ ფაილი UTF-8-ით არის შენახული.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleRankMathUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRmLoading(true);
    try {
      const { score, totals, findings } = await parseRankMathPdf(file);

      if (findings.length === 0) {
        alert(
          "PDF-ში ვერ ვიპოვე Failed/Warning ტესტები. დარწმუნდი, რომ ეს არის Rank Math-ის SEO Analysis რეპორტი."
        );
        return;
      }

      // Convert RmFinding[] → PooledFinding[] so the central pool can mix
      // them with SF/PSI/analyzer entries.
      const pooled: PooledFinding[] = findings.map((f) => ({
        source: "rm",
        category: f.category,
        priority: f.priority,
        status: f.status,
        title: f.title,
        problem: f.problem,
        solution: f.solution,
      }));
      setRmPool(pooled);

      const totalT = totals?.total ?? pooled.length;
      const failedN = totals?.failed ?? pooled.filter((p) => p.status === "bad").length;
      const warnN = totals?.warnings ?? pooled.filter((p) => p.status === "partial").length;
      const passedN = totals?.passed ?? Math.max(0, totalT - failedN - warnN);

      setData((d) => ({
        ...d,
        description: `Rank Math-ის SEO ანალიზმა გადაამოწმა ${totalT} ტესტი. გამოვლინდა ${failedN} კრიტიკული შეცდომა და ${warnN} გასაუმჯობესებელი წერტილი.`,
        scores: {
          rankMath: score !== null ? `${score}/100` : d.scores.rankMath,
          passed: `${passedN}/${totalT}`,
          failed: `${failedN}/${totalT}`,
          warnings: `${warnN}/${totalT}`,
        },
      }));
      setRmImportInfo({
        score,
        failed: failedN,
        warnings: warnN,
        total: totals?.total ?? null,
      });
      setUsingRealData(true);
    } catch (err) {
      console.error("[audit-deck] Rank Math PDF parse error", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`PDF ფაილის წაკითხვა ვერ მოხერხდა.\n\nტექნიკური დეტალი: ${msg}\n\n(F12 → Console-ში ნახე სრული შეცდომა)`);
    } finally {
      setRmLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handlePageSpeedFetch = async () => {
    const targetUrl = urlInput.trim();
    if (!targetUrl) {
      alert("ჯერ შეიყვანე დომენი toolbar-ში.");
      return;
    }
    setPsiLoading(true);
    try {
      const { findings, score } = await fetchPageSpeedFindings(targetUrl);
      if (findings.length === 0 && score === null) {
        alert(
          "PageSpeed API-დან მონაცემები ვერ მივიღე. შესაძლოა Google-მა შეზღუდა ანონიმური მოთხოვნები — სცადე მოგვიანებით."
        );
        return;
      }
      setPsiPool(findings);
      setPsiInfo({ score, issues: findings.length });
      setUsingRealData(true);
    } catch (err) {
      console.error("[audit-deck] PageSpeed fetch error", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`PageSpeed შემოწმება ვერ მოხერხდა.\n\nტექნიკური დეტალი: ${msg}`);
    } finally {
      setPsiLoading(false);
    }
  };

  const handleRichResultsCheck = async () => {
    const targetUrl = urlInput.trim() || rawUrl;
    if (!targetUrl) {
      alert("ჯერ შეიყვანე დომენი toolbar-ში ან გაუშვი ანალიზი /results გვერდიდან.");
      return;
    }
    setRichLoading(true);
    try {
      const raw =
        localStorage.getItem(storageKey(targetUrl)) ??
        sessionStorage.getItem(storageKey(targetUrl));
      if (!raw) {
        alert(
          "Rich Results შემოწმებისთვის ჯერ უნდა გაუშვა ანალიზი მთავარ გვერდზე (/results) ამავე დომენით."
        );
        return;
      }
      const stored = JSON.parse(raw) as StoredAnalysis;
      const rich = extractRichResultsFromAnalysis(stored.analysis);
      setRichPool(rich.findings);
      setRichInfo({
        hasSchema: rich.hasSchema,
        types: rich.schemaTypes,
        issues: rich.findings.length,
      });
      setUsingRealData(true);
    } catch (err) {
      console.error("[audit-deck] Rich Results error", err);
      alert("Rich Results შემოწმება ვერ მოხერხდა.");
    } finally {
      setRichLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setClientLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const [pptxLoading, setPptxLoading] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [presentIdx, setPresentIdx] = useState(0);
  const handlePptxExport = async () => {
    setPptxLoading(true);
    try {
      const [PptxGenJSModule] = await Promise.all([
        import("pptxgenjs"),
      ]);
      const PptxGenJS = (PptxGenJSModule as { default: new () => unknown }).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pres: any = new (PptxGenJS as any)();
      pres.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in

      const domToImage = (await import("dom-to-image-more")).default;
      const slideEls = document.querySelectorAll<HTMLElement>(".audit-slide");
      for (const el of Array.from(slideEls)) {
        const dataUrl: string = await domToImage.toPng(el, {
          width: el.offsetWidth,
          height: el.offsetHeight,
          style: { transform: "none" },
        });
        const imgData = dataUrl;
        const slide = pres.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
      }

      const safeDomain = (displayData.domain || "audit").replace(/[^a-z0-9.-]/gi, "_");
      await pres.writeFile({ fileName: `${safeDomain}-seo-audit.pptx` });
    } catch (err) {
      console.error("[audit-deck] PPTX export error", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`PowerPoint ფაილის შექმნა ვერ მოხერხდა.\n\nტექნიკური დეტალი: ${msg}`);
    } finally {
      setPptxLoading(false);
    }
  };

  // Build the slide order:
  // 1 cover, 2 assessment, then per chapter: 1 divider + N findings,
  // then competition, keyword strategy, "ჩვენ რას ვაკეთებთ" divider +
  // goals + offering.
  const slides: React.ReactNode[] = [];
  slides.push(<CoverSlide key="cover" data={displayData} clientLogoUrl={clientLogoUrl} onTitleChange={setCoverTitle} onSubtitleChange={setCoverSubtitle} />);
  slides.push(
    <AssessmentSlide
      key="assess"
      data={displayData}
      clientLogoUrl={clientLogoUrl}
      onDescriptionChange={setDescription}
    />
  );
  for (let ci = 0; ci < displayData.chapters.length; ci++) {
    const chapter = displayData.chapters[ci];
    slides.push(<ChapterDivider key={`div-${chapter.num}`} chapter={chapter} />);
    if (chapter.findings.length === 0) {
      slides.push(
        <NoFindingsSlide key={`nof-${chapter.num}`} chapter={chapter} data={displayData} clientLogoUrl={clientLogoUrl} />
      );
    }
    for (let fi = 0; fi < chapter.findings.length; fi++) {
      const finding = chapter.findings[fi];
      slides.push(
        <FindingSlide
          key={finding.num}
          finding={finding}
          chapter={chapter}
          data={displayData}
          clientLogoUrl={clientLogoUrl}
          screenshots={screenshots[finding.num] ?? []}
          onUpload={(slot, file) => handleScreenshotUpload(finding.num, slot, file)}
          onRemove={(slot) => handleScreenshotRemove(finding.num, slot)}
          onFindingChange={(updates) => setFinding(ci, fi, updates)}
        />
      );
    }
  }
  slides.push(
    <ChapterDivider
      key="div-comp"
      chapter={{ num: 3, caption: "კონკურენცია", title: "კონკურენტების ანალიზი", findings: [] }}
    />
  );
  slides.push(
    <CompetitionSlide
      key="comp"
      data={displayData}
      clientLogoUrl={clientLogoUrl}
      onIntroChange={setCompetitionIntro}
      onRowChange={setCompetitionRow}
    />
  );
  slides.push(
    <KeywordStrategySlide
      key="kws"
      data={displayData}
      clientLogoUrl={clientLogoUrl}
      onIntroChange={setKeywordIntro}
      onRowChange={setKeywordRow}
    />
  );
  slides.push(
    <ChapterDivider
      key="div-goal"
      chapter={{ num: 4, caption: "ჩვენ რას ვაკეთებთ", title: "ჩვენ რას ვაკეთებთ", findings: [] }}
    />
  );
  slides.push(
    <GoalsSlide
      key="goals"
      data={displayData}
      clientLogoUrl={clientLogoUrl}
      onGoalChange={setGoal}
    />
  );
  slides.push(<OfferingSlide key="off" data={displayData} clientLogoUrl={clientLogoUrl} onServiceTitleChange={setServiceTitle} onServiceItemChange={setServiceItem} />);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!presentMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setPresentIdx((i) => Math.min(i + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setPresentIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        setPresentMode(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presentMode, slides.length]);

  if (presentMode) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-black"
        style={{ ["--ad-primary" as string]: primary, ["--ad-accent" as string]: accent }}
      >
        {/* Slide */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div
            style={{
              width: "min(100vw, calc(100vh * 16 / 9))",
              maxHeight: "100%",
              aspectRatio: "16/9",
            }}
          >
            {slides[presentIdx]}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/80 text-white/60 text-sm">
          <button
            onClick={() => setPresentMode(false)}
            className="flex items-center gap-2 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            გასვლა (Esc)
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPresentIdx((i) => Math.max(i - 1, 0))}
              disabled={presentIdx === 0}
              className="px-3 py-1 rounded hover:text-white transition disabled:opacity-30"
            >
              ←
            </button>
            <span className="tabular-nums">{presentIdx + 1} / {slides.length}</span>
            <button
              onClick={() => setPresentIdx((i) => Math.min(i + 1, slides.length - 1))}
              disabled={presentIdx === slides.length - 1}
              className="px-3 py-1 rounded hover:text-white transition disabled:opacity-30"
            >
              →
            </button>
          </div>
          <span className="text-xs opacity-50">← → სლაიდები · Esc გასვლა</span>
        </div>
      </div>
    );
  }

  if (missingSnapshot && rawUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white text-center p-8">
        <svg className="w-16 h-16 mb-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <h2 className="text-2xl font-bold mb-3">ანალიზი ვერ მოიძებნა</h2>
        <p className="text-slate-400 mb-8 max-w-md leading-relaxed">
          ეს ბმული მუშაობს მხოლოდ იმ მოწყობილობაზე, სადაც ანალიზი ჩატარდა.
          ახლიდან გაუშვი ანალიზი ამ URL-ზე.
        </p>
        <a
          href={`/?url=${encodeURIComponent(rawUrl)}`}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          ანალიზის გაშვება: {rawUrl}
        </a>
      </div>
    );
  }

  return (
    <main
      className="audit-root min-h-screen bg-[#e7eaf0] py-6"
      style={{
        ["--ad-primary" as string]: primary,
        ["--ad-accent" as string]: accent,
      }}
    >
      {/* Data-source indicator: shows whether the deck is filled with real
          audit data (from /results) or the generic placeholder template.
          Hidden in print so it doesn't reach the client. */}
      <div
        data-print-hide
        className="max-w-[1100px] mx-auto px-4 mb-3"
      >
        {usingRealData ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-[11px] text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            რეალური audit მონაცემები ({rawUrl})
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            ნიმუშის ვერსია - ჯერ გაუშვი ანალიზი მთავარ გვერდზე
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div
        data-print-hide
        className="max-w-[1100px] mx-auto px-4 mb-6 flex flex-wrap items-end gap-3 bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            დომენი
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="client.ge"
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            ბრენდის სახელი
          </label>
          <input
            type="text"
            value={brandOverride}
            onChange={(e) => setBrandOverride(e.target.value)}
            placeholder={autoBrand}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            მთავარი
          </label>
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-14 rounded-lg border border-zinc-300 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            აქცენტი
          </label>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-10 w-14 rounded-lg border border-zinc-300 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            კლიენტის ლოგო
          </label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {clientLogoUrl ? (
            <div className="h-10 px-3 rounded-lg border border-zinc-300 inline-flex items-center gap-2 bg-zinc-50">
              <img
                src={clientLogoUrl}
                alt="logo"
                className="h-7 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setClientLogoUrl(null)}
                className="text-zinc-500 hover:text-zinc-900"
                aria-label="წაშლა"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="h-10 px-3 rounded-lg border border-zinc-300 text-sm inline-flex items-center gap-2 hover:bg-zinc-50 transition"
            >
              <Upload className="w-4 h-4" />
              ატვირთვა
            </button>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            Screaming Frog CSV
          </label>
          <input
            ref={sfInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleScreamingFrogUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => sfInputRef.current?.click()}
            className="h-10 px-3 rounded-lg border border-zinc-300 text-sm inline-flex items-center gap-2 hover:bg-zinc-50 transition"
            title="ატვირთე internal_html.csv Screaming Frog-დან"
          >
            <Upload className="w-4 h-4" />
            CSV იმპორტი
          </button>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            Rank Math PDF
          </label>
          <input
            ref={rmInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleRankMathUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => rmInputRef.current?.click()}
            disabled={rmLoading}
            className="h-10 px-3 rounded-lg border border-zinc-300 text-sm inline-flex items-center gap-2 hover:bg-zinc-50 transition disabled:opacity-60"
            title="ატვირთე Rank Math-ის SEO Analysis PDF რეპორტი"
          >
            <Upload className="w-4 h-4" />
            {rmLoading ? "იტვირთება..." : "PDF იმპორტი"}
          </button>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            PageSpeed
          </label>
          <button
            type="button"
            onClick={handlePageSpeedFetch}
            disabled={psiLoading}
            className="h-10 px-3 rounded-lg border border-zinc-300 text-sm inline-flex items-center gap-2 hover:bg-zinc-50 transition disabled:opacity-60"
            title="Google PageSpeed Insights API-ით სიჩქარის შემოწმება"
          >
            {psiLoading ? "მოწმდება..." : "შემოწმება"}
          </button>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-1.5">
            Rich Results
          </label>
          <button
            type="button"
            onClick={handleRichResultsCheck}
            disabled={richLoading}
            className="h-10 px-3 rounded-lg border border-zinc-300 text-sm inline-flex items-center gap-2 hover:bg-zinc-50 transition disabled:opacity-60"
            title="Schema.org სტრუქტურირებული მონაცემების შემოწმება"
          >
            {richLoading ? "მოწმდება..." : "შემოწმება"}
          </button>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="h-10 px-5 rounded-lg bg-zinc-900 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-zinc-700 transition"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
        <button
          type="button"
          onClick={handlePptxExport}
          disabled={pptxLoading}
          className="h-10 px-5 rounded-lg bg-orange-600 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-orange-700 transition disabled:opacity-60"
          title="PowerPoint (.pptx) ფაილად ჩამოწერა"
        >
          <Download className="w-4 h-4" />
          {pptxLoading ? "იქმნება..." : "PPTX"}
        </button>
        <button
          type="button"
          onClick={() => { setPresentIdx(0); setPresentMode(true); }}
          className="h-10 px-5 rounded-lg bg-slate-800 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-slate-900 transition"
          title="Presentation mode (fullscreen)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          პრეზენტაცია
        </button>
      </div>

      <div
        data-print-hide
        className="max-w-[1100px] mx-auto px-4 mb-4 flex flex-wrap gap-2"
      >
        {sfImportInfo && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Screaming Frog: {sfImportInfo.pages} გვერდი · {sfImportInfo.count} ხარვეზი
          </div>
        )}
        {rmImportInfo && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-[11px] text-violet-700">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            Rank Math: {rmImportInfo.score ?? "?"}/100 · {rmImportInfo.failed} შეცდომა + {rmImportInfo.warnings} გაფრთხილება{rmImportInfo.total ? ` ${rmImportInfo.total}-დან` : ""}
          </div>
        )}
        {psiInfo && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] text-orange-700">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            PageSpeed: {psiInfo.score ?? "?"}/100 · {psiInfo.issues} ხარვეზი
          </div>
        )}
        {richInfo && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Rich Results: {richInfo.hasSchema ? `${richInfo.types.length || "?"} schema ტიპი` : "schema არ ფიქსირდება"} · {richInfo.issues} ხარვეზი
          </div>
        )}
      </div>

      {/* Preset palette swatches */}
      <div
        data-print-hide
        className="max-w-[1100px] mx-auto px-4 mb-6 flex flex-wrap items-center gap-2"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mr-2 inline-flex items-center gap-1.5">
          <Palette className="w-3 h-3" />
          მზა პალიტრები:
        </span>
        {[
          { name: "Navy + Red", p: "#0A2540", a: "#DC2626" },
          { name: "Forest + Amber", p: "#1F3D2E", a: "#D69E2E" },
          { name: "Black + Orange", p: "#111111", a: "#FF6B35" },
          { name: "Slate + Cyan", p: "#1B2735", a: "#06B6D4" },
        ].map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => {
              setPrimary(preset.p);
              setAccent(preset.a);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-white border border-zinc-200 hover:border-zinc-400 transition text-xs text-zinc-700"
          >
            <span className="w-3 h-3 rounded-full" style={{ background: preset.p }} />
            <span className="w-3 h-3 rounded-full" style={{ background: preset.a }} />
            {preset.name}
          </button>
        ))}
      </div>

      {/* Slide deck */}
      <div className="audit-deck max-w-[1100px] mx-auto space-y-6 px-4">{slides}</div>
    </main>
  );
}

// ─── inline editing ───────────────────────────────────────────────────
// Click-to-edit text wrapper. Renders text in display mode, switches to an
// input (or textarea for multiline) on click. Commits on blur or Enter.
// The hover styling marks the field as editable without cluttering the
// printed PDF (hover styles don't apply on paper).

function Editable({
  value,
  onChange,
  multiline = false,
  className = "",
  placeholder = "...",
}: {
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (!editing) setLocal(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (local !== value) onChange(local);
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setLocal(value);
              setEditing(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
          }}
          className={`block w-full bg-amber-50 border border-amber-400 rounded px-2 py-1 outline-none ${className}`}
          rows={4}
        />
      );
    }
    return (
      <input
        autoFocus
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setLocal(value);
            setEditing(false);
          }
          if (e.key === "Enter") commit();
        }}
        className={`bg-amber-50 border border-amber-400 rounded px-2 py-1 outline-none ${className}`}
        style={{ minWidth: "60px" }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      data-print-text
      className={`cursor-text rounded transition hover:bg-amber-50/60 hover:shadow-[inset_0_-1px_0_0_rgba(217,119,6,0.4)] ${className}`}
    >
      {value || (
        <span className="text-zinc-400 italic">{placeholder}</span>
      )}
    </span>
  );
}

// ─── shared chrome ─────────────────────────────────────────────────────

function SlideShell({
  children,
  dark = false,
  withHeader = true,
  data,
  clientLogoUrl,
  chapterCaption,
}: {
  children: React.ReactNode;
  dark?: boolean;
  withHeader?: boolean;
  data: AuditData;
  clientLogoUrl: string | null;
  chapterCaption?: string;
}) {
  return (
    <section
      className="audit-slide relative rounded-2xl shadow-[0_1px_12px_-4px_rgba(0,0,0,0.10)] border border-zinc-100 overflow-hidden"
      style={
        dark
          ? {
              backgroundColor: "var(--ad-primary)",
              color: "var(--ad-on-primary)",
            }
          : { backgroundColor: "#FFFFFF" }
      }
    >
      <div
        className="relative"
        style={{ aspectRatio: "16 / 9", minHeight: "520px" }}
      >
        <div className="absolute inset-0 p-10 lg:p-12 flex flex-col">
          {withHeader && !dark && (
            <div className="flex items-center justify-between mb-6">
              <BrandPair data={data} clientLogoUrl={clientLogoUrl} />
              {chapterCaption && (
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.32em]"
                  style={{ color: "var(--ad-ink)" }}
                >
                  {chapterCaption}
                </span>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

function BrandPair({
  data,
  clientLogoUrl,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="px-3 py-2 rounded-lg bg-white border border-zinc-200 shadow-sm">
        <div
          className="text-[18px] font-bold leading-none"
          style={{ color: "var(--ad-primary)" }}
        >
          infinity
        </div>
        <div
          className="text-[11px] font-bold tracking-tight"
          style={{ color: "var(--ad-primary)" }}
        >
          solutions.
        </div>
      </div>
      <span className="text-zinc-300 text-lg">×</span>
      <div className="px-3 py-2 rounded-lg bg-white border border-zinc-200 shadow-sm min-h-[44px] inline-flex items-center">
        {clientLogoUrl ? (
          <img
            src={clientLogoUrl}
            alt={data.brandName}
            className="h-7 w-auto object-contain max-w-[140px]"
          />
        ) : (
          <span className="text-[14px] font-bold italic text-zinc-900">
            {data.brandName}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const label =
    status === "bad"
      ? "გაუმართავია"
      : status === "partial"
      ? "ნაწილობრივ"
      : "კარგად მუშაობს";
  const cls =
    status === "bad"
      ? "bg-red-100 text-red-700 border border-red-200"
      : status === "partial"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-green-100 text-green-700 border border-green-200";
  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[12px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── slide components ──────────────────────────────────────────────────

function CoverSlide({
  data,
  clientLogoUrl,
  onTitleChange,
  onSubtitleChange,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
}) {
  return (
    <SlideShell dark withHeader={false} data={data} clientLogoUrl={clientLogoUrl}>
      {/* Brand pair top-left */}
      <div className="mb-12">
        <BrandPair data={data} clientLogoUrl={clientLogoUrl} />
      </div>

      {/* Decorative "SEO" mega-text right side */}
      <div
        className="absolute top-12 right-0 select-none pointer-events-none"
        aria-hidden="true"
        style={{
          fontSize: "clamp(11rem, 24vw, 22rem)",
          lineHeight: 0.85,
          fontFamily: "var(--font-serif), serif",
          color: "var(--ad-on-primary)",
          opacity: 0.05,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        SEO
      </div>

      <div className="mt-auto mb-auto max-w-[60%]">
        <h1
          className="font-bold tracking-tight leading-[1.05] mb-4"
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            color: "var(--ad-on-primary)",
            fontFamily: "var(--font-serif), serif",
          }}
        >
          <Editable value={data.coverTitle ?? "ვებსაიტის SEO აუდიტი"} onChange={onTitleChange} />
        </h1>
        <p
          className="text-2xl mb-2"
          style={{
            color: "var(--ad-accent)",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {data.domain}
        </p>
        <p
          className="text-sm mt-6 font-mono"
          style={{ color: "var(--ad-on-primary-muted)" }}
        >
          <Editable value={data.coverSubtitle ?? "ტექნიკური · On-page · Off-page · კონკურენტული ანალიზი"} onChange={onSubtitleChange} />
        </p>
      </div>
    </SlideShell>
  );
}

function AssessmentSlide({
  data,
  clientLogoUrl,
  onDescriptionChange,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl}>
      <h2
        className="font-bold leading-tight tracking-tight mb-4"
        style={{
          fontSize: "clamp(2rem, 4.5vw, 3rem)",
          color: "var(--ad-ink)",
          fontFamily: "var(--font-serif), serif",
        }}
      >
        შეფასება
      </h2>
      <div className="text-[14px] text-zinc-700 leading-relaxed max-w-[55%] mb-6">
        <span className="font-semibold">{data.domain}</span> -{" "}
        <Editable
          multiline
          value={data.description}
          onChange={onDescriptionChange}
          className="text-[14px] text-zinc-700 leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Left: 4 score cards */}
        <div className="grid grid-cols-2 gap-3 content-start">
          {[
            { value: data.scores.rankMath, label: "Rank Math", color: "#DC2626" },
            { value: data.scores.passed, label: "passed", color: "#D97706" },
            { value: data.scores.failed, label: "Failed", color: "#DC2626" },
            { value: data.scores.warnings, label: "გაფრთხილება", color: "#D97706" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-zinc-50 border border-zinc-200 p-5 text-center"
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{
                  color: s.color,
                  fontFamily: "var(--font-serif), serif",
                }}
              >
                {s.value}
              </div>
              <div className="text-[11px] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Right: key findings */}
        <div>
          <p
            className="text-[10px] font-mono uppercase tracking-[0.22em] mb-4"
            style={{ color: "var(--ad-ink)" }}
          >
            მთავარი მიგნებები
          </p>
          <ul className="space-y-3">
            {data.keyFindings.map((f, i) => (
              <li key={i} className="flex gap-3 text-[12px]">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: f.severity === "high" ? "#DC2626" : "#D97706" }}
                />
                <span className="text-zinc-700 leading-relaxed">
                  <span className="font-semibold text-zinc-900">{f.category}</span>{" "}
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}

function ChapterDivider({ chapter }: { chapter: Chapter }) {
  return (
    <section
      className="audit-slide relative rounded-2xl shadow-[0_1px_12px_-4px_rgba(0,0,0,0.10)] border border-zinc-100 overflow-hidden"
      style={{
        backgroundColor: "var(--ad-primary)",
        color: "var(--ad-on-primary)",
      }}
    >
      <div className="relative" style={{ aspectRatio: "16 / 9", minHeight: "520px" }}>
        {/* Ghost chapter numeral */}
        <div
          className="absolute bottom-0 right-0 select-none pointer-events-none leading-none"
          aria-hidden="true"
          style={{
            fontSize: "clamp(14rem, 28vw, 20rem)",
            fontFamily: "var(--font-serif), serif",
            fontWeight: 700,
            color: "var(--ad-on-primary)",
            opacity: 0.06,
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
          }}
        >
          {chapter.num}
        </div>
        <div className="absolute inset-0 p-10 lg:p-14 flex flex-col justify-center">
          <div
            className="w-12 mb-6"
            style={{ height: "3px", background: "var(--ad-accent)" }}
          />
          <p
            className="text-[11px] font-mono uppercase tracking-[0.4em] mb-4"
            style={{ color: "var(--ad-accent)" }}
          >
            ნაწილი {chapter.num}
          </p>
          <h2
            className="font-bold leading-tight tracking-tight"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              color: "var(--ad-on-primary)",
              fontFamily: "var(--font-serif), serif",
            }}
          >
            {chapter.title}
          </h2>
        </div>
      </div>
    </section>
  );
}

function NoFindingsSlide({
  chapter,
  data,
  clientLogoUrl,
}: {
  chapter: Chapter;
  data: AuditData;
  clientLogoUrl: string | null;
}) {
  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl} chapterCaption={chapter.caption}>
      <div className="flex flex-col items-center justify-center flex-1 text-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
          style={{ background: "color-mix(in srgb, var(--ad-accent) 10%, white)" }}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: "var(--ad-accent)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h3
          className="font-bold"
          style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", color: "var(--ad-ink)", fontFamily: "var(--font-serif), serif" }}
        >
          ამ კატეგორიაში პრობლემა არ გამოვლინდა
        </h3>
        <p className="text-[14px] text-zinc-500 max-w-md leading-relaxed">
          {chapter.caption} განყოფილება შემოწმდა - კრიტიკული ან გასაუმჯობესებელი საკითხი არ აღმოჩნდა.
        </p>
      </div>
    </SlideShell>
  );
}

function FindingSlide({
  finding,
  chapter,
  data,
  clientLogoUrl,
  screenshots,
  onUpload,
  onRemove,
  onFindingChange,
}: {
  finding: Finding;
  chapter: Chapter;
  data: AuditData;
  clientLogoUrl: string | null;
  screenshots: string[];
  onUpload: (slot: number, file: File) => void;
  onRemove: (slot: number) => void;
  onFindingChange: (updates: Partial<Finding>) => void;
}) {
  // Hint text per finding category - suggests where to get the screenshot.
  // Drives the placeholder so the user knows which screenshot to capture.
  const hint = screenshotHintFor(finding.num);

  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl} chapterCaption={chapter.caption}>
      <div className="flex items-start gap-5 mb-5">
        <span
          className="text-[28px] font-bold leading-none mt-1"
          style={{
            color: "var(--ad-accent)",
            opacity: 0.4,
            fontFamily: "var(--font-serif), serif",
          }}
        >
          {finding.num}
        </span>
        <h2
          className="font-bold leading-tight tracking-tight flex-1"
          style={{
            fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)",
            color: "var(--ad-ink)",
            fontFamily: "var(--font-serif), serif",
          }}
        >
          <Editable
            value={finding.title}
            onChange={(v) => onFindingChange({ title: v })}
          />
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Left: status + problem */}
        <div>
          <div className="mb-4">
            <StatusPill status={finding.status} />
          </div>
          <p
            className="text-[10px] font-mono uppercase tracking-[0.22em] mb-2"
            style={{ color: "var(--ad-ink)" }}
          >
            პრობლემა
          </p>
          <ul className="space-y-2 text-[13px] text-zinc-700 leading-relaxed">
            {finding.problem.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-zinc-400 mt-1">•</span>
                <span className="flex-1">
                  <Editable
                    multiline
                    value={p}
                    onChange={(v) => {
                      const next = [...finding.problem];
                      next[i] = v;
                      onFindingChange({ problem: next });
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>

          {/* Plain-language explanation for non-technical clients */}
          <div className="mt-4">
            <p
              className="text-[10px] font-mono uppercase tracking-[0.22em] mb-2"
              style={{ color: "var(--ad-ink)" }}
            >
              რას ნიშნავს
            </p>
            <p className="text-[12px] text-zinc-600 leading-relaxed italic">
              <Editable
                multiline
                value={finding.explanation ?? "დააჭირე და ჩაწერე კლიენტისთვის გასაგები ახსნა..."}
                onChange={(v) => onFindingChange({ explanation: v })}
              />
            </p>
          </div>
        </div>

        {/* Right: screenshot evidence slots */}
        <div className="space-y-3">
          <ScreenshotSlot
            findingNum={finding.num}
            slotIndex={0}
            imageUrl={screenshots[0]}
            hint={hint}
            onUpload={(file) => onUpload(0, file)}
            onRemove={() => onRemove(0)}
          />
          {screenshots[0] && (
            <ScreenshotSlot
              findingNum={finding.num}
              slotIndex={1}
              imageUrl={screenshots[1]}
              hint={hint}
              onUpload={(file) => onUpload(1, file)}
              onRemove={() => onRemove(1)}
              secondary
            />
          )}
        </div>
      </div>

      {/* Bottom: solution box */}
      <div
        className="mt-6 rounded-xl p-5 border-l-4"
        style={{
          background: "color-mix(in srgb, var(--ad-accent) 8%, white)",
          borderLeftColor: "var(--ad-accent)",
        }}
      >
        <p
          className="text-[10px] font-mono uppercase tracking-[0.22em] mb-2"
          style={{ color: "var(--ad-accent)" }}
        >
          გადაწყვეტა
        </p>
        <p className="text-[13px] text-zinc-700 leading-relaxed">
          <Editable
            multiline
            value={finding.solution}
            onChange={(v) => onFindingChange({ solution: v })}
          />
        </p>
      </div>
    </SlideShell>
  );
}

// Per-finding hint that tells the user which trusted source to grab the
// screenshot from. Maps finding number to a recommended tool.
function screenshotHintFor(num: string): string {
  const map: Record<string, string> = {
    "1.1": "Google Search Console - Sitemaps section",
    "1.2": "Rank Math - Canonical Missing report",
    "1.3": "Rank Math - Meta Description report",
    "1.4": "Google Rich Results Test",
    "1.5": "PageSpeed Insights / Lighthouse",
    "1.6": "Rank Math - Images audit (without ALT/TITLE)",
    "1.7": "SecurityHeaders.com report",
    "2.1": "Rank Math - Title & Description issues",
    "2.2": "Rank Math - H1/H2 structure report",
  };
  return map[num] ?? "სანდო წყაროდან: Rank Math / Lighthouse / Search Console";
}

function ScreenshotSlot({
  findingNum,
  slotIndex,
  imageUrl,
  hint,
  onUpload,
  onRemove,
  secondary = false,
}: {
  findingNum: string;
  slotIndex: number;
  imageUrl?: string;
  hint: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  secondary?: boolean;
}) {
  const inputId = `ss-${findingNum.replace(".", "-")}-${slotIndex}`;
  const isDragOver = useDragOver();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onUpload(file);
  };

  if (imageUrl) {
    return (
      <div className="relative rounded-xl border border-zinc-200 bg-white overflow-hidden group">
        <img
          src={imageUrl}
          alt={`Evidence ${findingNum} - ${slotIndex + 1}`}
          className="w-full h-auto object-contain max-h-[280px]"
        />
        <button
          type="button"
          onClick={onRemove}
          data-print-hide
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-zinc-200 inline-flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition"
          aria-label="წაშლა"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Empty slot - upload prompt. Hidden when printing so empty placeholders
  // don't leak into the client-facing PDF.
  return (
    <label
      htmlFor={inputId}
      data-print-hide
      onDragOver={(e) => {
        e.preventDefault();
        isDragOver.set(true);
      }}
      onDragLeave={() => isDragOver.set(false)}
      onDrop={(e) => {
        e.preventDefault();
        isDragOver.set(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`relative block rounded-xl border-2 border-dashed cursor-pointer transition p-6 text-center ${
        isDragOver.value
          ? "border-zinc-700 bg-zinc-50"
          : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-50"
      }`}
      style={{ minHeight: secondary ? "100px" : "180px" }}
    >
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Upload className="w-6 h-6 mx-auto text-zinc-400 mb-2" />
      <p className="text-[13px] font-semibold text-zinc-700 mb-1">
        {secondary ? "მე-2 სკრინი (არჩევითი)" : "ატვირთე სკრინი"}
      </p>
      <p className="text-[11px] text-zinc-500 leading-snug">{hint}</p>
    </label>
  );
}

// Tiny drag-over state hook. Replaces a useState pair with a slightly nicer
// API for the JSX above; keeping it inside the file since it's only used here.
function useDragOver() {
  const [value, setValue] = useState(false);
  return { value, set: setValue };
}

function CompetitionSlide({
  data,
  clientLogoUrl,
  onIntroChange,
  onRowChange,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
  onIntroChange: (v: string) => void;
  onRowChange: (rowIdx: number, updates: Partial<CompetitorRow>) => void;
}) {
  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl} chapterCaption="კონკურენცია">
      <h2
        className="font-bold leading-tight tracking-tight mb-3"
        style={{
          fontSize: "clamp(1.75rem, 3.6vw, 2.6rem)",
          color: "var(--ad-ink)",
          fontFamily: "var(--font-serif), serif",
        }}
      >
        კონკურენტული გარემო
      </h2>
      <p className="text-[13px] text-zinc-700 leading-relaxed max-w-[85%] mb-5">
        <Editable
          multiline
          value={data.competition.intro}
          onChange={onIntroChange}
        />
      </p>

      <div className="rounded-xl overflow-hidden border border-zinc-200">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr style={{ background: "var(--ad-primary)" }}>
              {["კონკურენტი", "ტიპი", "ძლიერი მხარე", "თქვენი შანსი"].map((h, i) => (
                <th
                  key={i}
                  className="text-left font-semibold px-4 py-3"
                  style={{ color: "var(--ad-on-primary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.competition.rows.map((r, i) => {
              const isBrand =
                r.name.toLowerCase().includes(data.brandName.toLowerCase()) ||
                r.name === "თქვენი საიტი";
              return (
                <tr
                  key={i}
                  className="border-t border-zinc-100"
                  style={{
                    background: isBrand
                      ? "rgba(74,144,226,0.06)"
                      : i % 2 === 0
                      ? "#FFFFFF"
                      : "#FAFAFA",
                  }}
                >
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    <Editable
                      value={r.name}
                      onChange={(v) => onRowChange(i, { name: v })}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    <Editable
                      value={r.type}
                      onChange={(v) => onRowChange(i, { type: v })}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    <Editable
                      value={r.strength}
                      onChange={(v) => onRowChange(i, { strength: v })}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-700 font-medium">
                    <Editable
                      value={r.opportunity}
                      onChange={(v) => onRowChange(i, { opportunity: v })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}

function KeywordStrategySlide({
  data,
  clientLogoUrl,
  onIntroChange,
  onRowChange,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
  onIntroChange: (v: string) => void;
  onRowChange: (rowIdx: number, updates: Partial<KeywordRow>) => void;
}) {
  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl} chapterCaption="KEYWORD სტრატეგია">
      <h2
        className="font-bold leading-tight tracking-tight mb-3"
        style={{
          fontSize: "clamp(1.75rem, 3.6vw, 2.6rem)",
          color: "var(--ad-ink)",
          fontFamily: "var(--font-serif), serif",
        }}
      >
        საძიებო სიტყვების სტრატეგია
      </h2>
      <p className="text-[13px] text-zinc-700 leading-relaxed max-w-[85%] mb-5">
        <Editable
          multiline
          value={data.keywordStrategy.intro}
          onChange={onIntroChange}
        />
      </p>

      <div className="rounded-xl overflow-hidden border border-zinc-200">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr style={{ background: "var(--ad-primary)" }}>
              {["პრიორიტეტი", "საძიებო ფრაზა (მაგ.)", "ტიპი", "რეალისტურობა"].map((h, i) => (
                <th
                  key={i}
                  className="text-left font-semibold px-4 py-3"
                  style={{ color: "var(--ad-on-primary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.keywordStrategy.rows.map((r, i) => {
              const priorityColor =
                r.priority === "მაღალი"
                  ? "#16A34A"
                  : r.priority === "საშუალო"
                  ? "#D97706"
                  : "#DC2626";
              return (
                <tr
                  key={i}
                  className="border-t border-zinc-100"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}
                >
                  <td
                    className="px-4 py-3 font-semibold"
                    style={{ color: priorityColor }}
                  >
                    <Editable
                      value={r.priority}
                      onChange={(v) => {
                        const norm = v.trim();
                        const priority: KeywordRow["priority"] =
                          norm === "მაღალი" || norm === "საშუალო" || norm === "დაბალი"
                            ? norm
                            : r.priority;
                        onRowChange(i, { priority });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-900">
                    <Editable
                      value={r.phrase}
                      onChange={(v) => onRowChange(i, { phrase: v })}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    <Editable
                      value={r.type}
                      onChange={(v) => onRowChange(i, { type: v })}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    <Editable
                      value={r.realism}
                      onChange={(v) => onRowChange(i, { realism: v })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}

function GoalsSlide({
  data,
  clientLogoUrl,
  onGoalChange,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
  onGoalChange: (goalIdx: number, updates: Partial<Goal>) => void;
}) {
  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl} chapterCaption="ჩვენ რას ვაკეთებთ">
      <h2
        className="font-bold leading-tight tracking-tight mb-6"
        style={{
          fontSize: "clamp(1.75rem, 3.6vw, 2.6rem)",
          color: "var(--ad-ink)",
          fontFamily: "var(--font-serif), serif",
        }}
      >
        ჩვენ რას ვაკეთებთ
      </h2>

      <div className="space-y-3 flex-1">
        {data.goals.map((g, i) => (
          <div
            key={i}
            className="rounded-xl bg-zinc-50 p-5 grid grid-cols-[280px_1fr] gap-6 items-start"
          >
            <div className="flex gap-3 items-start">
              <span
                className="w-1.5 h-full rounded-full self-stretch shrink-0"
                style={{ background: g.color, minHeight: "44px" }}
              />
              <p className="text-[14px] font-bold text-zinc-900 leading-snug">
                <Editable
                  value={g.title}
                  onChange={(v) => onGoalChange(i, { title: v })}
                />
              </p>
            </div>
            <p className="text-[13px] text-zinc-700 leading-relaxed">
              <Editable
                multiline
                value={g.body}
                onChange={(v) => onGoalChange(i, { body: v })}
              />
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function OfferingSlide({
  data,
  clientLogoUrl,
  onServiceTitleChange,
  onServiceItemChange,
}: {
  data: AuditData;
  clientLogoUrl: string | null;
  onServiceTitleChange: (colIdx: number, v: string) => void;
  onServiceItemChange: (colIdx: number, itemIdx: number, v: string) => void;
}) {
  return (
    <SlideShell data={data} clientLogoUrl={clientLogoUrl} chapterCaption="INFINITY">
      <h2
        className="font-bold leading-tight tracking-tight mb-6"
        style={{
          fontSize: "clamp(1.75rem, 3.6vw, 2.6rem)",
          color: "var(--ad-ink)",
          fontFamily: "var(--font-serif), serif",
        }}
      >
        რას გთავაზობთ - SEO INFINITY
      </h2>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {data.services.map((s, i) => (
          <div
            key={i}
            className="rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden flex flex-col"
          >
            <div className="h-1.5 w-full" style={{ background: s.color }} />
            <div className="p-5 flex-1 flex flex-col">
              <h3
                className="text-[15px] font-bold mb-4 leading-snug"
                style={{ color: "var(--ad-ink)" }}
              >
                <Editable value={s.title} onChange={(v) => onServiceTitleChange(i, v)} />
              </h3>
              <ul className="space-y-2 text-[12px] text-zinc-700">
                {s.items.map((it, j) => (
                  <li key={j} className="flex gap-2 leading-snug">
                    <span className="text-zinc-400">•</span>
                    <span>
                      <Editable value={it} onChange={(v) => onServiceItemChange(i, j, v)} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-[11px] font-mono text-zinc-500 tracking-wider">
        INFINITY SOLUTIONS · SEO აუდიტი · {data.domain}
      </div>
    </SlideShell>
  );
}
