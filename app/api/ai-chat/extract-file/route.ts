/**
 * Legacy / fallback file extraction endpoint.
 *
 * The primary AI Chat upload path is now `lib/ai-file-upload.ts`, which
 * sends the file directly to the VPS backend at
 * `${NEXT_PUBLIC_BACKEND_API_URL}/api/ai-chat/extract-file`. This Next.js
 * route still handles same-origin uploads when the env var is unset
 * (e.g. when the app itself is hosted on the VPS) and serves as a
 * fallback for tests. Do NOT rely on this route from a Vercel
 * deployment for files larger than the platform body-size limit.
 */
import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "25MB";
const MAX_EXTRACTED_CHARS = 40_000;
const TEXT_LIKE_EXTENSIONS = new Set(["txt", "md", "csv", "json", "log"]);
const TEXT_LIKE_MIME_TYPES = new Set([
  "application/json",
  "application/csv",
  "text/csv",
  "text/markdown",
]);

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function truncateText(text: string): string {
  const cleanedText = text.replace(/\u0000/g, "").trim();
  if (cleanedText.length <= MAX_EXTRACTED_CHARS) return cleanedText;
  return `${cleanedText.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Content truncated after ${MAX_EXTRACTED_CHARS.toLocaleString()} characters.]`;
}

function isTextLikeFile(file: File, extension: string): boolean {
  return (
    TEXT_LIKE_EXTENSIONS.has(extension) ||
    TEXT_LIKE_MIME_TYPES.has(file.type) ||
    file.type.startsWith("text/")
  );
}

async function extractPdfText(file: File): Promise<string> {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractDocxText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was uploaded." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} is larger than ${MAX_FILE_SIZE_LABEL}.` },
        { status: 413 },
      );
    }

    const extension = getExtension(file.name);
    const mimeType = file.type || "application/octet-stream";
    let extractedText = "";

    if (isTextLikeFile(file, extension)) {
      extractedText = await file.text();
    } else if (mimeType === "application/pdf" || extension === "pdf") {
      extractedText = await extractPdfText(file);
    } else if (extension === "docx") {
      extractedText = await extractDocxText(file);
    } else if (extension === "doc" || mimeType === "application/msword") {
      return NextResponse.json(
        {
          error:
            "Legacy .doc files are not readable in this browser upload path. Please save the document as PDF or DOCX and attach it again.",
        },
        { status: 415 },
      );
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Attach a PDF, TXT, MD, CSV, DOC, or DOCX file.",
        },
        { status: 415 },
      );
    }

    const readableText = truncateText(extractedText);
    if (!readableText) {
      return NextResponse.json(
        { error: `No readable text was found in ${file.name}.` },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      mimeType,
      sizeBytes: file.size,
      // Backwards-compatible aliases for older callers:
      size: file.size,
      extractedText: readableText,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to extract text from the uploaded file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
