import {
  PAGE_LEVEL,
  PAGE_BOW,
  PAPER_THICKNESS,
  TURN_CLEARANCE,
} from "./passport-geometry";
export type PageTurn = {
  from: number;
  to: number;
  direction: 1 | -1;
  interactive?: boolean;
};
/** Freeze all four faces for the duration of a turn. No next/previous texture leaks. */
export function turnFaces(turn: PageTurn) {
  return turn.direction === 1
    ? ({
        left: [turn.from, "left"],
        right: [turn.to, "right"],
        front: [turn.from, "right"],
        back: [turn.to, "left"],
      } as const)
    : ({
        left: [turn.to, "left"],
        right: [turn.from, "right"],
        front: [turn.to, "right"],
        back: [turn.from, "left"],
      } as const);
}
export function turnPose(progress: number, direction: 1 | -1) {
  const t = direction === 1 ? progress : 1 - progress;
  return {
    angle: -Math.PI * t,
    z: PAGE_LEVEL + TURN_CLEARANCE - PAPER_THICKNESS * t,
    bend: PAGE_BOW * Math.cos(Math.PI * t) + Math.sin(Math.PI * t) * 0.075,
  };
}
export function swipeDirection(
  dx: number,
  dy: number,
  threshold = 45,
): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.25) return 0;
  return dx < 0 ? 1 : -1;
}

/** A committed drag waits for its parent acknowledgement; stale props are not a new turn. */
export function queuedTurn(
  requested: number,
  displayed: number,
  awaiting: number | null,
): number | null {
  if (awaiting !== null && requested !== awaiting) return null;
  return requested === displayed ? null : requested;
}
