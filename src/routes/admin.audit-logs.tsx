import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuditLogs } from "@/features/admin/hooks/use-monitoring";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, User, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AdminAuditLogs,
});

function AdminAuditLogs() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useAuditLogs({ query });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Detailed history of all administrative actions and system events.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search logs by action or actor..." 
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : data?.data?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {log.actor_id ? <User className="h-3 w-3" /> : <Terminal className="h-3 w-3" />}
                    <span className="text-sm font-medium">{log.actor_id || 'System'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {log.entity_type}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.ip_address || "Internal"}</TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
