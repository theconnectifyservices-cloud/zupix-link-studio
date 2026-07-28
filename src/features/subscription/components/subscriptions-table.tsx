/**
 * Subscription Management table — enterprise admin view.
 * Search, filters, pagination, per-row actions, CSV export.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MoreHorizontal, Eye, Pencil, Sparkles, CalendarPlus, ArrowUp, ArrowDown,
  PauseCircle, PlayCircle, XCircle, Trash2, Download, Search, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listCustomerSubscriptions, deleteCustomerSubscription } from "../management.functions";
import { AssignPlanDialog } from "./assign-plan-dialog";
import { ExtendPlanDialog, ChangePlanDialog, ConfirmActionDialog } from "./subscription-action-dialogs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Row = {
  workspace_id: string;
  workspace_name: string;
  customer_id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  subscription_id: string | null;
  plan_code: string;
  plan_name: string;
  status: string;
  cycle: string | null;
  start_date: string | null;
  expiry_date: string | null;
  days_remaining: number | null;
  auto_renewal: boolean;
  account_status: string;
  updated_at: string;
};

type DialogKind =
  | { kind: "assign"; ws: Row }
  | { kind: "extend"; ws: Row }
  | { kind: "upgrade"; ws: Row }
  | { kind: "downgrade"; ws: Row }
  | { kind: "suspend"; ws: Row }
  | { kind: "resume"; ws: Row }
  | { kind: "cancel"; ws: Row }
  | null;

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  trialing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  past_due: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  paused: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  canceled: "bg-red-500/15 text-red-600 border-red-500/30",
  expired: "bg-red-500/15 text-red-600 border-red-500/30",
  none: "bg-muted text-muted-foreground border-border",
};

export function SubscriptionsTable() {
  const list = useServerFn(listCustomerSubscriptions);
  const del = useServerFn(deleteCustomerSubscription);
  const qc = useQueryClient();

  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [dialog, setDialog] = useState<DialogKind>(null);

  const q = useQuery({
    queryKey: ["admin", "customer-subs", query, planFilter, statusFilter, page, pageSize],
    queryFn: () => list({
      data: {
        query: query || undefined,
        planCode: planFilter === "all" ? undefined : planFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: pageSize,
        offset: page * pageSize,
      },
    }),
  });

  const rows: Row[] = (q.data?.rows ?? []) as Row[];

  const delMut = useMutation({
    mutationFn: (workspaceId: string) => del({ data: { workspaceId } }),
    onSuccess: () => {
      toast.success("Subscription deleted");
      qc.invalidateQueries({ queryKey: ["admin", "customer-subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const csv = useMemo(() => rows.map((r) => ({
    "Customer ID": r.customer_id,
    "Name": r.customer_name,
    "Email": r.email,
    "Phone": r.phone ?? "",
    "Plan": r.plan_name,
    "Status": r.status,
    "Cycle": r.cycle ?? "",
    "Start": r.start_date ?? "",
    "Expiry": r.expiry_date ?? "",
    "Days Remaining": r.days_remaining ?? "",
    "Auto Renewal": r.auto_renewal ? "Yes" : "No",
    "Account": r.account_status,
    "Updated": r.updated_at,
  })), [rows]);

  const exportCsv = () => {
    if (!csv.length) return;
    const keys = Object.keys(csv[0]);
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = [
      keys.join(","),
      ...csv.map((row) => keys.map((k) => escape((row as any)[k])).join(",")),
    ].join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer, email or workspace…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="udaan">Udaan</SelectItem>
                  <SelectItem value="tejas">Tejas</SelectItem>
                  <SelectItem value="shikhar">Shikhar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past due</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Customer</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Auto-renew</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 13 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {!q.isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} className="h-40 text-center text-sm text-muted-foreground">
                      No customers match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {!q.isLoading && rows.map((r) => (
                  <TableRow key={r.workspace_id}>
                    <TableCell>
                      <div className="font-medium">{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{r.workspace_name}</div>
                    </TableCell>
                    <TableCell><span className="font-mono text-xs">{r.customer_id}</span></TableCell>
                    <TableCell className="text-xs">{r.email}</TableCell>
                    <TableCell className="text-xs">{r.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{r.plan_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border capitalize", STATUS_TONE[r.status] ?? STATUS_TONE.none)}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{fmt(r.start_date)}</TableCell>
                    <TableCell className="text-xs">{fmt(r.expiry_date)}</TableCell>
                    <TableCell className="text-xs">{r.days_remaining ?? "—"}</TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-medium", r.auto_renewal ? "text-emerald-600" : "text-muted-foreground")}>
                        {r.auto_renewal ? "On" : "Off"}
                      </span>
                    </TableCell>
                    <TableCell><span className="text-xs capitalize">{r.account_status}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(r.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{r.customer_name}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setDialog({ kind: "assign", ws: r })}>
                            <Eye className="mr-2 h-4 w-4" /> View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ kind: "assign", ws: r })}>
                            <Sparkles className="mr-2 h-4 w-4" /> Assign plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ kind: "extend", ws: r })}>
                            <CalendarPlus className="mr-2 h-4 w-4" /> Extend plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ kind: "upgrade", ws: r })}>
                            <ArrowUp className="mr-2 h-4 w-4" /> Upgrade plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDialog({ kind: "downgrade", ws: r })}>
                            <ArrowDown className="mr-2 h-4 w-4" /> Downgrade plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {r.status !== "paused" ? (
                            <DropdownMenuItem onClick={() => setDialog({ kind: "suspend", ws: r })}>
                              <PauseCircle className="mr-2 h-4 w-4" /> Suspend plan
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setDialog({ kind: "resume", ws: r })}>
                              <PlayCircle className="mr-2 h-4 w-4" /> Resume plan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setDialog({ kind: "cancel", ws: r })}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Delete subscription for ${r.customer_name}? This cannot be undone.`)) {
                                delMut.mutate(r.workspace_id);
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {q.isFetching ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</span> :
            `Page ${page + 1} · ${rows.length} rows`}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={rows.length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Dialogs */}
      <AssignPlanDialog
        open={dialog?.kind === "assign"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "assign" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "assign" ? dialog.ws.workspace_name : undefined}
      />
      <ExtendPlanDialog
        open={dialog?.kind === "extend"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "extend" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "extend" ? dialog.ws.workspace_name : undefined}
      />
      <ChangePlanDialog
        open={dialog?.kind === "upgrade"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "upgrade" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "upgrade" ? dialog.ws.workspace_name : undefined}
        action="upgrade"
      />
      <ChangePlanDialog
        open={dialog?.kind === "downgrade"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "downgrade" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "downgrade" ? dialog.ws.workspace_name : undefined}
        action="downgrade"
      />
      <ConfirmActionDialog
        open={dialog?.kind === "suspend"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "suspend" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "suspend" ? dialog.ws.workspace_name : undefined}
        action="suspend"
        title="Suspend subscription"
        description="This pauses all paid features for"
      />
      <ConfirmActionDialog
        open={dialog?.kind === "resume"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "resume" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "resume" ? dialog.ws.workspace_name : undefined}
        action="resume"
        title="Resume subscription"
        description="This re-enables all features for"
      />
      <ConfirmActionDialog
        open={dialog?.kind === "cancel"}
        onOpenChange={(v) => !v && setDialog(null)}
        workspaceId={dialog?.kind === "cancel" ? dialog.ws.workspace_id : null}
        workspaceName={dialog?.kind === "cancel" ? dialog.ws.workspace_name : undefined}
        action="cancel"
        title="Cancel subscription"
        description="This cancels the plan at period end for"
      />
    </div>
  );
}

function fmt(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}
