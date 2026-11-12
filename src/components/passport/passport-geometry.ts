import * as THREE from "three";
import { SHEET_WIDTH, SHEET_HEIGHT } from "./passport-layout";
export function roundedCover(width: number, height: number, depth = 0) {
  const x = -width / 2,
    y = -height / 2,
    r = 0.085;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = depth
    ? new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.009,
        bevelThickness: 0.009,
        curveSegments: 8,
      })
    : new THREE.ShapeGeometry(shape, 12);
  if (depth) geometry.translate(0, 0, -depth / 2);
  else {
    const positions = geometry.attributes.position!,
      uvs = geometry.attributes.uv!;
    for (let i = 0; i < positions.count; i++)
      uvs.setXY(
        i,
        (positions.getX(i) + width / 2) / width,
        (positions.getY(i) + height / 2) / height,
      );
  }
  return geometry;
}
export function pageGeometry(back = false) {
  const g = new THREE.PlaneGeometry(SHEET_WIDTH, SHEET_HEIGHT, 48, 12);
  const raw = g.attributes.position!;
  const r = 0.045,
    halfW = SHEET_WIDTH / 2,
    halfH = SHEET_HEIGHT / 2;
  for (let i = 0; i < raw.count; i++) {
    let x = raw.getX(i),
      y = raw.getY(i);
    const dx = Math.max(0, Math.abs(x) - (halfW - r));
    const dy = Math.max(0, Math.abs(y) - (halfH - r));
    if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > r) {
      const scale = r / Math.hypot(dx, dy);
      x = Math.sign(x) * (halfW - r + dx * scale);
      y = Math.sign(y) * (halfH - r + dy * scale);
      raw.setXY(i, x, y);
    }
  }
  g.translate(SHEET_WIDTH / 2, 0, 0);
  const pos = g.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin((x / SHEET_WIDTH) * Math.PI) * 0.025);
  }
  if (back) {
    const uv = g.attributes.uv!;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  }
  g.computeVertexNormals();
  return g;
}
