import { supabase } from "@/integrations/supabase/client";

export type OrgRole = "owner" | "admin" | "manager" | "member";
export type LicenseSeatType = "user" | "workspace" | "organization";
export type LicenseStatus = "active" | "expired" | "suspended";
export type ComplianceFramework = "gdpr" | "soc2" | "iso27001" | "hipaa";
export type ComplianceStatus = "not_started" | "in_progress" | "compliant" | "expired";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  plan: string;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  head_user_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface License {
  id: string;
  organization_id: string;
  name: string;
  tier: string;
  seat_type: LicenseSeatType;
  total_seats: number;
  status: LicenseStatus;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LicenseSeat {
  id: string;
  license_id: string;
  assignee_type: "user" | "workspace";
  user_id: string | null;
  workspace_id: string | null;
  assigned_at: string;
  assigned_by: string | null;
}

export interface GovernancePolicy {
  id: string;
  organization_id: string;
  password_min_length: number;
  password_require_symbols: boolean;
  password_require_numbers: boolean;
  session_timeout_minutes: number;
  mfa_required: boolean;
  workspace_creation_role: string;
  publishing_requires_approval: boolean;
  allowed_domains: string[];
  api_access_enabled: boolean;
  api_ip_allowlist: string[];
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  organization_id: string;
  framework: ComplianceFramework;
  status: ComplianceStatus;
  data_retention_days: number;
  legal_hold: boolean;
  evidence: Record<string, unknown>;
  last_reviewed_at: string | null;
  next_review_at: string | null;
}

const anyDb = supabase as unknown as {
  from: (t: string) => any;
};

// ---------------- Organizations ----------------
export async function listMyOrganizations(): Promise<Organization[]> {
  const { data, error } = await anyDb
    .from("organizations")
    .select("*, organization_members!inner(user_id)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Organization[]) ?? [];
}

export async function createOrganization(input: {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
}): Promise<Organization> {
  const { data, error } = await anyDb
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      owner_id: input.ownerId,
    })
    .select()
    .single();
  if (error) throw error;
  await anyDb
    .from("organization_members")
    .insert({ organization_id: data.id, user_id: input.ownerId, role: "owner" });
  return data as Organization;
}

export async function renameOrganization(id: string, name: string) {
  const { error } = await anyDb.from("organizations").update({ name }).eq("id", id);
  if (error) throw error;
}
export async function archiveOrganization(id: string, archived: boolean) {
  const { error } = await anyDb
    .from("organizations")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}
export async function deleteOrganization(id: string) {
  const { error } = await anyDb
    .from("organizations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function updateOrganizationBranding(
  id: string,
  patch: { logo_url?: string; branding?: Record<string, unknown>; description?: string },
) {
  const { error } = await anyDb.from("organizations").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------------- Departments ----------------
export async function listDepartments(orgId: string): Promise<Department[]> {
  const { data, error } = await anyDb
    .from("departments")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at");
  if (error) throw error;
  return (data as Department[]) ?? [];
}
export async function createDepartment(input: {
  organization_id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
}) {
  const { data, error } = await anyDb.from("departments").insert(input).select().single();
  if (error) throw error;
  return data as Department;
}
export async function updateDepartment(id: string, patch: Partial<Department>) {
  const { error } = await anyDb.from("departments").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteDepartment(id: string) {
  const { error } = await anyDb.from("departments").delete().eq("id", id);
  if (error) throw error;
}
export async function addDepartmentMember(department_id: string, user_id: string, role = "member") {
  const { error } = await anyDb
    .from("department_members")
    .insert({ department_id, user_id, role });
  if (error) throw error;
}
export async function listDepartmentMembers(department_id: string) {
  const { data, error } = await anyDb
    .from("department_members")
    .select("*")
    .eq("department_id", department_id);
  if (error) throw error;
  return data ?? [];
}

// ---------------- Licenses ----------------
export async function listLicenses(orgId: string): Promise<License[]> {
  const { data, error } = await anyDb
    .from("licenses")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as License[]) ?? [];
}
export async function createLicense(input: Partial<License> & { organization_id: string; name: string }) {
  const { data, error } = await anyDb.from("licenses").insert(input).select().single();
  if (error) throw error;
  return data as License;
}
export async function updateLicense(id: string, patch: Partial<License>) {
  const { error } = await anyDb.from("licenses").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteLicense(id: string) {
  const { error } = await anyDb.from("licenses").delete().eq("id", id);
  if (error) throw error;
}
export async function listLicenseSeats(licenseId: string): Promise<LicenseSeat[]> {
  const { data, error } = await anyDb
    .from("license_seats")
    .select("*")
    .eq("license_id", licenseId);
  if (error) throw error;
  return (data as LicenseSeat[]) ?? [];
}
export async function assignSeat(input: {
  license_id: string;
  assignee_type: "user" | "workspace";
  user_id?: string | null;
  workspace_id?: string | null;
  assigned_by?: string;
}) {
  const { error } = await anyDb.from("license_seats").insert(input);
  if (error) throw error;
}
export async function revokeSeat(id: string) {
  const { error } = await anyDb.from("license_seats").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Governance ----------------
export async function getGovernancePolicy(orgId: string): Promise<GovernancePolicy | null> {
  const { data, error } = await anyDb
    .from("governance_policies")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) throw error;
  return (data as GovernancePolicy) ?? null;
}
export async function upsertGovernancePolicy(orgId: string, patch: Partial<GovernancePolicy>) {
  const { data, error } = await anyDb
    .from("governance_policies")
    .upsert({ organization_id: orgId, ...patch }, { onConflict: "organization_id" })
    .select()
    .single();
  if (error) throw error;
  return data as GovernancePolicy;
}

// ---------------- Compliance ----------------
export async function listCompliance(orgId: string): Promise<ComplianceRecord[]> {
  const { data, error } = await anyDb
    .from("compliance_records")
    .select("*")
    .eq("organization_id", orgId);
  if (error) throw error;
  return (data as ComplianceRecord[]) ?? [];
}
export async function upsertCompliance(
  orgId: string,
  framework: ComplianceFramework,
  patch: Partial<ComplianceRecord>,
) {
  const { error } = await anyDb
    .from("compliance_records")
    .upsert(
      { organization_id: orgId, framework, ...patch },
      { onConflict: "organization_id,framework" },
    );
  if (error) throw error;
}

// ---------------- Audit ----------------
export async function listOrgAudit(orgId: string, limit = 100) {
  const { data, error } = await anyDb
    .from("audit_logs")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ---------------- Enterprise metrics ----------------
export async function getEnterpriseMetrics(orgId: string) {
  const [members, workspaces, licenses, depts] = await Promise.all([
    anyDb.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    anyDb.from("workspaces").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    anyDb.from("licenses").select("total_seats").eq("organization_id", orgId),
    anyDb.from("departments").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
  ]);
  const seatsSum: number =
    (licenses.data as { total_seats: number }[] | null)?.reduce(
      (a, l) => a + (l.total_seats || 0),
      0,
    ) ?? 0;
  const { count: assignedSeats } = await anyDb
    .from("license_seats")
    .select("id, licenses!inner(organization_id)", { count: "exact", head: true })
    .eq("licenses.organization_id", orgId);
  return {
    members: members.count ?? 0,
    workspaces: workspaces.count ?? 0,
    departments: depts.count ?? 0,
    totalSeats: seatsSum,
    assignedSeats: assignedSeats ?? 0,
    availableSeats: Math.max(0, seatsSum - (assignedSeats ?? 0)),
  };
}

export async function exportOrganizationData(orgId: string) {
  const [org, depts, lics, seats, gov, comp, audit] = await Promise.all([
    anyDb.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    anyDb.from("departments").select("*").eq("organization_id", orgId),
    anyDb.from("licenses").select("*").eq("organization_id", orgId),
    anyDb.from("license_seats").select("*, licenses!inner(organization_id)").eq("licenses.organization_id", orgId),
    anyDb.from("governance_policies").select("*").eq("organization_id", orgId),
    anyDb.from("compliance_records").select("*").eq("organization_id", orgId),
    anyDb.from("audit_logs").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(1000),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    organization: org.data,
    departments: depts.data,
    licenses: lics.data,
    seats: seats.data,
    governance: gov.data,
    compliance: comp.data,
    audit: audit.data,
  };
}
