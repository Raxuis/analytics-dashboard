/** Count document navigations, never background RSC, link preloads or asset requests. */
export function isPageDocument(request: { method: string; headers: Headers }): boolean {
  if (request.method !== "GET") return false;
  const headers = request.headers;
  if (headers.has("next-router-prefetch") || headers.get("purpose") === "prefetch" || headers.get("sec-purpose")?.includes("prefetch")) return false;
  const destination = headers.get("sec-fetch-dest");
  // Next.js can strip its internal prefetch/RSC headers before middleware runs.
  // Browser fetch metadata and Accept survive that normalization.
  return destination === "document" || (!destination && !!headers.get("accept")?.includes("text/html"));
}
