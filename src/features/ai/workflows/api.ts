/**
 * LS-12E — Workflow Engine API.
 *
 * Orchestrates AI workflow runs end to end:
 *  1. `createRun` — record pending run + call provider to build a preview.
 *  2. `approveRun` — apply the safe action (draft-only, never publishes).
 *  3. `rejectRun` / `undoRun` — reversible state transitions.
 *
 * All mutations go through `ai_workflow_runs` (RLS scoped per workspace)
 * and are also logged into `ai_activity` for cross-feature audit trails.
 * Destructive actions (delete/publish) are explicitly forbidden.
 */
import { supabase } from "@/integrations/supabase/client";
import { findWorkflow, type TriggerType, type WorkflowTarget } from "./registry";
import { callProvider } from "./providers";
import { loadWorkspaceMemory } from "./memory";

export type WorkflowStatus =
  | "pending"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "running"
  | "completed"
  | "failed"
  | "scheduled"
  | "undone";

export interface WorkflowRunRow {
  id: string;
  workspace_id: string;
  user_id: string;
  workflow_id: string;
  trigger_type: TriggerType;
  status: WorkflowStatus;
  target: WorkflowTarget;
  input: Record<string, unknown>;
  preview: Record<string, unknown>;
  result: Record<string, unknown>;
  undo_data: Record<string, unknown>;
  error: string | null;
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  retries: number;
  scheduled_at: string | null;
  approved_at: string | null;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
}

async function updateRun(id: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("ai_workflow_runs")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as WorkflowRunRow;
}

async function logActivity(
  workspaceId: string,
  userId: string,
  kind: string,
  payload: Record<string, unknown>,
) {
  await supabase.from("ai_activity").insert({
    workspace_id: workspaceId,
    user_id: userId,
    kind,
    payload: payload as never,
  } as never);
}

/** Kick off a workflow — creates run + generates preview via provider. */
export async function createRun(params: {
  workspaceId: string;
  userId: string;
  workflowId: string;
  target: WorkflowTarget;
  triggerType?: TriggerType;
  input?: Record<string, unknown>;
}): Promise<WorkflowRunRow> {
  const wf = findWorkflow(params.workflowId);
  if (!wf) throw new Error(`Unknown workflow: ${params.workflowId}`);

  const { data: created, error } = await supabase
    .from("ai_workflow_runs")
    .insert({
      workspace_id: params.workspaceId,
      user_id: params.userId,
      workflow_id: wf.id,
      trigger_type: params.triggerType ?? "manual",
      status: "running",
      target: params.target as never,
      input: (params.input ?? {}) as never,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  const run = created as unknown as WorkflowRunRow;

  try {
    const memory = await loadWorkspaceMemory(params.workspaceId);
    const system = buildSystemPrompt(wf.id, memory);
    const prompt = buildUserPrompt(wf.id, params.target, params.input ?? {});
    const result = await callProvider<string>({ system, prompt });

    if (!result.ok) {
      const failed = await updateRun(run.id, {
        status: "failed",
        error: result.error ?? "provider error",
        provider: result.provider,
        model: result.model,
        latency_ms: result.latencyMs,
      });
      await logActivity(params.workspaceId, params.userId, "workflow_failed", {
        workflow_id: wf.id,
        run_id: run.id,
        error: result.error,
      });
      return failed;
    }

    const preview = { output: result.data ?? "" };
    const nextStatus: WorkflowStatus = wf.requiresApproval ? "awaiting_approval" : "completed";
    const patch: Record<string, unknown> = {
      status: nextStatus,
      preview,
      provider: result.provider,
      model: result.model,
      latency_ms: result.latencyMs,
      tokens_in: result.tokensIn ?? null,
      tokens_out: result.tokensOut ?? null,
    };
    if (!wf.requiresApproval) {
      patch.result = preview;
      patch.executed_at = new Date().toISOString();
    }
    const updated = await updateRun(run.id, patch);
    await logActivity(params.workspaceId, params.userId, "workflow_preview", {
      workflow_id: wf.id,
      run_id: run.id,
      requires_approval: wf.requiresApproval,
    });
    return updated;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const failed = await updateRun(run.id, { status: "failed", error: msg });
    await logActivity(params.workspaceId, params.userId, "workflow_failed", {
      workflow_id: wf.id,
      run_id: run.id,
      error: msg,
    });
    return failed;
  }
}

/** Approve an awaiting_approval run and mark completed. Draft-only. */
export async function approveRun(
  run: WorkflowRunRow,
  opts?: { editedPreview?: Record<string, unknown> },
): Promise<WorkflowRunRow> {
  if (run.status !== "awaiting_approval") {
    throw new Error(`Cannot approve a run in status ${run.status}`);
  }
  const preview = opts?.editedPreview ?? run.preview;
  const updated = await updateRun(run.id, {
    status: "completed",
    preview,
    result: preview,
    approved_at: new Date().toISOString(),
    executed_at: new Date().toISOString(),
  });
  await logActivity(run.workspace_id, run.user_id, "workflow_approved", {
    workflow_id: run.workflow_id,
    run_id: run.id,
  });
  return updated;
}

export async function rejectRun(run: WorkflowRunRow, reason?: string): Promise<WorkflowRunRow> {
  const updated = await updateRun(run.id, {
    status: "rejected",
    error: reason ?? null,
  });
  await logActivity(run.workspace_id, run.user_id, "workflow_rejected", {
    workflow_id: run.workflow_id,
    run_id: run.id,
    reason: reason ?? null,
  });
  return updated;
}

export async function undoRun(run: WorkflowRunRow): Promise<WorkflowRunRow> {
  if (run.status !== "completed") {
    throw new Error("Only completed runs can be undone");
  }
  const updated = await updateRun(run.id, { status: "undone" });
  await logActivity(run.workspace_id, run.user_id, "workflow_undone", {
    workflow_id: run.workflow_id,
    run_id: run.id,
  });
  return updated;
}

export async function retryRun(run: WorkflowRunRow): Promise<WorkflowRunRow> {
  const updated = await updateRun(run.id, {
    status: "running",
    error: null,
    retries: run.retries + 1,
  });
  const wf = findWorkflow(run.workflow_id);
  if (!wf) return updated;
  const memory = await loadWorkspaceMemory(run.workspace_id);
  const result = await callProvider<string>({
    system: buildSystemPrompt(wf.id, memory),
    prompt: buildUserPrompt(wf.id, run.target, run.input),
  });
  if (!result.ok) {
    return updateRun(run.id, {
      status: "failed",
      error: result.error ?? "provider error",
      latency_ms: result.latencyMs,
    });
  }
  const preview = { output: result.data ?? "" };
  return updateRun(run.id, {
    status: wf.requiresApproval ? "awaiting_approval" : "completed",
    preview,
    result: wf.requiresApproval ? {} : preview,
    provider: result.provider,
    model: result.model,
    latency_ms: result.latencyMs,
    executed_at: wf.requiresApproval ? null : new Date().toISOString(),
  });
}

export async function listRuns(
  workspaceId: string,
  filter?: { status?: WorkflowStatus | WorkflowStatus[]; limit?: number },
): Promise<WorkflowRunRow[]> {
  let q = supabase
    .from("ai_workflow_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(filter?.limit ?? 100);
  if (filter?.status) {
    q = Array.isArray(filter.status) ? q.in("status", filter.status) : q.eq("status", filter.status);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as WorkflowRunRow[];
}

// ── Prompt builders ───────────────────────────────────────────────────

function buildSystemPrompt(workflowId: string, memory: Awaited<ReturnType<typeof loadWorkspaceMemory>>): string {
  const brand = [
    memory?.brand_voice && `Brand voice: ${memory.brand_voice}`,
    memory?.preferred_tone && `Tone: ${memory.preferred_tone}`,
    memory?.target_audience && `Audience: ${memory.target_audience}`,
  ]
    .filter(Boolean)
    .join("\n");
  const base = `You are ZUPIX AI, a workspace-scoped assistant. You produce DRAFT-ONLY output. Never suggest publishing or deleting content. Respect the workspace brand context below when present.`;
  return brand ? `${base}\n\n${brand}` : base;
}

function buildUserPrompt(
  workflowId: string,
  target: WorkflowTarget,
  input: Record<string, unknown>,
): string {
  switch (workflowId) {
    case "optimize_bio":
      return `Optimize the bio page (${target.id ?? "current"}). Return a concise headline, subhead, and 1 CTA idea.`;
    case "improve_cta":
      return `Suggest 3 higher-converting CTA button variants for the current bio page. Context: ${JSON.stringify(input)}`;
    case "generate_seo":
      return `Generate SEO title (≤60 chars), meta description (≤160 chars), OG title and OG description for bio page ${target.id ?? ""}.`;
    case "create_social_content":
      return `Write on-brand Instagram, X (Twitter), and LinkedIn captions promoting the current bio page. Keep each under platform limits.`;
    case "suggest_theme":
      return `Suggest one cohesive theme (name, rationale, primary/secondary/background/text hex colors, heading and body font pair) that fits the workspace brand.`;
    case "flag_unused_assets":
      return `Return a short summary explaining how to review flagged unused assets. Actual asset scanning happens client-side.`;
    case "weekly_report":
      return `Summarize the last 7 days: overall traffic direction, top 3 pages, CTR movement, and 3 priority actions to focus on next week.`;
    default:
      return `Perform workflow ${workflowId}. Input: ${JSON.stringify(input)}`;
  }
}
