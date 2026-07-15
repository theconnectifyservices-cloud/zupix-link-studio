import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Bell, CheckCircle2, Clock, CloudCog, Database, FileText,
  HardDrive, History, Layers, LifeBuoy, PlayCircle, RefreshCw, ShieldAlert, Wrench,
} from "lucide-react";
import { HealthCenter } from "@/features/performance/components/health-center";
import { useMaintenanceStore, useObservabilityStore, observabilitySummary } from "@/features/performance";
import {
  useEnvStore, useAlertsStore, useBackupsStore, useIncidentsStore, useRestoreStore, useOpsLogStore, useDrStore,
  type BackupKind, type AlertSev, type IncidentStatus, type LogKind,
} from "../stores";

const SEV_COLOR: Record<AlertSev, string> = {
  info: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  warning: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  critical: "bg-red-500/15 text-red-600 border-red-500/30",
};
const STATUS_COLOR: Record<IncidentStatus, string> = {
  open: "bg-red-500/15 text-red-600 border-red-500/30",
  investigating: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  mitigated: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

function fmtTime(ts: number) { return new Date(ts).toLocaleString(); }

export function OperationsCenter() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Operations Center</h1>
        <p className="text-sm text-muted-foreground">
          Environments, health, alerting, backups, disaster recovery, and incident management.
        </p>
      </div>

      <Tabs defaultValue="environments" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="environments"><CloudCog className="mr-2 h-4 w-4" />Environments</TabsTrigger>
          <TabsTrigger value="health"><LifeBuoy className="mr-2 h-4 w-4" />Health</TabsTrigger>
          <TabsTrigger value="monitoring"><Layers className="mr-2 h-4 w-4" />Monitoring</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="mr-2 h-4 w-4" />Alerts</TabsTrigger>
          <TabsTrigger value="backups"><Database className="mr-2 h-4 w-4" />Backups</TabsTrigger>
          <TabsTrigger value="dr"><ShieldAlert className="mr-2 h-4 w-4" />Disaster Recovery</TabsTrigger>
          <TabsTrigger value="restore"><HardDrive className="mr-2 h-4 w-4" />Restore Tests</TabsTrigger>
          <TabsTrigger value="incidents"><AlertTriangle className="mr-2 h-4 w-4" />Incidents</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="mr-2 h-4 w-4" />Maintenance</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="mr-2 h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="environments"><EnvironmentsTab /></TabsContent>
        <TabsContent value="health"><HealthCenter /></TabsContent>
        <TabsContent value="monitoring"><MonitoringTab /></TabsContent>
        <TabsContent value="alerts"><AlertsTab /></TabsContent>
        <TabsContent value="backups"><BackupsTab /></TabsContent>
        <TabsContent value="dr"><DrTab /></TabsContent>
        <TabsContent value="restore"><RestoreTab /></TabsContent>
        <TabsContent value="incidents"><IncidentsTab /></TabsContent>
        <TabsContent value="maintenance"><MaintenanceTab /></TabsContent>
        <TabsContent value="logs"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Environments ---------------- */
function EnvironmentsTab() {
  const { active, environments, setActive } = useEnvStore();
  const cfg = environments[active];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(["development", "staging", "production"] as const).map((k) => {
        const e = environments[k];
        return (
          <Card key={k} className={active === k ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                {e.label}
                {e.readonly && <Badge variant="outline">Read-only</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground truncate">{e.baseUrl}</div>
              <div className="text-xs">Region: {e.region}</div>
              <p className="text-xs text-muted-foreground">{e.notes}</p>
              <Button size="sm" variant={active === k ? "default" : "outline"} onClick={() => setActive(k)}>
                {active === k ? "Active" : "Select"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
      <Card className="md:col-span-3">
        <CardHeader><CardTitle className="text-sm">Active configuration</CardTitle></CardHeader>
        <CardContent>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">{JSON.stringify(cfg, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Monitoring ---------------- */
function MonitoringTab() {
  const requests = useObservabilityStore((s) => s.requests);
  const summary = useMemo(() => observabilitySummary(), [requests]);
  const slow = useMemo(
    () => [...requests].sort((a, b) => b.durationMs - a.durationMs).slice(0, 8),
    [requests],
  );
  const memHeap = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  const memPct = memHeap ? Math.round((memHeap.usedJSHeapSize / memHeap.jsHeapSizeLimit) * 100) : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Requests" value={String(summary.total)} />
        <Metric label="Error rate" value={`${(summary.errorRate * 100).toFixed(1)}%`} />
        <Metric label="p95 latency" value={`${Math.round(summary.p95)} ms`} />
        <Metric label="Avg latency" value={`${Math.round(summary.avg)} ms`} />
        <Metric label="CPU (arch.)" value="reported by edge" />
        <Metric label="Memory heap" value={memPct != null ? `${memPct}%` : "n/a"} />
        <Metric label="Storage growth" value="tracked via backups" />
        <Metric label="Request volume/min" value={String(requests.filter(r => r.ts > Date.now() - 60_000).length)} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Slow queries / requests</CardTitle></CardHeader>
        <CardContent>
          {slow.length === 0 ? (
            <p className="text-sm text-muted-foreground">No traffic recorded yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {slow.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span className="truncate max-w-[60%]">{r.method} {r.url}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{r.status || "err"}</Badge>
                    <span className="tabular-nums">{Math.round(r.durationMs)} ms</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </CardContent></Card>
  );
}

/* ---------------- Alerts ---------------- */
function AlertsTab() {
  const { alerts, channels, raise, ack, clearResolved, toggleChannel } = useAlertsStore();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertSev>("warning");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Delivery channels</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          {(Object.keys(channels) as (keyof typeof channels)[]).map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <Switch checked={channels[c]} onCheckedChange={(v) => toggleChannel(c, v)} />
              <span className="capitalize">{c}</span>
              {(c === "slack" || c === "webhook") && <Badge variant="outline">Prepared</Badge>}
            </label>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Raise test alert</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSev)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={!title || !message}
            onClick={() => {
              raise({ title, message, severity, channel: "in-app" });
              setTitle(""); setMessage("");
            }}
          >Raise</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Alert history</CardTitle>
          <Button variant="outline" size="sm" onClick={clearResolved}>Clear acknowledged</Button>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={SEV_COLOR[a.severity]}>{a.severity}</Badge>
                      <span className="font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground">{a.channel}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{a.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{fmtTime(a.ts)}{a.acknowledged && ` · acked by ${a.ackBy}`}</p>
                  </div>
                  {!a.acknowledged ? (
                    <Button size="sm" variant="outline" onClick={() => ack(a.id)}>Acknowledge</Button>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">Acked</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Backups ---------------- */
function BackupsTab() {
  const { history, retentionDays, setRetention, run, verify } = useBackupsStore();
  const last = (k: BackupKind) => history.find((h) => h.kind === k);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {(["database", "assets", "configuration"] as const).map((k) => {
          const l = last(k);
          return (
            <Card key={k}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm capitalize">
                  <span className="flex items-center gap-2"><Database className="h-4 w-4" />{k}</span>
                  <Badge variant="outline" className={l ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" : ""}>
                    {l ? l.status : "not run"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">
                  {l ? `${l.sizeMb} MB · ${l.durationSec}s · ${fmtTime(l.ts)}` : "No backup yet."}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => run(k)}><PlayCircle className="mr-2 h-4 w-4" />Run</Button>
                  {l && !l.verified && (
                    <Button size="sm" variant="outline" onClick={() => verify(l.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />Verify
                    </Button>
                  )}
                  {l?.verified && <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">Verified</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Retention policy</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="w-40">
            <Label className="text-xs">Retention (days)</Label>
            <Input type="number" min={1} value={retentionDays} onChange={(e) => setRetention(Number(e.target.value) || 1)} />
          </div>
          <p className="text-xs text-muted-foreground">Backups older than {retentionDays} days are eligible for pruning.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Backup history</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">No backups yet.</p> : (
            <ul className="divide-y text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2">
                  <span className="capitalize">{h.kind}</span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{h.sizeMb} MB</span>
                    <span>{h.durationSec}s</span>
                    <span>{fmtTime(h.ts)}</span>
                    <Badge variant="outline">{h.verified ? "verified" : h.status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Disaster Recovery ---------------- */
function DrTab() {
  const { rpoMinutes, rtoMinutes, plan, checklist, setObjectives, setPlan, toggle } = useDrStore();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Recovery objectives</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">RPO (minutes)</Label>
              <Input type="number" value={rpoMinutes} onChange={(e) => setObjectives(Number(e.target.value) || 0, rtoMinutes)} />
            </div>
            <div>
              <Label className="text-xs">RTO (minutes)</Label>
              <Input type="number" value={rtoMinutes} onChange={(e) => setObjectives(rpoMinutes, Number(e.target.value) || 0)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            RPO = max acceptable data loss window. RTO = target time to restore.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Recovery checklist</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <Switch checked={c.done} onCheckedChange={() => toggle(c.id)} />
                <span className={c.done ? "line-through text-muted-foreground" : ""}>{c.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-sm">Recovery plan (runbook)</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={6} value={plan} onChange={(e) => setPlan(e.target.value)} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Restore Tests ---------------- */
function RestoreTab() {
  const backups = useBackupsStore((s) => s.history);
  const { tests, run } = useRestoreStore();
  const [selected, setSelected] = useState<string>("");
  const target = backups.find((b) => b.id === selected) ?? backups[0];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Run restore test</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="w-72">
            <Label className="text-xs">Backup</Label>
            <Select value={target?.id ?? ""} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="Select a backup" /></SelectTrigger>
              <SelectContent>
                {backups.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.kind} · {fmtTime(b.ts)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={!target} onClick={() => target && run(target)}>
            <RefreshCw className="mr-2 h-4 w-4" />Run integrity + restore
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Test reports</CardTitle></CardHeader>
        <CardContent>
          {tests.length === 0 ? <p className="text-sm text-muted-foreground">No restore tests yet.</p> : (
            <ul className="divide-y text-sm">
              {tests.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">{t.kind}</span>
                    <Badge variant="outline" className={t.passed ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" : SEV_COLOR.critical}>
                      {t.passed ? "passed" : "failed"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Integrity {t.integrityScore}/100</span>
                    <span>Duration {t.durationSec}s</span>
                    <span>{fmtTime(t.ts)}</span>
                  </div>
                  <p className="mt-1 text-xs">{t.report}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Incidents ---------------- */
function IncidentsTab() {
  const { incidents, create, update, append } = useIncidentsStore();
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("on-call");
  const [severity, setSeverity] = useState<AlertSev>("warning");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = incidents.find((i) => i.id === openId);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Open incident</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
            <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSev)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled={!title} onClick={() => {
            const id = create({ title, severity, owner });
            setOpenId(id); setTitle("");
          }}>Create incident</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent incidents</CardTitle></CardHeader>
        <CardContent>
          {incidents.length === 0 ? <p className="text-sm text-muted-foreground">No incidents recorded.</p> : (
            <ul className="divide-y text-sm">
              {incidents.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <button className="text-left" onClick={() => setOpenId(i.id)}>
                    <div className="font-medium">{i.title}</div>
                    <div className="text-xs text-muted-foreground">{fmtTime(i.createdAt)} · {i.owner}</div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={SEV_COLOR[i.severity]}>{i.severity}</Badge>
                    <Badge variant="outline" className={STATUS_COLOR[i.status]}>{i.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {open && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" /> {open.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="w-48">
                <Label className="text-xs">Status</Label>
                <Select value={open.status} onValueChange={(v) => update(open.id, { status: v as IncidentStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs">Owner</Label>
                <Input value={open.owner} onChange={(e) => update(open.id, { owner: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label className="text-xs">Root cause</Label>
                <Textarea rows={4} value={open.rootCause ?? ""} onChange={(e) => update(open.id, { rootCause: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Resolution notes</Label>
                <Textarea rows={4} value={open.resolution ?? ""} onChange={(e) => update(open.id, { resolution: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Postmortem</Label>
                <Textarea rows={4} value={open.postmortem ?? ""} onChange={(e) => update(open.id, { postmortem: e.target.value })} />
              </div>
            </div>
            <Separator />
            <TimelineEditor onAdd={(m) => append(open.id, m)} events={open.timeline} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TimelineEditor({ events, onAdd }: { events: { ts: number; message: string }[]; onAdd: (m: string) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-2">
      <Label className="text-xs">Timeline</Label>
      <div className="flex gap-2">
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add timeline note" />
        <Button disabled={!msg} onClick={() => { onAdd(msg); setMsg(""); }}>Add</Button>
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {events.map((e, i) => (
          <li key={i} className="flex gap-2">
            <Clock className="h-3 w-3 mt-0.5 text-muted-foreground" />
            <span className="text-muted-foreground">{fmtTime(e.ts)}</span>
            <span>{e.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Maintenance ---------------- */
function MaintenanceTab() {
  const { enabled, message, setEnabled, setMessage } = useMaintenanceStore();
  const [scheduled, setScheduled] = useState<string>("");
  const [allowAdmin, setAllowAdmin] = useState(true);
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Maintenance mode</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span className="text-sm">{enabled ? "Maintenance mode is ON" : "Maintenance mode is OFF"}</span>
          {enabled && <Badge variant="outline" className={SEV_COLOR.warning}>Banner visible</Badge>}
        </div>
        <div>
          <Label className="text-xs">Banner message</Label>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Scheduled window</Label>
            <Input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
          </div>
          <label className="flex items-end gap-2 text-sm">
            <Switch checked={allowAdmin} onCheckedChange={setAllowAdmin} />
            <span>Allow admin access during maintenance</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Logs ---------------- */
function LogsTab() {
  const { entries, append, clear } = useOpsLogStore();
  const [kind, setKind] = useState<LogKind>("system");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<LogKind | "all">("all");
  const list = entries.filter((e) => filter === "all" || e.kind === filter);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Append log entry</CardTitle>
          <Button variant="outline" size="sm" onClick={clear}>Clear</Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={kind} onValueChange={(v) => setKind(v as LogKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["system", "application", "security", "deployment", "infrastructure"] as const).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input className="md:col-span-2" placeholder="Message" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Button disabled={!msg} onClick={() => { append({ kind, level: "info", message: msg }); setMsg(""); }}>Append</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Logs ({list.length})</CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as LogKind | "all")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all</SelectItem>
              {(["system", "application", "security", "deployment", "infrastructure"] as const).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? <p className="text-sm text-muted-foreground">No entries.</p> : (
            <ul className="divide-y text-xs font-mono">
              {list.map((e) => (
                <li key={e.id} className="py-2 flex gap-3">
                  <span className="text-muted-foreground w-40 shrink-0">{fmtTime(e.ts)}</span>
                  <Badge variant="outline" className="shrink-0">{e.kind}</Badge>
                  <span className="uppercase text-muted-foreground w-12 shrink-0">{e.level}</span>
                  <span className="break-all">{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
