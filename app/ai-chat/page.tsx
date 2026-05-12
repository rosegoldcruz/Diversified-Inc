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
  Command,
  FileText,
  MagicWand,
  Microphone,
  MicrophoneSlash,
  PaperPlaneRight,
  Plus,
  Robot,
  Sparkle,
  SpinnerGap,
  X,
} from "phosphor-react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";

type ChatModel = "deepseek-v4-flash" | "deepseek-v4-pro";

type AttachmentStatus = "queued" | "processing" | "ready" | "error";

type AttachmentContext = {
  fileName: string;
  mimeType: string;
  size: number;
  extractedText: string;
};

type ChatAttachment = {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  extractedText?: string;
  error?: string;
  status: AttachmentStatus;
};

type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENT_CONTEXT_CHARS = 40_000;

const TEXT_LIKE_EXTENSIONS = new Set(["txt", "md", "csv", "json", "log"]);
const TEXT_LIKE_MIME_PREFIXES = ["text/"];
const TEXT_LIKE_MIME_TYPES = new Set([
  "application/json",
  "application/csv",
  "text/csv",
  "text/markdown",
]);

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isTextLikeFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  return (
    TEXT_LIKE_EXTENSIONS.has(extension) ||
    TEXT_LIKE_MIME_TYPES.has(file.type) ||
    TEXT_LIKE_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))
  );
}

function isServerExtractableFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  return (
    extension === "pdf" ||
    extension === "doc" ||
    extension === "docx" ||
    file.type === "application/pdf" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  );
}

function truncateAttachmentText(text: string): string {
  if (text.length <= MAX_ATTACHMENT_CONTEXT_CHARS) return text;
  return `${text.slice(0, MAX_ATTACHMENT_CONTEXT_CHARS)}\n\n[Content truncated after ${MAX_ATTACHMENT_CONTEXT_CHARS.toLocaleString()} characters.]`;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechRecognitionWindow;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function appendTranscript(current: string, transcript: string): string {
  const cleanedTranscript = transcript.trim();
  if (!cleanedTranscript) return current;
  return current.trim().length === 0
    ? cleanedTranscript
    : `${current.trim()} ${cleanedTranscript}`;
}

function mapSpeechError(errorCode: string): string {
  if (
    errorCode === "not-allowed" ||
    errorCode === "service-not-allowed" ||
    errorCode === "permission-denied"
  ) {
    return "Microphone permission was denied. Enable mic access in the browser and try again.";
  }

  if (errorCode === "no-speech") {
    return "No clear speech was detected. Try again and speak closer to the mic.";
  }

  if (errorCode === "audio-capture") {
    return "No microphone was found. Connect a microphone and try again.";
  }

  if (errorCode === "network") {
    return "Mic transcription could not connect. Please try again or type your message.";
  }

  return "Mic transcription failed. Please try again or type your message.";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function toFileUIParts(files: ChatAttachment[]): Promise<FileUIPart[]> {
  const parts: FileUIPart[] = [];

  for (const attachment of files) {
    const mediaType = attachment.type || "application/octet-stream";
    const url = await readAsDataUrl(attachment.file);
    parts.push({
      type: "file",
      mediaType,
      filename: attachment.name,
      url,
    });
  }

  return parts;
}

async function extractTextFromAttachment(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `${file.name} is larger than 8MB. Please upload a smaller file.`,
    );
  }

  if (isTextLikeFile(file)) {
    return truncateAttachmentText(await file.text());
  }

  if (!isServerExtractableFile(file)) {
    throw new Error(
      `${file.name} is not a supported readable file. Attach a PDF, TXT, MD, CSV, DOC, or DOCX file.`,
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ai-chat/extract-file", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    extractedText?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error ?? `Failed to extract text from ${file.name}.`,
    );
  }

  const extractedText = (payload.extractedText ?? "").trim();
  if (!extractedText) {
    throw new Error(`No readable text was found in ${file.name}.`);
  }

  return truncateAttachmentText(extractedText);
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
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [conversationFileContexts, setConversationFileContexts] = useState<
    AttachmentContext[]
  >([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);
  const [sttStatus, setSttStatus] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const layoutRootRef = useRef<HTMLDivElement>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const quickPromptsRailRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const lastInterimTranscriptRef = useRef("");
  const speechErrorRef = useRef(false);
  const receivedSpeechRef = useRef(false);
  const { messages, sendMessage, status, error, regenerate, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai-chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;
  const attachmentsProcessing = pendingFiles.some(
    (file) => file.status === "queued" || file.status === "processing",
  );
  const hasAttachmentErrors = pendingFiles.some(
    (file) => file.status === "error",
  );

  useEffect(() => {
    setSttSupported(Boolean(getSpeechRecognition()));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateAvailableHeight = () => {
      if (!layoutRootRef.current) return;

      const { top } = layoutRootRef.current.getBoundingClientRect();
      const nextHeight = Math.max(320, Math.floor(window.innerHeight - top));
      setAvailableHeight(nextHeight);
    };

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);

    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
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

    const attachments: ChatAttachment[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      status: "queued",
    }));

    setPendingFiles((current) => [...current, ...attachments]);
    setFileError(null);
    event.target.value = "";

    await Promise.all(
      attachments.map(async (attachment) => {
        setPendingFiles((current) =>
          current.map((file) =>
            file.id === attachment.id
              ? { ...file, status: "processing", error: undefined }
              : file,
          ),
        );

        try {
          const extractedText = await extractTextFromAttachment(
            attachment.file,
          );
          setPendingFiles((current) =>
            current.map((file) =>
              file.id === attachment.id
                ? { ...file, extractedText, status: "ready", error: undefined }
                : file,
            ),
          );
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : `Failed to extract text from ${attachment.name}.`;
          setPendingFiles((current) =>
            current.map((file) =>
              file.id === attachment.id
                ? { ...file, status: "error", error: message }
                : file,
            ),
          );
          setFileError(message);
        }
      }),
    );
  };

  const removePendingFile = (attachmentId: string) => {
    setPendingFiles((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    );
    setFileError(null);
  };

  const toggleRecording = () => {
    setSttError(null);
    setSttStatus(null);
    setInterimTranscript("");

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSttError(
        "Mic transcription is not supported in this browser. Please type your message.",
      );
      setSttSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    lastInterimTranscriptRef.current = "";
    speechErrorRef.current = false;
    receivedSpeechRef.current = false;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let nextInterimTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          nextInterimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        receivedSpeechRef.current = true;
        setInput((current) => appendTranscript(current, finalTranscript));
        setInterimTranscript("");
        lastInterimTranscriptRef.current = "";
      } else {
        setInterimTranscript(nextInterimTranscript.trim());
        lastInterimTranscriptRef.current = nextInterimTranscript.trim();
      }
    };

    recognition.onerror = (event) => {
      speechErrorRef.current = true;
      setSttError(mapSpeechError(event.error));
      setSttStatus(null);
      setInterimTranscript("");
      setIsRecording(false);
    };

    recognition.onend = () => {
      const fallbackTranscript = lastInterimTranscriptRef.current.trim();
      if (
        !receivedSpeechRef.current &&
        fallbackTranscript &&
        !speechErrorRef.current
      ) {
        setInput((current) => appendTranscript(current, fallbackTranscript));
        receivedSpeechRef.current = true;
      }

      if (!receivedSpeechRef.current && !speechErrorRef.current) {
        setSttError(
          "No clear speech was detected. Try again and speak closer to the mic.",
        );
      }

      setSttStatus(null);
      setInterimTranscript("");
      setIsRecording(false);
      recognitionRef.current = null;
      composerRef.current?.focus();
    };

    try {
      recognition.start();
      setIsRecording(true);
      setSttStatus("Listening...");
    } catch {
      setSttError(
        "Mic transcription failed to start. Please try again or type your message.",
      );
      setIsRecording(false);
      recognitionRef.current = null;
    }
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
    if (
      (!hasFiles && content.length === 0) ||
      isLoading ||
      attachmentsProcessing ||
      hasAttachmentErrors
    ) {
      return;
    }

    const readyAttachments = pendingFiles.filter(
      (file) => file.status === "ready" && file.extractedText,
    );
    const currentAttachmentContext: AttachmentContext[] = readyAttachments.map(
      (file) => ({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        extractedText: file.extractedText ?? "",
      }),
    );
    const attachmentsContext = [
      ...conversationFileContexts,
      ...currentAttachmentContext,
    ];
    const body = { model, attachmentsContext };
    const fileParts =
      readyAttachments.length > 0 ? await toFileUIParts(readyAttachments) : [];

    if (content.length > 0) {
      await sendMessage(
        {
          text: content,
          files: fileParts.length > 0 ? fileParts : undefined,
        },
        { body },
      );
    } else {
      await sendMessage(
        {
          text: "Please analyze the attached file content.",
          files: fileParts,
        },
        { body },
      );
    }

    if (currentAttachmentContext.length > 0) {
      setConversationFileContexts((current) => [
        ...current,
        ...currentAttachmentContext,
      ]);
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
    await sendMessage(
      { text: prompt },
      { body: { model, attachmentsContext: conversationFileContexts } },
    );
    setPromptSheetOpen(false);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendCurrentMessage();
    }
  };

  return (
    <div
      ref={layoutRootRef}
      className="grid h-[calc(100dvh-11rem)] min-h-0 w-full items-stretch overflow-hidden gap-4 lg:h-[calc(100dvh-8rem)] xl:grid-cols-[minmax(0,1fr)_20rem]"
      style={availableHeight ? { height: `${availableHeight}px` } : undefined}
    >
      <section className="relative flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl">
        <header className="shrink-0 border-b border-borderSubtle px-4 pb-3 pt-4 sm:px-5">
          <h1 className="text-3xl font-semibold tracking-normal text-textPrimary">
            AI Chat
          </h1>
          <p className="mt-1 text-sm text-textSecondary">
            AEON - The &ldquo;Advanced Efficient Optimized Network&rdquo; - is
            the SNRG Labs-powered operations assistant built inside Diversified
            Companies OS. Ask for SOP guidance, work order planning, summaries,
            email drafts, or to vent about work, and get organized before moving
            forward.
          </p>
        </header>

        <div
          ref={messageViewportRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-3 sm:px-5"
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
                  "max-w-3xl rounded-lg px-4 py-3 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-accent text-white"
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
                        className="inline-flex items-center gap-2 rounded-md border border-borderSubtle bg-surface px-2.5 py-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" weight="duotone" />
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
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-borderSubtle bg-bgDark px-3 py-2 text-xs text-textSecondary"
            >
              <SpinnerGap className="h-3.5 w-3.5 animate-spin" weight="bold" />
              AEON is thinking...
            </motion.div>
          )}
        </div>

        <footer className="sticky bottom-0 z-10 shrink-0 border-t border-borderSubtle bg-surface/95 p-3 backdrop-blur-md lg:p-4">
          <form
            onSubmit={submitMessage}
            className="space-y-3 rounded-lg border border-borderSubtle bg-bgDark p-3 focus-within:ring-2 focus-within:ring-accent/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelection}
              accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
            />

            {pendingFiles.length > 0 ? (
              <div className="rounded-xl border border-borderSubtle bg-surface/95 p-3 shadow-soft backdrop-blur-xl">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textMuted">
                  Attached Files ({pendingFiles.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((attachment) => {
                    return (
                      <div
                        key={attachment.id}
                        className={[
                          "inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                          attachment.status === "error"
                            ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                            : "border-borderSubtle bg-bgDark text-textPrimary",
                        ].join(" ")}
                      >
                        <FileText className="h-3.5 w-3.5" weight="duotone" />
                        <span className="max-w-[12rem] truncate">
                          {attachment.name}
                        </span>
                        <span className="text-textMuted">
                          {formatBytes(attachment.size)}
                        </span>
                        <span className="text-textMuted">
                          {attachment.status === "processing"
                            ? "Reading"
                            : attachment.status === "ready"
                              ? "Ready"
                              : attachment.status === "error"
                                ? "Error"
                                : "Queued"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(attachment.id)}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-md text-textMuted transition-colors hover:text-textPrimary"
                          aria-label={`Remove ${attachment.name}`}
                        >
                          <X className="h-3 w-3" weight="bold" />
                        </button>
                        {attachment.error ? (
                          <span className="sr-only">{attachment.error}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {pendingFiles.some((attachment) => attachment.error) ? (
                  <div className="mt-2 space-y-1 text-xs text-amber-200">
                    {pendingFiles
                      .filter((attachment) => attachment.error)
                      .map((attachment) => (
                        <p key={`${attachment.id}-error`}>{attachment.error}</p>
                      ))}
                  </div>
                ) : null}
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
              className="w-full resize-none rounded-md border border-borderSubtle bg-surface px-3 py-3 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePromptButtonClick}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-borderSubtle bg-surface px-3 text-sm font-medium text-textPrimary transition-colors hover:bg-bgDark"
                >
                  <MagicWand className="h-4 w-4 text-accent" weight="duotone" />
                  Prompts
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-borderSubtle bg-surface px-3 text-sm font-medium text-textPrimary transition-colors hover:bg-bgDark"
                >
                  <Plus className="h-4 w-4" weight="bold" />
                  File
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={[
                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium",
                    !sttSupported
                      ? "border-borderSubtle bg-bgDark text-textDisabled"
                      : isRecording
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        : "border-borderSubtle bg-surface text-textPrimary",
                  ].join(" ")}
                >
                  {isRecording ? (
                    <MicrophoneSlash className="h-4 w-4" weight="duotone" />
                  ) : (
                    <Microphone className="h-4 w-4" weight="duotone" />
                  )}
                  {isRecording ? "Stop Mic" : "Mic"}
                </button>
                <label className="inline-flex min-h-11 items-center justify-center rounded-md border border-borderSubtle bg-surface px-3 text-xs font-medium text-textSecondary">
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
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-borderSubtle bg-surface px-3 text-sm font-medium text-textPrimary"
                  >
                    Stop
                  </button>
                )}
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    attachmentsProcessing ||
                    hasAttachmentErrors ||
                    (input.trim().length === 0 && pendingFiles.length === 0)
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PaperPlaneRight className="h-3.5 w-3.5" weight="fill" />
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
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
              {interimTranscript
                ? `${sttStatus} ${interimTranscript}`
                : sttStatus}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
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

      <aside className="hidden h-full min-h-0 w-80 shrink-0 overflow-hidden xl:block">
        <div
          ref={quickPromptsRailRef}
          className={[
            "h-full min-h-0 space-y-3 overflow-y-auto rounded-xl border border-borderSubtle bg-surface/95 p-4 shadow-soft backdrop-blur-xl",
            railPulse ? "ring-2 ring-accent/20" : "",
          ].join(" ")}
        >
          <div className="mb-1 flex items-center gap-2 px-1">
            <Command className="h-4 w-4 text-accent" weight="duotone" />
            <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
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
      className="relative grid min-h-[8.5rem] place-items-center overflow-hidden rounded-lg border border-borderSubtle bg-bgDark px-6 py-6 text-center sm:min-h-[10rem]"
    >
      <div className="relative">
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <Robot className="h-5 w-5" weight="duotone" />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-2xl font-semibold tracking-normal text-textPrimary"
        >
          AEON is ready
        </motion.h2>
        <p className="mt-2 max-w-md text-sm text-textSecondary">
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
      className="group w-full rounded-lg border border-borderSubtle bg-bgDark p-4 text-left transition-colors duration-150 hover:border-borderHover hover:bg-surfaceHover"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
        Quick Prompt
      </p>
      <h3 className="mt-1 text-sm font-semibold text-textPrimary">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-textSecondary">{prompt}</p>
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
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-lg border border-borderSubtle bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-cyberLg xl:hidden"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle className="h-4 w-4 text-accent" weight="duotone" />
                <h2 className="text-2xl font-semibold tracking-normal text-textPrimary">
                  Quick Prompts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-borderSubtle bg-surface text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>
            <p className="text-sm text-textSecondary">
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
                  className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-3 text-left"
                >
                  <p className="text-sm font-semibold text-textPrimary">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-textSecondary">
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
