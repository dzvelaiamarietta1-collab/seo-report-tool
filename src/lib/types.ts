export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface CheckResult {
  status: CheckStatus;
  label: string;
  message: string;
  recommendation?: string;
  value?: string | number | string[];
}

export interface CategoryResult {
  name: string;
  icon: string;
  checks: CheckResult[];
}

export interface BotProtection {
  detected: boolean;
  provider: string;
  reason: string;
}

export interface AnalysisResult {
  url: string;
  fetchedAt: string;
  status: "success" | "partial" | "error";
  error?: string;
  finalUrl?: string;
  responseTimeMs?: number;
  httpStatus?: number;
  botProtection?: BotProtection;

  categories: {
    technical: CategoryResult;
    onPage: CategoryResult;
    linkHealth: CategoryResult;
    schema: CategoryResult;
    performance: CategoryResult;
    aiEra: CategoryResult;
  };

  summary: {
    score: number;
    passed: number;
    warnings: number;
    failed: number;
    totalChecks: number;
  };
}

export type CategoryKey = keyof AnalysisResult["categories"];

export type StageId = "fetch" | "extras" | "analyze" | "links" | "pagespeed";

export type StreamEvent =
  | { type: "stage"; id: StageId; status: "running"; label: string }
  | { type: "stage"; id: StageId; status: "done"; durationMs: number }
  | { type: "stage"; id: StageId; status: "error"; durationMs: number; error: string }
  | {
      type: "meta";
      url: string;
      finalUrl: string;
      httpStatus: number;
      responseTimeMs: number;
      botProtection: BotProtection;
      fetchedAt: string;
    }
  | { type: "preview"; data: PreviewData }
  | { type: "category"; key: CategoryKey; data: CategoryResult }
  // Up to ~30 unique internal URLs the multi-page crawl can pick from.
  // Sent after extractInternalLinks runs; client uses this when depth > 1.
  | { type: "internalUrls"; urls: string[] }
  | { type: "complete"; summary: AnalysisResult["summary"] }
  | { type: "error"; message: string };

export interface PageReport {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  httpStatus: number;
  botProtection: BotProtection;
  categories: Partial<AnalysisResult["categories"]>;
  summary: AnalysisResult["summary"] | null;
  preview: PreviewData | null;
  error?: string;
}

export interface ImageProbe {
  width: number;
  height: number;
  aspectRatio: number;
  format: "png" | "jpeg" | "webp" | "gif" | "svg" | "unknown";
  sizeBytes?: number;
}

export type ShareImageVerdict = "good" | "warn" | "fail" | "missing" | "unknown";

export interface ShareImageCheck {
  url: string;
  probe: ImageProbe | null;
  verdict: ShareImageVerdict;
  reason: string;
  recommendation?: string;
}

export interface PreviewData {
  title: string;
  description: string;
  canonical: string;
  favicon: string;
  hostname: string;
  pathname: string;
  og: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
    site: string;
  };
  ogImageCheck: ShareImageCheck;
  twitterImageCheck: ShareImageCheck;
}
