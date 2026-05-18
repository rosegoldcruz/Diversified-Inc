import { NextRequest } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { createNotification } from "@/lib/notifications";
import { ValidationError } from "@/lib/validators";

export const SOP_TEMPLATE_STATUSES = ["draft", "active", "under_review", "archived"] as const;
export const SOP_RUN_STATUSES = [
  "not_started",
  "running",
  "waiting",
  "blocked",
  "completed",
  "failed",
  "canceled",
] as const;
export const SOP_RUN_STEP_STATUSES = [
  "pending",
  "in_progress",
  "waiting",
  "blocked",
  "completed",
  "skipped",
] as const;
export const SOP_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export type SopTemplateStatus = (typeof SOP_TEMPLATE_STATUSES)[number];
export type SopRunStatus = (typeof SOP_RUN_STATUSES)[number];
export type SopRunStepStatus = (typeof SOP_RUN_STEP_STATUSES)[number];
export type SopApprovalStatus = (typeof SOP_APPROVAL_STATUSES)[number];

export type SopRow = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  department: string | null;
  owner: number | null;
  status: string | null;
  version: string | null;
  last_updated: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SopStepRow = {
  id: number;
  sop_id: number;
  step_order: number;
  title: string;
  instructions: string | null;
  required_role: string | null;
  requires_evidence: boolean;
  requires_approval: boolean;
  estimated_minutes: number | null;
  branch_condition: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type SopRunRow = {
  id: string;
  sop_id: number;
  assigned_to: number | null;
  started_by: number;
  current_step_id: number | null;
  status: SopRunStatus;
  state_json: Record<string, unknown>;
  wait_json: Record<string, unknown>;
  blocked_reason: string | null;
  revision: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type SopRunStepRow = {
  id: string;
  sop_run_id: string;
  sop_step_id: number;
  step_order: number;
  status: SopRunStepStatus;
  notes: string | null;
  evidence_url: string | null;
  completed_by: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SopApprovalRow = {
  id: string;
  sop_run_id: string;
  sop_step_id: number;
  requested_by: number;
  approver_id: number | null;
  status: SopApprovalStatus;
  comment: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type SopRunDetail = SopRunRow & {
  sop_title: string;
  assigned_to_name: string | null;
  started_by_name: string | null;
  current_step_title: string | null;
  steps: Array<SopRunStepRow & SopStepRow>;
  approvals: SopApprovalRow[];
};

export async function ensureSopEngineTables() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$
  `);

  await query(`
    ALTER TABLE sops
      ADD COLUMN IF NOT EXISTS department TEXT,
      ADD COLUMN IF NOT EXISTS created_by INTEGER,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await query(`
    UPDATE sops
    SET
      status = COALESCE(NULLIF(status, ''), 'active'),
      version = COALESCE(NULLIF(version, ''), '1.0'),
      last_updated = COALESCE(last_updated, NOW()),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW())
    WHERE status IS NULL
       OR status = ''
       OR version IS NULL
       OR version = ''
       OR last_updated IS NULL
       OR created_at IS NULL
       OR updated_at IS NULL
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sop_steps (
      id SERIAL PRIMARY KEY,
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT,
      required_role TEXT,
      requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
      requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
      estimated_minutes INTEGER,
      branch_condition JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT sop_steps_step_order_positive CHECK (step_order > 0),
      CONSTRAINT sop_steps_estimated_minutes_positive CHECK (estimated_minutes IS NULL OR estimated_minutes > 0)
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_steps_sop_order
      ON sop_steps (sop_id, step_order)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_steps_sop_id
      ON sop_steps (sop_id)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sop_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE RESTRICT,
      assigned_to INTEGER REFERENCES employees(id),
      started_by INTEGER NOT NULL REFERENCES employees(id),
      current_step_id INTEGER REFERENCES sop_steps(id),
      status TEXT NOT NULL DEFAULT 'running',
      state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      wait_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      blocked_reason TEXT,
      revision INTEGER NOT NULL DEFAULT 1,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT sop_runs_revision_positive CHECK (revision > 0)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_runs_status_updated
      ON sop_runs (status, updated_at DESC)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_runs_sop_id
      ON sop_runs (sop_id)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_runs_assigned_to
      ON sop_runs (assigned_to)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sop_run_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sop_run_id UUID NOT NULL REFERENCES sop_runs(id) ON DELETE CASCADE,
      sop_step_id INTEGER NOT NULL REFERENCES sop_steps(id) ON DELETE RESTRICT,
      step_order INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      evidence_url TEXT,
      completed_by INTEGER REFERENCES employees(id),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT sop_run_steps_step_order_positive CHECK (step_order > 0)
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_run_steps_unique_step
      ON sop_run_steps (sop_run_id, sop_step_id)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_run_steps_run_order
      ON sop_run_steps (sop_run_id, step_order)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_run_steps_status
      ON sop_run_steps (status)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sop_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sop_run_id UUID NOT NULL REFERENCES sop_runs(id) ON DELETE CASCADE,
      sop_step_id INTEGER NOT NULL REFERENCES sop_steps(id) ON DELETE RESTRICT,
      requested_by INTEGER NOT NULL REFERENCES employees(id),
      approver_id INTEGER REFERENCES employees(id),
      status TEXT NOT NULL DEFAULT 'pending',
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_approvals_run_status
      ON sop_approvals (sop_run_id, status)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_sop_approvals_status_created
      ON sop_approvals (status, created_at DESC)
  `);

  await createUpdatedAtTrigger("sop_steps", "trg_sop_steps_updated_at");
  await createUpdatedAtTrigger("sop_runs", "trg_sop_runs_updated_at");
  await createUpdatedAtTrigger("sop_run_steps", "trg_sop_run_steps_updated_at");
}

export async function getSopTemplate(sopId: number) {
  await ensureSopEngineTables();
  const rows = await query<SopRow & { owner_name: string | null }>(
    `SELECT s.*, e.name AS owner_name
     FROM sops s
     LEFT JOIN employees e ON s.owner = e.id
     WHERE s.id = $1
     LIMIT 1`,
    [sopId],
  );
  if (!rows[0]) return null;

  const steps = await query<SopStepRow>(
    `SELECT *
     FROM sop_steps
     WHERE sop_id = $1
     ORDER BY step_order ASC`,
    [sopId],
  );

  return { ...rows[0], steps };
}

export async function createSopStep(input: {
  sopId: number;
  title: string;
  instructions?: string | null;
  requiredRole?: string | null;
  requiresEvidence?: boolean;
  requiresApproval?: boolean;
  estimatedMinutes?: number | null;
  branchCondition?: Record<string, unknown> | null;
  stepOrder?: number | null;
  actorUserId: number;
  request?: NextRequest;
}) {
  await ensureSopEngineTables();

  const sop = await getSopTemplate(input.sopId);
  if (!sop) {
    throw new ValidationError("SOP not found");
  }

  const [orderRow] = await query<{ next_order: number }>(
    `SELECT COALESCE(MAX(step_order), 0) + 1 AS next_order
     FROM sop_steps
     WHERE sop_id = $1`,
    [input.sopId],
  );
  const nextOrder = input.stepOrder ?? orderRow?.next_order ?? 1;

  const rows = await query<SopStepRow>(
    `INSERT INTO sop_steps
      (sop_id, step_order, title, instructions, required_role, requires_evidence,
       requires_approval, estimated_minutes, branch_condition)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
     RETURNING *`,
    [
      input.sopId,
      nextOrder,
      input.title,
      input.instructions ?? null,
      input.requiredRole ?? null,
      Boolean(input.requiresEvidence),
      Boolean(input.requiresApproval),
      input.estimatedMinutes ?? null,
      JSON.stringify(input.branchCondition ?? null),
    ],
  );

  await query(`UPDATE sops SET last_updated = NOW(), updated_at = NOW() WHERE id = $1`, [
    input.sopId,
  ]);

  await createAuditLog({
    actorUserId: input.actorUserId,
    action: "sop_step.created",
    module: "sops",
    entityType: "sop_step",
    entityId: rows[0].id,
    afterData: rows[0],
    request: input.request,
  });

  return rows[0];
}

export async function listSopRuns(filters: {
  status?: string | null;
  assignedTo?: number | null;
  limit?: number;
}) {
  await ensureSopEngineTables();

  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`r.status = $${values.length}`);
  }
  if (filters.assignedTo) {
    values.push(filters.assignedTo);
    clauses.push(`r.assigned_to = $${values.length}`);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 250);
  values.push(limit);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  return query(
    `SELECT
       r.*,
       s.title AS sop_title,
       assignee.name AS assigned_to_name,
       starter.name AS started_by_name,
       current_step.title AS current_step_title
     FROM sop_runs r
     JOIN sops s ON s.id = r.sop_id
     LEFT JOIN employees assignee ON assignee.id = r.assigned_to
     LEFT JOIN employees starter ON starter.id = r.started_by
     LEFT JOIN sop_steps current_step ON current_step.id = r.current_step_id
     ${where}
     ORDER BY r.updated_at DESC
     LIMIT $${values.length}`,
    values,
  );
}

export async function getSopRunDetail(runId: string): Promise<SopRunDetail | null> {
  await ensureSopEngineTables();

  const rows = await query<SopRunRow & {
    sop_title: string;
    assigned_to_name: string | null;
    started_by_name: string | null;
    current_step_title: string | null;
  }>(
    `SELECT
       r.*,
       s.title AS sop_title,
       assignee.name AS assigned_to_name,
       starter.name AS started_by_name,
       current_step.title AS current_step_title
     FROM sop_runs r
     JOIN sops s ON s.id = r.sop_id
     LEFT JOIN employees assignee ON assignee.id = r.assigned_to
     LEFT JOIN employees starter ON starter.id = r.started_by
     LEFT JOIN sop_steps current_step ON current_step.id = r.current_step_id
     WHERE r.id = $1
     LIMIT 1`,
    [runId],
  );

  const run = rows[0];
  if (!run) return null;

  const steps = await query<Array<SopRunStepRow & SopStepRow>>(
    `SELECT
       rs.*,
       st.sop_id,
       st.step_order AS template_step_order,
       st.title,
       st.instructions,
       st.required_role,
       st.requires_evidence,
       st.requires_approval,
       st.estimated_minutes,
       st.branch_condition,
       st.created_at AS template_created_at,
       st.updated_at AS template_updated_at
     FROM sop_run_steps rs
     JOIN sop_steps st ON st.id = rs.sop_step_id
     WHERE rs.sop_run_id = $1
     ORDER BY rs.step_order ASC`,
    [runId],
  );

  const approvals = await query<SopApprovalRow>(
    `SELECT *
     FROM sop_approvals
     WHERE sop_run_id = $1
     ORDER BY created_at DESC`,
    [runId],
  );

  return { ...run, steps, approvals };
}

export async function startSopRun(input: {
  sopId: number;
  assignedTo?: number | null;
  startedBy: number;
  stateJson?: Record<string, unknown>;
  request?: NextRequest;
}) {
  await ensureSopEngineTables();

  const result = await withTransaction(async (q) => {
    const [sop] = await q<SopRow>(
      `SELECT * FROM sops WHERE id = $1 LIMIT 1`,
      [input.sopId],
    );
    if (!sop) throw new ValidationError("SOP not found");

    if (input.assignedTo) {
      const employee = await q<{ id: number }>(
        `SELECT id FROM employees WHERE id = $1 LIMIT 1`,
        [input.assignedTo],
      );
      if (employee.length === 0) {
        throw new ValidationError("assigned_to must reference an existing employee");
      }
    }

    const steps = await q<SopStepRow>(
      `SELECT *
       FROM sop_steps
       WHERE sop_id = $1
       ORDER BY step_order ASC`,
      [input.sopId],
    );
    if (steps.length === 0) {
      throw new ValidationError("SOP must have at least one step before it can be started");
    }

    const [run] = await q<SopRunRow>(
      `INSERT INTO sop_runs
        (sop_id, assigned_to, started_by, current_step_id, status, state_json, wait_json)
       VALUES ($1, $2, $3, $4, 'running', $5::jsonb, '{}'::jsonb)
       RETURNING *`,
      [
        input.sopId,
        input.assignedTo ?? null,
        input.startedBy,
        steps[0].id,
        JSON.stringify(input.stateJson ?? {}),
      ],
    );

    for (const step of steps) {
      await q(
        `INSERT INTO sop_run_steps
          (sop_run_id, sop_step_id, step_order, status)
         VALUES ($1, $2, $3, $4)`,
        [
          run.id,
          step.id,
          step.step_order,
          step.id === steps[0].id ? "in_progress" : "pending",
        ],
      );
    }

    return run;
  });

  await createAuditLog({
    actorUserId: input.startedBy,
    action: "sop_run.started",
    module: "sops",
    entityType: "sop_run",
    entityId: result.id,
    afterData: result,
    request: input.request,
  });

  await safeCreateAutomationEvent({
    eventType: "sop_run_started",
    sourceModule: "sops",
    entityType: "sop_run",
    entityId: result.id,
    actorUserId: input.startedBy,
    path: `/sops?run=${result.id}`,
    payload: {
      sop_run_id: result.id,
      sop_id: input.sopId,
      assigned_to: input.assignedTo ?? null,
    },
  });

  if (input.assignedTo && input.assignedTo !== input.startedBy) {
    await createNotification({
      type: "sop_run.assigned",
      title: "SOP assigned",
      body: "A SOP run has been assigned to you.",
      link: `/sops?run=${result.id}`,
      userIds: [input.assignedTo],
      excludeUserId: input.startedBy,
    });
  }

  return getSopRunDetail(result.id);
}

export async function completeSopRunStep(input: {
  runId: string;
  stepId: number;
  actorUserId: number;
  notes?: string | null;
  evidenceUrl?: string | null;
  request?: NextRequest;
}) {
  await ensureSopEngineTables();

  const result = await withTransaction(async (q) => {
    const [run] = await q<SopRunRow>(
      `SELECT * FROM sop_runs WHERE id = $1 LIMIT 1`,
      [input.runId],
    );
    if (!run) throw new ValidationError("SOP run not found");
    if (run.status === "completed" || run.status === "canceled") {
      throw new ValidationError(`SOP run is already ${run.status}`);
    }
    if (run.current_step_id !== input.stepId) {
      throw new ValidationError("Only the current SOP step can be completed");
    }

    const [step] = await q<SopStepRow>(
      `SELECT * FROM sop_steps WHERE id = $1 LIMIT 1`,
      [input.stepId],
    );
    if (!step) throw new ValidationError("SOP step not found");

    const hasEvidence =
      Boolean(input.evidenceUrl && input.evidenceUrl.trim()) ||
      Boolean(input.notes && input.notes.trim());
    if (step.requires_evidence && !hasEvidence) {
      throw new ValidationError("This SOP step requires notes or evidence before completion");
    }

    await q(
      `UPDATE sop_run_steps
       SET notes = $3,
           evidence_url = $4,
           updated_at = NOW()
       WHERE sop_run_id = $1 AND sop_step_id = $2`,
      [input.runId, input.stepId, input.notes ?? null, input.evidenceUrl ?? null],
    );

    if (step.requires_approval) {
      const [approval] = await q<SopApprovalRow>(
        `INSERT INTO sop_approvals
          (sop_run_id, sop_step_id, requested_by, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [input.runId, input.stepId, input.actorUserId],
      );

      await q(
        `UPDATE sop_run_steps
         SET status = 'waiting', updated_at = NOW()
         WHERE sop_run_id = $1 AND sop_step_id = $2`,
        [input.runId, input.stepId],
      );

      await q(
        `UPDATE sop_runs
         SET status = 'waiting',
             wait_json = $2::jsonb,
             revision = revision + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [
          input.runId,
          JSON.stringify({
            type: "approval",
            approval_id: approval.id,
            sop_step_id: input.stepId,
            requested_by: input.actorUserId,
          }),
        ],
      );

      return { status: "waiting_for_approval", approval };
    }

    return advanceRunAfterStep(q, input.runId, input.stepId, input.actorUserId);
  });

  await createAuditLog({
    actorUserId: input.actorUserId,
    action: "sop_run_step.completed",
    module: "sops",
    entityType: "sop_run",
    entityId: input.runId,
    afterData: result,
    request: input.request,
  });

  await safeCreateAutomationEvent({
    eventType: "sop_run_step_completed",
    sourceModule: "sops",
    entityType: "sop_run",
    entityId: input.runId,
    actorUserId: input.actorUserId,
    path: `/sops?run=${input.runId}`,
    payload: {
      sop_run_id: input.runId,
      sop_step_id: input.stepId,
      result,
    },
  });

  return getSopRunDetail(input.runId);
}

export async function blockSopRun(input: {
  runId: string;
  actorUserId: number;
  reason: string;
  waitType?: string | null;
  request?: NextRequest;
}) {
  await ensureSopEngineTables();

  const reason = input.reason.trim();
  if (!reason) throw new ValidationError("blocked reason is required");

  const before = await getSopRunDetail(input.runId);
  if (!before) throw new ValidationError("SOP run not found");

  const rows = await query<SopRunRow>(
    `UPDATE sop_runs
     SET status = 'blocked',
         blocked_reason = $2,
         wait_json = $3::jsonb,
         revision = revision + 1,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      input.runId,
      reason,
      JSON.stringify({
        type: input.waitType ?? "blocked",
        reason,
        blocked_by: input.actorUserId,
        blocked_at: new Date().toISOString(),
      }),
    ],
  );

  await query(
    `UPDATE sop_run_steps
     SET status = 'blocked', updated_at = NOW()
     WHERE sop_run_id = $1
       AND sop_step_id = $2`,
    [input.runId, before.current_step_id],
  );

  await createAuditLog({
    actorUserId: input.actorUserId,
    action: "sop_run.blocked",
    module: "sops",
    entityType: "sop_run",
    entityId: input.runId,
    beforeData: before,
    afterData: rows[0],
    request: input.request,
  });

  await safeCreateAutomationEvent({
    eventType: "sop_run_blocked",
    sourceModule: "sops",
    entityType: "sop_run",
    entityId: input.runId,
    actorUserId: input.actorUserId,
    path: `/sops?run=${input.runId}`,
    payload: {
      sop_run_id: input.runId,
      reason,
      wait_type: input.waitType ?? "blocked",
    },
  });

  return getSopRunDetail(input.runId);
}

export async function resumeSopRun(input: {
  runId: string;
  actorUserId: number;
  request?: NextRequest;
}) {
  await ensureSopEngineTables();

  const before = await getSopRunDetail(input.runId);
  if (!before) throw new ValidationError("SOP run not found");
  if (before.status !== "blocked" && before.status !== "waiting") {
    throw new ValidationError("Only blocked or waiting SOP runs can be resumed");
  }

  const rows = await query<SopRunRow>(
    `UPDATE sop_runs
     SET status = 'running',
         blocked_reason = NULL,
         wait_json = '{}'::jsonb,
         revision = revision + 1,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.runId],
  );

  if (before.current_step_id) {
    await query(
      `UPDATE sop_run_steps
       SET status = 'in_progress', updated_at = NOW()
       WHERE sop_run_id = $1
         AND sop_step_id = $2
         AND status IN ('blocked', 'waiting')`,
      [input.runId, before.current_step_id],
    );
  }

  await createAuditLog({
    actorUserId: input.actorUserId,
    action: "sop_run.resumed",
    module: "sops",
    entityType: "sop_run",
    entityId: input.runId,
    beforeData: before,
    afterData: rows[0],
    request: input.request,
  });

  return getSopRunDetail(input.runId);
}

export async function resolveSopApproval(input: {
  runId: string;
  approvalId: string;
  actorUserId: number;
  decision: "approved" | "rejected";
  comment?: string | null;
  request?: NextRequest;
}) {
  await ensureSopEngineTables();

  const result = await withTransaction(async (q) => {
    const [approval] = await q<SopApprovalRow>(
      `SELECT *
       FROM sop_approvals
       WHERE id = $1 AND sop_run_id = $2
       LIMIT 1`,
      [input.approvalId, input.runId],
    );
    if (!approval) throw new ValidationError("SOP approval not found");
    if (approval.status !== "pending") {
      throw new ValidationError(`SOP approval is already ${approval.status}`);
    }

    const [updatedApproval] = await q<SopApprovalRow>(
      `UPDATE sop_approvals
       SET status = $3,
           approver_id = $4,
           comment = $5,
           resolved_at = NOW()
       WHERE id = $1 AND sop_run_id = $2
       RETURNING *`,
      [
        input.approvalId,
        input.runId,
        input.decision,
        input.actorUserId,
        input.comment ?? null,
      ],
    );

    if (input.decision === "rejected") {
      await q(
        `UPDATE sop_run_steps
         SET status = 'in_progress',
             notes = COALESCE(notes, '') || $3,
             updated_at = NOW()
         WHERE sop_run_id = $1 AND sop_step_id = $2`,
        [
          input.runId,
          approval.sop_step_id,
          input.comment ? `\nApproval rejected: ${input.comment}` : "\nApproval rejected.",
        ],
      );

      await q(
        `UPDATE sop_runs
         SET status = 'running',
             current_step_id = $2,
             wait_json = $3::jsonb,
             revision = revision + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [
          input.runId,
          approval.sop_step_id,
          JSON.stringify({
            type: "approval_rejected",
            approval_id: input.approvalId,
            rejected_by: input.actorUserId,
            comment: input.comment ?? null,
          }),
        ],
      );

      return { approval: updatedApproval, run_result: "approval_rejected" };
    }

    const advanceResult = await advanceRunAfterStep(
      q,
      input.runId,
      approval.sop_step_id,
      input.actorUserId,
    );

    return { approval: updatedApproval, run_result: advanceResult };
  });

  await createAuditLog({
    actorUserId: input.actorUserId,
    action: `sop_approval.${input.decision}`,
    module: "sops",
    entityType: "sop_approval",
    entityId: input.approvalId,
    afterData: result,
    request: input.request,
  });

  await safeCreateAutomationEvent({
    eventType: `sop_approval_${input.decision}`,
    sourceModule: "sops",
    entityType: "sop_run",
    entityId: input.runId,
    actorUserId: input.actorUserId,
    path: `/sops?run=${input.runId}`,
    payload: {
      sop_run_id: input.runId,
      approval_id: input.approvalId,
      decision: input.decision,
      comment: input.comment ?? null,
    },
  });

  return getSopRunDetail(input.runId);
}

async function advanceRunAfterStep(
  q: <R extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<R[]>,
  runId: string,
  stepId: number,
  actorUserId: number,
) {
  const [run] = await q<SopRunRow>(
    `SELECT * FROM sop_runs WHERE id = $1 LIMIT 1`,
    [runId],
  );
  if (!run) throw new ValidationError("SOP run not found");

  const [current] = await q<SopStepRow>(
    `SELECT * FROM sop_steps WHERE id = $1 LIMIT 1`,
    [stepId],
  );
  if (!current) throw new ValidationError("SOP step not found");

  await q(
    `UPDATE sop_run_steps
     SET status = 'completed',
         completed_by = $3,
         completed_at = NOW(),
         updated_at = NOW()
     WHERE sop_run_id = $1 AND sop_step_id = $2`,
    [runId, stepId, actorUserId],
  );

  const [nextStep] = await q<SopStepRow>(
    `SELECT *
     FROM sop_steps
     WHERE sop_id = $1 AND step_order > $2
     ORDER BY step_order ASC
     LIMIT 1`,
    [run.sop_id, current.step_order],
  );

  if (!nextStep) {
    const [completedRun] = await q<SopRunRow>(
      `UPDATE sop_runs
       SET status = 'completed',
           current_step_id = NULL,
           wait_json = '{}'::jsonb,
           blocked_reason = NULL,
           revision = revision + 1,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [runId],
    );

    return { status: "completed", run: completedRun };
  }

  await q(
    `UPDATE sop_run_steps
     SET status = 'in_progress', updated_at = NOW()
     WHERE sop_run_id = $1 AND sop_step_id = $2`,
    [runId, nextStep.id],
  );

  const [updatedRun] = await q<SopRunRow>(
    `UPDATE sop_runs
     SET status = 'running',
         current_step_id = $2,
         wait_json = '{}'::jsonb,
         blocked_reason = NULL,
         revision = revision + 1,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [runId, nextStep.id],
  );

  return { status: "advanced", next_step_id: nextStep.id, run: updatedRun };
}

async function createUpdatedAtTrigger(tableName: string, triggerName: string) {
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = '${triggerName}'
      ) THEN
        CREATE TRIGGER ${triggerName}
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END;
    $$
  `);
}

export function parsePositiveInteger(value: string | number | null | undefined, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer`);
  }
  return parsed;
}

export function parseOptionalPositiveInteger(
  value: unknown,
  label: string,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  return parsePositiveInteger(value as string | number, label);
}

export function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
}

export function parseJsonObject(value: unknown, label: string): Record<string, unknown> | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}
