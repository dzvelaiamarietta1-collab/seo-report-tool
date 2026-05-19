import { NextRequest } from "next/server";
import type { AnalysisResult } from "@/lib/types";
import { generateExecutiveSummary } from "@/lib/summarize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gemini Flash usually returns under 2s; 20s is generous for cold starts
// and the rare slow response. Don't go higher — the UI shows a loader.
export const maxDuration = 20;

interface SummarizeRequestBody {
  analysis: AnalysisResult;
}

// POST /api/summarize
// Body: { analysis: AnalysisResult }
// Returns: { text: string, model: string }
// Errors: 400 invalid body, 500 Gemini error, 503 if key not configured
export async function POST(req: NextRequest) {
  let body: SummarizeRequestBody;
  try {
    body = (await req.json()) as SummarizeRequestBody;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body?.analysis?.summary) {
    return Response.json(
      { error: "analysis with summary required" },
      { status: 400 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "AI Summary არ არის კონფიგურირებული" },
      { status: 503 }
    );
  }

  try {
    const result = await generateExecutiveSummary(body.analysis);
    return Response.json({
      text: result.text,
      model: result.model,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "უცნობი შეცდომა";
    // Quota errors from Gemini return readable messages — surface them
    // verbatim so the user knows to check their AI Studio dashboard.
    return Response.json(
      { error: msg },
      { status: msg.toLowerCase().includes("quota") ? 429 : 500 }
    );
  }
}
