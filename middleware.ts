import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { isPageDocument } from "./src/utils/pageview";
import { languageFromRequest } from "./src/i18n/routing";
import { analytics } from "./src/utils/analytics";
import { isAnalyticsConfigured } from "./src/lib/redis";

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const locale = languageFromRequest(req.headers.get("host") ?? req.nextUrl.host, path);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-passport-locale", locale);
  if ((path === "/" || path === "/en") && isPageDocument(req) && isAnalyticsConfigured()) {
    const country = req.geo?.country;
    event.waitUntil(
      analytics
        .track("pageview", {
          page: "/",
          ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}),
        })
        .catch(() => console.warn("Pageview storage unavailable")),
    );
  }
  if (locale === "en" && !path.startsWith("/en")) {
    const url = req.nextUrl.clone();
    url.pathname = path === "/" ? "/en" : `/en${path}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/", "/en", "/analytics", "/en/analytics"],
};
