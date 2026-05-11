"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bot,
  Command,
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

type WhisperResult = { text?: string } | string;
type WhisperTranscriber = (
  input: Float32Array,
  options?: Record<string, unknown>,
) => Promise<WhisperResult>;

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
let whisperTranscriberPromise: Promise<WhisperTranscriber> | null = null;

function downsampleTo16k(
  input: Float32Array,
  sampleRate: number,
): Float32Array {
  if (sampleRate === 16000) return input;

  const ratio = sampleRate / 16000;
  const targetLength = Math.round(input.length / ratio);
  const result = new Float32Array(targetLength);

  let outputIndex = 0;
  let inputOffset = 0;

  while (outputIndex < targetLength) {
    const nextOffset = Math.round((outputIndex + 1) * ratio);
    let accumulator = 0;
    let count = 0;

    for (
      let index = inputOffset;
      index < nextOffset && index < input.length;
      index += 1
    ) {
      accumulator += input[index];
      count += 1;
    }

    result[outputIndex] = count > 0 ? accumulator / count : 0;
    outputIndex += 1;
    inputOffset = nextOffset;
  }

  return result;
}

async function audioBlobToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextCtor =
    window.AudioContext ||
    ((window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ??
      null);

  if (!AudioContextCtor) {
    throw new Error("AudioContext is not supported in this browser.");
  }

  const audioContext = new AudioContextCtor();
  try {
    const decodedAudio = await audioContext.decodeAudioData(
      arrayBuffer.slice(0),
    );
    const monoChannel = decodedAudio.getChannelData(0);
    return downsampleTo16k(monoChannel, decodedAudio.sampleRate);
  } finally {
    await audioContext.close();
  }
}

async function getWhisperTranscriber(): Promise<WhisperTranscriber> {
  if (!whisperTranscriberPromise) {
    whisperTranscriberPromise = (async () => {
      const dynamicImport = Function(
        "modulePath",
        "return import(modulePath)",
      ) as (modulePath: string) => Promise<unknown>;

      const transformersModule = (await dynamicImport(
        "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2",
      )) as {
        env: {
          allowLocalModels: boolean;
          allowRemoteModels: boolean;
          useBrowserCache: boolean;
        };
        pipeline: (
          task: string,
          model: string,
          options?: Record<string, unknown>,
        ) => Promise<unknown>;
      };

      const { env, pipeline } = transformersModule;
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
        { quantized: true },
      );

      return transcriber as WhisperTranscriber;
    })();
  }

  return whisperTranscriberPromise;
}

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
  const [railPulse, setRailPulse] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileUIPart[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);
  const [sttStatus, setSttStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const quickPromptsRailRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { messages, sendMessage, status, error, regenerate, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai-chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const stopMediaCapture = () => {
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    const mediaCaptureSupported =
      typeof window !== "undefined" &&
      "MediaRecorder" in window &&
      Boolean(navigator.mediaDevices?.getUserMedia);
    setSttSupported(mediaCaptureSupported);

    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopMediaCapture();
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

  const transcribeRecordedAudio = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;

    const isModelColdStart = whisperTranscriberPromise === null;
    setIsTranscribing(true);
    setSttError(null);
    setSttStatus(
      isModelColdStart
        ? "Downloading local speech model for first use..."
        : "Transcribing speech locally...",
    );

    try {
      const mono16kAudio = await audioBlobToMono16k(audioBlob);
      const transcriber = await getWhisperTranscriber();
      setSttStatus("Transcribing speech locally...");
      const result = await transcriber(mono16kAudio, {
        language: "english",
        task: "transcribe",
        chunk_length_s: 20,
        stride_length_s: 5,
        return_timestamps: false,
      });

      const transcript =
        typeof result === "string" ? result.trim() : (result.text ?? "").trim();

      if (!transcript) {
        setSttError(
          "No clear speech was detected. Try again and speak closer to the mic.",
        );
        return;
      }

      setInput((current) =>
        current.trim().length === 0
          ? transcript
          : `${current.trim()} ${transcript}`,
      );
    } catch {
      setSttError(
        "Local open-source transcription failed. Please try recording again.",
      );
    } finally {
      setIsTranscribing(false);
      setSttStatus(null);
      composerRef.current?.focus();
    }
  };

  const toggleRecording = () => {
    setSttError(null);
    setSttStatus(null);

    if (isRecording) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);

        mediaStreamRef.current = stream;
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          setSttError(
            "Microphone capture failed. Check mic permissions and try again.",
          );
          setSttStatus(null);
          setIsRecording(false);
          stopMediaCapture();
        };

        recorder.onstop = () => {
          const recordedAudio = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          stopMediaCapture();
          setIsRecording(false);
          void transcribeRecordedAudio(recordedAudio);
        };

        recorder.start(250);
        setIsRecording(true);
      } catch {
        setSttError(
          "Microphone access was blocked. Enable permission and try again.",
        );
        setSttStatus(null);
      }
    })();
  };

  const handlePromptButtonClick = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      quickPromptsRailRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      setRailPulse(true);
      window.setTimeout(() => setRailPulse(false), 900);
      return;
    }

    setPromptSheetOpen(true);
  };

  const sendCurrentMessage = async () => {
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

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    await sendCurrentMessage();
  };

  const submitQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage({ text: prompt }, { body: { model } });
    setPromptSheetOpen(false);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendCurrentMessage();
    }
  };

  return (
    <div className="grid h-[calc(100dvh-11rem)] min-h-0 w-full overflow-hidden gap-4 lg:h-[calc(100dvh-8rem)] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#5A4926]/40 bg-[#05080F] shadow-[0_24px_55px_rgba(0,0,0,0.45)]">
        <header className="shrink-0 border-b border-[#5A4926]/25 px-4 pb-3 pt-4 sm:px-5">
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F2E9]">
            AI Chat
          </h1>
          <p className="mt-1 text-sm text-[#A4AAB7]">
            AEON — The &ldquo;Advanced Efficient Optimized Network&rdquo; — is
            the SNRG Labs-powered operations assistant built inside Diversified
            Companies OS. Ask for SOP guidance, work order planning, summaries,
            email drafts, or to vent about work, and get organized before moving
            forward.
          </p>
        </header>

        <div
          ref={messageViewportRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
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
                    ? "ml-auto bg-gradient-to-br from-[#82612A] to-[#B28A44] text-[#0F1117]"
                    : "border border-[#3B3F4B] bg-[#0F141F] text-[#E8EAF0]",
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
                        className="inline-flex items-center gap-2 rounded-lg border border-[#6B5530]/45 bg-black/20 px-2.5 py-1.5 text-xs"
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
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#5A4926]/45 bg-[#111725] px-3 py-2 text-xs text-[#BBC1CC]"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AEON is thinking...
            </motion.div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#5A4926]/25 bg-[#0A111C]/90 p-3 backdrop-blur-md lg:p-4">
          <form
            onSubmit={submitMessage}
            className="space-y-3 rounded-2xl border border-[#5A4926]/35 bg-[#101929] p-3 focus-within:ring-2 focus-within:ring-yellow-600/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelection}
              accept=".pdf,.txt,.md,.csv,.json,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
            />

            {pendingFiles.length > 0 ? (
              <div className="rounded-xl border border-[#5A4926]/35 bg-[#0B1320] p-2.5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B4BAC6]">
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
                        className="inline-flex items-center gap-2 rounded-lg border border-[#4A3D24]/45 bg-[#131D2C] px-2.5 py-1.5 text-xs text-[#D8DCE5]"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="max-w-[12rem] truncate">
                          {filePart.filename ?? "Attachment"}
                        </span>
                        <span className="text-[#8E96A6]">
                          {formatBytes(approximateBytes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(index)}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#8E96A6] transition-colors hover:text-[#F6F7FA]"
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
              onKeyDown={handleComposerKeyDown}
              onFocus={() => {
                composerRef.current?.scrollIntoView({
                  block: "center",
                  behavior: "smooth",
                });
              }}
              rows={2}
              placeholder="Ask AEON anything, attach files with +, or use the mic for speech-to-text..."
              className="w-full resize-none rounded-xl border border-[#5A4926]/30 bg-[#0C1422] px-3 py-3 text-sm text-[#ECEEF4] outline-none transition-colors placeholder:text-[#7E8698] focus:border-[#B28A44]"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePromptButtonClick}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#5A4926]/45 bg-[#0F1726] px-3 text-sm font-semibold text-[#F3EFE3] transition-colors hover:bg-[#152036]"
                >
                  <WandSparkles className="h-4 w-4 text-[#CBA661]" />
                  Prompts
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#5A4926]/45 bg-[#0F1726] px-3 text-sm font-semibold text-[#E9ECF4] transition-colors hover:bg-[#152036]"
                >
                  <Plus className="h-4 w-4" />
                  File
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={!sttSupported || isTranscribing}
                  className={[
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold",
                    !sttSupported || isTranscribing
                      ? "cursor-not-allowed border-[#3B3F4B] bg-[#0F1726] text-[#7E8698]"
                      : isRecording
                        ? "border-[#B97724] bg-[#B97724]/15 text-[#FFCC7A]"
                        : "border-[#5A4926]/45 bg-[#0F1726] text-[#E9ECF4]",
                  ].join(" ")}
                >
                  {isRecording || isTranscribing ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {isTranscribing
                    ? "Transcribing"
                    : isRecording
                      ? "Stop Mic"
                      : "Mic"}
                </button>
                <label className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#5A4926]/45 bg-[#0F1726] px-3 text-xs font-semibold text-[#AEB5C4]">
                  Model
                  <select
                    value={model}
                    onChange={(event) =>
                      setModel(event.target.value as ChatModel)
                    }
                    className="ml-2 bg-transparent text-xs text-[#F1F3F8] outline-none"
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
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#5A4926]/45 bg-[#0F1726] px-3 text-sm font-semibold text-[#F0F2F8]"
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
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8F6D31] to-[#C29A4E] px-4 text-sm font-semibold text-[#0F1219] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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

          {sttStatus && !sttError && (
            <div className="mt-3 rounded-md border border-[#5A4926]/40 bg-[#B48942]/10 px-3 py-2 text-xs text-[#E6C17B]">
              {sttStatus}
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

      <aside className="hidden h-full w-80 shrink-0 xl:block">
        <div
          ref={quickPromptsRailRef}
          className={[
            "h-full space-y-3 overflow-y-auto rounded-2xl bg-[#0A111C]/72 p-3 backdrop-blur-md",
            railPulse
              ? "ring-2 ring-[#B78F48]/55 shadow-[0_0_0_1px_rgba(183,143,72,0.3)]"
              : "ring-1 ring-[#3B3F4B]/65",
          ].join(" ")}
        >
          <div className="mb-1 flex items-center gap-2 px-1">
            <Command className="h-4 w-4 text-[#C39A52]" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7DCE6]">
              Quick Prompts
            </p>
          </div>
          {quickPrompts.map((item) => (
            <QuickPromptCard
              key={item.title}
              title={item.title}
              prompt={item.prompt}
              onSelect={(value) => void submitQuickPrompt(value)}
            />
          ))}
        </div>
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
      className="relative grid min-h-[8.5rem] place-items-center overflow-hidden rounded-2xl bg-[#0D1522] px-6 py-6 text-center sm:min-h-[10rem]"
    >
      <motion.div
        className="pointer-events-none absolute -top-20 h-64 w-64 rounded-full bg-[#BB8D3F]/20 blur-3xl"
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-30%] h-72 w-72 rounded-full bg-[#4E658D]/25 blur-3xl"
        animate={{ opacity: [0.25, 0.4, 0.25], scale: [1, 1.12, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative">
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#B48942]/20 text-[#E6BC72]">
          <Bot className="h-5 w-5" />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-2xl font-bold tracking-tight text-[#F6F3EA]"
        >
          AEON is ready
        </motion.h2>
        <p className="mt-2 max-w-md text-sm text-[#B5BBC8]">
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
    <motion.button
      type="button"
      onClick={() => onSelect(prompt)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.985 }}
      className="group w-full rounded-xl bg-slate-800/50 p-4 text-left backdrop-blur-md transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(191,149,73,0.38),0_14px_26px_rgba(0,0,0,0.32)]"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E0E6F2]">
        Quick Prompt
      </p>
      <h3 className="mt-1 text-sm font-bold text-[#FAFCFF]">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#AAB1C0]">{prompt}</p>
    </motion.button>
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
            className="fixed inset-0 z-40 bg-black/45 xl:hidden"
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
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-[#5A4926]/40 bg-[#060C17] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-cyberLg xl:hidden"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C39A52]" />
                <h2 className="text-2xl font-bold tracking-tight text-[#F5F2E8]">
                  Quick Prompts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#5A4926]/40 bg-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-[#AEB5C5]">
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
                  className="w-full rounded-xl bg-slate-800/50 px-3 py-3 text-left backdrop-blur-md"
                >
                  <p className="text-sm font-bold text-[#F9FBFF]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#AEB5C5]">
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
