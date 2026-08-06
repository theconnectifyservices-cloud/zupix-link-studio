import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, Download, RotateCcw, Plus } from "lucide-react";
import { useBackupHistory, useCreateBackup } from "../hooks/use-monitoring";
import { format } from "date-fns";

export function BackupCenter() {
  const { data: backups, isLoading } = useBackupHistory();
  const createBackup = useCreateBackup();

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Backup Center
        </CardTitle>
        <Button 
          onClick={() => createBackup.mutate()} 
          disabled={createBackup.isPending}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Manual Backup
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading history...</TableCell></TableRow>
              ) : backups?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No backups found</TableCell></TableRow>
              ) : backups?.map((backup: any) => (
                <TableRow key={backup.id}>
                  <TableCell className="text-sm">{format(new Date(backup.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                  <TableCell className="text-sm font-medium">{backup.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatBytes(backup.size_bytes)}</TableCell>
                  <TableCell>
                    <Badge variant={backup.status === 'completed' ? 'outline' : 'secondary'} className={backup.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                      {backup.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Restore" className="text-yellow-500 hover:text-yellow-600">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
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
