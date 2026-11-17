import test from "node:test";
import assert from "node:assert/strict";
import { nextDiscovery, readDiscovery } from "../src/components/passport/discovery-state";

test("discovery accepts only known persisted cues and recovers from invalid storage", () => {
  assert.deepEqual([...readDiscovery('["cover","turn","unknown",1]')], ["cover", "turn"]);
  assert.equal(readDiscovery("broken").size, 0);
  assert.equal(readDiscovery('{"cover":true}').size, 0);
});
test("discovery follows the actual page and never repeats a seen cue", () => {
  assert.equal(nextDiscovery(new Set(), false, 0, false, false), "cover");
  assert.equal(nextDiscovery(new Set(["cover"]), false, 0, false, false), null);
  assert.equal(nextDiscovery(new Set(), true, 0, false, false), "turn");
  assert.equal(nextDiscovery(new Set(["turn"]), true, 1, false, false), "city");
  assert.equal(nextDiscovery(new Set(["city"]), true, 1, true, false), "uv");
  assert.equal(nextDiscovery(new Set(["city", "uv"]), true, 1, true, false), null);
  assert.equal(nextDiscovery(new Set(["city"]), true, 1, true, true), null);
  assert.equal(nextDiscovery(new Set(), true, 1, false, false, false), null);
});
