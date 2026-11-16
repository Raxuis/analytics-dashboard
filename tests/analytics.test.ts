import test from "node:test";
import assert from "node:assert/strict";
import {
  Analytics,
  summarizeAnalytics,
  validateClick,
} from "../src/utils/analytics";
import {
  createRedis,
  AnalyticsUnavailable,
  isAnalyticsConfigured,
} from "../src/lib/redis";

const response = (result: unknown) =>
  new Response(JSON.stringify({ result }), { status: 200 });

test("missing Redis configuration fails explicitly without a network request", async () => {
  assert.throws(() => createRedis({}), AnalyticsUnavailable);
});

test("Redis request really aborts and never retries", async () => {
  let calls = 0;
  const redis = createRedis(
    { REDIS_URL: "https://example.upstash.io", REDIS_KEY: "secret" },
    {
      timeoutMs: 15,
      fetch: ((_url: unknown, init: RequestInit) => {
        calls++;
        return new Promise((_resolve, reject) =>
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        );
      }) as typeof fetch,
    },
  );
  await assert.rejects(redis.hgetall("key"), AnalyticsUnavailable);
  assert.equal(calls, 1);
});

test("tracking writes an expiring counter in one transaction", async () => {
  let body: unknown;
  const redis = createRedis(
    { REDIS_URL: "https://example.upstash.io", REDIS_KEY: "secret" },
    {
      fetch: (async (_url, init) => {
        body = JSON.parse(String(init?.body));
        return new Response(JSON.stringify([{ result: 1 }, { result: 1 }]));
      }) as typeof fetch,
    },
  );
  const analytics = new Analytics({
    redis: () => redis,
    now: () => new Date("2026-11-12T09:00:00Z"),
  });
  await analytics.track("pageview", { page: "/" });
  assert.deepEqual(body, [
    ["HINCRBY", "analytics::pageview::12/11/2026", '{"page":"/"}', 1],
    ["EXPIRE", "analytics::pageview::12/11/2026", 604800],
  ]);
});

test("days are chronological and a failed day rejects the whole series", async () => {
  const redis = createRedis(
    { REDIS_URL: "https://example.upstash.io", REDIS_KEY: "secret" },
    {
      fetch: (async (_url, init) => {
        const [, key] = JSON.parse(String(init?.body));
        if (String(key).includes("11/11"))
          return new Response("unavailable", { status: 503 });
        return response(['{"page":"/"}', "2"]);
      }) as typeof fetch,
    },
  );
  const analytics = new Analytics({
    redis: () => redis,
    now: () => new Date("2026-11-12T09:00:00Z"),
  });
  await assert.rejects(
    analytics.retrieveDays("pageview", 2),
    AnalyticsUnavailable,
  );
});

test("aggregation counts pageviews and destination clicks separately", () => {
  const result = summarizeAnalytics(
    [
      {
        date: "12/11/2026",
        events: [{ '{"country":"FR"}': 4 }, { '{"country":"KR"}': 2 }],
      },
    ],
    [
      {
        date: "12/11/2026",
        events: [
          { '{"destination":"portfolio","placement":"direct"}': 3 },
          { '{"destination":"github","placement":"scene"}': 1 },
        ],
      },
    ],
    "12/11/2026",
  );
  assert.equal(result.totalPageviews, 6);
  assert.equal(result.todayPageviews, 6);
  assert.equal(result.totalClicks, 4);
  assert.deepEqual(result.topCountries, [
    ["FR", 4],
    ["KR", 2],
  ]);
  assert.equal(result.destinations[0]?.count, 3);
});

test("malformed stored counts are unavailable rather than presented as zero", async () => {
  const redis = createRedis(
    { REDIS_URL: "https://example.upstash.io", REDIS_KEY: "secret" },
    {
      fetch: (async () =>
        response(['{"country":"FR"}', "not-a-number"])) as typeof fetch,
    },
  );
  const analytics = new Analytics({ redis: () => redis });
  await assert.rejects(
    analytics.retrieve("pageview", "12/11/2026"),
    AnalyticsUnavailable,
  );
});

test("only known destinations and placements can be recorded", () => {
  assert.deepEqual(
    validateClick({ destination: "portfolio", placement: "direct" }),
    { destination: "portfolio", placement: "direct" },
  );
  assert.equal(
    validateClick({ destination: "https://evil.test", placement: "direct" }),
    null,
  );
  assert.equal(
    validateClick({ destination: "github", placement: "fake" }),
    null,
  );
  assert.equal(validateClick(null), null);
});

test("retrieval preserves chronological ordering and empty real Redis hashes", async () => {
  const redis = createRedis(
    { REDIS_URL: "https://example.upstash.io", REDIS_KEY: "secret" },
    {
      fetch: (async () => response([])) as typeof fetch,
    },
  );
  const analytics = new Analytics({
    redis: () => redis,
    now: () => new Date("2026-11-12T09:00:00Z"),
  });
  assert.deepEqual(await analytics.retrieveDays("pageview", 3), [
    { date: "10/11/2026", events: [] },
    { date: "11/11/2026", events: [] },
    { date: "12/11/2026", events: [] },
  ]);
});

test("HTTP errors and Redis command errors do not become empty statistics", async () => {
  for (const fetcher of [
    async () => new Response("no", { status: 401 }),
    async () =>
      new Response(JSON.stringify({ error: "ERR permission denied" })),
  ]) {
    const redis = createRedis(
      { REDIS_URL: "https://example.upstash.io", REDIS_KEY: "secret" },
      { fetch: fetcher as typeof fetch },
    );
    await assert.rejects(redis.hgetall("key"), AnalyticsUnavailable);
  }
});

test("legacy REDIS_KEY-only deployments retain their known endpoint", async () => {
  let target = "";
  const redis = createRedis(
    { REDIS_KEY: "legacy-test-token" },
    {
      fetch: (async (url) => {
        target = String(url);
        return response([]);
      }) as typeof fetch,
    },
  );
  assert.equal(isAnalyticsConfigured({ REDIS_KEY: "legacy-test-token" }), true);
  await redis.hgetall("key");
  assert.equal(target, "https://eu2-handy-ghoul-31376.upstash.io");
});

test("standard token without a URL never uses the legacy endpoint", () => {
  assert.equal(
    isAnalyticsConfigured({ UPSTASH_REDIS_REST_TOKEN: "test-token" }),
    false,
  );
  assert.throws(
    () => createRedis({ UPSTASH_REDIS_REST_TOKEN: "test-token" }),
    AnalyticsUnavailable,
  );
  assert.throws(
    () =>
      createRedis({
        UPSTASH_REDIS_REST_TOKEN: "test-token",
        REDIS_KEY: "legacy-test-token",
      }),
    AnalyticsUnavailable,
  );
});

test("explicit URLs take priority over the legacy endpoint and require HTTPS", async () => {
  let target = "";
  const redis = createRedis(
    {
      REDIS_URL: "https://replacement.upstash.io",
      REDIS_KEY: "legacy-test-token",
    },
    {
      fetch: (async (url) => {
        target = String(url);
        return response([]);
      }) as typeof fetch,
    },
  );
  await redis.hgetall("key");
  assert.equal(target, "https://replacement.upstash.io");
  assert.equal(
    isAnalyticsConfigured({
      REDIS_URL: "http://replacement.upstash.io",
      REDIS_KEY: "test-token",
    }),
    false,
  );
  assert.throws(
    () =>
      createRedis({
        REDIS_URL: "http://replacement.upstash.io",
        REDIS_KEY: "test-token",
      }),
    AnalyticsUnavailable,
  );
});

test("Vercel Marketplace uses its REST credentials ahead of native Redis and legacy keys", async () => {
  let target = "",
    authorization = "";
  const redis = createRedis(
    {
      KV_REST_API_URL: "https://marketplace.upstash.io",
      KV_REST_API_TOKEN: "marketplace-test-token",
      REDIS_URL: "rediss://native.upstash.io:6379",
      REDIS_KEY: "obsolete-test-token",
    },
    {
      fetch: (async (url, init) => {
        target = String(url);
        authorization = new Headers(init?.headers).get("Authorization") ?? "";
        return response([]);
      }) as typeof fetch,
    },
  );
  await redis.hgetall("key");
  assert.equal(target, "https://marketplace.upstash.io");
  assert.equal(authorization, "Bearer marketplace-test-token");
});

test("Marketplace token without an endpoint never uses the old database", () => {
  assert.equal(
    isAnalyticsConfigured({
      KV_REST_API_TOKEN: "test-token",
      REDIS_KEY: "obsolete-test-token",
    }),
    false,
  );
});
