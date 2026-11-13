import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  destinationAtUV,
  PAGE_LINKS,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  SHEET_WIDTH,
  SHEET_HEIGHT,
} from "../src/components/passport/passport-layout";
import {
  pageGeometry,
  coverLiningGeometry,
  PAGE_LEVEL,
  PAGE_BOW,
  PAPER_THICKNESS,
  TURN_CLEARANCE,
  FRONT_LINING_Z,
  OPEN_COVER_HINGE_Z,
  REAR_COVER_HINGE_Z,
} from "../src/components/passport/passport-geometry";
import { turnPose } from "../src/components/passport/page-turn";
import { SimplePassport } from "../src/components/passport/SimplePassport";
import * as THREE from "three";

test("only printed visa regions can be hovered or selected", () => {
  for (const page of [0, 1])
    for (const region of PAGE_LINKS[page]!) {
      assert.equal(
        destinationAtUV(
          page,
          region.x + region.width / 2,
          1 - region.y - region.height / 2,
        ),
        region.id,
      );
    }
  assert.equal(destinationAtUV(0, 0.5, 0.98), null);
  assert.equal(destinationAtUV(0, 0.02, 0.5), null);
  assert.equal(destinationAtUV(1, 0.5, 0.04), null);
  assert.equal(destinationAtUV(0, NaN, 0.5), null);
  assert.equal(
    destinationAtUV(1, 0.5, 0.6),
    null,
    "travel pages contain no duplicate social links",
  );
});
test("the page is inset from the cover and a turned sheet rests just above the lining", () => {
  assert.ok(SHEET_WIDTH < PAGE_WIDTH - 0.05);
  assert.ok(SHEET_HEIGHT < PAGE_HEIGHT - 0.05);
  const geometry = pageGeometry(true);
  const pose = turnPose(1, 1);
  const transform = new THREE.Matrix4().makeRotationY(pose.angle);
  transform.setPosition(0, 0, pose.z);
  const positions = geometry.attributes.position!;
  for (let i = 0; i < positions.count; i++)
    positions.setZ(
      i,
      Math.sin((positions.getX(i) / SHEET_WIDTH) * Math.PI) * pose.bend -
        PAPER_THICKNESS,
    );
  for (let i = 0; i < positions.count; i++) {
    const p = new THREE.Vector3()
      .fromBufferAttribute(positions, i)
      .applyMatrix4(transform);
    assert.ok(
      p.x > -PAGE_WIDTH && p.x < 0.04,
      "turned page fits within cover width",
    );
    assert.ok(
      Math.abs(p.y) < PAGE_HEIGHT / 2,
      "turned page fits within cover height",
    );
    assert.ok(
      Math.abs(
        p.z -
          (PAGE_LEVEL +
            PAGE_BOW * Math.sin((-p.x / SHEET_WIDTH) * Math.PI) +
            TURN_CLEARANCE),
      ) < 1e-6,
      "turned page follows the left resting surface with only paper clearance",
    );
  }
  geometry.dispose();
});
test("simple view exposes all four real links immediately without a canvas or a popup", () => {
  const html = renderToStaticMarkup(React.createElement(SimplePassport, {}));
  for (const url of [
    "https://raphaelraclot.dev",
    "https://github.com/Raxuis",
    "https://linkedin.com/in/raphael-raclot",
    "https://x.com/I_Haruki_I",
  ])
    assert.ok(html.includes(`href="${url}"`));
  assert.equal((html.match(/<a /g) || []).length, 4);
  assert.ok(html.includes("Raphaël"));
  for (const label of [
    "Corée du Sud",
    "3 visites",
    "Japon",
    "2 visites",
    "Californie",
    "Floride",
    "New York",
    "Islande",
  ])
    assert.ok(html.includes(label));
  assert.ok(!html.includes("<canvas"));
  assert.ok(
    !/<(?:nav|section)[^>]*\shidden(?:=|\s|>)/.test(html),
    "pages and destination navigation are immediately visible",
  );
  assert.ok(!html.includes("dialog"));
});

test("country catalog has a prepared silhouette for every code", async () => {
  const { default: catalog } =
    await import("../src/components/passport/country-catalog.json");
  const { access } = await import("node:fs/promises");
  assert.ok(Object.keys(catalog).length >= 170);
  await Promise.all(
    Object.entries(catalog).map(async ([code, country]) => {
      assert.ok(country.name.length > 0);
      assert.ok(Number.isFinite(country.scale) && country.scale > 0);
      await access(
        new URL(`../public/identity/countries/${code}.svg`, import.meta.url),
      );
    }),
  );
});

test("every supplied city projects onto its country and can be targeted", async () => {
  const { travels } = await import("../src/components/passport/travel-content");
  const { cityMarkers, cityAtUV } =
    await import("../src/components/passport/travel-layout");
  for (const memory of travels)
    for (const marker of cityMarkers(memory)) {
      assert.ok(
        marker.x > 0 && marker.x < 1024 && marker.y > 0 && marker.y < 1440,
        marker.city.name,
      );
      assert.equal(
        cityAtUV(memory, marker.x / 1024, 1 - marker.y / 1440)?.city.name,
        marker.city.name,
      );
    }
});

test("page turn snapshots keep the outgoing front and incoming back together", async () => {
  const { turnFaces, turnPose, swipeDirection } =
    await import("../src/components/passport/page-turn");
  assert.deepEqual(turnFaces({ from: 0, to: 1, direction: 1 }), {
    left: [0, "left"],
    right: [1, "right"],
    front: [0, "right"],
    back: [1, "left"],
  });
  assert.deepEqual(turnFaces({ from: 2, to: 1, direction: -1 }), {
    left: [1, "left"],
    right: [2, "right"],
    front: [1, "right"],
    back: [2, "left"],
  });
  for (const direction of [1, -1] as const)
    for (let i = 0; i <= 20; i++) {
      const pose = turnPose(i / 20, direction);
      assert.ok(
        pose.bend <= 0.101,
        "sheet has a restrained fold rather than exposing a large gap",
      );
      assert.ok(
        pose.z >= PAGE_LEVEL + TURN_CLEARANCE - PAPER_THICKNESS - 1e-9 &&
          pose.z <= PAGE_LEVEL + TURN_CLEARANCE + 1e-9,
      );
    }
  assert.equal(swipeDirection(-100, 5), 1);
  assert.equal(swipeDirection(100, 5), -1);
  assert.equal(swipeDirection(5, 100), 0, "vertical scrolling is not a turn");
  assert.equal(swipeDirection(5, 1), 0, "a click is not a turn");
});

test("a completed swipe does not replay when its parent still has the old page", async () => {
  const { queuedTurn } = await import("../src/components/passport/page-turn");
  assert.equal(
    queuedTurn(0, 1, 1),
    null,
    "stale parent page must not animate a reverse turn",
  );
  assert.equal(
    queuedTurn(1, 1, 1),
    null,
    "acknowledgement must not replay the completed turn",
  );
  assert.equal(
    queuedTurn(2, 1, null),
    2,
    "a later real page request still turns",
  );
});

test("US mainland and inset cities use their corresponding projections", async () => {
  const { projectCity, TRAVEL_MAP } =
    await import("../src/components/passport/travel-layout");
  const ny = projectCity("USA", {
    name: "New York",
    latitude: 40.7128,
    longitude: -74.006,
  });
  const miami = projectCity("USA", {
    name: "Miami",
    latitude: 25.7617,
    longitude: -80.1918,
  });
  const alaska = projectCity("USA", {
    name: "Anchorage",
    latitude: 61.2181,
    longitude: -149.9003,
  });
  const hawaii = projectCity("USA", {
    name: "Honolulu",
    latitude: 21.3099,
    longitude: -157.8581,
  });
  assert.ok(ny.x > miami.x && ny.y < miami.y);
  assert.ok(alaska.y > TRAVEL_MAP.y + TRAVEL_MAP.height * 0.7);
  assert.ok(hawaii.y > TRAVEL_MAP.y + TRAVEL_MAP.height * 0.7);
  assert.ok(alaska.x < hawaii.x);
});

test("both resting pages have identical heights and curvature across the entire sheet", () => {
  const left = coverLiningGeometry(),
    right = pageGeometry();
  const leftWorld = new THREE.Matrix4()
    .makeTranslation(0, 0, OPEN_COVER_HINGE_Z)
    .multiply(new THREE.Matrix4().makeRotationY(-Math.PI))
    .multiply(
      new THREE.Matrix4().makeTranslation(SHEET_WIDTH / 2, 0, FRONT_LINING_Z),
    )
    .multiply(new THREE.Matrix4().makeRotationY(Math.PI));
  const lp = left.attributes.position!,
    rp = right.attributes.position!;
  assert.equal(lp.count, rp.count);
  for (let i = 0; i < lp.count; i++) {
    const l = new THREE.Vector3()
      .fromBufferAttribute(lp, i)
      .applyMatrix4(leftWorld);
    const r = new THREE.Vector3()
      .fromBufferAttribute(rp, i)
      .add(new THREE.Vector3(0, 0, PAGE_LEVEL));
    assert.ok(Math.abs(l.y - r.y) < 1e-6, "same vertical level");
    assert.ok(Math.abs(l.z - r.z) < 1e-6, "same depth, including the bow");
    assert.ok(
      Math.abs(l.x + SHEET_WIDTH - r.x) < 1e-6,
      "same dimensions on either side of the spine",
    );
    const rearClosedHeight = 2 * REAR_COVER_HINGE_Z - r.z;
    assert.ok(
      rearClosedHeight - l.z >= 2 * TURN_CLEARANCE - 1e-6,
      "rear block still closes above the left sheet",
    );
  }
  left.dispose();
  right.dispose();
});
