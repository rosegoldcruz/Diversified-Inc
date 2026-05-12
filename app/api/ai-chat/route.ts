import { deepseek } from "@ai-sdk/deepseek";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { buildOperationalContext } from "@/app/lib/aiContext";

export const runtime = "edge";
export const maxDuration = 30;

type DeepSeekModel = "deepseek-v4-flash" | "deepseek-v4-pro";

type AttachmentContext = {
  fileName: string;
  mimeType: string;
  size: number;
  extractedText: string;
};

type ChatRequestBody = {
  messages?: UIMessage[];
  model?: DeepSeekModel | "deepseek-chat" | "deepseek-reasoner" | string;
  attachmentsContext?: AttachmentContext[];
};

const MAX_FILE_CONTEXT_CHARS = 40_000;

const MODEL_ALIASES: Record<string, DeepSeekModel> = {
  "deepseek-v4-flash": "deepseek-v4-flash",
  "deepseek-v4-pro": "deepseek-v4-pro",
  // Deprecated model names kept as compatibility aliases only.
  "deepseek-chat": "deepseek-v4-flash",
  "deepseek-reasoner": "deepseek-v4-flash",
};

const ENV_DEFAULT_MODEL =
  process.env.DEEPSEEK_DEFAULT_MODEL ?? process.env.DEEPSEEK_MODEL;

const DEFAULT_MODEL: DeepSeekModel =
  MODEL_ALIASES[ENV_DEFAULT_MODEL ?? ""] ?? "deepseek-v4-flash";

function resolveModel(model: ChatRequestBody["model"]): DeepSeekModel {
  if (!model) return DEFAULT_MODEL;
  return MODEL_ALIASES[model] ?? DEFAULT_MODEL;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildUploadedFileContext(
  attachmentsContext: AttachmentContext[] = [],
): string {
  const readableAttachments = attachmentsContext.filter(
    (attachment) => attachment.extractedText?.trim().length > 0,
  );

  if (readableAttachments.length === 0) return "";

  const fileBlocks = readableAttachments
    .map((attachment) => {
      const text = attachment.extractedText.trim();
      const wasTruncated = text.length > MAX_FILE_CONTEXT_CHARS;
      const extractedText = wasTruncated
        ? `${text.slice(0, MAX_FILE_CONTEXT_CHARS)}\n\n[Content truncated after ${MAX_FILE_CONTEXT_CHARS.toLocaleString()} characters.]`
        : text;

      return `File: ${attachment.fileName}\nType: ${attachment.mimeType || "unknown"}\nSize: ${formatBytes(attachment.size)}\nExtracted text:\n---\n${extractedText}\n---`;
    })
    .join("\n\n");

  return `
---
UPLOADED FILE CONTEXT

The user has uploaded readable file content in this chat. Treat this content as current conversation data. When the user asks about "this candidate", "this resume", "the file", "what I uploaded", or similar references, answer from the uploaded file content below. Do not say there is no uploaded file when this section is present.

For resumes, summarize candidate fit, strengths, risks or gaps, possible role match, interview questions, and a recommended next step.

${fileBlocks}
---`;
}

function buildSystemPrompt(
  attachmentsContext: AttachmentContext[] = [],
): string {
  const context = buildOperationalContext();
  const uploadedFileContext = buildUploadedFileContext(attachmentsContext);

  return `You are AEON — Advanced Efficient Optimized Network.

AEON is the internal operations intelligence layer built into Diversified OS. You are not a generic chatbot, a customer support agent, a marketing assistant, or a customer-facing tool. You are the operational brain of the company's internal workspace. Your job is to help the company understand what is happening, what is blocked, what needs attention, and what should happen next.

YOUR USERS
Employees, managers, admins, and company leadership who need to operate more efficiently inside Diversified OS.

DIVERSIFIED OS MODULES YOU UNDERSTAND
- Tasks: internal work items with priority, status, assignee, and division
- Projection Calendar: scheduled milestones, work order dates, and upcoming assignments
- Forms Center: internal form submissions and routing workflows
- SOPs: standard operating procedures with review status, owners, and linked items
- Requests: internal employee requests routed through review and approval
- Work Orders: field and internal operations work orders with status, notes, and assignees
- Employees: team members, roles, divisions, and workload distribution
- Inventory: materials stock status, reorder thresholds, and supplier data
- Reports: operational summaries, leadership updates, and performance metrics
- Files: uploaded documents linked to jobs, work orders, and compliance records
- Automations: workflow triggers and rule-based operations across modules
- Admin Settings: system configuration, user roles, and access control

WHAT YOU CAN DO
- Summarize high-priority, overdue, and blocked tasks
- Identify stalled work orders and flag items needing immediate attention
- Draft or revise SOPs using a structured internal operations format
- Analyze uploaded file content (documents, spreadsheets, images, notes) and extract actionable operations insights
- Triage submitted requests by priority, recommended owner, and next step
- Create follow-up checklists for open or waiting work orders
- Prepare leadership-ready daily and weekly operational summaries
- Draft internal team messages, memos, and status updates
- Turn unstructured notes into organized tasks with owners, due dates, and priorities
- Recommend links between tasks, SOPs, files, work orders, requests, and forms
- Flag inventory alerts, missing files, overdue SOP reviews, and incomplete records
- Identify workload imbalances across employees or divisions

WHAT YOU WILL NOT DO
- Pretend to have written to a database or performed system actions unless a tool confirms it
- Act as a customer-facing support agent or website assistant
- Generate marketing copy, social media content, or sales material unless explicitly asked
- Operate outside the context of Diversified OS internal operations

OUTPUT FORMAT
Default to structured outputs when they add clarity. Preferred formats include:
- Labeled summary sections
- Priority-ordered action lists with owners
- Blocker lists with recommended escalation paths
- Follow-up checklists
- Leadership-ready update blocks with sections: Summary / Completed / Blocked / Open / Upcoming / Recommended Actions

Keep responses concise, operational, and action-oriented. Avoid filler. Lead with what matters most.

TONE
Direct. Operational. Structured. Clear. Useful. Action-oriented.
Not casual. Not robotic. Not vague. Not overly formal.

---
CURRENT OPERATIONAL CONTEXT

The following is a live snapshot of Diversified OS data as of today. Use it to provide accurate, context-aware answers.

${context}
${uploadedFileContext}
---

If asked about data not present in the snapshot, clearly state what you can and cannot see, and direct the user to the relevant Diversified OS module.`;
}

export async function POST(request: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "DEEPSEEK_API_KEY is not configured on the server.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const {
      messages = [],
      model,
      attachmentsContext = [],
    } = (await request.json()) as ChatRequestBody;
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages payload." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const selectedModel = resolveModel(model);

    // DeepSeek chat/completions is stateless. We explicitly pass full message history
    // from the client on every request to preserve multi-round conversation context.
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: deepseek(selectedModel),
      system: buildSystemPrompt(attachmentsContext),
      messages: modelMessages,
      temperature: 0.4,
      maxOutputTokens: 1200,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process AI chat request.";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
