/** Webhook events & recent payments viewer for admins. */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listWebhookEvents, listRecentPaymentsAdmin } from "../../logs.functions";
import type { PaymentProvider } from "../../types";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  created: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
  refunded: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  manual_review: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  cancelled: "bg-muted text-muted-foreground",
};

export function WebhookLogsPanel() {
  const listFn = useServerFn(listWebhookEvents);
  const payFn = useServerFn(listRecentPaymentsAdmin);
  const [provider, setProvider] = useState<PaymentProvider | "all">("all");

  const wh = useQuery({
    queryKey: ["admin-webhook-events", provider],
    queryFn: () => listFn({ data: { provider: provider === "all" ? null : provider, limit: 100 } }),
  });
  const pay = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: () => payFn({ data: { limit: 100 } }),
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent payments
            </h3>
            <p className="text-sm text-muted-foreground">Live payment order log across all workspaces.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => pay.refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Gateway</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Order</th>
                    <th className="text-left p-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pay.isLoading ? (
                    <tr><td colSpan={6} className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>
                  ) : (pay.data ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No payments yet.</td></tr>
                  ) : (pay.data ?? []).map((r: any) => {
                    const meta = r.meta ?? {};
                    const kind = meta.manual_grant ? "Manual grant" : meta.offline ? `Offline · ${meta.mode}` : r.provider;
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2 capitalize">{r.provider}</td>
                        <td className="p-2">₹{(r.amount_paise / 100).toFixed(2)} {r.currency}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={STATUS_TONE[r.status] ?? ""}>{r.status}</Badge>
                        </td>
                        <td className="p-2 font-mono">{String(r.id).slice(0, 8)}</td>
                        <td className="p-2 text-muted-foreground">{kind}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold">Webhook events</h3>
            <p className="text-sm text-muted-foreground">Provider callbacks with signature validation status.</p>
          </div>
          <div className="flex gap-2">
            <Select value={provider} onValueChange={(v) => setProvider(v as PaymentProvider | "all")}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="payu">PayU</SelectItem>
                <SelectItem value="cashfree">Cashfree</SelectItem>
                <SelectItem value="manual_upi">Manual UPI</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => wh.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Provider</th>
                    <th className="text-left p-2">Event</th>
                    <th className="text-left p-2">Event ID</th>
                    <th className="text-left p-2">Order</th>
                    <th className="text-left p-2">Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {wh.isLoading ? (
                    <tr><td colSpan={6} className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>
                  ) : (wh.data ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No webhook events yet.</td></tr>
                  ) : (wh.data ?? []).map((e: any) => (
                    <tr key={e.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="p-2 capitalize">{e.provider}</td>
                      <td className="p-2">{e.event_type ?? "—"}</td>
                      <td className="p-2 font-mono">{String(e.event_id).slice(0, 20)}</td>
                      <td className="p-2 font-mono">{e.order_id ? String(e.order_id).slice(0, 8) : "—"}</td>
                      <td className="p-2">
                        {e.processed_at ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">verified</Badge>
                        ) : (
                          <Badge variant="outline">received</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
