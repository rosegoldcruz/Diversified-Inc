"use client";
/**
 * Voice companion hook. Click the mic -> POST /api/voice/session -> connect with whichever provider the server picked:
 *  - xai / openai: OpenAI-style realtime WebSocket, PCM16 24 kHz both ways, server VAD, barge-in.
 *  - elevenlabs-agent: ElevenLabs Conversational AI WebSocket (signed URL), PCM16 16 kHz.
 *  - elevenlabs-tts: browser speech recognition -> /api/voice/reply (LLM + ElevenLabs TTS mp3).
 * `levelRef` carries the output audio level (0..1) for the robot's talk animation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceProvider } from "./config";

export type VoiceStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";
export type Line = { role: "user" | "assistant"; content: string };

const WORKLET = `class Cap extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('cap',Cap)`;

function toPcm16B64(f32: Float32Array, inRate: number, outRate: number) {
  const ratio = inRate / outRate;
  const n = Math.floor(f32.length / ratio);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, f32[Math.floor(i * ratio)]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  let bin = "";
  const b = new Uint8Array(out.buffer);
  for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromPcm16B64(b64: string) {
  const bin = atob(b64);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(b.buffer, 0, b.length >> 1);
  const f = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 0x8000;
  return f;
}

export function useVoiceCompanion() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [provider, setProvider] = useState<VoiceProvider | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const levelRef = useRef(0);
  const ctx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const playHead = useRef(0);
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const node = useRef<AudioWorkletNode | null>(null);
  const recog = useRef<any>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const linesRef = useRef<Line[]>([]);
  const active = useRef(false);
  const raf = useRef(0);

  const push = useCallback((l: Line) => {
    linesRef.current = [...linesRef.current, l].slice(-20);
    setLines(linesRef.current);
  }, []);

  const ensureCtx = () => {
    if (!ctx.current) {
      ctx.current = new AudioContext();
      analyser.current = ctx.current.createAnalyser();
      analyser.current.fftSize = 256;
      analyser.current.connect(ctx.current.destination);
      const buf = new Uint8Array(analyser.current.frequencyBinCount);
      const tick = () => {
        analyser.current!.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        levelRef.current = Math.min(1, Math.sqrt(sum / buf.length) * 4);
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    }
    void ctx.current.resume();
    return ctx.current;
  };

  const playPcm = (f: Float32Array, rate: number) => {
    const c = ensureCtx();
    const buf = c.createBuffer(1, f.length, rate);
    buf.getChannelData(0).set(f);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(analyser.current!);
    const at = Math.max(c.currentTime + 0.02, playHead.current);
    src.start(at);
    playHead.current = at + buf.duration;
    sources.current.push(src);
    src.onended = () => {
      sources.current = sources.current.filter((s) => s !== src);
      if (!sources.current.length && active.current) setStatus("listening");
    };
    setStatus("speaking");
  };
  const interrupt = () => {
    sources.current.forEach((s) => { try { s.stop(); } catch {} });
    sources.current = [];
    playHead.current = 0;
  };

  const startMic = async (rate: number, onChunk: (b64: string) => void) => {
    const c = ensureCtx();
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await c.audioWorklet.addModule(url);
    const srcNode = c.createMediaStreamSource(stream.current);
    node.current = new AudioWorkletNode(c, "cap");
    let pending: Float32Array[] = [];
    let len = 0;
    node.current.port.onmessage = (e) => {
      pending.push(e.data);
      len += e.data.length;
      if (len >= c.sampleRate / 10) {
        const all = new Float32Array(len);
        let o = 0;
        for (const p of pending) { all.set(p, o); o += p.length; }
        pending = []; len = 0;
        onChunk(toPcm16B64(all, c.sampleRate, rate));
      }
    };
    srcNode.connect(node.current);
  };

  const stop = useCallback(() => {
    active.current = false;
    interrupt();
    ws.current?.close();
    ws.current = null;
    node.current?.disconnect();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    try { recog.current?.stop(); } catch {}
    recog.current = null;
    audioEl.current?.pause();
    levelRef.current = 0;
    setStatus("idle");
  }, []);

  /** turn mode (ElevenLabs TTS) — also used for typed messages in any mode without a live socket */
  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    push({ role: "user", content: text });
    if (ws.current && ws.current.readyState === 1 && provider !== "elevenlabs-agent") {
      ws.current.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } }));
      ws.current.send(JSON.stringify({ type: "response.create" }));
      setStatus("thinking");
      return;
    }
    setStatus("thinking");
    try {
      const r = await fetch("/api/voice/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: linesRef.current }) });
      const reply = decodeURIComponent(r.headers.get("X-Reply-Text") || "");
      if (reply) push({ role: "assistant", content: reply });
      if ((r.headers.get("content-type") || "").includes("audio")) {
        const blob = await r.blob();
        const c = ensureCtx();
        const a = new Audio(URL.createObjectURL(blob));
        audioEl.current = a;
        c.createMediaElementSource(a).connect(analyser.current!);
        setStatus("speaking");
        a.onended = () => {
          if (!active.current) return setStatus("idle");
          setStatus("listening");
          try { recog.current?.start(); } catch {}
        };
        await a.play();
      } else setStatus(active.current ? "listening" : "idle");
    } catch (e) {
      setError("Couldn't reach the voice service.");
      setStatus("error");
    }
  }, [provider, push]);

  const start = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    ensureCtx();
    try {
      const r = await fetch("/api/voice/session", { method: "POST" });
      const s = await r.json();
      if (!r.ok) throw new Error(s.error || "voice unavailable");
      setProvider(s.provider);
      active.current = true;

      if (s.provider === "xai" || s.provider === "openai") {
        const protocols = s.provider === "xai" ? [`xai-client-secret.${s.token}`] : ["realtime", `openai-insecure-api-key.${s.token}`];
        const sock = new WebSocket(s.url, protocols);
        ws.current = sock;
        let assistantText = "";
        sock.onopen = async () => {
          const fmt = { type: "audio/pcm", rate: 24000 };
          sock.send(JSON.stringify({
            type: "session.update",
            session: s.provider === "openai"
              ? { type: "realtime", instructions: s.instructions, audio: { input: { format: fmt, turn_detection: { type: "server_vad" } }, output: { format: fmt, voice: s.voice } } }
              : { instructions: s.instructions, voice: s.voice, turn_detection: { type: "server_vad" }, audio: { input: { format: fmt }, output: { format: fmt } } },
          }));
          await startMic(24000, (b64) => sock.readyState === 1 && sock.send(JSON.stringify({ type: "input_audio_buffer.append", audio: b64 })));
          setStatus("listening");
          sock.send(JSON.stringify({ type: "response.create", response: { instructions: "Greet the user in one short sentence." } }));
        };
        sock.onmessage = (ev) => {
          const m = JSON.parse(ev.data);
          switch (m.type) {
            case "response.output_audio.delta":
            case "response.audio.delta":
              playPcm(fromPcm16B64(m.delta), 24000);
              break;
            case "response.output_audio_transcript.delta":
            case "response.audio_transcript.delta":
              assistantText += m.delta;
              break;
            case "response.done":
              if (assistantText) push({ role: "assistant", content: assistantText });
              assistantText = "";
              break;
            case "input_audio_buffer.speech_started":
              interrupt();
              setStatus("listening");
              break;
            case "input_audio_buffer.speech_stopped":
              setStatus("thinking");
              break;
            case "conversation.item.input_audio_transcription.completed":
              if (m.transcript) push({ role: "user", content: m.transcript });
              break;
            case "error":
              setError(m.error?.message || "voice error");
              break;
          }
        };
        sock.onerror = () => { setError("Voice connection failed."); setStatus("error"); };
        sock.onclose = () => active.current && stop();
        return;
      }

      if (s.provider === "elevenlabs-agent") {
        const sock = new WebSocket(s.url);
        ws.current = sock;
        sock.onopen = async () => {
          sock.send(JSON.stringify({ type: "conversation_initiation_client_data" }));
          await startMic(16000, (b64) => sock.readyState === 1 && sock.send(JSON.stringify({ user_audio_chunk: b64 })));
          setStatus("listening");
        };
        sock.onmessage = (ev) => {
          const m = JSON.parse(ev.data);
          if (m.type === "audio") playPcm(fromPcm16B64(m.audio_event.audio_base_64), 16000);
          else if (m.type === "ping") sock.send(JSON.stringify({ type: "pong", event_id: m.ping_event.event_id }));
          else if (m.type === "interruption") interrupt();
          else if (m.type === "agent_response") push({ role: "assistant", content: m.agent_response_event.agent_response });
          else if (m.type === "user_transcript") push({ role: "user", content: m.user_transcription_event.user_transcript });
        };
        sock.onerror = () => { setError("Voice connection failed."); setStatus("error"); };
        sock.onclose = () => active.current && stop();
        return;
      }

      // elevenlabs-tts turn mode
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        setStatus("listening");
        setError("Voice input isn't supported in this browser — type below and I'll answer out loud.");
        return;
      }
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        const t = e.results[e.results.length - 1][0].transcript;
        void sendText(t);
      };
      rec.onerror = (e: any) => e.error !== "no-speech" && e.error !== "aborted" && setError(`Mic: ${e.error}`);
      rec.onend = () => {
        // restart only while waiting for the user
        if (active.current && !audioEl.current?.src && status === "listening") try { rec.start(); } catch {}
      };
      recog.current = rec;
      rec.start();
      setStatus("listening");
      push({ role: "assistant", content: "I'm listening. What do you need?" });
    } catch (e) {
      active.current = false;
      setError(e instanceof Error ? e.message : "Couldn't start voice.");
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [push, sendText, stop]);

  useEffect(() => () => { stop(); cancelAnimationFrame(raf.current); void ctx.current?.close(); }, [stop]);

  return { status, provider, lines, error, levelRef, start, stop, sendText, active: status !== "idle" && status !== "error" };
}
