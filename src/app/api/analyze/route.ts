import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import {
  fetchPage,
  checkExtras,
  detectBotProtection,
  analyzeTechnical,
  analyzeOnPage,
  analyzeSchema,
  analyzeAiEra,
  fetchPageSpeed,
  calculateSummary,
} from "@/lib/checks";
import { extractPreview } from "@/lib/preview";
import {
  extractInternalLinks,
  checkLinkHealth,
  buildLinkHealthCategory,
} from "@/lib/brokenLinks";
import type {
  AnalysisResult,
  CategoryKey,
  CategoryResult,
  StageId,
  StreamEvent,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return Response.json({ error: "url parameter is required" }, { status: 400 });
  }

  let normalized: string;
  try {
    const u = new URL(urlParam.startsWith("http") ? urlParam : `https://${urlParam}`);
    normalized = u.toString();
  } catch {
    return Response.json({ error: "invalid URL" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      const stage = async <T>(
        id: StageId,
        label: string,
        work: () => Promise<T>
      ): Promise<T | null> => {
        send({ type: "stage", id, status: "running", label });
        const start = Date.now();
        try {
          const result = await work();
          send({ type: "stage", id, status: "done", durationMs: Date.now() - start });
          return result;
        } catch (e) {
          send({
            type: "stage",
            id,
            status: "error",
            durationMs: Date.now() - start,
            error: e instanceof Error ? e.message : "უცნობი შეცდომა",
          });
          return null;
        }
      };

      const collected: Partial<AnalysisResult["categories"]> = {};
      const sendCategory = (key: CategoryKey, data: CategoryResult) => {
        collected[key] = data;
        send({ type: "category", key, data });
      };

      try {
        const page = await stage("fetch", "გვერდის HTML-ის ჩამოტვირთვა", async () => {
          const result = await fetchPage(normalized);
          if (!result) throw new Error("ვერ ვუკავშირდები საიტს");
          return result;
        });

        if (!page) {
          send({
            type: "error",
            message:
              "ვერ მოვიდე საიტთან კავშირი — შეიძლება საიტი ბლოკავს ბოტებს ან არ მუშაობს.",
          });
          controller.close();
          return;
        }

        const $ = cheerio.load(page.html);
        const botProtection = detectBotProtection(page.status, page.headers, $);

        send({
          type: "meta",
          url: urlParam,
          finalUrl: page.finalUrl,
          httpStatus: page.status,
          responseTimeMs: page.responseTimeMs,
          botProtection,
          fetchedAt: new Date().toISOString(),
        });

        const previewData = await extractPreview(
          $,
          page.finalUrl ?? normalized
        );
        send({ type: "preview", data: previewData });

        const extras = await stage(
          "extras",
          "robots.txt, sitemap.xml, llms.txt შემოწმება",
          () => checkExtras(normalized)
        );
        const safeExtras = extras ?? { robotsTxt: false, sitemap: false, llmsTxt: false };

        await stage("analyze", "HTML-ის სტრუქტურის ანალიზი", async () => {
          sendCategory(
            "technical",
            analyzeTechnical(
              page.finalUrl ?? normalized,
              page.status,
              page.headers,
              $,
              safeExtras
            )
          );
          sendCategory("onPage", analyzeOnPage($, page.finalUrl ?? normalized));
          sendCategory("schema", analyzeSchema($));
          sendCategory("aiEra", analyzeAiEra($, safeExtras.llmsTxt));
        });

        const internalLinks = extractInternalLinks(
          $,
          page.finalUrl ?? normalized
        );
        const linkLabel =
          internalLinks.length === 0
            ? "შიდა ბმულების შემოწმება"
            : `შიდა ბმულების შემოწმება (${Math.min(internalLinks.length, 30)})`;
        const linkHealth = await stage("links", linkLabel, () =>
          checkLinkHealth(internalLinks)
        );
        if (linkHealth) {
          sendCategory("linkHealth", buildLinkHealthCategory(linkHealth));
        }

        const performance = await stage(
          "pagespeed",
          "Google PageSpeed Insights (15-25 წამი)",
          () => fetchPageSpeed(normalized)
        );
        if (performance) {
          sendCategory("performance", performance);
        }

        const summary = calculateSummary({
          categories: collected,
        } as AnalysisResult);
        send({ type: "complete", summary });

        controller.close();
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "უცნობი შეცდომა",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
