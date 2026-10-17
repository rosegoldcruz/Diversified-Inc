import { NextRequest, NextResponse } from "next/server";
import { OPENAI_REALTIME_URL, ROBOT_INSTRUCTIONS, XAI_REALTIME_URL, type VoiceProvider } from "@/lib/voice/config";

export const dynamic = "force-dynamic";

/**
 * Mints a short-lived voice session for the browser. API keys never leave the server.
 * Order: xAI (XAI_API_KEY) -> ElevenLabs agent (ELEVENLABS_AGENT_ID) -> ElevenLabs TTS turn mode
 * (ELEVENLABS_API_KEY) -> OpenAI Realtime (OPENAI_API_KEY). `?provider=` forces one for testing.
 * This route is behind the auth middleware.
 */
export async function POST(req: NextRequest) {
  const forced = req.nextUrl.searchParams.get("provider") as VoiceProvider | null;
  const order: VoiceProvider[] = forced ? [forced] : ["xai", "elevenlabs-agent", "elevenlabs-tts", "openai"];
  const errors: string[] = [];

  for (const p of order) {
    try {
      if (p === "xai" && process.env.XAI_API_KEY) {
        const r = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ expires_after: { seconds: 300 } }),
        });
        if (!r.ok) throw new Error(`xai ${r.status}`);
        const j = await r.json();
        const token = j.value ?? j.client_secret?.value;
        if (!token) throw new Error("xai: no client secret in response");
        return NextResponse.json({
          provider: "xai",
          url: XAI_REALTIME_URL,
          token,
          voice: process.env.XAI_VOICE || "Rex",
          instructions: ROBOT_INSTRUCTIONS,
        });
      }
      if (p === "elevenlabs-agent" && process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID) {
        const r = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(process.env.ELEVENLABS_AGENT_ID)}`,
          { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } },
        );
        if (!r.ok) throw new Error(`elevenlabs-agent ${r.status}`);
        const j = await r.json();
        return NextResponse.json({ provider: "elevenlabs-agent", url: j.signed_url });
      }
      if (p === "elevenlabs-tts" && process.env.ELEVENLABS_API_KEY) {
        return NextResponse.json({ provider: "elevenlabs-tts" });
      }
      if (p === "openai" && process.env.OPENAI_API_KEY) {
        const voice = process.env.OPENAI_VOICE || "cedar";
        const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            expires_after: { anchor: "created_at", seconds: 300 },
            session: { type: "realtime", model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime", instructions: ROBOT_INSTRUCTIONS, audio: { output: { voice } } },
          }),
        });
        if (!r.ok) throw new Error(`openai ${r.status}`);
        const j = await r.json();
        return NextResponse.json({
          provider: "openai",
          url: `${OPENAI_REALTIME_URL}?model=${process.env.OPENAI_REALTIME_MODEL || "gpt-realtime"}`,
          token: j.value,
          voice,
          instructions: ROBOT_INSTRUCTIONS,
        });
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return NextResponse.json(
    { error: "No voice provider is configured. Set XAI_API_KEY, ELEVENLABS_API_KEY or OPENAI_API_KEY.", details: errors },
    { status: 503 },
  );
}
