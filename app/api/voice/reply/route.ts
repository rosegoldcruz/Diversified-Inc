import { NextRequest, NextResponse } from "next/server";
import { deepseek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { ROBOT_INSTRUCTIONS } from "@/lib/voice/config";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Msg = { role: "user" | "assistant"; content: string };

/**
 * ElevenLabs turn mode: transcript in -> short LLM reply (DeepSeek, already used by ai-chat) -> ElevenLabs TTS mp3 out.
 * The reply text comes back in the X-Reply-Text header (URI-encoded) so the bubble can show it.
 */
export async function POST(req: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  const { messages = [] } = (await req.json().catch(() => ({}))) as { messages?: Msg[] };
  const history = messages.slice(-10).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  let text = "I'm online, but my brain isn't connected yet. Ask an admin to set the DeepSeek key.";
  if (process.env.DEEPSEEK_API_KEY && history.length) {
    try {
      const r = await generateText({
        model: deepseek(process.env.DEEPSEEK_DEFAULT_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"),
        system: ROBOT_INSTRUCTIONS,
        messages: history,
        maxOutputTokens: 200,
      });
      text = r.text.trim() || "Sorry, I didn't catch that.";
    } catch {
      text = "I had trouble thinking about that. Try again in a moment.";
    }
  }

  // No ElevenLabs key (e.g. xAI-realtime staging): still return the text reply so text/fallback clients work.
  if (!key) return NextResponse.json({ text, audio: false }, { headers: { "X-Reply-Text": encodeURIComponent(text) } });

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
  const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5" }),
  });
  if (!tts.ok || !tts.body) {
    return NextResponse.json({ text, error: `tts ${tts.status}` }, { status: 200, headers: { "X-Reply-Text": encodeURIComponent(text) } });
  }
  return new Response(tts.body, {
    headers: { "Content-Type": "audio/mpeg", "X-Reply-Text": encodeURIComponent(text), "Cache-Control": "no-store" },
  });
}
