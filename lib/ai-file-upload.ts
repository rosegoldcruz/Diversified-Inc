/**
 * AI Chat file upload helper.
 *
 * Diversified OS runs on a VPS (16GB RAM / 8 vCPU). When the Next.js
 * frontend is hosted on Vercel, large file extraction MUST NOT run inside
 * a Vercel serverless function (4.5MB request body cap, ~10s execution).
 *
 * This helper sends the upload directly to the VPS backend extraction
 * endpoint when `NEXT_PUBLIC_BACKEND_API_URL` is configured, and only
 * falls back to the in-app /api route when the env var is absent (e.g.
 * local dev or when the app itself is running on the VPS).
 */

export const MAX_AI_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB
export const MAX_AI_ATTACHMENT_LABEL = "25MB";

export const AI_EXTRACT_PATH = "/api/ai-chat/extract-file";

export type AiExtractResponse = {
  ok?: boolean;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  summary?: string;
  chunks?: string[];
  fileId?: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
};

export class AiUploadError extends Error {
  status: number;
  kind: "size" | "network" | "extraction" | "server";

  constructor(message: string, kind: AiUploadError["kind"], status = 0) {
    super(message);
    this.name = "AiUploadError";
    this.kind = kind;
    this.status = status;
  }
}

function getBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_API_URL?.trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

export function getAiExtractEndpoint(): string {
  const base = getBackendBaseUrl();
  return base ? `${base}${AI_EXTRACT_PATH}` : AI_EXTRACT_PATH;
}

export function isUsingVpsBackend(): boolean {
  return getBackendBaseUrl().length > 0;
}

export function validateAttachmentSize(file: File): void {
  if (file.size > MAX_AI_ATTACHMENT_BYTES) {
    throw new AiUploadError(
      `${file.name} is larger than ${MAX_AI_ATTACHMENT_LABEL}. Please upload a smaller file or split the document.`,
      "size",
      413,
    );
  }
}

function normalizeResponse(
  raw: unknown,
  fallbackName: string,
  fallbackType: string,
  fallbackSize: number,
): AiExtractResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const extractedText =
    typeof payload.extractedText === "string"
      ? payload.extractedText
      : typeof payload.text === "string"
        ? payload.text
        : "";
  const fileName =
    typeof payload.fileName === "string" ? payload.fileName : fallbackName;
  const mimeType =
    typeof payload.mimeType === "string" ? payload.mimeType : fallbackType;
  const sizeCandidate =
    typeof payload.sizeBytes === "number"
      ? payload.sizeBytes
      : typeof payload.size === "number"
        ? payload.size
        : fallbackSize;

  return {
    ok: payload.ok !== false,
    fileName,
    mimeType,
    sizeBytes: sizeCandidate,
    extractedText,
    summary: typeof payload.summary === "string" ? payload.summary : undefined,
    chunks: Array.isArray(payload.chunks)
      ? payload.chunks.filter((c): c is string => typeof c === "string")
      : undefined,
    fileId: typeof payload.fileId === "string" ? payload.fileId : undefined,
  };
}

function uploadWithProgress(
  endpoint: string,
  file: File,
  options: UploadOptions,
): Promise<{ status: number; bodyText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", endpoint, true);
    xhr.responseType = "text";
    // Cookies are needed when the endpoint is same-origin; harmless
    // for cross-origin VPS endpoints that allow credentials.
    xhr.withCredentials = true;

    if (xhr.upload && options.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent =
          event.total > 0 ? Math.round((event.loaded / event.total) * 100) : 0;
        options.onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent,
        });
      };
    }

    xhr.onload = () => {
      resolve({ status: xhr.status, bodyText: xhr.responseText ?? "" });
    };

    xhr.onerror = () => {
      reject(
        new AiUploadError(
          "Upload failed on backend. The file was not processed.",
          "network",
        ),
      );
    };

    xhr.onabort = () => {
      reject(new AiUploadError("Upload was canceled.", "network"));
    };

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener("abort", () => xhr.abort(), {
        once: true,
      });
    }

    xhr.send(formData);
  });
}

/**
 * Upload a file to the VPS extraction endpoint and return normalized
 * extraction metadata. Throws `AiUploadError` on failure.
 */
export async function uploadAndExtractFile(
  file: File,
  options: UploadOptions = {},
): Promise<AiExtractResponse> {
  validateAttachmentSize(file);

  const endpoint = getAiExtractEndpoint();
  const fallbackType = file.type || "application/octet-stream";

  let result: { status: number; bodyText: string };
  try {
    result = await uploadWithProgress(endpoint, file, options);
  } catch (error) {
    if (error instanceof AiUploadError) throw error;
    throw new AiUploadError(
      "Upload failed on backend. The file was not processed.",
      "network",
    );
  }

  let parsed: unknown = null;
  if (result.bodyText) {
    try {
      parsed = JSON.parse(result.bodyText);
    } catch {
      parsed = null;
    }
  }

  if (result.status < 200 || result.status >= 300) {
    const responseMessage =
      parsed && typeof parsed === "object"
        ? typeof (parsed as { message?: unknown }).message === "string"
          ? (parsed as { message: string }).message
          : typeof (parsed as { error?: unknown }).error === "string"
            ? (parsed as { error: string }).error
            : ""
        : "";

    const message =
      result.status === 413
        ? `File is larger than ${MAX_AI_ATTACHMENT_LABEL}. Please upload a smaller file or split the document.`
        : result.status >= 500
          ? "Upload failed on backend. The file was not processed."
          : responseMessage ||
            "File uploaded, but text extraction failed. Try a smaller PDF or split the document.";
    const kind: AiUploadError["kind"] =
      result.status === 413
        ? "size"
        : result.status >= 500
          ? "server"
          : "extraction";
    throw new AiUploadError(message, kind, result.status);
  }

  const normalized = normalizeResponse(
    parsed,
    file.name,
    fallbackType,
    file.size,
  );

  if (!normalized.extractedText.trim()) {
    throw new AiUploadError(
      `File uploaded, but no readable text was extracted from ${file.name}.`,
      "extraction",
      422,
    );
  }

  return normalized;
}
