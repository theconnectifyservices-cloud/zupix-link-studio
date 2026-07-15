import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Activity,
  Pause,
  Play,
  Archive,
  Trash2,
  Plus,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  ClipboardList,
  HardDrive,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import {
  addNote,
  addTeamMember,
  bulkAssignPlan,
  bulkDelete,
  bulkImport,
  bulkSetStatus,
  createClient,
  deleteClient,
  deleteNote,
  exportClientsCsv,
  extendTrial,
  parseClientsCsv,
  removeTeamMember,
  setClientStatus,
  setSupport,
  updateClient,
  updateTeamMember,
} from "../api";
import { useClientNotes, useClients, useResellerStats, useResellerTeam } from "../hooks";
import {
  CLIENT_STATUSES,
  TEAM_ROLES,
  type ResellerClient,
  type ResellerClientStatus,
  type ResellerPriority,
  type ResellerSupportStatus,
  type ResellerTeamRole,
} from "../types";

interface Props {
  tenantId: string;
  tenantName: string;
  userId: string;
}

const STATUS_COLORS: Record<ResellerClientStatus, string> = {
  lead: "bg-slate-500/10 text-slate-600",
  trial: "bg-blue-500/10 text-blue-600",
  active: "bg-emerald-500/10 text-emerald-600",
  suspended: "bg-amber-500/10 text-amber-600",
  expired: "bg-orange-500/10 text-orange-600",
  archived: "bg-zinc-500/10 text-zinc-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export function ResellerDashboard({ tenantId, tenantName, userId }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResellerClientStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: stats } = useResellerStats(tenantId);
  const { data: clientsData, isLoading } = useClients(tenantId, {
    search,
    status: statusFilter,
  });
  const clients = clientsData?.rows ?? [];
  const { data: team = [] } = useResellerTeam(tenantId);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reseller-clients", tenantId] });
    qc.invalidateQueries({ queryKey: ["reseller-stats", tenantId] });
  };

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === clients.length) setSelected(new Set());
    else setSelected(new Set(clients.map((c) => c.id)));
  };

  const bulkStatusMut = useMutation({
    mutationFn: (status: ResellerClientStatus) => bulkSetStatus(Array.from(selected), status),
    onSuccess: () => {
      toast.success(`Updated ${selected.size} clients`);
      setSelected(new Set());
      invalidate();
    },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: () => bulkDelete(Array.from(selected)),
    onSuccess: () => {
      toast.success(`Deleted ${selected.size} clients`);
      setSelected(new Set());
      invalidate();
    },
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResellerClientStatus }) => setClientStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      toast.success("Client deleted");
      invalidate();
    },
  });

  const exportSelected = () => {
    const rows = selected.size > 0 ? clients.filter((c) => selected.has(c.id)) : clients;
    const csv = exportClientsCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tenantName}-clients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeClient = useMemo(
    () => clients.find((c) => c.id === detailId) ?? null,
    [clients, detailId],
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Reseller Operations"
        description={`Manage clients, workspaces, and staff for ${tenantName}.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportSelected}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Client
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Clients" value={stats?.total ?? 0} icon={Building2} />
        <StatCard label="Active" value={stats?.active ?? 0} icon={Activity} accent="text-emerald-600" />
        <StatCard label="Trial" value={stats?.trial ?? 0} icon={ClipboardList} accent="text-blue-600" />
        <StatCard label="Suspended" value={stats?.suspended ?? 0} icon={Pause} accent="text-amber-600" />
        <StatCard label="Workspaces" value={stats?.workspaces ?? 0} icon={Users} />
        <StatCard label="Storage (MB)" value={Math.round(stats?.storage_mb ?? 0)} icon={HardDrive} />
        <StatCard label="Leads" value={stats?.lead ?? 0} icon={ClipboardList} />
        <StatCard label="Archived" value={stats?.archived ?? 0} icon={Archive} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Clients</TabsTrigger>
          <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ResellerClientStatus | "all")}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 rounded-md border bg-accent/40 px-2 py-1">
                <span className="text-sm">{selected.size} selected</span>
                <Select onValueChange={(v) => bulkStatusMut.mutate(v as ResellerClientStatus)}>
                  <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Set status" /></SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <BulkPlanButton
                  onAssign={(plan) => {
                    bulkAssignPlan(Array.from(selected), plan).then(() => {
                      toast.success("Plan assigned");
                      invalidate();
                    });
                  }}
                />
                <Button size="sm" variant="destructive" onClick={() => bulkDeleteMut.mutate()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : clients.length === 0 ? (
                <EmptyState
                  title="No clients yet"
                  description="Create your first client to start provisioning workspaces."
                  action={<Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Client</Button>}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="w-10 p-3">
                          <Checkbox
                            checked={selected.size > 0 && selected.size === clients.length}
                            onCheckedChange={toggleAll}
                          />
                        </th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Domain</th>
                        <th className="p-3">Storage</th>
                        <th className="p-3">Trial ends</th>
                        <th className="w-10 p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-accent/30">
                          <td className="p-3">
                            <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSel(c.id)} />
                          </td>
                          <td className="p-3">
                            <button
                              className="text-left font-medium hover:underline"
                              onClick={() => setDetailId(c.id)}
                            >
                              {c.company_name}
                            </button>
                            <div className="text-xs text-muted-foreground">{c.contact_email ?? "—"}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className={STATUS_COLORS[c.status]}>{c.status}</Badge>
                          </td>
                          <td className="p-3">{c.plan_key ?? <span className="text-muted-foreground">—</span>}</td>
                          <td className="p-3 text-xs">{c.custom_domain ?? <span className="text-muted-foreground">—</span>}</td>
                          <td className="p-3 text-xs">{Math.round(c.usage?.storage_mb ?? 0)} MB</td>
                          <td className="p-3 text-xs">{c.trial_ends_at ? new Date(c.trial_ends_at).toLocaleDateString() : "—"}</td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailId(c.id)}>Open</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusMut.mutate({ id: c.id, status: "active" })}>
                                  <Play className="mr-2 h-4 w-4" /> Activate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusMut.mutate({ id: c.id, status: "suspended" })}>
                                  <Pause className="mr-2 h-4 w-4" /> Suspend
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusMut.mutate({ id: c.id, status: "archived" })}>
                                  <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteMut.mutate(c.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamPanel tenantId={tenantId} userId={userId} team={team} />
        </TabsContent>
      </Tabs>

      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tenantId={tenantId}
        userId={userId}
        onCreated={invalidate}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tenantId={tenantId}
        onImported={invalidate}
      />
      <ClientDetailDialog
        client={activeClient}
        userId={userId}
        onClose={() => setDetailId(null)}
        onChanged={invalidate}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-md bg-muted ${accent ?? "text-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function BulkPlanButton({ onAssign }: { onAssign: (plan: string) => void }) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState("pro");
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Assign plan</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign plan to selected</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Plan key</Label>
            <Input value={plan} onChange={(e) => setPlan(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onAssign(plan); setOpen(false); }}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateClientDialog({
  open,
  onOpenChange,
  tenantId,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  userId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    company_name: "",
    contact_email: "",
    contact_name: "",
    status: "lead" as ResellerClientStatus,
    plan_key: "",
    custom_domain: "",
  });
  const mut = useMutation({
    mutationFn: () =>
      createClient({
        tenant_id: tenantId,
        created_by: userId,
        company_name: form.company_name,
        contact_email: form.contact_email || undefined,
        contact_name: form.contact_name || undefined,
        status: form.status,
        plan_key: form.plan_key || undefined,
        custom_domain: form.custom_domain || undefined,
      }),
    onSuccess: () => {
      toast.success("Client created");
      setForm({ company_name: "", contact_email: "", contact_name: "", status: "lead", plan_key: "", custom_domain: "" });
      onOpenChange(false);
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
          <DialogDescription>Provision a new client under this reseller account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Company name</Label>
            <Input value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact name</Label>
              <Input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
            </div>
            <div>
              <Label>Contact email</Label>
              <Input value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ResellerClientStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan key</Label>
              <Input value={form.plan_key} onChange={(e) => setForm((f) => ({ ...f, plan_key: e.target.value }))} placeholder="pro" />
            </div>
          </div>
          <div>
            <Label>Custom domain</Label>
            <Input value={form.custom_domain} onChange={(e) => setForm((f) => ({ ...f, custom_domain: e.target.value }))} placeholder="client.example.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!form.company_name || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  open,
  onOpenChange,
  tenantId,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
  onImported: () => void;
}) {
  const [text, setText] = useState("company_name,contact_email,status,plan_key\nAcme,acme@example.com,trial,pro");
  const mut = useMutation({
    mutationFn: async () => {
      const rows = parseClientsCsv(text);
      return bulkImport(tenantId, rows);
    },
    onSuccess: (n) => {
      toast.success(`Imported ${n} clients`);
      onOpenChange(false);
      onImported();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import clients</DialogTitle>
          <DialogDescription>Paste CSV with headers: company_name, contact_email, contact_name, status, plan_key, custom_domain, priority.</DialogDescription>
        </DialogHeader>
        <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-xs" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetailDialog({
  client,
  userId,
  onClose,
  onChanged,
}: {
  client: ResellerClient | null;
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const open = !!client;
  const qc = useQueryClient();
  const { data: notes = [] } = useClientNotes(client?.id);
  const [noteBody, setNoteBody] = useState("");
  const [noteKind, setNoteKind] = useState<"internal" | "support">("internal");
  const [trialDays, setTrialDays] = useState(14);

  const supportMut = useMutation({
    mutationFn: (patch: { priority?: ResellerPriority; support_status?: ResellerSupportStatus }) =>
      setSupport(client!.id, patch),
    onSuccess: () => { toast.success("Updated"); onChanged(); },
  });

  const trialMut = useMutation({
    mutationFn: () => extendTrial(client!.id, trialDays),
    onSuccess: () => { toast.success(`Trial extended ${trialDays} days`); onChanged(); },
  });

  const planMut = useMutation({
    mutationFn: (plan: string) => updateClient(client!.id, { plan_key: plan }),
    onSuccess: () => { toast.success("Plan updated"); onChanged(); },
  });

  const noteMut = useMutation({
    mutationFn: () =>
      addNote({
        tenant_id: client!.tenant_id,
        client_id: client!.id,
        kind: noteKind,
        body: noteBody,
        author_id: userId,
      }),
    onSuccess: () => {
      setNoteBody("");
      qc.invalidateQueries({ queryKey: ["reseller-notes", client!.id] });
    },
  });

  const delNoteMut = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reseller-notes", client!.id] }),
  });

  const [planInput, setPlanInput] = useState("");
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{client.company_name}</DialogTitle>
          <DialogDescription>{client.contact_email ?? "No contact email"}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="plan">Plan & Trial</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="support">Support ({notes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Status" value={<Badge className={STATUS_COLORS[client.status]}>{client.status}</Badge>} />
              <Info label="Plan" value={client.plan_key ?? "—"} />
              <Info label="Custom domain" value={client.custom_domain ?? "—"} />
              <Info label="Workspace" value={client.workspace_id ?? "—"} />
              <Info label="Priority" value={client.priority} />
              <Info label="Support" value={client.support_status} />
              <Info label="Created" value={new Date(client.created_at).toLocaleString()} />
              <Info label="Trial ends" value={client.trial_ends_at ? new Date(client.trial_ends_at).toLocaleString() : "—"} />
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Plan key</Label>
                <Input value={planInput} placeholder={client.plan_key ?? "pro"} onChange={(e) => setPlanInput(e.target.value)} />
              </div>
              <Button onClick={() => planInput && planMut.mutate(planInput)}>Save plan</Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Extend trial (days)</Label>
                <Input type="number" value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} />
              </div>
              <Button onClick={() => trialMut.mutate()}>Extend</Button>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-2">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <UsageStat label="Storage (MB)" value={client.usage?.storage_mb ?? 0} />
              <UsageStat label="AI credits" value={client.usage?.ai_credits ?? 0} />
              <UsageStat label="API calls" value={client.usage?.api_calls ?? 0} />
              <UsageStat label="Domains" value={client.usage?.domains ?? 0} />
              <UsageStat label="Analytics events" value={client.usage?.analytics_events ?? 0} />
              <UsageStat label="Media items" value={client.usage?.media_count ?? 0} />
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={client.priority} onValueChange={(v) => supportMut.mutate({ priority: v as ResellerPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low","normal","high","urgent"] as ResellerPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Support status</Label>
                <Select value={client.support_status} onValueChange={(v) => supportMut.mutate({ support_status: v as ResellerSupportStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["none","open","pending","resolved"] as ResellerSupportStatus[]).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex gap-2">
                <Select value={noteKind} onValueChange={(v) => setNoteKind(v as "internal" | "support")}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea rows={2} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add note…" />
              </div>
              <div className="flex justify-end">
                <Button size="sm" disabled={!noteBody.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>
                  Add note
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span><Badge variant="outline" className="mr-2">{n.kind}</Badge>{new Date(n.created_at).toLocaleString()}</span>
                    <Button size="sm" variant="ghost" onClick={() => delNoteMut.mutate(n.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function UsageStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function TeamPanel({
  tenantId,
  userId,
  team,
}: {
  tenantId: string;
  userId: string;
  team: import("../types").ResellerTeamMember[];
}) {
  const qc = useQueryClient();
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<ResellerTeamRole>("viewer");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["reseller-team", tenantId] });

  const addMut = useMutation({
    mutationFn: () => addTeamMember({ tenant_id: tenantId, user_id: uid, role }),
    onSuccess: () => { toast.success("Member added"); setUid(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: ResellerTeamRole }) => updateTeamMember(id, { role }),
    onSuccess: () => { toast.success("Role updated"); invalidate(); },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeTeamMember(id),
    onSuccess: () => { toast.success("Member removed"); invalidate(); },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add staff</CardTitle>
          <CardDescription>Add a user by ID and assign a role. They must already have an account.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="User ID (uuid)" value={uid} onChange={(e) => setUid(e.target.value)} />
          <Select value={role} onValueChange={(v) => setRole(v as ResellerTeamRole)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEAM_ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button disabled={!uid || addMut.isPending} onClick={() => addMut.mutate()}>Add</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {team.length === 0 ? (
            <EmptyState title="No staff yet" description="Add your first team member above." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Added</th>
                  <th className="w-10 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-3 font-mono text-xs">{m.user_id}{m.user_id === userId && <Badge variant="outline" className="ml-2">You</Badge>}</td>
                    <td className="p-3">
                      <Select value={m.role} onValueChange={(v) => updateMut.mutate({ id: m.id, role: v as ResellerTeamRole })}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TEAM_ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => removeMut.mutate(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
