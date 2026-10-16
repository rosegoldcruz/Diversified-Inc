"use client";
/**
 * Procedural stand-in robot (chrome head, glossy black torso, segmented black/silver limbs) matching Daniel's
 * reference look. 1.8 units tall, feet at y=0, faces +Z. Animated procedurally per RobotMove so it behaves like
 * the GLB path; replace by setting NEXT_PUBLIC_ROBOT_GLB.
 */
import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { RobotMove } from "./clips";

type Props = { moveRef: MutableRefObject<RobotMove>; levelRef: MutableRefObject<number>; still?: boolean };

export function PrimitiveRobot({ moveRef, levelRef, still }: Props) {
  const mats = useMemo(
    () => ({
      chrome: new THREE.MeshStandardMaterial({ color: "#e8eef5", metalness: 1, roughness: 0.12 }),
      black: new THREE.MeshPhysicalMaterial({ color: "#0b0d12", metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
      silver: new THREE.MeshStandardMaterial({ color: "#9aa4b2", metalness: 1, roughness: 0.3 }),
      visor: new THREE.MeshStandardMaterial({ color: "#05121a", emissive: "#22d3ee", emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.2 }),
    }),
    [],
  );
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const foreL = useRef<THREE.Group>(null!);
  const foreR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const shinL = useRef<THREE.Group>(null!);
  const shinR = useRef<THREE.Group>(null!);
  const t = useRef(0);

  useFrame((_, dt) => {
    if (!still) t.current += Math.min(dt, 0.1);
    const time = t.current;
    const move = moveRef.current;
    const lvl = levelRef.current;
    const k = Math.min(1, dt * 10);
    const lerp = (o: THREE.Object3D, ax: "x" | "y" | "z", v: number) => (o.rotation[ax] += (v - o.rotation[ax]) * k);

    // defaults (idle breathing)
    const aL = 0.15;
    let aR = -0.15, aLx = 0, aRx = 0, fL = -0.25, fR = -0.25, lL = 0, lR = 0, sL = 0, sR = 0, hx = 0, hz = 0, bob = Math.sin(time * 2) * 0.008;
    if (move === "walk") {
      const p = time * 7;
      lL = Math.sin(p) * 0.55; lR = -lL;
      sL = Math.max(0, -Math.sin(p)) * 0.9; sR = Math.max(0, Math.sin(p)) * 0.9;
      aLx = -lL * 0.8; aRx = lL * 0.8; fL = fR = -0.5;
      bob = Math.abs(Math.sin(p)) * 0.04;
    } else if (move === "wave") {
      aR = -2.6; fR = -0.3 + Math.sin(time * 9) * 0.45; hz = 0.12;
    } else if (move === "point") {
      aRx = -1.45; fR = 0; hx = -0.05;
    } else if (move === "talk") {
      aLx = -0.5 + Math.sin(time * 3) * 0.2; aRx = -0.5 + Math.sin(time * 3 + 1.5) * 0.2;
      fL = fR = -0.9; hx = Math.sin(time * 5) * 0.06 + lvl * 0.1;
    } else if (move === "listen") {
      hz = 0.22; hx = 0.08; aLx = -0.2; fL = -1.2;
    }
    root.current.position.y = bob;
    lerp(armL.current, "z", aL); lerp(armR.current, "z", aR);
    lerp(armL.current, "x", aLx); lerp(armR.current, "x", aRx);
    lerp(foreL.current, "x", fL); lerp(foreR.current, "x", fR);
    lerp(legL.current, "x", lL); lerp(legR.current, "x", lR);
    lerp(shinL.current, "x", sL); lerp(shinR.current, "x", sR);
    lerp(head.current, "x", hx); lerp(head.current, "z", hz);
    torso.current.rotation.y = move === "walk" ? Math.sin(time * 7) * 0.06 : 0;
    const glow = move === "listen" ? 1.4 + Math.sin(time * 6) * 0.4 : move === "talk" ? 0.9 + lvl * 3 : 0.6;
    mats.visor.emissiveIntensity += (glow - mats.visor.emissiveIntensity) * k;
  });

  const seg = (len: number, r: number, mat: THREE.Material) => (
    <mesh material={mat} position={[0, -len / 2, 0]}>
      <capsuleGeometry args={[r, len - r * 2, 4, 10]} />
    </mesh>
  );
  const joint = (r: number, y = 0) => (
    <mesh material={mats.silver} position={[0, y, 0]}>
      <sphereGeometry args={[r, 12, 10]} />
    </mesh>
  );
  const arm = (side: 1 | -1, ref: typeof armL, fore: typeof foreL) => (
    <group ref={ref} position={[side * 0.3, 1.38, 0]}>
      {joint(0.075)}
      {seg(0.3, 0.065, mats.black)}
      <group ref={fore} position={[0, -0.32, 0]}>
        {joint(0.05)}
        {seg(0.28, 0.055, mats.silver)}
        <mesh material={mats.black} position={[0, -0.33, 0.01]}>
          <boxGeometry args={[0.07, 0.1, 0.05]} />
        </mesh>
      </group>
    </group>
  );
  const leg = (side: 1 | -1, ref: typeof legL, shin: typeof shinL) => (
    <group ref={ref} position={[side * 0.11, 0.86, 0]}>
      {joint(0.07)}
      {seg(0.4, 0.08, mats.black)}
      <group ref={shin} position={[0, -0.42, 0]}>
        {joint(0.06)}
        {seg(0.38, 0.07, mats.silver)}
        <RoundedBox args={[0.13, 0.07, 0.22]} radius={0.03} material={mats.black} position={[0, -0.41, 0.04]} />
      </group>
    </group>
  );

  return (
    <group ref={root}>
      <group ref={torso}>
        <RoundedBox args={[0.5, 0.52, 0.28]} radius={0.1} smoothness={4} material={mats.black} position={[0, 1.2, 0]} />
        <RoundedBox args={[0.34, 0.12, 0.22]} radius={0.05} material={mats.silver} position={[0, 0.9, 0]} />
        <mesh material={mats.visor} position={[0, 1.27, 0.142]}>
          <circleGeometry args={[0.035, 20]} />
        </mesh>
        <group ref={head} position={[0, 1.5, 0]}>
          <mesh material={mats.silver} position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.045, 0.055, 0.08, 12]} />
          </mesh>
          <mesh material={mats.chrome} position={[0, 0.2, 0]} scale={[0.15, 0.18, 0.16]}>
            <sphereGeometry args={[1, 28, 22]} />
          </mesh>
          <mesh material={mats.visor} position={[0, 0.21, 0.1]} scale={[0.11, 0.06, 0.07]}>
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
        </group>
        {arm(-1, armL, foreL)}
        {arm(1, armR, foreR)}
      </group>
      {leg(-1, legL, shinL)}
      {leg(1, legR, shinR)}
    </group>
  );
}
