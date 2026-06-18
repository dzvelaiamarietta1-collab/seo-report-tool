// Extract candidate keyword phrases from audit data so the client-facing
// SEO process page can show "your site's likely search terms" rather
// than asking the user to imagine them. Best-effort: pulls phrases from
// title, description, H1, H2 and dedupes; falls back to generic SEO
// keywords if no audit data is in storage.

type PreviewLike = {
  title?: string | null;
  description?: string | null;
  og?: { title?: string | null; description?: string | null } | null;
  twitter?: { title?: string | null; description?: string | null } | null;
};

type AnalysisLike = {
  categories?: Record<
    string,
    {
      checks?: Array<{
        label?: unknown;
        value?: unknown;
      }>;
    }
  >;
};

// Common Georgian + English stop-words that shouldn't dominate the
// candidate list. Lightweight - not exhaustive.
const STOP_WORDS = new Set([
  "და", "ან", "თუ", "რომ", "ეს", "ის", "ჩვენ", "თქვენ", "მე", "შენ",
  "the", "and", "or", "if", "this", "that", "for", "with", "from",
  "in", "on", "to", "of", "a", "an", "is", "are", "was", "were",
  "be", "by", "at", "as", "it", "we", "you", "your", "our",
]);

function cleanText(s: string): string {
  return s
    .replace(/[|·•\-_:;,.!?()\[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitIntoPhrases(text: string): string[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  const words = cleaned.split(" ").filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const phrases: string[] = [];
  // 2-3 word phrases (often the most useful keywords)
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words.slice(i, i + 2).join(" "));
    if (i < words.length - 2) {
      phrases.push(words.slice(i, i + 3).join(" "));
    }
  }
  // Also single words that are long enough to be meaningful
  for (const w of words) {
    if (w.length >= 5) phrases.push(w);
  }
  return phrases;
}

const FALLBACK_KEYWORDS = [
  "თქვენი ბრენდი",
  "თქვენი მთავარი სერვისი",
  "თქვენი მთავარი პროდუქტი",
  "სერვისი თბილისში",
  "ფასი",
  "ონლაინ შეკვეთა",
];

export function extractKeywords(
  preview: PreviewLike | null | undefined,
  analysis: AnalysisLike | null | undefined,
  hostname?: string
): string[] {
  const counts = new Map<string, number>();
  const ingest = (s?: string | null) => {
    if (!s || typeof s !== "string") return;
    for (const phrase of splitIntoPhrases(s)) {
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  };

  ingest(preview?.title);
  ingest(preview?.description);
  ingest(preview?.og?.title);
  ingest(preview?.og?.description);
  ingest(preview?.twitter?.title);
  ingest(preview?.twitter?.description);

  // Pull from analysis category checks where value carries useful text
  if (analysis?.categories) {
    for (const cat of Object.values(analysis.categories)) {
      const checks = cat?.checks ?? [];
      for (const c of checks) {
        if (typeof c.value === "string") ingest(c.value);
        if (typeof c.label === "string") {
          // Avoid SEO jargon labels - only ingest if it's not a known term
          const lbl = c.label.toLowerCase();
          if (
            !lbl.includes("schema") &&
            !lbl.includes("canonical") &&
            !lbl.includes("https") &&
            !lbl.includes("title")
          ) {
            // skip - labels are mostly SEO terminology, not keywords
          }
        }
      }
    }
  }

  // Strip hostname (we don't want "infinity.ge" as a keyword)
  if (hostname) {
    const hostBits = hostname.toLowerCase().split(".");
    for (const bit of hostBits) {
      counts.delete(bit);
    }
  }

  // Sort by frequency, then prefer phrases over single words (longer = more specific)
  const sorted = [...counts.entries()]
    .filter(([phrase]) => phrase.length >= 4 && phrase.length <= 60)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].length - a[0].length;
    })
    .map(([phrase]) => phrase);

  // Dedupe - drop phrases that are substrings of longer ones we already picked
  const picked: string[] = [];
  for (const phrase of sorted) {
    if (picked.some((p) => p.includes(phrase))) continue;
    picked.push(phrase);
    if (picked.length >= 10) break;
  }

  return picked.length >= 5 ? picked : FALLBACK_KEYWORDS;
}
