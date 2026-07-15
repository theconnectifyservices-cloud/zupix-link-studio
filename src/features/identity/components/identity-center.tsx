import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  Link2,
  Unlink,
  MonitorSmartphone,
  History,
  Puzzle,
  KeyRound,
  Building2,
  Check,
  X,
  LogOut,
  Trash2,
  Star,
  StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSession } from "@/features/auth/hooks/use-session";
import { OAUTH_PROVIDERS, providerLabel } from "../providers";
import type { OAuthProviderId } from "../providers";
import {
  fetchConnectedAccounts,
  fetchLoginHistory,
  fetchConnectedApps,
  fetchDevices,
  fetchSessions,
  linkProvider,
  listAuthIdentities,
  removeDevice,
  revokeConnectedApp,
  syncConnectedAccountsFromAuth,
  terminateAllOtherSessions,
  terminateSession,
  unlinkProvider,
  updateDevice,
  updateSecuritySettings,
  changePassword,
} from "../api";
import { supabase } from "@/integrations/supabase/client";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export function IdentityCenter() {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : null;

  if (!userId) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Sign in to manage your identity settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Identity Platform</h1>
          <p className="text-sm text-muted-foreground">
            Manage your connected accounts, sessions, devices, and account security.
          </p>
        </div>
      </header>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="accounts">
            <Link2 className="mr-2 h-4 w-4" />
            Connected accounts
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <MonitorSmartphone className="mr-2 h-4 w-4" />
            Sessions & devices
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Login history
          </TabsTrigger>
          <TabsTrigger value="apps">
            <Puzzle className="mr-2 h-4 w-4" />
            Connected apps
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="enterprise">
            <Building2 className="mr-2 h-4 w-4" />
            Enterprise SSO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <ConnectedAccountsTab userId={userId} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsTab userId={userId} />
        </TabsContent>
        <TabsContent value="history">
          <LoginHistoryTab userId={userId} />
        </TabsContent>
        <TabsContent value="apps">
          <ConnectedAppsTab userId={userId} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab userId={userId} />
        </TabsContent>
        <TabsContent value="enterprise">
          <EnterpriseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Connected accounts ---------- */

function ConnectedAccountsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const identities = useQuery({
    queryKey: ["auth-identities"],
    queryFn: listAuthIdentities,
  });
  const mirror = useQuery({
    queryKey: ["connected-accounts", userId],
    queryFn: () => fetchConnectedAccounts(userId),
  });

  useEffect(() => {
    if (identities.data && identities.data.length > 0) {
      syncConnectedAccountsFromAuth(userId).catch(() => undefined);
    }
  }, [identities.data, userId]);

  const link = useMutation({
    mutationFn: (id: OAuthProviderId) => linkProvider(id),
    onError: (e: Error) => toast.error(e.message ?? "Unable to start provider flow"),
  });

  const unlink = useMutation({
    mutationFn: unlinkProvider,
    onSuccess: () => {
      toast.success("Provider disconnected");
      qc.invalidateQueries({ queryKey: ["auth-identities"] });
      qc.invalidateQueries({ queryKey: ["connected-accounts", userId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Unable to disconnect"),
  });

  const connectedByProvider = new Map(
    (identities.data ?? []).map((i) => [i.provider, i]),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-medium">Sign-in providers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link multiple providers to sign in with any of them. You can't disconnect the last
          provider on your account.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {OAUTH_PROVIDERS.map((p) => {
          const linked = connectedByProvider.get(p.id);
          const mirrorRow = mirror.data?.find((m) => m.provider === p.id);
          return (
            <div key={p.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: p.brandColor }}
                aria-hidden
              >
                {p.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.name}</p>
                  {linked ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Connected
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {linked
                    ? `Since ${fmtDate(linked.created_at)} · Last used ${fmtDate(
                        mirrorRow?.last_used_at ?? linked.last_sign_in_at,
                      )}`
                    : p.description}
                </p>
              </div>
              {linked ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unlink.isPending || (identities.data?.length ?? 0) <= 1}
                  onClick={() => unlink.mutate(linked.identity_id)}
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={link.isPending}
                  onClick={() => link.mutate(p.id)}
                >
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Sessions & devices ---------- */

function SessionsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const sessions = useQuery({
    queryKey: ["user-sessions", userId],
    queryFn: () => fetchSessions(userId),
  });
  const devices = useQuery({
    queryKey: ["user-devices", userId],
    queryFn: () => fetchDevices(userId),
  });

  const revoke = useMutation({
    mutationFn: terminateSession,
    onSuccess: () => {
      toast.success("Session terminated");
      qc.invalidateQueries({ queryKey: ["user-sessions", userId] });
    },
  });
  const revokeAll = useMutation({
    mutationFn: () => terminateAllOtherSessions(userId),
    onSuccess: () => {
      toast.success("Signed out of all other sessions");
      qc.invalidateQueries({ queryKey: ["user-sessions", userId] });
    },
  });
  const trust = useMutation({
    mutationFn: (v: { id: string; trusted: boolean }) => updateDevice(v.id, { trusted: v.trusted }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-devices", userId] }),
  });
  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) => updateDevice(v.id, { name: v.name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-devices", userId] }),
  });
  const remove = useMutation({
    mutationFn: removeDevice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-devices", userId] }),
  });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Active sessions</h2>
            <p className="text-sm text-muted-foreground">
              Devices currently signed in to your account.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => revokeAll.mutate()}
            disabled={revokeAll.isPending}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign out other sessions
          </Button>
        </div>
        <div className="rounded-lg border bg-card">
          {(sessions.data?.length ?? 0) === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No tracked sessions. Sessions are recorded as you sign in from new devices.
            </p>
          ) : (
            <ul className="divide-y">
              {sessions.data!.map((s) => (
                <li key={s.id} className="flex items-center gap-4 p-4">
                  <MonitorSmartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {(s.user_agent ?? "Unknown device").slice(0, 80)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      IP {s.ip_address ?? "—"} · Last active {fmtDate(s.last_active_at)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revoke.mutate(s.id)}>
                    Terminate
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-medium">Trusted devices</h2>
          <p className="text-sm text-muted-foreground">
            Mark devices you use regularly. Trusted devices may skip additional verification.
          </p>
        </div>
        <div className="rounded-lg border bg-card">
          {(devices.data?.length ?? 0) === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No devices recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {devices.data!.map((d) => (
                <li key={d.id} className="flex items-center gap-4 p-4">
                  <MonitorSmartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        defaultValue={d.name ?? "Untitled device"}
                        className="border-b border-transparent bg-transparent text-sm font-medium outline-none hover:border-border focus:border-primary"
                        onBlur={(e) => {
                          if (e.currentTarget.value !== d.name)
                            rename.mutate({ id: d.id, name: e.currentTarget.value });
                        }}
                      />
                      {d.trusted && (
                        <Badge variant="secondary" className="text-[10px]">
                          Trusted
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {d.browser ?? "Browser"} · {d.os ?? "OS"} · Last seen{" "}
                      {fmtDate(d.last_seen_at)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => trust.mutate({ id: d.id, trusted: !d.trusted })}
                    aria-label={d.trusted ? "Un-trust device" : "Trust device"}
                  >
                    {d.trusted ? (
                      <StarOff className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove.mutate(d.id)}
                    aria-label="Remove device"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- Login history ---------- */

function LoginHistoryTab({ userId }: { userId: string }) {
  const history = useQuery({
    queryKey: ["login-history", userId],
    queryFn: () => fetchLoginHistory(userId, 100),
  });

  return (
    <div className="rounded-lg border bg-card">
      {(history.data?.length ?? 0) === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No login events yet. Recent sign-in attempts will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Device</th>
                <th className="p-3">Browser / OS</th>
                <th className="p-3">IP</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.data!.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">{fmtDate(r.created_at)}</td>
                  <td className="p-3">{providerLabel(r.provider)}</td>
                  <td className="p-3">{r.device_type ?? "—"}</td>
                  <td className="p-3">
                    {r.browser ?? "—"} · {r.os ?? "—"}
                  </td>
                  <td className="p-3">{r.ip_address ?? "—"}</td>
                  <td className="p-3">
                    {r.success ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" /> Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <X className="h-3 w-3" /> Failed
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Connected apps ---------- */

function ConnectedAppsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const apps = useQuery({
    queryKey: ["connected-apps", userId],
    queryFn: () => fetchConnectedApps(userId),
  });
  const revoke = useMutation({
    mutationFn: revokeConnectedApp,
    onSuccess: () => {
      toast.success("App access revoked");
      qc.invalidateQueries({ queryKey: ["connected-apps", userId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-medium">Third-party apps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage external apps that have been granted access to your account through the Zupix API.
          Use the Automation Center to issue API keys and webhooks.
        </p>
      </div>
      {(apps.data?.length ?? 0) === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No third-party apps connected yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {apps.data!.map((a) => (
            <li key={a.id} className="flex items-center gap-4 p-4">
              {a.app_icon_url ? (
                <img
                  src={a.app_icon_url}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-sm font-semibold">
                  {a.app_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.app_name}</p>
                <p className="text-xs text-muted-foreground">
                  Connected {fmtDate(a.connected_at)} · Last activity{" "}
                  {fmtDate(a.last_activity_at)}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {a.permissions.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => revoke.mutate(a.id)}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Security ---------- */

function SecurityTab({ userId }: { userId: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [profileRow, setProfileRow] = useState<{
    recovery_email: string | null;
    recovery_phone: string | null;
    mfa_enabled: boolean;
    security_alerts_enabled: boolean;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("recovery_email, recovery_phone, mfa_enabled, security_alerts_enabled")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfileRow(data);
      });
  }, [userId]);

  async function save() {
    if (!profileRow) return;
    try {
      await updateSecuritySettings(userId, profileRow);
      toast.success("Security settings saved");
    } catch (e) {
      toast.error((e as Error).message ?? "Unable to save");
    }
  }

  async function doChangePassword() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== confirm) return toast.error("Passwords do not match");
    try {
      await changePassword(pw);
      toast.success("Password updated");
      setPw("");
      setConfirm("");
    } catch (e) {
      toast.error((e as Error).message ?? "Unable to update password");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-medium">Change password</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="pw">New password</Label>
            <Input
              id="pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div>
          <Button onClick={doChangePassword} disabled={!pw || !confirm}>
            Update password
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="font-medium">Recovery & alerts</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="rec-email">Recovery email</Label>
            <Input
              id="rec-email"
              type="email"
              value={profileRow?.recovery_email ?? ""}
              onChange={(e) =>
                setProfileRow((p) => (p ? { ...p, recovery_email: e.target.value } : p))
              }
            />
          </div>
          <div>
            <Label htmlFor="rec-phone">Recovery phone</Label>
            <Input
              id="rec-phone"
              value={profileRow?.recovery_phone ?? ""}
              onChange={(e) =>
                setProfileRow((p) => (p ? { ...p, recovery_phone: e.target.value } : p))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Security alerts</p>
            <p className="text-xs text-muted-foreground">
              Get notified about new sign-ins and unusual activity.
            </p>
          </div>
          <Switch
            checked={!!profileRow?.security_alerts_enabled}
            onCheckedChange={(v) =>
              setProfileRow((p) => (p ? { ...p, security_alerts_enabled: v } : p))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Two-factor authentication (MFA)</p>
            <p className="text-xs text-muted-foreground">
              Foundation only — enrolment UI ships in a later phase.
            </p>
          </div>
          <Switch
            checked={!!profileRow?.mfa_enabled}
            onCheckedChange={(v) =>
              setProfileRow((p) => (p ? { ...p, mfa_enabled: v } : p))
            }
          />
        </div>
        <div>
          <Button onClick={save} disabled={!profileRow}>
            Save security settings
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Enterprise SSO ---------- */

function EnterpriseTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-medium">Enterprise Identity — foundation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Zupix is ready to support enterprise identity. The following capabilities are
              scaffolded and will activate in a later phase.
            </p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          {[
            "SAML 2.0 SSO",
            "OpenID Connect (OIDC)",
            "SCIM 2.0 user provisioning",
            "Role mapping (IdP → workspace role)",
            "Domain allow-listing",
            "Team-based authentication policies",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-md border p-3">
              <Check className="h-4 w-4 text-primary" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
