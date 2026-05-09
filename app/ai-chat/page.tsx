"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, WandSparkles, X } from "lucide-react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";

export default function AiChatPage() {
  const [input, setInput] = useState("");
  const [promptSheetOpen, setPromptSheetOpen] = useState(false);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (content.length === 0 || isLoading) return;

    await sendMessage({ text: content });
    setInput("");
  };

  const submitQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage({ text: prompt });
    setPromptSheetOpen(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="relative flex min-h-[72dvh] flex-col overflow-hidden rounded-2xl border border-borderSubtle bg-surface shadow-soft">
        <header className="px-4 pb-3 pt-4 sm:px-5">
          <h1 className="text-3xl font-bold tracking-tight text-textPrimary">AI Chat</h1>
          <p className="mt-1 text-sm text-textMuted/70">
            AEON — The &ldquo;Advanced Efficient Optimized Network&rdquo; — is the SNRG Labs-powered operations assistant built inside Diversified Companies OS. Ask for SOP guidance, work order planning, summaries, email drafts, or to vent about work, and get organized before moving forward.
          </p>
        </header>

        <div
          ref={messageViewportRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 pb-40 pt-3 sm:px-5 lg:pb-8"
        >
          {!hasMessages ? (
            <EmptyState />
          ) : (
            messages.map((message) => (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 28, mass: 0.8 }}
                className={[
                  "max-w-3xl rounded-2xl px-4 py-3 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-navy text-white"
                    : "border border-borderSubtle bg-bgDark text-textPrimary",
                ].join(" ")}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  {message.role === "user" ? "You" : "AEON"}
                </p>
                <p className="whitespace-pre-wrap leading-6">{extractText(message)}</p>
              </motion.article>
            ))
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.85 }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-borderSubtle bg-bgDark px-3 py-2 text-xs text-textMuted"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AEON is thinking...
            </motion.div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent lg:hidden" />

        <footer className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.65rem)] z-30 border-t border-borderSubtle bg-surface/95 p-3 backdrop-blur lg:static lg:bottom-auto lg:border-t-0 lg:bg-transparent lg:p-4">
          <form onSubmit={submitMessage} className="space-y-3">
            <textarea
              ref={composerRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => {
                composerRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
              }}
              rows={2}
              placeholder="Ask AEON to summarize open requests, draft an SOP, triage work orders, review workload, or prepare a leadership update…"
              className="w-full resize-none rounded-xl border border-borderSubtle bg-bgDark px-3 py-3 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPromptSheetOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-borderSubtle bg-bgDark px-3 text-sm font-semibold text-textPrimary"
              >
                <WandSparkles className="h-4 w-4" />
                Prompts
              </button>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <button
                    type="button"
                    onClick={() => void stop()}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borderSubtle bg-bgDark px-3 text-sm font-semibold text-textPrimary"
                  >
                    Stop
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || input.trim().length === 0}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243B63] disabled:cursor-not-allowed disabled:opacity-60"
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

      <aside className="hidden space-y-3 xl:block">
        {quickPrompts.map((item) => (
          <QuickPromptCard
            key={item.title}
            title={item.title}
            prompt={item.prompt}
            onSelect={(value) => void submitQuickPrompt(value)}
          />
        ))}
      </aside>

      <QuickPromptSheet
        open={promptSheetOpen}
        quickPrompts={quickPrompts}
        onClose={() => setPromptSheetOpen(false)}
        onSelect={(value) => void submitQuickPrompt(value)}
      />
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.85 }}
      className="grid min-h-[20rem] place-items-center rounded-2xl border border-dashed border-borderHover bg-bgDark px-6 py-10 text-center"
    >
      <div>
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy/10 text-navy">
          <Bot className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-textPrimary">AEON is ready</h2>
        <p className="mt-2 max-w-md text-sm text-textMuted/70">
          Ask AEON to summarize tasks, triage requests, draft SOPs, create work order follow-up plans, or prepare a leadership update. Use a quick prompt on the right to get started.
        </p>
      </div>
    </motion.div>
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
      className="w-full rounded-xl border border-borderSubtle bg-surface p-4 text-left shadow-soft transition-colors hover:border-borderHover"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Quick Prompt</p>
      <h3 className="mt-1 text-sm font-semibold text-textPrimary">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-textMuted/70">{prompt}</p>
    </button>
  );
}

type QuickPromptSheetProps = {
  open: boolean;
  quickPrompts: { title: string; prompt: string }[];
  onClose: () => void;
  onSelect: (value: string) => void;
};

function QuickPromptSheet({ open, quickPrompts, onClose, onSelect }: QuickPromptSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close quick prompts"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.section
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.88 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-borderSubtle bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-cyberLg xl:hidden"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-navy" />
                <h2 className="text-2xl font-bold tracking-tight text-textPrimary">Quick Prompts</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-borderSubtle bg-bgDark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-textMuted/70">Start faster with high-signal prompts built for operations workflows.</p>
            <div className="mt-3 max-h-[56dvh] space-y-2 overflow-y-auto pb-2">
              {quickPrompts.map((item, index) => (
                <motion.button
                  key={item.title}
                  type="button"
                  onClick={() => onSelect(item.prompt)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.86, delay: index * 0.02 }}
                  className="w-full rounded-xl border border-borderSubtle bg-bgDark px-3 py-3 text-left"
                >
                  <p className="text-sm font-semibold text-textPrimary">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-textMuted/70">{item.prompt}</p>
                </motion.button>
              ))}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
