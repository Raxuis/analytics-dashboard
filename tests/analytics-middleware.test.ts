import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest, type NextFetchEvent } from "next/server";
import middleware from "../middleware";

test("homepage response returns before Redis finishes recording the view", async () => {
  const names = [
    "REDIS_URL",
    "REDIS_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];
  const before = names.map((name) => process.env[name]);
  const originalFetch = globalThis.fetch;
  names.forEach((name) => delete process.env[name]);
  process.env.REDIS_URL = "https://example.upstash.io";
  process.env.REDIS_KEY = "test-only";
  let finish: ((value: Response) => void) | undefined;
  let background: Promise<unknown> | undefined;
  globalThis.fetch = (() =>
    new Promise<Response>((resolve) => {
      finish = resolve;
    })) as typeof fetch;
  try {
    const result = middleware(new NextRequest("https://passeport.raphaelraclot.dev/", { headers: { accept: "text/html" } }), {
      waitUntil(promise: Promise<unknown>) {
        background = promise;
      },
    } as NextFetchEvent);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("x-middleware-next"), "1");
    assert.ok(background, "write must be attached to the background lifetime");
    assert.ok(finish, "Redis call has started but has not returned");
    finish(new Response(JSON.stringify([{ result: 1 }, { result: 1 }])));
    await background;
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, i) => {
      if (before[i] === undefined) delete process.env[name];
      else process.env[name] = before[i];
    });
  }
});
