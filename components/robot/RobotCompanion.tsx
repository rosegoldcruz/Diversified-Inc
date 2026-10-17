"use client";
import { Component, type ReactNode } from "react";
/**
 * Full-page robot overlay. A transparent fixed canvas (pointer-events: none) with an orthographic camera in pixel
 * units; the robot walks between waypoints, turns, and stops to wave/talk/point. Only a hit-box that follows the
 * robot, the mic button and the chat panel take pointer events. Clicking the robot or the mic starts the voice
 * companion; while the mic is live the robot stops, faces you, and listens or talks (visor pulses with the audio).
 * prefers-reduced-motion: parked bottom-right, no walking, renders on demand. Mobile: smaller robot, DPR <= 1.5.
 */
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Microphone, MicrophoneSlash, PaperPlaneRight, X } from "phosphor-react";
import { PrimitiveRobot } from "./PrimitiveRobot";
import { ROBOT_GLB_URL, type RobotMove } from "./clips";
import { Walker } from "./walker";
import { useVoiceCompanion } from "@/lib/voice/useVoiceCompanion";

const GlbRobot = dynamic(() => import("./GlbRobot").then((m) => m.GlbRobot), { ssr: false });

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const on = () => setR(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}

function Actor({
  walker, size, moveRef, levelRef, hitRef, reduced,
}: {
  walker: MutableRefObject<Walker | null>; size: number; moveRef: MutableRefObject<RobotMove>;
  levelRef: MutableRefObject<number>; hitRef: MutableRefObject<HTMLButtonElement | null>; reduced: boolean;
}) {
  const g = useRef<THREE.Group>(null!);
  const { size: vp, invalidate } = useThree();
  useEffect(() => {
    if (!walker.current) walker.current = new Walker(vp.width, vp.height, size);
    walker.current.resize(vp.width, vp.height, size);
    if (reduced) walker.current.park();
    invalidate();
  }, [vp.width, vp.height, size, reduced, walker, invalidate]);

  useFrame((_, dt) => {
    const w = walker.current;
    if (!w) return;
    const s = reduced ? (w.engaged ? { ...w.s, move: w.engaged as RobotMove } : w.s) : w.step(Math.min(dt, 0.05));
    moveRef.current = s.move;
    g.current.position.set(s.x, s.y, 0);
    g.current.rotation.y = s.heading;
    const hit = hitRef.current;
    if (hit) {
      hit.style.transform = `translate3d(${vp.width / 2 + s.x - size * 0.3}px, ${vp.height / 2 - s.y - size}px, 0)`;
    }
  });

  const scale = size / 1.8;
  return (
    <group ref={g} scale={[scale, scale, scale]}>
      {ROBOT_GLB_URL ? (
        <GlbBoundary fallback={<PrimitiveRobot moveRef={moveRef} levelRef={levelRef} still={reduced} />}>
          <Suspense fallback={<PrimitiveRobot moveRef={moveRef} levelRef={levelRef} still={reduced} />}>
            <GlbRobot url={ROBOT_GLB_URL} moveRef={moveRef} levelRef={levelRef} />
          </Suspense>
        </GlbBoundary>
      ) : (
        <PrimitiveRobot moveRef={moveRef} levelRef={levelRef} still={reduced} />
      )}
    </group>
  );
}

/** Falls back to the primitive robot if the GLB fails to load/parse. */
class GlbBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.warn("[robot] GLB failed, using primitive robot", e); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function RobotCompanion() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(true);
  const [size, setSize] = useState(150);
  const walker = useRef<Walker | null>(null);
  const moveRef = useRef<RobotMove>("idle");
  const hitRef = useRef<HTMLButtonElement | null>(null);
  const voice = useVoiceCompanion();

  useEffect(() => {
    setMounted(true);
    const r = () => setSize(window.innerWidth < 640 ? 104 : 150);
    r();
    window.addEventListener("resize", r);
    const vis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    const openMic = () => { setOpen(true); if (!voice.active) void voice.start(); };
    window.addEventListener("robot:open-mic", openMic);
    return () => {
      window.removeEventListener("resize", r);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("robot:open-mic", openMic);
    };
  }, [voice]);

  // mic state drives the robot
  useEffect(() => {
    if (!walker.current) return;
    walker.current.engaged =
      voice.status === "speaking" ? "talk" : voice.status === "listening" || voice.status === "thinking" || voice.status === "connecting" ? "listen" : false;
  }, [voice.status]);

  if (!mounted) return null;

  const toggleMic = () => {
    setOpen(true);
    if (voice.active) voice.stop();
    else void voice.start();
  };
  const label =
    voice.status === "listening" ? "Listening…" : voice.status === "thinking" ? "Thinking…" : voice.status === "speaking" ? "Speaking" : voice.status === "connecting" ? "Connecting…" : "Tap to talk";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
        <Canvas
          orthographic
          camera={{ zoom: 1, position: [0, 0, 600], near: 1, far: 2000 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          frameloop={!visible ? "never" : reduced ? "demand" : "always"}
          style={{ pointerEvents: "none" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[300, 500, 400]} intensity={2} />
          <pointLight position={[-300, 0, 300]} intensity={1.2} color="#22d3ee" distance={0} decay={0} />
          <Environment resolution={64}>
            <Lightformer intensity={3} position={[0, 5, -5]} scale={[10, 2, 1]} />
            <Lightformer intensity={2} color="#22d3ee" position={[-5, 1, 2]} scale={[2, 6, 1]} />
            <Lightformer intensity={1.5} color="#017dd5" position={[5, 0, 2]} scale={[2, 6, 1]} />
          </Environment>
          <Suspense fallback={null}>
            <Actor walker={walker} size={size} moveRef={moveRef} levelRef={voice.levelRef} hitRef={hitRef} reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>

      {/* hit-box that follows the robot */}
      <button
        ref={hitRef}
        type="button"
        onClick={toggleMic}
        aria-label="Talk to the Diversified robot"
        className="fixed left-0 top-0 z-[61] cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        style={{ width: size * 0.6, height: size, willChange: "transform" }}
      />

      {/* mic button + panel */}
      <div className="fixed bottom-4 right-4 z-[62] flex flex-col items-end gap-3">
        {open && (
          <div className="w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#050a14]/90 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-cyan-400/15 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${voice.active ? "animate-pulse bg-cyan-400" : "bg-slate-500"}`} />
                <span className="font-display text-sm font-semibold text-cyan-100">Diversified Robot</span>
                {voice.provider && <span className="font-mono text-[10px] uppercase text-slate-500">{voice.provider}</span>}
              </div>
              <button onClick={() => { voice.stop(); setOpen(false); }} className="text-slate-400 hover:text-white" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-60 space-y-2 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
              {voice.lines.length === 0 && <p className="text-slate-400">Tap the mic and ask me about work orders, timesheets, inventory or SOPs.</p>}
              {voice.lines.map((l, i) => (
                <p key={i} className={l.role === "user" ? "text-right text-slate-200" : "text-cyan-200"}>
                  <span className={`inline-block rounded-xl px-3 py-1.5 ${l.role === "user" ? "bg-white/5" : "bg-cyan-400/10"}`}>{l.content}</span>
                </p>
              ))}
              {voice.error && <p className="text-xs text-amber-300">{voice.error}</p>}
            </div>
            <form
              className="flex gap-2 border-t border-cyan-400/15 p-2"
              onSubmit={(e) => { e.preventDefault(); void voice.sendText(draft); setDraft(""); }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Or type a message…"
                className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-cyan-400/50"
              />
              <button className="rounded-xl bg-cyan-400/20 px-3 text-cyan-200 hover:bg-cyan-400/30" aria-label="Send">
                <PaperPlaneRight size={16} />
              </button>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={voice.active}
          aria-label={voice.active ? "Stop talking to the robot" : "Talk to the robot"}
          className={`group flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold backdrop-blur-xl transition ${
            voice.active
              ? "border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.7)]"
              : "border-cyan-400/40 bg-[#050a14]/85 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:border-cyan-300"
          }`}
        >
          {voice.active ? <MicrophoneSlash size={18} weight="bold" /> : <Microphone size={18} weight="bold" />}
          <span className="hidden sm:inline">{label}</span>
        </button>
      </div>
    </>
  );
}
