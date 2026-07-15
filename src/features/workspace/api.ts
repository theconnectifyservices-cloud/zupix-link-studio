import { supabase } from "@/integrations/supabase/client";
import type { WorkspaceRole, WorkspaceType, MemberStatus } from "./permissions";

/* ---------- Types ---------- */

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  workspace_type: WorkspaceType;
  settings: Record<string, unknown>;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  custom_role_key: string | null;
  status: MemberStatus | string;
  joined_at: string;
  invited_by: string | null;
  suspended_at: string | null;
  created_at: string;
  profile?: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export interface InvitationRecord {
  id: string;
  workspace_id: string | null;
  organization_id: string | null;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CustomRoleRecord {
  id: string;
  workspace_id: string;
  key: string;
  name: string;
  description: string | null;
  base_role: WorkspaceRole;
  permissions: string[];
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionOverride {
  id: string;
  workspace_id: string;
  role_key: string;
  permission_key: string;
  granted: boolean;
}

export interface OwnershipTransferRecord {
  id: string;
  workspace_id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "canceled" | "expired";
  expires_at: string;
  accepted_at: string | null;
  canceled_at: string | null;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  user_id: string | null;
  workspace_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditRecord {
  id: string;
  actor_id: string | null;
  workspace_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

/* ---------- helpers ---------- */

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

async function logActivity(
  action: string,
  input: { workspace_id: string; target_type?: string; target_id?: string; metadata?: Record<string, unknown> },
) {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return;
  await supabase.from("activity_logs" as never).insert({
    user_id: uid,
    workspace_id: input.workspace_id,
    action: action as never,
    target_type: input.target_type ?? null,
    target_id: input.target_id ?? null,
    metadata: (input.metadata ?? {}) as never,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  } as never);
}

async function logAudit(input: {
  workspace_id: string;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? null;
  await supabase.from("audit_logs" as never).insert({
    actor_id: uid,
    workspace_id: input.workspace_id,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    action: input.action,
    before: (input.before ?? null) as never,
    after: (input.after ?? null) as never,
  } as never);
}

/* ---------- Workspaces ---------- */

export async function listMyWorkspaces(userId: string): Promise<WorkspaceRecord[]> {
  const { data, error } = await supabase
    .from("workspace_members" as never)
    .select("workspaces(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data as unknown as Array<{ workspaces: WorkspaceRecord }>) ?? [])
    .map((r) => r.workspaces)
    .filter(Boolean);
}

export async function createWorkspace(input: {
  name: string;
  workspace_type: WorkspaceType;
  description?: string;
  ownerId: string;
}): Promise<WorkspaceRecord> {
  const baseSlug = slugify(input.name) || "workspace";
  let slug = baseSlug;
  let n = 0;
  // Try to find a free slug
  while (n < 20) {
    const { data: exists } = await supabase
      .from("workspaces" as never)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exists) break;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const { data, error } = await supabase
    .from("workspaces" as never)
    .insert({
      name: input.name,
      slug,
      description: input.description ?? null,
      owner_id: input.ownerId,
      workspace_type: input.workspace_type,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  const ws = data as unknown as WorkspaceRecord;

  await supabase.from("workspace_members" as never).insert({
    workspace_id: ws.id,
    user_id: input.ownerId,
    role: "owner" as never,
    status: "active",
  } as never);

  await logActivity("workspace.create", {
    workspace_id: ws.id,
    target_type: "workspace",
    target_id: ws.id,
    metadata: { workspace_type: input.workspace_type },
  });
  return ws;
}

export async function updateWorkspace(id: string, patch: Partial<WorkspaceRecord>) {
  const { error } = await supabase
    .from("workspaces" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
  await logActivity("workspace.update", { workspace_id: id, target_type: "workspace", target_id: id });
}

export async function switchActiveWorkspace(userId: string, workspaceId: string) {
  // Store last-active timestamp for this workspace in profile jsonb
  const { data: profile } = await supabase
    .from("profiles" as never)
    .select("workspace_last_active")
    .eq("id", userId)
    .maybeSingle();
  const map = ((profile as { workspace_last_active?: Record<string, string> } | null)?.workspace_last_active ?? {}) as Record<
    string,
    string
  >;
  map[workspaceId] = new Date().toISOString();
  const { error } = await supabase
    .from("profiles" as never)
    .update({ active_workspace_id: workspaceId, workspace_last_active: map } as never)
    .eq("id", userId);
  if (error) throw error;
}

/* ---------- Members ---------- */

export async function listMembers(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
  const { data, error } = await supabase
    .from("workspace_members" as never)
    .select("*, profile:profiles!workspace_members_user_id_fkey(id,email,display_name,avatar_url,username)")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as WorkspaceMemberRecord[];
}

export async function updateMemberRole(
  memberId: string,
  workspaceId: string,
  patch: { role?: WorkspaceRole; custom_role_key?: string | null },
) {
  const { data: before } = await supabase
    .from("workspace_members" as never)
    .select("role,custom_role_key")
    .eq("id", memberId)
    .maybeSingle();
  const { error } = await supabase
    .from("workspace_members" as never)
    .update(patch as never)
    .eq("id", memberId);
  if (error) throw error;
  await logActivity("workspace.role_change", {
    workspace_id: workspaceId,
    target_type: "workspace_member",
    target_id: memberId,
    metadata: patch as Record<string, unknown>,
  });
  await logAudit({
    workspace_id: workspaceId,
    entity_type: "workspace_member",
    entity_id: memberId,
    action: "role.change",
    before: (before ?? null) as Record<string, unknown> | null,
    after: patch as Record<string, unknown>,
  });
}

export async function suspendMember(memberId: string, workspaceId: string, suspend: boolean) {
  const patch = suspend
    ? { status: "suspended", suspended_at: new Date().toISOString() }
    : { status: "active", suspended_at: null };
  const { error } = await supabase
    .from("workspace_members" as never)
    .update(patch as never)
    .eq("id", memberId);
  if (error) throw error;
  await logActivity(suspend ? "workspace.member_suspend" : "workspace.member_reinstate", {
    workspace_id: workspaceId,
    target_type: "workspace_member",
    target_id: memberId,
  });
}

export async function removeMember(memberId: string, workspaceId: string) {
  const { error } = await supabase
    .from("workspace_members" as never)
    .delete()
    .eq("id", memberId);
  if (error) throw error;
  await logActivity("workspace.member_remove", {
    workspace_id: workspaceId,
    target_type: "workspace_member",
    target_id: memberId,
  });
}

/* ---------- Invitations ---------- */

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listInvitations(workspaceId: string): Promise<InvitationRecord[]> {
  const { data, error } = await supabase
    .from("invitations" as never)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as InvitationRecord[];
}

export async function createInvitation(input: {
  workspaceId: string;
  email: string;
  role: string;
  invitedBy: string;
  ttlDays?: number;
}): Promise<InvitationRecord> {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * (input.ttlDays ?? 7));
  const { data, error } = await supabase
    .from("invitations" as never)
    .insert({
      workspace_id: input.workspaceId,
      email: input.email.toLowerCase(),
      role: input.role,
      token: generateToken(),
      invited_by: input.invitedBy,
      status: "pending" as never,
      expires_at: expires.toISOString(),
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  const inv = data as unknown as InvitationRecord;
  await logActivity("invitation.send", {
    workspace_id: input.workspaceId,
    target_type: "invitation",
    target_id: inv.id,
    metadata: { email: input.email, role: input.role },
  });
  return inv;
}

export async function resendInvitation(id: string, workspaceId: string) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const { error } = await supabase
    .from("invitations" as never)
    .update({
      status: "pending",
      expires_at: expires.toISOString(),
      token: generateToken(),
    } as never)
    .eq("id", id);
  if (error) throw error;
  await logActivity("invitation.send", {
    workspace_id: workspaceId,
    target_type: "invitation",
    target_id: id,
    metadata: { resent: true },
  });
}

export async function revokeInvitation(id: string, workspaceId: string) {
  const { error } = await supabase
    .from("invitations" as never)
    .update({ status: "revoked" } as never)
    .eq("id", id);
  if (error) throw error;
  await logActivity("invitation.send", {
    workspace_id: workspaceId,
    target_type: "invitation",
    target_id: id,
    metadata: { revoked: true },
  });
}

export async function acceptInvitation(token: string, userId: string) {
  const { data: inv, error } = await supabase
    .from("invitations" as never)
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  const invitation = inv as InvitationRecord | null;
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") throw new Error(`Invitation is ${invitation.status}`);
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase.from("invitations" as never).update({ status: "expired" } as never).eq("id", invitation.id);
    throw new Error("Invitation expired");
  }
  const baseRole: WorkspaceRole =
    invitation.role === "owner" ? "owner" : invitation.role === "admin" ? "admin" : "member";
  const customKey = ["owner", "admin", "member"].includes(invitation.role) ? null : invitation.role;

  await supabase.from("workspace_members" as never).insert({
    workspace_id: invitation.workspace_id!,
    user_id: userId,
    role: baseRole as never,
    custom_role_key: customKey,
    invited_by: invitation.invited_by,
    status: "active",
  } as never);
  await supabase
    .from("invitations" as never)
    .update({ status: "accepted", accepted_at: new Date().toISOString() } as never)
    .eq("id", invitation.id);
  await logActivity("invitation.accept", {
    workspace_id: invitation.workspace_id!,
    target_type: "invitation",
    target_id: invitation.id,
  });
}

/* ---------- Custom roles ---------- */

export async function listCustomRoles(workspaceId: string): Promise<CustomRoleRecord[]> {
  const { data, error } = await supabase
    .from("workspace_custom_roles" as never)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CustomRoleRecord[];
}

export async function upsertCustomRole(role: Omit<CustomRoleRecord, "id" | "created_at" | "updated_at" | "is_system" | "created_by">) {
  const { error } = await supabase
    .from("workspace_custom_roles" as never)
    .upsert(role as never, { onConflict: "workspace_id,key" });
  if (error) throw error;
}

export async function deleteCustomRole(workspaceId: string, key: string) {
  const { error } = await supabase
    .from("workspace_custom_roles" as never)
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("key", key);
  if (error) throw error;
}

/* ---------- Role permission overrides ---------- */

export async function listRoleOverrides(workspaceId: string): Promise<RolePermissionOverride[]> {
  const { data, error } = await supabase
    .from("workspace_role_permissions" as never)
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []) as unknown as RolePermissionOverride[];
}

export async function setRoleOverride(input: {
  workspaceId: string;
  roleKey: string;
  permissionKey: string;
  granted: boolean;
}) {
  const { error } = await supabase
    .from("workspace_role_permissions" as never)
    .upsert(
      {
        workspace_id: input.workspaceId,
        role_key: input.roleKey,
        permission_key: input.permissionKey,
        granted: input.granted,
      } as never,
      { onConflict: "workspace_id,role_key,permission_key" },
    );
  if (error) throw error;
}

export async function clearRoleOverride(input: { workspaceId: string; roleKey: string; permissionKey: string }) {
  const { error } = await supabase
    .from("workspace_role_permissions" as never)
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("role_key", input.roleKey)
    .eq("permission_key", input.permissionKey);
  if (error) throw error;
}

/* ---------- Ownership transfer ---------- */

export async function listTransfers(workspaceId: string): Promise<OwnershipTransferRecord[]> {
  const { data, error } = await supabase
    .from("ownership_transfers" as never)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OwnershipTransferRecord[];
}

export async function createTransfer(input: { workspaceId: string; fromUserId: string; toUserId: string }) {
  const { error } = await supabase
    .from("ownership_transfers" as never)
    .insert({
      workspace_id: input.workspaceId,
      from_user_id: input.fromUserId,
      to_user_id: input.toUserId,
      status: "pending",
    } as never);
  if (error) throw error;
  await logActivity("workspace.transfer", {
    workspace_id: input.workspaceId,
    target_type: "workspace",
    target_id: input.workspaceId,
    metadata: { to_user_id: input.toUserId },
  });
}

export async function acceptTransfer(transferId: string, userId: string) {
  const { data: transfer, error } = await supabase
    .from("ownership_transfers" as never)
    .select("*")
    .eq("id", transferId)
    .maybeSingle();
  if (error) throw error;
  const t = transfer as OwnershipTransferRecord | null;
  if (!t || t.status !== "pending") throw new Error("Transfer no longer pending");
  if (new Date(t.expires_at).getTime() < Date.now()) throw new Error("Transfer expired");
  if (t.to_user_id !== userId) throw new Error("Not the target user");

  // Demote current owner to admin, promote target to owner
  await supabase
    .from("workspace_members" as never)
    .update({ role: "admin" as never } as never)
    .eq("workspace_id", t.workspace_id)
    .eq("user_id", t.from_user_id);
  await supabase
    .from("workspace_members" as never)
    .update({ role: "owner" as never } as never)
    .eq("workspace_id", t.workspace_id)
    .eq("user_id", t.to_user_id);
  await supabase
    .from("workspaces" as never)
    .update({ owner_id: t.to_user_id } as never)
    .eq("id", t.workspace_id);
  await supabase
    .from("ownership_transfers" as never)
    .update({ status: "accepted", accepted_at: new Date().toISOString() } as never)
    .eq("id", transferId);
  await logActivity("workspace.transfer", {
    workspace_id: t.workspace_id,
    target_type: "workspace",
    target_id: t.workspace_id,
    metadata: { accepted: true, from: t.from_user_id, to: t.to_user_id },
  });
}

export async function cancelTransfer(transferId: string) {
  const { error } = await supabase
    .from("ownership_transfers" as never)
    .update({ status: "canceled", canceled_at: new Date().toISOString() } as never)
    .eq("id", transferId);
  if (error) throw error;
}

/* ---------- Activity + audit ---------- */

export async function listActivity(workspaceId: string, limit = 100): Promise<ActivityRecord[]> {
  const { data, error } = await supabase
    .from("activity_logs" as never)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ActivityRecord[];
}

export async function listAudit(workspaceId: string, limit = 100): Promise<AuditRecord[]> {
  const { data, error } = await supabase
    .from("audit_logs" as never)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AuditRecord[];
}
