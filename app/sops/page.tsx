"use client";

import { useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type Role = "Employee" | "Manager" | "Admin" | "Leadership";
type Sop = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  owner_name: string | null;
  status: string | null;
  version: string | number | null;
  last_updated: string | null;
};
type SopStep = {
  id: number;
  sop_id: number;
  step_order: number;
  title: string;
  instructions: string | null;
  required_role: string | null;
  requires_evidence: boolean;
  requires_approval: boolean;
  estimated_minutes: number | null;
};
type SopDetail = Sop & {
  owner?: number | null;
  department?: string | null;
  steps: SopStep[];
};
type SopRunStep = {
  id: string;
  sop_step_id: number;
  step_order: number;
  status: string;
  notes: string | null;
  evidence_url: string | null;
  title: string;
  instructions: string | null;
  requires_evidence: boolean;
  requires_approval: boolean;
  estimated_minutes: number | null;
};
type SopApproval = {
  id: string;
  sop_step_id: number;
  status: string;
  comment: string | null;
};
type SopRun = {
  id: string;
  sop_id: number;
  assigned_to: number | null;
  status: string;
  current_step_id: number | null;
  current_step_title: string | null;
  blocked_reason: string | null;
  steps: SopRunStep[];
  approvals: SopApproval[];
};
type SessionUser = { id: number; role: Role };
type Owner = { id: number; name: string };

const FIELD_CLASS =
  "w-full rounded-lg border border-borderSubtle bg-white px-3 py-2 text-sm text-textPrimary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 dark:bg-bgDark/80";
const MANAGER_ROLES: Role[] = ["Manager", "Admin", "Leadership"];

export default function SopsPage() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedSopId, setSelectedSopId] = useState<number | null>(null);
  const [selectedSop, setSelectedSop] = useState<SopDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [run, setRun] = useState<SopRun | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [stepTitle, setStepTitle] = useState("");
  const [stepInstructions, setStepInstructions] = useState("");
  const [stepRequiresEvidence, setStepRequiresEvidence] = useState(false);
  const [stepRequiresApproval, setStepRequiresApproval] = useState(false);
  const [stepEstimatedMinutes, setStepEstimatedMinutes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionEvidenceUrl, setCompletionEvidenceUrl] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Office Procedures");
  const [status, setStatus] = useState("active");
  const [version, setVersion] = useState("1.0");
  const [owner, setOwner] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generateElapsedMs, setGenerateElapsedMs] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedDraftNotice, setGeneratedDraftNotice] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genCategory, setGenCategory] = useState("Office Procedures");
  const [genDepartment, setGenDepartment] = useState("Operations");
  const [genAudience, setGenAudience] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [genStepCount, setGenStepCount] = useState("7");

  const filteredSops = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sops;
    return sops.filter(
      (sop) =>
        sop.title.toLowerCase().includes(query) ||
        (sop.description || "").toLowerCase().includes(query),
    );
  }, [search, sops]);

  const canManage = me ? MANAGER_ROLES.includes(me.role) : false;
  const currentStep = run?.steps.find(
    (step) => step.sop_step_id === run.current_step_id,
  );
  const pendingApprovals =
    run?.approvals.filter((approval) => approval.status === "pending") ?? [];
  const parsedStepCount = Number(genStepCount);
  const stepCountValid =
    Number.isInteger(parsedStepCount) &&
    parsedStepCount >= 3 &&
    parsedStepCount <= 15;
  const generateSubmitLabel = !generateBusy
    ? "Generate SOP"
    : generateElapsedMs >= 45_000
      ? "Almost done or still waiting on provider response..."
      : generateElapsedMs >= 15_000
        ? "Still generating - AI can take up to a minute..."
        : "Generating SOP...";

  useEffect(() => {
    let cancelled = false;
    async function loadSops() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/sops", { cache: "no-store" });
        const [meResponse, employeesResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);
        if (!response.ok)
          throw new Error(`Failed to load SOPs (${response.status})`);
        const data = (await response.json()) as Sop[];
        if (cancelled) return;
        setSops(data);
        if (meResponse.ok)
          setMe(
            ((await meResponse.json()) as { user: SessionUser | null }).user,
          );
        if (employeesResponse.ok)
          setOwners((await employeesResponse.json()) as Owner[]);
      } catch (loadError) {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load SOPs",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadSops();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!generateBusy) {
      setGenerateElapsedMs(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setGenerateElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [generateBusy]);

  async function openSop(sopId: number, draftNotice = false) {
    setSelectedSopId(sopId);
    setRun(null);
    setActionError(null);
    setActionMessage(null);
    setGeneratedDraftNotice(draftNotice);
    await loadSopDetail(sopId);
  }

  async function loadSopDetail(sopId: number) {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const response = await fetch(`/api/sops/${sopId}`, { cache: "no-store" });
      const payload = await readResponse<SopDetail>(
        response,
        "Failed to load SOP",
      );
      setSelectedSop(payload);
    } catch (detailLoadError) {
      setDetailError(
        detailLoadError instanceof Error
          ? detailLoadError.message
          : "Failed to load SOP",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function createSop() {
    try {
      setCreateBusy(true);
      setCreateError(null);
      const response = await fetch("/api/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          status,
          version,
          owner: owner || null,
        }),
      });
      const payload = await readResponse<Sop>(response, "Failed to create SOP");
      setSops((previous) => [payload, ...previous]);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setCategory("Office Procedures");
      setStatus("active");
      setVersion("1.0");
      setOwner("");
    } catch (createErr) {
      setCreateError(
        createErr instanceof Error ? createErr.message : "Create failed",
      );
    } finally {
      setCreateBusy(false);
    }
  }

  async function generateSop() {
    const stepCount = Number(genStepCount);
    if (!Number.isInteger(stepCount) || stepCount < 3 || stepCount > 15) {
      setGenerateError("Number of steps must be an integer between 3 and 15.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

    try {
      setGenerateBusy(true);
      setGenerateError(null);
      const response = await fetch("/api/sops/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: genTitle,
          category: genCategory,
          department: genDepartment,
          audience: genAudience,
          notes: genNotes,
          step_count: stepCount,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            sop: Sop;
            steps: SopStep[];
            generated: true;
            error?: string;
            details?: string;
          }
        | null;

      if (!response.ok) {
        const details =
          payload && typeof payload.details === "string" ? payload.details : "";
        const errorMessage =
          payload && typeof payload.error === "string"
            ? payload.error
            : `Failed to generate SOP (${response.status})`;
        throw new Error(details ? `${errorMessage}: ${details}` : errorMessage);
      }

      const successPayload = payload as {
        sop: Sop;
        steps: SopStep[];
        generated: true;
      };

      setSops((previous) => [
        successPayload.sop,
        ...previous.filter((sop) => sop.id !== successPayload.sop.id),
      ]);

      await openSop(successPayload.sop.id, true);
      setActionMessage(
        `Generated SOP draft saved with ${successPayload.steps.length} steps.`,
      );
      setGenerateOpen(false);
      setGenTitle("");
      setGenCategory("Office Procedures");
      setGenDepartment("Operations");
      setGenAudience("");
      setGenNotes("");
      setGenStepCount("7");
    } catch (generateErr) {
      if (generateErr instanceof DOMException && generateErr.name === "AbortError") {
        setGenerateError(
          "SOP generation timed out. The AI provider took too long. Try again with shorter notes or fewer steps.",
        );
      } else {
        setGenerateError(
          generateErr instanceof Error ? generateErr.message : "Generate failed",
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setGenerateBusy(false);
    }
  }

  function closeGenerateModal() {
    if (generateBusy) return;
    setGenerateOpen(false);
  }

  function renderGeneratorField(props: {
    label: string;
    helper: string;
    children: React.ReactNode;
  }) {
    return (
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-textPrimary">{props.label}</span>
        {props.children}
        <span className="text-xs leading-5 text-textMuted">{props.helper}</span>
      </label>
    );
  }

  async function addStep() {
    if (!selectedSopId) return;
    try {
      setBusyAction("add-step");
      setActionError(null);
      setActionMessage(null);
      const estimatedMinutes = stepEstimatedMinutes.trim()
        ? Number(stepEstimatedMinutes)
        : null;
      const response = await fetch(`/api/sops/${selectedSopId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stepTitle,
          instructions: stepInstructions,
          requires_evidence: stepRequiresEvidence,
          requires_approval: stepRequiresApproval,
          estimated_minutes: estimatedMinutes,
        }),
      });
      await readResponse<SopStep>(response, "Failed to add SOP step");
      await loadSopDetail(selectedSopId);
      setStepTitle("");
      setStepInstructions("");
      setStepRequiresEvidence(false);
      setStepRequiresApproval(false);
      setStepEstimatedMinutes("");
      setActionMessage("Step added.");
    } catch (stepError) {
      setActionError(
        stepError instanceof Error ? stepError.message : "Failed to add step",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function startRun() {
    if (!selectedSopId) return;
    try {
      setBusyAction("start-run");
      setActionError(null);
      setActionMessage(null);
      const response = await fetch("/api/sop-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sop_id: selectedSopId, assigned_to: me?.id }),
      });
      const payload = await readResponse<SopRun>(
        response,
        "Failed to start SOP run",
      );
      setRun(payload);
      setCompletionNotes("");
      setCompletionEvidenceUrl("");
      setBlockReason("");
      setActionMessage("SOP run started.");
    } catch (runError) {
      setActionError(
        runError instanceof Error ? runError.message : "Failed to start run",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function completeCurrentStep() {
    if (!run || !currentStep) return;
    if (
      currentStep.requires_evidence &&
      !completionNotes.trim() &&
      !completionEvidenceUrl.trim()
    ) {
      setActionError("This step requires notes or an evidence URL.");
      return;
    }
    try {
      setBusyAction("complete-step");
      setActionError(null);
      setActionMessage(null);
      const response = await fetch(
        `/api/sop-runs/${run.id}/steps/${currentStep.sop_step_id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: completionNotes,
            evidence_url: completionEvidenceUrl,
          }),
        },
      );
      const payload = await readResponse<SopRun>(
        response,
        "Failed to complete SOP step",
      );
      setRun(payload);
      setCompletionNotes("");
      setCompletionEvidenceUrl("");
      setActionMessage("Current step completed.");
    } catch (completeError) {
      setActionError(
        completeError instanceof Error
          ? completeError.message
          : "Failed to complete step",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function updateRun(action: "block" | "resume") {
    if (!run) return;
    if (action === "block" && !blockReason.trim()) {
      setActionError("Block reason is required.");
      return;
    }
    try {
      setBusyAction(action === "block" ? "block-run" : "resume-run");
      setActionError(null);
      setActionMessage(null);
      const response = await fetch(`/api/sop-runs/${run.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "block"
            ? { action: "block", reason: blockReason, wait_type: "blocked" }
            : { action: "resume" },
        ),
      });
      const payload = await readResponse<SopRun>(
        response,
        `Failed to ${action} SOP run`,
      );
      setRun(payload);
      setBlockReason("");
      setActionMessage(action === "block" ? "Run blocked." : "Run resumed.");
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : `Failed to ${action} run`,
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function resolveApproval(
    approvalId: string,
    decision: "approved" | "rejected",
  ) {
    if (!run) return;
    try {
      setBusyAction(`${decision}-${approvalId}`);
      setActionError(null);
      setActionMessage(null);
      const response = await fetch(
        `/api/sop-runs/${run.id}/approvals/${approvalId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, comment: approvalComment }),
        },
      );
      const payload = await readResponse<SopRun>(
        response,
        `Failed to ${decision} approval`,
      );
      setRun(payload);
      setApprovalComment("");
      setActionMessage(
        decision === "approved" ? "Approval accepted." : "Approval rejected.",
      );
    } catch (approvalError) {
      setActionError(
        approvalError instanceof Error
          ? approvalError.message
          : "Failed to resolve approval",
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
              <ShinyText>SOPs</ShinyText>
            </h1>
            <span className="inline-flex rounded-xl border border-white/30 bg-white/55 px-3 py-1 text-xs font-medium text-textMuted shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              {filteredSops.length} of {sops.length} SOPs
            </span>
          </div>
          <p className="max-w-3xl text-base text-textSecondary">
            Create, manage, and run standard operating procedures with step
            tracking, blockers, approvals, and ownership.
          </p>
        </div>
        {canManage ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setGenerateOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent shadow-glass transition hover:bg-accent/15"
            >
              Generate SOP with AI
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/30 bg-white/55 px-4 text-sm font-semibold text-textPrimary shadow-glass backdrop-blur-2xl transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5"
            >
              + New SOP
            </button>
          </div>
        ) : null}
      </FadeContent>

      <FadeContent
        blur={true}
        duration={800}
        delay={90}
        className="glass-surface p-5"
      >
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SOPs..."
            className="h-10 w-full rounded-xl border border-white/30 bg-white/55 px-3 pr-10 text-sm text-textPrimary outline-none backdrop-blur-xl transition-colors placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
          />
          {search.trim() ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear SOP search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-base leading-none text-textMuted transition-colors hover:bg-borderSubtle hover:text-textPrimary"
            >
              x
            </button>
          ) : null}
        </div>
      </FadeContent>
      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading SOPs..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={120}
          className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
        >
          {filteredSops.map((sop) => (
            <SopCard
              key={sop.id}
              sop={sop}
              onOpen={() => void openSop(sop.id)}
            />
          ))}
          {filteredSops.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-white/30 bg-white/45 p-8 text-center text-sm text-textSecondary shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 lg:col-span-2 xl:col-span-3">
              No SOPs match this search.
            </article>
          ) : null}
        </FadeContent>
      )}

      {selectedSopId ? (
        <SopDetailModal
          onClose={() => {
            setSelectedSopId(null);
            setSelectedSop(null);
            setRun(null);
          }}
        >
          {detailLoading ? (
            <LoadingPanel label="Loading SOP details..." />
          ) : null}
          {detailError ? <ErrorPanel message={detailError} /> : null}
          {selectedSop ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-borderSubtle pb-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={selectedSop.category} />
                    <StatusBadge status={selectedSop.status || "archived"} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-textPrimary">
                      {selectedSop.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-textSecondary">
                      {selectedSop.description ||
                        "No SOP description provided."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSopId(null)}
                  className="min-h-10 rounded-lg border border-borderSubtle bg-surface px-4 text-sm font-semibold text-textPrimary transition hover:bg-bgDark/40"
                >
                  Close
                </button>
              </div>
              {generatedDraftNotice ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-medium text-amber-800 dark:text-amber-200">
                  AI-generated draft. Review and adjust before team use.
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailStat
                  label="Owner"
                  value={selectedSop.owner_name || "Unassigned"}
                />
                <DetailStat
                  label="Version"
                  value={formatVersion(selectedSop.version)}
                />
                <DetailStat
                  label="Category"
                  value={selectedSop.category || "General"}
                />
                <DetailStat
                  label="Last Updated"
                  value={formatDate(selectedSop.last_updated)}
                />
              </div>
              <section className="rounded-xl border border-borderSubtle bg-surface/80 p-4 shadow-soft dark:bg-bgDark/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-textPrimary">
                      SOP Steps
                    </h3>
                    <p className="text-sm text-textSecondary">
                      {selectedSop.steps.length} workflow step
                      {selectedSop.steps.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void startRun()}
                    disabled={
                      selectedSop.steps.length === 0 ||
                      busyAction === "start-run"
                    }
                    className="min-h-10 w-full rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {busyAction === "start-run"
                      ? "Starting..."
                      : "Start SOP Run"}
                  </button>
                </div>
                {selectedSop.steps.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-dashed border-borderSubtle bg-bgDark/30 p-4 text-sm text-textSecondary">
                    No steps yet. Add the first step to turn this SOP into a
                    runnable workflow.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedSop.steps.map((step) => (
                      <StepTemplateCard key={step.id} step={step} />
                    ))}
                  </div>
                )}
              </section>
              {canManage ? (
                <section className="rounded-xl border border-borderSubtle bg-surface/80 p-4 shadow-soft dark:bg-bgDark/40">
                  <h3 className="text-base font-semibold text-textPrimary">
                    Add SOP Step
                  </h3>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={stepTitle}
                      onChange={(event) => setStepTitle(event.target.value)}
                      placeholder="Step title"
                      className={FIELD_CLASS}
                    />
                    <textarea
                      rows={4}
                      value={stepInstructions}
                      onChange={(event) =>
                        setStepInstructions(event.target.value)
                      }
                      placeholder="Instructions"
                      className={FIELD_CLASS}
                    />
                    <input
                      value={stepEstimatedMinutes}
                      onChange={(event) =>
                        setStepEstimatedMinutes(event.target.value)
                      }
                      inputMode="numeric"
                      placeholder="Estimated minutes (optional)"
                      className={FIELD_CLASS}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <CheckboxField
                        checked={stepRequiresEvidence}
                        onChange={setStepRequiresEvidence}
                        label="Requires Evidence"
                      />
                      <CheckboxField
                        checked={stepRequiresApproval}
                        onChange={setStepRequiresApproval}
                        label="Requires Approval"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void addStep()}
                      disabled={!stepTitle.trim() || busyAction === "add-step"}
                      className="min-h-10 w-full rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-self-start"
                    >
                      {busyAction === "add-step" ? "Adding..." : "Add Step"}
                    </button>
                  </div>
                </section>
              ) : null}
              {run ? (
                <RunPanel
                  run={run}
                  currentStep={currentStep}
                  pendingApprovals={pendingApprovals}
                  canManage={canManage}
                  busyAction={busyAction}
                  completionNotes={completionNotes}
                  setCompletionNotes={setCompletionNotes}
                  completionEvidenceUrl={completionEvidenceUrl}
                  setCompletionEvidenceUrl={setCompletionEvidenceUrl}
                  blockReason={blockReason}
                  setBlockReason={setBlockReason}
                  approvalComment={approvalComment}
                  setApprovalComment={setApprovalComment}
                  completeCurrentStep={completeCurrentStep}
                  updateRun={updateRun}
                  resolveApproval={resolveApproval}
                />
              ) : null}
              {actionError ? <ErrorPanel message={actionError} /> : null}
              {actionMessage ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  {actionMessage}
                </div>
              ) : null}
            </div>
          ) : null}
        </SopDetailModal>
      ) : null}

      {createOpen ? (
        <StandardModal title="New SOP" onClose={() => setCreateOpen(false)}>
          <div className="grid gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="SOP title"
              className={FIELD_CLASS}
            />
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Category"
              className={FIELD_CLASS}
            />
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className={FIELD_CLASS}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={FIELD_CLASS}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="under_review">Under Review</option>
                <option value="archived">Archived</option>
              </select>
              <input
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="Version"
                className={FIELD_CLASS}
              />
            </div>
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Unassigned owner</option>
              {owners.map((candidate) => (
                <option key={candidate.id} value={String(candidate.id)}>
                  {candidate.name}
                </option>
              ))}
            </select>
            {createError ? <ErrorPanel message={createError} /> : null}
            <ModalActions
              onCancel={() => setCreateOpen(false)}
              onSubmit={() => void createSop()}
              submitLabel={createBusy ? "Creating..." : "Create SOP"}
              disabled={createBusy}
            />
          </div>
        </StandardModal>
      ) : null}
      {generateOpen ? (
        <StandardModal
          title="Generate SOP with AI"
          onClose={closeGenerateModal}
        >
          <div className="grid max-h-[72vh] gap-4 overflow-y-auto pr-1 sm:max-h-[74vh]">
            {renderGeneratorField({
              label: "SOP title",
              helper: "Name the process this SOP should cover.",
              children: (
                <input
                  value={genTitle}
                  onChange={(event) => setGenTitle(event.target.value)}
                  placeholder="Example: Garage Door Warranty Call Intake"
                  className={FIELD_CLASS}
                />
              ),
            })}

            {renderGeneratorField({
              label: "Category",
              helper:
                "Group this SOP under the area where the team would look for it.",
              children: (
                <input
                  value={genCategory}
                  onChange={(event) => setGenCategory(event.target.value)}
                  placeholder="Example: Customer Follow-Up, Safety, Inventory, Work Orders"
                  className={FIELD_CLASS}
                />
              ),
            })}

            {renderGeneratorField({
              label: "Department",
              helper: "Which team or department owns this process?",
              children: (
                <input
                  value={genDepartment}
                  onChange={(event) => setGenDepartment(event.target.value)}
                  placeholder="Example: Operations, Office, Service, Install, Admin"
                  className={FIELD_CLASS}
                />
              ),
            })}

            {renderGeneratorField({
              label: "Audience or role",
              helper: "Who is supposed to follow this SOP?",
              children: (
                <input
                  value={genAudience}
                  onChange={(event) => setGenAudience(event.target.value)}
                  placeholder="Example: Office Admin, Technician, Manager, Dispatcher"
                  className={FIELD_CLASS}
                />
              ),
            })}

            {renderGeneratorField({
              label: "Process notes",
              helper:
                "Paste rough notes, bullets, or messy instructions. The AI will turn them into steps.",
              children: (
                <textarea
                  rows={7}
                  value={genNotes}
                  onChange={(event) => setGenNotes(event.target.value)}
                  placeholder={"Example:\nWhen a warranty call comes in, confirm customer name, job address, original work order, issue description, photos, urgency, and who should follow up."}
                  className={`${FIELD_CLASS} resize-y`}
                />
              ),
            })}

            {renderGeneratorField({
              label: "Number of steps",
              helper:
                "This controls how many draft steps the AI should create. Use 5 for simple processes, 7 for normal workflows, 10+ for detailed procedures.",
              children: (
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={genStepCount}
                  onChange={(event) => setGenStepCount(event.target.value)}
                  inputMode="numeric"
                  placeholder="Example: 5, 7, or 10"
                  className={FIELD_CLASS}
                />
              ),
            })}

            {!stepCountValid && genStepCount.trim() ? (
              <ErrorPanel message="Number of steps must be an integer between 3 and 15." />
            ) : null}

            {generateError ? <ErrorPanel message={generateError} /> : null}
            <ModalActions
              onCancel={closeGenerateModal}
              onSubmit={() => void generateSop()}
              submitLabel={generateSubmitLabel}
              helperText={
                generateBusy
                  ? "This creates a real SOP and steps in the database. Do not close this panel while it is running."
                  : undefined
              }
              disabled={
                generateBusy ||
                !genTitle.trim() ||
                !genNotes.trim() ||
                !stepCountValid
              }
            />
          </div>
        </StandardModal>
      ) : null}
    </div>
  );
}

async function readResponse<T>(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;
  if (!response.ok)
    throw new Error(
      (payload as { error?: string } | null)?.error ||
        `${fallback} (${response.status})`,
    );
  return payload as T;
}
function SopCard({ sop, onOpen }: { sop: Sop; onOpen: () => void }) {
  return (
    <article className="glass-surface glass-surface-hover p-6">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full rounded-lg text-left focus:outline-none focus:ring-4 focus:ring-accent/20"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CategoryBadge category={sop.category} />
            <h2 className="mt-2 text-xl font-bold text-textPrimary">
              {sop.title}
            </h2>
          </div>
          <StatusBadge status={sop.status || "archived"} />
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-textSecondary">
          {sop.description || "No SOP description provided."}
        </p>
      </button>
      <dl className="mt-5 space-y-3 text-sm">
        <InfoRow label="Owner" value={sop.owner_name || "Unassigned"} />
        <InfoRow label="Version" value={formatVersion(sop.version)} />
        <InfoRow label="Last Updated" value={formatDate(sop.last_updated)} />
      </dl>
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent transition hover:bg-accent/15"
      >
        Manage SOP
      </button>
    </article>
  );
}
function RunPanel(props: {
  run: SopRun;
  currentStep?: SopRunStep;
  pendingApprovals: SopApproval[];
  canManage: boolean;
  busyAction: string | null;
  completionNotes: string;
  setCompletionNotes: (value: string) => void;
  completionEvidenceUrl: string;
  setCompletionEvidenceUrl: (value: string) => void;
  blockReason: string;
  setBlockReason: (value: string) => void;
  approvalComment: string;
  setApprovalComment: (value: string) => void;
  completeCurrentStep: () => Promise<void>;
  updateRun: (action: "block" | "resume") => Promise<void>;
  resolveApproval: (
    approvalId: string,
    decision: "approved" | "rejected",
  ) => Promise<void>;
}) {
  const { run, currentStep, pendingApprovals, canManage, busyAction } = props;
  return (
    <section className="rounded-xl border border-borderSubtle bg-surface/80 p-4 shadow-soft dark:bg-bgDark/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-textPrimary">
            Active SOP Run
          </h3>
          <p className="mt-1 text-sm text-textSecondary">
            Current step: {run.current_step_title || "None"}
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>
      {run.blocked_reason ? (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {run.blocked_reason}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {run.steps.map((step) => (
          <RunStepCard
            key={step.id}
            step={step}
            isCurrent={step.sop_step_id === run.current_step_id}
          />
        ))}
      </div>
      {currentStep && run.status !== "completed" ? (
        <div className="mt-5 rounded-lg border border-borderSubtle bg-bgDark/30 p-4">
          <h4 className="font-semibold text-textPrimary">
            Complete Current Step
          </h4>
          <div className="mt-3 grid gap-3">
            <textarea
              rows={4}
              value={props.completionNotes}
              onChange={(event) => props.setCompletionNotes(event.target.value)}
              placeholder="Completion notes"
              className={FIELD_CLASS}
            />
            <input
              value={props.completionEvidenceUrl}
              onChange={(event) =>
                props.setCompletionEvidenceUrl(event.target.value)
              }
              placeholder="Evidence URL (optional)"
              className={FIELD_CLASS}
            />
            <button
              type="button"
              onClick={() => void props.completeCurrentStep()}
              disabled={
                run.status === "blocked" ||
                run.status === "waiting" ||
                busyAction === "complete-step"
              }
              className="min-h-10 w-full rounded-lg border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:justify-self-start"
            >
              {busyAction === "complete-step"
                ? "Completing..."
                : "Complete Current Step"}
            </button>
          </div>
        </div>
      ) : null}
      {pendingApprovals.length > 0 ? (
        <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <h4 className="font-semibold text-textPrimary">Pending Approvals</h4>
          <textarea
            rows={3}
            value={props.approvalComment}
            onChange={(event) => props.setApprovalComment(event.target.value)}
            placeholder="Approval comment"
            className={`${FIELD_CLASS} mt-3`}
          />{" "}
          <div className="mt-3 space-y-3">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="flex flex-col gap-2 rounded-lg border border-borderSubtle bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm text-textSecondary">
                  Step #{approval.sop_step_id} approval requested
                </div>
                {canManage ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        void props.resolveApproval(approval.id, "approved")
                      }
                      className="min-h-10 rounded-lg border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void props.resolveApproval(approval.id, "rejected")
                      }
                      className="min-h-10 rounded-lg border border-red-600 bg-red-600 px-4 text-sm font-semibold text-white"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-5 rounded-lg border border-borderSubtle bg-bgDark/30 p-4">
        <h4 className="font-semibold text-textPrimary">Block or Resume Run</h4>
        <div className="mt-3 grid gap-3">
          <textarea
            rows={3}
            value={props.blockReason}
            onChange={(event) => props.setBlockReason(event.target.value)}
            placeholder="Block reason"
            className={FIELD_CLASS}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void props.updateRun("block")}
              disabled={
                run.status === "completed" || busyAction === "block-run"
              }
              className="min-h-10 rounded-lg border border-red-600 bg-red-600 px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyAction === "block-run" ? "Blocking..." : "Block Run"}
            </button>
            <button
              type="button"
              onClick={() => void props.updateRun("resume")}
              disabled={
                (run.status !== "blocked" && run.status !== "waiting") ||
                busyAction === "resume-run"
              }
              className="min-h-10 rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyAction === "resume-run" ? "Resuming..." : "Resume Run"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
function SopDetailModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-borderSubtle bg-surface p-4 shadow-cyberMd dark:bg-bgDark sm:max-w-5xl sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
function StandardModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-bgDark/60 p-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-borderSubtle bg-surface p-4 shadow-cyberMd dark:bg-bgDark sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
function ModalActions({
  onCancel,
  onSubmit,
  submitLabel,
  helperText,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  helperText?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-lg border border-borderSubtle px-4 py-2 text-sm font-semibold text-textPrimary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="min-h-10 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
      {helperText ? (
        <p className="text-xs leading-5 text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
}
function CategoryBadge({ category }: { category: string | null }) {
  const label = category || "General";
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${getCategoryStyle(label.toLowerCase())}`}
    >
      {label}
    </span>
  );
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-borderSubtle pt-3 first:border-t-0 first:pt-0">
      <dt className="text-textMuted">{label}</dt>
      <dd className="text-right text-textPrimary">{value}</dd>
    </div>
  );
}
function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface/80 p-3 dark:bg-bgDark/40">
      <div className="text-xs font-medium uppercase tracking-wide text-textMuted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-textPrimary">{value}</div>
    </div>
  );
}
function StepTemplateCard({ step }: { step: SopStep }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-bgDark/30 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-semibold text-textPrimary">
            {step.step_order}. {step.title}
          </h4>
          {step.instructions ? (
            <p className="mt-1 text-sm leading-6 text-textSecondary">
              {step.instructions}
            </p>
          ) : null}
        </div>
        {step.estimated_minutes ? (
          <span className="text-xs text-textMuted">
            {step.estimated_minutes} min
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {step.requires_evidence ? (
          <FlagBadge label="Requires Evidence" />
        ) : null}
        {step.requires_approval ? (
          <FlagBadge label="Requires Approval" />
        ) : null}
      </div>
    </div>
  );
}
function RunStepCard({
  step,
  isCurrent,
}: {
  step: SopRunStep;
  isCurrent: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${isCurrent ? "border-accent/40 bg-accent/10" : "border-borderSubtle bg-bgDark/30"}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="font-semibold text-textPrimary">
            {step.step_order}. {step.title}
          </h4>
          {step.instructions ? (
            <p className="mt-1 text-sm leading-6 text-textSecondary">
              {step.instructions}
            </p>
          ) : null}
        </div>
        <StatusBadge status={step.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isCurrent ? <FlagBadge label="Current Step" /> : null}
        {step.requires_evidence ? (
          <FlagBadge label="Requires Evidence" />
        ) : null}
        {step.requires_approval ? (
          <FlagBadge label="Requires Approval" />
        ) : null}
      </div>
    </div>
  );
}
function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-10 items-center gap-3 rounded-lg border border-borderSubtle bg-bgDark/30 px-3 py-2 text-sm text-textPrimary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-borderSubtle"
      />
      {label}
    </label>
  );
}
function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusStyles(status.toLowerCase())}`}
    >
      {formatStatus(status)}
    </span>
  );
}
function FlagBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
      {label}
    </span>
  );
}
function statusStyles(status: string) {
  if (["active", "running", "completed", "approved"].includes(status))
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (["draft", "pending", "in_progress"].includes(status))
    return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  if (["under_review", "waiting"].includes(status))
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (["blocked", "failed", "rejected"].includes(status))
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
}
function getCategoryStyle(category: string) {
  if (category.includes("hr") || category.includes("employee"))
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
  if (category.includes("safety") || category.includes("field"))
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  if (category.includes("inventory"))
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
  if (category.includes("work order"))
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (category.includes("admin") || category.includes("office"))
    return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
}
function formatVersion(value: string | number | null) {
  if (!value) return "-";
  const stringValue = String(value).trim();
  if (!stringValue) return "-";
  return stringValue.toLowerCase().startsWith("v")
    ? stringValue
    : `v${stringValue}`;
}
function formatDate(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-12 text-center text-sm text-textSecondary shadow-soft backdrop-blur-xl">
      {label}
    </div>
  );
}
function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
