"use client";
import { useEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import type { DiscoveryCue } from "./discovery-state";
import { cityMarkers } from "./travel-layout";
import { travelPages } from "./travel-content";
import { SHEET_WIDTH, SHEET_HEIGHT } from "./passport-layout";
import { PAGE_LEVEL, PAGE_BOW } from "./passport-geometry";

/** Temporary material cues. Never owns navigation, busy state or pointer events. */
export function DiscoveryMotion({ cue, reduced, cover, paper, page }: {
  cue: DiscoveryCue | null;
  reduced: boolean;
  cover: RefObject<THREE.Group>;
  paper: THREE.BufferGeometry;
  page: number;
}) {
  const { invalidate } = useThree();
  const ring = useRef<THREE.Mesh>(null);
  const memory = travelPages[(page - 1) * 2 + 1]?.memory;
  const marker = memory ? cityMarkers(memory)[0] : undefined;
  useEffect(() => {
    if (!cue || reduced) return;
    const timeline = gsap.timeline({ onUpdate: invalidate });
    let restore = () => {};
    if (cue === "cover" && cover.current) {
      const rotation = cover.current.rotation;
      const initial = rotation.y;
      restore = () => { rotation.y = initial; };
      timeline.to(rotation, { y: initial - 0.085, duration: 0.65, ease: "power3.out" })
        .to(rotation, { y: initial, duration: 0.8, ease: "power2.inOut" }, "+=0.25");
    } else if (cue === "turn") {
      const position = paper.attributes.position!;
      const original = Float32Array.from(position.array);
      const curl = { value: 0 };
      const update = () => {
        for (let i = 0; i < position.count; i++) {
          const x = original[i * 3]!, y = original[i * 3 + 1]!;
          const weight = Math.max(0, (x / SHEET_WIDTH - 0.67) / 0.33)
            * Math.max(0, (-y / SHEET_HEIGHT - 0.22) / 0.28);
          position.setZ(i, original[i * 3 + 2]! + weight * weight * curl.value);
        }
        position.needsUpdate = true;
        paper.computeVertexNormals();
        invalidate();
      };
      restore = () => { position.array.set(original); position.needsUpdate = true; paper.computeVertexNormals(); };
      timeline.to(curl, { value: 0.17, duration: 0.65, ease: "power3.out", onUpdate: update })
        .to(curl, { value: 0, duration: 0.8, ease: "power2.inOut", onUpdate: update }, "+=0.3");
    } else if (cue === "city" && ring.current) {
      const mesh = ring.current;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.7;
      mesh.scale.setScalar(1);
      timeline.to(mesh.scale, { x: 4.5, y: 4.5, duration: 1.8, ease: "power2.out" }, 0)
        .to(material, { opacity: 0, duration: 1.8, ease: "power2.in" }, 0);
      restore = () => { material.opacity = 0; };
    }
    return () => { timeline.kill(); restore(); invalidate(); };
  }, [cue, reduced, cover, paper, page, invalidate]);
  if (cue !== "city" || reduced || !marker) return null;
  const x = marker.x / 1024 * SHEET_WIDTH;
  return (
    <mesh ref={ring} position={[x, (0.5 - marker.y / 1440) * SHEET_HEIGHT,
      PAGE_LEVEL + Math.sin(x / SHEET_WIDTH * Math.PI) * PAGE_BOW + 0.008]} raycast={() => {}}>
      <ringGeometry args={[0.026, 0.03, 48]} />
      <meshBasicMaterial color="#314c79" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
