import { exclusionCookie, measurementHosts } from "./policy";
import type { EventName, EventData } from "./schema";
const storageKey = "passport.measurement.v2";
type Session = { id: string; touched: number; source: string; seen: string[] };
let memory: Session | undefined;
let queue = Promise.resolve();
let umamiPageviewSent = false;
let lastTouch = 0;
const umamiQueue: { name: string; data: Record<string, string | number> }[] =
  [];
declare global {
  interface Window {
    umami?: { track: (payload: Record<string, unknown>) => unknown };
  }
}
export function measurementEnabled() {
  return (
    typeof window !== "undefined" &&
    measurementHosts.includes(location.hostname) &&
    !document.cookie.split("; ").includes(`${exclusionCookie}=1`) &&
    new URLSearchParams(location.search).get("analytics") !== "off"
  );
}
function source() {
  const campaign = new URLSearchParams(location.search).get("utm_source");
  if (campaign && /^[a-z0-9_.-]{1,80}$/i.test(campaign))
    return campaign.toLowerCase();
  try {
    const host = new URL(document.referrer).hostname;
    return measurementHosts.includes(host) ? "internal" : host.slice(0, 80);
  } catch {
    return "direct";
  }
}
function session() {
  const now = Date.now();
  try {
    memory = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") ?? memory;
  } catch {
    /* Memory fallback when storage is disabled. */
  }
  if (!memory || now - memory.touched > 30 * 60 * 1000)
    memory = {
      id: crypto.randomUUID(),
      touched: now,
      source: source(),
      seen: [],
    };
  if (
    !/^[0-9a-f-]{36}$/i.test(memory.id) ||
    !Number.isFinite(memory.touched) ||
    !Array.isArray(memory.seen) ||
    memory.seen.length > 300 ||
    typeof memory.source !== "string"
  ) {
    memory = {
      id: crypto.randomUUID(),
      touched: now,
      source: source(),
      seen: [],
    };
  }
  memory.touched = now;
  return memory;
}
export function touchMeasurement() {
  if (!measurementEnabled()) return;
  if (Date.now() - lastTouch < 5000 && memory) return memory.id;
  const s = session();
  lastTouch = Date.now();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(s));
  } catch {
    /* Memory fallback. */
  }
  return s.id;
}
export function flushUmami() {
  if (!measurementEnabled() || !window.umami) return;
  const base = {
    website: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    hostname: location.hostname,
    url: location.pathname,
    language: document.documentElement.lang,
    title: "Raxuis Passport",
    referrer:
      memory?.source && memory.source.includes(".")
        ? `https://${memory.source}`
        : "",
  };
  const send = (payload: Record<string, unknown>) => {
    try {
      void Promise.resolve(window.umami?.track(payload)).catch(() => {});
    } catch {
      /* Optional collector. */
    }
  };
  if (!umamiPageviewSent) {
    umamiPageviewSent = true;
    send(base);
  }
  for (const event of umamiQueue.splice(0))
    send({ ...base, name: event.name, data: event.data });
}
export function measure(name: EventName, data: EventData = {}, once = true) {
  if (!measurementEnabled()) return;
  try {
    const s = session();
    const key = `${name}:${data.detail ?? ""}:${data.placement ?? ""}:${data.seconds ?? ""}`;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      /* Memory fallback. */
    }
    if (once && s.seen.includes(key)) return;
    if (once) s.seen.push(key);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      /* Memory fallback. */
    }
    const locale = document.documentElement.lang === "en" ? "en" : "fr";
    const body = JSON.stringify({
      ...data,
      id: crypto.randomUUID(),
      session: s.id,
      source: s.source,
      locale,
      name,
    });
    // Serialize requests so arrival precedes milestones; failures never block the next event.
    queue = queue
      .then(async () => {
        await fetch("/api/journey", {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      })
      .catch(() => {});
    if (
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
      process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL
    ) {
      if (umamiQueue.length < 100)
        umamiQueue.push({ name, data: { ...data, locale, source: s.source } });
      flushUmami();
    }
  } catch {
    /* Measurement must never affect the passport. */
  }
}
