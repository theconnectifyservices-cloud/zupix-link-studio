import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-center";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Filter, MoreHorizontal, UserCheck, UserX, Shield, LogIn, ExternalLink 
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChangePlanModal } from "@/features/admin/components/change-plan-modal";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const { data, isLoading, error } = useAdminUsers({ query });

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
        <h2 className="text-red-600 dark:text-red-400 font-semibold text-lg">Failed to fetch users</h2>
        <p className="text-red-500 dark:text-red-400/70 mt-1">{(error as any).message || "An unexpected error occurred"}</p>
        <Button 
          variant="outline" 
          className="mt-4 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
          onClick={() => window.location.reload()}
        >
          Retry Connection
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform users, their plans, and account status.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search name or email..." 
               className="pl-9 w-full sm:w-[300px]"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
           </div>
           <Button variant="outline" size="icon">
             <Filter className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1,2,3,4,5].map(i => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : data?.data?.map((user: any) => (
              <TableRow key={user.id} className="hover:bg-muted/5 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {user.display_name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{user.display_name || "Unnamed User"}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {user.subscription_tier || "Udaan"}
                  </Badge>
                </TableCell>
                <TableCell>
                 <Badge className={user.subscription_status === 'suspended' ? 'bg-red-500' : 'bg-green-500'}>
                    {user.subscription_status || 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div>{user.bio_pages?.[0]?.count || 0} Bio Pages</div>
                    <div>{Math.round((user.storage_usage || 0) / 1024 / 1024)} MB Used</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => {
                        setSelectedUser(user);
                        setIsPlanModalOpen(true);
                      }}>
                        <Shield className="h-4 w-4 mr-2" /> Change Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <LogIn className="h-4 w-4 mr-2" /> Login as User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === 'suspended' ? (
                        <DropdownMenuItem className="text-green-600">
                          <UserCheck className="h-4 w-4 mr-2" /> Activate Account
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-red-600">
                          <UserX className="h-4 w-4 mr-2" /> Suspend Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <ChangePlanModal 
          user={selectedUser}
          isOpen={isPlanModalOpen}
          onClose={() => {
            setIsPlanModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
