/** Assign Plan modal — used from the Subscription Management table. */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { assignSubscriptionPlan } from "../management.functions";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string | null;
  workspaceName?: string;
}

const FEATURE_TOGGLES: Array<{ key: string; label: string }> = [
  { key: "themes_access", label: "Themes access" },
  { key: "premium_templates", label: "Premium templates" },
  { key: "analytics_access", label: "Analytics access" },
  { key: "verified_badge", label: "Verified badge" },
  { key: "ai_features", label: "AI features" },
  { key: "priority_support", label: "Priority support" },
  { key: "api_access", label: "API access" },
  { key: "custom_branding", label: "Custom branding / white-label" },
];

export function AssignPlanDialog({ open, onOpenChange, workspaceId, workspaceName }: Props) {
  const qc = useQueryClient();
  const assignFn = useServerFn(assignSubscriptionPlan);

  const [planCode, setPlanCode] = useState<string>("tejas");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [customDays, setCustomDays] = useState<number>(30);
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [overridePrice, setOverridePrice] = useState(false);
  const [storage, setStorage] = useState<number>(5);
  const [miniSites, setMiniSites] = useState<number>(3);
  const [customDomains, setCustomDomains] = useState<number>(1);
  const [customSubdomain, setCustomSubdomain] = useState("");
  const [teamMembers, setTeamMembers] = useState<number>(1);
  const [note, setNote] = useState("");
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  const plansQ = useQuery({
    queryKey: ["assign-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_plans")
        .select("id, code, name, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
        .eq("is_active", true)
        .order("price_monthly_minor", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  useEffect(() => {
    const p = (plansQ.data ?? []).find((x) => x.code === planCode);
    if (!p || overridePrice) return;
    const minor =
      cycle === "monthly" ? p.price_monthly_minor :
      cycle === "quarterly" ? p.price_quarterly_minor :
      cycle === "yearly" ? p.price_yearly_minor :
      p.price_lifetime_minor;
    setPrice(Number(minor ?? 0) / 100);
  }, [planCode, cycle, plansQ.data, overridePrice]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("Select a workspace first");
      const overrides: Record<string, unknown> = {
        storage_gb: storage,
        mini_websites: miniSites,
        custom_domains: customDomains,
        custom_subdomain: customSubdomain || null,
        team_members: teamMembers,
        ...toggles,
      };
      return assignFn({
        data: {
          workspaceId,
          planCode,
          cycle,
          durationDays: useCustomDuration ? customDays : undefined,
          priceMinor: overridePrice ? Math.round(price * 100) : undefined,
          overrides,
          note: note || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success(`Plan assigned to ${workspaceName ?? "workspace"}`);
      qc.invalidateQueries({ queryKey: ["admin", "customer-subs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Assign plan
          </DialogTitle>
          <DialogDescription>
            {workspaceName ? <>Configure a plan for <b>{workspaceName}</b>.</> : "Configure a plan for this customer."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Plan</Label>
              <Select value={planCode} onValueChange={setPlanCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(plansQ.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.code}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Billing cycle</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                  <SelectItem value="quarterly">Quarterly (90 days)</SelectItem>
                  <SelectItem value="yearly">Yearly (365 days)</SelectItem>
                  <SelectItem value="lifetime">Lifetime (10 years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Override price</div>
                <div className="text-xs text-muted-foreground">Otherwise the plan's list price is used.</div>
              </div>
              <Switch checked={overridePrice} onCheckedChange={setOverridePrice} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number" min={0} value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={!overridePrice}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Custom duration (days)</Label>
                  <Input
                    type="number" min={1} value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    disabled={!useCustomDuration}
                  />
                </div>
                <div className="pb-1">
                  <Switch checked={useCustomDuration} onCheckedChange={setUseCustomDuration} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Limits</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField label="Storage limit (GB)" value={storage} onChange={setStorage} />
              <NumberField label="Number of mini websites" value={miniSites} onChange={setMiniSites} />
              <NumberField label="Custom domain limit" value={customDomains} onChange={setCustomDomains} />
              <NumberField label="Team members" value={teamMembers} onChange={setTeamMembers} />
              <div className="sm:col-span-2">
                <Label>Custom subdomain</Label>
                <Input value={customSubdomain} onChange={(e) => setCustomSubdomain(e.target.value)} placeholder="e.g. clientname" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Feature toggles</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURE_TOGGLES.map((f) => (
                <label key={f.key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{f.label}</span>
                  <Switch
                    checked={!!toggles[f.key]}
                    onCheckedChange={(v) => setToggles((t) => ({ ...t, [f.key]: v }))}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Internal note</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional audit-log context" />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-3 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={!workspaceId || mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
