import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Inbox, Mail, Phone, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { toast } from "sonner";
import {
  deleteLead,
  downloadCsv,
  listLeads,
  setLeadStatus,
  type Lead,
  type LeadStatus,
} from "../api";

const STATUS_TABS: (LeadStatus | "all")[] = ["all", "new", "read", "replied", "archived"];

const STATUS_VARIANT: Record<LeadStatus, string> = {
  new: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  read: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  replied: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  archived: "bg-muted text-muted-foreground",
};

export function LeadsDashboard({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<LeadStatus | "all">("all");
  const [q, setQ] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["bio-leads", workspaceId],
    queryFn: () => listLeads(workspaceId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["bio-leads", workspaceId] });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => setLeadStatus(id, status),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      toast.success("Lead deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (tab !== "all" && l.status !== tab) return false;
      if (!needle) return true;
      return [l.name, l.email, l.phone, l.company, l.subject, l.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [leads, tab, q]);

  if (isLoading) return <PageLoader label="Loading leads" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={tab === s ? "default" : "outline"}
              onClick={() => setTab(s)}
              className="capitalize"
            >
              {s}
              {s !== "all" && (
                <span className="ml-1.5 opacity-70">
                  {leads.filter((l) => l.status === s).length}
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search leads…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                `leads-${new Date().toISOString().slice(0, 10)}.csv`,
                filtered.map((l) => ({
                  date: l.created_at,
                  form: l.form_name,
                  name: l.name,
                  email: l.email,
                  phone: l.phone,
                  company: l.company,
                  subject: l.subject,
                  message: l.message,
                  status: l.status,
                  extra: l.fields,
                })),
              )
            }
            disabled={filtered.length === 0}
          >
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No leads yet"
          description="Add a Contact Form block to a bio page — submissions land here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onStatus={(status) => statusMut.mutate({ id: lead.id, status })}
              onDelete={() => deleteMut.mutate(lead.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRow({
  lead,
  onStatus,
  onDelete,
}: {
  lead: Lead;
  onStatus: (s: LeadStatus) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const extras = Object.entries(lead.fields ?? {}).filter(
    ([k]) => !["name", "email", "phone", "company", "subject", "message"].includes(k),
  );

  return (
    <Card className="p-3">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => {
          setOpen((v) => !v);
          if (lead.status === "new") onStatus("read");
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{lead.name || "Unnamed"}</span>
            <Badge className={STATUS_VARIANT[lead.status]} variant="secondary">
              {lead.status}
            </Badge>
            {lead.form_name && (
              <span className="text-[11px] text-muted-foreground">{lead.form_name}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {lead.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </span>
            )}
            <span>{new Date(lead.created_at).toLocaleString()}</span>
          </div>
          {lead.message && !open && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{lead.message}</p>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t pt-3 text-xs">
          {lead.subject && (
            <p>
              <span className="font-medium">Subject:</span> {lead.subject}
            </p>
          )}
          {lead.company && (
            <p>
              <span className="font-medium">Company:</span> {lead.company}
            </p>
          )}
          {lead.message && <p className="whitespace-pre-wrap">{lead.message}</p>}
          {extras.length > 0 && (
            <div className="rounded-md bg-muted/50 p-2">
              {extras.map(([k, v]) => (
                <div key={k}>
                  <span className="font-medium">{k}:</span>{" "}
                  {Array.isArray(v) ? v.join(", ") : String(v)}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(["new", "read", "replied", "archived"] as LeadStatus[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={lead.status === s ? "default" : "outline"}
                onClick={() => onStatus(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
