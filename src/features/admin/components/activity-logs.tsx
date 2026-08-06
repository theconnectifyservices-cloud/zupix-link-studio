import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useActivityLogs } from "../hooks/use-monitoring";
import { format } from "date-fns";
import { History } from "lucide-react";

export function ActivityLogsViewer() {
  const [filters, setFilters] = useState({ limit: 10, offset: 0 });
  const { data, isLoading } = useActivityLogs(filters);

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          System Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Device/IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading activity...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No activity recorded</TableCell></TableRow>
              ) : data?.data.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{format(new Date(log.created_at), "MMM d, HH:mm:ss")}</TableCell>
                  <TableCell className="text-xs font-medium">{log.user_id?.substring(0, 8) || "System"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.target_type}: {log.target_id?.substring(0, 8)}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {log.user_agent ? "Web" : "API"} / {log.ip_address || "Internal"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
