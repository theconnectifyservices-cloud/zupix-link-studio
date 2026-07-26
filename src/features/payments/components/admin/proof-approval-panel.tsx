/** Review customer-submitted UPI payment screenshots. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon, ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { listPendingUpiSubmissions, reviewUpiSubmission } from "../../upi.functions";

export function ProofApprovalPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPendingUpiSubmissions);
  const reviewFn = useServerFn(reviewUpiSubmission);
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const q = useQuery({
    queryKey: ["admin-upi-pending"],
    queryFn: () => listFn({ data: { workspaceId: null } }),
  });

  const act = useMutation({
    mutationFn: (v: { id: string; approve: boolean; notes?: string }) =>
      reviewFn({ data: { submissionId: v.id, approve: v.approve, notes: v.notes } }),
    onSuccess: (_, v) => {
      toast.success(v.approve ? "Approved & subscription activated" : "Rejected — customer notified");
      qc.invalidateQueries({ queryKey: ["admin-upi-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-recent-payments"] });
      setOpenNotes(null); setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment proofs pending review</h3>
          <p className="text-sm text-muted-foreground">Customer-submitted UPI screenshots awaiting approval.</p>
        </div>
        <Badge variant="outline">{rows.length} pending</Badge>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No pending proofs. Nice work.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((s: any) => {
            const amount = s.order?.amount_paise ? (s.order.amount_paise / 100).toFixed(2) : "—";
            const isOpen = openNotes === s.id;
            return (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>₹{amount} {s.order?.currency ?? "INR"}</span>
                    <Badge variant="secondary">{new Date(s.created_at).toLocaleString()}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    <div>Order: <code className="font-mono">{String(s.order_id).slice(0, 8)}</code></div>
                    {s.txn_ref ? <div>UTR / Ref: <span className="font-mono">{s.txn_ref}</span></div> : null}
                    {s.notes ? <div className="mt-1">Note: {s.notes}</div> : null}
                  </div>
                  {s.screenshot_url ? (
                    <a href={s.screenshot_url} target="_blank" rel="noreferrer" className="block relative group">
                      <img src={s.screenshot_url} alt="Payment proof" className="w-full h-40 object-cover rounded-md border" />
                      <span className="absolute top-1 right-1 bg-background/80 rounded px-1.5 py-0.5 text-[10px] flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Open
                      </span>
                    </a>
                  ) : (
                    <div className="h-40 rounded-md border border-dashed grid place-items-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}

                  {isOpen ? (
                    <div className="space-y-2">
                      <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Message to customer (why rejected / what to fix)" />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => act.mutate({ id: s.id, approve: false, notes })} disabled={act.isPending}>
                          Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => act.mutate({ id: s.id, approve: false, notes: `Please re-submit: ${notes}` })} disabled={act.isPending}>
                          Request again
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setOpenNotes(null); setNotes(""); }}>Back</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => act.mutate({ id: s.id, approve: true })} disabled={act.isPending}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setOpenNotes(s.id); setNotes(""); }}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject / Request
                      </Button>
                      <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Customer notified on decision
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
