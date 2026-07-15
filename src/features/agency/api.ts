import { supabase } from "@/integrations/supabase/client";

export type ClientStatus = "trial" | "active" | "suspended" | "archived";
export type AssignmentRole =
  | "project_manager"
  | "designer"
  | "developer"
  | "writer"
  | "seo"
  | "viewer";
export type ApprovalKind = "draft" | "content" | "design" | "publishing";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "revision_requested";
export type SharedResourceKind = "template" | "asset" | "component" | "prompt";

export interface ClientProfile {
  id: string;
  agency_workspace_id: string;
  client_workspace_id: string;
  status: ClientStatus;
  business_info: Record<string, unknown>;
  brand_kit: Record<string, unknown>;
  domain_info: Record<string, unknown>;
  social_accounts: Record<string, unknown>;
  goals: Record<string, unknown>;
  onboarding_step: number;
  onboarding_completed: boolean;
  monthly_revenue_cents: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  client_workspace?: { id: string; name: string; slug: string } | null;
}

export interface ClientAssignment {
  id: string;
  client_workspace_id: string;
  agency_workspace_id: string;
  user_id: string;
  role: AssignmentRole;
  created_at: string;
  profile?: { id: string; email: string | null; display_name: string | null } | null;
}

export interface ClientApproval {
  id: string;
  client_workspace_id: string;
  agency_workspace_id: string;
  kind: ApprovalKind;
  title: string;
  description: string | null;
  entity_ref: Record<string, unknown>;
  status: ApprovalStatus;
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  history: Array<{ at: string; by: string | null; status: ApprovalStatus; note?: string }>;
  created_at: string;
  updated_at: string;
}

export interface ClientNote {
  id: string;
  client_workspace_id: string;
  agency_workspace_id: string;
  author_id: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedResource {
  id: string;
  agency_workspace_id: string;
  kind: SharedResourceKind;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const T = (name: string) => name as never;

/* ---------- Clients ---------- */

export async function listClients(agencyId: string): Promise<ClientProfile[]> {
  const { data, error } = await supabase
    .from(T("client_profiles"))
    .select("*")
    .eq("agency_workspace_id", agencyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as ClientProfile[];
  const ids = Array.from(new Set(rows.map((r) => r.client_workspace_id)));
  if (ids.length === 0) return rows;
  const { data: ws } = await supabase
    .from(T("workspaces"))
    .select("id,name,slug")
    .in("id", ids);
  const map = new Map<string, ClientProfile["client_workspace"]>();
  for (const w of (ws ?? []) as unknown as NonNullable<ClientProfile["client_workspace"]>[]) {
    map.set(w.id, w);
  }
  return rows.map((r) => ({ ...r, client_workspace: map.get(r.client_workspace_id) ?? null }));
}

export async function createClient(input: {
  agencyId: string;
  ownerId: string;
  name: string;
  status?: ClientStatus;
}): Promise<ClientProfile> {
  const slugBase = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = slugBase || `client-${Date.now().toString(36)}`;
  // ensure unique
  for (let i = 0; i < 4; i++) {
    const { data: exists } = await supabase
      .from(T("workspaces"))
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exists) break;
    slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const { data: ws, error: wsErr } = await supabase
    .from(T("workspaces"))
    .insert({
      name: input.name,
      slug,
      owner_id: input.ownerId,
      parent_agency_id: input.agencyId,
      workspace_type: "business",
    } as never)
    .select("id,name,slug")
    .single();
  if (wsErr) throw wsErr;
  const wsRow = ws as unknown as { id: string; name: string; slug: string };

  await supabase.from(T("workspace_members")).insert({
    workspace_id: wsRow.id,
    user_id: input.ownerId,
    role: "owner",
  } as never);

  const { data, error } = await supabase
    .from(T("client_profiles"))
    .insert({
      agency_workspace_id: input.agencyId,
      client_workspace_id: wsRow.id,
      status: input.status ?? "trial",
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return { ...(data as unknown as ClientProfile), client_workspace: wsRow };
}

export async function updateClientStatus(id: string, status: ClientStatus): Promise<void> {
  const { error } = await supabase
    .from(T("client_profiles"))
    .update({ status } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function updateClientOnboarding(
  id: string,
  patch: Partial<
    Pick<
      ClientProfile,
      | "business_info"
      | "brand_kit"
      | "domain_info"
      | "social_accounts"
      | "goals"
      | "onboarding_step"
      | "onboarding_completed"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from(T("client_profiles"))
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteClient(id: string, clientWorkspaceId: string): Promise<void> {
  // Deleting the workspace cascades the profile.
  const { error } = await supabase.from(T("workspaces")).delete().eq("id", clientWorkspaceId);
  if (error) {
    // fallback: at least remove client_profiles row
    await supabase.from(T("client_profiles")).delete().eq("id", id);
    throw error;
  }
}

export async function transferClient(id: string, newAgencyId: string): Promise<void> {
  const { data: prof, error: pErr } = await supabase
    .from(T("client_profiles"))
    .select("client_workspace_id")
    .eq("id", id)
    .single();
  if (pErr) throw pErr;
  const clientWsId = (prof as unknown as { client_workspace_id: string }).client_workspace_id;
  const { error: wErr } = await supabase
    .from(T("workspaces"))
    .update({ parent_agency_id: newAgencyId } as never)
    .eq("id", clientWsId);
  if (wErr) throw wErr;
  const { error } = await supabase
    .from(T("client_profiles"))
    .update({ agency_workspace_id: newAgencyId } as never)
    .eq("id", id);
  if (error) throw error;
}

/* ---------- Assignments ---------- */

export async function listAssignments(clientWorkspaceId: string): Promise<ClientAssignment[]> {
  const { data, error } = await supabase
    .from(T("client_assignments"))
    .select("*")
    .eq("client_workspace_id", clientWorkspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as ClientAssignment[];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (ids.length === 0) return rows;
  const { data: profiles } = await supabase
    .from(T("profiles"))
    .select("id,email,display_name")
    .in("id", ids);
  const map = new Map<string, ClientAssignment["profile"]>();
  for (const p of (profiles ?? []) as unknown as NonNullable<ClientAssignment["profile"]>[]) {
    map.set(p.id, p);
  }
  return rows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
}

export async function assignMember(input: {
  agencyId: string;
  clientWorkspaceId: string;
  userId: string;
  role: AssignmentRole;
  assignedBy: string;
}): Promise<void> {
  const { error } = await supabase.from(T("client_assignments")).insert({
    agency_workspace_id: input.agencyId,
    client_workspace_id: input.clientWorkspaceId,
    user_id: input.userId,
    role: input.role,
    assigned_by: input.assignedBy,
  } as never);
  if (error) throw error;
}

export async function unassignMember(id: string): Promise<void> {
  const { error } = await supabase.from(T("client_assignments")).delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Approvals ---------- */

export async function listApprovals(agencyId: string): Promise<ClientApproval[]> {
  const { data, error } = await supabase
    .from(T("client_approvals"))
    .select("*")
    .eq("agency_workspace_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as ClientApproval[];
}

export async function createApproval(input: {
  agencyId: string;
  clientWorkspaceId: string;
  kind: ApprovalKind;
  title: string;
  description?: string;
  requestedBy: string;
}): Promise<ClientApproval> {
  const { data, error } = await supabase
    .from(T("client_approvals"))
    .insert({
      agency_workspace_id: input.agencyId,
      client_workspace_id: input.clientWorkspaceId,
      kind: input.kind,
      title: input.title,
      description: input.description ?? null,
      requested_by: input.requestedBy,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ClientApproval;
}

export async function decideApproval(input: {
  id: string;
  status: ApprovalStatus;
  userId: string;
  note?: string;
  current: ClientApproval;
}): Promise<void> {
  const history = [
    ...(input.current.history ?? []),
    { at: new Date().toISOString(), by: input.userId, status: input.status, note: input.note },
  ];
  const { error } = await supabase
    .from(T("client_approvals"))
    .update({
      status: input.status,
      decided_by: input.userId,
      decided_at: new Date().toISOString(),
      decision_note: input.note ?? null,
      history,
    } as never)
    .eq("id", input.id);
  if (error) throw error;
}

/* ---------- Notes ---------- */

export async function listNotes(clientWorkspaceId: string): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from(T("client_notes"))
    .select("*")
    .eq("client_workspace_id", clientWorkspaceId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClientNote[];
}

export async function createNote(input: {
  agencyId: string;
  clientWorkspaceId: string;
  authorId: string;
  body: string;
  pinned?: boolean;
}): Promise<void> {
  const { error } = await supabase.from(T("client_notes")).insert({
    agency_workspace_id: input.agencyId,
    client_workspace_id: input.clientWorkspaceId,
    author_id: input.authorId,
    body: input.body,
    pinned: input.pinned ?? false,
  } as never);
  if (error) throw error;
}

export async function togglePinnedNote(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase
    .from(T("client_notes"))
    .update({ pinned } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from(T("client_notes")).delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Shared resources ---------- */

export async function listSharedResources(agencyId: string): Promise<SharedResource[]> {
  const { data, error } = await supabase
    .from(T("shared_resources"))
    .select("*")
    .eq("agency_workspace_id", agencyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SharedResource[];
}

export async function createSharedResource(input: {
  agencyId: string;
  kind: SharedResourceKind;
  title: string;
  description?: string;
  payload?: Record<string, unknown>;
  tags?: string[];
  userId: string;
}): Promise<void> {
  const { error } = await supabase.from(T("shared_resources")).insert({
    agency_workspace_id: input.agencyId,
    kind: input.kind,
    title: input.title,
    description: input.description ?? null,
    payload: input.payload ?? {},
    tags: input.tags ?? [],
    created_by: input.userId,
  } as never);
  if (error) throw error;
}

export async function deleteSharedResource(id: string): Promise<void> {
  const { error } = await supabase.from(T("shared_resources")).delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Export ---------- */

export async function exportClientWorkspace(clientWorkspaceId: string): Promise<Blob> {
  const [ws, pages, brand] = await Promise.all([
    supabase.from(T("workspaces")).select("*").eq("id", clientWorkspaceId).maybeSingle(),
    supabase.from(T("bio_pages")).select("*").eq("workspace_id", clientWorkspaceId),
    supabase.from(T("brand_kits")).select("*").eq("workspace_id", clientWorkspaceId),
  ]);
  const payload = {
    exported_at: new Date().toISOString(),
    workspace: ws.data ?? null,
    bio_pages: pages.data ?? [],
    brand_kits: brand.data ?? [],
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}
