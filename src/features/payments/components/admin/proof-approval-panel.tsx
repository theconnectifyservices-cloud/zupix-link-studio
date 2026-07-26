/**
 * Enterprise Manual UPI Payment Review & Approval workflow.
 *
 * Renders a searchable/filterable queue with 4 widget stats, a table view,
 * and a right-side detail Sheet that includes an interactive screenshot
 * viewer (zoom / rotate / download / fullscreen), a status timeline, and
 * dedicated Approve / Reject / Request-New dialogs.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Loader2, Image as ImageIcon, ExternalLink, Search,
  Clock, ThumbsUp, ThumbsDown, TimerReset, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  listUpiSubmissions, getUpiSubmission, getUpiReviewStats, reviewUpiSubmission,
} from "../../upi.functions";

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type RangeFilter = "all" | "today" | "yesterday" | "week";
type ActionKind = "approve" | "reject" | "request_new";

const REJECT_REASONS = [
  "Wrong amount",
  "Invalid screenshot",
  "Duplicate payment",
  "Invalid UTR",
  "Suspected fraud",
  "Other",
] as const;

export function ProofApprovalPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listUpiSubmissions);
  const statsFn = useServerFn(getUpiReviewStats);

  const [status, setStatus] = useState<StatusFilter>("pending");
  const [range, setRange] = useState<RangeFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["admin-upi-list", status, range, search],
    queryFn: () => listFn({ data: { status, range, search: search.trim() || undefined } }),
  });
  const statsQ = useQuery({ queryKey: ["admin-upi-stats"], queryFn: () => statsFn() });

  const rows = (listQ.data ?? []) as any[];
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [
        r.customer?.email, r.customer?.display_name, r.workspace?.name, r.workspace?.slug,
        r.plan?.name, r.plan?.code, r.txn_ref, r.order_id, r.id, r.order?.provider,
      ].some((v) => v && String(v).toLowerCase().includes(s)),
    );
  }, [rows, search]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-upi-list"] });
    qc.invalidateQueries({ queryKey: ["admin-upi-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-upi-pending"] });
    qc.invalidateQueries({ queryKey: ["admin-recent-payments"] });
  };

  const stats = statsQ.data;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Widget icon={<Clock className="h-4 w-4" />} label="Pending reviews" value={stats?.pending ?? 0} tone="amber" />
        <Widget icon={<ThumbsUp className="h-4 w-4" />} label="Approved today" value={stats?.approvedToday ?? 0} tone="emerald" />
        <Widget icon={<ThumbsDown className="h-4 w-4" />} label="Rejected today" value={stats?.rejectedToday ?? 0} tone="red" />
        <Widget icon={<TimerReset className="h-4 w-4" />} label="Avg review time" value={`${stats?.avgReviewMinutes ?? 0}m`} tone="primary" />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-1 gap-2 md:justify-end">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, workspace, UTR, order, plan…"
                className="pl-8"
              />
            </div>
            <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {listQ.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No submissions match the current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>UTR</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedId(s.id)}
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{s.customer?.display_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.customer?.email ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{s.workspace?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">/{s.workspace?.slug ?? "—"}</div>
                      </TableCell>
                      <TableCell className="text-sm">{s.plan?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium">
                        ₹{s.order ? (Number(s.order.amount_paise) / 100).toFixed(2) : "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.order?.provider ?? "manual_upi"}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{s.txn_ref ?? "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {s.screenshot_url ? (
                          <img src={s.screenshot_url} alt="proof" className="h-10 w-10 rounded object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded border grid place-items-center text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedId(s.id); }}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDrawer
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onReviewed={() => { invalidateAll(); setSelectedId(null); }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-700 border-red-500/30",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}

function Widget({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: "primary" | "emerald" | "amber" | "red" }) {
  const cls = {
    primary: "text-primary",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 text-xs ${cls}`}>{icon}{label}</div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

function ReviewDrawer({ id, onClose, onReviewed }: { id: string | null; onClose: () => void; onReviewed: () => void }) {
  const getFn = useServerFn(getUpiSubmission);
  const reviewFn = useServerFn(reviewUpiSubmission);
  const q = useQuery({
    queryKey: ["admin-upi-detail", id],
    queryFn: () => getFn({ data: { id: id! } }),
    enabled: !!id,
  });

  const [openAction, setOpenAction] = useState<ActionKind | null>(null);

  const mut = useMutation({
    mutationFn: (v: { action: ActionKind; reasonCategory?: string; notes?: string }) =>
      reviewFn({ data: { submissionId: id!, ...v } }),
    onSuccess: (_r, v) => {
      const label = v.action === "approve" ? "Payment approved — subscription activated"
        : v.action === "reject" ? "Payment rejected — customer notified"
        : "Requested new screenshot — customer notified";
      toast.success(label);
      setOpenAction(null);
      onReviewed();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = q.data as any;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payment review</SheetTitle>
          <SheetDescription>Verify the customer's UPI submission and take action.</SheetDescription>
        </SheetHeader>

        {q.isLoading || !s ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="Customer" value={s.customer?.display_name ?? "—"} sub={s.customer?.email} />
              <Field label="Workspace" value={s.workspace?.name ?? "—"} sub={s.workspace?.slug ? `/${s.workspace.slug}` : undefined} />
              <Field label="Plan" value={s.plan?.name ?? "—"} sub={s.plan?.code} />
              <Field label="Amount" value={`₹${s.order ? (Number(s.order.amount_paise) / 100).toFixed(2) : "—"} ${s.order?.currency ?? "INR"}`} />
              <Field label="Gateway" value={s.order?.provider ?? "manual_upi"} />
              <Field label="Cycle" value={s.order?.meta?.cycle ?? "—"} />
              <Field label="Submitted" value={new Date(s.created_at).toLocaleString()} />
              <Field label="Order ID" value={s.order_id} mono copyable />
              <Field label="UTR / Ref" value={s.txn_ref ?? "—"} mono copyable={!!s.txn_ref} />
              <Field label="Invoice" value={s.invoice?.invoice_number ?? "—"} sub={s.invoice?.status} />
            </div>

            {s.notes ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-1">Customer note</div>
                {s.notes}
              </div>
            ) : null}

            <ScreenshotViewer url={s.screenshot_url} />

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Timeline</div>
              <Timeline
                submittedAt={s.created_at}
                reviewedAt={s.reviewed_at}
                status={s.status}
                reviewerName={s.reviewer?.display_name ?? s.reviewer?.email}
                notes={s.review_notes}
              />
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2 sticky bottom-0 bg-background pt-3">
              <Button onClick={() => setOpenAction("approve")} disabled={s.status === "approved" || mut.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve payment
              </Button>
              <Button variant="destructive" onClick={() => setOpenAction("reject")} disabled={s.status === "rejected" || mut.isPending}>
                <XCircle className="h-4 w-4 mr-2" /> Reject payment
              </Button>
              <Button variant="outline" onClick={() => setOpenAction("request_new")} disabled={mut.isPending}>
                Request new screenshot
              </Button>
            </div>
          </div>
        )}

        <ActionDialog
          kind={openAction}
          onClose={() => setOpenAction(null)}
          onConfirm={(payload) => mut.mutate(payload)}
          pending={mut.isPending}
        />
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, sub, mono, copyable }: { label: string; value: string; sub?: string | null; mono?: boolean; copyable?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm mt-0.5 flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
        <span className="truncate">{value}</span>
        {copyable && value && value !== "—" ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied"); }}
            aria-label="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      {sub ? <div className="text-xs text-muted-foreground mt-0.5">{sub}</div> : null}
    </div>
  );
}

function ScreenshotViewer({ url }: { url: string | null | undefined }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [full, setFull] = useState(false);
  if (!url) {
    return (
      <div className="rounded-md border border-dashed h-56 grid place-items-center text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <ImageIcon className="h-6 w-6" />
          <span className="text-xs">No screenshot attached</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/40">
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
        <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setRot((r) => (r + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" asChild>
          <a href={url} download target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFull(true)}><Maximize2 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" asChild className="ml-auto">
          <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Open</a>
        </Button>
      </div>
      <div className="h-64 overflow-auto bg-muted/20 grid place-items-center">
        <img
          src={url}
          alt="Payment proof"
          style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transformOrigin: "center" }}
          className="max-h-full transition-transform"
        />
      </div>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Payment proof — fullscreen</DialogTitle>
            <DialogDescription>Zoom and rotation controls are available above.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto grid place-items-center bg-muted/20 rounded-md">
            <img
              src={url}
              alt="Payment proof full"
              style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transformOrigin: "center" }}
              className="transition-transform"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Timeline({ submittedAt, reviewedAt, status, reviewerName, notes }: {
  submittedAt: string; reviewedAt: string | null; status: string; reviewerName?: string | null; notes?: string | null;
}) {
  const items = [
    { label: "Payment submitted", at: submittedAt, tone: "text-primary" },
    { label: "Under review", at: submittedAt, tone: "text-amber-600" },
  ];
  if (reviewedAt) {
    items.push({
      label: status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Updated",
      at: reviewedAt,
      tone: status === "approved" ? "text-emerald-600" : status === "rejected" ? "text-red-600" : "text-muted-foreground",
    });
  }
  return (
    <ol className="space-y-2 border-l pl-4">
      {items.map((it, i) => (
        <li key={i} className="text-sm">
          <div className={`font-medium ${it.tone}`}>{it.label}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(it.at).toLocaleString()}
            {i === items.length - 1 && reviewerName ? ` · by ${reviewerName}` : ""}
          </div>
        </li>
      ))}
      {notes ? <li className="text-xs text-muted-foreground">Notes: {notes}</li> : null}
    </ol>
  );
}

function ActionDialog({ kind, onClose, onConfirm, pending }: {
  kind: ActionKind | null;
  onClose: () => void;
  onConfirm: (v: { action: ActionKind; reasonCategory?: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [verified, setVerified] = useState<"yes" | "no" | null>(null);
  const [reason, setReason] = useState<string>(REJECT_REASONS[0]);
  const [notes, setNotes] = useState("");

  const reset = () => { setVerified(null); setReason(REJECT_REASONS[0]); setNotes(""); };
  const close = () => { reset(); onClose(); };

  const title = kind === "approve" ? "Approve payment"
    : kind === "reject" ? "Reject payment"
    : "Request new screenshot";
  const description = kind === "approve"
    ? "Confirm the payment is verified before activating the subscription."
    : kind === "reject"
    ? "Choose a reason — the customer will be notified with this message."
    : "The customer will be asked to upload a clearer screenshot.";

  const canSubmit = kind === "approve" ? verified === "yes" : kind === "reject" ? !!reason : true;

  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {kind === "approve" ? (
            <div>
              <div className="text-xs font-medium mb-1">Payment verified?</div>
              <div className="flex gap-2">
                <Button size="sm" variant={verified === "yes" ? "default" : "outline"} onClick={() => setVerified("yes")}>Yes</Button>
                <Button size="sm" variant={verified === "no" ? "default" : "outline"} onClick={() => setVerified("no")}>No</Button>
              </div>
              {verified === "no" ? (
                <p className="text-xs text-muted-foreground mt-2">Use “Reject payment” instead if the proof is invalid.</p>
              ) : null}
            </div>
          ) : null}

          {kind === "reject" ? (
            <div>
              <div className="text-xs font-medium mb-1">Reason</div>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div>
            <div className="text-xs font-medium mb-1">
              {kind === "approve" ? "Internal notes (optional)" : "Message to customer"}
            </div>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={kind === "approve"
                ? "Optional internal note — logged in the audit trail."
                : "Explain what went wrong or what to fix."}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={pending}>Cancel</Button>
          <Button
            onClick={() => onConfirm({
              action: kind!,
              reasonCategory: kind === "reject" ? reason : undefined,
              notes: notes.trim() || undefined,
            })}
            disabled={!canSubmit || pending}
          >
            {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
