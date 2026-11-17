export type DiscoveryCue = "cover" | "turn" | "city" | "uv";
export const DISCOVERY_KEY = "raxuis.passport.discovery.v1";
const cues: DiscoveryCue[] = ["cover", "turn", "city", "uv"];
export function readDiscovery(value: string | null): Set<DiscoveryCue> {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((cue): cue is DiscoveryCue => cues.includes(cue)) : []);
  } catch {
    return new Set();
  }
}
export function nextDiscovery(
  seen: ReadonlySet<DiscoveryCue>,
  open: boolean,
  page: number,
  exploredCity: boolean,
  uv: boolean,
  hasCities = true,
): DiscoveryCue | null {
  if (open && page > 0 && !hasCities) return null;
  const cue = !open ? "cover" : page === 0 ? "turn" : !seen.has("city") ? "city" : exploredCity && !uv ? "uv" : null;
  return cue && !seen.has(cue) ? cue : null;
}
