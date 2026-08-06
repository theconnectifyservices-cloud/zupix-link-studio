
import { supabase } from "@/integrations/supabase/client";
import { Customer, CustomerTimelineItem, CustomerStats, CustomerTag, CustomerStatus } from "../types";

export async function listCustomers(workspaceId: string, filters?: {
  search?: string;
  tag?: CustomerTag;
  hasOrders?: boolean;
  hasBookings?: boolean;
  hasPayments?: boolean;
}) {
  let query = supabase
    .from("bio_customers" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("latest_activity", { ascending: false });

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  }

  if (filters?.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  if (filters?.hasOrders) query = query.gt("total_orders", 0);
  if (filters?.hasBookings) query = query.gt("total_bookings", 0);
  if (filters?.hasPayments) query = query.gt("total_payments", 0);

  const { data, error } = await query;
  if (error) throw error;
  return data as any as Customer[];
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from("bio_customers" as any)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  const { error } = await supabase
    .from("bio_customers" as any)
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function getCustomerTimeline(customerId: string): Promise<CustomerTimelineItem[]> {
  const { data, error } = await supabase
    .from("bio_customer_timeline" as any)
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as any;
}

export async function getCustomerStats(workspaceId: string): Promise<CustomerStats> {
  // In a real scenario, these might be a single aggregate RPC or separate queries
  const { count: total } = await supabase
    .from("bio_customers" as any)
    .select("*", { count: 'exact', head: true })
    .eq("workspace_id", workspaceId);

  const { data: latest } = await supabase
    .from("bio_customers" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: top } = await supabase
    .from("bio_customers" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("total_payments", { ascending: false })
    .limit(5);

  return {
    total_customers: total || 0,
    new_customers: 0, // Simplified for now
    returning_customers: 0,
    top_buyers: (top as any) || [],
    latest_customers: (latest as any) || []
  };
}
