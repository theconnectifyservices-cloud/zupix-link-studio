import { createFileRoute } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, User, Shield, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AdminAuditLogs,
});

function AdminAuditLogs() {
  const mockLogs = [
    { id: 1, user: "admin@zupix.site", action: "update_plan", target: "user:123", time: "2026-08-06 14:20:05", ip: "192.168.1.1" },
    { id: 2, user: "system", action: "generate_license", target: "batch:45", time: "2026-08-06 14:15:22", ip: "127.0.0.1" },
    { id: 3, user: "moderator@zupix.site", action: "suspend_user", target: "user:99", time: "2026-08-06 13:50:11", ip: "192.168.1.5" },
    { id: 4, user: "admin@zupix.site", action: "change_settings", target: "system:config", time: "2026-08-06 12:30:00", ip: "192.168.1.1" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Detailed history of all administrative actions and system events.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs by action or user..." className="pl-9" />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono text-muted-foreground">{log.time}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {log.user === 'system' ? <Terminal className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span className="text-sm font-medium">{log.user}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{log.target}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
