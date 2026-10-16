/**
 * Robot animation set — ported from the Vulpine Fox (vulpine-supply components/fox/clips.ts).
 * A Meshy/Tripo GLB should ship clips named after these moves; missing clips fall back to idle.
 */
import * as THREE from "three";

export type RobotMove = "idle" | "walk" | "wave" | "talk" | "listen" | "point";

export const ROBOT_MOVES: RobotMove[] = ["idle", "walk", "wave", "talk", "listen", "point"];

const LOOPING = new Set<RobotMove>(["idle", "walk", "talk", "listen"]);

/** Accepts exact names and common Meshy/Mixamo aliases ("Walking", "Idle_01", "Talking"). */
const ALIASES: Record<RobotMove, RegExp> = {
  idle: /^(idle|breath|stand)/i,
  walk: /^(walk|walking|run)/i,
  wave: /^(wave|waving|greet|hello)/i,
  talk: /^(talk|talking|speak)/i,
  listen: /^(listen|thinking|think)/i,
  point: /^(point|pointing)/i,
};

export function buildRobotClips(animations: THREE.AnimationClip[]) {
  const out: Partial<Record<RobotMove, THREE.AnimationClip>> = {};
  for (const move of ROBOT_MOVES) {
    out[move] =
      THREE.AnimationClip.findByName(animations, move) ??
      animations.find((a) => ALIASES[move].test(a.name));
    if (!out[move]) delete out[move];
  }
  return out;
}

export const loopFor = (m: RobotMove) => (LOOPING.has(m) ? THREE.LoopRepeat : THREE.LoopOnce);
export const fadeFor = (m: RobotMove) => (m === "walk" ? 0.2 : 0.3);

/** Swap in the real model by setting NEXT_PUBLIC_ROBOT_GLB (e.g. /models/robot.glb). Empty = primitive stand-in. */
export const ROBOT_GLB_URL = process.env.NEXT_PUBLIC_ROBOT_GLB || "";
