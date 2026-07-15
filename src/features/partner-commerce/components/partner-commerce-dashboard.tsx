import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DollarSign,
  Receipt,
  Wallet,
  Percent,
  TrendingUp,
  Store,
  Ticket,
  ShieldCheck,
  FileBarChart,
  Loader2,
  Plus,
  Star,
  StarOff,
  MoreHorizontal,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import {
  createInvoice,
  createPayout,
  deleteAsset,
  deleteCommissionRule,
  listAdminActions,
  listAssets,
  listCategories,
  listCommissionRules,
  listCommissions,
  listInvoices,
  listPayments,
  listPayouts,
  listPromotions,
  listSubscriptions,
  logAdminAction,
  markInvoicePaid,
  setAssetFeatured,
  setAssetStatus,
  setCommissionStatus,
  setPayoutStatus,
  setPromotionStatus,
  upsertAsset,
  upsertCommissionRule,
  upsertPromotion,
} from "../api";
import { loadPartnerAnalytics } from "../analytics";
import {
  COMMISSION_RULE_TYPES,
  MARKETPLACE_KINDS,
  MARKETPLACE_STATUSES,
  type CommissionRuleType,
  type MarketplaceKind,
  type MarketplaceStatus,
  type PayoutStatus,
  type PromotionStatus,
} from "../types";

interface Props {
  tenantId: string;
  tenantName: string;
  userId: string;
}

function fmtMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export function PartnerCommerceDashboard({ tenantId, tenantName, userId }: Props) {
  const qc = useQueryClient();
  const analyticsQ = useQuery({ queryKey: ["pc-analytics", tenantId], queryFn: () => loadPartnerAnalytics(tenantId) });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["pc-analytics", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-subs", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-inv", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-pay", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-crules", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-comm", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-pout", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-assets", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-promo", tenantId] });
    qc.invalidateQueries({ queryKey: ["pc-audit", tenantId] });
  };

  const a = analyticsQ.data;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Partner Commerce"
        description={`Billing · commissions · marketplace · payouts for ${tenantName}`}
      />


      {/* KPI GRID */}
      <div className="grid gap-3 border-b bg-muted/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="MRR" value={fmtMoney(a?.mrrCents ?? 0)} icon={<DollarSign className="h-4 w-4" />} />
        <Kpi label="ARR" value={fmtMoney(a?.arrCents ?? 0)} icon={<TrendingUp className="h-4 w-4" />} />
        <Kpi label="Active Clients" value={String(a?.activeClients ?? 0)} icon={<CheckCircle2 className="h-4 w-4" />} sub={`${a?.newClients ?? 0} new · 30d`} />
        <Kpi label="Churn Rate" value={`${(a?.churnRate ?? 0).toFixed(1)}%`} icon={<XCircle className="h-4 w-4" />} sub={`Growth ${(a?.revenueGrowth ?? 0).toFixed(1)}%`} />
        <Kpi label="Outstanding" value={fmtMoney(a?.outstandingCents ?? 0)} icon={<Receipt className="h-4 w-4" />} />
        <Kpi label="Total Paid" value={fmtMoney(a?.paidCents ?? 0)} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label="Pending Commissions" value={fmtMoney(a?.pendingCommissionsCents ?? 0)} icon={<Percent className="h-4 w-4" />} />
        <Kpi label="Paid Commissions" value={fmtMoney(a?.paidCommissionsCents ?? 0)} icon={<Percent className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="billing" className="w-full">
        <div className="border-b bg-background px-4">
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            <TabsTrigger value="billing"><Receipt className="mr-2 h-4 w-4" />Billing</TabsTrigger>
            <TabsTrigger value="commissions"><Percent className="mr-2 h-4 w-4" />Revenue Sharing</TabsTrigger>
            <TabsTrigger value="analytics"><TrendingUp className="mr-2 h-4 w-4" />Analytics</TabsTrigger>
            <TabsTrigger value="marketplace"><Store className="mr-2 h-4 w-4" />Marketplace</TabsTrigger>
            <TabsTrigger value="promotions"><Ticket className="mr-2 h-4 w-4" />Promotions</TabsTrigger>
            <TabsTrigger value="payouts"><Wallet className="mr-2 h-4 w-4" />Payouts</TabsTrigger>
            <TabsTrigger value="reports"><FileBarChart className="mr-2 h-4 w-4" />Reports</TabsTrigger>
            <TabsTrigger value="admin"><ShieldCheck className="mr-2 h-4 w-4" />Admin</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="billing" className="mt-0 p-4"><BillingTab tenantId={tenantId} onChange={invalidateAll} /></TabsContent>
        <TabsContent value="commissions" className="mt-0 p-4"><CommissionsTab tenantId={tenantId} onChange={invalidateAll} /></TabsContent>
        <TabsContent value="analytics" className="mt-0 p-4"><AnalyticsTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="marketplace" className="mt-0 p-4"><MarketplaceTab tenantId={tenantId} userId={userId} onChange={invalidateAll} /></TabsContent>
        <TabsContent value="promotions" className="mt-0 p-4"><PromotionsTab tenantId={tenantId} onChange={invalidateAll} /></TabsContent>
        <TabsContent value="payouts" className="mt-0 p-4"><PayoutsTab tenantId={tenantId} onChange={invalidateAll} /></TabsContent>
        <TabsContent value="reports" className="mt-0 p-4"><ReportsTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="admin" className="mt-0 p-4"><AdminTab tenantId={tenantId} userId={userId} onChange={invalidateAll} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

/* ==================== BILLING ==================== */
function BillingTab({ tenantId, onChange }: { tenantId: string; onChange: () => void }) {
  const subsQ = useQuery({ queryKey: ["pc-subs", tenantId], queryFn: () => listSubscriptions(tenantId) });
  const invQ = useQuery({ queryKey: ["pc-inv", tenantId], queryFn: () => listInvoices(tenantId) });
  const payQ = useQuery({ queryKey: ["pc-pay", tenantId], queryFn: () => listPayments(tenantId) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ number: "", amount: "", due: "" });

  const createMut = useMutation({
    mutationFn: async () => {
      await createInvoice({
        tenant_id: tenantId,
        number: form.number || `INV-${Date.now()}`,
        amount_cents: Math.round(Number(form.amount || 0) * 100),
        due_at: form.due ? new Date(form.due).toISOString() : null,
      });
    },
    onSuccess: () => { toast.success("Invoice created"); setOpen(false); setForm({ number: "", amount: "", due: "" }); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => markInvoicePaid(id),
    onSuccess: () => { toast.success("Marked paid"); onChange(); },
  });

  const sub = subsQ.data?.[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Partner Subscription</CardTitle></CardHeader>
          <CardContent>
            {sub ? (
              <>
                <p className="text-lg font-semibold">{sub.plan_key}</p>
                <p className="text-sm text-muted-foreground">{fmtMoney(sub.price_cents, sub.currency)} / {sub.billing_interval}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{sub.status}</Badge>
                  <span className="text-xs text-muted-foreground">Renews {fmtDate(sub.renewal_at)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No active subscription.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Outstanding Balance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{fmtMoney((invQ.data ?? []).filter((i) => i.status === "open" || i.status === "overdue").reduce((s, i) => s + i.amount_cents, 0))}</p>
            <p className="text-xs text-muted-foreground">{(invQ.data ?? []).filter((i) => i.status === "open" || i.status === "overdue").length} open invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Renewal Tracking</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">Next renewal</p>
            <p className="text-lg font-semibold">{fmtDate(sub?.renewal_at ?? null)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div><CardTitle className="text-sm">Invoice History</CardTitle><CardDescription>All partner invoices</CardDescription></div>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New Invoice</Button>
        </CardHeader>
        <CardContent className="p-0">
          {(invQ.data ?? []).length === 0 ? (
            <EmptyState title="No invoices yet" description="Invoices generated for this partner will appear here." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Number</th><th className="p-3">Issued</th><th className="p-3">Due</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {(invQ.data ?? []).map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="p-3 font-mono">{i.number}</td>
                    <td className="p-3">{fmtDate(i.issued_at)}</td>
                    <td className="p-3">{fmtDate(i.due_at)}</td>
                    <td className="p-3">{fmtMoney(i.amount_cents, i.currency)}</td>
                    <td className="p-3"><Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "outline"}>{i.status}</Badge></td>
                    <td className="p-3 text-right">
                      {i.status !== "paid" && <Button size="sm" variant="ghost" onClick={() => markPaid.mutate(i.id)}>Mark paid</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {(payQ.data ?? []).length === 0 ? (
            <EmptyState title="No payments yet" description="Recorded payments appear here." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Date</th><th className="p-3">Method</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Reference</th></tr>
              </thead>
              <tbody>
                {(payQ.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">{fmtDate(p.paid_at ?? p.created_at)}</td>
                    <td className="p-3">{p.method ?? "—"}</td>
                    <td className="p-3">{fmtMoney(p.amount_cents, p.currency)}</td>
                    <td className="p-3"><Badge variant="outline">{p.status}</Badge></td>
                    <td className="p-3 font-mono text-xs">{p.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Invoice</DialogTitle><DialogDescription>Create a partner invoice.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Number</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="INV-2026-0001" /></div>
            <div><Label>Amount (USD)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.amount} onClick={() => createMut.mutate()}>
              {createMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================== COMMISSIONS ==================== */
function CommissionsTab({ tenantId, onChange }: { tenantId: string; onChange: () => void }) {
  const rulesQ = useQuery({ queryKey: ["pc-crules", tenantId], queryFn: () => listCommissionRules(tenantId) });
  const commQ = useQuery({ queryKey: ["pc-comm", tenantId], queryFn: () => listCommissions(tenantId) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; rule_type: CommissionRuleType; value: string; priority: string }>({ name: "", rule_type: "percentage", value: "20", priority: "100" });

  const saveMut = useMutation({
    mutationFn: () => upsertCommissionRule({
      tenant_id: tenantId, name: form.name, rule_type: form.rule_type,
      value: Number(form.value || 0), priority: Number(form.priority || 100), active: true,
    }),
    onSuccess: () => { toast.success("Rule saved"); setOpen(false); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({ mutationFn: (id: string) => deleteCommissionRule(id), onSuccess: () => { toast.success("Deleted"); onChange(); } });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "approved" | "paid" | "void" }) => setCommissionStatus(id, status),
    onSuccess: () => { toast.success("Updated"); onChange(); },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div><CardTitle className="text-sm">Commission Rules</CardTitle><CardDescription>Fixed, percentage, tiered or custom rules per partner or client.</CardDescription></div>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New Rule</Button>
        </CardHeader>
        <CardContent className="p-0">
          {(rulesQ.data ?? []).length === 0 ? (
            <EmptyState title="No rules configured" description="Add your first rule to start tracking commissions." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Value</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {(rulesQ.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3"><Badge variant="outline">{r.rule_type}</Badge></td>
                    <td className="p-3 tabular-nums">{r.rule_type === "fixed" ? fmtMoney(r.value * 100) : `${r.value}%`}</td>
                    <td className="p-3 tabular-nums">{r.priority}</td>
                    <td className="p-3"><Badge variant={r.active ? "default" : "outline"}>{r.active ? "Active" : "Off"}</Badge></td>
                    <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => delMut.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Commission History</CardTitle><CardDescription>Earned, pending and paid.</CardDescription></CardHeader>
        <CardContent className="p-0">
          {(commQ.data ?? []).length === 0 ? (
            <EmptyState title="No commissions yet" description="Commissions will appear here as clients transact." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Earned</th><th className="p-3">Client</th><th className="p-3">Base</th><th className="p-3">Commission</th><th className="p-3">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {(commQ.data ?? []).slice(0, 50).map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3">{fmtDate(c.earned_at)}</td>
                    <td className="p-3 font-mono text-xs">{c.client_id?.slice(0, 8) ?? "—"}</td>
                    <td className="p-3 tabular-nums">{fmtMoney(c.base_amount_cents, c.currency)}</td>
                    <td className="p-3 tabular-nums font-semibold">{fmtMoney(c.commission_cents, c.currency)}</td>
                    <td className="p-3"><Badge variant={c.status === "paid" ? "default" : c.status === "void" ? "destructive" : "outline"}>{c.status}</Badge></td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: c.id, status: "approved" })}>Approve</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: c.id, status: "paid" })}>Mark paid</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: c.id, status: "void" })}>Void</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Commission Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Standard 20%" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v as CommissionRuleType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COMMISSION_RULE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value ({form.rule_type === "fixed" ? "USD per sale" : "% of sale"})</Label>
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div><Label>Priority (lower = higher)</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saveMut.isPending || !form.name} onClick={() => saveMut.mutate()}>
              {saveMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================== ANALYTICS ==================== */
function AnalyticsTab({ tenantId }: { tenantId: string }) {
  const q = useQuery({ queryKey: ["pc-analytics", tenantId], queryFn: () => loadPartnerAnalytics(tenantId) });
  const a = q.data;
  if (q.isLoading || !a) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading analytics…</div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Storage Usage" value={`${(a.storageMb / 1024).toFixed(2)} GB`} icon={<TrendingUp className="h-4 w-4" />} />
        <Kpi label="AI Credit Usage" value={a.aiCredits.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <Kpi label="Revenue Growth (30d)" value={`${a.revenueGrowth.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Top Clients by Commission</CardTitle></CardHeader>
        <CardContent className="p-0">
          {a.topClients.length === 0 ? (
            <EmptyState title="No client revenue yet" description="Top revenue-generating clients will surface here." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">#</th><th className="p-3">Client</th><th className="p-3">Commission</th></tr>
              </thead>
              <tbody>
                {a.topClients.map((c, i) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3 tabular-nums">{i + 1}</td>
                    <td className="p-3 font-medium">{c.company_name}</td>
                    <td className="p-3 tabular-nums">{fmtMoney(c.revenue_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== MARKETPLACE ==================== */
function MarketplaceTab({ tenantId, userId, onChange }: { tenantId: string; userId: string; onChange: () => void }) {
  const [kind, setKind] = useState<MarketplaceKind | "all">("all");
  const [status, setStatus] = useState<MarketplaceStatus | "all">("all");
  const assetsQ = useQuery({ queryKey: ["pc-assets", tenantId, kind, status], queryFn: () => listAssets(tenantId, status, kind) });
  const catsQ = useQuery({ queryKey: ["pc-cats"], queryFn: () => listCategories() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", kind: "template" as MarketplaceKind, category_key: "", price: "0", version: "1.0.0", description: "" });

  const saveMut = useMutation({
    mutationFn: () => upsertAsset({
      tenant_id: tenantId, kind: form.kind, title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: form.description, price_cents: Math.round(Number(form.price || 0) * 100),
      category_key: form.category_key || null, version: form.version, status: "draft", created_by: userId,
    }),
    onSuccess: () => { toast.success("Asset created"); setOpen(false); setForm({ title: "", slug: "", kind: "template", category_key: "", price: "0", version: "1.0.0", description: "" }); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const stMut = useMutation({ mutationFn: ({ id, s }: { id: string; s: MarketplaceStatus }) => setAssetStatus(id, s), onSuccess: () => { toast.success("Updated"); onChange(); } });
  const ftMut = useMutation({ mutationFn: ({ id, f }: { id: string; f: boolean }) => setAssetFeatured(id, f), onSuccess: () => { toast.success("Updated"); onChange(); } });
  const delMut = useMutation({ mutationFn: (id: string) => deleteAsset(id), onSuccess: () => { toast.success("Deleted"); onChange(); } });

  const filteredCats = useMemo(() => (catsQ.data ?? []).filter((c) => c.kind === form.kind), [catsQ.data, form.kind]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={kind} onValueChange={(v) => setKind(v as MarketplaceKind | "all")}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            {MARKETPLACE_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as MarketplaceStatus | "all")}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {MARKETPLACE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New Asset</Button>
      </div>

      {(assetsQ.data ?? []).length === 0 ? (
        <EmptyState title="No marketplace assets" description="Publish premium templates, themes, components, prompt packs and brand kits." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(assetsQ.data ?? []).map((asset) => (
            <Card key={asset.id} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{asset.title}</CardTitle>
                    <CardDescription className="font-mono text-xs">{asset.slug} · v{asset.version}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">{asset.kind}</Badge>
                    <Badge variant={asset.status === "published" ? "default" : "outline"}>{asset.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="line-clamp-2 text-sm text-muted-foreground">{asset.description ?? "—"}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{fmtMoney(asset.price_cents, asset.currency)}</span>
                  <span>{asset.downloads} downloads · ★ {asset.rating.toFixed(1)}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {asset.status !== "published" && <Button size="sm" variant="outline" onClick={() => stMut.mutate({ id: asset.id, s: "published" })}>Publish</Button>}
                  {asset.status === "published" && <Button size="sm" variant="outline" onClick={() => stMut.mutate({ id: asset.id, s: "unpublished" })}>Unpublish</Button>}
                  <Button size="sm" variant="ghost" onClick={() => ftMut.mutate({ id: asset.id, f: !asset.featured })}>
                    {asset.featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => delMut.mutate(asset.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Marketplace Asset</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>
            <div>
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as MarketplaceKind, category_key: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MARKETPLACE_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category_key || "none"} onValueChange={(v) => setForm({ ...form, category_key: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredCats.map((c) => <SelectItem key={c.id} value={c.key}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Price (USD)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>Version</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saveMut.isPending || !form.title} onClick={() => saveMut.mutate()}>
              {saveMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================== PROMOTIONS ==================== */
function PromotionsTab({ tenantId, onChange }: { tenantId: string; onChange: () => void }) {
  const q = useQuery({ queryKey: ["pc-promo", tenantId], queryFn: () => listPromotions(tenantId) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", discount_type: "percentage" as "percentage" | "fixed", discount_value: "10", starts_at: "", ends_at: "", max_redemptions: "", campaign_key: "" });

  const saveMut = useMutation({
    mutationFn: () => upsertPromotion({
      tenant_id: tenantId, code: form.code.toUpperCase(), name: form.name,
      discount_type: form.discount_type, discount_value: Number(form.discount_value || 0),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      campaign_key: form.campaign_key || null, status: "active",
    }),
    onSuccess: () => { toast.success("Promotion saved"); setOpen(false); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const stMut = useMutation({ mutationFn: ({ id, s }: { id: string; s: PromotionStatus }) => setPromotionStatus(id, s), onSuccess: () => { toast.success("Updated"); onChange(); } });

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New Promotion</Button></div>
      {(q.data ?? []).length === 0 ? (
        <EmptyState title="No promotions yet" description="Launch partner coupons, campaign discounts and limited-time offers." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Discount</th><th className="p-3">Window</th><th className="p-3">Redemptions</th><th className="p-3">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3 font-mono">{p.code}</td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.discount_type === "percentage" ? `${p.discount_value}%` : fmtMoney(p.discount_value * 100)}</td>
                    <td className="p-3 text-xs">{fmtDate(p.starts_at)} → {fmtDate(p.ends_at)}</td>
                    <td className="p-3 tabular-nums">{p.redemptions}{p.max_redemptions ? ` / ${p.max_redemptions}` : ""}</td>
                    <td className="p-3"><Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge></td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "active" })}>Activate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "disabled" })}>Disable</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "expired" })}>Mark expired</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Promotion</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LAUNCH25" /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Discount Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v as "percentage" | "fixed" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed (USD)</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Value</Label><Input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
            <div><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            <div><Label>Max Redemptions</Label><Input type="number" value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })} placeholder="Unlimited" /></div>
            <div><Label>Campaign Key</Label><Input value={form.campaign_key} onChange={(e) => setForm({ ...form, campaign_key: e.target.value })} placeholder="launch-2026" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saveMut.isPending || !form.code || !form.name} onClick={() => saveMut.mutate()}>
              {saveMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================== PAYOUTS ==================== */
function PayoutsTab({ tenantId, onChange }: { tenantId: string; onChange: () => void }) {
  const q = useQuery({ queryKey: ["pc-pout", tenantId], queryFn: () => listPayouts(tenantId) });
  const analyticsQ = useQuery({ queryKey: ["pc-analytics", tenantId], queryFn: () => loadPartnerAnalytics(tenantId) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "bank", notes: "" });

  const createMut = useMutation({
    mutationFn: () => createPayout({ tenant_id: tenantId, amount_cents: Math.round(Number(form.amount || 0) * 100), method: form.method, notes: form.notes || undefined }),
    onSuccess: () => { toast.success("Payout requested"); setOpen(false); setForm({ amount: "", method: "bank", notes: "" }); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const stMut = useMutation({ mutationFn: ({ id, s }: { id: string; s: PayoutStatus }) => setPayoutStatus(id, s), onSuccess: () => { toast.success("Updated"); onChange(); } });

  const a = analyticsQ.data;
  const rows = q.data ?? [];
  const pendingEarnings = a?.pendingCommissionsCents ?? 0;
  const paidEarnings = a?.paidCommissionsCents ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Pending Earnings" value={fmtMoney(pendingEarnings)} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label="Paid Earnings" value={fmtMoney(paidEarnings)} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label="Payouts Processed" value={String(rows.filter((p) => p.status === "paid").length)} icon={<Wallet className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div><CardTitle className="text-sm">Payout History</CardTitle></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => exportRowsCsv(rows.map((p) => ({ id: p.id, amount: p.amount_cents / 100, currency: p.currency, status: p.status, method: p.method ?? "", requested_at: p.requested_at, paid_at: p.paid_at ?? "" })), "payouts")}><Download className="mr-1 h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Request Payout</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState title="No payouts yet" description="Request your first payout when you have pending earnings." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Requested</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Paid</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">{fmtDate(p.requested_at)}</td>
                    <td className="p-3 tabular-nums">{fmtMoney(p.amount_cents, p.currency)}</td>
                    <td className="p-3">{p.method ?? "—"}</td>
                    <td className="p-3"><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "outline"}>{p.status}</Badge></td>
                    <td className="p-3">{fmtDate(p.paid_at)}</td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "processing" })}>Mark processing</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "paid" })}>Mark paid</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "failed" })}>Failed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => stMut.mutate({ id: p.id, s: "cancelled" })}>Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (USD)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div>
              <Label>Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="bank">Bank Transfer</SelectItem><SelectItem value="paypal">PayPal</SelectItem><SelectItem value="stripe">Stripe</SelectItem><SelectItem value="wise">Wise</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={createMut.isPending || !form.amount} onClick={() => createMut.mutate()}>
              {createMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================== REPORTS ==================== */
function ReportsTab({ tenantId }: { tenantId: string }) {
  const [running, setRunning] = useState<string | null>(null);
  async function generate(kind: "revenue" | "commission" | "growth" | "acquisition" | "usage") {
    setRunning(kind);
    try {
      const analytics = await loadPartnerAnalytics(tenantId);
      const [inv, comm, clients] = await Promise.all([
        listInvoices(tenantId),
        listCommissions(tenantId),
        (async () => {
          const { data, error } = await import("@/integrations/supabase/client").then(({ supabase }) =>
            supabase.from("reseller_clients" as never).select("id, company_name, status, created_at, plan_key").eq("tenant_id", tenantId),
          );
          if (error) throw error;
          return (data as Array<{ id: string; company_name: string; status: string; created_at: string; plan_key: string | null }>) ?? [];
        })(),
      ]);
      let rows: Record<string, unknown>[] = [];
      if (kind === "revenue") rows = inv.map((i) => ({ number: i.number, issued: i.issued_at, status: i.status, amount: i.amount_cents / 100, currency: i.currency }));
      if (kind === "commission") rows = comm.map((c) => ({ earned: c.earned_at, client_id: c.client_id ?? "", base: c.base_amount_cents / 100, commission: c.commission_cents / 100, status: c.status }));
      if (kind === "growth") rows = [{ mrr: analytics.mrrCents / 100, arr: analytics.arrCents / 100, growth_pct: analytics.revenueGrowth, new_clients: analytics.newClients, churn_pct: analytics.churnRate }];
      if (kind === "acquisition") rows = clients.map((c) => ({ id: c.id, name: c.company_name, status: c.status, plan: c.plan_key ?? "", created: c.created_at }));
      if (kind === "usage") rows = [{ storage_mb: analytics.storageMb, ai_credits: analytics.aiCredits, active_clients: analytics.activeClients }];
      exportRowsCsv(rows, `${kind}-report`);
      toast.success("Report exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally { setRunning(null); }
  }

  const reports: Array<{ key: "revenue" | "commission" | "growth" | "acquisition" | "usage"; label: string; description: string }> = [
    { key: "revenue", label: "Revenue Report", description: "All invoices with amount, status and dates." },
    { key: "commission", label: "Commission Report", description: "Every commission earned with base, rate and status." },
    { key: "growth", label: "Growth Report", description: "MRR, ARR, growth %, new clients, churn." },
    { key: "acquisition", label: "Client Acquisition", description: "Clients added with plan and lifecycle status." },
    { key: "usage", label: "Usage Report", description: "Aggregate storage, AI credits and active clients." },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((r) => (
        <Card key={r.key}>
          <CardHeader><CardTitle className="text-sm">{r.label}</CardTitle><CardDescription>{r.description}</CardDescription></CardHeader>
          <CardContent>
            <Button size="sm" onClick={() => generate(r.key)} disabled={running !== null}>
              {running === r.key ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
              Generate CSV
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ==================== ADMIN ==================== */
function AdminTab({ tenantId, userId, onChange }: { tenantId: string; userId: string; onChange: () => void }) {
  const auditQ = useQuery({ queryKey: ["pc-audit", tenantId], queryFn: () => listAdminActions(tenantId) });

  const log = useMutation({
    mutationFn: (action: string) => logAdminAction({ actor_id: userId, tenant_id: tenantId, action }),
    onSuccess: () => { toast.success("Recorded"); onChange(); },
  });

  const actions: Array<{ key: string; label: string; description: string }> = [
    { key: "partner.approve", label: "Approve Partner", description: "Move partner from pending to approved." },
    { key: "partner.suspend", label: "Suspend Partner", description: "Freeze commissions, payouts and new invoices." },
    { key: "commission.adjust", label: "Adjust Commission Rules", description: "Override commission calculation policy." },
    { key: "marketplace.moderate", label: "Moderate Marketplace", description: "Review, approve, or reject submissions." },
    { key: "categories.manage", label: "Manage Categories", description: "Add or edit marketplace categories." },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((a) => (
          <Card key={a.key}>
            <CardHeader><CardTitle className="text-sm">{a.label}</CardTitle><CardDescription>{a.description}</CardDescription></CardHeader>
            <CardContent><Button size="sm" variant="outline" onClick={() => log.mutate(a.key)}>Record action</Button></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Audit Log</CardTitle><CardDescription>Administrative actions on this partner.</CardDescription></CardHeader>
        <CardContent className="p-0">
          {(auditQ.data ?? []).length === 0 ? (
            <EmptyState title="No admin actions yet" description="Approvals, suspensions and moderation events land here." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody>
                {(auditQ.data ?? []).map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="p-3">{fmtDate(a.created_at)}</td>
                    <td className="p-3 font-mono text-xs">{a.actor_id?.slice(0, 8) ?? "system"}</td>
                    <td className="p-3">{a.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== UTIL ==================== */
function exportRowsCsv(rows: Record<string, unknown>[], name: string) {
  if (rows.length === 0) {
    const blob = new Blob(["no data\n"], { type: "text/csv" });
    triggerDownload(blob, `${name}.csv`);
    return;
  }
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv" }), `${name}.csv`);
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
