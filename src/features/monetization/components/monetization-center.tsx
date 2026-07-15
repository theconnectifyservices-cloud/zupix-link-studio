/**
 * LS-13E — Monetization Center: Upgrade Center, Add-ons, Credits, Usage,
 * Feature Flags catalog, Billing Events.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Zap,
  ShoppingBag,
  Sparkles,
  Gauge,
  Flag,
  Receipt,
  Loader2,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  listAddons,
  listBillingEvents,
  listCreditHistory,
  listPlanFeatures,
  listPlanLimits,
  listUsageCounters,
  listWorkspaceAddons,
} from "../api";
import { purchaseAddon } from "../entitlements.functions";
import { getWorkspaceSubscription } from "@/features/billing/api";
import { listPublicPlans, formatMoney } from "@/features/billing";
import { FEATURE_CATALOG, METRIC_CATALOG } from "../types";
import type { BillingPlan } from "@/features/billing";

interface Props {
  workspaceId: string;
  workspaceName: string;
}

export function MonetizationCenter({ workspaceId, workspaceName }: Props) {
  const qc = useQueryClient();

  const plansQ = useQuery({ queryKey: ["mon-plans"], queryFn: listPublicPlans, staleTime: 60_000 });
  const subQ = useQuery({
    queryKey: ["mon-sub", workspaceId],
    queryFn: () => getWorkspaceSubscription(workspaceId),
    staleTime: 30_000,
  });
  const addonsQ = useQuery({ queryKey: ["mon-addons"], queryFn: listAddons, staleTime: 60_000 });
  const wsAddonsQ = useQuery({
    queryKey: ["mon-ws-addons", workspaceId],
    queryFn: () => listWorkspaceAddons(workspaceId),
  });
  const usageQ = useQuery({
    queryKey: ["mon-usage", workspaceId],
    queryFn: () => listUsageCounters(workspaceId),
  });
  const featuresQ = useQuery({ queryKey: ["mon-plan-features"], queryFn: listPlanFeatures, staleTime: 60_000 });
  const limitsQ = useQuery({ queryKey: ["mon-plan-limits"], queryFn: listPlanLimits, staleTime: 60_000 });
  const creditsAiQ = useQuery({
    queryKey: ["mon-credits", workspaceId, "ai"],
    queryFn: () => listCreditHistory(workspaceId, "ai", 20),
  });
  const eventsQ = useQuery({
    queryKey: ["mon-events", workspaceId],
    queryFn: () => listBillingEvents(workspaceId, 30),
  });

  const purchaseFn = useServerFn(purchaseAddon);
  const purchaseMut = useMutation({
    mutationFn: (vars: { code: string; qty: number }) =>
      purchaseFn({ data: { workspace_id: workspaceId, addon_code: vars.code, quantity: vars.qty } }),
    onSuccess: () => {
      toast.success("Add-on purchased");
      qc.invalidateQueries({ queryKey: ["mon-ws-addons", workspaceId] });
      qc.invalidateQueries({ queryKey: ["mon-credits", workspaceId, "ai"] });
      qc.invalidateQueries({ queryKey: ["mon-events", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activePlan = useMemo<BillingPlan | undefined>(() => {
    const plans = plansQ.data ?? [];
    return plans.find((p) => p.id === subQ.data?.plan_id);
  }, [plansQ.data, subQ.data]);

  const recommendedPlan = useMemo<BillingPlan | undefined>(() => {
    const plans = plansQ.data ?? [];
    if (!activePlan) return plans[0];
    const idx = plans.findIndex((p) => p.id === activePlan.id);
    return plans[idx + 1];
  }, [plansQ.data, activePlan]);

  const currentCreditBalance = useMemo(() => {
    const last = (creditsAiQ.data ?? [])[0];
    return last?.balance_after ?? 0;
  }, [creditsAiQ.data]);

  const loading =
    plansQ.isLoading || subQ.isLoading || addonsQ.isLoading || usageQ.isLoading;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monetization</h1>
        <p className="text-sm text-muted-foreground">
          Manage plans, entitlements, usage limits, add-ons and credits for {workspaceName}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Current Plan" value={activePlan?.name ?? "Free"} />
        <StatCard icon={<Zap className="h-4 w-4" />} label="AI Credits" value={String(currentCreditBalance)} />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Active Add-ons" value={String((wsAddonsQ.data ?? []).filter((a) => a.status === "active").length)} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Tracked Metrics" value={String((usageQ.data ?? []).length)} />
      </div>

      <Tabs defaultValue="upgrade" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upgrade">Upgrade Center</TabsTrigger>
          <TabsTrigger value="usage">Usage &amp; Limits</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="events">Billing Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upgrade" className="space-y-4">
          <UpgradeCenter
            plans={plansQ.data ?? []}
            activePlan={activePlan}
            recommendedPlan={recommendedPlan}
            planFeatures={featuresQ.data ?? []}
          />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsagePanel
            counters={usageQ.data ?? []}
            planLimits={limitsQ.data ?? []}
            planId={activePlan?.id}
          />
        </TabsContent>

        <TabsContent value="addons" className="space-y-4">
          <AddonsPanel
            addons={addonsQ.data ?? []}
            active={wsAddonsQ.data ?? []}
            onBuy={(code) => purchaseMut.mutate({ code, qty: 1 })}
            buying={purchaseMut.isPending ? purchaseMut.variables?.code : null}
          />
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <CreditsPanel history={creditsAiQ.data ?? []} />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeatureFlagsPanel
            planFeatures={featuresQ.data ?? []}
            activePlanId={activePlan?.id}
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <EventsPanel events={eventsQ.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function UpgradeCenter({
  plans,
  activePlan,
  recommendedPlan,
  planFeatures,
}: {
  plans: BillingPlan[];
  activePlan?: BillingPlan;
  recommendedPlan?: BillingPlan;
  planFeatures: Array<{ plan_id: string; feature_key: string; enabled: boolean }>;
}) {
  const featureMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const pf of planFeatures) {
      if (!pf.enabled) continue;
      if (!m.has(pf.plan_id)) m.set(pf.plan_id, new Set());
      m.get(pf.plan_id)!.add(pf.feature_key);
    }
    return m;
  }, [planFeatures]);

  if (!plans.length) {
    return <EmptyState title="No plans configured" description="Ask an administrator to publish plans." />;
  }

  return (
    <div className="space-y-4">
      {recommendedPlan && (
        <Alert>
          <ArrowUpRight className="h-4 w-4" />
          <AlertTitle>Recommended upgrade: {recommendedPlan.name}</AlertTitle>
          <AlertDescription>
            Unlock more features and higher limits. Head to Billing to complete checkout.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = activePlan?.id === plan.id;
          const features = Array.from(featureMap.get(plan.id) ?? []);
          const price = plan.price_monthly_minor ?? 0;
          return (
            <Card key={plan.id} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{plan.tier}</p>
                  </div>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold">
                  {formatMoney(price, plan.currency)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/mo</span>
                </div>
                {plan.description && (
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                )}
                <ul className="space-y-1 text-sm">
                  {features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary" />
                      <span className="capitalize">{f.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                  {features.length === 0 && (
                    <li className="text-xs text-muted-foreground">No features mapped yet</li>
                  )}
                </ul>
                <Button variant={isCurrent ? "outline" : "default"} size="sm" className="w-full" asChild>
                  <a href="/app/billing">{isCurrent ? "Manage" : "Choose plan"}</a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function UsagePanel({
  counters,
  planLimits,
  planId,
}: {
  counters: Array<{ metric_key: string; value: number }>;
  planLimits: Array<{ plan_id: string; metric_key: string; limit_value: number; is_unlimited: boolean }>;
  planId?: string;
}) {
  const limitMap = useMemo(() => {
    const m = new Map<string, { limit: number; unlimited: boolean }>();
    for (const l of planLimits) {
      if (l.plan_id !== planId) continue;
      m.set(l.metric_key, { limit: l.limit_value, unlimited: l.is_unlimited });
    }
    return m;
  }, [planLimits, planId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Current usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {METRIC_CATALOG.map((m) => {
          const c = counters.find((x) => x.metric_key === m.key);
          const l = limitMap.get(m.key);
          const value = c?.value ?? 0;
          const limit = l?.unlimited ? Number.POSITIVE_INFINITY : l?.limit ?? 0;
          const pct = l?.unlimited || limit === 0 ? 0 : Math.min(100, (value / limit) * 100);
          return (
            <div key={m.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{m.name}</span>
                <span className="text-muted-foreground">
                  {value.toLocaleString()} /{" "}
                  {l?.unlimited ? "∞" : (l?.limit ?? 0).toLocaleString()} {m.unit}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AddonsPanel({
  addons,
  active,
  onBuy,
  buying,
}: {
  addons: Array<{ id: string; code: string; name: string; description: string | null; price_minor: number; currency: string; billing_cycle: string; category: string }>;
  active: Array<{ addon_id: string; status: string; quantity: number }>;
  onBuy: (code: string) => void;
  buying: string | null | undefined;
}) {
  const activeSet = new Set(active.filter((a) => a.status === "active").map((a) => a.addon_id));
  if (!addons.length)
    return <EmptyState icon={ShoppingBag} title="No add-ons available" description="Administrators can publish add-ons from the catalog." />;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {addons.map((a) => {
        const isActive = activeSet.has(a.id);
        return (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{a.name}</CardTitle>
                {isActive && <Badge variant="secondary">Active</Badge>}
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{a.category}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
              <div className="text-lg font-semibold">
                {formatMoney(a.price_minor, a.currency)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">/{a.billing_cycle}</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={buying === a.code}
                onClick={() => onBuy(a.code)}
              >
                {buying === a.code && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {isActive ? "Buy another" : "Purchase"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CreditsPanel({ history }: { history: Array<{ id: string; created_at: string; credit_type: string; delta: number; balance_after: number; reason: string }> }) {
  if (!history.length)
    return <EmptyState icon={Zap} title="No credit activity" description="Credit usage and grants will appear here." />;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Credit history</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="text-xs">{new Date(h.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{h.credit_type}</Badge></TableCell>
                <TableCell className={h.delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {h.delta > 0 ? "+" : ""}{h.delta}
                </TableCell>
                <TableCell>{h.balance_after}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{h.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FeatureFlagsPanel({
  planFeatures,
  activePlanId,
}: {
  planFeatures: Array<{ plan_id: string; feature_key: string; enabled: boolean }>;
  activePlanId?: string;
}) {
  const enabledSet = useMemo(() => {
    return new Set(
      planFeatures
        .filter((pf) => pf.plan_id === activePlanId && pf.enabled)
        .map((pf) => pf.feature_key),
    );
  }, [planFeatures, activePlanId]);

  const groups = useMemo(() => {
    const g: Record<string, typeof FEATURE_CATALOG> = { core: [], advanced: [], enterprise: [], beta: [] };
    for (const f of FEATURE_CATALOG) g[f.group].push(f);
    return g;
  }, []);

  return (
    <div className="space-y-4">
      {(Object.keys(groups) as Array<keyof typeof groups>).map((group) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{group} features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {groups[group].map((f) => {
                const on = enabledSet.has(f.key);
                return (
                  <div key={f.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Flag className="h-3 w-3 text-muted-foreground" />
                      {f.name}
                    </div>
                    <Badge variant={on ? "default" : "outline"}>{on ? "On" : "Off"}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsPanel({ events }: { events: Array<{ id: string; created_at: string; event_type: string; from_plan: string | null; to_plan: string | null; amount_minor: number | null; currency: string | null }> }) {
  if (!events.length)
    return <EmptyState icon={Receipt} title="No billing events yet" description="Upgrades, renewals and payment events will appear here." />;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{e.event_type.replace(/_/g, " ")}</Badge></TableCell>
                <TableCell className="text-xs">{e.from_plan ?? "—"}</TableCell>
                <TableCell className="text-xs">{e.to_plan ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {e.amount_minor != null ? formatMoney(e.amount_minor, e.currency ?? "INR") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Keep Separator import "used" for tree-shaking safety in future extensions
void Separator;
