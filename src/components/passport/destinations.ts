import { measure, measurementEnabled } from "@/lib/measurement/client";
export const destinations = [
  {
    id: "portfolio",
    label: "Portfolio",
    url: "https://raphaelraclot.dev",
    domain: "raphaelraclot.dev",
  },
  {
    id: "github",
    label: "GitHub",
    url: "https://github.com/Raxuis",
    domain: "github.com",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: "https://linkedin.com/in/raphael-raclot",
    domain: "linkedin.com",
  },
  {
    id: "x",
    label: "X",
    url: "https://x.com/I_Haruki_I",
    domain: "x.com",
  },
] as const;
export type DestinationId = (typeof destinations)[number]["id"];
export function trackDestination(
  destination: DestinationId,
  placement: "scene" | "direct",
) {
  if (!measurementEnabled()) return;
  measure("outbound", { detail: destination, placement }, false);
  try {
    const body = JSON.stringify({ destination, placement });
    if (
      !navigator.sendBeacon?.(
        "/api/events",
        new Blob([body], { type: "application/json" }),
      )
    ) {
      void fetch("/api/events", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* A measurement must never interrupt navigation. */
  }
}
