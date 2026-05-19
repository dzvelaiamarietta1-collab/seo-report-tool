import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult, CategoryKey, CheckResult } from "./types";

// AI executive summary generator — uses Gemini Flash for cheap fast
// generation in Georgian. The audit JSON is condensed before sending
// (we don't need to feed 50KB of metadata for a 2-paragraph summary),
// and the model gets a strict system prompt so output is predictable.

// gemini-2.5-flash is the current cheap GA model in May 2026. Older
// 1.5/2.0 names return 404; 2.5-flash is the right baseline for
// summary-style work with Georgian output.
const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `შენ ხარ პროფესიონალური SEO სპეციალისტი, რომელიც ქართულად წერ მოკლე, კონკრეტულ executive summary-ს კლიენტისთვის.

წესები:
1. ენა — საქართველოს ქართული, პროფესიონალური, კლიენტ-ფეისინგი (არც ძალიან ფორმალური, არც ბავშვური).
2. სიგრძე — 2 პარაგრაფი, თითო 60-120 სიტყვის ფარგლებში. პირველი: ზოგადი მდგომარეობა (ქულის ახსნა მუშტრის ენით). მეორე: TOP 3 პრიორიტეტი + სავარაუდო ეფექტი.
3. ციფრები პირდაპირ audit-დან — არ მოიგონო. თუ რომელიმე მონაცემი არ არის მოწოდებული — არ ახსენო.
4. ტექნიკური ჟარგონი მინიმუმამდე — "title tag" ❌ → "გვერდის სათაური" ✓. "LCP" ❌ → "გვერდის ჩატვირთვის სიჩქარე" ✓.
5. ციტატები ან quotation marks-ი არ გამოიყენო — ცხადი ქართული წინადადებებით.
6. არ დაიწყო "გამარჯობა" ან "მოხარული ვარ" ფრაზებით — პირდაპირ ფაქტებზე.
7. ფინალური ფრაზა — call to action: "მზად ვართ ეს გავაუმჯობესოთ" ან მსგავსი.
8. **არასოდეს გააწყვიტო წინადადება შუაში** — ბოლო პუნქტამდე დაიყვანე.

გამოსავალი — მხოლოდ 2 პარაგრაფი. არანაირი მარკდაუნი, headers, bullets. ცარიელი ხაზი მხოლოდ პარაგრაფებს შორის.`;

// Condense the audit into a model-friendly payload. The original
// AnalysisResult has all check details and big check.value arrays;
// the model only needs the score, the top issues by status, and the
// performance numbers (which it can paraphrase). Keeping the payload
// small also reduces token cost and improves response time.
interface CondensedAudit {
  hostname: string;
  score: number;
  passed: number;
  warnings: number;
  failed: number;
  totalChecks: number;
  topFailures: { category: string; label: string; message: string }[];
  topWarnings: { category: string; label: string; message: string }[];
  perfHighlights: {
    metric: string;
    value: string;
    band: "good" | "needs-improvement" | "poor" | "n/a";
  }[];
  schemaTypes: string[];
}

const CATEGORY_LABEL_GE: Record<CategoryKey, string> = {
  technical: "ტექნიკური",
  onPage: "On-Page",
  performance: "Performance",
  schema: "Schema",
  linkHealth: "ბმულები",
  aiEra: "AI ეპოქა",
};

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

function condenseAudit(analysis: AnalysisResult): CondensedAudit {
  const fails: CondensedAudit["topFailures"] = [];
  const warns: CondensedAudit["topWarnings"] = [];
  let schemaTypes: string[] = [];

  for (const catKey of Object.keys(analysis.categories) as CategoryKey[]) {
    const cat = analysis.categories[catKey];
    if (!cat) continue;
    for (const c of cat.checks) {
      const entry = {
        category: CATEGORY_LABEL_GE[catKey],
        label: c.label,
        message: c.message,
      };
      if (c.status === "fail") fails.push(entry);
      else if (c.status === "warn") warns.push(entry);

      // Pull schema type list off the JSON-LD check value.
      if (
        catKey === "schema" &&
        c.label.includes("Schema Markup") &&
        Array.isArray(c.value)
      ) {
        schemaTypes = c.value.filter((v): v is string => typeof v === "string");
      }
    }
  }

  const perfHighlights: CondensedAudit["perfHighlights"] = [];
  const perfCat = analysis.categories.performance;
  if (perfCat) {
    for (const c of perfCat.checks) {
      if (!["LCP", "INP", "CLS", "FCP", "TBT"].includes(c.label)) continue;
      const band =
        c.status === "pass"
          ? "good"
          : c.status === "warn"
          ? "needs-improvement"
          : c.status === "fail"
          ? "poor"
          : "n/a";
      perfHighlights.push({
        metric: c.label,
        value: String(c.value ?? ""),
        band,
      });
    }
  }

  return {
    hostname: hostFromUrl(analysis.finalUrl ?? analysis.url),
    score: analysis.summary.score,
    passed: analysis.summary.passed,
    warnings: analysis.summary.warnings,
    failed: analysis.summary.failed,
    totalChecks: analysis.summary.totalChecks,
    topFailures: fails.slice(0, 6),
    topWarnings: warns.slice(0, 6),
    perfHighlights,
    schemaTypes: schemaTypes.slice(0, 8),
  };
}

function buildUserPrompt(audit: CondensedAudit): string {
  const lines: string[] = [];
  lines.push(`საიტი: ${audit.hostname}`);
  lines.push(
    `საერთო ქულა: ${audit.score}/100 (${audit.passed} ✓, ${audit.warnings} ⚠, ${audit.failed} ✗, სულ ${audit.totalChecks} შემოწმება)`
  );

  if (audit.topFailures.length > 0) {
    lines.push("");
    lines.push("კრიტიკული პრობლემები (fail):");
    for (const f of audit.topFailures) {
      lines.push(`- [${f.category}] ${f.label}: ${f.message}`);
    }
  }

  if (audit.topWarnings.length > 0) {
    lines.push("");
    lines.push("გასაუმჯობესებელი (warn):");
    for (const w of audit.topWarnings.slice(0, 4)) {
      lines.push(`- [${w.category}] ${w.label}: ${w.message}`);
    }
  }

  if (audit.perfHighlights.length > 0) {
    lines.push("");
    lines.push("Performance მონაცემები:");
    for (const p of audit.perfHighlights) {
      lines.push(`- ${p.metric}: ${p.value} (${p.band})`);
    }
  }

  if (audit.schemaTypes.length > 0) {
    lines.push("");
    lines.push(`Schema types: ${audit.schemaTypes.join(", ")}`);
  }

  lines.push("");
  lines.push("დაწერე 2-პარაგრაფიანი executive summary ქართულად.");
  return lines.join("\n");
}

export interface SummaryResult {
  text: string;
  model: string;
  promptChars: number;
  responseChars: number;
}

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (cachedClient) return cachedClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY not configured — set it in .env.local and Vercel env"
    );
  }
  cachedClient = new GoogleGenerativeAI(key);
  return cachedClient;
}

export async function generateExecutiveSummary(
  analysis: AnalysisResult
): Promise<SummaryResult> {
  const condensed = condenseAudit(analysis);
  const userPrompt = buildUserPrompt(condensed);

  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.4, // a bit of creativity, mostly grounded
      // Georgian characters cost ~2-3 tokens each in Gemini's tokenizer,
      // so 600 tokens was clipping mid-sentence on real summaries (the
      // observed bug — "საერთო ქ..." truncated). 2000 fits a full two
      // paragraphs (~250 words) with ~30% headroom.
      maxOutputTokens: 2000,
    },
  });

  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini-მ ცარიელი response დააბრუნა");

  return {
    text,
    model: MODEL,
    promptChars: userPrompt.length + SYSTEM_PROMPT.length,
    responseChars: text.length,
  };
}
