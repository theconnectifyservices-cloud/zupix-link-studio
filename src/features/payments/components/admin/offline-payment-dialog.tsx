/** Super-admin: record an offline payment (cash / bank / cheque / UPI). */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaField } from "@/shared/ui/media-field";
import { searchWorkspacesAdmin, listPlansAdmin, recordOfflinePayment } from "../../manual.functions";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";
type Mode = "cash" | "upi" | "bank" | "cheque";

export function OfflinePaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchWorkspacesAdmin);
  const plansFn = useServerFn(listPlansAdmin);
  const recordFn = useServerFn(recordOfflinePayment);

  const [query, setQuery] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [planId, setPlanId] = useState("");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [mode, setMode] = useState<Mode>("upi");
  const [amount, setAmount] = useState<string>("");
  const [referenceNo, setReferenceNo] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [notes, setNotes] = useState("");

  const wsQ = useQuery({
    queryKey: ["admin-ws-search", query],
    queryFn: () => searchFn({ data: { query } }),
    enabled: open,
  });
  const plansQ = useQuery({ queryKey: ["admin-plans"], queryFn: () => plansFn(), enabled: open });

  const record = useMutation({
    mutationFn: () => recordFn({
      data: {
        workspaceId,
        planId,
        cycle,
        mode,
        amountRupees: Number(amount),
        referenceNo: referenceNo || undefined,
        screenshotUrl: screenshotUrl || undefined,
        notes: notes || undefined,
      },
    }),
    onSuccess: () => {
      toast.success("Offline payment recorded · receipt generated");
      qc.invalidateQueries({ queryKey: ["admin-recent-payments"] });
      onOpenChange(false);
      setWorkspaceId(""); setPlanId(""); setAmount(""); setReferenceNo(""); setScreenshotUrl(""); setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit = workspaceId && planId && Number(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Record offline payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Search workspace</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or slug" />
          </div>
          <div>
            <Label>Customer workspace</Label>
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
              <Label>Cycle</Label>
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
            <div>
              <Label>Payment mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Reference / UTR / cheque no.</Label>
            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
          </div>
          <MediaField
            label="Payment screenshot / receipt"
            value={screenshotUrl || undefined}
            onChange={(url) => setScreenshotUrl(url ?? "")}
            pickerTitle="Upload payment proof"
          />
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => record.mutate()} disabled={!canSubmit || record.isPending}>
            {record.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Record & activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
