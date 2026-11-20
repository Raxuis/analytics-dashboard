import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getRedis } from "../src/lib/redis";
import { journeyScript } from "../src/lib/measurement/store";
async function main() {
  const redis = getRedis(),
    prefix = `qa-passport-${randomUUID()}::`,
    day = "20/11/2026",
    keys = new Set<string>();
  const script = journeyScript.replaceAll("analytics::", prefix);
  const send = async (
    session: string,
    name: string,
    detail = "",
    placement = "",
    id = randomUUID(),
  ) => {
    const dedup = `${prefix}dedup::${id}`,
      state = `${prefix}session::${session}`;
    keys.add(dedup);
    keys.add(state);
    keys.add(`${prefix}journey::${day}`);
    keys.add(`${prefix}journey-meta`);
    return redis.evaluate(
      script,
      [dedup, state],
      [day, name, detail, placement, "direct", "en", ""],
    );
  };
  try {
    const a = randomUUID(),
      duplicate = randomUUID();
    const result = await Promise.all(
      Array.from({ length: 5 }, () => send(a, "arrival", "", "", duplicate)),
    );
    assert.equal(
      result.filter((n) => n === 1).length,
      1,
      "atomic duplicate protection",
    );
    await send(a, "scene_ready");
    await send(a, "passport_open");
    await send(a, "spread_view", "1");
    await send(a, "outbound", "github", "scene");
    const b = randomUUID();
    await send(b, "arrival");
    await send(b, "outbound", "github", "direct");
    await send(b, "links_open");
    const c = randomUUID();
    await send(c, "arrival");
    await send(c, "scene_ready");
    await send(c, "passport_open");
    await send(c, "outbound", "github", "scene");
    await send(c, "city_view", "Tokyo");
    let totals = await redis.hgetall(`${prefix}journey::${day}`);
    assert.equal(Number(totals.sessions), 3);
    assert.equal(
      Number(totals.passport_conversion),
      1,
      "no retroactive passport conversion",
    );
    assert.equal(
      totals.direct_conversion,
      undefined,
      "no retroactive menu conversion",
    );
    await send(b, "outbound", "github", "direct");
    totals = await redis.hgetall(`${prefix}journey::${day}`);
    assert.equal(Number(totals.direct_conversion), 1);
    console.log(
      "PASS: real Redis atomic deduplication, session counts and ordered funnels.",
    );
  } finally {
    if (keys.size)
      await redis.evaluate(
        "return redis.call('DEL', unpack(KEYS))",
        [...keys],
        [],
      );
    console.log("Temporary QA keys removed. Public counters untouched.");
  }
}
main().catch(() => {
  console.error("Journey smoke check failed.");
  process.exitCode = 1;
});
