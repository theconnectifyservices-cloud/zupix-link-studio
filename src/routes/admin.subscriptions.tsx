import { createFileRoute } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CreditCard, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const mockSubs = [
    { id: 1, user: "Rajesh Kumar", email: "rajesh@example.com", plan: "Tejas", status: "active", expires: "2026-09-15", amount: "₹499" },
    { id: 2, user: "Priya Sharma", email: "priya@example.com", plan: "Shikhar", status: "active", expires: "2027-01-20", amount: "₹4599" },
    { id: 3, user: "Amit Patel", email: "amit@example.com", plan: "Udaan", status: "trialing", expires: "2026-08-10", amount: "₹0" },
    { id: 4, user: "Sneha Reddy", email: "sneha@example.com", plan: "Tejas", status: "past_due", expires: "2026-08-01", amount: "₹499" },
  ];

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
          <Input placeholder="Search subscriptions..." className="pl-9" />
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
            {mockSubs.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{sub.user}</div>
                    <div className="text-xs text-muted-foreground">{sub.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{sub.plan}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sub.status === 'active' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : sub.status === 'trialing' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm capitalize">{sub.status.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>{sub.amount}</TableCell>
                <TableCell className="text-sm">{new Date(sub.expires).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Manage</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
