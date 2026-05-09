"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

export default function AiChatPage() {
  const [input, setInput] = useState("");
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    stop,
  } = useChat({ transport: new DefaultChatTransport({ api: "/api/ai-chat" }) });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const quickPrompts = useMemo(
    () => [
      {
        title: "Daily Ops Sync",
        prompt:
          "Summarize today's high-priority tasks, blocked items, open work orders, and pending requests for a leadership standup.",
      },
      {
        title: "SOP Assistant",
        prompt:
          "Draft or revise an SOP using our internal operations format. Start with SOP-003 Inventory Reorder Procedure — it needs review.",
      },
      {
        title: "Work Order Follow-Up",
        prompt:
          "Create a follow-up checklist for open work orders that are pending, on hold, or missing an assigned installer.",
      },
      {
        title: "Request Triage",
        prompt:
          "Review all pending internal requests. For each one, suggest the priority level, recommended owner, and immediate next step.",
      },
      {
        title: "Employee Workload Review",
        prompt:
          "Summarize current workload by employee and flag anyone who appears overloaded, blocked, or has overdue tasks.",
      },
      {
        title: "Inventory Watch",
        prompt:
          "Identify inventory items that are low stock, out of stock, or delayed. Suggest reorder actions and flag any work orders impacted.",
      },
      {
        title: "Weekly Leadership Summary",
        prompt:
          "Prepare a concise weekly report covering completed work, blocked items, open requests, SOPs needing review, and upcoming priorities.",
      },
    ],
    [],
  );

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (content.length === 0 || isLoading) return;

    await sendMessage({ text: content });
    setInput("");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70vh] flex-col rounded-lg border border-borderSubtle bg-surface shadow-soft">
        <header className="border-b border-borderSubtle px-5 py-4">
          <h1 className="text-2xl font-bold text-navy">AI Chat</h1>
          <p className="mt-1 text-sm text-textMuted">
            AEON — The &ldquo;Advanced Efficient Optimized Network&rdquo; — is the SNRG Labs-powered operations assistant built inside Diversified Companies OS. Ask for SOP guidance, work order planning, summaries, email drafts, or to vent about work, and get organized before moving forward.
          </p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {!hasMessages ? (
            <EmptyState />
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={[
                  "max-w-3xl rounded-lg px-4 py-3 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-navy text-white"
                    : "border border-borderSubtle bg-bgDark text-textPrimary",
                ].join(" ")}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  {message.role === "user" ? "You" : "AEON"}
                </p>
                <p className="whitespace-pre-wrap leading-6">{extractText(message)}</p>
              </article>
            ))
          )}

          {isLoading && (
            <div className="inline-flex items-center gap-2 rounded-md border border-borderSubtle bg-bgDark px-3 py-2 text-xs text-textMuted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AEON is thinking...
            </div>
          )}
        </div>

        <footer className="border-t border-borderSubtle p-4">
          <form onSubmit={submitMessage} className="space-y-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              placeholder="Ask AEON to summarize open requests, draft an SOP, triage work orders, review workload, or prepare a leadership update…"
              className="w-full rounded-md border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-textMuted">AEON · Diversified OS</p>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <button
                    type="button"
                    onClick={() => void stop()}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-borderSubtle bg-surface px-3 text-xs font-semibold text-textPrimary hover:bg-bgDark"
                  >
                    Stop
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || input.trim().length === 0}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-navy px-3 text-xs font-semibold text-white transition-colors hover:bg-[#243B63] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-cyber-red dark:border-red-400/30 dark:bg-red-500/10">
              {error.message}
              <button
                type="button"
                onClick={() => void regenerate()}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}
        </footer>
      </section>

      <aside className="space-y-3">
        {quickPrompts.map((item) => (
          <QuickPromptCard
            key={item.title}
            title={item.title}
            prompt={item.prompt}
            onSelect={(value) => void sendMessage({ text: value })}
          />
        ))}
      </aside>
    </div>
  );
}

function extractText(message: { parts?: { type: string; text?: string }[] }) {
  if (!message.parts || message.parts.length === 0) return "";

  return message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function EmptyState() {
  return (
    <div className="grid min-h-[20rem] place-items-center rounded-md border border-dashed border-borderHover bg-bgDark px-6 py-10 text-center">
      <div>
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy">
          <Bot className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-textPrimary">AEON is ready</h2>
        <p className="mt-2 max-w-md text-sm text-textMuted">
          Ask AEON to summarize tasks, triage requests, draft SOPs, create work order follow-up plans, or prepare a leadership update. Use a quick prompt on the right to get started.
        </p>
      </div>
    </div>
  );
}

type QuickPromptCardProps = {
  title: string;
  prompt: string;
  onSelect: (value: string) => void;
};

function QuickPromptCard({ title, prompt, onSelect }: QuickPromptCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      className="w-full rounded-lg border border-borderSubtle bg-surface p-4 text-left shadow-soft transition-colors hover:border-borderHover"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Quick Prompt</p>
      <h3 className="mt-1 text-sm font-semibold text-textPrimary">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-textMuted">{prompt}</p>
    </button>
  );
}
