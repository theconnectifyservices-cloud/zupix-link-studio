/** Leads & Bookings queries for the dashboard (RLS-scoped to the workspace). */
import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "new" | "read" | "replied" | "archived";
export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "rescheduled"
  | "completed"
  | "cancelled";

export interface Lead {
  id: string;
  workspace_id: string;
  bio_page_id: string | null;
  block_id: string | null;
  form_name: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string | null;
  fields: Record<string, unknown> | null;
  attachments: LeadAttachmentRef[] | null;
  status: LeadStatus;
  source_url: string | null;
  page_url: string | null;
  ip_address: string | null;
  browser: string | null;
  device_type: string | null;
  created_at: string;
}

export interface LeadAttachmentRef {
  name: string;
  path: string;
  type: string;
  size: number;
}

/** Signed, short-lived URL for a visitor-uploaded attachment. */
export async function attachmentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("form-uploads")
    .createSignedUrl(path, 300);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export interface Booking {
  id: string;
  workspace_id: string;
  bio_page_id: string | null;
  block_id: string | null;
  service_title: string | null;
  booking_kind: string | null;
  customer_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  booking_date: string;
  booking_time: string;
  duration_min: number | null;
  timezone: string | null;
  location_type: string | null;
  meeting_link: string | null;
  location_address: string | null;
  status: BookingStatus;
  admin_note: string | null;
  created_at: string;
}

export async function listLeads(workspaceId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("bio_leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as Lead[];
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase.from("bio_leads").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("bio_leads").delete().eq("id", id);
  if (error) throw error;
}

export async function listBookings(workspaceId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bio_bookings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as Booking[];
}

export async function updateBooking(
  id: string,
  patch: Partial<Pick<Booking, "status" | "admin_note" | "booking_date" | "booking_time">>,
): Promise<void> {
  const { error } = await supabase.from("bio_bookings").update(patch).eq("id", id);
  if (error) throw error;
}

/** Builds a CSV blob and triggers a browser download. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    const s =
      v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
