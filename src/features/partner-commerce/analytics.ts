import { supabase } from "@/integrations/supabase/client";

export interface PartnerAnalytics {
  mrrCents: number;
  arrCents: number;
  newClients: number;
  activeClients: number;
  churnedClients: number;
  churnRate: number;
  revenueGrowth: number;
  topClients: Array<{ id: string; company_name: string; revenue_cents: number }>;
  storageMb: number;
  aiCredits: number;
  outstandingCents: number;
  paidCents: number;
  pendingCommissionsCents: number;
  paidCommissionsCents: number;
}

export async function loadPartnerAnalytics(tenantId: string): Promise<PartnerAnalytics> {
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 86400_000).toISOString();
  const sixtyAgo = new Date(now.getTime() - 60 * 86400_000).toISOString();

  const [clientsRes, invoicesRes, commissionsRes] = await Promise.all([
    supabase.from("reseller_clients" as never).select("id, company_name, status, usage, created_at").eq("tenant_id", tenantId),
    supabase.from("partner_invoices" as never).select("amount_cents, status, issued_at, paid_at, metadata").eq("tenant_id", tenantId),
    supabase.from("commissions" as never).select("client_id, commission_cents, status, earned_at").eq("tenant_id", tenantId),
  ]);
  if (clientsRes.error) throw clientsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;
  if (commissionsRes.error) throw commissionsRes.error;

  const clients = (clientsRes.data as Array<{ id: string; company_name: string; status: string; usage: Record<string, number> | null; created_at: string }>) ?? [];
  const invoices = (invoicesRes.data as Array<{ amount_cents: number; status: string; issued_at: string; paid_at: string | null }>) ?? [];
  const commissions = (commissionsRes.data as Array<{ client_id: string | null; commission_cents: number; status: string; earned_at: string }>) ?? [];

  const active = clients.filter((c) => c.status === "active" || c.status === "trial");
  const newClients = clients.filter((c) => c.created_at >= thirtyAgo).length;
  const churned = clients.filter((c) => (c.status === "cancelled" || c.status === "expired") && c.created_at >= thirtyAgo).length;
  const churnRate = active.length + churned > 0 ? (churned / (active.length + churned)) * 100 : 0;

  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const last30 = paidInvoices.filter((i) => (i.paid_at ?? i.issued_at) >= thirtyAgo).reduce((s, i) => s + i.amount_cents, 0);
  const prev30 = paidInvoices.filter((i) => (i.paid_at ?? i.issued_at) >= sixtyAgo && (i.paid_at ?? i.issued_at) < thirtyAgo).reduce((s, i) => s + i.amount_cents, 0);
  const revenueGrowth = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : last30 > 0 ? 100 : 0;
  const mrr = last30;
  const arr = mrr * 12;

  const outstanding = invoices.filter((i) => i.status === "open" || i.status === "overdue").reduce((s, i) => s + i.amount_cents, 0);
  const paidTotal = paidInvoices.reduce((s, i) => s + i.amount_cents, 0);

  const perClient = new Map<string, number>();
  for (const c of commissions) {
    if (!c.client_id) continue;
    perClient.set(c.client_id, (perClient.get(c.client_id) ?? 0) + c.commission_cents);
  }
  const nameById = new Map(clients.map((c) => [c.id, c.company_name]));
  const topClients = [...perClient.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, cents]) => ({ id, company_name: nameById.get(id) ?? "Unknown", revenue_cents: cents }));

  const storageMb = clients.reduce((s, c) => s + (c.usage?.storage_mb ?? 0), 0);
  const aiCredits = clients.reduce((s, c) => s + (c.usage?.ai_credits ?? 0), 0);
  const pendingCommissionsCents = commissions.filter((c) => c.status === "pending" || c.status === "approved").reduce((s, c) => s + c.commission_cents, 0);
  const paidCommissionsCents = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commission_cents, 0);

  return {
    mrrCents: mrr,
    arrCents: arr,
    newClients,
    activeClients: active.length,
    churnedClients: churned,
    churnRate,
    revenueGrowth,
    topClients,
    storageMb,
    aiCredits,
    outstandingCents: outstanding,
    paidCents: paidTotal,
    pendingCommissionsCents,
    paidCommissionsCents,
  };
}
