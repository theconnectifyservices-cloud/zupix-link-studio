import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Users,
  Layers,
  KeyRound,
  ShieldCheck,
  FileCheck2,
  ScrollText,
  Archive,
  Trash2,
  Download,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  archiveOrganization,
  createDepartment,
  createLicense,
  createOrganization,
  deleteDepartment,
  deleteLicense,
  deleteOrganization,
  exportOrganizationData,
  getEnterpriseMetrics,
  getGovernancePolicy,
  listCompliance,
  listDepartments,
  listLicenses,
  listMyOrganizations,
  listOrgAudit,
  renameOrganization,
  updateOrganizationBranding,
  upsertCompliance,
  upsertGovernancePolicy,
  type ComplianceFramework,
  type ComplianceStatus,
  type GovernancePolicy,
  type LicenseSeatType,
  type Organization,
} from "../api";

const FRAMEWORKS: { key: ComplianceFramework; label: string; description: string }[] = [
  { key: "gdpr", label: "GDPR", description: "EU data protection & privacy" },
  { key: "soc2", label: "SOC 2", description: "Trust services criteria" },
  { key: "iso27001", label: "ISO 27001", description: "Information security management" },
  { key: "hipaa", label: "HIPAA", description: "Healthcare data (US)" },
];

export function EnterpriseDashboard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const orgsQ = useQuery({ queryKey: ["enterprise-orgs"], queryFn: listMyOrganizations });
  const orgs = orgsQ.data ?? [];
  const activeOrg = orgs.find((o) => o.id === selectedOrgId) ?? orgs[0] ?? null;
  const orgId = activeOrg?.id ?? null;

  const create = useMutation({
    mutationFn: createOrganization,
    onSuccess: (org) => {
      toast.success("Organization created");
      setCreateOpen(false);
      setSelectedOrgId(org.id);
      qc.invalidateQueries({ queryKey: ["enterprise-orgs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (orgsQ.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading enterprise…</div>;
  }

  if (!orgs.length) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No organizations"
          description="Create an enterprise organization to manage departments, licenses, governance and compliance."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Organization
            </Button>
          }
        />
        <CreateOrgDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={(v) => create.mutate({ ...v, ownerId: userId })}
          pending={create.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs uppercase text-muted-foreground">Organization</Label>
          <Select value={orgId ?? ""} onValueChange={(v) => setSelectedOrgId(v)}>
            <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name} {o.archived_at ? "(archived)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {orgId && (
            <Button
              variant="outline"
              onClick={async () => {
                const data = await exportOrganizationData(orgId);
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `org-${orgId}-export.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Export downloaded");
              }}
            >
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Org
          </Button>
        </div>
      </div>

      {activeOrg && orgId && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-7 h-auto">
            <TabsTrigger value="overview"><Sparkles className="h-3.5 w-3.5 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="org"><Building2 className="h-3.5 w-3.5 mr-1.5" />Org</TabsTrigger>
            <TabsTrigger value="departments"><Layers className="h-3.5 w-3.5 mr-1.5" />Departments</TabsTrigger>
            <TabsTrigger value="licenses"><KeyRound className="h-3.5 w-3.5 mr-1.5" />Licenses</TabsTrigger>
            <TabsTrigger value="governance"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" />Governance</TabsTrigger>
            <TabsTrigger value="compliance"><FileCheck2 className="h-3.5 w-3.5 mr-1.5" />Compliance</TabsTrigger>
            <TabsTrigger value="audit"><ScrollText className="h-3.5 w-3.5 mr-1.5" />Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewPanel orgId={orgId} />
          </TabsContent>
          <TabsContent value="org" className="mt-6">
            <OrgSettingsPanel org={activeOrg} />
          </TabsContent>
          <TabsContent value="departments" className="mt-6">
            <DepartmentsPanel orgId={orgId} />
          </TabsContent>
          <TabsContent value="licenses" className="mt-6">
            <LicensesPanel orgId={orgId} />
          </TabsContent>
          <TabsContent value="governance" className="mt-6">
            <GovernancePanel orgId={orgId} />
          </TabsContent>
          <TabsContent value="compliance" className="mt-6">
            <CompliancePanel orgId={orgId} />
          </TabsContent>
          <TabsContent value="audit" className="mt-6">
            <AuditPanel orgId={orgId} />
          </TabsContent>
        </Tabs>
      )}

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(v) => create.mutate({ ...v, ownerId: userId })}
        pending={create.isPending}
      />
    </div>
  );
}

/* -------------------- Create Org -------------------- */
function CreateOrgDialog({
  open, onOpenChange, onCreate, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (v: { name: string; slug: string; description?: string }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Set up a new enterprise organization.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
            }} placeholder="Acme Corp" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name || !slug || pending}
            onClick={() => onCreate({ name, slug, description: desc || undefined })}
          >Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Overview -------------------- */
function OverviewPanel({ orgId }: { orgId: string }) {
  const q = useQuery({ queryKey: ["ent-metrics", orgId], queryFn: () => getEnterpriseMetrics(orgId) });
  const m = q.data;
  const cards = [
    { label: "Departments", value: m?.departments ?? 0, icon: Layers },
    { label: "Workspaces", value: m?.workspaces ?? 0, icon: Building2 },
    { label: "Active Users", value: m?.members ?? 0, icon: Users },
    { label: "Total Seats", value: m?.totalSeats ?? 0, icon: KeyRound },
    { label: "Assigned Seats", value: m?.assignedSeats ?? 0, icon: KeyRound },
    { label: "Available Seats", value: m?.availableSeats ?? 0, icon: KeyRound },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </CardDescription>
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{c.value}</div></CardContent>
        </Card>
      ))}
    </div>
  );
}

/* -------------------- Org Settings -------------------- */
function OrgSettingsPanel({ org }: { org: Organization }) {
  const qc = useQueryClient();
  const [name, setName] = useState(org.name);
  const [desc, setDesc] = useState(org.description ?? "");
  const [logo, setLogo] = useState(org.logo_url ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (name !== org.name) await renameOrganization(org.id, name);
      await updateOrganizationBranding(org.id, { description: desc, logo_url: logo });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["enterprise-orgs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: () => archiveOrganization(org.id, !org.archived_at),
    onSuccess: () => {
      toast.success(org.archived_at ? "Unarchived" : "Archived");
      qc.invalidateQueries({ queryKey: ["enterprise-orgs"] });
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteOrganization(org.id),
    onSuccess: () => {
      toast.success("Organization deleted");
      qc.invalidateQueries({ queryKey: ["enterprise-orgs"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
        <CardDescription>Name, branding, and lifecycle actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-2xl">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
          <Button variant="outline" onClick={() => archive.mutate()}>
            <Archive className="h-4 w-4 mr-2" />{org.archived_at ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="destructive" onClick={() => {
            if (confirm("Delete this organization? This soft-deletes and hides all data.")) remove.mutate();
          }}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Departments -------------------- */
function DepartmentsPanel({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ent-depts", orgId], queryFn: () => listDepartments(orgId) });
  const [name, setName] = useState("");
  const [parent, setParent] = useState<string>("none");

  const create = useMutation({
    mutationFn: () =>
      createDepartment({
        organization_id: orgId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        parent_id: parent === "none" ? null : parent,
      }),
    onSuccess: () => {
      toast.success("Department created");
      setName("");
      qc.invalidateQueries({ queryKey: ["ent-depts", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ent-depts", orgId] }),
  });

  const depts = q.data ?? [];
  const tree = useMemo(() => {
    const byParent = new Map<string | null, typeof depts>();
    for (const d of depts) {
      const k = d.parent_id;
      if (!byParent.has(k)) byParent.set(k, []);
      byParent.get(k)!.push(d);
    }
    return byParent;
  }, [depts]);

  const Row = ({ id, level }: { id: string | null; level: number }) => (
    <>
      {(tree.get(id) ?? []).map((d) => (
        <div key={d.id}>
          <div className="flex items-center justify-between py-2 border-b" style={{ paddingLeft: level * 20 }}>
            <div>
              <div className="font-medium">{d.name}</div>
              {d.description && <div className="text-xs text-muted-foreground">{d.description}</div>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => del.mutate(d.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Row id={d.id} level={level + 1} />
        </div>
      ))}
    </>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
        <CardContent>
          {depts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No departments yet.</div>
          ) : (
            <Row id={null} level={0} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>New Department</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Parent</Label>
            <Select value={parent} onValueChange={setParent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top-level)</SelectItem>
                {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={!name || create.isPending} onClick={() => create.mutate()} className="w-full">
            <Plus className="h-4 w-4 mr-2" />Create
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Licenses -------------------- */
function LicensesPanel({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ent-licenses", orgId], queryFn: () => listLicenses(orgId) });
  const [name, setName] = useState("");
  const [tier, setTier] = useState("standard");
  const [seatType, setSeatType] = useState<LicenseSeatType>("user");
  const [total, setTotal] = useState(10);
  const [expires, setExpires] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createLicense({
        organization_id: orgId,
        name,
        tier,
        seat_type: seatType,
        total_seats: total,
        status: "active",
        expires_at: expires || null,
      }),
    onSuccess: () => {
      toast.success("License created");
      setName("");
      qc.invalidateQueries({ queryKey: ["ent-licenses", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteLicense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ent-licenses", orgId] }),
  });

  const licenses = q.data ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Licenses</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((l) => {
                const expired = l.expires_at && new Date(l.expires_at) < new Date();
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.tier}</TableCell>
                    <TableCell>{l.seat_type}</TableCell>
                    <TableCell>{l.total_seats}</TableCell>
                    <TableCell>
                      <Badge variant={expired ? "destructive" : "secondary"}>
                        {expired ? "expired" : l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(l.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {licenses.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No licenses yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>New License</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seat Type</Label>
            <Select value={seatType} onValueChange={(v) => setSeatType(v as LicenseSeatType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Per User</SelectItem>
                <SelectItem value="workspace">Per Workspace</SelectItem>
                <SelectItem value="organization">Per Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Total Seats</Label>
            <Input type="number" min={0} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
          </div>
          <div>
            <Label>Expires At</Label>
            <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <Button disabled={!name || create.isPending} onClick={() => create.mutate()} className="w-full">
            <Plus className="h-4 w-4 mr-2" />Create
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Governance -------------------- */
function GovernancePanel({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ent-gov", orgId], queryFn: () => getGovernancePolicy(orgId) });
  const defaults: Partial<GovernancePolicy> = {
    password_min_length: 8,
    password_require_symbols: false,
    password_require_numbers: true,
    session_timeout_minutes: 480,
    mfa_required: false,
    workspace_creation_role: "admin",
    publishing_requires_approval: false,
    allowed_domains: [],
    api_access_enabled: true,
    api_ip_allowlist: [],
  };
  const p = { ...defaults, ...(q.data ?? {}) } as GovernancePolicy;
  const [state, setState] = useState<Partial<GovernancePolicy>>(p);
  const merged = { ...p, ...state };

  const save = useMutation({
    mutationFn: () => upsertGovernancePolicy(orgId, state),
    onSuccess: () => {
      toast.success("Policy saved");
      qc.invalidateQueries({ queryKey: ["ent-gov", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = <K extends keyof GovernancePolicy>(k: K, v: GovernancePolicy[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  return (
    <Card>
      <CardHeader><CardTitle>Governance Policies</CardTitle><CardDescription>Enterprise-wide security and access rules.</CardDescription></CardHeader>
      <CardContent className="space-y-6 max-w-3xl">
        <section className="space-y-3">
          <h4 className="font-medium">Password Policy</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min Length</Label>
              <Input type="number" min={6} max={64} value={merged.password_min_length}
                onChange={(e) => update("password_min_length", Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Require Numbers</Label>
              <Switch checked={merged.password_require_numbers}
                onCheckedChange={(v) => update("password_require_numbers", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Symbols</Label>
              <Switch checked={merged.password_require_symbols}
                onCheckedChange={(v) => update("password_require_symbols", v)} />
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h4 className="font-medium">Session & MFA</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Session Timeout (min)</Label>
              <Input type="number" min={5} value={merged.session_timeout_minutes}
                onChange={(e) => update("session_timeout_minutes", Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>MFA Required</Label>
              <Switch checked={merged.mfa_required} onCheckedChange={(v) => update("mfa_required", v)} />
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h4 className="font-medium">Workspaces & Publishing</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Who can create workspaces</Label>
              <Select value={merged.workspace_creation_role}
                onValueChange={(v) => update("workspace_creation_role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any member</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="owner">Owner only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Publishing requires approval</Label>
              <Switch checked={merged.publishing_requires_approval}
                onCheckedChange={(v) => update("publishing_requires_approval", v)} />
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h4 className="font-medium">Domain & API</h4>
          <div>
            <Label>Allowed Domains (comma-separated)</Label>
            <Input value={(merged.allowed_domains ?? []).join(", ")}
              onChange={(e) => update("allowed_domains", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>API access enabled</Label>
            <Switch checked={merged.api_access_enabled}
              onCheckedChange={(v) => update("api_access_enabled", v)} />
          </div>
          <div>
            <Label>API IP allowlist (comma-separated)</Label>
            <Input value={(merged.api_ip_allowlist ?? []).join(", ")}
              onChange={(e) => update("api_ip_allowlist", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </div>
        </section>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Policy</Button>
      </CardContent>
    </Card>
  );
}

/* -------------------- Compliance -------------------- */
function CompliancePanel({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ent-compliance", orgId], queryFn: () => listCompliance(orgId) });
  const byKey = new Map(q.data?.map((r) => [r.framework, r]) ?? []);
  const upsert = useMutation({
    mutationFn: ({ f, patch }: { f: ComplianceFramework; patch: Partial<typeof q.data extends (infer T)[] | undefined ? T : never> }) =>
      upsertCompliance(orgId, f, patch as any),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["ent-compliance", orgId] });
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {FRAMEWORKS.map((fw) => {
        const rec = byKey.get(fw.key);
        return (
          <Card key={fw.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{fw.label}</CardTitle>
                  <CardDescription>{fw.description}</CardDescription>
                </div>
                <Badge variant={rec?.status === "compliant" ? "default" : "secondary"}>
                  {rec?.status ?? "not_started"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Status</Label>
                <Select value={rec?.status ?? "not_started"}
                  onValueChange={(v) => upsert.mutate({ f: fw.key, patch: { status: v as ComplianceStatus } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Retention (days)</Label>
                <Input type="number" min={1} defaultValue={rec?.data_retention_days ?? 365}
                  onBlur={(e) => upsert.mutate({ f: fw.key, patch: { data_retention_days: Number(e.target.value) } })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Legal Hold</Label>
                <Switch checked={rec?.legal_hold ?? false}
                  onCheckedChange={(v) => upsert.mutate({ f: fw.key, patch: { legal_hold: v } })} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* -------------------- Audit -------------------- */
function AuditPanel({ orgId }: { orgId: string }) {
  const q = useQuery({ queryKey: ["ent-audit", orgId], queryFn: () => listOrgAudit(orgId) });
  const logs = (q.data ?? []) as Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    actor_id: string | null;
    created_at: string;
  }>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Authentication, publishing, billing, permission and admin events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                <TableCell className="text-xs">{l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}</TableCell>
                <TableCell className="text-xs">{l.actor_id ? l.actor_id.slice(0, 8) : "system"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No audit events yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
