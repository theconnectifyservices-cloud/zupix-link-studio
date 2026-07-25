/**
 * Super Admin — Payment Gateway Manager.
 * Manage Razorpay, PayU, Cashfree, and Manual UPI: credentials, mode, health.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, CheckCircle2, KeyRound, Loader2, Plus, Save, Settings2, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { listGateways, upsertGateway, deleteGateway, runHealthCheck } from "../../admin.functions";
import { REGISTRY_META } from "../../gateways/registry";
import type { PaymentGatewayPublic, PaymentProvider, PaymentMode } from "../../types";

interface Props {
  /** Null = global (super admin) gateways. */
  workspaceId?: string | null;
}

const HEALTH_TONE: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  degraded: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  down: "bg-red-500/10 text-red-600 border-red-500/30",
  unknown: "bg-muted text-muted-foreground",
};

const CREDENTIAL_FIELDS: Record<PaymentProvider, { key: string; label: string; type?: "password" | "text" }[]> = {
  razorpay: [
    { key: "key_id", label: "Key ID" },
    { key: "key_secret", label: "Key Secret", type: "password" },
  ],
  payu: [
    { key: "merchant_key", label: "Merchant Key" },
    { key: "merchant_salt", label: "Merchant Salt", type: "password" },
  ],
  cashfree: [
    { key: "app_id", label: "App ID" },
    { key: "secret_key", label: "Secret Key", type: "password" },
  ],
  manual_upi: [],
};

export function GatewayManager({ workspaceId = null }: Props) {
  const qc = useQueryClient();
  const listFn = useServerFn(listGateways);
  const healthFn = useServerFn(runHealthCheck);
  const deleteFn = useServerFn(deleteGateway);

  const gwQ = useQuery({
    queryKey: ["admin-gateways", workspaceId],
    queryFn: () => listFn({ data: { workspaceId } }),
  });

  const [editing, setEditing] = useState<PaymentGatewayPublic | null>(null);
  const [creating, setCreating] = useState<PaymentProvider | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Gateway removed");
      qc.invalidateQueries({ queryKey: ["admin-gateways", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const health = useMutation({
    mutationFn: (id: string) => healthFn({ data: { id } }),
    onSuccess: (r) => {
      toast[r.status === "healthy" ? "success" : "warning"](`Health: ${r.status} · ${r.message}`);
      qc.invalidateQueries({ queryKey: ["admin-gateways", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gateways = gwQ.data ?? [];
  const missing = (Object.keys(REGISTRY_META) as PaymentProvider[])
    .filter((p) => !gateways.some((g) => g.provider === p));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings2 className="h-6 w-6" /> Payment Gateway Manager
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure Razorpay, PayU, Cashfree, and Manual UPI. Switch between sandbox and live modes safely.
        </p>
      </div>

      {gwQ.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gateways.map((g) => {
            const meta = REGISTRY_META[g.provider];
            return (
              <Card key={g.id} className="relative">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{g.display_name || meta?.label}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{meta?.description}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant={g.enabled ? "default" : "secondary"}>
                      {g.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Badge variant="outline">{g.mode}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" />
                      <Badge variant="outline" className={HEALTH_TONE[g.health_status]}>
                        {g.health_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <KeyRound className="h-3.5 w-3.5" />
                      {g.has_credentials ? "credentials set" : "no credentials"}
                    </div>
                  </div>
                  {g.health_message ? (
                    <p className="text-xs text-muted-foreground">{g.health_message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(g)}>
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => health.mutate(g.id)}
                      disabled={health.isPending}
                    >
                      {health.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Health check"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive ml-auto"
                      onClick={() => {
                        if (confirm(`Remove ${meta?.label ?? g.provider}?`)) del.mutate(g.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {missing.map((p) => {
            const meta = REGISTRY_META[p];
            return (
              <Card key={p} className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {meta.label}
                    <Badge variant="secondary" className="text-[10px]">Not configured</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" onClick={() => setCreating(p)}>
                    <Plus className="h-4 w-4 mr-1" /> Add {meta.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editing ? (
        <GatewayEditor
          gateway={editing}
          workspaceId={workspaceId}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-gateways", workspaceId] })}
        />
      ) : null}
      {creating ? (
        <GatewayEditor
          creating={creating}
          workspaceId={workspaceId}
          onClose={() => setCreating(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-gateways", workspaceId] })}
        />
      ) : null}
    </div>
  );
}

function GatewayEditor(props: {
  gateway?: PaymentGatewayPublic;
  creating?: PaymentProvider;
  workspaceId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { gateway, creating, workspaceId, onClose, onSaved } = props;
  const provider = gateway?.provider ?? creating!;
  const meta = REGISTRY_META[provider];
  const upsertFn = useServerFn(upsertGateway);

  const [displayName, setDisplayName] = useState(gateway?.display_name ?? meta.label);
  const [enabled, setEnabled] = useState(gateway?.enabled ?? true);
  const [mode, setMode] = useState<PaymentMode>(gateway?.mode ?? "sandbox");
  const [priority, setPriority] = useState<number>(gateway?.priority ?? 100);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [webhookSecret, setWebhookSecret] = useState("");
  const [upiId, setUpiId] = useState<string>((gateway?.config?.upi_id as string) ?? "");
  const [accountName, setAccountName] = useState<string>((gateway?.config?.account_name as string) ?? "");
  const [qrUrl, setQrUrl] = useState<string>((gateway?.config?.qr_image_url as string) ?? "");
  const [instructions, setInstructions] = useState<string>(
    (gateway?.config?.instructions as string) ??
      "1. Open any UPI app.\n2. Scan the QR or send to the UPI ID above.\n3. Enter the exact amount.\n4. Submit the UTR after payment.",
  );

  useEffect(() => {
    setCreds({});
    setWebhookSecret("");
  }, [gateway?.id, creating]);

  const save = useMutation({
    mutationFn: async () => {
      const config: Record<string, string> =
        provider === "manual_upi"
          ? { upi_id: upiId, account_name: accountName, qr_image_url: qrUrl, instructions }
          : {};
      const payload = {
        id: gateway?.id,
        workspace_id: workspaceId,
        provider,
        display_name: displayName,
        enabled,
        mode,
        priority: Number(priority) || 100,
        config,
        credentials: Object.keys(creds).length > 0 ? creds : undefined,
        webhook_secret: webhookSecret || undefined,
      };
      return upsertFn({ data: payload });
    },
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> {meta.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (test)</SelectItem>
                  <SelectItem value="live">Live (production)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 100)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label className="mb-2">Enabled</Label>
            </div>
          </div>

          {provider === "manual_upi" ? (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div>
                <Label>UPI ID</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="business@upi" />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </div>
              <div>
                <Label>QR Image URL</Label>
                <Input value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <Label>Payment Instructions</Label>
                <Textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
                {gateway?.has_credentials ? "Leave blank to keep existing secrets" : "Enter credentials"}
              </div>
              {CREDENTIAL_FIELDS[provider].map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type ?? "text"}
                    value={creds[f.key] ?? ""}
                    onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                    placeholder={gateway?.has_credentials ? "•••••• (unchanged)" : ""}
                  />
                </div>
              ))}
              <div>
                <Label>Webhook Signing Secret</Label>
                <Input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={gateway?.has_webhook_secret ? "•••••• (unchanged)" : "Optional"}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Webhook URL: <code className="font-mono">/api/public/webhooks/{provider}</code>
                </p>
              </div>
            </div>
          )}

          {mode === "live" ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>Live mode charges real cards. Verify credentials via a test transaction first.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 mt-0.5" />
              <span>Sandbox mode — safe for testing.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
