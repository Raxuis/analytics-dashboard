"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
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
  type PageTurn,
} from "./page-turn";
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
  open: boolean;
  page: number;
  uv: boolean;
  reduced: boolean;
  selected: DestinationId | null;
  onOpen: () => void;
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
const uvVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const uvFragment = `varying vec2 vUv; uniform float intensity; void main(){vec2 p=vUv-vec2(.5);float r=length(p*vec2(1.,1.4));float a=atan(p.y,p.x);float lines=pow(.5+.5*sin(r*210.+sin(a*18.)*2.5),18.);float rings=pow(.5+.5*sin(r*110.-a*8.),20.);float edge=1.-smoothstep(.22,.55,r);float alpha=(lines*.55+rings*.35)*edge*intensity;gl_FragColor=vec4(.36,.95,.78,alpha);}`;
function UVPrint({
  active,
  x = 0,
  geometry,
  backFace = false,
}: {
  active: boolean;
  x?: number;
  geometry?: THREE.BufferGeometry;
  backFace?: boolean;
}) {
  const { invalidate } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ intensity: { value: 0 } }), []);
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
  reduced,
  selected,
  onOpen,
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
      const start = gesture.current;
      if (!start || !open || backCover) return;
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > 8) suppressClick.current = true;
      if (!start.direction && !turn) {
        const direction = swipeDirection(dx, dy, 10),
          next = displayed + direction;
        if (direction && next >= 0 && next < textures.spreads.length) {
          start.direction = direction;
          setTurn({ from: displayed, to: next, direction, interactive: true });
        }
      }
      if (start.direction) {
        dragValue.current = THREE.MathUtils.clamp(
          (-dx * start.direction) / (size.width * 0.45),
          0,
          1,
        );
        applyDrag.current?.(dragValue.current);
      }
    };
    const release = (event: PointerEvent) => {
      setPressed(null);
      const start = gesture.current;
      gesture.current = null;
      if (!start || !open) return;
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      suppressClick.current = Math.hypot(dx, dy) > 8;
      if (start.direction) {
        const speed =
          Math.abs(dx) / Math.max(1, performance.now() - start.time);
        const complete =
          dragValue.current > 0.25 || (Math.abs(dx) > 45 && speed > 0.4);
        if (settleDrag.current) settleDrag.current(complete);
        else settleRequest.current = complete;
      } else if (!turn) {
        const direction = swipeDirection(dx, dy);
        const next =
          (backCover ? textures.spreads.length : displayed) + direction;
        if (direction && next >= 0 && next <= textures.spreads.length)
          onTurn(next);
      }
      gl.domElement.style.cursor = "auto";
    };
    const cancel = () => {
      gesture.current = null;
      setPressed(null);
      settleDrag.current?.(false);
    };
    window.addEventListener("pointermove", moving);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", moving);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [
    open,
    turn,
    displayed,
    textures.spreads.length,
    onTurn,
    gl,
    size.width,
    backCover,
  ]);
  const pointer = useRef({ x: 0, y: 0 });
  const coverBody = useMemo(() => roundedCover(PW + 0.13, PH + 0.14, 0.13), []);
  const coverSurface = useMemo(() => roundedCover(PW + 0.12, PH + 0.13), []);
  const coverLining = useMemo(() => coverLiningGeometry(), []);
  useEffect(
    () => () => {
      coverBody.dispose();
      coverSurface.dispose();
      coverLining.dispose();
    },
    [coverBody, coverSurface, coverLining],
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
      duration: reduced ? 0 : 1.35,
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
    const duration = reduced ? 0 : 1.1;
    const timeline = gsap.timeline({
      onUpdate: invalidate,
      onComplete: () => {
        coverMoving.current = false;
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
  }, [spreadOpen, backCover, reduced, invalidate, onBusy, onCity]);
  useEffect(() => {
    if (!open) {
      awaitingPage.current = null;
      setDisplayed(0);
      setTurn(null);
      onBusy(false);
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
    if (!open || turn || coverMoving.current) return;
    lastPointerType.current = e.nativeEvent.pointerType;
    cityPinned.current = false;
    gesture.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      time: performance.now(),
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
    if (!gesture.current) pointer.current = { x: e.pointer.x, y: e.pointer.y };
    invalidate();
  };
  const select = (
    e: ThreeEvent<MouseEvent>,
    side: "left" | "right" = "right",
  ) => {
    e.stopPropagation();
    if (suppressClick.current) return;
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
        if (reduced) return;
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
        <group ref={backHinge} position={[0, 0, REAR_COVER_HINGE_Z]}>
          <group position={[0, 0, -REAR_COVER_HINGE_Z]}>
            <mesh
              position={[PW / 2, 0, -0.102]}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                if (backCover) onTurn(textures.spreads.length - 1);
                else if (!open) onOpen();
              }}
            >
              <primitive object={coverBody} attach="geometry" />
              <meshPhysicalMaterial
                color="#3b0c25"
                roughness={0.65}
                bumpMap={textures.leather}
                bumpScale={0.025}
              />
            </mesh>
            {Array.from({ length: 9 }, (_, i) => (
              <mesh key={i} position={[PW / 2, 0, 0.006 + i * 0.017]}>
                <boxGeometry args={[SHEET_WIDTH, SHEET_HEIGHT, 0.012]} />
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
                <meshStandardMaterial map={face("right")} roughness={0.87} />
              </mesh>
              {open && !turn && displayed === 0 && (
                <VisaOverlay geometry={stationary} map={highlight} />
              )}
              <UVPrint
                active={uv && open && !turn && displayed === 0}
                geometry={stationary}
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
            <meshStandardMaterial map={face("front")} roughness={0.85} />
          </mesh>

          <mesh geometry={back} castShadow receiveShadow>
            <meshStandardMaterial
              map={face("back")}
              side={THREE.BackSide}
              roughness={0.85}
            />
          </mesh>
          <UVPrint
            active={uv && open && !turn && displayed === 0}
            geometry={front}
          />
          <UVPrint
            active={uv && open && !turn && displayed === 0}
            geometry={back}
            backFace
          />
        </group>
        <group ref={hinge} position={[0, 0, CLOSED_COVER_HINGE_Z]}>
          <mesh
            position={[PW / 2, 0, 0]}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation();
              if (backCover) onTurn(textures.spreads.length - 1);
              else onOpen();
            }}
          >
            <primitive object={coverBody} attach="geometry" />
            <meshPhysicalMaterial
              color="#3b0c25"
              roughness={0.55}
              bumpMap={textures.leather}
              bumpScale={0.035}
            />
          </mesh>
          <mesh
            position={[PW / 2, 0, 0.078]}
            onClick={(e) => {
              e.stopPropagation();
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
            <UVPrint active={uv && !open} />
          </group>
          <mesh position={[PW / 2, 0, 0.083]}>
            <planeGeometry args={[PW + 0.12, PH + 0.13]} />
            <meshPhysicalMaterial
              map={textures.foil}
              transparent
              alphaTest={0.12}
              metalness={0.83}
              roughness={0.38}
              color="#d8b36b"
              envMapIntensity={1.6}
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
            <meshStandardMaterial map={face("left")} roughness={0.9} />
            <UVPrint
              active={uv && open && !turn && displayed === 0}
              geometry={coverLining}
            />
          </mesh>
        </group>
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
  const { onError, onProgress } = props;
  useEffect(() => {
    let alive = true;
    let owned: PassportTextures | undefined;
    loadPassportTextures(onProgress)
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
  }, [onError, onProgress]);
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
