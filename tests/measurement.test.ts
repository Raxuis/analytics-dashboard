import test from "node:test";
import assert from "node:assert/strict";
import { excludedRequest, isKnownBot } from "../src/lib/measurement/policy";
import { validateJourney } from "../src/lib/measurement/schema";
import { POST } from "../app/api/journey/route";
import { NextRequest } from "next/server";
import middleware from "../middleware";

const id = "12345678-1234-4234-8234-123456789abc";
const event = {
  id,
  session: id,
  name: "outbound",
  locale: "en",
  source: "github.com",
  detail: "github",
  placement: "direct",
};
test("only bounded events with anonymous UUIDs and known outgoing destinations are accepted", () => {
  assert.deepEqual(validateJourney(event), event);
  for (const patch of [
    { id: "someone@example.com" },
    { name: "anything" },
    { detail: "unknown" },
    { source: "https://example.com/private?email=x" },
    { placement: "footer" },
    { locale: "de" },
  ])
    assert.equal(validateJourney({ ...event, ...patch }), null);
  assert.equal(
    validateJourney({ ...event, name: "active_time", seconds: 999 }),
    null,
  );
  assert.equal(
    validateJourney({ ...event, name: "active_time", seconds: 30 })?.seconds,
    30,
  );
  assert.equal(
    validateJourney({ ...event, name: "city_view", detail: "Reykjavík" })
      ?.detail,
    "Reykjavík",
  );
});
test("known bots, owner exclusion and nonproduction hosts are filtered", () => {
  for (const agent of [
    "Googlebot",
    "bingbot",
    "HeadlessChrome",
    "Lighthouse",
    "facebookexternalhit",
  ])
    assert.ok(isKnownBot(agent));
  assert.equal(isKnownBot("Mozilla/5.0 Safari/605.1.15"), false);
  assert.ok(excludedRequest(new Headers(), "localhost"));
  assert.ok(excludedRequest(new Headers(), "preview.vercel.app"));
  assert.ok(
    excludedRequest(
      new Headers({ cookie: "other=1; passport_analytics_off=1" }),
      "passport.raphaelraclot.dev",
    ),
  );
  assert.equal(
    excludedRequest(new Headers(), "passport.raphaelraclot.dev"),
    false,
  );
});
test("owner exclusion can be set and removed on either language", () => {
  const off = middleware(
    new NextRequest("https://passport.raphaelraclot.dev/?analytics=off"),
    {} as never,
  );
  assert.equal(off.cookies.get("passport_analytics_off")?.value, "1");
  assert.match(off.headers.get("set-cookie") ?? "", /SameSite=lax/i);
  const on = middleware(
    new NextRequest("https://passport.raphaelraclot.dev/?analytics=on"),
    {} as never,
  );
  assert.match(on.headers.get("set-cookie") ?? "", /Max-Age=0/);
});
test("journey endpoint rejects foreign origins and excessive payloads, ignores owner tests", async () => {
  const req = (value: unknown, headers: Record<string, string> = {}) =>
    new NextRequest("https://passport.raphaelraclot.dev/api/journey", {
      method: "POST",
      body: JSON.stringify(value),
      headers: {
        origin: "https://passport.raphaelraclot.dev",
        "content-type": "application/json",
        ...headers,
      },
    });
  assert.equal(
    (await POST(req(event, { origin: "https://foreign.test" }))).status,
    403,
  );
  assert.equal(
    (await POST(req({ ...event, extra: "x".repeat(1100) }))).status,
    413,
  );
  assert.equal(
    (await POST(req(event, { cookie: "passport_analytics_off=1" }))).status,
    204,
  );
});
