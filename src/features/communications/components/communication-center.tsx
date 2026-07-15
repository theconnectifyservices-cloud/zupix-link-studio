import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchCommunicationSettings,
  updateProviderSettings,
  setActiveEmailProvider,
  updateNotifications,
  testConnection,
  sendTestMessage,
  listMessageTemplates,
  upsertMessageTemplate,
  deleteMessageTemplate,
  seedSystemTemplates,
} from "../api.functions";
import {
  CHANNELS,
  DEFAULT_SETTINGS,
  NOTIFICATION_EVENTS,
  SECRET_SENTINEL,
  type ChannelKey,
  type CommunicationSettings,
  type EmailSubKey,
  type MessageTemplate,
  type NotificationEvent,
} from "../types";

interface Props {
  workspaceId: string;
}

const EMAIL_PROVIDERS: {
  key: EmailSubKey;
  label: string;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string; secret?: boolean }>;
  note?: string;
}[] = [
  {
    key: "brevo",
    label: "Brevo",
    fields: [
      { name: "apiKey", label: "API Key", secret: true, placeholder: "xkeysib-…" },
      { name: "fromEmail", label: "From Email", type: "email" },
      { name: "fromName", label: "From Name" },
    ],
  },
  {
    key: "resend",
    label: "Resend",
    fields: [
      { name: "apiKey", label: "API Key", secret: true, placeholder: "re_…" },
      { name: "fromEmail", label: "From Email", type: "email" },
      { name: "fromName", label: "From Name" },
    ],
  },
  {
    key: "mailchimp",
    label: "Mailchimp",
    fields: [
      { name: "apiKey", label: "API Key", secret: true },
      { name: "serverPrefix", label: "Server Prefix", placeholder: "us21" },
      { name: "fromEmail", label: "From Email", type: "email" },
    ],
  },
  {
    key: "convertkit",
    label: "ConvertKit",
    fields: [
      { name: "apiSecret", label: "API Secret", secret: true },
      { name: "fromEmail", label: "From Email", type: "email" },
    ],
  },
  {
    key: "smtp",
    label: "SMTP",
    note: "Configuration saved; live send is unavailable on this runtime.",
    fields: [
      { name: "host", label: "Host" },
      { name: "port", label: "Port", type: "number", placeholder: "587" },
      { name: "username", label: "Username" },
      { name: "password", label: "Password", secret: true },
      { name: "fromEmail", label: "From Email", type: "email" },
      { name: "fromName", label: "From Name" },
    ],
  },
  {
    key: "ses",
    label: "Amazon SES",
    note: "Architecture ready — sending will be enabled in a later phase.",
    fields: [
      { name: "accessKeyId", label: "Access Key ID", secret: true },
      { name: "secretAccessKey", label: "Secret Access Key", secret: true },
      { name: "region", label: "Region", placeholder: "us-east-1" },
      { name: "fromEmail", label: "From Email", type: "email" },
    ],
  },
];

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
    connected: { label: "Connected", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
    disconnected: { label: "Disconnected", className: "bg-muted text-muted-foreground", icon: <XCircle className="h-3 w-3" /> },
    invalid: { label: "Invalid", className: "bg-red-500/15 text-red-500 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
    warning: { label: "Warning", className: "bg-amber-500/15 text-amber-500 border-amber-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const s = map[status ?? "disconnected"] ?? map.disconnected;
  return (
    <Badge variant="outline" className={`gap-1 ${s.className}`}>
      {s.icon} {s.label}
    </Badge>
  );
}

export function CommunicationCenter({ workspaceId }: Props) {
  const [settings, setSettings] = useState<CommunicationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const refresh = useCallback(async () => {
    const [s, t] = await Promise.all([
      fetchCommunicationSettings({ data: { workspaceId } }),
      listMessageTemplates({ data: { workspaceId } }),
    ]);
    setSettings(s);
    setTemplates(t);
  }, [workspaceId]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const saveProvider = async (provider: string, subKey: string | undefined, patch: Record<string, unknown>) => {
    setBusy(`${provider}${subKey ?? ""}`);
    try {
      const next = await updateProviderSettings({
        data: { workspaceId, provider: provider as never, subKey: subKey as never, settings: patch },
      });
      setSettings(next);
      toast.success("Settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runTest = async (provider: string, subKey?: string) => {
    setBusy(`test-${provider}${subKey ?? ""}`);
    try {
      const r = await testConnection({ data: { workspaceId, provider: provider as never, subKey: subKey as never } });
      if (r.ok) toast.success(`Connected${r.message ? `: ${r.message}` : ""}`);
      else toast.error(r.message ?? "Connection test failed");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Communication Center…
      </div>
    );
  }

  return (
    <Tabs defaultValue="messaging" className="space-y-6">
      <TabsList className="w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="messaging">
          <MessageCircle className="mr-2 h-4 w-4" /> Messaging
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="mr-2 h-4 w-4" /> Email
        </TabsTrigger>
        <TabsTrigger value="chat">
          <MessageCircle className="mr-2 h-4 w-4" /> Slack &amp; Discord
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <ShieldCheck className="mr-2 h-4 w-4" /> Notifications
        </TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="test">
          <Send className="mr-2 h-4 w-4" /> Test Center
        </TabsTrigger>
      </TabsList>

      {/* MESSAGING */}
      <TabsContent value="messaging" className="grid gap-6 md:grid-cols-2">
        <WhatsAppCard
          value={settings.providers.whatsapp}
          health={settings.health.whatsapp}
          busy={busy}
          onSave={(patch) => saveProvider("whatsapp", undefined, patch)}
          onTest={() => runTest("whatsapp")}
        />
        <TelegramCard
          value={settings.providers.telegram}
          health={settings.health.telegram}
          busy={busy}
          onSave={(patch) => saveProvider("telegram", undefined, patch)}
          onTest={() => runTest("telegram")}
        />
      </TabsContent>

      {/* EMAIL */}
      <TabsContent value="email" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active email provider</span>
              <Select
                value={settings.providers.email?.active ?? ""}
                onValueChange={async (v) => {
                  await setActiveEmailProvider({ data: { workspaceId, active: v as EmailSubKey | "" } });
                  await refresh();
                  toast.success("Default provider updated");
                }}
              >
                <SelectTrigger className="w-56"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brevo">Brevo</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="mailchimp">Mailchimp</SelectItem>
                  <SelectItem value="convertkit">ConvertKit</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          {EMAIL_PROVIDERS.map((cfg) => (
            <EmailProviderCard
              key={cfg.key}
              cfg={cfg}
              value={(settings.providers.email as unknown as Record<string, Record<string, unknown>> | undefined)?.[cfg.key]}
              health={settings.health[`email.${cfg.key}`]}
              busy={busy}
              onSave={(patch) => saveProvider("email", cfg.key, patch)}
              onTest={() => runTest("email", cfg.key)}
            />
          ))}
        </div>
      </TabsContent>

      {/* SLACK & DISCORD */}
      <TabsContent value="chat" className="grid gap-6 md:grid-cols-2">
        <WebhookCard
          title="Slack"
          value={settings.providers.slack}
          health={settings.health.slack}
          busy={busy}
          placeholder="https://hooks.slack.com/services/…"
          onSave={(patch) => saveProvider("slack", undefined, patch)}
          onTest={() => runTest("slack")}
        />
        <WebhookCard
          title="Discord"
          value={settings.providers.discord}
          health={settings.health.discord}
          busy={busy}
          placeholder="https://discord.com/api/webhooks/…"
          onSave={(patch) => saveProvider("discord", undefined, patch)}
          onTest={() => runTest("discord")}
        />
      </TabsContent>

      {/* NOTIFICATIONS */}
      <TabsContent value="notifications">
        <NotificationRouter
          settings={settings}
          templates={templates}
          onChange={async (n) => {
            const next = await updateNotifications({ data: { workspaceId, notifications: n } });
            setSettings(next);
            toast.success("Notification routing saved");
          }}
        />
      </TabsContent>

      {/* TEMPLATES */}
      <TabsContent value="templates">
        <TemplatesPanel
          workspaceId={workspaceId}
          templates={templates}
          onChanged={refresh}
        />
      </TabsContent>

      {/* TEST CENTER */}
      <TabsContent value="test">
        <TestCenter
          settings={settings}
          onSend={async (payload) => {
            setBusy("send");
            try {
              const r = await sendTestMessage({ data: { workspaceId, ...payload } });
              if (r.ok) toast.success("Test message sent");
              else toast.error(r.message ?? "Send failed");
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(null);
            }
          }}
          busy={busy === "send"}
        />
      </TabsContent>
    </Tabs>
  );
}

// ---------- provider cards ----------

interface ProviderCardShellProps {
  title: string;
  enabled: boolean;
  health?: { status?: string; lastCheckedAt?: string; message?: string; version?: string };
  onToggle: (enabled: boolean) => void;
  onTest: () => void;
  onSave: () => void;
  testDisabled?: boolean;
  saveDisabled?: boolean;
  busy: string | null;
  testKey: string;
  saveKey: string;
  note?: string;
  children: React.ReactNode;
}

function ProviderCardShell(props: ProviderCardShellProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">{props.title}</CardTitle>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={props.health?.status} />
            {props.health?.lastCheckedAt && (
              <span>Last checked {new Date(props.health.lastCheckedAt).toLocaleString()}</span>
            )}
            {props.health?.version && <span>· {props.health.version}</span>}
          </div>
        </div>
        <Switch checked={props.enabled} onCheckedChange={props.onToggle} />
      </CardHeader>
      <CardContent className="space-y-3">
        {props.note && <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">{props.note}</p>}
        {props.children}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={props.onTest} disabled={props.testDisabled || props.busy === props.testKey}>
            {props.busy === props.testKey ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Verify
          </Button>
          <Button size="sm" onClick={props.onSave} disabled={props.saveDisabled || props.busy === props.saveKey}>
            {props.busy === props.saveKey ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function useDraft<T extends Record<string, unknown>>(value: T | undefined, defaults: T): [T, (patch: Partial<T>) => void, () => void] {
  const [draft, setDraft] = useState<T>({ ...defaults, ...(value ?? {}) });
  useEffect(() => {
    setDraft({ ...defaults, ...(value ?? {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);
  const update = (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch }));
  const reset = () => setDraft({ ...defaults, ...(value ?? {}) });
  return [draft, update, reset];
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const isMasked = value === SECRET_SENTINEL;
  return (
    <div className="flex gap-2">
      <Input
        type="password"
        value={value === SECRET_SENTINEL ? "••••••••" : value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (isMasked) onChange(""); }}
      />
    </div>
  );
}

function WhatsAppCard(props: { value: ReturnType<typeof useState>[0] extends unknown ? Record<string, unknown> | undefined : never; health?: { status?: string; lastCheckedAt?: string; message?: string; version?: string }; busy: string | null; onSave: (patch: Record<string, unknown>) => void; onTest: () => void }) {
  const [d, update] = useDraft(props.value as unknown as Record<string, string | boolean>, { enabled: false, phoneNumberId: "", businessAccountId: "", accessToken: "" });
  return (
    <ProviderCardShell
      title="WhatsApp Cloud API"
      enabled={!!d.enabled}
      onToggle={(v) => update({ enabled: v })}
      health={props.health}
      busy={props.busy}
      testKey="test-whatsapp"
      saveKey="whatsapp"
      onSave={() => props.onSave(d)}
      onTest={props.onTest}
    >
      <Label>Phone Number ID</Label>
      <Input value={d.phoneNumberId as string} onChange={(e) => update({ phoneNumberId: e.target.value })} />
      <Label>Business Account ID</Label>
      <Input value={d.businessAccountId as string} onChange={(e) => update({ businessAccountId: e.target.value })} />
      <Label>Access Token</Label>
      <SecretInput value={d.accessToken as string} onChange={(v) => update({ accessToken: v })} placeholder="EAAG…" />
    </ProviderCardShell>
  );
}

function TelegramCard(props: { value: Record<string, unknown> | undefined; health?: { status?: string; lastCheckedAt?: string }; busy: string | null; onSave: (patch: Record<string, unknown>) => void; onTest: () => void }) {
  const [d, update] = useDraft(props.value as Record<string, string | boolean>, { enabled: false, botToken: "", defaultChatId: "" });
  return (
    <ProviderCardShell
      title="Telegram Bot"
      enabled={!!d.enabled}
      onToggle={(v) => update({ enabled: v })}
      health={props.health}
      busy={props.busy}
      testKey="test-telegram"
      saveKey="telegram"
      onSave={() => props.onSave(d)}
      onTest={props.onTest}
    >
      <Label>Bot Token</Label>
      <SecretInput value={d.botToken as string} onChange={(v) => update({ botToken: v })} placeholder="123456:ABC…" />
      <Label>Default Chat ID</Label>
      <Input value={d.defaultChatId as string} onChange={(e) => update({ defaultChatId: e.target.value })} placeholder="-100…" />
    </ProviderCardShell>
  );
}

function WebhookCard(props: { title: string; value: Record<string, unknown> | undefined; health?: { status?: string; lastCheckedAt?: string }; busy: string | null; placeholder: string; onSave: (patch: Record<string, unknown>) => void; onTest: () => void }) {
  const [d, update] = useDraft(props.value as Record<string, string | boolean>, { enabled: false, webhookUrl: "" });
  return (
    <ProviderCardShell
      title={props.title}
      enabled={!!d.enabled}
      onToggle={(v) => update({ enabled: v })}
      health={props.health}
      busy={props.busy}
      testKey={`test-${props.title.toLowerCase()}`}
      saveKey={props.title.toLowerCase()}
      onSave={() => props.onSave(d)}
      onTest={props.onTest}
    >
      <Label>Webhook URL</Label>
      <SecretInput value={d.webhookUrl as string} onChange={(v) => update({ webhookUrl: v })} placeholder={props.placeholder} />
    </ProviderCardShell>
  );
}

function EmailProviderCard(props: {
  cfg: (typeof EMAIL_PROVIDERS)[number];
  value: Record<string, unknown> | undefined;
  health?: { status?: string; lastCheckedAt?: string };
  busy: string | null;
  onSave: (patch: Record<string, unknown>) => void;
  onTest: () => void;
}) {
  const defaults = Object.fromEntries([["enabled", false], ...props.cfg.fields.map((f) => [f.name, f.type === "number" ? 0 : ""])]) as Record<string, unknown>;
  const [d, update] = useDraft(props.value as Record<string, unknown>, defaults);
  return (
    <ProviderCardShell
      title={props.cfg.label}
      enabled={!!d.enabled}
      onToggle={(v) => update({ enabled: v })}
      health={props.health}
      busy={props.busy}
      testKey={`test-email${props.cfg.key}`}
      saveKey={`email${props.cfg.key}`}
      note={props.cfg.note}
      onSave={() => props.onSave(d)}
      onTest={props.onTest}
    >
      {props.cfg.fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <Label>{f.label}</Label>
          {f.secret ? (
            <SecretInput value={(d[f.name] as string) ?? ""} onChange={(v) => update({ [f.name]: v })} placeholder={f.placeholder} />
          ) : (
            <Input
              type={f.type ?? "text"}
              value={(d[f.name] as string | number | undefined) ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => update({ [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
            />
          )}
        </div>
      ))}
    </ProviderCardShell>
  );
}

// ---------- notifications ----------

function NotificationRouter({
  settings,
  templates,
  onChange,
}: {
  settings: CommunicationSettings;
  templates: MessageTemplate[];
  onChange: (n: CommunicationSettings["notifications"]) => void;
}) {
  const notifications = settings.notifications;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification routing</CardTitle>
        <p className="text-sm text-muted-foreground">Select channels each event should broadcast to. Templates plug in on delivery.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {NOTIFICATION_EVENTS.map((ev) => {
          const route = notifications[ev.key] ?? { channels: [] };
          const toggle = (ch: ChannelKey) => {
            const set = new Set(route.channels);
            if (set.has(ch)) set.delete(ch); else set.add(ch);
            onChange({ ...notifications, [ev.key]: { ...route, channels: [...set] } });
          };
          return (
            <div key={ev.key} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{ev.label}</div>
                  <div className="text-xs text-muted-foreground">{ev.description}</div>
                </div>
                <Select
                  value={route.templateKey ?? ""}
                  onValueChange={(v) =>
                    onChange({ ...notifications, [ev.key]: { ...route, templateKey: v || undefined } })
                  }
                >
                  <SelectTrigger className="w-56"><SelectValue placeholder="Template (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— none —</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.key}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => {
                  const on = route.channels.includes(ch);
                  return (
                    <Button
                      key={ch}
                      size="sm"
                      variant={on ? "default" : "outline"}
                      onClick={() => toggle(ch as ChannelKey)}
                      className="capitalize"
                    >
                      {ch}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ---------- templates ----------

function TemplatesPanel({
  workspaceId,
  templates,
  onChanged,
}: {
  workspaceId: string;
  templates: MessageTemplate[];
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Partial<MessageTemplate> | null>(null);

  const seed = async () => {
    await seedSystemTemplates({ data: { workspaceId } });
    await onChanged();
    toast.success("System templates ready");
  };

  const save = async () => {
    if (!editing) return;
    try {
      await upsertMessageTemplate({
        data: {
          workspaceId,
          id: editing.id,
          key: editing.key ?? "",
          name: editing.name ?? "",
          channel: (editing.channel as ChannelKey) ?? "email",
          subject: editing.subject ?? undefined,
          body: editing.body ?? "",
          variables: editing.variables ?? [],
        },
      });
      setEditing(null);
      await onChanged();
      toast.success("Template saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    await deleteMessageTemplate({ data: { workspaceId, id } });
    await onChanged();
    toast.success("Template deleted");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Message templates</CardTitle>
          <p className="text-sm text-muted-foreground">Reusable copy for every notification and channel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seed}>Seed system templates</Button>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing({ channel: "email", variables: [] })}><Plus className="mr-2 h-4 w-4" /> New template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Key</Label>
                    <Input value={editing?.key ?? ""} onChange={(e) => setEditing((s) => ({ ...s, key: e.target.value.toLowerCase() }))} placeholder="welcome_customer" />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input value={editing?.name ?? ""} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Channel</Label>
                    <Select value={(editing?.channel as string) ?? "email"} onValueChange={(v) => setEditing((s) => ({ ...s, channel: v as ChannelKey }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {editing?.channel === "email" && (
                    <div>
                      <Label>Subject</Label>
                      <Input value={editing?.subject ?? ""} onChange={(e) => setEditing((s) => ({ ...s, subject: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea rows={6} value={editing?.body ?? ""} onChange={(e) => setEditing((s) => ({ ...s, body: e.target.value }))} placeholder="Hi {{name}}, …" />
                  <p className="mt-1 text-xs text-muted-foreground">Use double braces for variables, e.g. <code>{"{{name}}"}</code>.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save}>Save template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No templates yet. Seed system templates to get started.</p>
        ) : (
          <div className="divide-y">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {t.name}
                    <Badge variant="outline" className="capitalize">{t.channel}</Badge>
                    {t.isSystem && <Badge variant="secondary">system</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">Key: <code>{t.key}</code></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Edit</Button>
                  {!t.isSystem && (
                    <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

// ---------- test center ----------

function TestCenter({
  settings,
  onSend,
  busy,
}: {
  settings: CommunicationSettings;
  onSend: (p: { provider: string; subKey?: string; recipient: string; subject?: string; message: string }) => Promise<void>;
  busy: boolean;
}) {
  const options = useMemo(() => {
    const arr: { value: string; label: string; provider: string; subKey?: string }[] = [];
    if (settings.providers.whatsapp?.enabled) arr.push({ value: "whatsapp", label: "WhatsApp", provider: "whatsapp" });
    if (settings.providers.telegram?.enabled) arr.push({ value: "telegram", label: "Telegram", provider: "telegram" });
    if (settings.providers.slack?.enabled) arr.push({ value: "slack", label: "Slack", provider: "slack" });
    if (settings.providers.discord?.enabled) arr.push({ value: "discord", label: "Discord", provider: "discord" });
    const email = settings.providers.email as unknown as Record<string, { enabled?: boolean }> | undefined;
    for (const k of ["brevo", "resend", "mailchimp", "convertkit"] as const) {
      if (email?.[k]?.enabled) arr.push({ value: `email.${k}`, label: `Email · ${k}`, provider: "email", subKey: k });
    }
    return arr;
  }, [settings]);

  const [target, setTarget] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("ZUPIX Test");
  const [message, setMessage] = useState("Hello from ZUPIX Communication Center 👋");

  useEffect(() => {
    if (!target && options[0]) setTarget(options[0].value);
  }, [options, target]);

  const chosen = options.find((o) => o.value === target);
  const isEmail = chosen?.provider === "email";
  const isChatWebhook = chosen?.provider === "slack" || chosen?.provider === "discord";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Center</CardTitle>
        <p className="text-sm text-muted-foreground">Send a real test through any enabled provider.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Enable at least one provider to run tests.</p>
        ) : (
          <>
            <Label>Provider</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {!isChatWebhook && (
              <>
                <Label>{isEmail ? "Recipient email" : chosen?.provider === "telegram" ? "Chat ID (optional)" : "Recipient (E.164)"}</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={isEmail ? "you@example.com" : "+15551234567"} />
              </>
            )}
            {isEmail && (
              <>
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </>
            )}
            <Label>Message</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex justify-end">
              <Button
                disabled={busy || !chosen || (!isChatWebhook && !recipient)}
                onClick={() =>
                  chosen && onSend({
                    provider: chosen.provider,
                    subKey: chosen.subKey,
                    recipient: isChatWebhook ? "webhook" : recipient,
                    subject: isEmail ? subject : undefined,
                    message,
                  })
                }
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send test
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
