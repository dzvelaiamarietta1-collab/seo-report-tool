import { NextRequest } from "next/server";
import { fetchPageSpeed } from "@/lib/checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return Response.json(
      { error: "url parameter is required" },
      { status: 400 }
    );
  }

  let normalized: string;
  try {
    const u = new URL(
      urlParam.startsWith("http") ? urlParam : `https://${urlParam}`
    );
    normalized = u.toString();
  } catch {
    return Response.json({ error: "invalid URL" }, { status: 400 });
  }

  try {
    const category = await fetchPageSpeed(normalized);
    return Response.json({ category });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "უცნობი შეცდომა" },
      { status: 500 }
    );
  }
}
