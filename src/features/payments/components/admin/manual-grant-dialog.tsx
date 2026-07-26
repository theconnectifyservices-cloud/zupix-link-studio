/** Super-admin: manually assign a subscription plan to a workspace. */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchWorkspacesAdmin, listPlansAdmin, grantManualSubscription } from "../../manual.functions";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";

export function ManualGrantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchWorkspacesAdmin);
  const plansFn = useServerFn(listPlansAdmin);
  const grantFn = useServerFn(grantManualSubscription);

  const [query, setQuery] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [planId, setPlanId] = useState("");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const wsQ = useQuery({
    queryKey: ["admin-ws-search", query],
    queryFn: () => searchFn({ data: { query } }),
    enabled: open,
  });
  const plansQ = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => plansFn(),
    enabled: open,
  });

  const grant = useMutation({
    mutationFn: () =>
      grantFn({ data: { workspaceId, planId, cycle, reason, note: note || undefined } }),
    onSuccess: () => {
      toast.success("Subscription assigned");
      qc.invalidateQueries({ queryKey: ["admin-recent-payments"] });
      onOpenChange(false);
      setWorkspaceId(""); setPlanId(""); setReason(""); setNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = workspaceId && planId && reason.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Assign subscription manually
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Search workspace</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or slug" />
          </div>
          <div>
            <Label>Workspace</Label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger><SelectValue placeholder="Select workspace" /></SelectTrigger>
              <SelectContent>
                {(wsQ.data ?? []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name} <span className="text-muted-foreground">/{w.slug}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {(plansQ.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
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
          <div>
            <Label>Reason <span className="text-destructive">*</span></Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Compensation for outage, promo grant" />
          </div>
          <div>
            <Label>Internal note</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional context for the audit log" />
          </div>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            Records a paid ₹0 invoice tagged <code>manual_grant</code>. The subscription activates immediately.
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => grant.mutate()} disabled={!canSubmit || grant.isPending}>
            {grant.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
