"use client";
/** GLB robot path (Meshy export). Ported from FoxStage: named clips, crossfades, one-shots return to idle. */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { buildRobotClips, fadeFor, loopFor, type RobotMove } from "./clips";

export function GlbRobot({ url, moveRef }: { url: string; moveRef: MutableRefObject<RobotMove> }) {
  const gltf = useGLTF(url);
  const group = useRef<THREE.Group>(null!);
  const clips = useMemo(() => Object.values(buildRobotClips(gltf.animations)), [gltf.animations]);
  const { actions, mixer } = useAnimations(clips, group);
  const current = useRef<RobotMove | null>(null);

  // normalise to 1.8 units tall, feet at 0
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const h = box.max.y - box.min.y || 1;
    const s = 1.8 / h;
    gltf.scene.scale.setScalar(s);
    gltf.scene.position.y = -box.min.y * s;
  }, [gltf.scene]);

  useEffect(() => {
    const onDone = () => (moveRef.current = "idle");
    mixer.addEventListener("finished", onDone);
    return () => mixer.removeEventListener("finished", onDone);
  }, [mixer, moveRef]);

  useFrame(() => {
    const want = moveRef.current;
    if (want === current.current) return;
    const byName = (m: RobotMove) => clips.find((c) => buildRobotClips([c])[m]);
    const clip = byName(want) ?? byName("idle");
    const next = clip ? actions[clip.name] : null;
    if (!next) return;
    next.setLoop(loopFor(want), Infinity);
    next.reset().setEffectiveWeight(1).play();
    const prevClip = current.current ? byName(current.current) : null;
    const prev = prevClip ? actions[prevClip.name] : null;
    if (prev && prev !== next) prev.crossFadeTo(next, fadeFor(want), false);
    current.current = want;
  });

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}
