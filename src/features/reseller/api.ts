import { supabase } from "@/integrations/supabase/client";
import type {
  ResellerClient,
  ResellerClientStatus,
  ResellerNote,
  ResellerNoteKind,
  ResellerPriority,
  ResellerSupportStatus,
  ResellerTeamMember,
  ResellerTeamRole,
} from "./types";

const CLIENTS = "reseller_clients" as never;
const NOTES = "reseller_client_notes" as never;
const TEAM = "reseller_team_members" as never;

export interface ListClientsOptions {
  search?: string;
  status?: ResellerClientStatus | "all";
  limit?: number;
  offset?: number;
}

export async function listClients(
  tenantId: string,
  opts: ListClientsOptions = {},
): Promise<{ rows: ResellerClient[]; count: number }> {
  const { search, status, limit = 50, offset = 0 } = opts;
  let q = supabase
    .from(CLIENTS)
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status && status !== "all") q = q.eq("status", status);
  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`company_name.ilike.${s},contact_email.ilike.${s},contact_name.ilike.${s}`);
  }
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data as unknown as ResellerClient[]) ?? [], count: count ?? 0 };
}

export async function getClient(id: string): Promise<ResellerClient> {
  const { data, error } = await supabase.from(CLIENTS).select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as ResellerClient;
}

export interface CreateClientInput {
  tenant_id: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: ResellerClientStatus;
  plan_key?: string;
  custom_domain?: string;
  priority?: ResellerPriority;
  assigned_staff_id?: string;
  trial_ends_at?: string;
  tags?: string[];
  created_by?: string;
}

export async function createClient(input: CreateClientInput): Promise<ResellerClient> {
  const { data, error } = await supabase
    .from(CLIENTS)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ResellerClient;
}

export async function updateClient(id: string, patch: Partial<ResellerClient>): Promise<void> {
  const { error } = await supabase.from(CLIENTS).update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from(CLIENTS).delete().eq("id", id);
  if (error) throw error;
}

export async function setClientStatus(
  id: string,
  status: ResellerClientStatus,
): Promise<void> {
  const patch: Partial<ResellerClient> = { status };
  const now = new Date().toISOString();
  if (status === "active") patch.activated_at = now;
  if (status === "suspended") patch.suspended_at = now;
  if (status === "archived") patch.archived_at = now;
  await updateClient(id, patch);
}

export async function bulkSetStatus(
  ids: string[],
  status: ResellerClientStatus,
): Promise<void> {
  if (ids.length === 0) return;
  const patch: Partial<ResellerClient> = { status };
  const now = new Date().toISOString();
  if (status === "active") patch.activated_at = now;
  if (status === "suspended") patch.suspended_at = now;
  if (status === "archived") patch.archived_at = now;
  const { error } = await supabase.from(CLIENTS).update(patch as never).in("id", ids);
  if (error) throw error;
}

export async function bulkAssignPlan(ids: string[], plan_key: string): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from(CLIENTS).update({ plan_key } as never).in("id", ids);
  if (error) throw error;
}

export async function bulkDelete(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from(CLIENTS).delete().in("id", ids);
  if (error) throw error;
}

export async function bulkImport(
  tenantId: string,
  rows: Array<Omit<CreateClientInput, "tenant_id">>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const payload = rows.map((r) => ({ ...r, tenant_id: tenantId }));
  const { data, error } = await supabase.from(CLIENTS).insert(payload as never).select("id");
  if (error) throw error;
  return (data ?? []).length;
}

export async function transferClient(clientId: string, toTenantId: string): Promise<void> {
  const { error } = await supabase
    .from(CLIENTS)
    .update({ tenant_id: toTenantId } as never)
    .eq("id", clientId);
  if (error) throw error;
}

export async function extendTrial(id: string, days: number): Promise<void> {
  const target = new Date();
  target.setDate(target.getDate() + days);
  await updateClient(id, { trial_ends_at: target.toISOString(), status: "trial" });
}

export async function setSupport(
  id: string,
  input: { priority?: ResellerPriority; support_status?: ResellerSupportStatus; assigned_staff_id?: string | null },
): Promise<void> {
  await updateClient(id, input);
}

/* ---------- Notes ---------- */

export async function listNotes(clientId: string): Promise<ResellerNote[]> {
  const { data, error } = await supabase
    .from(NOTES)
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ResellerNote[]) ?? [];
}

export async function addNote(input: {
  tenant_id: string;
  client_id: string;
  kind: ResellerNoteKind;
  body: string;
  author_id: string;
}): Promise<ResellerNote> {
  const { data, error } = await supabase
    .from(NOTES)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ResellerNote;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from(NOTES).delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Team ---------- */

export async function listTeam(tenantId: string): Promise<ResellerTeamMember[]> {
  const { data, error } = await supabase
    .from(TEAM)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as ResellerTeamMember[]) ?? [];
}

export async function addTeamMember(input: {
  tenant_id: string;
  user_id: string;
  role: ResellerTeamRole;
  custom_role_key?: string;
}): Promise<void> {
  const { error } = await supabase.from(TEAM).insert(input as never);
  if (error) throw error;
}

export async function updateTeamMember(
  id: string,
  patch: { role?: ResellerTeamRole; custom_role_key?: string | null },
): Promise<void> {
  const { error } = await supabase.from(TEAM).update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function removeTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from(TEAM).delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Dashboard ---------- */

export interface ResellerStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  lead: number;
  expired: number;
  archived: number;
  cancelled: number;
  storage_mb: number;
  workspaces: number;
}

export async function getResellerStats(tenantId: string): Promise<ResellerStats> {
  const { data, error } = await supabase
    .from(CLIENTS)
    .select("status,usage,workspace_id")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  const rows = (data as unknown as Array<Pick<ResellerClient, "status" | "usage" | "workspace_id">>) ?? [];
  const stats: ResellerStats = {
    total: rows.length,
    active: 0,
    trial: 0,
    suspended: 0,
    lead: 0,
    expired: 0,
    archived: 0,
    cancelled: 0,
    storage_mb: 0,
    workspaces: 0,
  };
  for (const r of rows) {
    stats[r.status] = (stats[r.status] ?? 0) + 1;
    stats.storage_mb += Number(r.usage?.storage_mb ?? 0);
    if (r.workspace_id) stats.workspaces += 1;
  }
  return stats;
}

export function exportClientsCsv(rows: ResellerClient[]): string {
  const headers = [
    "company_name",
    "contact_name",
    "contact_email",
    "status",
    "plan_key",
    "custom_domain",
    "priority",
    "trial_ends_at",
    "created_at",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) =>
      headers
        .map((h) => escape((r as unknown as Record<string, unknown>)[h]))
        .join(","),
    )
    .join("\n");
  return `${headers.join(",")}\n${body}`;
}

export function parseClientsCsv(text: string): Array<Omit<CreateClientInput, "tenant_id">> {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') quoted = false;
        else cur += c;
      } else {
        if (c === '"') quoted = true;
        else if (c === ',') { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => (rec[h] = cells[i] ?? ""));
    return {
      company_name: rec.company_name || "Unnamed",
      contact_name: rec.contact_name || undefined,
      contact_email: rec.contact_email || undefined,
      status: (rec.status as ResellerClientStatus) || "lead",
      plan_key: rec.plan_key || undefined,
      custom_domain: rec.custom_domain || undefined,
      priority: (rec.priority as ResellerPriority) || undefined,
    };
  });
}
