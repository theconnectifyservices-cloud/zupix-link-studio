import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminLicenses, useGenerateLicenses } from "@/features/admin/hooks/use-admin-center";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, Copy, CheckCircle2, XCircle, Clock, Download, Filter, MoreVertical
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/licenses")({
  component: AdminLicenses,
});

function AdminLicenses() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, error } = useAdminLicenses({ 
    query, 
    status: statusFilter === "all" ? undefined : statusFilter 
  });
  const generateMutation = useGenerateLicenses();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card border rounded-xl">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold">Unable to load licenses</h3>
        <p className="text-muted-foreground mt-1 mb-6">There was an error connecting to the database.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const [isGenOpen, setIsGenOpen] = useState(false);
  const [genCount, setGenCount] = useState("5");
  const [genPlan, setGenPlan] = useState("tejas");
  const [genDuration, setGenDuration] = useState("30");

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        count: parseInt(genCount),
        plan: genPlan,
        duration: parseInt(genDuration)
      });
      setIsGenOpen(false);
    } catch (e) {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("License key copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">License Manager</h1>
          <p className="text-muted-foreground mt-1">Generate, track, and manage product licenses.</p>
        </div>
        <div className="flex items-center gap-2">
           <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
             <DialogTrigger asChild>
               <Button className="bg-indigo-600 hover:bg-indigo-700">
                 <Plus className="h-4 w-4 mr-2" /> Generate Keys
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Generate Bulk Licenses</DialogTitle>
                 <DialogDescription>Create multiple license keys for distribution.</DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                   <Label>Number of Keys</Label>
                   <Input type="number" value={genCount} onChange={e => setGenCount(e.target.value)} />
                 </div>
                 <div className="grid gap-2">
                   <Label>Target Plan</Label>
                   <Select value={genPlan} onValueChange={setGenPlan}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="tejas">Tejas (Legacy)</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="grid gap-2">
                   <Label>Duration (Days)</Label>
                   <Select value={genDuration} onValueChange={setGenDuration}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="7">7 Days</SelectItem>
                       <SelectItem value="30">30 Days</SelectItem>
                       <SelectItem value="365">1 Year</SelectItem>
                       <SelectItem value="9999">Lifetime</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setIsGenOpen(false)}>Cancel</Button>
                 <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                   {generateMutation.isPending ? "Generating..." : "Generate Keys"}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
           <Button variant="outline">
             <Download className="h-4 w-4 mr-2" /> Export CSV
           </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search license key or email..." 
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unused">Unused</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>License Key</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1,2,3,4,5].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No licenses found.
                </TableCell>
              </TableRow>
            ) : data?.data?.map((license: any) => (
              <TableRow key={license.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-mono text-sm">
                    {license.key}
                    <button onClick={() => copyToClipboard(license.key)} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{license.plan_code}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {license.status === 'active' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : license.status === 'expired' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm capitalize">{license.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {license.duration_days >= 9999 ? "Lifetime" : `${license.duration_days} Days`}
                </TableCell>
                <TableCell className="text-sm">
                  {license.assigned_to ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{license.assigned_to.display_name}</span>
                      <span className="text-xs text-muted-foreground">{license.assigned_to.email}</span>
                    </div>
                  ) : (
                    license.bound_email || "Unassigned"
                  )}
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon">
                     <MoreVertical className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
