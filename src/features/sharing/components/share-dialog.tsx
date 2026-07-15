import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  QrCode,
  Download,
  Trash2,
  Star,
  Code,
  Printer,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  DEFAULT_QR_SETTINGS,
  DEFAULT_SHARE_SETTINGS,
  PRINT_PRESETS,
  type PrintPreset,
  type QrSettings,
  type ShareSettings,
} from "../types";
import {
  fetchSharingRecord,
  listQrDesigns,
  saveQrDesign,
  deleteQrDesign,
  updateQrSettings,
  updateShareSettings,
} from "../api";
import { renderQrInto } from "../qr-generator";
import {
  downloadQrPng,
  downloadQrSvg,
  downloadQrPdf,
  downloadPrintPdf,
} from "../exports";
import { shareLinks, tryNativeShare, type ShareChannel } from "../share-links";
import { buttonEmbed, iframeEmbed, qrWidgetEmbed } from "../embed";

interface Props {
  pageId: string;
  trigger?: React.ReactNode;
}

/** Full-featured Smart Sharing Hub: QR designer, share buttons, embed, print. */
export function ShareDialog({ pageId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-5 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Smart Sharing Hub
          </DialogTitle>
          <DialogDescription>
            Generate a branded QR, share on any channel, embed anywhere, and download print‑ready
            assets.
          </DialogDescription>
        </DialogHeader>
        {open && <ShareBody pageId={pageId} />}
      </DialogContent>
    </Dialog>
  );
}

function ShareBody({ pageId }: { pageId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["sharing", pageId],
    queryFn: () => fetchSharingRecord(pageId),
  });

  const [qr, setQr] = useState<QrSettings>(DEFAULT_QR_SETTINGS);
  const [share, setShare] = useState<ShareSettings>(DEFAULT_SHARE_SETTINGS);

  useEffect(() => {
    if (data) {
      setQr(data.qr);
      setShare(data.share);
    }
  }, [data]);

  const publicUrl = useMemo(() => {
    if (!data) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${data.slug}`;
  }, [data]);

  const saveQr = useMutation({
    mutationFn: (next: QrSettings) => updateQrSettings(pageId, next),
    onSuccess: () => toast.success("QR design saved"),
    onError: () => toast.error("Could not save QR"),
  });
  const saveShare = useMutation({
    mutationFn: (next: ShareSettings) => updateShareSettings(pageId, next),
    onSuccess: () => toast.success("Share settings saved"),
    onError: () => toast.error("Could not save share settings"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPublished = !!data.publishedAt && data.status === "published";
  const shareInput = {
    url: publicUrl,
    title: share.title || data.name,
    message: share.message || share.description || `Check out my page: ${data.name}`,
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {!isPublished && (
        <div className="flex items-start gap-2 border-b bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            This page hasn't been published yet. Sharing links and the QR will only work after you
            publish. You can still design and download assets now.
          </div>
        </div>
      )}
      <Tabs defaultValue="share" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-5 mt-3 grid w-[calc(100%-2.5rem)] grid-cols-4">
          <TabsTrigger value="share" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-1.5">
            <QrCode className="h-3.5 w-3.5" /> QR Code
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-1.5">
            <Code className="h-3.5 w-3.5" /> Embed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="flex-1 overflow-y-auto px-5 py-4">
          <SharePanel
            url={publicUrl}
            share={share}
            onChange={setShare}
            onSave={() => saveShare.mutate(share)}
            saving={saveShare.isPending}
            shareInput={shareInput}
          />
        </TabsContent>

        <TabsContent value="qr" className="flex-1 overflow-y-auto px-5 py-4">
          <QrPanel
            pageId={pageId}
            workspaceId={data.workspaceId}
            slug={data.slug}
            url={publicUrl}
            qr={qr}
            onChange={setQr}
            onSave={() => saveQr.mutate(qr)}
            saving={saveQr.isPending}
            qc={qc}
          />
        </TabsContent>

        <TabsContent value="print" className="flex-1 overflow-y-auto px-5 py-4">
          <PrintPanel
            qr={qr}
            url={publicUrl}
            slug={data.slug}
            title={share.title || data.name}
            tagline={share.description}
          />
        </TabsContent>

        <TabsContent value="embed" className="flex-1 overflow-y-auto px-5 py-4">
          <EmbedPanel url={publicUrl} title={share.title || data.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Share panel                                                         */
/* ------------------------------------------------------------------ */

interface SharePanelProps {
  url: string;
  share: ShareSettings;
  onChange: (s: ShareSettings) => void;
  onSave: () => void;
  saving: boolean;
  shareInput: { url: string; title: string; message: string };
}

const CHANNELS: { id: ShareChannel | "copy" | "native"; label: string; hint: string }[] = [
  { id: "whatsapp", label: "WhatsApp", hint: "Open WhatsApp share" },
  { id: "facebook", label: "Facebook", hint: "Share on Facebook" },
  { id: "twitter", label: "X (Twitter)", hint: "Post on X" },
  { id: "linkedin", label: "LinkedIn", hint: "Share on LinkedIn" },
  { id: "telegram", label: "Telegram", hint: "Send via Telegram" },
  { id: "reddit", label: "Reddit", hint: "Post to Reddit" },
  { id: "email", label: "Email", hint: "Send via email" },
  { id: "copy", label: "Copy link", hint: "Copy to clipboard" },
  { id: "native", label: "System share", hint: "Instagram, Discord, more…" },
];

function SharePanel({ url, share, onChange, onSave, saving, shareInput }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick(id: (typeof CHANNELS)[number]["id"]) {
    if (id === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
      return;
    }
    if (id === "native") {
      const ok = await tryNativeShare(shareInput);
      if (!ok) toast.info("System share unavailable — link copied instead");
      if (!ok) {
        await navigator.clipboard.writeText(url);
      }
      return;
    }
    const href = shareLinks[id](shareInput);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Public URL
          </Label>
          <div className="mt-1 flex gap-2">
            <Input readOnly value={url} className="font-mono text-sm" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                toast.success("Link copied");
                setTimeout(() => setCopied(false), 1500);
              }}
              aria-label="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Share to
          </Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {CHANNELS.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-9 justify-start gap-2 text-xs"
                onClick={() => handleClick(c.id)}
                title={c.hint}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Instagram, Discord and other apps use "System share" or "Copy link".
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Share settings</h3>
          <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="share-title">Share title</Label>
          <Input
            id="share-title"
            value={share.title}
            onChange={(e) => onChange({ ...share, title: e.target.value })}
            placeholder="Overrides SEO title"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="share-desc">Share description</Label>
          <Textarea
            id="share-desc"
            rows={3}
            value={share.description}
            onChange={(e) => onChange({ ...share, description: e.target.value })}
            placeholder="Shown by some platforms as preview text"
            maxLength={320}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="share-image">Share image URL</Label>
          <Input
            id="share-image"
            value={share.imageUrl ?? ""}
            onChange={(e) => onChange({ ...share, imageUrl: e.target.value || null })}
            placeholder="https://…/social.png"
          />
          <p className="text-[11px] text-muted-foreground">
            Falls back to SEO OG image when empty.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="share-msg">Custom share message</Label>
          <Textarea
            id="share-msg"
            rows={2}
            value={share.message}
            onChange={(e) => onChange({ ...share, message: e.target.value })}
            placeholder="Inserted into WhatsApp / X / Telegram share intents"
            maxLength={280}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* QR panel                                                            */
/* ------------------------------------------------------------------ */

interface QrPanelProps {
  pageId: string;
  workspaceId: string;
  slug: string;
  url: string;
  qr: QrSettings;
  onChange: (q: QrSettings) => void;
  onSave: () => void;
  saving: boolean;
  qc: ReturnType<typeof useQueryClient>;
}

function QrPanel({ pageId, workspaceId, slug, url, qr, onChange, onSave, saving, qc }: QrPanelProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "png" | "svg" | "pdf">(null);
  const [designName, setDesignName] = useState("");

  useEffect(() => {
    if (!previewRef.current) return;
    renderQrInto(previewRef.current, url || "https://example.com", qr, 260);
  }, [url, qr]);

  const designs = useQuery({
    queryKey: ["qr-designs", pageId],
    queryFn: () => listQrDesigns(pageId),
  });

  const saveDesign = useMutation({
    mutationFn: () =>
      saveQrDesign({
        pageId,
        workspaceId,
        name: designName.trim() || `Design ${(designs.data?.length ?? 0) + 1}`,
        settings: qr,
      }),
    onSuccess: () => {
      toast.success("Design saved to favorites");
      setDesignName("");
      qc.invalidateQueries({ queryKey: ["qr-designs", pageId] });
    },
    onError: () => toast.error("Could not save design"),
  });
  const removeDesign = useMutation({
    mutationFn: (id: string) => deleteQrDesign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qr-designs", pageId] }),
  });

  async function handleLogoUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    onChange({ ...qr, logoUrl: dataUrl });
  }

  async function handleDownload(fmt: "png" | "svg" | "pdf") {
    setBusy(fmt);
    try {
      if (fmt === "png") await downloadQrPng(url, qr, slug, 1200);
      else if (fmt === "svg") await downloadQrSvg(url, qr, slug);
      else await downloadQrPdf(url, qr, slug);
      toast.success(`Downloaded ${fmt.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-center rounded-xl border bg-[repeating-conic-gradient(#f8fafc_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] p-4">
          <div ref={previewRef} className="flex items-center justify-center" aria-label="QR preview" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("png")}
            disabled={busy !== null}
            className="gap-1"
          >
            {busy === "png" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("svg")}
            disabled={busy !== null}
            className="gap-1"
          >
            {busy === "svg" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("pdf")}
            disabled={busy !== null}
            className="gap-1"
          >
            {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            PDF
          </Button>
        </div>
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Save current design
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="w-full gap-1.5"
          onClick={() => onChange(DEFAULT_QR_SETTINGS)}
        >
          Reset to default
        </Button>
      </div>

      <div className="space-y-5">
        <section className="grid grid-cols-2 gap-3">
          <ColorField
            label="QR color"
            value={qr.color}
            onChange={(v) => onChange({ ...qr, color: v })}
          />
          <ColorField
            label="Background"
            value={qr.background}
            onChange={(v) => onChange({ ...qr, background: v })}
            disabled={qr.transparent}
          />
          <div className="col-span-2 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label className="text-sm">Transparent background</Label>
              <p className="text-[11px] text-muted-foreground">
                Best for placing the QR over photos or dark surfaces.
              </p>
            </div>
            <Switch
              checked={qr.transparent}
              onCheckedChange={(v) => onChange({ ...qr, transparent: v })}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Dot style</Label>
            <Select
              value={qr.dotStyle}
              onValueChange={(v) => onChange({ ...qr, dotStyle: v as QrSettings["dotStyle"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="classy">Classy</SelectItem>
                <SelectItem value="extra-rounded">Extra rounded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Corner style</Label>
            <Select
              value={qr.cornerStyle}
              onValueChange={(v) => onChange({ ...qr, cornerStyle: v as QrSettings["cornerStyle"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="extra-rounded">Extra rounded</SelectItem>
                <SelectItem value="dot">Dot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Error correction</Label>
            <Select
              value={qr.errorLevel}
              onValueChange={(v) => onChange({ ...qr, errorLevel: v as QrSettings["errorLevel"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (7%) — smallest QR</SelectItem>
                <SelectItem value="M">Medium (15%)</SelectItem>
                <SelectItem value="Q">Quartile (25%)</SelectItem>
                <SelectItem value="H">High (30%) — required for logos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Center logo</Label>
              <p className="text-[11px] text-muted-foreground">PNG or SVG under 2MB works best.</p>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleLogoUpload(f);
                  }}
                />
                <Button asChild size="sm" variant="outline">
                  <span>Upload</span>
                </Button>
              </label>
              {qr.logoUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange({ ...qr, logoUrl: null })}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
          {qr.logoUrl && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Logo size ({Math.round(qr.logoSize * 100)}%)</Label>
                <Slider
                  min={15}
                  max={45}
                  step={1}
                  value={[Math.round(qr.logoSize * 100)]}
                  onValueChange={(v) => onChange({ ...qr, logoSize: (v[0] ?? 28) / 100 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Punch out background dots</Label>
                <Switch
                  checked={qr.logoMargin}
                  onCheckedChange={(v) => onChange({ ...qr, logoMargin: v })}
                />
              </div>
            </>
          )}
        </section>

        <section className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <Label className="text-sm">Favorite designs</Label>
            </div>
            <div className="flex gap-2">
              <Input
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="Name this design"
                className="h-8 w-40 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveDesign.mutate()}
                disabled={saveDesign.isPending}
              >
                Add
              </Button>
            </div>
          </div>
          {!designs.data || designs.data.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Save your favorite QR configurations here to reuse later.
            </p>
          ) : (
            <ul className="divide-y">
              {designs.data.map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="flex-1 truncate">{d.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {new Date(d.created_at).toLocaleDateString()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => onChange({ ...DEFAULT_QR_SETTINGS, ...d.settings })}
                  >
                    Apply
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label="Delete design"
                    onClick={() => removeDesign.mutate(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border bg-transparent disabled:opacity-50"
          aria-label={label}
        />
        <Input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 font-mono text-xs"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Print panel                                                         */
/* ------------------------------------------------------------------ */

function PrintPanel({
  qr,
  url,
  slug,
  title,
  tagline,
}: {
  qr: QrSettings;
  url: string;
  slug: string;
  title: string;
  tagline: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  async function make(preset: PrintPreset) {
    setBusy(preset.id);
    try {
      await downloadPrintPdf({ preset, qr, url, slug, title, tagline });
      toast.success(`${preset.label} ready`);
    } catch (e) {
      console.error(e);
      toast.error("Print export failed");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {PRINT_PRESETS.map((p) => (
        <div key={p.id} className="flex items-start gap-3 rounded-lg border p-4">
          <div className="grid h-14 w-14 place-items-center rounded-md bg-muted">
            <Printer className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{p.label}</span>
              <Badge variant="outline" className="text-[10px]">
                {p.widthMm}×{p.heightMm}mm
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1.5"
              onClick={() => make(p)}
              disabled={busy !== null}
            >
              {busy === p.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Embed panel                                                         */
/* ------------------------------------------------------------------ */

function EmbedPanel({ url, title }: { url: string; title: string }) {
  const snippets = [
    { id: "iframe", label: "Website embed (iframe)", code: iframeEmbed({ url, title }) },
    { id: "button", label: "Button link", code: buttonEmbed({ url, title }) },
    { id: "qr", label: "QR widget", code: qrWidgetEmbed({ url, title }) },
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Paste these snippets into any website or newsletter. Snippet architecture is ready today —
        richer embed styling and analytics arrive in a later phase.
      </p>
      {snippets.map((s) => (
        <div key={s.id} className="rounded-md border">
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
            <span className="text-xs font-semibold">{s.label}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5"
              onClick={async () => {
                await navigator.clipboard.writeText(s.code);
                toast.success("Snippet copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <pre className="max-h-40 overflow-auto p-3 text-[11px] leading-relaxed">
            <code>{s.code}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}
