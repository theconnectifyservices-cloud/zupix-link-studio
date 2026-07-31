import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BadgeCheck, Copy, KeyRound, LogOut, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useSession } from "@/features/auth/hooks/use-session";
import { signOut } from "@/features/auth/api";
import { fetchMyLicense, redeemLicense } from "../api";
import { PLAN_LABELS, STATUS_LABELS, licenseErrorMessage } from "../types";

export function MyLicense() {
  const session = useSession();
  const qc = useQueryClient();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const [key, setKey] = useState("");

  const { data: license, isLoading } = useQuery({
    queryKey: ["my-license", userId],
    queryFn: () => fetchMyLicense(userId!),
    enabled: !!userId,
  });

  const activate = useMutation({
    mutationFn: async () => {
      const res = await redeemLicense(key);
      if (!res.ok) throw new Error(licenseErrorMessage(res.reason, res.maxDevices));
      return res;
    },
    onSuccess: () => {
      setKey("");
      qc.invalidateQueries({ queryKey: ["my-license"] });
      toast.success("License activated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BadgeCheck className="h-5 w-5 text-primary" /> My License
              </CardTitle>
              <CardDescription>Your ZUPIX Link Studio activation details.</CardDescription>
            </div>
            {license && (
              <Badge
                variant="secondary"
                className={
                  license.status === "active"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }
              >
                {STATUS_LABELS[license.status]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {license ? (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <code className="font-mono text-sm tracking-wider">{license.license_key}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => {
                    navigator.clipboard?.writeText(license.license_key);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Current plan" value={PLAN_LABELS[license.plan]} />
                <Detail label="Status" value={STATUS_LABELS[license.status]} />
                <Detail
                  label="Activated on"
                  value={
                    license.activated_at
                      ? new Date(license.activated_at).toLocaleDateString()
                      : "Not activated"
                  }
                />
                <Detail
                  label="Expires on"
                  value={license.expires_at ? new Date(license.expires_at).toLocaleDateString() : "Never"}
                />
                <Detail
                  label="Device limit"
                  value={license.max_devices < 0 ? "Unlimited" : `${license.max_devices} device(s)`}
                />
                <Detail
                  label="Last login"
                  value={
                    license.last_login_at ? new Date(license.last_login_at).toLocaleString() : "—"
                  }
                />
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/app/my-subscription">
                    <RefreshCw className="mr-2 h-4 w-4" /> Renew
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/app/settings/password">Change password</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/auth";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No licence is linked to this account yet. Enter your licence key to activate this
                device.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="ZPX-XXXX-XXXX-XXXX"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button onClick={() => activate.mutate()} disabled={!key.trim() || activate.isPending}>
                  {activate.isPending ? "Activating…" : "Activate"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
