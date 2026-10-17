/** Shared voice-companion config. Provider order: xAI Grok realtime -> ElevenLabs -> OpenAI Realtime. */
export type VoiceProvider = "xai" | "elevenlabs-agent" | "elevenlabs-tts" | "openai";

export const ROBOT_INSTRUCTIONS =
  "You are the Diversified OS robot, a friendly, upbeat AI operations companion for Diversified Inc. " +
  "You help staff with work orders, timesheets, time clock, inventory, SOPs, forms and reports inside Diversified OS. " +
  "Speak naturally and keep answers short: one to three sentences. If you don't know something specific about the " +
  "company's live data, say so and point the user to the right page.";

export const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";
export const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime";
