import type { DestinationId } from "./destinations";

export const PAGE_WIDTH = 2.85;
export const PAGE_HEIGHT = 4.05;
export const SHEET_WIDTH = PAGE_WIDTH - 0.09;
export const SHEET_HEIGHT = PAGE_HEIGHT - 0.13;
export const PAGE_PIXELS = { width: 1024, height: 1440 };
export type VisaRegion = {
  id: DestinationId;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  shape: "rect" | "oval";
  ink: string;
};
// Canvas coordinates, normalized from the top left. Printing and hit testing share these bounds.
export const PAGE_LINKS: readonly (readonly VisaRegion[])[] = [
  [
    {
      id: "portfolio",
      x: 0.105,
      y: 0.19,
      width: 0.79,
      height: 0.235,
      angle: -0.035,
      shape: "rect",
      ink: "#171d38",
    },
    {
      id: "github",
      x: 0.09,
      y: 0.49,
      width: 0.39,
      height: 0.235,
      angle: -0.06,
      shape: "oval",
      ink: "#302139",
    },
    {
      id: "linkedin",
      x: 0.53,
      y: 0.48,
      width: 0.38,
      height: 0.245,
      angle: 0.07,
      shape: "rect",
      ink: "#163538",
    },
    {
      id: "x",
      x: 0.195,
      y: 0.79,
      width: 0.63,
      height: 0.115,
      angle: -0.035,
      shape: "rect",
      ink: "#3b1e31",
    },
  ],
  [],
];
export function destinationAtUV(
  page: number,
  u: number,
  v: number,
): DestinationId | null {
  if (!Number.isFinite(u) || !Number.isFinite(v)) return null;
  const y = 1 - v;
  return (
    PAGE_LINKS[page]?.find((r) => {
      const dx = (u - r.x - r.width / 2) * PAGE_PIXELS.width;
      const dy = (y - r.y - r.height / 2) * PAGE_PIXELS.height;
      const x =
        (dx * Math.cos(r.angle) + dy * Math.sin(r.angle)) /
        ((r.width * PAGE_PIXELS.width) / 2);
      const yy =
        (-dx * Math.sin(r.angle) + dy * Math.cos(r.angle)) /
        ((r.height * PAGE_PIXELS.height) / 2);
      return r.shape === "oval"
        ? x * x + yy * yy <= 1
        : Math.abs(x) <= 1 && Math.abs(yy) <= 1;
    })?.id ?? null
  );
}
