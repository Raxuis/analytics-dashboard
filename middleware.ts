import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { analytics } from "./src/utils/analytics";
import { isAnalyticsConfigured } from "./src/lib/redis";

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isAnalyticsConfigured()) {
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
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
