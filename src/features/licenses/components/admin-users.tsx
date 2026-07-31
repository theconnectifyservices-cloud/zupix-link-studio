import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Mail, Search, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  adminForcePasswordChange,
  adminListUsers,
  adminSendPasswordReset,
  adminSetPassword,
  type AdminUserRow,
} from "../admin.functions";

export function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const listUsers = useServerFn(adminListUsers);
  const setPassword = useServerFn(adminSetPassword);
  const forceChange = useServerFn(adminForcePasswordChange);
  const sendReset = useServerFn(adminSendPasswordReset);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => listUsers({ data: { search } }) as Promise<AdminUserRow[]>,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const tempPassword = useMutation({
    mutationFn: (userId: string) => setPassword({ data: { userId, temporary: true } }),
    onSuccess: (res) => {
      invalidate();
      const pw = (res as { password?: string })?.password;
      if (pw) {
        navigator.clipboard?.writeText(pw);
        toast.success(`Temporary password copied: ${pw}`, { duration: 15000 });
      } else {
        toast.success("Temporary password generated");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const manualReset = useMutation({
    mutationFn: async (user: AdminUserRow) => {
      const pw = window.prompt(
        `Set a new password for ${user.email ?? user.display_name ?? "user"} (min 8 chars)`,
      );
      if (!pw) return null;
      if (pw.length < 8) throw new Error("Password must be at least 8 characters");
      return setPassword({ data: { userId: user.id, password: pw, forceChange: true } });
    },
    onSuccess: (r) => {
      if (r) {
        invalidate();
        toast.success("Password reset. User must change it on next login.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleForce = useMutation({
    mutationFn: (u: AdminUserRow) =>
      forceChange({ data: { userId: u.id, force: !u.force_password_change } }),
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const emailReset = useMutation({
    mutationFn: (u: AdminUserRow) => {
      if (!u.email) throw new Error("This user has no email address");
      return sendReset({
        data: { email: u.email, redirectTo: `${window.location.origin}/auth/reset-password` },
      });
    },
    onSuccess: () => toast.success("Reset email sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Reset passwords, issue temporary credentials and force password changes.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Accounts <span className="text-muted-foreground">({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Loading users…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{u.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email ?? "no email"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{u.phone ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{u.license_key ?? "—"}</TableCell>
                    <TableCell>
                      {u.force_password_change ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        >
                          Must change password
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{u.status ?? "active"}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => emailReset.mutate(u)}>
                          <Mail className="mr-1.5 h-4 w-4" /> Email reset
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => manualReset.mutate(u)}>
                          <KeyRound className="mr-1.5 h-4 w-4" /> Reset password
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => tempPassword.mutate(u.id)}>
                          Temp password
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleForce.mutate(u)}>
                          <ShieldAlert className="mr-1.5 h-4 w-4" />
                          {u.force_password_change ? "Clear force" : "Force change"}
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
    </div>
  );
}
