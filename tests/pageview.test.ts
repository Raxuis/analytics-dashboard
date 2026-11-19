import test from "node:test";
import assert from "node:assert/strict";
import { isPageDocument } from "../src/utils/pageview";
const check = (headers: Record<string, string>, method = "GET") => isPageDocument({ method, headers: new Headers(headers) });
test("only document loads contribute to the pageview counter", () => {
  assert.equal(check({ "sec-fetch-dest": "document", accept: "text/html" }), true);
  assert.equal(check({ accept: "text/html,application/xhtml+xml" }), true);
  assert.equal(check({ accept: "text/html" }, "HEAD"), false);
  assert.equal(check({ accept: "*/*" }), false);
  assert.equal(check({ "sec-fetch-dest": "image", accept: "image/*" }), false);
});
test("background prefetches remain excluded even after Next removes its internal headers", () => {
  assert.equal(check({ accept: "*/*", "sec-fetch-dest": "empty" }), false);
  assert.equal(check({ accept: "text/x-component", "sec-fetch-dest": "empty" }), false);
  assert.equal(check({ accept: "text/html", "sec-fetch-dest": "empty" }), false);
  assert.equal(check({ accept: "text/html", "next-router-prefetch": "1" }), false);
  assert.equal(check({ accept: "text/html", purpose: "prefetch" }), false);
  assert.equal(check({ accept: "text/html", "sec-fetch-dest": "document", "sec-purpose": "prefetch;prerender" }), false);
});
