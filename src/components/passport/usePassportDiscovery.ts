import { useCallback, useEffect, useRef, useState } from "react";
import { DISCOVERY_KEY, nextDiscovery, readDiscovery, type DiscoveryCue } from "./discovery-state";

type State = {
  ready: boolean;
  open: boolean;
  page: number;
  paused: boolean;
  exploredCity: boolean;
  hasCities: boolean;
  uv: boolean;
};
export function usePassportDiscovery({ ready, open, page, paused, exploredCity, hasCities, uv }: State) {
  const seen = useRef(new Set<DiscoveryCue>());
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(true);
  const [cue, setCue] = useState<DiscoveryCue | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setCue(null);
  }, []);
  useEffect(() => {
    try { seen.current = readDiscovery(localStorage.getItem(DISCOVERY_KEY)); } catch { /* Private storage may be unavailable. */ }
    setHydrated(true);
    const visibility = () => setVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    dismiss();
    if (!hydrated) return;
    // A visitor who finds a gesture first does not need its later explanation.
    const learned: DiscoveryCue[] = [];
    if (open) learned.push("cover");
    if (open && page > 0) learned.push("turn");
    if (exploredCity) learned.push("city");
    if (uv) learned.push("uv");
    if (learned.some((value) => !seen.current.has(value))) {
      learned.forEach((value) => seen.current.add(value));
      try { localStorage.setItem(DISCOVERY_KEY, JSON.stringify([...seen.current])); } catch { /* Session memory remains available. */ }
    }
    if (!ready || paused || !visible) return;
    const next = nextDiscovery(seen.current, open, page, exploredCity, uv, hasCities);
    if (!next) return;
    timer.current = setTimeout(() => {
      seen.current.add(next);
      try { localStorage.setItem(DISCOVERY_KEY, JSON.stringify([...seen.current])); } catch { /* Keep the current session usable. */ }
      setCue(next);
      timer.current = setTimeout(() => setCue(null), 7000);
    }, next === "cover" ? 700 : 1100);
    return () => clearTimeout(timer.current);
  }, [hydrated, ready, paused, visible, open, page, exploredCity, hasCities, uv, dismiss]);
  return { cue, dismiss };
}
