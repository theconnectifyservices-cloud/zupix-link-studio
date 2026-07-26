import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  ShieldCheck,
  Mail,
  Activity,
  Plus,
  Trash2,
  Star,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { MediaField } from "@/shared/ui/media-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  addDomain,
  removeDomain,
  resolveAlert,
  runDomainDiagnostics,
  setPrimaryDomain,
  upsertSmtpConfig,
  verifySmtpConfig,
} from "../api";
import { useInfraAlerts, useInfraDomains, useInfraStats, useSmtpConfig } from "../hooks";
import type { DnsRecordCheck, TenantDomainExtended } from "../types";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className="gap-1">
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function DnsRow({ r }: { r: DnsRecordCheck }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">{r.type}</Badge>
          <span className="font-mono text-xs truncate">{r.name}</span>
        </div>
        {r.expected && <div className="text-xs text-muted-foreground mt-1">Expected: <code>{r.expected}</code></div>}
        <div className="text-xs text-muted-foreground truncate">
          Found: {r.actual.length ? r.actual.join(", ") : "—"}
        </div>
      </div>
      {r.ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
      )}
    </div>
  );
}

function DomainDetail({ domain, tenantId }: { domain: TenantDomainExtended; tenantId: string }) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["infra-domains", tenantId] });
    qc.invalidateQueries({ queryKey: ["infra-stats", tenantId] });
    qc.invalidateQueries({ queryKey: ["infra-alerts", tenantId] });
  };
  const diag = useMutation({
    mutationFn: () => runDomainDiagnostics(domain),
    onSuccess: () => {
      toast.success("Diagnostics complete");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const primary = useMutation({
    mutationFn: () => setPrimaryDomain(tenantId, domain.id),
    onSuccess: () => {
      toast.success("Primary domain updated");
      invalidate();
    },
  });
  const del = useMutation({
    mutationFn: () => removeDomain(domain.id),
    onSuccess: () => {
      toast.success("Domain removed");
      invalidate();
    },
  });

  const health = domain.health as { score?: number; errors?: string[] };
  const dns = domain.dns_records ?? {};
  const groups = Object.entries(dns) as [string, DnsRecordCheck[]][];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {domain.host}
              {domain.is_primary && <Badge variant="default">Primary</Badge>}
              {domain.is_wildcard && <Badge variant="outline">Wildcard</Badge>}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge ok={domain.status === "verified"} label={`Domain ${domain.status}`} />
              <StatusBadge ok={domain.ssl_status === "active"} label={`SSL ${domain.ssl_status}`} />
              <StatusBadge ok={domain.http_redirect_ok} label="HTTP→HTTPS" />
              <StatusBadge ok={domain.www_redirect_ok} label="WWW redirect" />
              <Badge variant="secondary">{domain.propagation_status}</Badge>
              {typeof health.score === "number" && (
                <Badge variant="outline">Health {health.score}/100</Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => diag.mutate()} disabled={diag.isPending}>
              {diag.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
              <span className="ml-1">Run checks</span>
            </Button>
            {!domain.is_primary && (
              <Button size="sm" variant="outline" onClick={() => primary.mutate()}>
                <Star className="h-3 w-3 mr-1" />
                Set primary
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => del.mutate()}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <div className="font-medium mb-1">Verification token</div>
          <code className="break-all">TXT _zupix.{domain.host} = zupix-verify={domain.verification_token}</code>
        </div>
        {groups.map(([group, records]) => (
          <div key={group}>
            <div className="text-xs uppercase text-muted-foreground mb-2">{group}</div>
            <div className="space-y-1">
              {records.map((r, i) => <DnsRow key={i} r={r} />)}
            </div>
          </div>
        ))}
        {domain.ssl_last_error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            SSL: {domain.ssl_last_error}
          </div>
        )}
        {domain.last_checked_at && (
          <div className="text-xs text-muted-foreground">
            Last checked {new Date(domain.last_checked_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DomainsTab({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data: domains = [], isLoading } = useInfraDomains(tenantId);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState("");
  const [kind, setKind] = useState<"primary" | "portal" | "login" | "other">("primary");
  const [wildcard, setWildcard] = useState(false);

  const add = useMutation({
    mutationFn: () =>
      addDomain({ tenant_id: tenantId, host, kind, is_wildcard: wildcard }),
    onSuccess: () => {
      toast.success("Domain added");
      qc.invalidateQueries({ queryKey: ["infra-domains", tenantId] });
      qc.invalidateQueries({ queryKey: ["infra-stats", tenantId] });
      setOpen(false);
      setHost("");
      setWildcard(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add domain
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : domains.length === 0 ? (
        <EmptyState icon={<Globe className="h-8 w-8" />} title="No domains" description="Add a primary domain, wildcard, or portal subdomain." />
      ) : (
        domains.map((d) => <DomainDetail key={d.id} domain={d} tenantId={tenantId} />)
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add domain</DialogTitle>
            <DialogDescription>Point DNS at ZUPIX and verify ownership.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Host</Label>
              <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="portal.example.com" />
            </div>
            <div>
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="portal">Portal / subdomain</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <div>
                <Label>Wildcard</Label>
                <p className="text-xs text-muted-foreground">Cover *.{host || "example.com"} for tenant subdomains</p>
              </div>
              <Switch checked={wildcard} onCheckedChange={setWildcard} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => add.mutate()} disabled={!host || add.isPending}>
              {add.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmailTab({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data: cfg } = useSmtpConfig(tenantId);
  const [host, setHost] = useState(cfg?.host ?? "");
  const [port, setPort] = useState(cfg?.port ?? 587);
  const [secure, setSecure] = useState(cfg?.secure ?? true);
  const [username, setUsername] = useState(cfg?.username ?? "");
  const [password, setPassword] = useState("");
  const [senderName, setSenderName] = useState(cfg?.sender_name ?? "");
  const [senderEmail, setSenderEmail] = useState(cfg?.sender_email ?? "");
  const [replyTo, setReplyTo] = useState(cfg?.reply_to ?? "");
  const [footer, setFooter] = useState(cfg?.footer_html ?? "");
  const [logoUrl, setLogoUrl] = useState(cfg?.logo_url ?? "");

  // reload when cfg arrives
  useMemo(() => {
    if (cfg) {
      setHost(cfg.host);
      setPort(cfg.port);
      setSecure(cfg.secure);
      setUsername(cfg.username ?? "");
      setSenderName(cfg.sender_name ?? "");
      setSenderEmail(cfg.sender_email);
      setReplyTo(cfg.reply_to ?? "");
      setFooter(cfg.footer_html ?? "");
      setLogoUrl(cfg.logo_url ?? "");
    }
  }, [cfg]);

  const save = useMutation({
    mutationFn: () =>
      upsertSmtpConfig({
        tenant_id: tenantId,
        host,
        port: Number(port),
        secure,
        username,
        password: password || null,
        sender_name: senderName,
        sender_email: senderEmail,
        reply_to: replyTo,
        footer_html: footer,
        logo_url: logoUrl,
      }),
    onSuccess: () => {
      toast.success("SMTP configuration saved");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["infra-smtp", tenantId] });
      qc.invalidateQueries({ queryKey: ["infra-stats", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const verify = useMutation({
    mutationFn: () => verifySmtpConfig(tenantId),
    onSuccess: (r) => {
      if (r.ok) toast.success("SMTP verified");
      else toast.error(r.error || "Verification failed");
      qc.invalidateQueries({ queryKey: ["infra-smtp", tenantId] });
      qc.invalidateQueries({ queryKey: ["infra-stats", tenantId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> White-label email
            </CardTitle>
            <CardDescription>Sender identity and SMTP relay per tenant.</CardDescription>
          </div>
          {cfg && (
            <Badge variant={cfg.status === "verified" ? "default" : "secondary"}>{cfg.status}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>SMTP host</Label>
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.example.com" />
          </div>
          <div>
            <Label>Port</Label>
            <Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={cfg?.password_ciphertext ? "•••••••• (encrypted)" : ""}
            />
          </div>
          <div>
            <Label>Sender name</Label>
            <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
          </div>
          <div>
            <Label>Sender email</Label>
            <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="hello@example.com" />
          </div>
          <div>
            <Label>Reply-to</Label>
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
          </div>
          <div>
            <MediaField
              label="Logo"
              value={logoUrl || undefined}
              onChange={(url) => setLogoUrl(url ?? "")}
              pickerTitle="Choose or upload email logo"
              previewAspect="1 / 1"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-md border p-2">
            <div>
              <Label>TLS / secure connection</Label>
              <p className="text-xs text-muted-foreground">Use STARTTLS or implicit TLS</p>
            </div>
            <Switch checked={secure} onCheckedChange={setSecure} />
          </div>
          <div className="md:col-span-2">
            <Label>Branded email footer (HTML)</Label>
            <Textarea rows={4} value={footer} onChange={(e) => setFooter(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-3 w-3 mr-1" /> Save
          </Button>
          <Button variant="outline" onClick={() => verify.mutate()} disabled={verify.isPending || !cfg}>
            {verify.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
            Verify
          </Button>
        </div>
        {cfg?.last_error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {cfg.last_error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertsTab({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data: alerts = [] } = useInfraAlerts(tenantId);
  const resolve = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["infra-alerts", tenantId] }),
  });
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        title="All clear"
        description="No open infrastructure alerts."
      />
    );
  }
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={
                a.severity === "critical"
                  ? "h-4 w-4 text-destructive"
                  : a.severity === "warning"
                    ? "h-4 w-4 text-amber-500"
                    : "h-4 w-4 text-muted-foreground"
              }
            />
            <div>
              <div className="font-medium">{a.message}</div>
              <div className="text-xs text-muted-foreground">
                {a.category} • {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => resolve.mutate(a.id)}>Resolve</Button>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{label}</CardDescription></CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function InfrastructureDashboard({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const { data: stats } = useInfraStats(tenantId);
  return (
    <div>
      <PageHeader
        title="Partner Infrastructure"
        description={`Domain automation, SSL health, and white-label email for ${tenantName}.`}
      />
      <div className="p-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Connected domains" value={stats?.total_domains ?? 0} hint={`${stats?.verified_domains ?? 0} verified`} />
          <StatCard label="SSL active" value={stats?.ssl_active ?? 0} />
          <StatCard label="Propagated" value={stats?.propagated ?? 0} />
          <StatCard label="Open alerts" value={stats?.open_alerts ?? 0} hint={`${stats?.critical_alerts ?? 0} critical`} />
        </div>

        <Tabs defaultValue="domains">
          <TabsList>
            <TabsTrigger value="domains"><Globe className="h-3 w-3 mr-1" /> Domains &amp; DNS</TabsTrigger>
            <TabsTrigger value="email"><Mail className="h-3 w-3 mr-1" /> Email</TabsTrigger>
            <TabsTrigger value="alerts"><Activity className="h-3 w-3 mr-1" /> Alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="domains"><DomainsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="email"><EmailTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="alerts"><AlertsTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
