/**
 * Template Gallery — premium marketplace surface.
 *
 * Modes:
 *  - "browse"  → read-only browsing (used by /app/templates).
 *  - "apply"   → renders the Apply CTA (used inside the builder).
 *
 * Access control: themes carry a `tier` (free / premium / enterprise).
 * The workspace plan is fetched via `usePlan()`; templates the user
 * cannot apply render a lock overlay and open the PremiumLockModal
 * on interaction instead of applying.
 */

import { useMemo, useRef, useState } from "react";
import {
  Search,
  Star,
  Sparkles,
  Crown,
  Check,
  Download,
  Upload,
  Trash2,
  MoreHorizontal,
  Copy,
  Eye,
  Pencil,
  Lock,
  Flame,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TEMPLATE_CATEGORIES } from "../catalog";
import {
  useAllTemplates,
  useFavorites,
  useRecent,
  exportTemplateFile,
  parseTemplate,
} from "../hooks";
import { upsertCustomTemplate, newTemplateId } from "../storage";
import type { Template, TemplateCategoryId, TemplateStyle, TemplateTier } from "../types";
import { templateTier } from "../types";
import { MiniPreview } from "./mini-preview";
import { PreviewDialog } from "./preview-dialog";
import { usePlan, useUpgradeModal } from "@/features/subscription/hooks";
import { canAccessTemplate } from "../access";

type Mode = "browse" | "apply";

interface Props {
  mode?: Mode;
  onApply?: (template: Template, opts: { replaceContent: boolean }) => void;
  className?: string;
}

type Filter = "all" | "free" | "premium" | "enterprise" | "favorites" | "recent" | "mine";
type SortKey = "popular" | "new" | "trending" | "az";

export function TemplateGallery({ mode = "browse", onApply, className }: Props) {
  const { all, remove, importTemplate, update } = useAllTemplates();
  const favs = useFavorites();
  const recent = useRecent();
  const { code: planCode } = usePlan();
  const { openFeatureDialog } = useUpgradeModal();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | TemplateCategoryId>("all");
  const [style, setStyle] = useState<"all" | TemplateStyle>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [lockFor, setLockFor] = useState<{ name: string; tier: TemplateTier } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewTemplate = previewId ? (all.find((t) => t.id === previewId) ?? null) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter((t) => {
      const tier = templateTier(t);
      if (filter === "premium" && tier !== "premium") return false;
      if (filter === "enterprise" && tier !== "enterprise") return false;
      if (filter === "free" && tier !== "free") return false;
      if (filter === "favorites" && !favs.has(t.id)) return false;
      if (filter === "recent" && !recent.ids.includes(t.id)) return false;
      if (filter === "mine" && !t.isCustom) return false;
      if (category !== "all" && t.category !== category) return false;
      if (style !== "all" && t.style !== style) return false;
      if (q) {
        const hay =
          `${t.name} ${t.description ?? ""} ${(t.tags ?? []).join(" ")} ${t.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    switch (sort) {
      case "popular":
        sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        break;
      case "new":
        sorted.sort((a, b) => Number(!!b.flags?.isNew) - Number(!!a.flags?.isNew));
        break;
      case "trending":
        sorted.sort((a, b) => Number(!!b.flags?.isTrending) - Number(!!a.flags?.isTrending));
        break;
      case "az":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [all, filter, category, style, query, favs, recent.ids, sort]);

  function handleApply(t: Template, replaceContent: boolean) {
    if (!onApply) return;
    if (!canAccessTemplate(planCode, t)) {
      const tier = templateTier(t);
      openFeatureDialog({
        feature: tier === "enterprise" ? "block.store" : "remove_branding", // Using existing keys for plan mapping
        suggestedPlan: tier === "enterprise" ? "shikhar" : "tejas",
        featureName: `${t.name} Premium Template`,
        reason: `The ${t.name} template is part of our ${tier === "enterprise" ? "Shikhar" : "Tejas"} collection.`,
        benefits: [
          "Professional high-conversion design",
          "Advanced layout & animations",
          "Premium typography included",
          "Mobile-first responsive optimization"
        ]
      });
      return;
    }
    onApply(t, { replaceContent });
    recent.record(t.id);
  }

  function handleCardClick(t: Template) {
    if (!canAccessTemplate(planCode, t)) {
      const tier = templateTier(t);
      openFeatureDialog({
        feature: tier === "enterprise" ? "block.store" : "remove_branding",
        suggestedPlan: tier === "enterprise" ? "shikhar" : "tejas",
        featureName: `${t.name} Premium Template`,
        benefits: [
          "Professional high-conversion design",
          "Advanced layout & animations",
          "Premium typography included",
          "Mobile-first responsive optimization"
        ]
      });
      return;
    }
    setPreviewId(t.id);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }
  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const t = importTemplate(raw);
      if (!t) throw new Error("Not a valid template file");
      toast.success(`Imported "${t.name}"`);
    } catch (err) {
      toast.error((err as Error).message ?? "Import failed");
    }
  }

  function handleDuplicate(t: Template) {
    const now = Date.now();
    const dup: Template = {
      ...t,
      id: newTemplateId(),
      name: `${t.name} copy`,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    upsertCustomTemplate(dup);
    toast.success("Template duplicated");
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search themes, styles, tags…"
              className="h-9 pl-8"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {TEMPLATE_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="glass">Glass</SelectItem>
              <SelectItem value="neon">Neon</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="az">A → Z</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", "All"],
              ["favorites", "★ Favorites"],
              ["recent", "Recent"],
              ["mine", "My templates"],
              ["free", "Free"],
              ["premium", "Premium"],
              ["enterprise", "Enterprise"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={filter === id ? "default" : "outline"}
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setFilter(id)}
            >
              {label}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} themes</span>
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="min-h-0 flex-1 pr-1">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="No themes match"
            description="Try adjusting your search, category or filter."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                planCode={planCode}
                favorite={favs.has(t.id)}
                onToggleFavorite={() => favs.toggle(t.id)}
                onOpen={() => handleCardClick(t)}
                onLocked={() => {
                  const tier = templateTier(t);
                  openFeatureDialog({
                    feature: tier === "enterprise" ? "block.store" : "remove_branding",
                    suggestedPlan: tier === "enterprise" ? "shikhar" : "tejas",
                    featureName: `${t.name} Premium Template`,
                    benefits: [
                      "Professional high-conversion design",
                      "Advanced layout & animations",
                      "Premium typography included",
                      "Mobile-first responsive optimization"
                    ]
                  });
                }}
                onDelete={
                  t.isCustom
                    ? () => {
                        remove(t.id);
                        toast.success("Template deleted");
                      }
                    : undefined
                }
                onRename={
                  t.isCustom
                    ? (name) => {
                        update(t.id, { name });
                        toast.success("Renamed");
                      }
                    : undefined
                }
                onDuplicate={() => handleDuplicate(t)}
                onExport={() => exportTemplateFile(t)}
                onApply={mode === "apply" ? () => handleApply(t, false) : undefined}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {previewTemplate && (
        <PreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewId(null)}
          onApply={
            mode === "apply" && onApply
              ? (replaceContent) => {
                  handleApply(previewTemplate, replaceContent);
                  setPreviewId(null);
                }
              : undefined
          }
        />
      )}

    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────

interface CardProps {
  template: Template;
  planCode: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
  onLocked: () => void;
  onApply?: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  onDuplicate: () => void;
  onExport: () => void;
}

function TemplateCard({
  template,
  planCode,
  favorite,
  onToggleFavorite,
  onOpen,
  onLocked,
  onApply,
  onDelete,
  onRename,
  onDuplicate,
  onExport,
}: CardProps) {
  const tier = templateTier(template);
  const locked = !canAccessTemplate(planCode as never, template);
  const flags = template.flags ?? {};

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg">
      {onApply && (
        <div className="border-b bg-card p-2">
          <Button
            size="sm"
            variant={locked ? "outline" : "default"}
            className="w-full gap-1.5"
            onClick={locked ? onLocked : onApply}
          >
            {locked ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Unlock theme
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Apply theme
              </>
            )}
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Preview ${template.name}`}
      >
        <MiniPreview template={template} frame={false} />

        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm transition group-hover:backdrop-blur-md">
            <div className="flex flex-col items-center gap-1 rounded-xl bg-background/95 px-3 py-2 shadow-lg">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {tier === "enterprise" ? "Shikhar" : "Tejas"}
              </span>
            </div>
          </div>
        )}

        {/* Hover preview hint */}
        {!locked && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 via-transparent p-2 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow">
              <Eye className="mr-1 inline h-3 w-3" /> Preview
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {tier === "enterprise" ? (
            <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <Crown className="h-3 w-3" /> Enterprise
            </Badge>
          ) : tier === "premium" ? (
            <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-500/90 text-white">
              Free
            </Badge>
          )}
          {flags.isNew && <Badge className="bg-blue-600 text-white">New</Badge>}
          {flags.isTrending && (
            <Badge className="gap-1 bg-pink-600 text-white">
              <Flame className="h-3 w-3" /> Trending
            </Badge>
          )}
          {flags.isFeatured && (
            <Badge className="gap-1 bg-purple-600 text-white">
              <Zap className="h-3 w-3" /> Featured
            </Badge>
          )}
          {template.isCustom && <Badge variant="secondary">Mine</Badge>}
        </div>

        <button
          type="button"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow-sm transition hover:bg-background"
        >
          <Star className={cn("h-3.5 w-3.5", favorite && "fill-amber-400 text-amber-400")} />
        </button>
      </button>

      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{template.name}</span>
          </div>
          <div className="flex items-center gap-2 truncate text-xs text-muted-foreground">
            <span className="truncate">
              {TEMPLATE_CATEGORIES.find((c) => c.id === template.category)?.label ??
                template.category}
            </span>
            {typeof template.popularity === "number" && template.popularity > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] tabular-nums">
                ★ {template.popularity}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Template actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onOpen}>
              <Eye className="mr-2 h-3.5 w-3.5" /> Preview
            </DropdownMenuItem>
            {onApply && (
              <DropdownMenuItem onClick={locked ? onLocked : onApply}>
                {locked ? (
                  <>
                    <Lock className="mr-2 h-3.5 w-3.5" /> Unlock theme
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5" /> Apply theme
                  </>
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="mr-2 h-3.5 w-3.5" /> Export JSON
            </DropdownMenuItem>
            {onRename && (
              <DropdownMenuItem
                onClick={() => {
                  const name = window.prompt("Rename template", template.name)?.trim();
                  if (name) onRename(name);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm(`Delete "${template.name}"?`)) onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}

// Re-export parseTemplate for callers that still want to import from here.
export { parseTemplate };
