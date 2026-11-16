import { PAGE_WIDTH } from "./passport-layout";
import { CLOSED_COVER_HINGE_Z, OPEN_COVER_HINGE_Z } from "./passport-geometry";

export type CoverMove = "front-close" | "rear-close" | "rear-open";
/** One continuous pose from the resting state to the opposite endpoint. */
export function coverPose(move: CoverMove, progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  const front = move === "front-close" ? t : 0;
  const rear = move === "rear-close" ? t : move === "rear-open" ? 1 - t : 0;
  return {
    frontAngle: -Math.PI * (1 - front),
    frontZ:
      OPEN_COVER_HINGE_Z + (CLOSED_COVER_HINGE_Z - OPEN_COVER_HINGE_Z) * front,
    rearAngle: -Math.PI * rear,
    bookX: (PAGE_WIDTH / 2) * (rear - front),
    openness: 1 - Math.max(front, rear),
  };
}
/** A reversed or paused flick cannot commit from its old average velocity. */
export function shouldCompleteDrag(progress: number, forwardVelocity: number) {
  return progress >= 0.5 || (progress > 0.15 && forwardVelocity > 0.5);
}
