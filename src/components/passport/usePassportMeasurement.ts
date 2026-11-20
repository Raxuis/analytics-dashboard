"use client";
import { useEffect } from "react";
import {
  measure,
  measurementEnabled,
  flushUmami,
  touchMeasurement,
} from "@/lib/measurement/client";

export function usePassportMeasurement(state: {
  ready: boolean;
  failed: boolean;
  open: boolean;
  page: number;
  uv: boolean;
  showLinks: boolean;
  simpleMode: boolean;
  readingIndex: number | null;
}) {
  useEffect(() => {
    measure("arrival");
    let script: HTMLScriptElement | undefined;
    const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
    const website = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    if (measurementEnabled() && src && website) {
      try {
        if (new URL(src).protocol === "https:") {
          script = document.createElement("script");
          script.src = src;
          script.defer = true;
          script.dataset.websiteId = website;
          script.dataset.autoTrack = "false";
          script.onload = flushUmami;
          document.head.appendChild(script);
        }
      } catch {
        /* Invalid optional configuration never breaks the scene. */
      }
    }
    let elapsed = 0,
      previous = performance.now(),
      lastInput = previous;
    let activeSession = touchMeasurement();
    const emitted = new Set<number>();
    const activity = () => {
      lastInput = performance.now();
      const current = touchMeasurement();
      if (current !== activeSession) {
        elapsed = 0;
        emitted.clear();
        activeSession = current;
      }
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
    ] as const;
    events.forEach((event) =>
      window.addEventListener(event, activity, { passive: true }),
    );
    const timer = setInterval(() => {
      const now = performance.now(),
        delta = now - previous;
      previous = now;
      if (
        document.visibilityState !== "visible" ||
        now - lastInput > 30000 ||
        delta > 2000
      )
        return;
      elapsed += delta;
      for (const seconds of [15, 30, 60, 120, 300])
        if (elapsed >= seconds * 1000 && !emitted.has(seconds)) {
          emitted.add(seconds);
          measure("active_time", { seconds });
        }
    }, 1000);
    return () => {
      script?.remove();
      clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, activity));
    };
  }, []);
  useEffect(() => {
    if (state.ready) measure("scene_ready");
  }, [state.ready]);
  useEffect(() => {
    if (state.failed) measure("scene_error");
  }, [state.failed]);
  useEffect(() => {
    if (state.open) measure("passport_open");
  }, [state.open]);
  useEffect(() => {
    if (state.open && state.page > 0)
      measure("spread_view", { detail: String(state.page) });
  }, [state.open, state.page]);
  useEffect(() => {
    if (state.uv) measure("uv_enable");
  }, [state.uv]);
  useEffect(() => {
    if (state.showLinks) measure("links_open");
  }, [state.showLinks]);
  useEffect(() => {
    if (state.simpleMode) measure("simple_view");
  }, [state.simpleMode]);
  useEffect(() => {
    if (state.readingIndex !== null) measure("reader_open");
  }, [state.readingIndex]);
}
