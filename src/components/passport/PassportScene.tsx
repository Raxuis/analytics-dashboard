"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Locale } from "@/i18n/language";
import gsap from "gsap";
import { DiscoveryMotion } from "./DiscoveryMotion";
import type { DiscoveryCue } from "./discovery-state";
import {
  loadPassportTextures,
  visaHighlight,
  PassportTextures,
} from "./passport-textures";
import { travelPages } from "./travel-content";
import { cityAtUV, type CityMarker } from "./travel-layout";
import {
  turnFaces,
  queuedTurn,
  turnPose,
  swipeDirection,
  swipeTarget,
  type PageTurn,
} from "./page-turn";
import { coverPose, shouldCompleteDrag, type CoverMove } from "./cover-motion";
import type { DestinationId } from "./destinations";
import {
  destinationAtUV,
  PAGE_WIDTH as PW,
  PAGE_HEIGHT as PH,
  SHEET_WIDTH,
  SHEET_HEIGHT,
} from "./passport-layout";
import {
  roundedCover,
  pageGeometry,
  coverLiningGeometry,
  PAGE_LEVEL,
  PAPER_THICKNESS,
  TURN_CLEARANCE,
  FRONT_LINING_Z,
  CLOSED_COVER_HINGE_Z,
  OPEN_COVER_HINGE_Z,
  REAR_COVER_HINGE_Z,
} from "./passport-geometry";

export type SceneProps = {
  locale: Locale;
  open: boolean;
  page: number;
  uv: boolean;
  uvFull: boolean;
  reduced: boolean;
  selected: DestinationId | null;
  discovery: DiscoveryCue | null;
  onDiscoveryInteraction: () => void;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (id: DestinationId) => void;
  onTurn: (page: number) => void;
  onBusy: (busy: boolean) => void;
  onCity: (
    city: (CityMarker & { clientX: number; clientY: number }) | null,
  ) => void;
  onProgress: (n: number) => void;
  onReady: () => void;
  onError: () => void;
};
const uvVertex = `varying vec2 vUv; varying vec3 vWorld; void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`;
const uvFragment = `varying vec2 vUv; varying vec3 vWorld; uniform float intensity; uniform float full; uniform vec3 lamp; uniform sampler2D ink; uniform float hasInk; void main(){float beam=mix(1.-smoothstep(.22,.95,distance(vWorld,lamp)),1.,full);vec4 plate=texture2D(ink,vUv);float pattern=pow(.5+.5*sin(length(vUv-.5)*210.),18.)*.4;float alpha=mix(pattern,plate.a*.85,hasInk);gl_FragColor=vec4(.28,1.,.74,(alpha+.025)*beam*intensity);}`;
function UVPrint({
  active,
  lamp,
  full,
  ink,
  x = 0,
  geometry,
  backFace = false,
}: {
  active: boolean;
  lamp: THREE.Vector3;
  full: boolean;
  ink?: THREE.Texture;
  x?: number;
  geometry?: THREE.BufferGeometry;
  backFace?: boolean;
}) {
  const { invalidate } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      intensity: { value: 0 },
      lamp: { value: lamp },
      full: { value: 0 },
      ink: { value: null as THREE.Texture | null },
      hasInk: { value: 0 },
    }),
    [lamp],
  );
  useEffect(() => {
    uniforms.full.value = full ? 1 : 0;
    uniforms.ink.value = ink ?? null;
    uniforms.hasInk.value = ink ? 1 : 0;
    invalidate();
  }, [full, ink, uniforms, invalidate]);
  useEffect(() => {
    const t = gsap.to(uniforms.intensity, {
      value: active ? 1 : 0,
      duration: 0.35,
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [active, invalidate, uniforms]);
  return (
    <mesh
      position={[x, 0, geometry ? (backFace ? -0.014 : 0.014) : 0.05]}
      geometry={geometry}
      raycast={() => {}}
    >
      {!geometry && <planeGeometry args={[PW * 0.9, PH * 0.92]} />}
      <shaderMaterial
        ref={material}
        side={backFace ? THREE.BackSide : THREE.FrontSide}
        vertexShader={uvVertex}
        fragmentShader={uvFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
function VisaOverlay({
  geometry,
  map,
}: {
  geometry: THREE.BufferGeometry;
  map: THREE.Texture;
}) {
  return (
    <mesh geometry={geometry} position={[0, 0, 0.014]} raycast={() => {}}>
      <meshBasicMaterial
        map={map}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
function Ready({
  onReady,
  onError,
}: {
  onReady: () => void;
  onError: () => void;
}) {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    let alive = true;
    let frame = 0;
    const lost = () => {
      if (alive) onError();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    (async () => {
      await gl.compileAsync(scene, camera);
      if (!alive) return;
      invalidate();
      frame = requestAnimationFrame(() => {
        if (alive) onReady();
      });
    })().catch(onError);
    return () => {
      alive = false;
      gl.domElement.removeEventListener("webglcontextlost", lost);
      cancelAnimationFrame(frame);
    };
  }, [gl, scene, camera, invalidate, onReady, onError]);
  return null;
}
function Document({
  textures,
  open,
  page,
  uv,
  uvFull,
  reduced,
  selected,
  discovery,
  onDiscoveryInteraction,
  onOpen,
  onClose,
  onSelect,
  onTurn,
  onBusy,
  onCity,
  onReady,
  onError,
}: SceneProps & { textures: PassportTextures }) {
  const { invalidate, size, camera, scene, gl } = useThree();
  const book = useRef<THREE.Group>(null),
    hinge = useRef<THREE.Group>(null),
    backHinge = useRef<THREE.Group>(null),
    leaf = useRef<THREE.Group>(null);
  const lamp = useMemo(() => new THREE.Vector3(-1, 0, 0.3), []);
  const lampDrag = useRef<{ x: number; y: number } | null>(null);
  const lightAt = (e: ThreeEvent<PointerEvent>) => {
    if (!uv) return;
    lamp.copy(e.point);
    invalidate();
  };
  const backCover = page === textures.spreads.length;
  const spreadOpen = open && !backCover;
  const [displayed, setDisplayed] = useState(0);
  const awaitingPage = useRef<number | null>(null);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const [overCity, setOverCity] = useState(false);
  const gesture = useRef<{
    x: number;
    y: number;
    time: number;
    direction?: 1 | -1;
    cover?: CoverMove;
    lastX: number;
    lastTime: number;
    velocity: number;
  } | null>(null);
  const dragValue = useRef(0);
  const applyDrag = useRef<((value: number) => void) | null>(null);
  const settleDrag = useRef<((complete: boolean) => void) | null>(null);
  const settleRequest = useRef<boolean | null>(null);
  const suppressClick = useRef(false);
  const cityPinned = useRef(false);
  const lastPointerType = useRef("mouse");
  const faces = turn ? turnFaces(turn) : null;
  const face = (key: "left" | "right" | "front" | "back") => {
    const spec = faces?.[key];
    return spec
      ? textures.spreads[spec[0]]![spec[1]]
      : textures.spreads[displayed]![
          key === "left" || key === "back" ? "left" : "right"
        ];
  };
  const [hovered, setHovered] = useState<DestinationId | null>(null);
  const [pressed, setPressed] = useState<DestinationId | null>(null);
  const [overBook, setOverBook] = useState(false);
  const coverMoving = useRef(false);
  const coverAcknowledged = useRef(false);
  const coverInitialized = useRef(false);
  const coverSettlement = useRef<gsap.core.Tween | null>(null);
  const applyCoverPose = useCallback(
    (move: CoverMove, progress: number) => {
      const pose = coverPose(move, progress);
      if (!hinge.current || !backHinge.current || !book.current) return;
      hinge.current.rotation.y = pose.frontAngle;
      hinge.current.position.z = pose.frontZ;
      backHinge.current.rotation.y = pose.rearAngle;
      book.current.position.x = pose.bookX;
      camera.position.z = Math.max(
        9.2,
        (4 + pose.openness * 2.8) /
          (2 * Math.tan((19 * Math.PI) / 180) * (size.width / size.height)),
      );
      invalidate();
    },
    [camera, size.width, size.height, invalidate],
  );
  const settleCover = useCallback(
    (move: CoverMove, complete: boolean) => {
      const progress = { value: dragValue.current };
      coverSettlement.current?.kill();
      coverSettlement.current = gsap.to(progress, {
        value: complete ? 1 : 0,
        duration: reduced ? 0 : 0.38,
        ease: "power2.inOut",
        onUpdate: () => applyCoverPose(move, progress.value),
        onComplete: () => {
          applyCoverPose(move, complete ? 1 : 0);
          coverMoving.current = false;
          coverSettlement.current = null;
          onBusy(false);
          if (complete) {
            coverAcknowledged.current = true;
            if (move === "front-close") onClose();
            else
              onTurn(
                move === "rear-close"
                  ? textures.spreads.length
                  : textures.spreads.length - 1,
              );
          }
          invalidate();
        },
      });
    },
    [
      applyCoverPose,
      reduced,
      onBusy,
      onClose,
      onTurn,
      textures.spreads.length,
      invalidate,
    ],
  );
  useEffect(
    () => () => {
      coverSettlement.current?.kill();
    },
    [],
  );
  const highlight = useMemo(
    () => visaHighlight(displayed, hovered, selected, pressed),
    [displayed, hovered, selected, pressed],
  );
  useEffect(() => () => highlight.dispose(), [highlight]);
  useEffect(() => {
    gl.domElement.style.cursor = gesture.current
      ? "grabbing"
      : hovered || overCity || ((!open || backCover) && overBook)
        ? "pointer"
        : open && overBook
          ? "grab"
          : "auto";
    return () => {
      gl.domElement.style.cursor = "auto";
    };
  }, [gl, hovered, overCity, open, overBook, backCover]);
  useEffect(() => {
    const moving = (event: PointerEvent) => {
      if (lampDrag.current) {
        if (
          Math.hypot(
            event.clientX - lampDrag.current.x,
            event.clientY - lampDrag.current.y,
          ) > 8
        )
          suppressClick.current = true;
        return;
      }
      const start = gesture.current;
      if (!start || !open) return;
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > 8) suppressClick.current = true;
      if (!start.direction && !turn) {
        const direction = swipeDirection(dx, dy, 10);
        const current = backCover ? textures.spreads.length : displayed;
        const target = swipeTarget(current, direction, textures.spreads.length);
        if (direction && target !== null) {
          start.direction = direction;
          if (
            target === "front-cover" ||
            target === textures.spreads.length ||
            backCover
          ) {
            start.cover =
              target === "front-cover"
                ? "front-close"
                : backCover
                  ? "rear-open"
                  : "rear-close";
            coverMoving.current = true;
            gsap.killTweensOf(camera.position);
            onBusy(true);
            setHovered(null);
            setPressed(null);
            onCity(null);
          } else
            setTurn({
              from: displayed,
              to: target,
              direction,
              interactive: true,
            });
        }
      }
      if (start.direction) {
        dragValue.current = THREE.MathUtils.clamp(
          (-dx * start.direction) / (size.width * 0.45),
          0,
          1,
        );
        const now = performance.now();
        start.velocity =
          (-(event.clientX - start.lastX) * start.direction) /
          Math.max(1, now - start.lastTime);
        start.lastX = event.clientX;
        start.lastTime = now;
        if (start.cover) applyCoverPose(start.cover, dragValue.current);
        else applyDrag.current?.(dragValue.current);
      }
    };
    const release = (event: PointerEvent) => {
      setPressed(null);
      if (lampDrag.current) {
        lampDrag.current = null;
        return;
      }
      const start = gesture.current;
      gesture.current = null;
      if (!start || !open) return;
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      suppressClick.current = Math.hypot(dx, dy) > 8;
      if (start.direction) {
        const velocity =
          performance.now() - start.lastTime < 100 ? start.velocity : 0;
        const complete = shouldCompleteDrag(dragValue.current, velocity);
        if (start.cover) settleCover(start.cover, complete);
        else if (settleDrag.current) settleDrag.current(complete);
        else settleRequest.current = complete;
      } else if (!turn) {
        const direction = swipeDirection(dx, dy);
        const target = swipeTarget(
          backCover ? textures.spreads.length : displayed,
          direction,
          textures.spreads.length,
        );
        if (target === "front-cover") onClose();
        else if (target !== null) onTurn(target);
      }
      gl.domElement.style.cursor = "auto";
    };
    const cancel = () => {
      const start = gesture.current;
      gesture.current = null;
      if (start?.cover) settleCover(start.cover, false);
      lampDrag.current = null;
      setPressed(null);
      settleDrag.current?.(false);
    };
    window.addEventListener("pointermove", moving);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointermove", moving);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [
    open,
    turn,
    displayed,
    textures.spreads.length,
    onTurn,
    onClose,
    gl,
    size.width,
    backCover,
    applyCoverPose,
    settleCover,
    camera,
    onBusy,
    onCity,
  ]);
  const pointer = useRef({ x: 0, y: 0 });
  const coverBody = useMemo(() => roundedCover(PW + 0.13, PH + 0.14, 0.13), []);
  const coverSurface = useMemo(() => roundedCover(PW + 0.12, PH + 0.13), []);
  const coverLining = useMemo(() => coverLiningGeometry(), []);
  const stitching = useMemo(() => {
    const vertices: number[] = [];
    for (let y = -PH * 0.39; y < PH * 0.4; y += 0.18)
      vertices.push(
        -0.016,
        y,
        PAGE_LEVEL + 0.006,
        0.016,
        y + 0.045,
        PAGE_LEVEL + 0.006,
      );
    return new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
  }, []);
  useEffect(
    () => () => {
      coverBody.dispose();
      coverSurface.dispose();
      coverLining.dispose();
      stitching.dispose();
    },
    [coverBody, coverSurface, coverLining, stitching],
  );
  const front = useMemo(() => pageGeometry(), []),
    back = useMemo(() => pageGeometry(true), []),
    stationary = useMemo(() => pageGeometry(), []);
  useEffect(
    () => () => {
      front.dispose();
      back.dispose();
      stationary.dispose();
    },
    [front, back, stationary],
  );
  useEffect(() => {
    scene.environment = textures.environment;
    return () => {
      scene.environment = null;
    };
  }, [scene, textures]);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const distance = Math.max(
      9.2,
      (spreadOpen ? 6.8 : 4.0) / (2 * Math.tan((19 * Math.PI) / 180) * aspect),
    );
    cam.fov = 38;
    cam.updateProjectionMatrix();
    const tween = gsap.to(cam.position, {
      z: distance,
      duration: reduced || coverAcknowledged.current ? 0 : 1.1,
      ease: "power3.inOut",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [camera, size.width, size.height, spreadOpen, reduced, invalidate]);
  useEffect(() => {
    const cover = hinge.current,
      rear = backHinge.current,
      document = book.current;
    if (!cover || !rear || !document) return;
    coverMoving.current = true;
    onBusy(true);
    onCity(null);
    const duration =
      reduced || coverAcknowledged.current || !coverInitialized.current
        ? 0
        : 1.1;
    coverAcknowledged.current = false;
    coverInitialized.current = true;
    const timeline = gsap.timeline({
      onUpdate: invalidate,
      onComplete: () => {
        coverMoving.current = false;
        if (!open) setDisplayed(0);
        onBusy(false);
        invalidate();
      },
    });
    // Both resting page surfaces share PAGE_LEVEL; the front cover lowers as it opens.
    timeline.to(
      cover.position,
      {
        z: spreadOpen || backCover ? OPEN_COVER_HINGE_Z : CLOSED_COVER_HINGE_Z,
        duration,
        ease: "power3.inOut",
      },
      0,
    );
    // Close the right-hand page block over the left cover; never spin the whole book.
    timeline
      .to(
        rear.rotation,
        { y: backCover ? -Math.PI : 0, duration, ease: "power3.inOut" },
        0,
      )
      .to(
        cover.rotation,
        {
          y: spreadOpen || backCover ? -Math.PI : 0,
          duration,
          ease: "power3.inOut",
        },
        0,
      )
      .to(
        document.position,
        {
          x: backCover ? PW / 2 : spreadOpen ? 0 : -PW / 2,
          duration,
          ease: "power3.inOut",
        },
        0,
      );
    return () => {
      timeline.kill();
      coverMoving.current = false;
    };
  }, [spreadOpen, backCover, open, reduced, invalidate, onBusy, onCity]);
  useEffect(() => {
    if (!open) {
      awaitingPage.current = null;
      setTurn(null);
      onCity(null);
      return;
    }
    if (backCover) {
      onCity(null);
      return;
    }
    const target = queuedTurn(page, displayed, awaitingPage.current);
    if (awaitingPage.current === page) awaitingPage.current = null;
    if (target !== null && !turn)
      setTurn({
        from: displayed,
        to: target,
        direction: target > displayed ? 1 : -1,
      });
  }, [page, displayed, turn, open, backCover, onBusy, onCity]);
  useEffect(() => {
    const sheet = leaf.current;
    if (!sheet || !turn) return;
    setHovered(null);
    setPressed(null);
    setOverCity(false);
    onCity(null);
    onBusy(true);
    const progress = { value: turn.interactive ? dragValue.current : 0 };
    const update = () => {
      const pose = turnPose(progress.value, turn.direction);
      sheet.rotation.y = pose.angle;
      sheet.position.z = pose.z;
      const f = front.attributes.position!,
        b = back.attributes.position!;
      for (let i = 0; i < f.count; i++) {
        const z = Math.sin((f.getX(i) / SHEET_WIDTH) * Math.PI) * pose.bend;
        f.setZ(i, z);
        b.setZ(i, z - PAPER_THICKNESS);
      }
      f.needsUpdate = true;
      b.needsUpdate = true;
      front.computeVertexNormals();
      back.computeVertexNormals();
      invalidate();
    };
    update();
    let tween: gsap.core.Tween | undefined;
    const finish = (complete: boolean) => {
      tween?.kill();
      tween = gsap.to(progress, {
        value: complete ? 1 : 0,
        duration: reduced ? 0 : turn.interactive ? 0.32 : 0.95,
        ease: "power2.inOut",
        onUpdate: update,
        onComplete: () => {
          const next = complete ? turn.to : turn.from;
          if (turn.interactive) awaitingPage.current = next;
          setDisplayed(next);
          setTurn(null);
          onBusy(false);
          if (turn.interactive) onTurn(next);
          invalidate();
        },
      });
    };
    if (turn.interactive) {
      applyDrag.current = (value) => {
        progress.value = value;
        update();
      };
      settleDrag.current = finish;
      if (settleRequest.current !== null) {
        const request = settleRequest.current;
        settleRequest.current = null;
        finish(request);
      }
    } else finish(true);
    return () => {
      tween?.kill();
      applyDrag.current = null;
      settleDrag.current = null;
    };
  }, [turn, reduced, front, back, invalidate, onBusy, onCity, onTurn]);
  useFrame((_, delta) => {
    if (!book.current || reduced || coverMoving.current) return;
    const x = -0.09 + pointer.current.y * 0.09,
      y = -0.12 + pointer.current.x * 0.14;
    const r = book.current.rotation;
    const d = Math.min(delta, 0.05);
    r.x = THREE.MathUtils.damp(r.x, x, 7, d);
    r.y = THREE.MathUtils.damp(r.y, y, 7, d);
    if (Math.abs(r.x - x) + Math.abs(r.y - y) > 0.0002) invalidate();
  });
  const hit = (e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>) =>
    spreadOpen && displayed === 0 && !turn && !coverMoving.current && e.uv
      ? destinationAtUV(0, e.uv.x, e.uv.y)
      : null;
  const begin = (e: ThreeEvent<PointerEvent>) => {
    onDiscoveryInteraction();
    suppressClick.current = false;
    lightAt(e);
    if (turn || coverMoving.current) return;
    lastPointerType.current = e.nativeEvent.pointerType;
    cityPinned.current = false;
    if (uv && !uvFull) {
      lampDrag.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      suppressClick.current = false;
      return;
    }
    if (!open) return;
    gesture.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      time: performance.now(),
      lastX: e.nativeEvent.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
    dragValue.current = 0;
    settleRequest.current = null;
    suppressClick.current = false;
    gl.domElement.style.cursor = "grabbing";
  };
  const cityHit = (
    e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>,
    side: "left" | "right",
  ) => {
    if (!spreadOpen || turn || displayed === 0 || !e.uv) return null;
    const memory =
      travelPages[(displayed - 1) * 2 + (side === "right" ? 1 : 0)]?.memory;
    return cityAtUV(memory, e.uv.x, e.uv.y);
  };
  const move = (
    e: ThreeEvent<PointerEvent>,
    side: "left" | "right" = "right",
  ) => {
    e.stopPropagation();
    lightAt(e);
    setOverBook(true);
    setHovered(side === "right" ? hit(e) : null);
    const city = cityHit(e, side);
    setOverCity(!!city);
    onCity(
      city && !gesture.current
        ? {
            ...city,
            clientX: e.nativeEvent.clientX,
            clientY: e.nativeEvent.clientY,
          }
        : null,
    );
    if (!gesture.current && !uv)
      pointer.current = { x: e.pointer.x, y: e.pointer.y };
    invalidate();
  };
  const select = (
    e: ThreeEvent<MouseEvent>,
    side: "left" | "right" = "right",
  ) => {
    e.stopPropagation();
    if (suppressClick.current || coverMoving.current) return;
    const id = side === "right" ? hit(e) : null;
    if (id) onSelect(id);
    const city = cityHit(e, side);
    cityPinned.current = lastPointerType.current === "touch";
    if (city)
      onCity({
        ...city,
        clientX: e.nativeEvent.clientX,
        clientY: e.nativeEvent.clientY,
      });
    else onCity(null);
  };
  const press = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setPressed(hit(e));
    begin(e);
  };
  const leave = () => {
    setHovered(null);
    setPressed(null);
    setOverCity(false);
    if (!gesture.current && !cityPinned.current) onCity(null);
  };
  return (
    <group
      onPointerDown={begin}
      position={[0, 0.08, 0]}
      onPointerMove={(e) => {
        setOverBook(true);
        lightAt(e);
        if (reduced || uv) return;
        pointer.current = { x: e.pointer.x, y: e.pointer.y };
        invalidate();
      }}
      onPointerLeave={() => {
        setOverBook(false);
        leave();
        pointer.current = { x: 0, y: 0 };
        invalidate();
      }}
    >
      <group
        ref={book}
        position={[-PW / 2, 0, 0]}
        rotation={[-0.09, -0.12, -0.105]}
      >
        <DiscoveryMotion cue={discovery} reduced={reduced} cover={hinge} paper={stationary} page={displayed} />
        <group ref={backHinge} position={[0, 0, REAR_COVER_HINGE_Z]}>
          <group position={[0, 0, -REAR_COVER_HINGE_Z]}>
            <mesh
              position={[PW / 2, 0, -0.102]}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (suppressClick.current || coverMoving.current) return;
                if (backCover) onTurn(textures.spreads.length - 1);
                else if (!open) onOpen();
              }}
            >
              <primitive object={coverBody} attach="geometry" />
              <meshPhysicalMaterial
                color="#3b0c25"
                roughness={0.78}
                bumpMap={textures.leather}
                bumpScale={0.025}
              />
            </mesh>
            {Array.from({ length: 15 }, (_, i) => (
              <mesh key={i} position={[PW / 2, 0, 0.006 + i * 0.01]}>
                <boxGeometry args={[SHEET_WIDTH, SHEET_HEIGHT, 0.009]} />
                <meshStandardMaterial
                  color={i % 2 ? "#d7d4bf" : "#ece7d4"}
                  roughness={0.9}
                />
              </mesh>
            ))}
            <group position={[0, 0, PAGE_LEVEL]}>
              <mesh
                geometry={stationary}
                onClick={(e) => select(e)}
                onPointerMove={(e) => move(e)}
                onPointerDown={press}
                onPointerUp={() => setPressed(null)}
                onPointerOut={leave}
                receiveShadow
              >
                <meshStandardMaterial
                  map={face("right")}
                  bumpMap={textures.paperBump}
                  bumpScale={0.006}
                  roughness={0.87}
                />
              </mesh>
              {open && !turn && displayed === 0 && (
                <VisaOverlay geometry={stationary} map={highlight} />
              )}
              <UVPrint
                active={uv && spreadOpen && !turn}
                geometry={stationary}
                lamp={lamp}
                full={uvFull}
                ink={textures.uvSpreads[displayed]?.right}
              />
            </group>
            <mesh position={[PW * 0.81, -PH / 2 - 0.15, -0.02]}>
              <boxGeometry args={[0.18, 0.45, 0.015]} />
              <meshStandardMaterial color="#b85136" roughness={0.95} />
            </mesh>
          </group>
        </group>
        <group
          ref={leaf}
          position={[0, 0, PAGE_LEVEL + TURN_CLEARANCE]}
          visible={!!turn}
        >
          <mesh
            geometry={front}
            onClick={(e) => select(e)}
            onPointerMove={(e) => move(e)}
            onPointerDown={press}
            onPointerUp={() => setPressed(null)}
            onPointerOut={leave}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              map={face("front")}
              bumpMap={textures.paperBump}
              bumpScale={0.006}
              roughness={0.85}
            />
          </mesh>

          <mesh geometry={back} castShadow receiveShadow>
            <meshStandardMaterial
              map={face("back")}
              bumpMap={textures.paperBump}
              bumpScale={0.006}
              side={THREE.BackSide}
              roughness={0.85}
            />
          </mesh>
        </group>
        <group ref={hinge} position={[0, 0, CLOSED_COVER_HINGE_Z]}>
          <mesh
            position={[PW / 2, 0, 0]}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              if (suppressClick.current || coverMoving.current) return;
              if (backCover) onTurn(textures.spreads.length - 1);
              else onOpen();
            }}
          >
            <primitive object={coverBody} attach="geometry" />
            <meshPhysicalMaterial
              color="#3b0c25"
              roughness={0.74}
              bumpMap={textures.leather}
              bumpScale={0.018}
            />
          </mesh>
          <mesh
            position={[PW / 2, 0, 0.078]}
            onClick={(e) => {
              e.stopPropagation();
              if (suppressClick.current || coverMoving.current) return;
              if (backCover) onTurn(textures.spreads.length - 1);
              else onOpen();
            }}
          >
            <primitive object={coverSurface} attach="geometry" />
            <meshStandardMaterial
              map={textures.cover}
              roughness={0.7}
              bumpMap={textures.leather}
              bumpScale={0.012}
            />
          </mesh>
          <group position={[PW / 2, 0, 0.08]}>
            <UVPrint active={uv && !open} lamp={lamp} full={uvFull} />
          </group>
          <mesh position={[PW / 2, 0, 0.083]}>
            <planeGeometry args={[PW + 0.12, PH + 0.13]} />
            <meshPhysicalMaterial
              map={textures.foil}
              transparent
              alphaTest={0.12}
              metalness={0.92}
              roughness={0.32}
              color="#d8b36b"
              envMapIntensity={1.1}
              depthWrite={false}
            />
          </mesh>
          <mesh
            position={[SHEET_WIDTH / 2, 0, FRONT_LINING_Z]}
            rotation={[0, Math.PI, 0]}
            onPointerMove={(e) => move(e, "left")}
            onPointerDown={begin}
            onPointerOut={leave}
            onClick={(e) => select(e, "left")}
          >
            <primitive object={coverLining} attach="geometry" />
            <meshStandardMaterial
              map={face("left")}
              bumpMap={textures.paperBump}
              bumpScale={0.006}
              roughness={0.9}
            />
            <UVPrint
              active={uv && spreadOpen && !turn}
              geometry={coverLining}
              lamp={lamp}
              full={uvFull}
              ink={textures.uvSpreads[displayed]?.left}
            />
          </mesh>
        </group>
        <lineSegments
          geometry={stitching}
          visible={spreadOpen}
          raycast={() => {}}
        >
          <lineBasicMaterial color="#8e7d6c" transparent opacity={0.6} />
        </lineSegments>
        <mesh position={[0.005, 0, 0.06]}>
          <cylinderGeometry args={[0.047, 0.047, PH + 0.08, 12]} />
          <meshStandardMaterial color="#381022" roughness={0.7} />
        </mesh>
      </group>
      <Ready onReady={onReady} onError={onError} />
    </group>
  );
}
function Scene({
  textures,
  ...props
}: SceneProps & { textures: PassportTextures }) {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[-4, 6, 8]}
        intensity={2.1}
        color={props.uv ? "#aaa4ff" : "#fff0d3"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />
      <pointLight
        position={[4, -2, 4]}
        intensity={props.uv ? 16 : 8}
        color={props.uv ? "#7762ff" : "#90b9b2"}
      />
      <Document textures={textures} {...props} />
      <mesh position={[0, 0, -0.42]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial transparent opacity={0.28} />
      </mesh>
    </>
  );
}
export default function PassportScene(props: SceneProps) {
  const [textures, setTextures] = useState<PassportTextures | null>(null);
  const { onError, onProgress, locale } = props;
  useEffect(() => {
    let alive = true;
    let owned: PassportTextures | undefined;
    loadPassportTextures(onProgress, locale)
      .then((t) => {
        owned = t;
        if (alive) setTextures(t);
        else t.dispose();
      })
      .catch(() => {
        if (alive) onError();
      });
    return () => {
      alive = false;
      owned?.dispose();
    };
  }, [onError, onProgress, locale]);
  const created = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(0x000000, 0);
  }, []);
  if (!textures) return null;
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 9.2], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      onCreated={created}
      onPointerMissed={() => {
        props.onCity(null);
      }}
      fallback={null}
    >
      <Scene textures={textures} {...props} />
    </Canvas>
  );
}
