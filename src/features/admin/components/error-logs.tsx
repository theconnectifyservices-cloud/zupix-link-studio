import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useErrorLogs } from "../hooks/use-monitoring";
import { format } from "date-fns";

export function ErrorLogsViewer() {
  const [filters, setFilters] = useState({ limit: 10, offset: 0, status: "", severity: "" });
  const { data, isLoading } = useErrorLogs(filters);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "error": return <Badge variant="outline" className="text-red-500 border-red-500/20">Error</Badge>;
      case "warning": return <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">Warning</Badge>;
      default: return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Error Logs</CardTitle>
        <div className="flex gap-2">
          <Select value={filters.severity} onValueChange={(val) => setFilters(f => ({ ...f, severity: val }))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Browser/Device</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No errors found</TableCell></TableRow>
              ) : data?.data.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{format(new Date(log.created_at), "MMM d, HH:mm:ss")}</TableCell>
                  <TableCell className="max-w-[300px] truncate font-mono text-xs">{log.message}</TableCell>
                  <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.browser} / {log.device}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'open' ? 'default' : 'secondary'}>
                      {log.status}
                    </Badge>
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
