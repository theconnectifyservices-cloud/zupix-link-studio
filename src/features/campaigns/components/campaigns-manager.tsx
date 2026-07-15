import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Copy, MoreVertical, Pencil, Play, Pause, Archive, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PageMeta } from "@/features/analytics/api";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  CAMPAIGN_STATUS_LABELS,
  deleteCampaign,
  listCampaigns,
  updateCampaignStatus,
  type Campaign,
  type CampaignStatus,
} from "../api";
import { buildTrackingUrl } from "../utm";
import { CampaignDialog } from "./campaign-dialog";

interface Props {
  workspaceId: string;
  pages: PageMeta[];
}

const STATUS_VARIANT: Record<CampaignStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  active: "default",
  paused: "secondary",
  completed: "secondary",
  archived: "outline",
};

export function CampaignsManager({ workspaceId, pages }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const q = useQuery({
    queryKey: ["campaigns.list", workspaceId],
    queryFn: () => listCampaigns(workspaceId),
    staleTime: 60_000,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      updateCampaignStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns.list", workspaceId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      toast.success("Campaign deleted");
      qc.invalidateQueries({ queryKey: ["campaigns.list", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const copyLink = async (c: Campaign) => {
    try {
      const url = buildTrackingUrl(c.target_url, {
        source: c.utm_source,
        medium: c.utm_medium,
        campaign: c.utm_campaign,
        term: c.utm_term ?? undefined,
        content: c.utm_content ?? undefined,
      });
      await navigator.clipboard.writeText(url);
      toast.success("Tracking link copied");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Copy failed");
    }
  };

  const campaigns = q.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Campaigns</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New campaign
        </Button>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Create a campaign to start attributing traffic and conversions."
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create campaign
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Source / Medium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.utm_campaign}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-mono">{c.utm_source}</span>
                      <span className="mx-1 text-muted-foreground">/</span>
                      <span className="font-mono">{c.utm_medium}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status]}>
                        {CAMPAIGN_STATUS_LABELS[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyLink(c)}>
                            <Copy className="mr-2 h-4 w-4" /> Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {c.status !== "active" && (
                            <DropdownMenuItem
                              onClick={() => setStatus.mutate({ id: c.id, status: "active" })}
                            >
                              <Play className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                          )}
                          {c.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => setStatus.mutate({ id: c.id, status: "paused" })}
                            >
                              <Pause className="mr-2 h-4 w-4" /> Pause
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setStatus.mutate({ id: c.id, status: "completed" })}
                          >
                            Mark completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setStatus.mutate({ id: c.id, status: "archived" })}
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete "${c.name}"? This cannot be undone.`))
                                remove.mutate(c.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        pages={pages}
        campaign={editing}
      />
    </Card>
  );
}
