import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Users, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PLAN_ORDER, formatPlanPrice, type PlanCode } from "@/features/subscription/plans";
import { updatePlan, setPlanFeature, setPlanLimit } from "@/features/subscription/admin.functions";
import { listWaitlist } from "@/features/subscription/waitlist.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/shared/navigation/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions · ZUPIX Admin" },
      { name: "description", content: "Manage plans, features and pricing for the ZUPIX platform." },
    ],
  }),
  component: SubscriptionAdmin,
});

interface PlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly_minor: number | null;
  price_yearly_minor: number | null;
  currency: string;
  is_active: boolean;
  is_public: boolean;
  metadata: Record<string, unknown> | null;
}

function SubscriptionAdmin() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Subscription Manager"
        description="Manage ZUPIX plans, feature access, pricing and waitlist."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Subscriptions" }]}
      />
      <Tabs defaultValue="plans" className="mt-6">
        <TabsList>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="features">Feature Matrix</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-6">
          <PlansTab />
        </TabsContent>
        <TabsContent value="features" className="mt-6">
          <FeaturesTab />
        </TabsContent>
        <TabsContent value="subscribers" className="mt-6">
          <SubscribersTab />
        </TabsContent>
        <TabsContent value="waitlist" className="mt-6">
          <WaitlistTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function usePlans() {
  return useQuery({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_plans")
        .select("id, code, name, description, price_monthly_minor, price_yearly_minor, currency, is_active, is_public, metadata")
        .in("code", ["udaan", "tejas", "shikhar"])
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as PlanRow[];
    },
  });
}

function PlansTab() {
  const { data: plans, isLoading } = usePlans();
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading plans…</div>;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans?.map((p) => <PlanEditor key={p.id} row={p} />)}
    </div>
  );
}

function PlanEditor({ row }: { row: PlanRow }) {
  const meta = PLANS[row.code as PlanCode];
  const qc = useQueryClient();
  const update = useServerFn(updatePlan);
  const [monthly, setMonthly] = useState((row.price_monthly_minor ?? 0) / 100);
  const [yearly, setYearly] = useState((row.price_yearly_minor ?? 0) / 100);
  const [isPublic, setIsPublic] = useState(row.is_public);
  const [isActive, setIsActive] = useState(row.is_active);

  const mut = useMutation({
    mutationFn: async () => {
      await update({
        data: {
          code: row.code,
          price_monthly_minor: Math.round(monthly * 100),
          price_yearly_minor: Math.round(yearly * 100),
          is_public: isPublic,
          is_active: isActive,
        },
      });
    },
    onSuccess: () => {
      toast.success(`${row.name} updated`);
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className={cn("bg-gradient-to-br text-white", meta?.gradient ?? "from-slate-600 to-slate-700")}>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-xl">{meta?.emoji}</span>
            {row.name}
          </span>
          <span className="text-xs opacity-80">{row.code}</span>
        </CardTitle>
        <p className="text-xs text-white/80">{meta?.tagline}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Monthly ({row.currency})</Label>
            <Input type="number" min={0} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Yearly ({row.currency})</Label>
            <Input type="number" min={0} value={yearly} onChange={(e) => setYearly(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Publicly listed</div>
            <div className="text-xs text-muted-foreground">Show on pricing page.</div>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Active</div>
            <div className="text-xs text-muted-foreground">New subscriptions allowed.</div>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        <Button className="w-full" onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}

function FeaturesTab() {
  const qc = useQueryClient();
  const setFeature = useServerFn(setPlanFeature);
  const setLimit = useServerFn(setPlanLimit);
  const { data: plans } = usePlans();
  const { data: features } = useQuery({
    queryKey: ["admin", "plan_features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_features")
        .select("id, plan_id, feature_key, enabled");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: limits } = useQuery({
    queryKey: ["admin", "plan_limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_limits")
        .select("id, plan_id, metric_key, limit_value, is_unlimited");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!plans || !features || !limits) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const featureKeys = Array.from(new Set(features.map((f) => f.feature_key))).sort();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-3 text-left font-medium">Feature key</th>
                {plans.map((p) => (
                  <th key={p.id} className="p-3 text-center font-medium">
                    {PLANS[p.code as PlanCode]?.emoji} {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((fk) => (
                <tr key={fk} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{fk}</td>
                  {plans.map((p) => {
                    const enabled = features.find((f) => f.plan_id === p.id && f.feature_key === fk)?.enabled ?? false;
                    return (
                      <td key={p.id} className="p-3 text-center">
                        <Switch
                          checked={enabled}
                          onCheckedChange={async (v) => {
                            try {
                              await setFeature({ data: { planCode: p.code, featureKey: fk, enabled: v } });
                              toast.success(`${p.name}: ${fk} → ${v ? "on" : "off"}`);
                              qc.invalidateQueries({ queryKey: ["admin", "plan_features"] });
                            } catch (e) {
                              toast.error((e as Error).message);
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Limits */}
              <tr className="border-b bg-muted/40">
                <td colSpan={1 + plans.length} className="p-2 text-xs font-semibold uppercase text-muted-foreground">
                  Limits
                </td>
              </tr>
              {Array.from(new Set(limits.map((l) => l.metric_key))).sort().map((mk) => (
                <tr key={mk} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{mk}</td>
                  {plans.map((p) => {
                    const l = limits.find((x) => x.plan_id === p.id && x.metric_key === mk);
                    return (
                      <td key={p.id} className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            defaultValue={l?.limit_value ?? 0}
                            disabled={l?.is_unlimited}
                            className="h-8 w-24 text-center"
                            onBlur={async (e) => {
                              const v = Number(e.target.value);
                              if (v === l?.limit_value) return;
                              try {
                                await setLimit({ data: { planCode: p.code, metricKey: mk, limitValue: v, isUnlimited: false } });
                                toast.success("Limit updated");
                                qc.invalidateQueries({ queryKey: ["admin", "plan_limits"] });
                              } catch (err) {
                                toast.error((err as Error).message);
                              }
                            }}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Switch
                              checked={l?.is_unlimited ?? false}
                              onCheckedChange={async (v) => {
                                try {
                                  await setLimit({ data: { planCode: p.code, metricKey: mk, limitValue: l?.limit_value ?? 0, isUnlimited: v } });
                                  qc.invalidateQueries({ queryKey: ["admin", "plan_limits"] });
                                } catch (err) {
                                  toast.error((err as Error).message);
                                }
                              }}
                            />
                            ∞
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscribersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_subscriptions")
        .select("id, workspace_id, plan_id, status, cycle, current_period_end, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const { data: plansData } = await supabase.from("billing_plans").select("id, code, name");
      const planById = new Map((plansData ?? []).map((p) => [p.id, p]));
      const counts: Record<string, number> = { udaan: 0, tejas: 0, shikhar: 0 };
      for (const row of data ?? []) {
        const code = planById.get(row.plan_id)?.code ?? "unknown";
        counts[code] = (counts[code] ?? 0) + 1;
      }
      return { rows: data ?? [], planById, counts };
    },
  });
  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading subscribers…</div>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {PLAN_ORDER.map((code) => (
          <Card key={code}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br text-white", PLANS[code].gradient)}>
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{PLANS[code].name}</div>
                <div className="text-2xl font-bold">{data.counts[code] ?? 0}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-3 text-left">Workspace</th>
                <th className="p-3 text-left">Plan</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Cycle</th>
                <th className="p-3 text-left">Renews</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const plan = data.planById.get(r.plan_id);
                return (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 font-mono text-xs">{r.workspace_id.slice(0, 8)}…</td>
                    <td className="p-3">{plan?.name ?? "—"}</td>
                    <td className="p-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        r.status === "active" && "bg-emerald-500/10 text-emerald-600",
                        r.status === "trialing" && "bg-blue-500/10 text-blue-600",
                        r.status === "past_due" && "bg-amber-500/10 text-amber-600",
                      )}>{r.status}</span>
                    </td>
                    <td className="p-3 capitalize">{r.cycle}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                    No active subscriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function WaitlistTab() {
  const list = useServerFn(listWaitlist);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "waitlist"],
    queryFn: () => list({ data: {} }),
  });
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading waitlist…</div>;
  const rows = (data as Array<{ id: string; email: string; plan_code: string; note: string | null; created_at: string }>) ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Waitlist ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Plan</th>
              <th className="p-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-3">{r.email}</td>
                <td className="p-3">
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    {PLANS[r.plan_code as PlanCode]?.name ?? r.plan_code}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-4 w-4" />
                  No one on the waitlist yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// unused imports guard
void formatPlanPrice;
