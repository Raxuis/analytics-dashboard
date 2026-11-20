import { getRedis } from "../redis";
import { getDate } from "@/utils";
export type JourneySummary = {
  sessions: number;
  ready: number;
  opened: number;
  explored: number;
  passport: number;
  menu: number;
  direct: number;
  active: number;
  errors: number;
  since: string | null;
};
export async function journeySummary(): Promise<JourneySummary> {
  const redis = getRedis();
  const days = await Promise.all(
    Array.from({ length: 7 }, (_, offset) =>
      redis.hgetall(`analytics::journey::${getDate(6 - offset)}`),
    ),
  );
  const sum = (key: string) =>
    days.reduce((total, day) => {
      const n = Number(day[key] ?? 0);
      if (!Number.isSafeInteger(n) || n < 0)
        throw new Error("Invalid journey aggregate");
      return total + n;
    }, 0);
  const meta = await redis.hgetall("analytics::journey-meta");
  const since =
    typeof meta.since === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(meta.since)
      ? meta.since
      : null;
  return {
    sessions: sum("sessions"),
    ready: sum("ready"),
    opened: sum("opened"),
    explored: sum("explored"),
    passport: sum("passport_conversion"),
    menu: sum("links_opened"),
    direct: sum("direct_conversion"),
    active: sum("active:30"),
    errors: sum("event:scene_error"),
    since,
  };
}
