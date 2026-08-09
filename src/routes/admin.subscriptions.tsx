import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminSubscriptions } from "@/features/admin/hooks/use-admin-center";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, CreditCard, Clock, CheckCircle2, AlertCircle, Loader2, Filter, MoreHorizontal, Calendar, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPlanPrice } from "@/features/subscription/plans";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [cycle, setCycle] = useState<string>("all");
  
  const { data, isLoading } = useAdminSubscriptions({ 
    query, 
    status: status === "all" ? undefined : status,
    cycle: cycle === "all" ? undefined : cycle
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage customer plans, billing, and trial periods.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or plan..." 
            className="pl-9 w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cycle} onValueChange={setCycle}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cycles</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Renewal/Expiry</TableHead>
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
              <TableRow key={sub.id} className="group">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{sub.display_name}</span>
                    <span className="text-xs text-muted-foreground">{sub.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit font-semibold uppercase text-[10px]">
                      {sub.plan_name}
                    </Badge>
                    <span className="text-[11px] font-medium">
                      {formatPlanPrice(sub.amount_minor, sub.currency)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={sub.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs capitalize">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    {sub.cycle}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : "Never"}
                    </div>
                    {sub.status === 'trialing' && (
                      <span className="text-[10px] text-blue-500 font-medium animate-pulse">
                        Trial Active
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Subscription Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        View Payments
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive cursor-pointer">
                        Cancel Subscription
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string, color: string, icon: any }> = {
    active: { label: "Active", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    trialing: { label: "Trial", color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: Clock },
    past_due: { label: "Past Due", color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: AlertCircle },
    canceled: { label: "Canceled", color: "text-slate-500 bg-slate-500/10 border-slate-500/20", icon: AlertCircle },
    expired: { label: "Expired", color: "text-red-500 bg-red-500/10 border-red-500/20", icon: AlertCircle },
  };

  const config = configs[status] || { label: status, color: "text-muted-foreground bg-muted border-border", icon: AlertCircle };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 w-fit capitalize font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
