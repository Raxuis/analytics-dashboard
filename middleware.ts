import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { excludedRequest, exclusionCookie } from "./src/lib/measurement/policy";
import { isPageDocument } from "./src/utils/pageview";
import { languageFromRequest } from "./src/i18n/routing";
import { analytics } from "./src/utils/analytics";
import { isAnalyticsConfigured } from "./src/lib/redis";

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const locale = languageFromRequest(
    req.headers.get("host") ?? req.nextUrl.host,
    path,
  );
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-passport-locale", locale);
  if (
    (path === "/" || path === "/en") &&
    isPageDocument(req) &&
    !excludedRequest(req.headers, req.nextUrl.hostname) &&
    req.nextUrl.searchParams.get("analytics") !== "off" &&
    isAnalyticsConfigured()
  ) {
    const country = req.headers.get("x-vercel-ip-country");
    event.waitUntil(
      analytics
        .track("pageview", {
          page: "/",
          ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}),
        })
        .catch(() => console.warn("Pageview storage unavailable")),
    );
  }
  let response: NextResponse;
  if (locale === "en" && !path.startsWith("/en")) {
    const url = req.nextUrl.clone();
    url.pathname = path === "/" ? "/en" : `/en${path}`;
    response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  const preference = req.nextUrl.searchParams.get("analytics");
  if (preference === "off" || preference === "on") {
    response.cookies.set(exclusionCookie, preference === "off" ? "1" : "", {
      path: "/",
      maxAge: preference === "off" ? 31536000 : 0,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export const config = {
  matcher: ["/", "/en", "/analytics", "/en/analytics"],
};
