import { deepseek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { query, withTransaction } from "@/lib/db";
import { HttpError, requireRole } from "@/lib/session";
import { ensureSopEngineTables } from "@/lib/sop-engine";
import {
  ValidationError,
  optionalString,
  requireInteger,
  requireString,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeneratedStep = {
  title: string;
  instructions: string | null;
  required_role: string | null;
  requires_evidence: boolean;
  requires_approval: boolean;
  estimated_minutes: number | null;
};

type GeneratedSop = {
  title: string;
  description: string;
  category: string;
  department: string | null;
  steps: GeneratedStep[];
};

const MODEL_ALIASES: Record<string, "deepseek-v4-flash" | "deepseek-v4-pro"> = {
  "deepseek-v4-flash": "deepseek-v4-flash",
  "deepseek-v4-pro": "deepseek-v4-pro",
  "deepseek-chat": "deepseek-v4-flash",
  "deepseek-reasoner": "deepseek-v4-flash",
};

const DEFAULT_MODEL =
  MODEL_ALIASES[
    process.env.DEEPSEEK_DEFAULT_MODEL ?? process.env.DEEPSEEK_MODEL ?? ""
  ] ?? "deepseek-v4-flash";
const GENERATION_TIMEOUT_MS = 85_000;

export async function POST(request: NextRequest) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "Missing required env var: DEEPSEEK_API_KEY" },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const requestedTitle = requireString(body.title, "title", 250);
    const category = optionalString(body.category, "category", 120) || "General";
    const department = optionalString(body.department, "department", 120);
    const notes = requireString(body.notes, "notes", 8000);
    const audience = optionalString(body.audience, "audience", 250);
    const stepCount =
      body.step_count === undefined ||
      body.step_count === null ||
      body.step_count === ""
        ? 7
        : requireInteger(body.step_count, "step_count", { min: 3, max: 15 });

    const meaningfulNotes = notes.trim();
    if (
      meaningfulNotes.length < 20 &&
      meaningfulNotes.split(/\s+/).filter(Boolean).length < 5
    ) {
      throw new ValidationError("notes must include meaningful process details", {
        notes: "Provide at least 5 words or around 20 characters of process notes.",
      });
    }

    await ensureSopEngineTables();

    let generated: GeneratedSop;
    try {
      generated = normalizeGeneratedSop(
        await generateSopJson({
          title: requestedTitle,
          category,
          department,
          notes: meaningfulNotes,
          audience,
          stepCount,
        }),
        {
          title: requestedTitle,
          category,
          department,
          stepCount,
        },
      );
    } catch (generationError) {
      const details =
        generationError instanceof Error
          ? generationError.message
          : "Unknown provider failure";
      const status =
        details.toLowerCase().includes("timed out") ||
        details.toLowerCase().includes("timeout")
          ? 504
          : 500;
      return NextResponse.json(
        { error: "SOP generation failed", details },
        { status },
      );
    }

    const ownerRows = await query<{ id: number }>(
      `SELECT id FROM employees WHERE id = $1 LIMIT 1`,
      [session.userId],
    );
    const owner = ownerRows[0]?.id ?? null;

    const created = await withTransaction(async (q) => {
      const [sop] = await q(
        `INSERT INTO sops
          (title, description, category, department, owner, status, version, last_updated, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'draft', '1.0', NOW(), $6, NOW(), NOW())
         RETURNING *`,
        [
          generated.title,
          generated.description,
          generated.category,
          generated.department,
          owner,
          session.userId,
        ],
      );

      const steps = [];
      for (const [index, step] of generated.steps.entries()) {
        const [createdStep] = await q(
          `INSERT INTO sop_steps
            (sop_id, step_order, title, instructions, required_role, requires_evidence,
             requires_approval, estimated_minutes, branch_condition)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
           RETURNING *`,
          [
            sop.id,
            index + 1,
            step.title,
            step.instructions,
            step.required_role,
            step.requires_evidence,
            step.requires_approval,
            step.estimated_minutes,
          ],
        );
        steps.push(createdStep);
      }

      return { sop, steps };
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: "sop.generated",
      module: "sops",
      entityType: "sop",
      entityId: created.sop.id,
      afterData: created,
      request,
    });

    await safeCreateAutomationEvent({
      eventType: "sop_generated",
      sourceModule: "sops",
      entityType: "sop",
      entityId: created.sop.id,
      actorUserId: session.userId,
      path: `/sops?sop=${created.sop.id}`,
      payload: {
        sop_id: created.sop.id,
        title: created.sop.title,
        category: created.sop.category,
        step_count: created.steps.length,
      },
    });

    return NextResponse.json({ ...created, generated: true }, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate SOP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateSopJson(input: {
  title: string;
  category: string;
  department: string | null;
  notes: string;
  audience: string | null;
  stepCount: number;
}) {
  const result = await withTimeout(
    generateText({
      model: deepseek(DEFAULT_MODEL),
      temperature: 0.25,
      maxOutputTokens: 2200,
      system: `You generate internal SOPs for Diversified OS, an internal operations platform for a garage door and operations-heavy company.
Return strict JSON only. No markdown, no commentary, no code fences.
Avoid ServiceTitan integration claims and marketing/ad claims unless explicitly requested.
Frame safety-sensitive content as internal procedure and include manager verification when appropriate.
Use evidence/photo/documentation steps when useful and approval steps when escalation or manager signoff is appropriate.`,
      prompt: `Create a practical internal SOP draft.

Required JSON shape:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "department": "string | null",
  "steps": [
    {
      "title": "string",
      "instructions": "string",
      "required_role": "string | null",
      "requires_evidence": boolean,
      "requires_approval": boolean,
      "estimated_minutes": number | null
    }
  ]
}

Title/topic: ${input.title}
Category: ${input.category}
Department: ${input.department || "Not specified"}
Audience/role: ${input.audience || "Not specified"}
Target step count: ${input.stepCount}
Rough notes/process:
${input.notes}`,
    }),
    GENERATION_TIMEOUT_MS,
  );

  return parseStrictJson(result.text);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new Error("AI provider timed out while generating SOP. Please retry."),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function parseStrictJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON");
  }
}

function normalizeGeneratedSop(
  value: unknown,
  fallback: {
    title: string;
    category: string;
    department: string | null;
    stepCount: number;
  },
): GeneratedSop {
  if (!value || typeof value !== "object") {
    throw new Error("AI response was not a JSON object");
  }
  const data = value as Record<string, unknown>;
  const stepsInput = Array.isArray(data.steps) ? data.steps : [];
  if (stepsInput.length === 0) {
    throw new Error("AI response did not include SOP steps");
  }

  const steps = stepsInput.slice(0, 15).map((raw, index) => {
    const step =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const title =
      typeof step.title === "string" && step.title.trim()
        ? step.title.trim().slice(0, 250)
        : `Step ${index + 1}`;
    const instructions =
      typeof step.instructions === "string"
        ? step.instructions.trim().slice(0, 8000)
        : null;
    const requiredRole =
      typeof step.required_role === "string" && step.required_role.trim()
        ? step.required_role.trim().slice(0, 80)
        : null;
    const estimated =
      typeof step.estimated_minutes === "number" &&
      Number.isFinite(step.estimated_minutes) &&
      step.estimated_minutes > 0
        ? Math.round(step.estimated_minutes)
        : null;
    return {
      title,
      instructions,
      required_role: requiredRole,
      requires_evidence: Boolean(step.requires_evidence),
      requires_approval: Boolean(step.requires_approval),
      estimated_minutes: estimated,
    };
  });

  return {
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim().slice(0, 250)
        : fallback.title,
    description:
      typeof data.description === "string" && data.description.trim()
        ? data.description.trim().slice(0, 5000)
        : `AI-generated SOP draft for ${fallback.title}.`,
    category:
      typeof data.category === "string" && data.category.trim()
        ? data.category.trim().slice(0, 120)
        : fallback.category,
    department:
      typeof data.department === "string" && data.department.trim()
        ? data.department.trim().slice(0, 120)
        : fallback.department,
    steps,
  };
}
