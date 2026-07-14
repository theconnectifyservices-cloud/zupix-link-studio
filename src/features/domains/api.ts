import { supabase } from "@/integrations/supabase/client";
import type { DomainRow, WorkspaceBranding, RedirectType, SslStatus } from "./types";

const DOMAINS = "domains" as never;
const WORKSPACES = "workspaces" as never;

export async function listDomains(workspaceId: string): Promise<DomainRow[]> {
  const { data, error } = await supabase
    .from(DOMAINS)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as DomainRow[]) ?? [];
}

export async function createDomain(input: {
  workspaceId: string;
  host: string;
  targetPageId?: string | null;
}): Promise<DomainRow> {
  const { data, error } = await supabase
    .from(DOMAINS)
    .insert({
      workspace_id: input.workspaceId,
      host: input.host,
      kind: "custom",
      target_page_id: input.targetPageId ?? null,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as DomainRow;
}

export async function deleteDomain(id: string) {
  const { error } = await supabase.from(DOMAINS).delete().eq("id", id);
  if (error) throw error;
}

export async function updateDomain(
  id: string,
  patch: Partial<
    Pick<
      DomainRow,
      | "status"
      | "ssl_status"
      | "target_page_id"
      | "redirect_type"
      | "redirect_to"
      | "last_checked_at"
      | "is_primary"
    >
  >,
) {
  const { error } = await supabase
    .from(DOMAINS)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function setPrimaryDomain(workspaceId: string, domainId: string) {
  await supabase
    .from(DOMAINS)
    .update({ is_primary: false } as never)
    .eq("workspace_id", workspaceId);
  const { error } = await supabase
    .from(DOMAINS)
    .update({ is_primary: true } as never)
    .eq("id", domainId);
  if (error) throw error;
}

export async function markSsl(id: string, ssl: SslStatus) {
  await updateDomain(id, { ssl_status: ssl });
}

export async function setRedirect(id: string, type: RedirectType, to: string | null) {
  await updateDomain(id, { redirect_type: type, redirect_to: to });
}

// --- Subdomain / branding on workspace ---

export interface WorkspaceBrandingRow extends WorkspaceBranding {
  id: string;
  name: string;
}

export async function fetchWorkspaceBranding(id: string): Promise<WorkspaceBrandingRow> {
  const { data, error } = await supabase
    .from(WORKSPACES)
    .select("id,name,subdomain,brand_name,favicon_url,social_image_url,logo_url")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as WorkspaceBrandingRow;
}

export async function updateWorkspaceBranding(
  id: string,
  patch: Partial<WorkspaceBranding & { name: string }>,
) {
  const { error } = await supabase
    .from(WORKSPACES)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function checkSubdomainAvailable(sub: string, excludeId?: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(WORKSPACES)
    .select("id")
    .eq("subdomain", sub.toLowerCase())
    .maybeSingle();
  if (error) return false;
  if (!data) return true;
  return (data as { id: string }).id === excludeId;
}

export async function checkHostAvailable(host: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(DOMAINS)
    .select("id")
    .eq("host", host.toLowerCase())
    .maybeSingle();
  if (error) return false;
  return !data;
}
