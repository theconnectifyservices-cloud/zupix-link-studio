/**
 * Payment History — workspace-scoped ledger.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPaymentHistory } from "../history.functions";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  failed: "bg-red-500/10 text-red-600 border-red-500/30",
  refunded: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  manual_review: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  created: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function PaymentHistoryTable({ workspaceId }: { workspaceId: string }) {
  const fn = useServerFn(listPaymentHistory);
  const q = useQuery({
    queryKey: ["payment-history", workspaceId],
    queryFn: () => fn({ data: { workspaceId } }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ReceiptText className="h-4 w-4" /> Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            No payments yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize text-sm">{r.provider.replace("_", " ")}</TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: r.currency }).format(r.amount_paise / 100)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_TONE[r.status] ?? ""}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.provider_order_id ?? r.id.slice(0, 8)}
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
