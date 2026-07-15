import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Send,
  Loader2,
  Crown,
  Ban,
  RotateCcw,
  Trash2,
  Building2,
  Briefcase,
  UserCircle2,
  Factory,
  Plus,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  acceptTransfer,
  cancelTransfer,
  createInvitation,
  createTransfer,
  createWorkspace,
  deleteCustomRole,
  listActivity,
  listAudit,
  listInvitations,
  listMyWorkspaces,
  listTransfers,
  removeMember,
  resendInvitation,
  revokeInvitation,
  setRoleOverride,
  suspendMember,
  switchActiveWorkspace,
  updateMemberRole,
  upsertCustomRole,
  type WorkspaceRecord,
  type CustomRoleRecord,
} from "../api";
import { useCustomRoles, useMembers, usePermissions, useRoleOverrides } from "../hooks";
import {
  CUSTOM_ROLE_PRESETS,
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLE_DEFAULTS,
  type WorkspaceRole,
  type WorkspaceType,
} from "../permissions";

interface Props {
  workspace: WorkspaceRecord;
  userId: string;
  onWorkspaceChange?: () => void;
}

const WORKSPACE_TYPE_META: Record<WorkspaceType, { label: string; icon: typeof UserCircle2; description: string }> = {
  personal: { label: "Personal", icon: UserCircle2, description: "Just for you." },
  business: { label: "Business", icon: Briefcase, description: "For small teams and companies." },
  agency: { label: "Agency", icon: Building2, description: "Manage many clients." },
  enterprise: { label: "Enterprise", icon: Factory, description: "Large organizations with SSO and audit." },
};

export function WorkspaceManager({ workspace, userId, onWorkspaceChange }: Props) {
  const qc = useQueryClient();
  const perms = usePermissions(workspace.id);
  const canManageUsers = perms.has("users.manage");
  const isOwner = perms.role === "owner";

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["ws-members", workspace.id] });
    qc.invalidateQueries({ queryKey: ["ws-invitations", workspace.id] });
    qc.invalidateQueries({ queryKey: ["ws-transfers", workspace.id] });
    qc.invalidateQueries({ queryKey: ["ws-activity", workspace.id] });
    qc.invalidateQueries({ queryKey: ["ws-audit", workspace.id] });
    qc.invalidateQueries({ queryKey: ["ws-custom-roles", workspace.id] });
    qc.invalidateQueries({ queryKey: ["ws-role-overrides", workspace.id] });
    qc.invalidateQueries({ queryKey: ["workspaces", userId] });
  };

  return (
    <div className="space-y-6">
      <OverviewCard workspace={workspace} userId={userId} onSwitched={onWorkspaceChange} />

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="transfer">Ownership</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersPanel
            workspaceId={workspace.id}
            userId={userId}
            canManage={canManageUsers}
            isOwner={isOwner}
            onChanged={invalidateAll}
          />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsPanel
            workspaceId={workspace.id}
            userId={userId}
            canManage={canManageUsers}
            onChanged={invalidateAll}
          />
        </TabsContent>
        <TabsContent value="roles">
          <RolesPanel workspaceId={workspace.id} canManage={canManageUsers} onChanged={invalidateAll} />
        </TabsContent>
        <TabsContent value="transfer">
          <TransferPanel
            workspace={workspace}
            userId={userId}
            isOwner={isOwner}
            onChanged={invalidateAll}
          />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityPanel workspaceId={workspace.id} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditPanel workspaceId={workspace.id} isOwner={isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Overview + switcher ---------- */

function OverviewCard({
  workspace,
  userId,
  onSwitched,
}: {
  workspace: WorkspaceRecord;
  userId: string;
  onSwitched?: () => void;
}) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkspaceType>("business");

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces", userId],
    queryFn: () => listMyWorkspaces(userId),
    staleTime: 30_000,
  });

  const switchMut = useMutation({
    mutationFn: (wsId: string) => switchActiveWorkspace(userId, wsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      qc.invalidateQueries({ queryKey: ["workspaces", userId] });
      toast.success("Switched workspace");
      onSwitched?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createWorkspace({ name, description, workspace_type: type, ownerId: userId }),
    onSuccess: async (ws) => {
      await switchActiveWorkspace(userId, ws.id);
      qc.invalidateQueries({ queryKey: ["workspaces", userId] });
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      setCreating(false);
      setName("");
      setDescription("");
      toast.success("Workspace created");
      onSwitched?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const meta = WORKSPACE_TYPE_META[workspace.workspace_type ?? "personal"];
  const Icon = meta.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="flex items-center gap-2">
              {workspace.name}
              <Badge variant="secondary" className="capitalize">
                {meta.label}
              </Badge>
            </CardTitle>
            <CardDescription>{workspace.description || meta.description}</CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronsUpDown className="h-4 w-4" /> Switch
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => switchMut.mutate(w.id)}
                  className="justify-between"
                >
                  <span className="truncate">{w.name}</span>
                  {w.id === workspace.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" /> New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create workspace</DialogTitle>
                <DialogDescription>
                  Personal, business, agency or enterprise — you can invite people afterwards.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(WORKSPACE_TYPE_META) as WorkspaceType[]).map((t) => {
                    const M = WORKSPACE_TYPE_META[t];
                    const TIcon = M.icon;
                    const active = t === type;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition-colors ${
                          active ? "border-primary bg-primary/5" : "hover:bg-accent/40"
                        }`}
                      >
                        <TIcon className="h-4 w-4" />
                        <span className="font-medium">{M.label}</span>
                        <span className="text-muted-foreground">{M.description}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Marketing" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!name.trim() || createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
    </Card>
  );
}

/* ---------- Members ---------- */

function MembersPanel({
  workspaceId,
  userId,
  canManage,
  isOwner,
  onChanged,
}: {
  workspaceId: string;
  userId: string;
  canManage: boolean;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const { data: members = [], isLoading } = useMembers(workspaceId);
  const { data: customRoles = [] } = useCustomRoles(workspaceId);

  const roleMut = useMutation({
    mutationFn: (v: { memberId: string; role: WorkspaceRole; customKey: string | null }) =>
      updateMemberRole(v.memberId, workspaceId, { role: v.role, custom_role_key: v.customKey }),
    onSuccess: () => {
      toast.success("Role updated");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const suspendMut = useMutation({
    mutationFn: (v: { memberId: string; suspend: boolean }) =>
      suspendMember(v.memberId, workspaceId, v.suspend),
    onSuccess: () => {
      toast.success("Member updated");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => removeMember(id, workspaceId),
    onSuccess: () => {
      toast.success("Member removed");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allRoleOptions: { key: string; label: string; base: WorkspaceRole }[] = [
    { key: "owner", label: "Owner", base: "owner" },
    { key: "admin", label: "Admin", base: "admin" },
    { key: "member", label: "Member", base: "member" },
    ...customRoles.map((r) => ({ key: r.key, label: r.name, base: r.base_role })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Team members
        </CardTitle>
        <CardDescription>
          {members.length} member{members.length === 1 ? "" : "s"} in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const selfRow = m.user_id === userId;
                  const currentRoleKey = m.custom_role_key ?? m.role;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {(m.profile?.display_name ?? m.profile?.email ?? "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {m.profile?.display_name ?? m.profile?.email ?? m.user_id}
                              {selfRow && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                              {m.role === "owner" && (
                                <Crown className="ml-1 inline h-3 w-3 text-amber-500" aria-label="Owner" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.profile?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canManage && !selfRow && m.role !== "owner" ? (
                          <Select
                            value={currentRoleKey}
                            onValueChange={(v) => {
                              const opt = allRoleOptions.find((o) => o.key === v);
                              if (!opt) return;
                              const isBuiltin = ["owner", "admin", "member"].includes(v);
                              roleMut.mutate({
                                memberId: m.id,
                                role: opt.base,
                                customKey: isBuiltin ? null : v,
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoleOptions
                                .filter((o) => o.key !== "owner")
                                .map((o) => (
                                  <SelectItem key={o.key} value={o.key}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="capitalize">
                            {currentRoleKey}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.status === "active" ? "secondary" : "destructive"}>
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && !selfRow && m.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  suspendMut.mutate({
                                    memberId: m.id,
                                    suspend: m.status !== "suspended",
                                  })
                                }
                              >
                                {m.status === "suspended" ? (
                                  <>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reinstate
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" /> Suspend
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm(`Remove ${m.profile?.email ?? "this member"}?`)) {
                                    removeMut.mutate(m.id);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {isOwner && selfRow && (
                          <span className="text-xs text-muted-foreground">Owner</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Invitations ---------- */

function InvitationsPanel({
  workspaceId,
  userId,
  canManage,
  onChanged,
}: {
  workspaceId: string;
  userId: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");
  const { data: customRoles = [] } = useCustomRoles(workspaceId);

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["ws-invitations", workspaceId],
    queryFn: () => listInvitations(workspaceId),
    staleTime: 15_000,
  });

  const inviteMut = useMutation({
    mutationFn: () =>
      createInvitation({ workspaceId, email, role, invitedBy: userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-invitations", workspaceId] });
      onChanged();
      setEmail("");
      setOpen(false);
      toast.success("Invitation created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resendMut = useMutation({
    mutationFn: (id: string) => resendInvitation(id, workspaceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-invitations", workspaceId] });
      toast.success("Invitation resent");
    },
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeInvitation(id, workspaceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-invitations", workspaceId] });
      toast.success("Invitation revoked");
    },
  });

  const roleOptions = [
    { key: "admin", label: "Admin" },
    { key: "member", label: "Member" },
    ...customRoles.map((r) => ({ key: r.key, label: r.name })),
  ];

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Invitations
          </CardTitle>
          <CardDescription>Pending, accepted and expired invites for this workspace.</CardDescription>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" /> Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a member</DialogTitle>
                <DialogDescription>They'll appear here as a pending invite until accepted.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r.key} value={r.key}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!email || inviteMut.isPending}
                  onClick={() => inviteMut.mutate()}
                >
                  {inviteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : invites.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No invitations yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => {
                const expired =
                  inv.status === "pending" && new Date(inv.expires_at).getTime() < Date.now();
                const displayStatus = expired ? "expired" : inv.status;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          displayStatus === "accepted"
                            ? "secondary"
                            : displayStatus === "pending"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {displayStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      {inv.status === "pending" && !expired && (
                        <Button size="sm" variant="ghost" onClick={() => copyLink(inv.token)}>
                          Copy link
                        </Button>
                      )}
                      {canManage && (inv.status === "pending" || expired) && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => resendMut.mutate(inv.id)}>
                            Resend
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => revokeMut.mutate(inv.id)}
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Roles & permission matrix ---------- */

function RolesPanel({
  workspaceId,
  canManage,
  onChanged,
}: {
  workspaceId: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data: customRoles = [] } = useCustomRoles(workspaceId);
  const { data: overrides = [] } = useRoleOverrides(workspaceId);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [presetOpen, setPresetOpen] = useState(false);

  const allRoles: { key: string; label: string; custom: CustomRoleRecord | null; base: WorkspaceRole }[] = [
    { key: "owner", label: "Owner", custom: null, base: "owner" },
    { key: "admin", label: "Admin", custom: null, base: "admin" },
    { key: "member", label: "Member", custom: null, base: "member" },
    ...customRoles.map((r) => ({ key: r.key, label: r.name, custom: r, base: r.base_role })),
  ];

  const activeRole = allRoles.find((r) => r.key === selectedRole)!;
  const basePermissions = new Set<string>(
    activeRole.custom?.permissions?.length
      ? activeRole.custom.permissions
      : ROLE_DEFAULTS[activeRole.base] ?? [],
  );
  const effective = new Set<string>(basePermissions);
  for (const o of overrides) {
    if (o.role_key !== selectedRole) continue;
    if (o.granted) effective.add(o.permission_key);
    else effective.delete(o.permission_key);
  }

  const overrideMut = useMutation({
    mutationFn: (v: { permission_key: string; granted: boolean }) =>
      setRoleOverride({
        workspaceId,
        roleKey: selectedRole,
        permissionKey: v.permission_key,
        granted: v.granted,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-role-overrides", workspaceId] });
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRoleMut = useMutation({
    mutationFn: () => deleteCustomRole(workspaceId, selectedRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-custom-roles", workspaceId] });
      onChanged();
      setSelectedRole("member");
      toast.success("Role deleted");
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {allRoles.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedRole(r.key)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                selectedRole === r.key ? "bg-accent font-medium" : "hover:bg-accent/50"
              }`}
            >
              <span>{r.label}</span>
              {r.custom && (
                <Badge variant="outline" className="text-[10px]">
                  Custom
                </Badge>
              )}
            </button>
          ))}
          {canManage && (
            <>
              <Separator className="my-2" />
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setPresetOpen(true)}
              >
                <Plus className="h-4 w-4" /> New custom role
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" /> {activeRole.label} permissions
            </CardTitle>
            <CardDescription>
              {activeRole.custom
                ? "Custom role — toggle any permission."
                : selectedRole === "owner"
                  ? "Owners always have every permission."
                  : "Built-in role. Overrides applied per workspace."}
            </CardDescription>
          </div>
          {canManage && activeRole.custom && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete role
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this custom role?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Members assigned this role will fall back to their base role.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteRoleMut.mutate()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {PERMISSION_CATEGORIES.map((cat) => (
            <div key={cat}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {cat}
              </h4>
              <div className="space-y-2">
                {PERMISSIONS.filter((p) => p.category === cat).map((p) => {
                  const isOn = effective.has(p.key);
                  const isOwnerRow = selectedRole === "owner";
                  return (
                    <div
                      key={p.key}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-medium">{p.key}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                      <Switch
                        checked={isOwnerRow ? true : isOn}
                        disabled={!canManage || isOwnerRow || overrideMut.isPending}
                        onCheckedChange={(v) =>
                          overrideMut.mutate({ permission_key: p.key, granted: v })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CustomRoleDialog
        open={presetOpen}
        onOpenChange={setPresetOpen}
        workspaceId={workspaceId}
        onCreated={(key) => {
          qc.invalidateQueries({ queryKey: ["ws-custom-roles", workspaceId] });
          onChanged();
          setSelectedRole(key);
        }}
      />
    </div>
  );
}

function CustomRoleDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  onCreated: (key: string) => void;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [preset, setPreset] = useState(CUSTOM_ROLE_PRESETS[0].key);

  const mut = useMutation({
    mutationFn: async () => {
      const p = CUSTOM_ROLE_PRESETS.find((x) => x.key === preset)!;
      const finalKey = key.trim() || preset;
      await upsertCustomRole({
        workspace_id: workspaceId,
        key: finalKey,
        name: name.trim() || p.name,
        description: p.description,
        base_role: "member",
        permissions: p.permissions,
      });
      return finalKey;
    },
    onSuccess: (k) => {
      toast.success("Custom role created");
      onCreated(k);
      onOpenChange(false);
      setName("");
      setKey("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New custom role</DialogTitle>
          <DialogDescription>Start from a preset — you can fine-tune permissions after creating it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Preset</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOM_ROLE_PRESETS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.name} — {p.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Manager" />
          </div>
          <div className="space-y-2">
            <Label>Key</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value.replace(/[^a-z0-9_]/g, "_").toLowerCase())}
              placeholder="manager"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Ownership transfer ---------- */

function TransferPanel({
  workspace,
  userId,
  isOwner,
  onChanged,
}: {
  workspace: WorkspaceRecord;
  userId: string;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data: members = [] } = useMembers(workspace.id);
  const [target, setTarget] = useState<string>("");

  const { data: transfers = [] } = useQuery({
    queryKey: ["ws-transfers", workspace.id],
    queryFn: () => listTransfers(workspace.id),
    staleTime: 15_000,
  });

  const createMut = useMutation({
    mutationFn: () => createTransfer({ workspaceId: workspace.id, fromUserId: userId, toUserId: target }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-transfers", workspace.id] });
      onChanged();
      toast.success("Transfer initiated. Target user must accept.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => acceptTransfer(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-transfers", workspace.id] });
      qc.invalidateQueries({ queryKey: ["ws-members", workspace.id] });
      onChanged();
      toast.success("Ownership accepted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelTransfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-transfers", workspace.id] });
      toast.success("Transfer canceled");
    },
  });

  const eligibleTargets = members.filter(
    (m) => m.user_id !== userId && m.status === "active" && m.role !== "owner",
  );
  const pending = transfers.find((t) => t.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" /> Ownership transfer
        </CardTitle>
        <CardDescription>
          Only the current owner can start a transfer. The target has 7 days to accept.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner && !pending && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Transfer to</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleTargets.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No eligible members
                    </SelectItem>
                  )}
                  {eligibleTargets.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.display_name ?? m.profile?.email ?? m.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button disabled={!target || createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start transfer
            </Button>
          </div>
        )}

        {transfers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No transfers yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From → To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">
                    {shortId(t.from_user_id)} → {shortId(t.to_user_id)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.status === "pending"
                          ? "outline"
                          : t.status === "accepted"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.expires_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {t.status === "pending" && t.to_user_id === userId && (
                      <Button size="sm" onClick={() => acceptMut.mutate(t.id)}>
                        Accept
                      </Button>
                    )}
                    {t.status === "pending" && t.from_user_id === userId && (
                      <Button size="sm" variant="ghost" onClick={() => cancelMut.mutate(t.id)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Activity + audit ---------- */

function ActivityPanel({ workspaceId }: { workspaceId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["ws-activity", workspaceId],
    queryFn: () => listActivity(workspaceId, 200),
    staleTime: 15_000,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Human-readable actions inside this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="divide-y">
            {data.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.action}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.target_type ? `${a.target_type} · ` : ""}
                    {a.metadata ? JSON.stringify(a.metadata).slice(0, 120) : ""}
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AuditPanel({ workspaceId, isOwner }: { workspaceId: string; isOwner: boolean }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["ws-audit", workspaceId],
    queryFn: () => listAudit(workspaceId, 200),
    enabled: isOwner,
    staleTime: 15_000,
  });
  if (!isOwner) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Only workspace owners can view the audit log.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Immutable record of who did what, when and from where.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No audit records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs font-medium">{a.action}</TableCell>
                    <TableCell className="text-xs">
                      {a.entity_type}
                      {a.entity_id ? ` · ${shortId(a.entity_id)}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.actor_id ? shortId(a.actor_id) : "system"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.ip_address ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function shortId(id: string) {
  return id.slice(0, 8);
}
