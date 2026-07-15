import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Archive,
  Ban,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  Pin,
  Download,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  type ApprovalKind,
  type ApprovalStatus,
  type AssignmentRole,
  type ClientProfile,
  type ClientStatus,
  type SharedResourceKind,
  assignMember,
  createApproval,
  createClient,
  createNote,
  createSharedResource,
  decideApproval,
  deleteClient,
  deleteNote,
  deleteSharedResource,
  exportClientWorkspace,
  listApprovals,
  listAssignments,
  listClients,
  listNotes,
  listSharedResources,
  togglePinnedNote,
  unassignMember,
  updateClientStatus,
} from "../api";

interface Props {
  agencyId: string;
  userId: string;
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  trial: "bg-blue-500/10 text-blue-600",
  active: "bg-emerald-500/10 text-emerald-600",
  suspended: "bg-amber-500/10 text-amber-700",
  archived: "bg-muted text-muted-foreground",
};

const ASSIGN_ROLES: { value: AssignmentRole; label: string }[] = [
  { value: "project_manager", label: "Project Manager" },
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "writer", label: "Content Writer" },
  { value: "seo", label: "SEO Manager" },
  { value: "viewer", label: "Viewer" },
];

const APPROVAL_KINDS: { value: ApprovalKind; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "content", label: "Content" },
  { value: "design", label: "Design" },
  { value: "publishing", label: "Publishing" },
];

const RESOURCE_KINDS: { value: SharedResourceKind; label: string }[] = [
  { value: "template", label: "Template" },
  { value: "asset", label: "Brand Asset" },
  { value: "component", label: "Component" },
  { value: "prompt", label: "Prompt" },
];

export function AgencyDashboard({ agencyId, userId }: Props) {
  const qc = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ["agency", agencyId, "clients"],
    queryFn: () => listClients(agencyId),
  });
  const approvalsQuery = useQuery({
    queryKey: ["agency", agencyId, "approvals"],
    queryFn: () => listApprovals(agencyId),
  });
  const sharedQuery = useQuery({
    queryKey: ["agency", agencyId, "shared"],
    queryFn: () => listSharedResources(agencyId),
  });

  const clients = clientsQuery.data ?? [];
  const totalRevenue = clients.reduce((s, c) => s + (c.monthly_revenue_cents ?? 0), 0);
  const byStatus = (s: ClientStatus) => clients.filter((c) => c.status === s).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total Clients" value={clients.length} />
        <Stat label="Active" value={byStatus("active")} tone="emerald" />
        <Stat label="Trial" value={byStatus("trial")} tone="blue" />
        <Stat label="Suspended" value={byStatus("suspended")} tone="amber" />
        <Stat
          label="Monthly Revenue"
          value={`$${(totalRevenue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="shared">Shared Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ClientsPanel
            agencyId={agencyId}
            userId={userId}
            clients={clients}
            loading={clientsQuery.isLoading}
            refresh={() => qc.invalidateQueries({ queryKey: ["agency", agencyId, "clients"] })}
          />
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalsPanel
            agencyId={agencyId}
            userId={userId}
            approvals={approvalsQuery.data ?? []}
            clients={clients}
            loading={approvalsQuery.isLoading}
            refresh={() => qc.invalidateQueries({ queryKey: ["agency", agencyId, "approvals"] })}
          />
        </TabsContent>

        <TabsContent value="shared">
          <SharedPanel
            agencyId={agencyId}
            userId={userId}
            resources={sharedQuery.data ?? []}
            loading={sharedQuery.isLoading}
            refresh={() => qc.invalidateQueries({ queryKey: ["agency", agencyId, "shared"] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "emerald" | "blue" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "blue"
        ? "text-blue-600"
        : tone === "amber"
          ? "text-amber-700"
          : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

/* ============================ CLIENTS ============================ */

function ClientsPanel({
  agencyId,
  userId,
  clients,
  loading,
  refresh,
}: {
  agencyId: string;
  userId: string;
  clients: ClientProfile[];
  loading: boolean;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ClientStatus>("trial");
  const [detail, setDetail] = useState<ClientProfile | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createClient({ agencyId, ownerId: userId, name: name.trim(), status }),
    onSuccess: () => {
      toast.success("Client created");
      setOpen(false);
      setName("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, s }: { id: string; s: ClientStatus }) => updateClientStatus(id, s),
    onSuccess: () => {
      toast.success("Updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (c: ClientProfile) => deleteClient(c.id, c.client_workspace_id),
    onSuccess: () => {
      toast.success("Client deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Create isolated workspaces for each client.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Client</DialogTitle>
              <DialogDescription>
                A new isolated workspace will be created and linked to this agency.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Client name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Co." />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!name.trim() || create.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="grid place-items-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
            <Users className="mb-2 h-6 w-6" />
            No clients yet. Create your first client to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.client_workspace?.name ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {c.client_workspace?.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[c.status]} variant="secondary">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.onboarding_completed ? "Complete" : `Step ${c.onboarding_step}/5`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(c)}>
                        Open
                      </Button>
                      {c.status !== "suspended" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMut.mutate({ id: c.id, s: "suspended" })}
                          title="Suspend"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMut.mutate({ id: c.id, s: "active" })}
                          title="Reactivate"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {c.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMut.mutate({ id: c.id, s: "archived" })}
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const blob = await exportClientWorkspace(c.client_workspace_id);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${c.client_workspace?.slug ?? "client"}-export.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        title="Export"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete client "${c.client_workspace?.name}"? This cannot be undone.`))
                            del.mutate(c);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {detail && (
        <ClientDetailDialog
          agencyId={agencyId}
          userId={userId}
          client={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </Card>
  );
}

/* ==================== CLIENT DETAIL: assignments + notes + onboarding ==================== */

function ClientDetailDialog({
  agencyId,
  userId,
  client,
  onClose,
}: {
  agencyId: string;
  userId: string;
  client: ClientProfile;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const assignmentsQ = useQuery({
    queryKey: ["agency", agencyId, "assign", client.client_workspace_id],
    queryFn: () => listAssignments(client.client_workspace_id),
  });
  const notesQ = useQuery({
    queryKey: ["agency", agencyId, "notes", client.client_workspace_id],
    queryFn: () => listNotes(client.client_workspace_id),
  });

  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<AssignmentRole>("designer");
  const [noteBody, setNoteBody] = useState("");

  const invalidateAssign = () =>
    qc.invalidateQueries({ queryKey: ["agency", agencyId, "assign", client.client_workspace_id] });
  const invalidateNotes = () =>
    qc.invalidateQueries({ queryKey: ["agency", agencyId, "notes", client.client_workspace_id] });

  const assignM = useMutation({
    mutationFn: () =>
      assignMember({
        agencyId,
        clientWorkspaceId: client.client_workspace_id,
        userId: assignUserId.trim(),
        role: assignRole,
        assignedBy: userId,
      }),
    onSuccess: () => {
      toast.success("Assigned");
      setAssignUserId("");
      invalidateAssign();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noteM = useMutation({
    mutationFn: () =>
      createNote({
        agencyId,
        clientWorkspaceId: client.client_workspace_id,
        authorId: userId,
        body: noteBody.trim(),
      }),
    onSuccess: () => {
      setNoteBody("");
      invalidateNotes();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{client.client_workspace?.name ?? "Client"}</DialogTitle>
          <DialogDescription>
            Manage assignments, notes and onboarding for this client workspace.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="assign">
          <TabsList>
            <TabsTrigger value="assign">Team</TabsTrigger>
            <TabsTrigger value="notes">Internal Notes</TabsTrigger>
            <TabsTrigger value="onboard">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
              <Input
                placeholder="Team member user ID"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
              />
              <Select value={assignRole} onValueChange={(v) => setAssignRole(v as AssignmentRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGN_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => assignM.mutate()} disabled={!assignUserId.trim()}>
                Assign
              </Button>
            </div>
            <div className="rounded-md border">
              {(assignmentsQ.data ?? []).length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No assignments yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(assignmentsQ.data ?? []).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          {a.profile?.display_name ?? a.profile?.email ?? a.user_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{a.role.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await unassignMember(a.id);
                              invalidateAssign();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add an internal note…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <Button onClick={() => noteM.mutate()} disabled={!noteBody.trim()}>
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-auto">
              {(notesQ.data ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No notes yet.</div>
              ) : (
                (notesQ.data ?? []).map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 whitespace-pre-wrap text-sm">{n.body}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await togglePinnedNote(n.id, !n.pinned);
                            invalidateNotes();
                          }}
                        >
                          <Pin className={`h-4 w-4 ${n.pinned ? "text-primary" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await deleteNote(n.id);
                            invalidateNotes();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="onboard">
            <OnboardingWizard client={client} onDone={() => qc.invalidateQueries()} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== ONBOARDING WIZARD ==================== */

import { updateClientOnboarding } from "../api";

const ONBOARD_STEPS = [
  "Business Info",
  "Brand Kit",
  "Domain",
  "Social Accounts",
  "Goals",
];

function OnboardingWizard({ client, onDone }: { client: ClientProfile; onDone: () => void }) {
  const [step, setStep] = useState(client.onboarding_step ?? 0);
  const [state, setState] = useState({
    business_info: client.business_info ?? {},
    brand_kit: client.brand_kit ?? {},
    domain_info: client.domain_info ?? {},
    social_accounts: client.social_accounts ?? {},
    goals: client.goals ?? {},
  });

  const save = async (completed = false) => {
    await updateClientOnboarding(client.id, {
      ...state,
      onboarding_step: step,
      onboarding_completed: completed,
    });
    toast.success(completed ? "Onboarding complete" : "Saved");
    onDone();
  };

  const setField = (
    key: keyof typeof state,
    field: string,
    value: string,
  ) => setState((s) => ({ ...s, [key]: { ...(s[key] as object), [field]: value } }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        {ONBOARD_STEPS.map((label, i) => (
          <div
            key={i}
            className={`flex-1 rounded-md px-2 py-1 text-center ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Business name"
            value={(state.business_info as Record<string, string>).name ?? ""}
            onChange={(v) => setField("business_info", "name", v)}
          />
          <Field
            label="Industry"
            value={(state.business_info as Record<string, string>).industry ?? ""}
            onChange={(v) => setField("business_info", "industry", v)}
          />
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Primary color"
            value={(state.brand_kit as Record<string, string>).primary ?? ""}
            onChange={(v) => setField("brand_kit", "primary", v)}
          />
          <Field
            label="Logo URL"
            value={(state.brand_kit as Record<string, string>).logo ?? ""}
            onChange={(v) => setField("brand_kit", "logo", v)}
          />
        </div>
      )}
      {step === 2 && (
        <Field
          label="Custom domain"
          value={(state.domain_info as Record<string, string>).host ?? ""}
          onChange={(v) => setField("domain_info", "host", v)}
        />
      )}
      {step === 3 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Instagram"
            value={(state.social_accounts as Record<string, string>).instagram ?? ""}
            onChange={(v) => setField("social_accounts", "instagram", v)}
          />
          <Field
            label="Twitter/X"
            value={(state.social_accounts as Record<string, string>).twitter ?? ""}
            onChange={(v) => setField("social_accounts", "twitter", v)}
          />
        </div>
      )}
      {step === 4 && (
        <Field
          label="Primary goal"
          value={(state.goals as Record<string, string>).primary ?? ""}
          onChange={(v) => setField("goals", "primary", v)}
        />
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        {step < ONBOARD_STEPS.length - 1 ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save(false)}>
              Save
            </Button>
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          </div>
        ) : (
          <Button onClick={() => save(true)}>Finish</Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ============================ APPROVALS ============================ */

function ApprovalsPanel({
  agencyId,
  userId,
  approvals,
  clients,
  loading,
  refresh,
}: {
  agencyId: string;
  userId: string;
  approvals: Awaited<ReturnType<typeof listApprovals>>;
  clients: ClientProfile[];
  loading: boolean;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [clientWs, setClientWs] = useState("");
  const [kind, setKind] = useState<ApprovalKind>("content");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createApproval({
        agencyId,
        clientWorkspaceId: clientWs,
        kind,
        title: title.trim(),
        description: desc.trim() || undefined,
        requestedBy: userId,
      }),
    onSuccess: () => {
      toast.success("Approval requested");
      setOpen(false);
      setTitle("");
      setDesc("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (input: { current: (typeof approvals)[number]; status: ApprovalStatus }) =>
      decideApproval({
        id: input.current.id,
        status: input.status,
        userId,
        current: input.current,
      }),
    onSuccess: () => {
      toast.success("Decision recorded");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Approval Center</CardTitle>
          <CardDescription>
            Drafts, content, design and publishing approvals with full history.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={clients.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Request Approval
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Approval</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={clientWs} onValueChange={setClientWs}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.client_workspace_id} value={c.client_workspace_id}>
                        {c.client_workspace?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as ApprovalKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Title" value={title} onChange={setTitle} />
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!clientWs || !title.trim() || create.isPending}
              >
                Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : approvals.length === 0 ? (
          <div className="grid place-items-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
            No approval requests yet.
          </div>
        ) : (
          <div className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{a.kind}</Badge>
                      <ApprovalBadge status={a.status} />
                    </div>
                    <div className="mt-1 font-medium">{a.title}</div>
                    {a.description && (
                      <div className="text-sm text-muted-foreground">{a.description}</div>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                      {a.history.length > 0 && ` · ${a.history.length} event(s)`}
                    </div>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide.mutate({ current: a, status: "approved" })}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          decide.mutate({ current: a, status: "revision_requested" })
                        }
                      >
                        <MessageSquareWarning className="mr-1 h-4 w-4" /> Revise
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide.mutate({ current: a, status: "rejected" })}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, string> = {
    pending: "bg-amber-500/10 text-amber-700",
    approved: "bg-emerald-500/10 text-emerald-700",
    rejected: "bg-destructive/10 text-destructive",
    revision_requested: "bg-blue-500/10 text-blue-700",
  };
  return (
    <Badge className={map[status]} variant="secondary">
      {status.replace("_", " ")}
    </Badge>
  );
}

/* ============================ SHARED RESOURCES ============================ */

function SharedPanel({
  agencyId,
  userId,
  resources,
  loading,
  refresh,
}: {
  agencyId: string;
  userId: string;
  resources: Awaited<ReturnType<typeof listSharedResources>>;
  loading: boolean;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SharedResourceKind>("template");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createSharedResource({
        agencyId,
        kind,
        title: title.trim(),
        description: desc.trim() || undefined,
        userId,
      }),
    onSuccess: () => {
      toast.success("Resource added");
      setOpen(false);
      setTitle("");
      setDesc("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Shared Resources</CardTitle>
          <CardDescription>
            Templates, brand assets, components and prompts shared across your agency.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Shared Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as SharedResourceKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_KINDS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Title" value={title} onChange={setTitle} />
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!title.trim() || create.isPending}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : resources.length === 0 ? (
          <div className="grid place-items-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
            <Sparkles className="mb-2 h-6 w-6" />
            No shared resources yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <Badge variant="outline" className="mb-1">
                        {r.kind}
                      </Badge>
                      <div className="truncate font-medium">{r.title}</div>
                      {r.description && (
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {r.description}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deleteSharedResource(r.id);
                        refresh();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
