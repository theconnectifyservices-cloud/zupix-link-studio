import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminSubscriptions } from "@/features/admin/hooks/use-admin-center";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CreditCard, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useAdminSubscriptions({ query });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage customer plans, billing, and trial periods.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search subscriptions by name or email..." 
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : data?.data?.map((sub: any) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{sub.full_name || "User"}</div>
                    <div className="text-xs text-muted-foreground">{sub.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{sub.subscription_plan || "Udaan"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sub.subscription_status === 'active' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : sub.subscription_status === 'trialing' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm capitalize">{(sub.subscription_status || 'Trialing').replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>₹{sub.last_payment_amount || 0}</TableCell>
                <TableCell className="text-sm">
                  {sub.subscription_expiry ? new Date(sub.subscription_expiry).toLocaleDateString() : "No expiry"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Manage</Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No subscription records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
