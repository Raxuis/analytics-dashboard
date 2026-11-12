/** Server-side Upstash REST access. Each request has a real abort deadline and no retries. */
export class AnalyticsUnavailable extends Error {
  constructor(message = "Analytics storage is unavailable") {
    super(message);
    this.name = "AnalyticsUnavailable";
  }
}

type RedisEnvironment = {
  REDIS_URL?: string;
  REDIS_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};
type Command = (string | number)[];
type Options = { timeoutMs?: number; fetch?: typeof fetch };

// Compatibility with this repository's original REDIS_KEY-only deployment.
// Never send a standard Upstash token to this historical database by guessing its URL.
const LEGACY_REDIS_URL = "https://eu2-handy-ghoul-31376.upstash.io";
function resolveConfiguration(env: RedisEnvironment) {
  const legacyKeyOnly = Boolean(env.REDIS_KEY && !env.UPSTASH_REDIS_REST_TOKEN);
  const rawUrl =
    env.UPSTASH_REDIS_REST_URL ||
    env.REDIS_URL ||
    (legacyKeyOnly ? LEGACY_REDIS_URL : undefined);
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.REDIS_KEY;
  if (!rawUrl || !token)
    throw new AnalyticsUnavailable("Redis configuration is missing");
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AnalyticsUnavailable("Redis URL is invalid");
  }
  if (url.protocol !== "https:")
    throw new AnalyticsUnavailable("Redis requires HTTPS");
  return { base: url.href.replace(/\/$/, ""), token };
}

export function createRedis(env: RedisEnvironment, options: Options = {}) {
  const { base, token } = resolveConfiguration(env);
  const request = async (
    commands: Command | Command[],
    transaction = false,
  ): Promise<unknown> => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 1800,
    );
    try {
      const res = await (options.fetch ?? fetch)(
        `${base}${transaction ? "/multi-exec" : ""}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commands),
          signal: controller.signal,
          cache: "no-store",
        },
      );
      if (!res.ok) throw new AnalyticsUnavailable();
      const data = await res.json();
      if (transaction) {
        if (
          !Array.isArray(data) ||
          data.some((item) => !item || item.error || !("result" in item))
        )
          throw new AnalyticsUnavailable();
        return data.map((item) => item.result);
      }
      if (!data || data.error || !("result" in data))
        throw new AnalyticsUnavailable();
      return data.result;
    } catch (error) {
      if (error instanceof AnalyticsUnavailable) throw error;
      throw new AnalyticsUnavailable();
    } finally {
      clearTimeout(timeout);
    }
  };
  return {
    async hgetall(key: string): Promise<Record<string, unknown>> {
      const result = await request(["HGETALL", key]);
      if (!Array.isArray(result) || result.length % 2)
        throw new AnalyticsUnavailable();
      const entries: [string, unknown][] = [];
      for (let i = 0; i < result.length; i += 2) {
        if (typeof result[i] !== "string") throw new AnalyticsUnavailable();
        entries.push([result[i], result[i + 1]]);
      }
      return Object.fromEntries(entries);
    },
    increment(key: string, field: string, retention?: number) {
      if (retention === undefined) return request(["HINCRBY", key, field, 1]);
      return request(
        [
          ["HINCRBY", key, field, 1],
          ["EXPIRE", key, retention],
        ],
        true,
      );
    },
  };
}

export type RedisClient = ReturnType<typeof createRedis>;
const environment = (): RedisEnvironment => ({
  REDIS_URL: process.env.REDIS_URL,
  REDIS_KEY: process.env.REDIS_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
});
export const getRedis = () => createRedis(environment());
export function isAnalyticsConfigured(
  env: RedisEnvironment = environment(),
): boolean {
  try {
    resolveConfiguration(env);
    return true;
  } catch {
    return false;
  }
}
