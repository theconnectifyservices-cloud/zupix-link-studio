import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Share2,
  Braces,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fetchSeo, updateSeo, isSlugAvailable, updateSlug } from "../api";
import { DEFAULT_SEO, type SeoSettings } from "../types";
import { validateSeo, isValidSlug, type SeoWarning } from "../validation";
import { buildJsonLd } from "../jsonld";
import { FacebookPreview, LinkedInPreview, SearchPreview, WhatsAppPreview } from "./previews";

interface Props {
  pageId: string;
  pageName: string;
  slug: string;
  description?: string | null;
  trigger?: React.ReactNode;
}

/**
 * Full SEO editor. Users configure title/description/OG/Twitter/schema
 * and see live search + social previews update instantly.
 */
export function SeoDialog({ pageId, pageName, slug, description, trigger }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-1.5" title="SEO settings">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-3 p-0">
        <DialogHeader className="border-b px-5 py-3 text-left">
          <DialogTitle>SEO & Social Sharing</DialogTitle>
          <DialogDescription>
            Configure how this page appears in Google, Facebook, WhatsApp, LinkedIn and X.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SeoBody
            pageId={pageId}
            pageName={pageName}
            slug={slug}
            description={description ?? null}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SeoBody({
  pageId,
  pageName,
  slug: initialSlug,
  description,
}: {
  pageId: string;
  pageName: string;
  slug: string;
  description: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["seo", pageId],
    queryFn: () => fetchSeo(pageId),
    staleTime: 10_000,
  });

  const [seo, setSeo] = useState<SeoSettings>(DEFAULT_SEO);
  const [slug, setSlug] = useState(initialSlug);
  const [faviconUrl, setFavicon] = useState<string>("");
  const [appleUrl, setApple] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [slugCheck, setSlugCheck] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">(
    "idle",
  );

  useEffect(() => {
    if (!data) return;
    setSeo({ ...DEFAULT_SEO, ...data.seo });
    setFavicon(data.faviconUrl ?? "");
    setApple(data.appleTouchIconUrl ?? "");
  }, [data]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = `${origin}/${slug}`;

  const effective = useMemo(() => {
    return {
      title: seo.title || pageName,
      description: seo.description || description || "",
      url: seo.canonicalUrl || pageUrl,
      image: seo.ogImage,
      siteName: seo.ogSiteName || "ZUPIX",
    };
  }, [seo, pageName, description, pageUrl]);

  const warnings = validateSeo(seo, { pageName, description });

  const jsonLd = useMemo(() => buildJsonLd(seo, effective), [seo, effective]);

  async function handleSlugChange(v: string) {
    setSlug(v);
    if (!isValidSlug(v)) {
      setSlugCheck("invalid");
      return;
    }
    setSlugCheck("checking");
    const ok = await isSlugAvailable(v, pageId);
    setSlugCheck(ok ? "ok" : "taken");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (slug !== initialSlug && slugCheck === "ok") {
        await updateSlug(pageId, slug);
      }
      await updateSeo(pageId, {
        seo,
        faviconUrl: faviconUrl || null,
        appleTouchIconUrl: appleUrl || null,
      });
      await qc.invalidateQueries({ queryKey: ["seo", pageId] });
      toast.success("SEO settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-4">
      <WarningsBar warnings={warnings} />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_360px]">
        <div className="min-h-0 overflow-y-auto pr-1">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="gap-1.5">
                <Search className="h-3.5 w-3.5" /> General
              </TabsTrigger>
              <TabsTrigger value="og" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Open Graph
              </TabsTrigger>
              <TabsTrigger value="twitter" className="gap-1.5">
                <span className="text-[11px] font-bold">𝕏</span> Twitter
              </TabsTrigger>
              <TabsTrigger value="schema" className="gap-1.5">
                <Braces className="h-3.5 w-3.5" /> Schema
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
              <Field label={`SEO title (${(seo.title ?? "").length}/60)`}>
                <Input
                  value={seo.title ?? ""}
                  onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                  placeholder={pageName || "Your page title"}
                  maxLength={90}
                />
              </Field>
              <Field label={`Meta description (${(seo.description ?? "").length}/160)`}>
                <Textarea
                  rows={3}
                  value={seo.description ?? ""}
                  onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                  placeholder={description ?? "A short summary shown in search results"}
                  maxLength={240}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Keywords (comma separated)">
                  <Input
                    value={(seo.keywords ?? []).join(", ")}
                    onChange={(e) =>
                      setSeo({
                        ...seo,
                        keywords: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="bio, links, portfolio"
                  />
                </Field>
                <Field label="Author">
                  <Input
                    value={seo.author ?? ""}
                    onChange={(e) => setSeo({ ...seo, author: e.target.value })}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Language (BCP-47)">
                  <Input
                    value={seo.language ?? "en"}
                    onChange={(e) => setSeo({ ...seo, language: e.target.value })}
                    placeholder="en, en-US, fr, …"
                  />
                </Field>
                <Field label="Canonical URL">
                  <Input
                    value={seo.canonicalUrl ?? ""}
                    onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                    placeholder={pageUrl}
                  />
                </Field>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <ToggleField
                  label="Allow search engines to index"
                  checked={seo.robotsIndex ?? true}
                  onCheckedChange={(v) => setSeo({ ...seo, robotsIndex: v })}
                />
                <ToggleField
                  label="Allow search engines to follow links"
                  checked={seo.robotsFollow ?? true}
                  onCheckedChange={(v) => setSeo({ ...seo, robotsFollow: v })}
                />
              </div>
            </TabsContent>

            <TabsContent value="og" className="mt-4 space-y-4">
              <Field label="OG title">
                <Input
                  value={seo.ogTitle ?? ""}
                  onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })}
                  placeholder={effective.title}
                />
              </Field>
              <Field label="OG description">
                <Textarea
                  rows={2}
                  value={seo.ogDescription ?? ""}
                  onChange={(e) => setSeo({ ...seo, ogDescription: e.target.value })}
                  placeholder={effective.description}
                />
              </Field>
              <Field label="OG image URL (recommended 1200×630)">
                <Input
                  value={seo.ogImage ?? ""}
                  onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                  placeholder="https://…/cover.jpg"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="OG URL">
                  <Input
                    value={seo.ogUrl ?? ""}
                    onChange={(e) => setSeo({ ...seo, ogUrl: e.target.value })}
                    placeholder={pageUrl}
                  />
                </Field>
                <Field label="OG type">
                  <Select
                    value={seo.ogType ?? "website"}
                    onValueChange={(v) => setSeo({ ...seo, ogType: v as SeoSettings["ogType"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["website", "profile", "article", "product"] as const).map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Site name">
                  <Input
                    value={seo.ogSiteName ?? ""}
                    onChange={(e) => setSeo({ ...seo, ogSiteName: e.target.value })}
                    placeholder="ZUPIX"
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="twitter" className="mt-4 space-y-4">
              <Field label="Card type">
                <Select
                  value={seo.twitterCard ?? "summary_large_image"}
                  onValueChange={(v) =>
                    setSeo({ ...seo, twitterCard: v as SeoSettings["twitterCard"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Large image</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Title">
                <Input
                  value={seo.twitterTitle ?? ""}
                  onChange={(e) => setSeo({ ...seo, twitterTitle: e.target.value })}
                  placeholder={effective.title}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={seo.twitterDescription ?? ""}
                  onChange={(e) => setSeo({ ...seo, twitterDescription: e.target.value })}
                  placeholder={effective.description}
                />
              </Field>
              <Field label="Image URL">
                <Input
                  value={seo.twitterImage ?? ""}
                  onChange={(e) => setSeo({ ...seo, twitterImage: e.target.value })}
                  placeholder={seo.ogImage ?? "https://…/cover.jpg"}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Site @handle">
                  <Input
                    value={seo.twitterSite ?? ""}
                    onChange={(e) => setSeo({ ...seo, twitterSite: e.target.value })}
                    placeholder="@zupix"
                  />
                </Field>
                <Field label="Creator @handle">
                  <Input
                    value={seo.twitterCreator ?? ""}
                    onChange={(e) => setSeo({ ...seo, twitterCreator: e.target.value })}
                    placeholder="@you"
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="mt-4 space-y-4">
              <Field label="Schema type">
                <Select
                  value={seo.schemaType ?? "ProfilePage"}
                  onValueChange={(v) =>
                    setSeo({ ...seo, schemaType: v as SeoSettings["schemaType"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "ProfilePage",
                        "Person",
                        "Organization",
                        "LocalBusiness",
                        "WebSite",
                      ] as const
                    ).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {(seo.schemaType === "Person" || seo.schemaType === "ProfilePage") && (
                <>
                  <Field label="Job title">
                    <Input
                      value={seo.schemaJobTitle ?? ""}
                      onChange={(e) => setSeo({ ...seo, schemaJobTitle: e.target.value })}
                      placeholder="Founder, Designer, …"
                    />
                  </Field>
                  <Field label="Organization">
                    <Input
                      value={seo.schemaOrganization ?? ""}
                      onChange={(e) => setSeo({ ...seo, schemaOrganization: e.target.value })}
                      placeholder="Acme Inc."
                    />
                  </Field>
                </>
              )}
              {(seo.schemaType === "Organization" || seo.schemaType === "LocalBusiness") && (
                <>
                  <Field label="Phone">
                    <Input
                      value={seo.schemaPhone ?? ""}
                      onChange={(e) => setSeo({ ...seo, schemaPhone: e.target.value })}
                      placeholder="+1 555-0100"
                    />
                  </Field>
                  <Field label="Address">
                    <Input
                      value={seo.schemaAddress ?? ""}
                      onChange={(e) => setSeo({ ...seo, schemaAddress: e.target.value })}
                      placeholder="123 Main St, City"
                    />
                  </Field>
                </>
              )}
              <Separator />
              <Label className="text-xs text-muted-foreground">Generated JSON-LD preview</Label>
              <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-2 text-[11px]">
                {JSON.stringify(jsonLd, null, 2)}
              </pre>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-4">
              <div className="rounded-md border p-3">
                <Label className="text-xs uppercase text-muted-foreground">URL slug</Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{origin}/</span>
                  <Input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value.toLowerCase())}
                    className="h-9"
                  />
                  <SlugStatus state={slugCheck} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  3–50 characters, lowercase letters, numbers, hyphen, underscore. Changing the
                  slug breaks existing links.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Favicon URL">
                  <Input
                    value={faviconUrl}
                    onChange={(e) => setFavicon(e.target.value)}
                    placeholder="https://…/favicon.png"
                  />
                </Field>
                <Field label="Apple touch icon URL (180×180)">
                  <Input
                    value={appleUrl}
                    onChange={(e) => setApple(e.target.value)}
                    placeholder="https://…/apple-touch-icon.png"
                  />
                </Field>
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="mb-1 font-medium text-foreground">Share link</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-background px-2 py-1">
                    {pageUrl}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(pageUrl);
                      toast.success("Link copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-h-0 overflow-y-auto rounded-md border bg-muted/30 p-3">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" /> Live previews
          </div>
          <div className="space-y-3">
            <PreviewSection label="Google search">
              <SearchPreview {...effective} />
            </PreviewSection>
            <PreviewSection label="Facebook / LinkedIn">
              <FacebookPreview {...effective} />
            </PreviewSection>
            <PreviewSection label="WhatsApp / Telegram">
              <WhatsAppPreview {...effective} />
            </PreviewSection>
            <PreviewSection label="LinkedIn compact">
              <LinkedInPreview {...effective} />
            </PreviewSection>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save SEO settings"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2.5">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function PreviewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function WarningsBar({ warnings }: { warnings: SeoWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> All SEO checks pass
      </div>
    );
  }
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
      <div className="mb-1 flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" /> {warnings.length} SEO recommendation
        {warnings.length === 1 ? "" : "s"}
      </div>
      <ul className="ml-4 list-disc space-y-0.5 text-muted-foreground">
        {warnings.map((w) => (
          <li key={w.code} className={cn(w.level === "error" && "text-destructive")}>
            {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlugStatus({ state }: { state: "idle" | "checking" | "ok" | "taken" | "invalid" }) {
  if (state === "idle") return null;
  const map = {
    checking: { cls: "text-muted-foreground", text: "Checking…" },
    ok: { cls: "text-emerald-600", text: "Available" },
    taken: { cls: "text-destructive", text: "Taken" },
    invalid: { cls: "text-destructive", text: "Invalid" },
  } as const;
  const it = map[state];
  return <span className={cn("text-xs", it.cls)}>{it.text}</span>;
}
