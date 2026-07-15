import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchTrackingSettings,
  updateTrackingSettings,
  testConnection,
  type TestResult,
} from "../api";
import { detectDuplicateScripts, validators } from "../validation";
import {
  DEFAULT_EVENTS,
  DEFAULT_TRACKING,
  type CustomScript,
  type LoadStrategy,
  type Placement,
  type TrackingSettings,
} from "../types";

type PixelKind = "ga4" | "gtm" | "metaPixel" | "clarity" | "linkedIn" | "tiktok";

const PIXEL_CATALOG: Array<{
  kind: PixelKind;
  title: string;
  hint: string;
  placeholder: string;
  field: keyof NonNullable<TrackingSettings["ga4"]> | string;
  supportsTest: boolean;
}> = [
  { kind: "ga4", title: "Google Analytics 4", hint: "Measurement ID", placeholder: "G-XXXXXXXXXX", field: "measurementId", supportsTest: true },
  { kind: "gtm", title: "Google Tag Manager", hint: "Container ID", placeholder: "GTM-XXXXXX", field: "containerId", supportsTest: true },
  { kind: "metaPixel", title: "Meta Pixel", hint: "Pixel ID", placeholder: "1234567890123456", field: "pixelId", supportsTest: true },
  { kind: "clarity", title: "Microsoft Clarity", hint: "Project ID", placeholder: "abcd1234ef", field: "projectId", supportsTest: false },
  { kind: "linkedIn", title: "LinkedIn Insight Tag", hint: "Partner ID", placeholder: "1234567", field: "partnerId", supportsTest: false },
  { kind: "tiktok", title: "TikTok Pixel", hint: "Pixel ID", placeholder: "CXXXXXXXXXXXXXXXXXXX", field: "pixelId", supportsTest: false },
];

export function TrackingCenter({ workspaceId }: { workspaceId: string }) {
  const [settings, setSettings] = useState<TrackingSettings>(DEFAULT_TRACKING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<PixelKind | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTrackingSettings(workspaceId)
      .then((s) => alive && setSettings({ events: DEFAULT_EVENTS, customScripts: [], ...s }))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [workspaceId]);

  const save = async (next: TrackingSettings) => {
    setSaving(true);
    try {
      await updateTrackingSettings(workspaceId, next);
      setSettings(next);
      toast.success("Tracking settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const patch = (partial: Partial<TrackingSettings>) => save({ ...settings, ...partial });

  const runTest = async (kind: PixelKind, id: string) => {
    setTesting(kind);
    try {
      const res = await testConnection(kind, id);
      const key = kind as keyof TrackingSettings;
      const existing = (settings[key] ?? {}) as Record<string, unknown>;
      const nextIntegration = {
        ...existing,
        lastCheckedAt: res.checkedAt,
        lastStatus: res.status,
        lastMessage: res.message,
      };
      await save({ ...settings, [key]: nextIntegration } as TrackingSettings);
      renderTestToast(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tracking settings…
      </div>
    );
  }

  return (
    <Tabs defaultValue="integrations" className="w-full">
      <TabsList className="flex w-full flex-wrap">
        <TabsTrigger value="integrations"><Zap className="mr-1.5 h-3.5 w-3.5" /> Integrations</TabsTrigger>
        <TabsTrigger value="scripts"><Code2 className="mr-1.5 h-3.5 w-3.5" /> Custom Code</TabsTrigger>
        <TabsTrigger value="events"><Activity className="mr-1.5 h-3.5 w-3.5" /> Event Mapping</TabsTrigger>
        <TabsTrigger value="health"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Connection Health</TabsTrigger>
      </TabsList>

      <TabsContent value="integrations" className="mt-4 space-y-3">
        {PIXEL_CATALOG.map((c) => (
          <IntegrationCard
            key={c.kind}
            def={c}
            settings={settings}
            saving={saving}
            testing={testing}
            onSave={patch}
            onTest={runTest}
          />
        ))}
      </TabsContent>

      <TabsContent value="scripts" className="mt-4">
        <ScriptManager settings={settings} onChange={(next) => patch({ customScripts: next })} saving={saving} />
      </TabsContent>

      <TabsContent value="events" className="mt-4">
        <EventMappingCard
          settings={settings}
          onChange={(next) => patch({ events: next })}
        />
      </TabsContent>

      <TabsContent value="health" className="mt-4">
        <ConnectionHealth settings={settings} />
      </TabsContent>
    </Tabs>
  );
}

/* -------------------- INTEGRATION CARD -------------------- */

function IntegrationCard({
  def, settings, saving, testing, onSave, onTest,
}: {
  def: (typeof PIXEL_CATALOG)[number];
  settings: TrackingSettings;
  saving: boolean;
  testing: PixelKind | null;
  onSave: (partial: Partial<TrackingSettings>) => void;
  onTest: (kind: PixelKind, id: string) => void;
}) {
  const key = def.kind as keyof TrackingSettings;
  const current = (settings[key] as Record<string, unknown> | undefined) ?? {};
  const [id, setId] = useState<string>((current[def.field] as string) ?? "");
  const [enabled, setEnabled] = useState<boolean>(!!current.enabled);

  useEffect(() => {
    setId((current[def.field] as string) ?? "");
    setEnabled(!!current.enabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const validation = validators[def.kind](id);
  const canEnable = validation.ok && !!id.trim();

  const commit = (nextEnabled: boolean) => {
    if (nextEnabled && !canEnable) {
      toast.error(validation.message ?? "Invalid ID");
      return;
    }
    onSave({
      [key]: { ...current, [def.field]: id.trim(), enabled: nextEnabled },
    } as Partial<TrackingSettings>);
  };

  const status = (current.lastStatus as string | undefined) ?? null;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-sm">{def.title}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{def.hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <Switch
            checked={enabled}
            onCheckedChange={(v) => {
              setEnabled(v);
              commit(v);
            }}
            disabled={saving}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            onBlur={() => id !== (current[def.field] ?? "") && commit(enabled)}
            placeholder={def.placeholder}
            className={!id ? "" : validation.ok ? "" : "border-destructive"}
          />
          <Button variant="outline" onClick={() => commit(enabled)} disabled={saving}>
            Save
          </Button>
          {def.supportsTest && (
            <Button
              variant="outline"
              onClick={() => onTest(def.kind, id)}
              disabled={saving || !id || testing !== null}
            >
              {testing === def.kind ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Test
            </Button>
          )}
        </div>
        {id && !validation.ok && (
          <p className="text-xs text-destructive">{validation.message}</p>
        )}
        {(current.lastMessage as string | undefined) && (
          <p className="text-xs text-muted-foreground">
            {current.lastMessage as string}
            {current.lastCheckedAt && (
              <> · {new Date(current.lastCheckedAt as string).toLocaleString()}</>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------- SCRIPT MANAGER -------------------- */

function ScriptManager({
  settings, onChange, saving,
}: {
  settings: TrackingSettings;
  onChange: (next: CustomScript[]) => void;
  saving: boolean;
}) {
  const scripts = settings.customScripts ?? [];
  const dupes = useMemo(() => new Set(detectDuplicateScripts(scripts)), [scripts]);

  const add = () => {
    const next: CustomScript = {
      id: crypto.randomUUID(),
      name: `Script ${scripts.length + 1}`,
      code: "",
      placement: "head",
      strategy: "async",
      enabled: false,
      priority: 100,
      page: null,
    };
    onChange([...scripts, next]);
  };
  const update = (i: number, patch: Partial<CustomScript>) => {
    const copy = [...scripts];
    copy[i] = { ...copy[i], ...patch };
    onChange(copy);
  };
  const remove = (i: number) => onChange(scripts.filter((_, idx) => idx !== i));
  const duplicate = (i: number) => {
    const copy = [...scripts];
    copy.splice(i + 1, 0, { ...copy[i], id: crypto.randomUUID(), name: copy[i].name + " (copy)", enabled: false });
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Custom code</h3>
          <p className="text-xs text-muted-foreground">
            HTML / JavaScript injected into head, body, or footer of your published pages.
          </p>
        </div>
        <Button size="sm" onClick={add} disabled={saving}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add script
        </Button>
      </div>

      {scripts.length === 0 && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          No custom scripts yet.
        </CardContent></Card>
      )}

      {scripts.map((s, i) => {
        const v = validators.customScript(s.code);
        const dup = dupes.has(i);
        return (
          <Card key={s.id}>
            <CardContent className="space-y-3 pt-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                <Input
                  value={s.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Script name"
                />
                <Select value={s.placement} onValueChange={(v) => update(i, { placement: v as Placement })}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">Head</SelectItem>
                    <SelectItem value="body">Body</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={s.strategy} onValueChange={(v) => update(i, { strategy: v as LoadStrategy })}>
                  <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="async">Async</SelectItem>
                    <SelectItem value="defer">Defer</SelectItem>
                    <SelectItem value="blocking">Blocking</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-20"
                  value={s.priority ?? 100}
                  onChange={(e) => update(i, { priority: Number(e.target.value) || 100 })}
                  title="Priority (lower runs first)"
                />
                <div className="flex items-center gap-1">
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={(v) => {
                      if (v && !v && !validators.customScript(s.code).ok) return;
                      update(i, { enabled: v });
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={() => duplicate(i)} title="Duplicate">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(i)} title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={s.code}
                onChange={(e) => update(i, { code: e.target.value })}
                placeholder='<script>console.log("hello");</script>'
                className="min-h-32 font-mono text-xs"
                spellCheck={false}
              />
              {!v.ok && <p className="text-xs text-destructive">{v.message}</p>}
              {v.ok && v.warning && <p className="text-xs text-amber-500">{v.warning}</p>}
              {dup && <p className="text-xs text-amber-500">Duplicate of another script above.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* -------------------- EVENT MAPPING -------------------- */

function EventMappingCard({
  settings, onChange,
}: { settings: TrackingSettings; onChange: (next: typeof DEFAULT_EVENTS) => void }) {
  const events = { ...DEFAULT_EVENTS, ...(settings.events ?? {}) };
  const rows: Array<[keyof typeof DEFAULT_EVENTS, string, string, boolean]> = [
    ["pageView", "Page view", "Tracks each visitor arrival", false],
    ["buttonClick", "Button click", "Sends an event when a button block is clicked", false],
    ["conversion", "Conversion", "Reports when a configured conversion goal fires", false],
    ["qrScan", "QR scan", "Attributes visits from QR codes with ?qr=1", false],
    ["formSubmit", "Form submit", "Reserved for the upcoming form block", true],
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Event mapping</CardTitle></CardHeader>
      <CardContent>
        <ul className="divide-y">
          {rows.map(([key, label, hint, future]) => (
            <li key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">
                  {label} {future && <Badge variant="outline" className="ml-1 text-[10px]">Coming soon</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={!!events[key]}
                disabled={future}
                onCheckedChange={(v) => onChange({ ...events, [key]: v })}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* -------------------- CONNECTION HEALTH -------------------- */

function ConnectionHealth({ settings }: { settings: TrackingSettings }) {
  const rows = PIXEL_CATALOG.map((c) => {
    const cur = (settings[c.kind as keyof TrackingSettings] as Record<string, unknown> | undefined) ?? {};
    return {
      title: c.title,
      enabled: !!cur.enabled,
      id: (cur[c.field] as string) ?? "",
      status: (cur.lastStatus as TestResult["status"] | undefined) ?? null,
      message: (cur.lastMessage as string | undefined) ?? null,
      checkedAt: (cur.lastCheckedAt as string | undefined) ?? null,
    };
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Connection health</CardTitle></CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Provider</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">State</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.title} className="border-t">
                <td className="px-3 py-2 font-medium">{r.title}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {r.id || <span className="opacity-50">—</span>}
                </td>
                <td className="px-3 py-2">
                  <Badge variant={r.enabled ? "default" : "outline"}>
                    {r.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </td>
                <td className="px-3 py-2"><StatusBadge status={r.status ?? null} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {r.checkedAt ? new Date(r.checkedAt).toLocaleString() : "—"}
                  {r.message && <div className="opacity-70">{r.message}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Not tested</Badge>;
  if (status === "connected")
    return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>;
  if (status === "invalid")
    return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Invalid</Badge>;
  if (status === "warning")
    return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3" />Warning</Badge>;
  return <Badge variant="outline">Disconnected</Badge>;
}

function renderTestToast(res: TestResult): void {
  if (res.status === "connected") toast.success(res.message);
  else if (res.status === "invalid") toast.error(res.message);
  else toast.warning(res.message);
}
