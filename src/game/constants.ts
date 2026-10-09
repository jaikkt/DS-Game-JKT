export const TILE = 16;
/** DS overworld timing: one tile per 16 frames walking (≈0.267s), 8 frames running. */
export const WALK_MS = 266;
export const RUN_MS = 133;
/** A quick tap turns the trainer in place; holding past this delay starts walking. */
export const TURN_GRACE_MS = 90;
export const FRAME_W = 20;
export const FRAME_H = 28;

export const DEPTH = {
  water: -10,
  ground: 0,
  flat: 1,
  actorBase: 10,
  overlay: 100000,
  train: 100001,
  sky: 100002,
};
