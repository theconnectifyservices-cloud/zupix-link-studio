import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/features/analytics/api";
import {
  CAMPAIGN_STATUS_LABELS,
  upsertCampaign,
  type Campaign,
  type CampaignStatus,
} from "../api";
import { buildTrackingUrl, generateShortCode, validateUtm } from "../utm";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  pages: PageMeta[];
  campaign: Campaign | null;
  initial?: Partial<Campaign> | null;
}

const STATUS_OPTIONS = Object.entries(CAMPAIGN_STATUS_LABELS) as [CampaignStatus, string][];

export function CampaignDialog({
  open,
  onOpenChange,
  workspaceId,
  pages,
  campaign,
  initial,
}: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [pageId, setPageId] = useState<string>("all");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaignUtm, setCampaignUtm] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const src = campaign ?? initial ?? null;
    setName(src?.name ?? "");
    setDescription(src?.description ?? "");
    setStatus((src?.status as CampaignStatus) ?? "draft");
    setPageId(src?.bio_page_id ?? "all");
    setSource(src?.utm_source ?? "");
    setMedium(src?.utm_medium ?? "");
    setCampaignUtm(src?.utm_campaign ?? "");
    setTerm(src?.utm_term ?? "");
    setContent(src?.utm_content ?? "");
    setTargetUrl(src?.target_url ?? "");
    setShortCode(src?.short_code ?? generateShortCode());
    setNotes(src?.notes ?? "");
  }, [open, campaign, initial]);

  const validation = useMemo(
    () =>
      validateUtm(targetUrl, {
        source,
        medium,
        campaign: campaignUtm,
        term,
        content,
      }),
    [targetUrl, source, medium, campaignUtm, term, content],
  );

  const trackingUrl = useMemo(() => {
    if (!validation.ok) return "";
    try {
      return buildTrackingUrl(targetUrl, {
        source,
        medium,
        campaign: campaignUtm,
        term,
        content,
      });
    } catch {
      return "";
    }
  }, [validation.ok, targetUrl, source, medium, campaignUtm, term, content]);

  const save = useMutation({
    mutationFn: () =>
      upsertCampaign({
        id: campaign?.id,
        workspace_id: workspaceId,
        bio_page_id: pageId === "all" ? null : pageId,
        name: name.trim(),
        description: description.trim() || null,
        status,
        utm_source: source.trim(),
        utm_medium: medium.trim(),
        utm_campaign: campaignUtm.trim(),
        utm_term: term.trim() || null,
        utm_content: content.trim() || null,
        target_url: targetUrl.trim(),
        short_code: shortCode.trim() || null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success(campaign ? "Campaign updated" : "Campaign created");
      qc.invalidateQueries({ queryKey: ["campaigns.list", workspaceId] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = name.trim().length >= 2 && validation.ok && !save.isPending;

  const copyLink = async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit campaign" : "New campaign"}</DialogTitle>
          <DialogDescription>
            Attribution links visitors to this campaign when the utm_campaign value matches.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spring Launch"
              maxLength={100}
            />
          </F>
          <F label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Bio page">
            <Select value={pageId} onValueChange={setPageId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pages</SelectItem>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Short code" hint="Reserved for branded/short links.">
            <Input value={shortCode} onChange={(e) => setShortCode(e.target.value)} maxLength={40} />
          </F>
          <F label="Target URL" required error={validation.errors.targetUrl} className="sm:col-span-2">
            <Input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yourbrand.zupix.link/summer"
            />
          </F>
          <F label="utm_source" required error={validation.errors.source}>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="instagram" />
          </F>
          <F label="utm_medium" required error={validation.errors.medium}>
            <Input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="social" />
          </F>
          <F label="utm_campaign" required error={validation.errors.campaign}>
            <Input
              value={campaignUtm}
              onChange={(e) => setCampaignUtm(e.target.value)}
              placeholder="spring_launch"
            />
          </F>
          <F label="utm_term" error={validation.errors.term}>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="running_shoes" />
          </F>
          <F label="utm_content" error={validation.errors.content} className="sm:col-span-2">
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="hero_button" />
          </F>
          <F label="Notes" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Optional context, budget or audience notes."
            />
          </F>
          {trackingUrl && (
            <div className="rounded-md border bg-muted/40 p-3 sm:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Tracking URL
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-2 text-xs">
                  {trackingUrl}
                </code>
                <Button size="sm" variant="outline" onClick={copyLink} aria-label="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={!canSave}>
            {save.isPending ? "Saving…" : campaign ? "Save changes" : "Create campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
