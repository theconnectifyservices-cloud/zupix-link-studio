import { supabase } from "@/integrations/supabase/client";
import type { Tenant, TenantDomain, TenantDomainKind } from "./types";

const TENANTS = "tenants" as never;
const TENANT_DOMAINS = "tenant_domains" as never;

export async function listMyTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from(TENANTS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Tenant[]) ?? [];
}

export async function getTenant(id: string): Promise<Tenant> {
  const { data, error } = await supabase.from(TENANTS).select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as Tenant;
}

export async function createTenant(input: {
  slug: string;
  company_name: string;
  owner_id: string;
}): Promise<Tenant> {
  const { data, error } = await supabase
    .from(TENANTS)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Tenant;
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<void> {
  const { error } = await supabase.from(TENANTS).update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function setTenantStatus(
  id: string,
  status: "active" | "suspended" | "archived",
): Promise<void> {
  const patch: Partial<Tenant> = { status };
  if (status === "archived") patch.archived_at = new Date().toISOString();
  await updateTenant(id, patch);
}

export async function deleteTenant(id: string): Promise<void> {
  const { error } = await supabase.from(TENANTS).delete().eq("id", id);
  if (error) throw error;
}

export async function listTenantDomains(tenantId: string): Promise<TenantDomain[]> {
  const { data, error } = await supabase
    .from(TENANT_DOMAINS)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as TenantDomain[]) ?? [];
}

export async function addTenantDomain(input: {
  tenant_id: string;
  host: string;
  kind: TenantDomainKind;
  custom_login_url?: string | null;
}): Promise<TenantDomain> {
  const { data, error } = await supabase
    .from(TENANT_DOMAINS)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as TenantDomain;
}

export async function removeTenantDomain(id: string): Promise<void> {
  const { error } = await supabase.from(TENANT_DOMAINS).delete().eq("id", id);
  if (error) throw error;
}

export async function verifyTenantDomain(id: string): Promise<void> {
  const { error } = await supabase
    .from(TENANT_DOMAINS)
    .update({
      status: "verified",
      last_checked_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) throw error;
}
