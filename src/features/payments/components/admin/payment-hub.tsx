/**
 * Enterprise Payment Hub — tabbed super-admin shell.
 * Overview · Gateways · Payment Proofs · Manual Grant · Offline · Logs
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CreditCard, ShieldCheck, Activity, ReceiptText, UserPlus, Wallet, Landmark, ScrollText, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GatewayManager } from "./gateway-manager";
import { ManualGrantDialog } from "./manual-grant-dialog";
import { OfflinePaymentDialog } from "./offline-payment-dialog";
import { ProofApprovalPanel } from "./proof-approval-panel";
import { WebhookLogsPanel } from "./webhook-logs-panel";
import { listGatewaysAdmin } from "../../admin.functions";
import { listPendingUpiSubmissions } from "../../upi.functions";
import { listRecentPaymentsAdmin } from "../../logs.functions";

export function PaymentHub() {
  const listGw = useServerFn(listGatewaysAdmin);
  const listPending = useServerFn(listPendingUpiSubmissions);
  const listPay = useServerFn(listRecentPaymentsAdmin);
  const [grantOpen, setGrantOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);

  const gwQ = useQuery({ queryKey: ["admin-gateways", null], queryFn: () => listGw({ data: { workspaceId: null } }) });
  const pendQ = useQuery({ queryKey: ["admin-upi-pending"], queryFn: () => listPending({ data: { workspaceId: null } }) });
  const payQ = useQuery({ queryKey: ["admin-recent-payments"], queryFn: () => listPay({ data: { limit: 100 } }) });

  const gateways = gwQ.data ?? [];
  const connected = gateways.filter((g) => g.enabled && g.has_credentials).length;
  const healthy = gateways.filter((g) => g.health_status === "healthy").length;
  const pending = (pendQ.data ?? []).length;
  const paidToday = (payQ.data ?? []).filter((p: any) =>
    p.status === "paid" && new Date(p.created_at).toDateString() === new Date().toDateString()
  ).reduce((s: number, p: any) => s + Number(p.amount_paise ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Payment Gateway Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-gateway processing, manual subscription assignment, offline payments, and audit-grade logs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOfflineOpen(true)}>
            <ReceiptText className="h-4 w-4 mr-2" /> Record offline payment
          </Button>
          <Button onClick={() => setGrantOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Assign subscription
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard icon={<CreditCard className="h-4 w-4" />} label="Connected gateways" value={`${connected} / 4`} tone="primary" />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Healthy" value={String(healthy)} tone="emerald" />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Pending proofs" value={String(pending)} tone={pending ? "amber" : "muted"} />
        <StatCard icon={<Landmark className="h-4 w-4" />} label="Collected today" value={`₹${(paidToday / 100).toFixed(0)}`} tone="primary" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="gateways"><CreditCard className="h-4 w-4 mr-1" /> Gateways</TabsTrigger>
          <TabsTrigger value="proofs">
            <ReceiptText className="h-4 w-4 mr-1" /> Payment Proofs
            {pending ? <Badge className="ml-2 h-4 px-1.5 text-[10px]">{pending}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="logs"><ScrollText className="h-4 w-4 mr-1" /> Logs & History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewPanel gateways={gateways} pending={pending} payments={payQ.data ?? []} />
        </TabsContent>
        <TabsContent value="gateways" className="mt-4">
          <GatewayManager workspaceId={null} />
        </TabsContent>
        <TabsContent value="proofs" className="mt-4">
          <ProofApprovalPanel />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <WebhookLogsPanel />
        </TabsContent>
      </Tabs>

      <ManualGrantDialog open={grantOpen} onOpenChange={setGrantOpen} />
      <OfflinePaymentDialog open={offlineOpen} onOpenChange={setOfflineOpen} />
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "emerald" | "amber" | "muted" }) {
  const toneCls = {
    primary: "text-primary",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 text-xs ${toneCls}`}>{icon}{label}</div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

function OverviewPanel({ gateways, pending, payments }: { gateways: any[]; pending: number; payments: any[] }) {
  const last = payments[0];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Gateway status</h3>
          <div className="space-y-2">
            {["razorpay", "payu", "cashfree", "manual_upi"].map((p) => {
              const g = gateways.find((x) => x.provider === p);
              const status = g?.health_status ?? "unknown";
              const tone = status === "healthy" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                status === "degraded" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                status === "down" ? "bg-red-500/10 text-red-600 border-red-500/30" :
                "bg-muted text-muted-foreground";
              return (
                <div key={p} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                  <span className="capitalize font-medium">{p.replace("_", " ")}</span>
                  <div className="flex items-center gap-2">
                    {g?.enabled ? <Badge>Enabled</Badge> : <Badge variant="secondary">Off</Badge>}
                    {g ? <Badge variant="outline">{g.mode}</Badge> : null}
                    <Badge variant="outline" className={tone}>{status}</Badge>
                    <span className="text-xs text-muted-foreground w-32 text-right">
                      {g?.health_checked_at ? `Last: ${new Date(g.health_checked_at).toLocaleTimeString()}` : "Not tested"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Quick pulse</h3>
          <div className="text-sm space-y-2 text-muted-foreground">
            <div><span className="font-medium text-foreground">{pending}</span> customer proof(s) awaiting review</div>
            {last ? (
              <div>
                Last payment: <span className="font-medium text-foreground">₹{(last.amount_paise / 100).toFixed(2)}</span>
                <br />
                <span className="text-xs">{last.provider} · {new Date(last.created_at).toLocaleString()}</span>
              </div>
            ) : (
              <div>No payments recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
