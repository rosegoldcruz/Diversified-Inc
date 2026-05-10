"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardList, FileText, Mail, Shield } from "lucide-react";

type ToolConfig = {
  title: string;
  description: string;
  placeholder: string;
  buttonLabel: string;
  systemPrompt: string;
  icon: LucideIcon;
};

const tools: ToolConfig[] = [
  {
    title: "Work Order Summarizer",
    description:
      "Paste a work order description and get a clean summary with scope, materials, and timeline.",
    placeholder: "Paste work order details here...",
    buttonLabel: "Summarize ->",
    icon: FileText,
    systemPrompt:
      "You are an operations assistant for Diversified Inc, a construction and field services company. Summarize the following work order into these sections: Scope of Work, Materials Needed, Estimated Timeline, Key Risks. Be concise and professional. Use plain text, no markdown.",
  },
  {
    title: "Client Follow-Up Email",
    description:
      "Describe job status and we'll draft a professional follow-up for the client.",
    placeholder: "Describe the job status, delays, next steps...",
    buttonLabel: "Draft Email ->",
    icon: Mail,
    systemPrompt:
      "You are a professional communications assistant for Diversified Inc. Write a concise, professional client follow-up email based on the job update provided. Keep it under 150 words. Professional but warm tone. Plain text only.",
  },
  {
    title: "Installer Brief Generator",
    description:
      "Input job details and get a ready-to-send one-page installer brief.",
    placeholder:
      "Job address, scope, materials confirmed, special instructions...",
    buttonLabel: "Generate Brief ->",
    icon: ClipboardList,
    systemPrompt:
      "You are a field operations coordinator for Diversified Inc. Generate a one-page installer brief from the job details provided. Include: Job Address, Scope Summary, Materials On-Site, Special Instructions, Contact on Site. Plain text format.",
  },
  {
    title: "Incident Report Draft",
    description:
      "Describe what happened on site and get a formatted incident report.",
    placeholder:
      "Describe the incident: what happened, when, who was involved...",
    buttonLabel: "Draft Report ->",
    icon: Shield,
    systemPrompt:
      "You are a safety and compliance assistant for Diversified Inc. Draft a formal incident report from the description. Include: Date/Time, Persons Involved, Description of Incident, Immediate Actions Taken, Recommended Follow-Up. Plain text format.",
  },
];

export default function AiToolsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          AI Tools
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          AEON-powered tools built for Diversified operations.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.title} tool={tool} />
        ))}
      </section>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolConfig }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const Icon = tool.icon;

  async function runTool() {
    const trimmed = input.trim();
    if (trimmed.length === 0 || loading) return;

    try {
      setLoading(true);
      setError(null);
      setResponse("");

      const aiResponse = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: false,
          system: tool.systemPrompt,
          messages: [
            {
              id: `tool-${Date.now()}`,
              role: "user",
              parts: [
                {
                  type: "text",
                  text: `${tool.systemPrompt}\n\nUser input:\n${trimmed}`,
                },
              ],
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(
          errorText || `AI request failed (${aiResponse.status})`,
        );
      }

      const responseText = await readAiResponse(aiResponse);
      setResponse(responseText || "No response returned.");
    } catch (toolError) {
      setError(
        toolError instanceof Error
          ? toolError.message
          : "Failed to run AI tool",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="space-y-3 rounded-xl border border-borderSubtle bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-accent" />
        <h2 className="text-base font-semibold text-textPrimary">
          {tool.title}
        </h2>
      </div>
      <p className="text-sm text-textSecondary">{tool.description}</p>
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={tool.placeholder}
        className="min-h-[100px] w-full resize-none rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary outline-none placeholder:text-textMuted focus:border-accent"
      />
      <button
        type="button"
        onClick={() => void runTool()}
        disabled={loading || input.trim().length === 0}
        className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Working..." : tool.buttonLabel}
      </button>

      {response !== "" ? (
        <div className="mt-1 whitespace-pre-wrap rounded-lg border border-borderSubtle bg-bgDark p-4 text-sm text-textSecondary">
          {response}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}
    </article>
  );
}

async function readAiResponse(response: Response) {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
  }

  raw += decoder.decode();
  return extractTextFromStream(raw).trim();
}

function extractTextFromStream(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const collected: string[] = [];

  for (const line of lines) {
    const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
    if (payload === "[DONE]") continue;

    if (payload.startsWith("0:")) {
      collected.push(parseJsonString(payload.slice(2)));
      continue;
    }

    const parsed = parseJsonPayload(payload);
    if (parsed) {
      collected.push(parsed);
    }
  }

  if (collected.length > 0) {
    return collected.join("");
  }

  return raw;
}

function parseJsonString(value: string) {
  try {
    const parsed = JSON.parse(value) as string;
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return value;
  }
}

function parseJsonPayload(value: string) {
  try {
    const parsed = JSON.parse(value) as {
      type?: string;
      text?: string;
      delta?: string;
      content?: string;
    };

    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.delta === "string") return parsed.delta;
    if (typeof parsed.content === "string") return parsed.content;
    return "";
  } catch {
    return "";
  }
}
