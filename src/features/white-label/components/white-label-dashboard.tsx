import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Globe,
  Palette,
  Mail,
  Shield,
  Settings,
  Plus,
  Trash2,
  Pause,
  Play,
  Archive,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { MediaField } from "@/shared/ui/media-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import {
  addTenantDomain,
  createTenant,
  deleteTenant,
  listMyTenants,
  listTenantDomains,
  removeTenantDomain,
  setTenantStatus,
  updateTenant,
  verifyTenantDomain,
} from "../api";
import type { Tenant, TenantDomainKind, TenantStatus } from "../types";

export function WhiteLabelDashboard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["white-label", "tenants"],
    queryFn: listMyTenants,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const selected = useMemo(
    () => tenants.find((t) => t.id === selectedId) ?? tenants[0] ?? null,
    [tenants, selectedId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="White Label"
        description="Launch ZUPIX under partner brands with isolated branding, domains and email."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "White Label" }]}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New tenant
          </Button>
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No partner tenants yet"
          description="Create your first white-label tenant to launch ZUPIX under a partner brand."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create tenant
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <TenantList
            tenants={tenants}
            selectedId={selected?.id}
            onSelect={(id) => setSelectedId(id)}
          />
          {selected ? (
            <TenantEditor
              tenant={selected}
              onChanged={() =>
                qc.invalidateQueries({ queryKey: ["white-label", "tenants"] })
              }
              onDeleted={() => {
                setSelectedId(null);
                qc.invalidateQueries({ queryKey: ["white-label", "tenants"] });
              }}
            />
          ) : null}
        </div>
      )}

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={userId}
        onCreated={(t) => {
          setSelectedId(t.id);
          qc.invalidateQueries({ queryKey: ["white-label", "tenants"] });
          navigate({ to: "/app/white-label" });
        }}
      />
    </div>
  );
}

// ---------- List ----------

function TenantList({
  tenants,
  selectedId,
  onSelect,
}: {
  tenants: Tenant[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Tenants</CardTitle>
        <CardDescription className="text-xs">{tenants.length} total</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 p-2">
        {tenants.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              selectedId === t.id
                ? "bg-accent font-medium"
                : "hover:bg-accent/60 text-muted-foreground"
            }`}
          >
            <div
              className="h-6 w-6 shrink-0 rounded"
              style={{ background: t.primary_color ?? "#6366F1" }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate">{t.company_name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{t.slug}</div>
            </div>
            <StatusBadge status={t.status} />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: TenantStatus }) {
  const map: Record<TenantStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/15 text-emerald-500" },
    suspended: { label: "Suspended", className: "bg-amber-500/15 text-amber-500" },
    archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
  };
  const info = map[status];
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${info.className}`}>
      {info.label}
    </span>
  );
}

// ---------- Editor ----------

function TenantEditor({
  tenant,
  onChanged,
  onDeleted,
}: {
  tenant: Tenant;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<Tenant>(tenant);
  useMemoResetForm(tenant, setForm);

  const save = useMutation({
    mutationFn: async () => {
      const patch: Partial<Tenant> = {
        company_name: form.company_name,
        logo_url: form.logo_url,
        logo_dark_url: form.logo_dark_url,
        favicon_url: form.favicon_url,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        typography: form.typography,
        email_signature: form.email_signature,
        login_background_url: form.login_background_url,
        login_footer_html: form.login_footer_html,
        login_headline: form.login_headline,
        login_subheadline: form.login_subheadline,
        register_enabled: form.register_enabled,
        forgot_enabled: form.forgot_enabled,
        email_sender_name: form.email_sender_name,
        email_sender_email: form.email_sender_email,
        email_reply_to: form.email_reply_to,
        email_logo_url: form.email_logo_url,
        email_footer_html: form.email_footer_html,
        hide_powered_by: form.hide_powered_by,
        hide_zupix_logo: form.hide_zupix_logo,
        hide_default_branding: form.hide_default_branding,
        hide_developer_links: form.hide_developer_links,
        workspace_limit: form.workspace_limit,
        ai_credit_limit: form.ai_credit_limit,
        storage_limit_mb: form.storage_limit_mb,
      };
      await updateTenant(tenant.id, patch);
    },
    onSuccess: () => {
      toast.success("Tenant saved");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (status: TenantStatus) => setTenantStatus(tenant.id, status),
    onSuccess: () => {
      toast.success("Status updated");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteTenant(tenant.id),
    onSuccess: () => {
      toast.success("Tenant deleted");
      onDeleted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <TenantOverview tenant={tenant} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{tenant.company_name}</CardTitle>
            <CardDescription>Tenant configuration & branding</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {tenant.status !== "active" && (
              <Button size="sm" variant="outline" onClick={() => statusMut.mutate("active")}>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Activate
              </Button>
            )}
            {tenant.status === "active" && (
              <Button size="sm" variant="outline" onClick={() => statusMut.mutate("suspended")}>
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Suspend
              </Button>
            )}
            {tenant.status !== "archived" && (
              <Button size="sm" variant="outline" onClick={() => statusMut.mutate("archived")}>
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                Archive
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete tenant "${tenant.company_name}"? This cannot be undone.`))
                  deleteMut.mutate();
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="branding">
                <Palette className="mr-1.5 h-3.5 w-3.5" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="login">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Login
              </TabsTrigger>
              <TabsTrigger value="domains">
                <Globe className="mr-1.5 h-3.5 w-3.5" />
                Domains
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email
              </TabsTrigger>
              <TabsTrigger value="whitelabel">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                White Label
              </TabsTrigger>
              <TabsTrigger value="config">
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Config
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company name">
                  <Input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  />
                </Field>
                <Field label="Logo">
                  <MediaField
                    label=""
                    value={form.logo_url ?? undefined}
                    onChange={(url) => setForm({ ...form, logo_url: url ?? "" })}
                    pickerTitle="Choose or upload logo"
                    previewAspect="1 / 1"
                  />
                </Field>
                <Field label="Dark logo">
                  <MediaField
                    label=""
                    value={form.logo_dark_url ?? undefined}
                    onChange={(url) => setForm({ ...form, logo_dark_url: url ?? "" })}
                    pickerTitle="Choose or upload dark logo"
                    previewAspect="1 / 1"
                  />
                </Field>
                <Field label="Favicon">
                  <MediaField
                    label=""
                    value={form.favicon_url ?? undefined}
                    onChange={(url) => setForm({ ...form, favicon_url: url ?? "" })}
                    pickerTitle="Choose or upload favicon"
                    previewAspect="1 / 1"
                  />
                </Field>
                <Field label="Primary color">
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={form.primary_color ?? "#6366F1"}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      className="w-14 p-1"
                    />
                    <Input
                      value={form.primary_color ?? ""}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Secondary color">
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={form.secondary_color ?? "#0EA5E9"}
                      onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                      className="w-14 p-1"
                    />
                    <Input
                      value={form.secondary_color ?? ""}
                      onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Heading font">
                  <Input
                    value={form.typography?.heading ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        typography: { ...form.typography, heading: e.target.value },
                      })
                    }
                    placeholder="Inter"
                  />
                </Field>
                <Field label="Body font">
                  <Input
                    value={form.typography?.body ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        typography: { ...form.typography, body: e.target.value },
                      })
                    }
                    placeholder="Inter"
                  />
                </Field>
                <Field label="Email signature" className="md:col-span-2">
                  <Textarea
                    rows={3}
                    value={form.email_signature ?? ""}
                    onChange={(e) => setForm({ ...form, email_signature: e.target.value })}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="login" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Login background URL">
                  <Input
                    value={form.login_background_url ?? ""}
                    onChange={(e) => setForm({ ...form, login_background_url: e.target.value })}
                  />
                </Field>
                <Field label="Login headline">
                  <Input
                    value={form.login_headline ?? ""}
                    onChange={(e) => setForm({ ...form, login_headline: e.target.value })}
                  />
                </Field>
                <Field label="Login subheadline" className="md:col-span-2">
                  <Input
                    value={form.login_subheadline ?? ""}
                    onChange={(e) => setForm({ ...form, login_subheadline: e.target.value })}
                  />
                </Field>
                <Field label="Custom footer HTML" className="md:col-span-2">
                  <Textarea
                    rows={4}
                    value={form.login_footer_html ?? ""}
                    onChange={(e) => setForm({ ...form, login_footer_html: e.target.value })}
                  />
                </Field>
                <Toggle
                  label="Allow registration"
                  checked={form.register_enabled}
                  onChange={(v) => setForm({ ...form, register_enabled: v })}
                />
                <Toggle
                  label="Allow forgot password"
                  checked={form.forgot_enabled}
                  onChange={(v) => setForm({ ...form, forgot_enabled: v })}
                />
              </div>
            </TabsContent>

            <TabsContent value="domains" className="pt-4">
              <DomainsPanel tenantId={tenant.id} />
            </TabsContent>

            <TabsContent value="email" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sender name">
                  <Input
                    value={form.email_sender_name ?? ""}
                    onChange={(e) => setForm({ ...form, email_sender_name: e.target.value })}
                  />
                </Field>
                <Field label="Sender email">
                  <Input
                    type="email"
                    value={form.email_sender_email ?? ""}
                    onChange={(e) => setForm({ ...form, email_sender_email: e.target.value })}
                  />
                </Field>
                <Field label="Reply-to">
                  <Input
                    type="email"
                    value={form.email_reply_to ?? ""}
                    onChange={(e) => setForm({ ...form, email_reply_to: e.target.value })}
                  />
                </Field>
                <Field label="Email logo URL">
                  <Input
                    value={form.email_logo_url ?? ""}
                    onChange={(e) => setForm({ ...form, email_logo_url: e.target.value })}
                  />
                </Field>
                <Field label="Email footer HTML" className="md:col-span-2">
                  <Textarea
                    rows={4}
                    value={form.email_footer_html ?? ""}
                    onChange={(e) => setForm({ ...form, email_footer_html: e.target.value })}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="whitelabel" className="space-y-3 pt-4">
              <Toggle
                label="Hide 'Powered by ZUPIX'"
                description="Removes the small credit shown across tenant surfaces."
                checked={form.hide_powered_by}
                onChange={(v) => setForm({ ...form, hide_powered_by: v })}
              />
              <Toggle
                label="Hide ZUPIX logo"
                description="Replaces every ZUPIX logo with the tenant logo."
                checked={form.hide_zupix_logo}
                onChange={(v) => setForm({ ...form, hide_zupix_logo: v })}
              />
              <Toggle
                label="Hide default branding"
                description="Suppresses default colors, fonts and marks."
                checked={form.hide_default_branding}
                onChange={(v) => setForm({ ...form, hide_default_branding: v })}
              />
              <Toggle
                label="Hide developer links"
                description="Removes API/docs/status links from tenant-facing UI."
                checked={form.hide_developer_links}
                onChange={(v) => setForm({ ...form, hide_developer_links: v })}
              />
            </TabsContent>

            <TabsContent value="config" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Workspace limit">
                  <Input
                    type="number"
                    value={form.workspace_limit}
                    onChange={(e) =>
                      setForm({ ...form, workspace_limit: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="AI credit limit">
                  <Input
                    type="number"
                    value={form.ai_credit_limit}
                    onChange={(e) =>
                      setForm({ ...form, ai_credit_limit: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Storage limit (MB)">
                  <Input
                    type="number"
                    value={form.storage_limit_mb}
                    onChange={(e) =>
                      setForm({ ...form, storage_limit_mb: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Feature flags & billing settings are edited via the entitlements & billing tools.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function useMemoResetForm(tenant: Tenant, setForm: (t: Tenant) => void) {
  const key = tenant.id + tenant.updated_at;
  useMemo(() => {
    setForm(tenant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// ---------- Overview ----------

function TenantOverview({ tenant }: { tenant: Tenant }) {
  const { data: domains = [] } = useQuery({
    queryKey: ["white-label", "domains", tenant.id],
    queryFn: () => listTenantDomains(tenant.id),
  });
  const verified = domains.filter((d) => d.status === "verified").length;
  const stats = [
    { label: "Brand status", value: brandStatus(tenant) },
    { label: "Domains", value: `${verified}/${domains.length} verified` },
    { label: "Workspaces", value: `0 / ${tenant.workspace_limit}` },
    { label: "AI credits", value: `${tenant.ai_credit_limit}` },
    { label: "Storage", value: `${tenant.storage_limit_mb} MB` },
    { label: "Subscription", value: tenant.status === "active" ? "Active" : tenant.status },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-1 text-sm font-semibold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function brandStatus(t: Tenant): string {
  const has = Boolean(t.logo_url && t.primary_color && t.company_name);
  return has ? "Configured" : "Incomplete";
}

// ---------- Domains panel ----------

function DomainsPanel({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["white-label", "domains", tenantId],
    queryFn: () => listTenantDomains(tenantId),
  });
  const [host, setHost] = useState("");
  const [kind, setKind] = useState<TenantDomainKind>("primary");
  const [loginUrl, setLoginUrl] = useState("");

  const add = useMutation({
    mutationFn: () =>
      addTenantDomain({
        tenant_id: tenantId,
        host: host.trim().toLowerCase(),
        kind,
        custom_login_url: loginUrl.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Domain added");
      setHost("");
      setLoginUrl("");
      qc.invalidateQueries({ queryKey: ["white-label", "domains", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: (id: string) => verifyTenantDomain(id),
    onSuccess: () => {
      toast.success("Marked verified");
      qc.invalidateQueries({ queryKey: ["white-label", "domains", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeTenantDomain(id),
    onSuccess: () => {
      toast.success("Domain removed");
      qc.invalidateQueries({ queryKey: ["white-label", "domains", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
        <Input
          placeholder="portal.partnerdomain.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
        <Select value={kind} onValueChange={(v) => setKind(v as TenantDomainKind)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="portal">Portal</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Custom login URL (optional)"
          value={loginUrl}
          onChange={(e) => setLoginUrl(e.target.value)}
        />
        <Button onClick={() => add.mutate()} disabled={add.isPending || !host.trim()}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
      ) : domains.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No domains connected yet.
        </div>
      ) : (
        <div className="space-y-2">
          {domains.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm"
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{d.host}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {d.kind}
                  </Badge>
                  {d.status === "verified" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> verified
                    </span>
                  ) : d.status === "failed" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-500">
                      <XCircle className="h-3 w-3" /> failed
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500">pending</span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  TXT _zupix-verify → <code className="font-mono">{d.verification_token}</code>
                </div>
                {d.custom_login_url && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Login: {d.custom_login_url}
                  </div>
                )}
              </div>
              {d.status !== "verified" && (
                <Button size="sm" variant="outline" onClick={() => verify.mutate(d.id)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Verify
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(d.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Create dialog ----------

function CreateTenantDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  onCreated: (t: Tenant) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createTenant({
        company_name: name.trim(),
        slug: slug.trim().toLowerCase(),
        owner_id: userId,
      }),
    onSuccess: (t) => {
      toast.success("Tenant created");
      setName("");
      setSlug("");
      onOpenChange(false);
      onCreated(t);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create tenant</DialogTitle>
          <DialogDescription>
            Launch a new partner brand with isolated branding and domains.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Company name">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug)
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                      .slice(0, 50),
                  );
              }}
              placeholder="Acme Partners"
            />
          </Field>
          <Field label="Slug" hint="Lowercase letters, numbers, hyphens (3–50)">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme-partners"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !name.trim() || slug.length < 3}
          >
            {create.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Create tenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Small helpers ----------

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-[11px] text-muted-foreground">{description}</div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
