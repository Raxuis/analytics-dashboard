import * as THREE from "three";
import { countryFlag } from "./country-flags";
import { identityMachineLines } from "./identity-data";
import { TRAVEL_MAP, cityMarkers } from "./travel-layout";
import { travelPages, countryName, type TravelMemory } from "./travel-content";
import {
  PAGE_LINKS,
  visaPapers,
  visaAccents,
  type VisaRegion,
} from "./passport-layout";
import { destinations, type DestinationId } from "./destinations";

const W = 1024,
  H = 1440;
const ink = "#393747",
  muted = "#6d5f6b",
  red = "#b55d43";
export type PassportTextures = {
  cover: THREE.CanvasTexture;
  leather: THREE.CanvasTexture;
  paperBump: THREE.CanvasTexture;
  foil: THREE.CanvasTexture;
  identity: THREE.CanvasTexture;
  visas: THREE.CanvasTexture;
  spreads: { left: THREE.CanvasTexture; right: THREE.CanvasTexture }[];
  uvSpreads: { left: THREE.CanvasTexture; right: THREE.CanvasTexture }[];
  environment: THREE.CanvasTexture;
  dispose: () => void;
};
function canvas(w = W, h = H) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  const c = el.getContext("2d");
  if (!c) throw new Error("Canvas indisponible");
  return { el, c };
}
function texture(el: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(el);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function text(
  c: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size = 24,
  color = ink,
  font = "DM Sans",
  align: CanvasTextAlign = "left",
  weight = 400,
  maxWidth?: number,
) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px ${font === "monospace" ? "monospace" : `"${font}"`}`;
  c.textAlign = align;
  if (maxWidth) c.fillText(str, x, y, maxWidth);
  else c.fillText(str, x, y);
}
function line(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color = "#adb5a5",
) {
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w, y);
  c.stroke();
}
function paper(page = 1) {
  const { el, c } = canvas();
  c.fillStyle = "#f2e9df";
  c.fillRect(0, 0, W, H);
  const wash = c.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, "#d7e4ed80");
  wash.addColorStop(0.45, "#f0d9df55");
  wash.addColorStop(1, "#d9d6e375");
  c.fillStyle = wash;
  c.fillRect(0, 0, W, H);
  let seed = 71 + page;
  for (let i = 0; i < 18000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % W;
    seed = (seed * 16807) % 2147483647;
    const y = seed % H;
    c.fillStyle = i % 2 ? "#7c687412" : "#ffffff36";
    c.fillRect(x, y, 1, 1);
  }
  // Fine printed guilloché, rather than a decorative web layout.
  for (let j = 0; j < 65; j++) {
    c.strokeStyle = j % 2 ? "#9c82a51d" : "#7295af1c";
    c.lineWidth = 0.7;
    c.beginPath();
    for (let y = 0; y <= H; y += 6) {
      const x =
        W * 0.5 +
        Math.sin(y * 0.006 + j * 0.075) * 400 +
        Math.sin(y * 0.017 + j * 0.15) * 45;
      if (!y) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.save();
  c.globalAlpha = 0.055;
  if (page <= 2)
    text(c, "R", W * 0.58, H * 0.62, 620, "#6b5c88", "DM Sans", "center", 500);
  c.restore();
  // Binding shadow and a restrained page number are part of the document.
  const fold = c.createLinearGradient(0, 0, 75, 0);
  fold.addColorStop(0, "#55465528");
  fold.addColorStop(1, "#55465500");
  c.fillStyle = fold;
  c.fillRect(0, 0, 75, H);
  text(
    c,
    String(page).padStart(2, "0"),
    W - 72,
    H - 55,
    24,
    "#675b66",
    "OCR B",
    "right",
  );
  return { el, c };
}
function documentHeader(c: CanvasRenderingContext2D, title: string) {
  text(c, "PASSEPORT PERSONNEL", 72, 89, 25, "#4d506a", "DM Sans", "left", 600);
  text(c, "RAXUIS", W - 72, 89, 22, "#675b75", "DM Sans", "right");
  text(c, title, 72, 149, 23, "#675b75", "DM Sans", "left", 500);
}
function field(
  c: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  size = 39,
) {
  text(c, label.toUpperCase(), x, y, 24, "#54465f", "DM Sans");
  text(c, value, x, y + 49, size, "#31344b", "DM Sans", "left", 500);
}
function stampOutline(c: CanvasRenderingContext2D, r: VisaRegion, inset = 0) {
  const w = r.width * W - inset * 2,
    h = r.height * H - inset * 2;
  c.beginPath();
  if (r.shape === "oval") c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  else c.roundRect(-w / 2, -h / 2, w, h, 6);
}
function printedVisa(c: CanvasRenderingContext2D, r: VisaRegion) {
  const d = destinations.find((d) => d.id === r.id)!;
  const w = r.width * W,
    h = r.height * H;
  c.save();
  c.translate((r.x + r.width / 2) * W, (r.y + r.height / 2) * H);
  c.rotate(r.angle);
  c.fillStyle = visaPapers[r.id];
  c.strokeStyle = r.ink;
  c.lineWidth = 3;
  stampOutline(c, r);
  c.fill();
  c.stroke();
  c.lineWidth = 1;
  stampOutline(c, r, 9);
  c.stroke();
  const label = d.label.toUpperCase();
  const fontSize =
    r.id === "linkedin" ? Math.min(40, w * 0.1) : Math.min(51, w * 0.12);
  text(c, label, 0, -h * 0.07, fontSize, r.ink, "DM Sans", "center", 700);
  const handle =
    r.id === "portfolio"
      ? d.domain
      : r.id === "github"
        ? "github.com/Raxuis"
        : r.id === "linkedin"
          ? "Raphaël Raclot"
          : "@I_Haruki_I";
  text(
    c,
    handle,
    0,
    h * 0.23,
    Math.min(29, w * 0.067),
    r.ink,
    "DM Sans",
    "center",
    600,
  );
  c.restore();
}
function travelVignette(
  c: CanvasRenderingContext2D,
  memory: TravelMemory,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  tint: string,
  flag?: HTMLImageElement,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.shadowColor = "#242c3638";
  c.shadowBlur = 9;
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 5;
  c.fillStyle = "#f6f1e8";
  c.fillRect(0, 0, w, h);
  c.shadowColor = "transparent";
  c.fillStyle = tint + "24";
  c.fillRect(0, 0, w, 70);
  // Fine security linework belongs to the vignette substrate.
  c.save();
  c.beginPath();
  c.rect(0, 70, w, h - 70);
  c.clip();
  c.strokeStyle = tint + "23";
  c.lineWidth = 1;
  for (let i = -h; i < w + h; i += 9) {
    c.beginPath();
    for (let t = 0; t <= h; t += 4) {
      const px = i + Math.sin(t / 38) * 17;
      if (t === 0) c.moveTo(px, t);
      else c.lineTo(px, t);
    }
    c.stroke();
  }
  c.restore();
  c.strokeStyle = tint + "8c";
  c.lineWidth = 1.5;
  c.strokeRect(10, 10, w - 20, h - 20);
  if (flag) {
    c.drawImage(flag, 25, 23, 40, 30);
    c.strokeStyle = tint + "40";
    c.lineWidth = 0.7;
    c.strokeRect(25, 23, 40, 30);
  }
  text(
    c,
    countryName(memory.country).toLocaleUpperCase("fr"),
    flag ? 79 : 25,
    47,
    Math.min(32, w * 0.072),
    tint,
    "DM Sans",
    "left",
    700,
    w - (flag ? 104 : 50),
  );
  text(c, "VOYAGES PERSONNELS", 25, 109, 17, tint, "DM Sans", "left", 500);
  if (memory.visits)
    text(
      c,
      `${memory.visits} ${memory.visits === 1 ? "visite" : "visites"}`,
      25,
      168,
      43,
      "#282638",
      "DM Sans",
      "left",
      600,
    );
  else text(c, "Visité", 25, 168, 39, "#282638", "DM Sans", "left", 600);
  if (memory.places)
    text(
      c,
      memory.places.join(", "),
      25,
      215,
      26,
      "#393747",
      "DM Sans",
      "left",
      500,
    );
  text(c, "RAPHAËL RACLOT", 25, h - 27, 18, tint, "DM Sans", "left", 500);
  c.restore();
}

export function visaHighlight(
  page: number,
  hovered: DestinationId | null,
  selected: DestinationId | null,
  pressed: DestinationId | null,
) {
  const { el, c } = canvas();
  for (const r of PAGE_LINKS[page] ?? []) {
    if (r.id !== hovered && r.id !== selected && r.id !== pressed) continue;
    c.save();
    c.translate((r.x + r.width / 2) * W, (r.y + r.height / 2) * H);
    c.rotate(r.angle);
    const accent = visaAccents[r.id];
    c.fillStyle = `${accent}${r.id === pressed ? "40" : r.id === selected ? "2b" : "1c"}`;
    c.strokeStyle = `${accent}${r.id === selected || r.id === pressed ? "f2" : "d9"}`;
    c.lineWidth = r.id === selected ? 5 : 3;
    stampOutline(c, r, -4);
    c.fill();
    c.stroke();
    if (r.id === selected) {
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-r.width * W * 0.4, r.height * H * 0.31);
      c.lineTo(-r.width * W * 0.37, r.height * H * 0.35);
      c.lineTo(-r.width * W * 0.31, r.height * H * 0.25);
      c.stroke();
    }
    c.restore();
  }
  return texture(el);
}
function image(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error(`Impossible de charger ${url}`));
    i.src = url;
  });
}
export async function loadPassportTextures(
  progress: (n: number) => void,
): Promise<PassportTextures> {
  let done = 0;
  const uniqueCountries = [
    ...new Set(travelPages.map((p) => p.memory.country)),
  ];
  const countryImages = new Map<string, HTMLImageElement>();
  const flagImages = new Map<string, HTMLImageElement>();
  const loaded = () => progress((++done / (3 + uniqueCountries.length)) * 100);
  const [portrait, crest] = await Promise.all([
    image("/avatar.jpg").then((v) => {
      loaded();
      return v;
    }),
    image("/identity/passport-crest.svg").then((v) => {
      loaded();
      return v;
    }),
    Promise.all(
      uniqueCountries.map(async (code) => {
        const flag = countryFlag(code);
        await Promise.all([
          image(`/identity/countries/${code}.svg`).then((value) =>
            countryImages.set(code, value),
          ),
          flag
            ? image(flag).then((value) => flagImages.set(code, value)).catch(() => undefined)
            : Promise.resolve(),
        ]);
        loaded();
      }),
    ),
    Promise.all([
      new FontFace("DM Sans", "url(/fonts/dm-sans.ttf)").load(),
      new FontFace("Space Grotesk", "url(/fonts/space-grotesk.ttf)").load(),
      new FontFace("OCR B", "url(/fonts/ocr-b.ttf)").load(),
    ]).then((fonts) => {
      fonts.forEach((f) => document.fonts.add(f));
      loaded();
      return null;
    }),
  ]);
  const cover = canvas();
  const c = cover.c;
  c.fillStyle = "#3d0827";
  c.fillRect(0, 0, W, H);
  const edge = c.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "#10030e88");
  edge.addColorStop(0.055, "#ffffff04");
  edge.addColorStop(0.4, "#791a3c0a");
  edge.addColorStop(1, "#18061535");
  c.fillStyle = edge;
  c.fillRect(0, 0, W, H);
  let noise = 5;
  for (let i = 0; i < 100000; i++) {
    noise = (noise * 16807) % 2147483647;
    const x = noise % W;
    noise = (noise * 16807) % 2147483647;
    const y = noise % H;
    c.fillStyle = i % 2 ? "#d6a8af0b" : "#08000a1c";
    c.fillRect(x, y, 1.5, 1.5);
  }
  // A separate alpha mask puts all lettering and the French-inspired vector emblem in metallic foil.
  const foil = canvas();
  text(
    foil.c,
    "Raphaël Raclot",
    W / 2,
    190,
    45,
    "#ffffff",
    "DM Sans",
    "center",
  );
  text(foil.c, "Raxuis", W / 2, 250, 41, "#ffffff", "DM Sans", "center");
  foil.c.drawImage(crest, 260, 435, 504, 536);
  text(
    foil.c,
    "PASSEPORT",
    W / 2,
    1195,
    55,
    "#ffffff",
    "DM Sans",
    "center",
    600,
  );
  foil.c.strokeStyle = "#ffffff";
  foil.c.lineWidth = 3;
  foil.c.beginPath();
  foil.c.moveTo(W / 2 - 165, 1211);
  foil.c.lineTo(W / 2 + 165, 1211);
  foil.c.stroke();
  foil.c.lineWidth = 4;
  foil.c.beginPath();
  foil.c.roundRect(W / 2 - 43, 1246, 86, 52, 2);
  foil.c.stroke();
  foil.c.beginPath();
  foil.c.arc(W / 2, 1272, 16, 0, Math.PI * 2);
  foil.c.stroke();
  foil.c.beginPath();
  foil.c.moveTo(W / 2 - 43, 1272);
  foil.c.lineTo(W / 2 - 16, 1272);
  foil.c.moveTo(W / 2 + 16, 1272);
  foil.c.lineTo(W / 2 + 43, 1272);
  foil.c.stroke();
  const leather = canvas(512, 512);
  const pores = leather.c.createImageData(512, 512);
  let materialSeed = 947;
  for (let i = 0; i < pores.data.length; i += 4) {
    materialSeed = (materialSeed * 16807) % 2147483647;
    const value = 124 + (materialSeed % 33);
    pores.data[i] = pores.data[i + 1] = pores.data[i + 2] = value;
    pores.data[i + 3] = 255;
  }
  leather.c.putImageData(pores, 0, 0);
  const paperGrain = canvas(256, 256);
  paperGrain.c.fillStyle = "#808080";
  paperGrain.c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    materialSeed = (materialSeed * 16807) % 2147483647;
    paperGrain.c.fillStyle = i % 2 ? "#919191" : "#727272";
    paperGrain.c.fillRect(
      materialSeed % 256,
      Math.floor(materialSeed / 256) % 256,
      i % 7 === 0 ? 3 : 1,
      1,
    );
  }
  const paperBump = texture(paperGrain.el, false);
  paperBump.wrapS = paperBump.wrapT = THREE.RepeatWrapping;
  paperBump.repeat.set(4, 6);
  const id = paper(1);
  documentHeader(id.c, "");
  // One aligned identity block, with a true portrait crop and a separate machine-readable zone.
  const photoRatio = 319 / 440;
  const cropHeight = Math.min(portrait.height, portrait.width / photoRatio);
  const cropWidth = cropHeight * photoRatio;
  id.c.drawImage(
    portrait,
    (portrait.width - cropWidth) / 2,
    (portrait.height - cropHeight) / 2,
    cropWidth,
    cropHeight,
    72,
    260,
    319,
    440,
  );
  text(id.c, "IDENTITÉ", 72, 166, 42, "#31344b", "DM Sans", "left", 600);
  field(id.c, "Nom", "RACLOT", 455, 282, 49);
  field(id.c, "Prénom", "RAPHAËL", 455, 445, 47);
  field(id.c, "Pseudonyme", "RAXUIS", 455, 608, 45);
  line(id.c, 72, 793, W - 144, "#84768e55");
  field(id.c, "Site personnel", "raphaelraclot.dev", 72, 870, 43);
  // Clear reading strip, with equal optical cells and two full-width 44-character lines.
  id.c.fillStyle = "#f4eee5";
  id.c.fillRect(58, 1140, W - 116, 204);
  line(id.c, 58, 1140, W - 116, "#8b7b943d");
  const cell = (W - 148) / 44;
  identityMachineLines.forEach((row, lineIndex) => {
    [...row].forEach((letter, column) =>
      text(
        id.c,
        letter,
        74 + cell * (column + 0.5),
        1222 + lineIndex * 64,
        34,
        "#242629",
        "OCR B",
        "center",
      ),
    );
  });
  const visas = paper(2);
  documentHeader(visas.c, "VISAS");
  PAGE_LINKS[0]!.forEach((r) => printedVisa(visas.c, r));
  const travelSheets = travelPages.map((page, index) => {
    const sheet = paper(index + 3);
    documentHeader(sheet.c, "VOYAGES");
    const map = countryImages.get(page.memory.country)!;
    sheet.c.drawImage(
      map,
      TRAVEL_MAP.x,
      TRAVEL_MAP.y,
      TRAVEL_MAP.width,
      TRAVEL_MAP.height,
    );
    travelVignette(
      sheet.c,
      page.memory,
      85,
      1080,
      Math.min(850, 500 + (page.memory.places?.length ?? 0) * 50),
      page.memory.places ? 285 : 260,
      -0.025,
      "#314c79",
      flagImages.get(page.memory.country),
    );
    // Stipple-weight ripples are fixed on the paper, not a looping animation.
    for (const marker of cityMarkers(page.memory)) {
      for (const [radius, alpha] of [
        [7, 0.9],
        [14, 0.5],
        [22, 0.25],
      ]) {
        sheet.c.strokeStyle = `rgba(39,83,139,${alpha})`;
        sheet.c.lineWidth = 1.4;
        sheet.c.beginPath();
        sheet.c.arc(marker.x, marker.y, radius!, 0, Math.PI * 2);
        sheet.c.stroke();
      }
      sheet.c.fillStyle = "#244d83";
      sheet.c.beginPath();
      sheet.c.arc(marker.x, marker.y, 2.5, 0, Math.PI * 2);
      sheet.c.fill();
    }
    return texture(sheet.el);
  });
  const spreads = [{ left: texture(id.el), right: texture(visas.el) }];
  for (let i = 0; i < travelSheets.length; i += 2)
    spreads.push({
      left: travelSheets[i]!,
      right: travelSheets[i + 1] ?? texture(paper(i + 4).el),
    });
  // A separate transparent ink plate keeps memories invisible under ordinary light.
  const uvSheets = [
    undefined,
    undefined,
    ...travelPages.map((p) => p.memory),
  ].map((memory) => {
    const sheet = canvas();
    const c = sheet.c;
    c.strokeStyle = "#79ffd5";
    c.lineWidth = 1.2;
    c.globalAlpha = 0.45;
    for (let i = 0; i < 20; i++) {
      c.beginPath();
      for (let x = 65; x < 960; x += 4) {
        const y = 210 + i * 42 + Math.sin(x / 85 + i * 0.18) * 25;
        if (x === 65) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
    if (memory) {
      const label = memory.visits
        ? `${memory.visits} ${memory.visits === 1 ? "séjour" : "séjours"}`
        : "Visité";
      c.clearRect(60, 1080, 900, 350);
      text(
        c,
        label.toLocaleUpperCase("fr"),
        90,
        1390,
        34,
        "#79ffd5",
        "DM Sans",
        "left",
        600,
      );
      const marks = Math.min(20, memory.visits ?? 0);
      for (let i = 0; i < marks; i++) {
        c.strokeRect(
          650 + (i % 10) * 24,
          1360 + Math.floor(i / 10) * 24,
          12,
          18,
        );
      }
      for (const marker of cityMarkers(memory)) {
        c.fillStyle = "#79ffd5";
        c.beginPath();
        c.arc(marker.x, marker.y, 9, 0, Math.PI * 2);
        c.fill();
        if (marker.city.uvNote) {
          c.beginPath();
          c.arc(marker.x, marker.y, 32, 0, Math.PI * 2);
          c.stroke();
        }
      }
      if (memory.uvNote) {
        c.font = '24px "DM Sans"';
        const words = memory.uvNote.split(/\s+/);
        let row = "",
          y = 960;
        for (const word of words) {
          if (c.measureText(`${row} ${word}`).width > 820 && row) {
            text(c, row, 90, y, 24, "#79ffd5");
            row = word;
            y += 30;
            if (y > 1050) break;
          } else row = row ? `${row} ${word}` : word;
        }
        if (y <= 1050) text(c, row, 90, y, 24, "#79ffd5");
      }
    }
    return texture(sheet.el, false);
  });
  const uvSpreads = spreads.map((_, i) => ({
    left: uvSheets[i * 2]!,
    right: uvSheets[i * 2 + 1] ?? texture(canvas().el, false),
  }));
  const env = canvas(512, 256);
  const eg = env.c.createLinearGradient(0, 0, 0, 256);
  eg.addColorStop(0, "#1d2a39");
  eg.addColorStop(0.35, "#7f9d95");
  eg.addColorStop(0.47, "#e0d4b5");
  eg.addColorStop(0.52, "#9baeb2");
  eg.addColorStop(0.62, "#172730");
  eg.addColorStop(1, "#081219");
  env.c.fillStyle = eg;
  env.c.fillRect(0, 0, 512, 256);
  env.c.fillStyle = "#fff5d5";
  env.c.fillRect(110, 20, 40, 140);
  env.c.fillStyle = "#6678a5";
  env.c.fillRect(350, 25, 95, 90);
  const environment = texture(env.el);
  environment.mapping = THREE.EquirectangularReflectionMapping;
  const all = {
    cover: texture(cover.el),
    foil: texture(foil.el),
    leather: texture(leather.el, false),
    paperBump,
    identity: spreads[0]!.left,
    visas: spreads[0]!.right,
    environment,
  };
  return {
    ...all,
    spreads,
    uvSpreads,
    dispose: () =>
      new Set([
        ...Object.values(all),
        ...spreads.flatMap((s) => [s.left, s.right]),
        ...uvSpreads.flatMap((s) => [s.left, s.right]),
      ]).forEach((t) => t.dispose()),
  };
}
