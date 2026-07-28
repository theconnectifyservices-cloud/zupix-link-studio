/** Extend / change-plan / confirm dialogs used from the subscription table. */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { updateCustomerSubscription } from "../management.functions";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";

export function ExtendPlanDialog({
  open, onOpenChange, workspaceId, workspaceName,
}: { open: boolean; onOpenChange: (v: boolean) => void; workspaceId: string | null; workspaceName?: string }) {
  const qc = useQueryClient();
  const update = useServerFn(updateCustomerSubscription);
  const [days, setDays] = useState(30);
  const mut = useMutation({
    mutationFn: () => update({ data: { workspaceId: workspaceId!, action: "extend", extendDays: days } }),
    onSuccess: () => {
      toast.success(`Extended by ${days} days`);
      qc.invalidateQueries({ queryKey: ["admin", "customer-subs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend plan</DialogTitle>
          <DialogDescription>Add days to {workspaceName ?? "this workspace"}'s current period.</DialogDescription>
        </DialogHeader>
        <div>
          <Label>Days to add</Label>
          <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={!workspaceId || mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChangePlanDialog({
  open, onOpenChange, workspaceId, workspaceName, action,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  workspaceId: string | null; workspaceName?: string;
  action: "upgrade" | "downgrade";
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateCustomerSubscription);
  const [planCode, setPlanCode] = useState("tejas");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const plansQ = useQuery({
    queryKey: ["change-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("billing_plans").select("code, name").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
    enabled: open,
  });
  const mut = useMutation({
    mutationFn: () => update({ data: { workspaceId: workspaceId!, action, newPlanCode: planCode, newCycle: cycle } }),
    onSuccess: () => {
      toast.success(`Plan ${action === "upgrade" ? "upgraded" : "changed"}`);
      qc.invalidateQueries({ queryKey: ["admin", "customer-subs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === "upgrade" ? "Upgrade plan" : "Downgrade plan"}</DialogTitle>
          <DialogDescription>Change the plan for {workspaceName ?? "this workspace"}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Plan</Label>
            <Select value={planCode} onValueChange={setPlanCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(plansQ.data ?? []).map((p) => (
                  <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Billing cycle</Label>
            <Select value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={!workspaceId || mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmActionDialog({
  open, onOpenChange, workspaceId, workspaceName, action, title, description,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  workspaceId: string | null; workspaceName?: string;
  action: "suspend" | "resume" | "cancel";
  title: string; description: string;
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateCustomerSubscription);
  const mut = useMutation({
    mutationFn: () => update({ data: { workspaceId: workspaceId!, action } }),
    onSuccess: () => {
      toast.success(`${title} — done`);
      qc.invalidateQueries({ queryKey: ["admin", "customer-subs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} <b>{workspaceName}</b>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={action === "cancel" ? "destructive" : "default"} onClick={() => mut.mutate()} disabled={!workspaceId || mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
