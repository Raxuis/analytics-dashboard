export const eventNames = [
  "arrival",
  "scene_ready",
  "scene_error",
  "passport_open",
  "spread_view",
  "city_view",
  "uv_enable",
  "links_open",
  "simple_view",
  "reader_open",
  "outbound",
  "active_time",
] as const;
export type EventName = (typeof eventNames)[number];
export type EventData = {
  detail?: string;
  placement?: "scene" | "direct";
  seconds?: number;
};
export type JourneyEvent = EventData & {
  id: string;
  session: string;
  name: EventName;
  locale: "en" | "fr";
  source: string;
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateJourney(input: unknown): JourneyEvent | null {
  if (!input || typeof input !== "object") return null;
  const v = input as Record<string, unknown>;
  if (
    typeof v.id !== "string" ||
    !uuid.test(v.id) ||
    typeof v.session !== "string" ||
    !uuid.test(v.session) ||
    !eventNames.includes(v.name as EventName) ||
    !["en", "fr"].includes(String(v.locale))
  )
    return null;
  if (typeof v.source !== "string" || !/^[a-z0-9_.-]{1,80}$/.test(v.source))
    return null;
  if (
    v.detail !== undefined &&
    (typeof v.detail !== "string" ||
      !/^[\p{L}\p{N} ._-]{1,64}$/u.test(v.detail))
  )
    return null;
  if (
    v.placement !== undefined &&
    v.placement !== "scene" &&
    v.placement !== "direct"
  )
    return null;
  if (
    v.name === "outbound" &&
    (!["portfolio", "github", "linkedin", "x"].includes(String(v.detail)) ||
      !v.placement)
  )
    return null;
  if (
    v.name === "active_time" &&
    ![15, 30, 60, 120, 300].includes(Number(v.seconds))
  )
    return null;
  return {
    id: v.id,
    session: v.session,
    name: v.name as EventName,
    locale: v.locale as "en" | "fr",
    source: v.source,
    ...(v.detail !== undefined ? { detail: v.detail as string } : {}),
    ...(v.placement ? { placement: v.placement as "scene" | "direct" } : {}),
    ...(v.name === "active_time" ? { seconds: Number(v.seconds) } : {}),
  };
}
