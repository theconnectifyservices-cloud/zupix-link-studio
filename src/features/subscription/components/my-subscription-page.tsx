/** Customer-facing "My Subscription Plan" page. */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Sparkles, CalendarClock, Wallet, Download, ArrowUpCircle,
  History, ShieldCheck, Zap, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { PLANS, formatPlanPrice, type PlanCode } from "../plans";
import { getMySubscription, listMyInvoices } from "../customer.functions";
import { cn } from "@/lib/utils";

export function MySubscriptionPage() {
  const { workspace } = useCurrentWorkspace();
  const getSub = useServerFn(getMySubscription);
  const listInv = useServerFn(listMyInvoices);

  const subQ = useQuery({
    queryKey: ["my-subscription", workspace?.id],
    queryFn: () => getSub({ data: { workspaceId: workspace!.id } }),
    enabled: !!workspace?.id,
  });
  const invQ = useQuery({
    queryKey: ["my-invoices", workspace?.id],
    queryFn: () => listInv({ data: { workspaceId: workspace!.id } }),
    enabled: !!workspace?.id,
  });

  const sub = subQ.data?.subscription;
  const planCode = (sub?.plan_code as PlanCode) ?? "udaan";
  const planMeta = PLANS[planCode] ?? PLANS.udaan;

  const limitsMap = useMemo(() => {
    const m: Record<string, { limit_value: number; is_unlimited: boolean }> = {};
    for (const l of subQ.data?.limits ?? []) m[l.metric_key] = { limit_value: Number(l.limit_value), is_unlimited: !!l.is_unlimited };
    return m;
  }, [subQ.data]);

  const usage = subQ.data?.usage ?? { bio_pages: 0, custom_domains: 0 };
  const invoices = invQ.data ?? [];
  const latestInvoice = invoices.find((i: any) => i.status === "paid");

  const expiry = sub?.current_period_end ?? sub?.trial_end ?? null;
  const daysRemaining = expiry ? Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)) : null;

  if (subQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> My Subscription Plan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your current plan, usage and billing history.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className={cn("bg-gradient-to-br text-white", planMeta.gradient)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{planMeta.emoji}</span>
              <div>
                <CardTitle className="text-2xl">{planMeta.name}</CardTitle>
                <p className="text-sm text-white/80">{planMeta.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={sub?.status ?? "none"} />
              {planMeta.badge && <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{planMeta.badge}</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox
              icon={<Wallet className="h-4 w-4" />} label="Price"
              value={sub ? formatPlanPrice(sub.unit_amount_minor ?? 0, sub.currency ?? "INR") : "Free"}
              hint={sub?.cycle ? `per ${sub.cycle}` : ""}
            />
            <InfoBox icon={<CalendarClock className="h-4 w-4" />} label="Start" value={fmt(sub?.current_period_start ?? sub?.trial_start)} />
            <InfoBox icon={<CalendarClock className="h-4 w-4" />} label="Expiry" value={fmt(expiry)} />
            <InfoBox
              icon={<Zap className="h-4 w-4" />} label="Days remaining"
              value={daysRemaining === null ? "—" : `${daysRemaining} days`}
              hint={sub?.cancel_at_period_end ? "Cancels at period end" : "Auto-renew on"}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UsageBar
              label="Mini websites"
              used={usage.bio_pages}
              limit={limitsMap.bio_pages}
            />
            <UsageBar
              label="Custom domains"
              used={usage.custom_domains}
              limit={limitsMap.custom_domains}
            />
            <UsageBar
              label="Storage"
              used={0}
              limit={limitsMap.storage_gb}
              suffix="GB"
            />
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Plan features
            </div>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {planMeta.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild>
              <Link to="/pricing"><ArrowUpCircle className="h-4 w-4 mr-2" /> Upgrade plan</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing"><Sparkles className="h-4 w-4 mr-2" /> Renew plan</Link>
            </Button>
            {latestInvoice?.pdf_url ? (
              <Button variant="outline" asChild>
                <a href={latestInvoice.pdf_url} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4 mr-2" /> Download invoice
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" /> Download invoice
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Billing history
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invQ.isLoading ? (
            <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Issued</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{inv.invoice_number ?? inv.id.slice(0, 8)}</td>
                      <td className="p-3"><Badge variant="secondary" className="capitalize">{inv.status}</Badge></td>
                      <td className="p-3">{formatPlanPrice(inv.total_minor ?? 0, inv.currency ?? "INR")}</td>
                      <td className="p-3 text-xs">{fmt(inv.issued_at)}</td>
                      <td className="p-3 text-xs">{fmt(inv.paid_at)}</td>
                      <td className="p-3 text-right">
                        {inv.pdf_url ? (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={inv.pdf_url} target="_blank" rel="noreferrer">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function UsageBar({
  label, used, limit, suffix,
}: { label: string; used: number; limit?: { limit_value: number; is_unlimited: boolean }; suffix?: string }) {
  const isUnlimited = limit?.is_unlimited ?? false;
  const max = limit ? Number(limit.limit_value) : 0;
  const pct = isUnlimited ? 5 : max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}{suffix ? suffix : ""} / {isUnlimited ? "∞" : `${max}${suffix ? suffix : ""}`}
        </span>
      </div>
      <Progress value={pct} className="mt-2 h-2" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active" ? "bg-emerald-500 text-white" :
    status === "trialing" ? "bg-blue-500 text-white" :
    status === "past_due" ? "bg-amber-500 text-white" :
    status === "paused" ? "bg-slate-500 text-white" :
    status === "canceled" || status === "expired" ? "bg-red-500 text-white" :
    "bg-white/20 text-white";
  return <Badge className={cn("border-0 uppercase tracking-wide text-[10px]", tone)}>{status}</Badge>;
}

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}
