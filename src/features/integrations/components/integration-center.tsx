/**
 * Enterprise Integration Center — categorized, searchable, live-configurable.
 * Payments deep-link to the Super Admin Gateway Manager to reuse existing
 * gateway credentials; all other providers persist to `workspace_integrations`.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ExternalLink, Eye, EyeOff,
  Loader2, Lock, Plug, Save, Search, ShieldCheck, Trash2, TestTube2, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  deleteIntegration, listIntegrations, testIntegration, toggleIntegration, upsertIntegration,
} from "../api.functions";
import { CATEGORY_META, INTEGRATIONS } from "../catalog";
import type { IntegrationCategory, IntegrationDefinition, WorkspaceIntegrationRow } from "../types";

interface Props {
  workspaceId: string;
}

const HEALTH_TONE: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  degraded: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  down: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400",
  unknown: "bg-muted text-muted-foreground border-transparent",
};

export function IntegrationCenter({ workspaceId }: Props) {
  const qc = useQueryClient();
  const listFn = useServerFn(listIntegrations);
  const listQ = useQuery({
    queryKey: ["integrations", workspaceId],
    queryFn: () => listFn({ data: { workspaceId } }),
  });

  const rows = listQ.data ?? [];
  const rowByKey = useMemo(() => {
    const m = new Map<string, WorkspaceIntegrationRow>();
    for (const r of rows) m.set(r.provider_key, r);
    return m;
  }, [rows]);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<IntegrationCategory | "all">("all");
  const [editing, setEditing] = useState<IntegrationDefinition | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTEGRATIONS.filter((i) => {
      if (activeTab !== "all" && i.category !== activeTab) return false;
      if (!q) return true;
      return (
        i.label.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.includes(q)
      );
    });
  }, [query, activeTab]);

  // Dashboard summary
  const summary = useMemo(() => {
    const connected = rows.filter((r) => r.has_credentials || Object.keys(r.config).length > 0).length;
    const active = rows.filter((r) => r.enabled).length;
    const webhookOk = rows.filter((r) => r.health_status === "healthy").length;
    const lastSync = rows.reduce<string | null>((acc, r) => {
      if (!r.last_tested_at) return acc;
      if (!acc || r.last_tested_at > acc) return r.last_tested_at;
      return acc;
    }, null);
    return {
      total: INTEGRATIONS.length,
      connected,
      active,
      disconnected: INTEGRATIONS.length - connected,
      webhookOk,
      lastSync,
    };
  }, [rows]);

  const byCategory = useMemo(() => {
    const map = new Map<IntegrationCategory, IntegrationDefinition[]>();
    for (const i of filtered) {
      const arr = map.get(i.category) ?? [];
      arr.push(i);
      map.set(i.category, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard icon={<Plug className="h-4 w-4" />} label="Connected" value={summary.connected} tone="text-primary" />
        <SummaryCard icon={<Zap className="h-4 w-4" />} label="Active" value={summary.active} tone="text-emerald-500" />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="Disconnected" value={summary.disconnected} tone="text-amber-500" />
        <SummaryCard icon={<ShieldCheck className="h-4 w-4" />} label="Webhooks Healthy" value={summary.webhookOk} tone="text-blue-500" />
        <SummaryCard
          icon={<Activity className="h-4 w-4" />}
          label="Last Sync"
          value={summary.lastSync ? new Date(summary.lastSync).toLocaleTimeString() : "—"}
          tone="text-muted-foreground"
        />
      </div>

      {/* Search + tabs */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations…"
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IntegrationCategory | "all")}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {(Object.keys(CATEGORY_META) as IntegrationCategory[]).map((c) => (
              <TabsTrigger key={c} value={c}>{CATEGORY_META[c].label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Grid grouped by category */}
      {listQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No integrations match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(Object.keys(CATEGORY_META) as IntegrationCategory[]).map((cat) => {
            const items = byCategory.get(cat);
            if (!items || items.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <section key={cat} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{meta.label}</h3>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((i) => (
                    <IntegrationCard
                      key={i.key}
                      def={i}
                      row={rowByKey.get(i.key)}
                      onConfigure={() => setEditing(i)}
                      workspaceId={workspaceId}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editing ? (
        <ConfigureSheet
          def={editing}
          row={rowByKey.get(editing.key)}
          workspaceId={workspaceId}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["integrations", workspaceId] })}
        />
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Summary card                                              */
/* ────────────────────────────────────────────────────────── */
function SummaryCard({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: number | string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("rounded-md border p-2", tone)}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Integration card                                          */
/* ────────────────────────────────────────────────────────── */
function IntegrationCard({
  def, row, onConfigure, workspaceId,
}: {
  def: IntegrationDefinition;
  row: WorkspaceIntegrationRow | undefined;
  onConfigure: () => void;
  workspaceId: string;
}) {
  const qc = useQueryClient();
  const toggleFn = useServerFn(toggleIntegration);
  const testFn = useServerFn(testIntegration);
  const deleteFn = useServerFn(deleteIntegration);

  const connected = !!row && (row.has_credentials || Object.keys(row.config).length > 0);

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => toggleFn({ data: { id: row!.id, enabled } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations", workspaceId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => testFn({ data: { id: row!.id } }),
    onSuccess: (r) => {
      toast[r.status === "healthy" ? "success" : r.status === "degraded" ? "warning" : "error"](
        `${def.label}: ${r.message}`,
      );
      qc.invalidateQueries({ queryKey: ["integrations", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: row!.id } }),
    onSuccess: () => {
      toast.success(`${def.label} disconnected`);
      qc.invalidateQueries({ queryKey: ["integrations", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="relative overflow-hidden transition hover:shadow-lg hover:border-primary/30">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", def.color)} />
      <CardHeader className="pb-3 flex-row items-start gap-3 space-y-0">
        <div className={cn(
          "shrink-0 w-11 h-11 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-sm",
          def.color,
        )}>
          <img
            src={def.logo}
            alt={def.label}
            className="h-6 w-6 object-contain [filter:brightness(0)_invert(1)]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold leading-tight truncate">{def.label}</h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] shrink-0",
                connected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
              )}
            >
              {connected ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{def.description}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 text-[11px]">
          {def.supportsEnvironments ? (
            <Badge variant="outline">{row?.environment ?? "production"}</Badge>
          ) : null}
          <Badge variant="outline" className={HEALTH_TONE[row?.health_status ?? "unknown"]}>
            <Activity className="h-3 w-3 mr-1" />
            {row?.health_status ?? "unknown"}
          </Badge>
          {row?.enabled ? (
            <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">Enabled</Badge>
          ) : null}
        </div>

        {row?.health_message ? (
          <p className="text-[11px] text-muted-foreground truncate">{row.health_message}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {def.externalRoute ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={def.externalRoute}>
                Configure <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onConfigure}>
              Configure
            </Button>
          )}

          {row && def.supportsTest ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={test.isPending}
              onClick={() => test.mutate()}
            >
              {test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube2 className="h-3.5 w-3.5" />}
              <span className="ml-1">Test</span>
            </Button>
          ) : null}

          {row ? (
            <div className="ml-auto flex items-center gap-1">
              <Switch
                checked={row.enabled}
                disabled={toggle.isPending}
                onCheckedChange={(v) => toggle.mutate(v)}
                aria-label={`Toggle ${def.label}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => {
                  if (confirm(`Disconnect ${def.label}?`)) del.mutate();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="ml-auto" onClick={onConfigure}>
              Connect <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Configuration sheet                                       */
/* ────────────────────────────────────────────────────────── */
function ConfigureSheet({
  def, row, workspaceId, onClose, onSaved,
}: {
  def: IntegrationDefinition;
  row: WorkspaceIntegrationRow | undefined;
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const upsertFn = useServerFn(upsertIntegration);
  const testFn = useServerFn(testIntegration);

  const [enabled, setEnabled] = useState(row?.enabled ?? true);
  const [environment, setEnvironment] = useState<"sandbox" | "production">(row?.environment ?? "production");
  const [config, setConfig] = useState<Record<string, string>>(
    () => Object.fromEntries(
      def.configFields.map((f) => [f.key, String((row?.config as Record<string, string>)?.[f.key] ?? "")]),
    ),
  );
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const save = useMutation({
    mutationFn: async () => {
      // Client-side required validation
      for (const f of def.configFields) {
        if (f.required && !(config[f.key] ?? "").trim()) {
          throw new Error(`${f.label} is required`);
        }
      }
      for (const f of def.credentialFields) {
        const existing = row?.masked_credentials[f.key];
        if (f.required && !creds[f.key]?.trim() && !existing) {
          throw new Error(`${f.label} is required`);
        }
      }
      return upsertFn({
        data: {
          workspaceId,
          providerKey: def.key,
          category: def.category,
          displayName: def.label,
          enabled,
          environment,
          config,
          credentials: Object.keys(creds).length > 0 ? creds : undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success(`${def.label} saved`);
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testExisting = useMutation({
    mutationFn: () => testFn({ data: { id: row!.id } }),
    onSuccess: (r) =>
      toast[r.status === "healthy" ? "success" : r.status === "degraded" ? "warning" : "error"](r.message),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
              def.color,
            )}>
              <img src={def.logo} alt="" className="h-5 w-5 [filter:brightness(0)_invert(1)]" />
            </div>
            <div>
              <SheetTitle>{def.label}</SheetTitle>
              <SheetDescription className="text-xs">{def.description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Enable / environment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Enabled</Label>
                <div className="flex items-center h-10">
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
              {def.supportsEnvironments ? (
                <div>
                  <Label>Environment</Label>
                  <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (test)</SelectItem>
                      <SelectItem value="production">Production (live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            {environment === "production" && def.supportsEnvironments ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Live mode processes real requests. Verify credentials with Test Connection first.</span>
              </div>
            ) : null}

            {/* Config fields */}
            {def.configFields.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Configuration
                </div>
                {def.configFields.map((f) => (
                  <FieldRenderer
                    key={f.key}
                    field={f}
                    value={config[f.key] ?? ""}
                    onChange={(v) => setConfig((c) => ({ ...c, [f.key]: v }))}
                  />
                ))}
              </div>
            ) : null}

            {/* Credentials */}
            {def.credentialFields.length > 0 ? (
              <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  {row?.has_credentials ? "Existing secrets are masked — leave blank to keep them." : "Credentials are stored securely and never exposed to the browser."}
                </div>
                {def.credentialFields.map((f) => {
                  const masked = row?.masked_credentials?.[f.key];
                  const isPassword = f.type === "password" || f.secret;
                  return (
                    <div key={f.key}>
                      <div className="flex items-center justify-between">
                        <Label>
                          {f.label} {f.required ? <span className="text-destructive">*</span> : null}
                        </Label>
                        {isPassword && (creds[f.key] ?? "").length > 0 ? (
                          <button
                            type="button"
                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                            onClick={() => setReveal((r) => ({ ...r, [f.key]: !r[f.key] }))}
                          >
                            {reveal[f.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {reveal[f.key] ? "Hide" : "Show"}
                          </button>
                        ) : null}
                      </div>
                      <Input
                        type={isPassword && !reveal[f.key] ? "password" : "text"}
                        value={creds[f.key] ?? ""}
                        onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                        placeholder={masked ? `${masked} (unchanged)` : (f.placeholder ?? "")}
                        autoComplete="off"
                      />
                      {f.helpText ? (
                        <p className="text-[11px] text-muted-foreground mt-1">{f.helpText}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* UPI-style preview */}
            {def.key === "manual_upi" && config.qr_image_url ? (
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Preview</div>
                <div className="flex items-center gap-4">
                  <img
                    src={config.qr_image_url}
                    alt="UPI QR"
                    className="h-28 w-28 object-contain rounded-md border bg-background"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
                  />
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold">{config.account_name || "Merchant Name"}</div>
                    <div className="text-muted-foreground text-xs">{config.upi_id || "upi@handle"}</div>
                  </div>
                </div>
              </div>
            ) : null}

            {def.docsUrl ? (
              <>
                <Separator />
                <a
                  href={def.docsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Read documentation <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : null}
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t flex-row justify-between sm:justify-between gap-2">
          <div>
            {row && def.supportsTest ? (
              <Button
                variant="outline"
                onClick={() => testExisting.mutate()}
                disabled={testExisting.isPending}
              >
                {testExisting.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube2 className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldRenderer({
  field, value, onChange,
}: {
  field: IntegrationDefinition["configFields"][number];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>
        {field.label} {field.required ? <span className="text-destructive">*</span> : null}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      ) : field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.helpText ? (
        <p className="text-[11px] text-muted-foreground mt-1">{field.helpText}</p>
      ) : null}
    </div>
  );
}

// Prevent unused-import warning for CheckCircle2 in some tree-shaking configs.
export const __iconTouch = CheckCircle2;
