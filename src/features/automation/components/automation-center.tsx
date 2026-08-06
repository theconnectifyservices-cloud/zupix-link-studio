import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Webhook as WebhookIcon,
  ScrollText,
  BookOpen,
  Plug,
  Plus,
  MoreVertical,
  Copy,
  RefreshCcw,
  Trash2,
  Play,
  Pause,
  Send,
  Check,
  X,
  Bell,
  Zap,
  History,
  Settings,
  Mail,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Textarea,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Alert,
  EmptyState,
  toast,
  Switch,
} from "@/shared/ui";

import {
  listApiKeys,
  createApiKey,
  renameApiKey,
  regenerateApiKey,
  setApiKeyStatus,
  deleteApiKey,
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  pauseWebhook,
  testWebhook,
  listDeliveries,
  retryDelivery,
  listApiLogs,
  getWebhookSecret,
} from "../api";
import {
  listAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  listNotifications,
  markNotificationRead,
  deleteNotification,
  listActivityLogs,
  getAutomationSettings,
  updateAutomationSettings,
} from "../lib/automation-api";
import {
  WEBHOOK_EVENTS,
  AUTOMATION_PROVIDERS,
  type ApiKey,
  type ApiPermission,
  type Webhook,
  type WebhookEvent,
  type AutomationRule,
  type DashboardNotification,
  type ActivityLogEntry,
  type UserAutomationSettings,
} from "../types";


interface Props {
  workspaceId: string;
  userId: string;
}

export function AutomationCenter({ workspaceId, userId }: Props) {
  return (
    <Tabs defaultValue="keys" className="w-full">
      <TabsList className="mb-4 flex flex-wrap">
        <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
        <TabsTrigger value="workflows"><Zap className="mr-2 h-4 w-4" />Workflows</TabsTrigger>
        <TabsTrigger value="timeline"><History className="mr-2 h-4 w-4" />Timeline</TabsTrigger>
        <TabsTrigger value="keys"><KeyRound className="mr-2 h-4 w-4" />API Keys</TabsTrigger>
        <TabsTrigger value="webhooks"><WebhookIcon className="mr-2 h-4 w-4" />Webhooks</TabsTrigger>
        <TabsTrigger value="deliveries"><Send className="mr-2 h-4 w-4" />Deliveries</TabsTrigger>
        <TabsTrigger value="logs"><ScrollText className="mr-2 h-4 w-4" />API Logs</TabsTrigger>
        <TabsTrigger value="providers"><Plug className="mr-2 h-4 w-4" />Providers</TabsTrigger>
        <TabsTrigger value="docs"><BookOpen className="mr-2 h-4 w-4" />Docs</TabsTrigger>
        <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>


      </TabsList>

      <TabsContent value="notifications"><NotificationsTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="workflows"><WorkflowsTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="timeline"><TimelineTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="keys"><ApiKeysTab workspaceId={workspaceId} userId={userId} /></TabsContent>
      <TabsContent value="webhooks"><WebhooksTab workspaceId={workspaceId} userId={userId} /></TabsContent>
      <TabsContent value="deliveries"><DeliveriesTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="logs"><LogsTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="providers"><ProvidersTab /></TabsContent>
      <TabsContent value="docs"><DocsTab /></TabsContent>
      <TabsContent value="settings"><SettingsTab workspaceId={workspaceId} /></TabsContent>


    </Tabs>
  );
}

// ============ API KEYS ============

function ApiKeysTab({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const qc = useQueryClient();
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys", workspaceId],
    queryFn: () => listApiKeys(workspaceId),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [perms, setPerms] = useState<ApiPermission[]>(["read"]);
  const [revealed, setRevealed] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => createApiKey({ workspaceId, userId, name: newName || "Untitled key", permissions: perms }),
    onSuccess: (res) => {
      setRevealed(res.plaintext);
      setNewName("");
      setPerms(["read"]);
      qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
      toast.success("API key created. Copy it now — it won't be shown again.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenMut = useMutation({
    mutationFn: (id: string) => regenerateApiKey(id),
    onSuccess: (res) => {
      setRevealed(res.plaintext);
      qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
      toast.success("Key regenerated. Update integrations now.");
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Programmatic access to the ZUPIX API. Keys are hashed at rest.</CardDescription>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New key</Button>
      </CardHeader>
      <CardContent>
        {revealed && (
          <Alert className="mb-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Your new API key (shown once):</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-muted p-2 text-xs">{revealed}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(revealed);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRevealed(null)}>Done</Button>
              </div>
            </div>
          </Alert>
        )}
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading…</div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="h-8 w-8" />}
            title="No API keys yet"
            description="Create a key to authenticate requests to the ZUPIX API."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell><code className="text-xs">{k.keyPrefix}…</code></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {k.permissions.map((p: ApiPermission) => <Badge key={p} variant="secondary">{p}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.status === "active" ? "default" : "outline"}>{k.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          const name = prompt("New name", k.name);
                          if (!name) return;
                          await renameApiKey(k.id, name);
                          qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
                        }}>Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => regenMut.mutate(k.id)}>
                          <RefreshCcw className="mr-2 h-4 w-4" />Regenerate
                        </DropdownMenuItem>
                        {k.status === "active" ? (
                          <DropdownMenuItem onClick={async () => {
                            await setApiKeyStatus(k.id, "disabled");
                            qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
                          }}>Disable</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={async () => {
                            await setApiKeyStatus(k.id, "active");
                            qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
                          }}>Enable</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            if (!confirm(`Delete "${k.name}"? This cannot be undone.`)) return;
                            await deleteApiKey(k.id);
                            qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Choose a name and the scope of access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Zapier integration" />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-2">
                {(["read", "write", "admin"] as ApiPermission[]).map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={perms.includes(p)}
                      onCheckedChange={(v) =>
                        setPerms((prev) => (v ? [...prev, p] : prev.filter((x) => x !== p)))
                      }
                    />
                    <span className="capitalize">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => { createMut.mutate(); setDialogOpen(false); }}
              disabled={perms.length === 0}
            >Create key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============ WEBHOOKS ============

function WebhooksTab({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const qc = useQueryClient();
  const { data: hooks = [], isLoading } = useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: () => listWebhooks(workspaceId),
  });
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Get real-time HTTP callbacks when events happen in your workspace.</CardDescription>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />New webhook</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading…</div>
        ) : hooks.length === 0 ? (
          <EmptyState
            icon={<WebhookIcon className="h-8 w-8" />}
            title="No webhooks yet"
            description="Create a webhook endpoint to receive event notifications."
          />
        ) : (
          <div className="space-y-3">
            {hooks.map((h) => (
              <WebhookRow
                key={h.id}
                hook={h}
                onEdit={() => setEditing(h)}
                onChanged={() => qc.invalidateQueries({ queryKey: ["webhooks", workspaceId] })}
              />
            ))}
          </div>
        )}
      </CardContent>

      {(creating || editing) && (
        <WebhookDialog
          open
          hook={editing}
          workspaceId={workspaceId}
          userId={userId}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["webhooks", workspaceId] })}
        />
      )}
    </Card>
  );
}

function WebhookRow({
  hook, onEdit, onChanged,
}: {
  hook: Webhook;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [secretVisible, setSecretVisible] = useState<string | null>(null);

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{hook.name}</span>
            <Badge variant={hook.status === "active" ? "default" : "outline"}>{hook.status}</Badge>
            {hook.lastStatusCode !== null && (
              <Badge variant={hook.lastStatusCode < 400 ? "secondary" : "destructive"}>
                {hook.lastStatusCode}
              </Badge>
            )}
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{hook.url}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {hook.events.slice(0, 6).map((e: WebhookEvent) => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}
            {hook.events.length > 6 && (
              <Badge variant="outline" className="text-[10px]">+{hook.events.length - 6}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await testWebhook(hook);
              if (res.status === "success") toast.success(`Delivered (${res.statusCode}) in ${res.durationMs}ms`);
              else toast.error(`Failed${res.statusCode ? ` (${res.statusCode})` : ""}: ${res.errorMessage ?? ""}`);
              onChanged();
            }}
          >
            <Send className="mr-2 h-4 w-4" />Test
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await pauseWebhook(hook.id, hook.status === "active");
              onChanged();
            }}
          >
            {hook.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const s = await getWebhookSecret(hook.id);
                  setSecretVisible(s);
                }}
              >Reveal signing secret</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  if (!confirm(`Delete webhook "${hook.name}"?`)) return;
                  await deleteWebhook(hook.id);
                  onChanged();
                }}
              ><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {secretVisible && (
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 break-all rounded bg-muted p-2 text-xs">{secretVisible}</code>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(secretVisible); toast.success("Copied"); }}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSecretVisible(null)}>Hide</Button>
        </div>
      )}
    </div>
  );
}

function WebhookDialog({
  open, hook, workspaceId, userId, onClose, onSaved,
}: {
  open: boolean;
  hook: Webhook | null;
  workspaceId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(hook?.name ?? "");
  const [url, setUrl] = useState(hook?.url ?? "");
  const [events, setEvents] = useState<WebhookEvent[]>(hook?.events ?? []);
  const [headers, setHeaders] = useState(JSON.stringify(hook?.headers ?? {}, null, 2));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{hook ? "Edit webhook" : "New webhook"}</DialogTitle>
          <DialogDescription>Send POST requests to your endpoint when events occur.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production endpoint" /></div>
          <div><Label>URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhooks/zupix" /></div>
          <div>
            <Label>Events</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((e: WebhookEvent) => (
                <label key={e} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={events.includes(e)}
                    onCheckedChange={(v) => setEvents((prev) => (v ? [...prev, e] : prev.filter((x) => x !== e)))}
                  />
                  <code className="text-xs">{e}</code>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Custom headers (JSON)</Label>
            <Textarea rows={4} value={headers} onChange={(e) => setHeaders(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={async () => {
              let parsedHeaders: Record<string, string> = {};
              try { parsedHeaders = JSON.parse(headers); } catch { toast.error("Headers must be valid JSON"); return; }
              if (!url.startsWith("http")) { toast.error("URL must start with http(s)://"); return; }
              if (events.length === 0) { toast.error("Select at least one event"); return; }
              try {
                if (hook) {
                  await updateWebhook(hook.id, { name, url, events, headers: parsedHeaders });
                } else {
                  await createWebhook({ workspaceId, userId, name: name || "Webhook", url, events, headers: parsedHeaders });
                }
                toast.success("Saved");
                onSaved();
                onClose();
              } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
            }}
          >Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ DELIVERIES ============

function DeliveriesTab({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["deliveries", workspaceId],
    queryFn: () => listDeliveries(workspaceId),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery log</CardTitle>
        <CardDescription>Recent webhook attempts, success/failure and retry status.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <EmptyState icon={<Send className="h-8 w-8" />} title="No deliveries yet" description="Trigger a webhook or wait for an event." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">{new Date(d.createdAt).toLocaleString()}</TableCell>
                  <TableCell><code className="text-xs">{d.event}</code></TableCell>
                  <TableCell>
                    <Badge variant={d.status === "success" ? "default" : d.status === "failed" ? "destructive" : "outline"}>
                      {d.status === "success" ? <Check className="mr-1 h-3 w-3" /> : d.status === "failed" ? <X className="mr-1 h-3 w-3" /> : null}
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{d.statusCode ?? "—"}</TableCell>
                  <TableCell>{d.durationMs != null ? `${d.durationMs}ms` : "—"}</TableCell>
                  <TableCell>#{d.attempt}</TableCell>
                  <TableCell>
                    {d.status !== "success" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await retryDelivery(d);
                            toast.success("Retried");
                            qc.invalidateQueries({ queryKey: ["deliveries", workspaceId] });
                          } catch (e) { toast.error(e instanceof Error ? e.message : "Retry failed"); }
                        }}
                      ><RefreshCcw className="mr-2 h-4 w-4" />Retry</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============ API LOGS ============

function LogsTab({ workspaceId }: { workspaceId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["api-logs", workspaceId],
    queryFn: () => listApiLogs(workspaceId),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>API request logs</CardTitle>
        <CardDescription>Every authenticated request to the ZUPIX API for this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-8 w-8" />}
            title="No API requests yet"
            description="Once your integrations start calling the API, requests will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Request ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{l.method}</Badge></TableCell>
                  <TableCell><code className="text-xs">{l.endpoint}</code></TableCell>
                  <TableCell>
                    <Badge variant={l.statusCode < 400 ? "secondary" : "destructive"}>{l.statusCode}</Badge>
                  </TableCell>
                  <TableCell>{l.durationMs}ms</TableCell>
                  <TableCell><code className="text-[10px] text-muted-foreground">{l.requestId}</code></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============ PROVIDERS ============

function ProvidersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation providers</CardTitle>
        <CardDescription>Connect ZUPIX to no-code automation platforms.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {AUTOMATION_PROVIDERS.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant={p.status === "ready" ? "default" : "outline"}>
                    {p.status === "ready" ? "Ready" : "Coming soon"}
                  </Badge>
                </div>
                <a
                  href={p.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline"
                >{p.docs}</a>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={p.docs} target="_blank" rel="noopener noreferrer">Open</a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ DOCS ============

function DocsTab() {
  const example = `curl https://api.zupix.link/v1/pages \\
  -H "Authorization: Bearer zpx_live_XXXXXXXXXXXX" \\
  -H "X-Request-ID: $(uuidgen)"`;
  const response = `{
  "data": [
    { "id": "abc123", "slug": "jane", "status": "published" }
  ],
  "pagination": { "page": 1, "per_page": 20, "total": 1 }
}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer documentation</CardTitle>
        <CardDescription>Everything you need to build integrations on ZUPIX Link Studio.</CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none space-y-6 dark:prose-invert">
        <section>
          <h3 className="text-base font-semibold">Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Every request must include a bearer token issued from the API Keys tab. Keys are workspace-scoped
            and inherit the permissions you assign (read / write / admin).
          </p>
          <pre className="rounded bg-muted p-3 text-xs">Authorization: Bearer zpx_live_XXXXXXXXXXXX</pre>
        </section>
        <section>
          <h3 className="text-base font-semibold">API base URL & versioning</h3>
          <pre className="rounded bg-muted p-3 text-xs">https://api.zupix.link/v1</pre>
          <p className="text-sm text-muted-foreground">
            All endpoints support pagination (<code>?page</code>, <code>?per_page</code>), filtering
            (<code>?filter[key]=value</code>) and sorting (<code>?sort=-created_at</code>).
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold">Example request</h3>
          <pre className="rounded bg-muted p-3 text-xs whitespace-pre-wrap">{example}</pre>
        </section>
        <section>
          <h3 className="text-base font-semibold">Example response</h3>
          <pre className="rounded bg-muted p-3 text-xs whitespace-pre-wrap">{response}</pre>
        </section>
        <section>
          <h3 className="text-base font-semibold">Webhook guide</h3>
          <p className="text-sm text-muted-foreground">
            Each delivery includes an HMAC signature so you can verify authenticity:
          </p>
          <pre className="rounded bg-muted p-3 text-xs">X-Zupix-Timestamp: 1731590400
X-Zupix-Signature: sha256=&lt;hex hmac of `${'{'}timestamp{'}'}.${'{'}body{'}'}`&gt;
X-Zupix-Event: bio.published</pre>
          <p className="text-sm text-muted-foreground">
            Compute <code>HMAC-SHA256(secret, `${'{'}timestamp{'}'}.${'{'}raw body{'}'}`)</code> and compare
            using a timing-safe equality check. Reject deliveries older than 5 minutes to prevent replay.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold">Rate limits</h3>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Per API key: 600 requests / minute</li>
            <li>Per workspace: 3,000 requests / minute</li>
            <li>Burst protection: 60 requests / second</li>
            <li>Responses include <code>X-RateLimit-Remaining</code> and <code>X-RateLimit-Reset</code>.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-base font-semibold">Error codes</h3>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li><code>400</code> invalid_request — malformed input.</li>
            <li><code>401</code> unauthorized — missing or invalid API key.</li>
            <li><code>403</code> forbidden — key lacks the required scope.</li>
            <li><code>404</code> not_found — resource does not exist in this workspace.</li>
            <li><code>409</code> conflict — duplicate or state violation.</li>
            <li><code>429</code> rate_limited — slow down, honor <code>Retry-After</code>.</li>
            <li><code>5xx</code> server_error — transient; retry with exponential backoff.</li>
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

// ============ NOTIFICATIONS ============

function NotificationsTab({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", workspaceId],
    queryFn: () => listNotifications(workspaceId),
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markNotificationRead(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
      toast.success("Notification deleted");
    },
  });

  if (isLoading) return <div className="flex h-40 items-center justify-center">Loading notifications...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>System updates, form submissions, and business alerts.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] })}>
          <RefreshCcw className="mr-2 h-3 w-3" /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">We'll notify you here when important events happen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications?.map((n: DashboardNotification) => (
              <div 
                key={n.id} 
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${!n.read ? "bg-muted/50 border-primary/20" : ""}`}
              >
                <div className={`mt-1 rounded-full p-2 ${!n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{n.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(n.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <div className="flex items-center gap-2 pt-2">
                    {!n.read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs px-2"
                        onClick={() => markReadMutation.mutate({ id: n.id, read: true })}
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs px-2 text-destructive"
                      onClick={() => deleteMutation.mutate(n.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ WORKFLOWS ============

function WorkflowsTab({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  
  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules", workspaceId],
    queryFn: () => listAutomationRules(workspaceId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      updateAutomationRule(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", workspaceId] });
      toast.success("Workflow updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAutomationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", workspaceId] });
      toast.success("Workflow deleted");
    },
  });

  if (isLoading) return <div className="flex h-40 items-center justify-center">Loading workflows...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Business Workflows</CardTitle>
            <CardDescription>Automate repetitive tasks and customer notifications.</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Workflow
          </Button>
        </CardHeader>
        <CardContent>
          {!rules?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium">No workflows configured</h3>
              <p className="text-sm text-muted-foreground">Create your first automation to streamline your business.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAdding(true)}>
                Get Started
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rules?.map((rule: AutomationRule) => (
                <Card key={rule.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                      </div>
                      <Switch 
                        checked={rule.is_active} 
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="h-5 px-1.5 font-normal">Trigger</Badge>
                        <span className="capitalize">{rule.trigger.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="h-5 px-1.5 font-normal">Action</Badge>
                        <span className="capitalize">{rule.action.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-3 flex justify-between">
                    <Button variant="ghost" size="sm" className="h-8">
                      <Settings className="mr-2 h-3 w-3" /> Configure
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-destructive"
                      onClick={() => deleteMutation.mutate(rule.id)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddWorkflowDialog 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)} 
        workspaceId={workspaceId} 
      />
    </div>
  );
}

function AddWorkflowDialog({ isOpen, onClose, workspaceId }: { isOpen: boolean, onClose: () => void, workspaceId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<any>("form_submission");
  const [action, setAction] = useState<any>("dashboard_notification");

  const createMutation = useMutation({
    mutationFn: () => createAutomationRule({
      workspace_id: workspaceId,
      name,
      trigger,
      action,
      config: {},
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", workspaceId] });
      toast.success("Workflow created successfully");
      onClose();
      setName("");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>Define a trigger and an action for your automation.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workflow Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. New Lead Welcome" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>When this happens (Trigger)</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              {WEBHOOK_EVENTS.map(e => (
                <option key={e} value={e}>{e.replace(/\./g, " ").replace(/_/g, " ").toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Do this (Action)</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="dashboard_notification">Show Dashboard Notification</option>
              <option value="activity_log">Create Activity Log</option>
              <option value="send_email">Send Email (SMTP)</option>
              <option value="send_whatsapp">Send WhatsApp Message</option>
              <option value="redirect_customer">Redirect to URL</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name}>Create Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ TIMELINE ============

function TimelineTab({ workspaceId }: { workspaceId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs", workspaceId],
    queryFn: () => listActivityLogs(workspaceId),
  });

  if (isLoading) return <div className="flex h-40 items-center justify-center">Loading activity log...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>A complete history of business events in your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {!logs?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No activity recorded</h3>
            <p className="text-sm text-muted-foreground">Business events will appear here in chronological order.</p>
          </div>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:to-transparent">
            {logs?.map((log: ActivityLogEntry) => (
              <div key={log.id} className="relative flex items-center gap-6 pl-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold">{log.title}</h4>
                    <span className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.description}</p>
                  {log.metadata && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(log.metadata).slice(0, 3).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-[10px] font-normal">
                          {k}: {String(v)}
                        </Badge>
                      ))}
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

// ============ SETTINGS ============

function SettingsTab({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["automation-settings", workspaceId],
    queryFn: () => getAutomationSettings(workspaceId),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<UserAutomationSettings>) => 
      updateAutomationSettings(workspaceId, { ...settings!, ...patch }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-settings", workspaceId] });
      toast.success("Settings updated");
    },
  });

  if (isLoading) return <div className="flex h-40 items-center justify-center">Loading settings...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Settings</CardTitle>
        <CardDescription>Control how you receive notifications and business alerts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Dashboard Notifications
            </Label>
            <p className="text-sm text-muted-foreground">Show alerts in the in-app notification center.</p>
          </div>
          <Switch 
            checked={settings?.dashboard_enabled} 
            onCheckedChange={(checked) => updateMutation.mutate({ dashboard_enabled: checked })}
          />
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email Alerts
            </Label>
            <p className="text-sm text-muted-foreground">Receive important business notifications via email.</p>
          </div>
          <Switch 
            checked={settings?.email_enabled} 
            onCheckedChange={(checked) => updateMutation.mutate({ email_enabled: checked })}
          />
        </div>

        <DropdownMenuSeparator />

        <div className="flex items-center justify-between space-x-2 opacity-50">
          <div className="flex flex-col space-y-1">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> WhatsApp Notifications
            </Label>
            <p className="text-sm text-muted-foreground">Get real-time booking alerts on WhatsApp (Requires API Setup).</p>
          </div>
          <Switch 
            checked={settings?.whatsapp_enabled} 
            disabled
          />
        </div>
        
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <h5 className="font-medium text-sm">Enterprise Add-on</h5>
            <p className="text-xs text-muted-foreground mt-1">
              WhatsApp notifications require a business API configuration. Contact support to enable this feature.
            </p>
          </div>
        </Alert>
      </CardContent>
    </Card>
  );
}


// unused import guard
export const _sink = { useEffect, useMemo };
