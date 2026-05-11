"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bot,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Send,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";

type ChatModel = "deepseek-v4-flash" | "deepseek-v4-pro";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{
    isFinal: boolean;
    0: {
      transcript: string;
    };
  }>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function toFileUIParts(files: FileList): Promise<FileUIPart[]> {
  const parts: FileUIPart[] = [];

  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `${file.name} is larger than 8MB. Please upload a smaller file.`,
      );
    }

    const mediaType = file.type || "application/octet-stream";
    const url = await readAsDataUrl(file);
    parts.push({
      type: "file",
      mediaType,
      filename: file.name,
      url,
    });
  }

  return parts;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AiChatPage() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<ChatModel>("deepseek-v4-flash");
  const [promptSheetOpen, setPromptSheetOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileUIPart[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { messages, sendMessage, status, error, regenerate, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai-chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const SpeechRecognitionAPI =
      (
        window as unknown as {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSttSupported(false);
      return;
    }

    setSttSupported(true);
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript.trim().length > 0) {
        setInput((current) =>
          current.trim().length === 0
            ? finalTranscript.trim()
            : `${current.trim()} ${finalTranscript.trim()}`,
        );
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setSttError(`Speech capture failed: ${event.error}.`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

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

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const converted = await toFileUIParts(files);
      setPendingFiles((current) => [...current, ...converted]);
      setFileError(null);
    } catch (error: unknown) {
      setFileError(
        error instanceof Error ? error.message : "Failed to process files.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const removePendingFile = (indexToRemove: number) => {
    setPendingFiles((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  };

  const toggleRecording = () => {
    setSttError(null);
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setSttError("Speech recognition is already running.");
    }
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    const hasFiles = pendingFiles.length > 0;
    if ((!hasFiles && content.length === 0) || isLoading) return;

    if (content.length > 0) {
      await sendMessage(
        {
          text: content,
          files: hasFiles ? pendingFiles : undefined,
        },
        { body: { model } },
      );
    } else {
      await sendMessage(
        {
          files: pendingFiles,
        },
        { body: { model } },
      );
    }

    setInput("");
    setPendingFiles([]);
    setFileError(null);
  };

  const submitQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage({ text: prompt }, { body: { model } });
    setPromptSheetOpen(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="relative flex min-h-[72dvh] flex-col overflow-hidden rounded-2xl border border-borderSubtle bg-surface shadow-soft">
        <header className="px-4 pb-3 pt-4 sm:px-5">
          <h1 className="text-3xl font-bold tracking-tight text-textPrimary">
            AI Chat
          </h1>
          <p className="mt-1 text-sm text-textMuted/70">
            AEON — The &ldquo;Advanced Efficient Optimized Network&rdquo; — is
            the SNRG Labs-powered operations assistant built inside Diversified
            Companies OS. Ask for SOP guidance, work order planning, summaries,
            email drafts, or to vent about work, and get organized before moving
            forward.
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
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 28,
                  mass: 0.8,
                }}
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
                <p className="whitespace-pre-wrap leading-6">
                  {extractText(message)}
                </p>
                {extractFileParts(message).length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {extractFileParts(message).map((filePart, index) => (
                      <div
                        key={`${filePart.filename ?? "file"}-${index}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/15 px-2.5 py-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{filePart.filename ?? filePart.mediaType}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.article>
            ))
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 30,
                mass: 0.85,
              }}
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
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelection}
              accept=".pdf,.txt,.md,.csv,.json,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
            />

            {pendingFiles.length > 0 ? (
              <div className="rounded-xl border border-borderSubtle bg-bgDark p-2.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-textMuted">
                  Attached Files ({pendingFiles.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((filePart, index) => {
                    const approximateBytes = Math.round(
                      filePart.url.length * 0.75,
                    );
                    return (
                      <div
                        key={`${filePart.filename ?? "pending"}-${index}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-borderSubtle bg-surface px-2.5 py-1.5 text-xs text-textSecondary"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="max-w-[12rem] truncate">
                          {filePart.filename ?? "Attachment"}
                        </span>
                        <span className="text-textDisabled">
                          {formatBytes(approximateBytes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(index)}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-textMuted transition-colors hover:text-textPrimary"
                          aria-label={`Remove ${filePart.filename ?? "attachment"}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <textarea
              ref={composerRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => {
                composerRef.current?.scrollIntoView({
                  block: "center",
                  behavior: "smooth",
                });
              }}
              rows={2}
              placeholder="Ask AEON anything, attach files with +, or use the mic for speech-to-text..."
              className="w-full resize-none rounded-xl border border-borderSubtle bg-bgDark px-3 py-3 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPromptSheetOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-borderSubtle bg-bgDark px-3 text-sm font-semibold text-textPrimary"
                >
                  <WandSparkles className="h-4 w-4" />
                  Prompts
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-borderSubtle bg-bgDark px-3 text-sm font-semibold text-textPrimary"
                >
                  <Plus className="h-4 w-4" />
                  File
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={!sttSupported}
                  className={[
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold",
                    !sttSupported
                      ? "cursor-not-allowed border-borderSubtle bg-bgDark text-textDisabled"
                      : isRecording
                        ? "border-cyber-red bg-cyber-red/10 text-cyber-red"
                        : "border-borderSubtle bg-bgDark text-textPrimary",
                  ].join(" ")}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {isRecording ? "Stop Mic" : "Mic"}
                </button>
                <label className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borderSubtle bg-bgDark px-3 text-xs font-semibold text-textSecondary">
                  Model
                  <select
                    value={model}
                    onChange={(event) =>
                      setModel(event.target.value as ChatModel)
                    }
                    className="ml-2 bg-transparent text-xs text-textPrimary outline-none"
                  >
                    <option value="deepseek-v4-flash">v4 Flash</option>
                    <option value="deepseek-v4-pro">v4 Pro</option>
                  </select>
                </label>
              </div>
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
                  disabled={
                    isLoading ||
                    (input.trim().length === 0 && pendingFiles.length === 0)
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243B63] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          </form>

          {fileError && (
            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              {fileError}
            </div>
          )}

          {sttError && (
            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              {sttError}
            </div>
          )}

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

function extractText(message: {
  parts?: Array<{ type: string; text?: string }>;
}) {
  if (!message.parts || message.parts.length === 0) return "";

  return message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function extractFileParts(message: {
  parts?: Array<{
    type: string;
    filename?: string;
    mediaType?: string;
    url?: string;
  }>;
}): FileUIPart[] {
  if (!message.parts || message.parts.length === 0) return [];

  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file",
  );
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
        <h2 className="text-2xl font-bold tracking-tight text-textPrimary">
          AEON is ready
        </h2>
        <p className="mt-2 max-w-md text-sm text-textMuted/70">
          Ask AEON to summarize tasks, triage requests, draft SOPs, create work
          order follow-up plans, or prepare a leadership update. Use a quick
          prompt on the right to get started.
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
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        Quick Prompt
      </p>
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

function QuickPromptSheet({
  open,
  quickPrompts,
  onClose,
  onSelect,
}: QuickPromptSheetProps) {
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
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 34,
              mass: 0.88,
            }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-borderSubtle bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-cyberLg xl:hidden"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-navy" />
                <h2 className="text-2xl font-bold tracking-tight text-textPrimary">
                  Quick Prompts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-borderSubtle bg-bgDark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-textMuted/70">
              Start faster with high-signal prompts built for operations
              workflows.
            </p>
            <div className="mt-3 max-h-[56dvh] space-y-2 overflow-y-auto pb-2">
              {quickPrompts.map((item, index) => (
                <motion.button
                  key={item.title}
                  type="button"
                  onClick={() => onSelect(item.prompt)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 360,
                    damping: 28,
                    mass: 0.86,
                    delay: index * 0.02,
                  }}
                  className="w-full rounded-xl border border-borderSubtle bg-bgDark px-3 py-3 text-left"
                >
                  <p className="text-sm font-semibold text-textPrimary">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-textMuted/70">
                    {item.prompt}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
