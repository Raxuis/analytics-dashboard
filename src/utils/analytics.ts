import { AnalyticsUnavailable, getRedis, type RedisClient } from "../lib/redis";
import { getDate } from "./index";

export type AnalyticsDay = { date: string; events: Record<string, number>[] };
type AnalyticsArgs = {
  retention?: number;
  redis?: () => RedisClient;
  now?: () => Date;
};
type TrackOptions = { persist?: boolean };

export const destinationNames = {
  portfolio: "Portfolio",
  github: "GitHub",
  linkedin: "LinkedIn",
  x: "X",
} as const;
export type DestinationId = keyof typeof destinationNames;
export type ClickEvent = {
  destination: DestinationId;
  placement: "scene" | "direct";
};
export function validateClick(input: unknown): ClickEvent | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (
    typeof value.destination !== "string" ||
    !Object.hasOwn(destinationNames, value.destination)
  )
    return null;
  if (value.placement !== "scene" && value.placement !== "direct") return null;
  return {
    destination: value.destination as DestinationId,
    placement: value.placement,
  };
}

export class Analytics {
  private retention: number;
  private redis: () => RedisClient;
  private now: () => Date;
  constructor(opts: AnalyticsArgs = {}) {
    this.retention = opts.retention ?? 60 * 60 * 24 * 7;
    this.redis = opts.redis ?? getRedis;
    this.now = opts.now ?? (() => new Date());
  }
  async track(namespace: string, event: object = {}, opts?: TrackOptions) {
    const key = `analytics::${namespace}${opts?.persist ? "" : `::${getDate(0, this.now())}`}`;
    await this.redis().increment(
      key,
      JSON.stringify(event),
      opts?.persist ? undefined : this.retention,
    );
  }
  async retrieveDays(
    namespace: string,
    nDays: number,
  ): Promise<AnalyticsDay[]> {
    if (!Number.isInteger(nDays) || nDays < 1 || nDays > 31)
      throw new RangeError("Expected 1 to 31 days");
    // Request in chronological order. A failed day rejects the entire series, never invents a zero.
    return Promise.all(
      Array.from({ length: nDays }, (_, i) =>
        this.retrieve(namespace, getDate(nDays - 1 - i, this.now())),
      ),
    );
  }
  async retrieve(namespace: string, date: string): Promise<AnalyticsDay> {
    const res = await this.redis().hgetall(`analytics::${namespace}::${date}`);
    return {
      date,
      events: Object.entries(res).map(([key, value]) => {
        const count =
          typeof value === "number" || typeof value === "string"
            ? Number(value)
            : NaN;
        if (!Number.isSafeInteger(count) || count < 0)
          throw new AnalyticsUnavailable("Stored analytics count is invalid");
        try {
          const event = JSON.parse(key);
          if (!event || typeof event !== "object" || Array.isArray(event))
            throw new Error();
        } catch {
          throw new AnalyticsUnavailable("Stored analytics event is invalid");
        }
        return { [key]: count };
      }),
    };
  }
}

export function summarizeAnalytics(
  pageviews: AnalyticsDay[],
  clicks: AnalyticsDay[],
  today: string,
) {
  const total = (day: AnalyticsDay) =>
    day.events.reduce(
      (sum, event) => sum + Object.values(event).reduce((a, b) => a + b, 0),
      0,
    );
  const totalPageviews = pageviews.reduce((sum, day) => sum + total(day), 0);
  const totalClicks = clicks.reduce((sum, day) => sum + total(day), 0);
  const countries = new Map<string, number>();
  const destinations = Object.entries(destinationNames).map(([id, label]) => ({
    id,
    label,
    count: 0,
    scene: 0,
    direct: 0,
  }));
  for (const day of pageviews)
    for (const item of day.events)
      for (const [key, count] of Object.entries(item)) {
        const event = JSON.parse(key);
        if (
          typeof event.country === "string" &&
          /^[A-Z]{2}$/.test(event.country)
        )
          countries.set(
            event.country,
            (countries.get(event.country) ?? 0) + count,
          );
      }
  for (const day of clicks)
    for (const item of day.events)
      for (const [key, count] of Object.entries(item)) {
        const event = validateClick(JSON.parse(key));
        const destination = destinations.find(
          (value) => value.id === event?.destination,
        );
        if (destination && event) {
          destination.count += count;
          destination[event.placement] += count;
        }
      }
  return {
    totalPageviews,
    todayPageviews: pageviews
      .filter((day) => day.date === today)
      .reduce((sum, day) => sum + total(day), 0),
    averagePageviews: pageviews.length ? totalPageviews / pageviews.length : 0,
    totalClicks,
    days: pageviews.map((day) => ({
      date: day.date,
      count: total(day),
      clicks: clicks.filter(item => item.date === day.date).reduce((sum, item) => sum + total(item), 0),
    })),
    unlocatedViews: totalPageviews - [...countries.values()].reduce((sum, count) => sum + count, 0),
    topCountries: [...countries.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    destinations: destinations.sort((a, b) => b.count - a.count),
  };
}
export type AnalyticsSummary = ReturnType<typeof summarizeAnalytics>;
export const analytics = new Analytics();
