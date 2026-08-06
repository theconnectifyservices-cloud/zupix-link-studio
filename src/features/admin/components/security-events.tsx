import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSecurityEvents } from "../hooks/use-monitoring";
import { format } from "date-fns";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function SecurityEventsViewer() {
  const [filters, setFilters] = useState({ limit: 10, offset: 0, is_suspicious: undefined });
  const { data, isLoading } = useSecurityEvents(filters);

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Security Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading events...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No security events found</TableCell></TableRow>
              ) : data?.data.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs">{format(new Date(event.created_at), "MMM d, HH:mm:ss")}</TableCell>
                  <TableCell className="font-medium text-xs">{event.event_type}</TableCell>
                  <TableCell className="text-xs font-mono">{event.ip_address || "N/A"}</TableCell>
                  <TableCell>
                    {event.is_suspicious ? (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" /> Suspicious
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-green-500 border-green-500/20 bg-green-500/5">
                        <ShieldCheck className="h-3 w-3" /> Normal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {JSON.stringify(event.metadata)}
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
