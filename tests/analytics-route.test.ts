import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/events/route";

function request(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://raxuis.test/api/events", {
    method: "POST",
    body,
    headers: {
      origin: "https://raxuis.test",
      "content-type": "application/json",
      ...headers,
    },
  });
}

test("foreign origins cannot submit click events", async () => {
  assert.equal(
    (
      await POST(
        request('{"destination":"github","placement":"direct"}', {
          origin: "https://foreign.test",
        }),
      )
    ).status,
    403,
  );
});

test("malformed JSON, unsupported content and unknown destinations are rejected", async () => {
  assert.equal((await POST(request("{"))).status, 400);
  assert.equal(
    (await POST(request("{}", { "content-type": "text/plain" }))).status,
    415,
  );
  assert.equal(
    (await POST(request('{"destination":"other","placement":"direct"}')))
      .status,
    400,
  );
});

test("oversize payload is rejected even without a content-length header", async () => {
  assert.equal(
    (
      await POST(
        request(
          JSON.stringify({
            destination: "github",
            placement: "direct",
            extra: "x".repeat(600),
          }),
        ),
      )
    ).status,
    413,
  );
});

test("an unconfigured store reports unavailable, not a recorded click", async () => {
  const names = [
    "REDIS_URL",
    "REDIS_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];
  const before = names.map((name) => process.env[name]);
  names.forEach((name) => delete process.env[name]);
  try {
    const result = await POST(
      request('{"destination":"portfolio","placement":"scene"}'),
    );
    assert.equal(result.status, 503);
    assert.equal(result.headers.get("cache-control"), "no-store");
  } finally {
    names.forEach((name, i) => {
      if (before[i] === undefined) delete process.env[name];
      else process.env[name] = before[i];
    });
  }
});
