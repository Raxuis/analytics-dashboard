import { NextRequest, NextResponse } from "next/server";
import { analytics, validateClick } from "@/utils/analytics";
import { excludedRequest } from "@/lib/measurement/policy";
import { isAnalyticsConfigured } from "@/lib/redis";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function POST(request: NextRequest) {
  // This is a public anonymous counter, not an authenticated source of visitor identity.
  // Reject foreign browser origins and cap the body before parsing arbitrary input.
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403, headers: noStore });
  if (excludedRequest(request.headers, request.nextUrl.hostname))
    return new NextResponse(null, { status: 204, headers: noStore });
  const length = request.headers.get("content-length");
  if (length && Number(length) > 512)
    return new NextResponse(null, { status: 413, headers: noStore });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return new NextResponse(null, { status: 415, headers: noStore });
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse(null, { status: 400, headers: noStore });
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 512) {
        await reader.cancel();
        return new NextResponse(null, { status: 413, headers: noStore });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return new NextResponse(null, { status: 400, headers: noStore });
    }
    const click = validateClick(parsed);
    if (!click)
      return new NextResponse(null, { status: 400, headers: noStore });
    if (!isAnalyticsConfigured())
      return new NextResponse(null, { status: 503, headers: noStore });
    await analytics.track("outbound", click);
    return new NextResponse(null, { status: 204, headers: noStore });
  } catch {
    return new NextResponse(null, { status: 503, headers: noStore });
  }
}
