/**
 * Template Gallery — the shared surface used by both the standalone
 * Templates route and the in-builder Templates dialog.
 *
 * Modes:
 *  - "browse"  → read-only browsing (used by the /app/templates route).
 *  - "apply"   → adds an Apply-to-current-page action (used inside
 *                the builder). Requires `onApply`.
 */

import { useMemo, useRef, useState } from "react";
import {
  Search, Star, Sparkles, Crown, Check, Download, Upload, Trash2,
  MoreHorizontal, Copy, Eye, Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TEMPLATE_CATEGORIES } from "../catalog";
import { useAllTemplates, useFavorites, useRecent, exportTemplateFile, parseTemplate } from "../hooks";
import { upsertCustomTemplate, newTemplateId } from "../storage";
import type { Template, TemplateCategoryId, TemplateStyle } from "../types";
import { MiniPreview } from "./mini-preview";
import { PreviewDialog } from "./preview-dialog";

type Mode = "browse" | "apply";

interface Props {
  mode?: Mode;
  onApply?: (template: Template, opts: { replaceContent: boolean }) => void;
  className?: string;
}

type Filter = "all" | "free" | "premium" | "favorites" | "recent" | "mine";

export function TemplateGallery({ mode = "browse", onApply, className }: Props) {
  const { all, remove, importTemplate, update } = useAllTemplates();
  const favs = useFavorites();
  const recent = useRecent();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | TemplateCategoryId>("all");
  const [style, setStyle] = useState<"all" | TemplateStyle>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewTemplate = previewId ? all.find((t) => t.id === previewId) ?? null : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (filter === "premium" && !t.isPremium) return false;
      if (filter === "free" && t.isPremium) return false;
      if (filter === "favorites" && !favs.has(t.id)) return false;
      if (filter === "recent" && !recent.ids.includes(t.id)) return false;
      if (filter === "mine" && !t.isCustom) return false;
      if (category !== "all" && t.category !== category) return false;
      if (style !== "all" && t.style !== style) return false;
      if (q) {
        const hay = `${t.name} ${t.description ?? ""} ${(t.tags ?? []).join(" ")} ${t.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filter, category, style, query, favs, recent.ids]);

  function handleApply(t: Template, replaceContent: boolean) {
    if (!onApply) return;
    onApply(t, { replaceContent });
    recent.record(t.id);
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
      ...t, id: newTemplateId(), name: `${t.name} copy`, isCustom: true,
      createdAt: now, updatedAt: now,
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
              placeholder="Search templates, styles, tags…"
              className="h-9 pl-8"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {TEMPLATE_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Style" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="glass">Glass</SelectItem>
              <SelectItem value="neon">Neon</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>
          <input
            ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={handleImportChange}
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            ["all", "All"],
            ["favorites", "★ Favorites"],
            ["recent", "Recent"],
            ["mine", "My templates"],
            ["free", "Free"],
            ["premium", "Premium"],
          ] as const).map(([id, label]) => (
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
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="min-h-0 flex-1 pr-1">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="No templates match"
            description="Try adjusting your search, category or filter."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                favorite={favs.has(t.id)}
                onToggleFavorite={() => favs.toggle(t.id)}
                onPreview={() => setPreviewId(t.id)}
                onDelete={t.isCustom ? () => { remove(t.id); toast.success("Template deleted"); } : undefined}
                onRename={t.isCustom ? (name) => { update(t.id, { name }); toast.success("Renamed"); } : undefined}
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
              ? (replaceContent) => { handleApply(previewTemplate, replaceContent); setPreviewId(null); }
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
  favorite: boolean;
  onToggleFavorite: () => void;
  onPreview: () => void;
  onApply?: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  onDuplicate: () => void;
  onExport: () => void;
}

function TemplateCard({
  template, favorite, onToggleFavorite, onPreview, onApply,
  onDelete, onRename, onDuplicate, onExport,
}: CardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-md">
      <button
        type="button"
        onClick={onPreview}
        className="relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Preview ${template.name}`}
      >
        <MiniPreview template={template} frame={false} />
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 via-transparent p-2 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow">
            <Eye className="mr-1 inline h-3 w-3" /> Preview
          </span>
        </div>
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {template.isPremium ? (
            <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-500/90 text-white">Free</Badge>
          )}
          {template.isCustom && <Badge variant="secondary">Mine</Badge>}
        </div>
        <button
          type="button"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow-sm transition hover:bg-background"
        >
          <Star className={cn("h-3.5 w-3.5", favorite && "fill-amber-400 text-amber-400")} />
        </button>
      </button>

      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{template.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {TEMPLATE_CATEGORIES.find((c) => c.id === template.category)?.label ?? template.category}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Template actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="mr-2 h-3.5 w-3.5" /> Preview
            </DropdownMenuItem>
            {onApply && (
              <DropdownMenuItem onClick={onApply}>
                <Check className="mr-2 h-3.5 w-3.5" /> Apply theme
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

      {onApply && (
        <div className="border-t p-2">
          <Button size="sm" className="w-full" onClick={onApply}>
            Apply theme
          </Button>
        </div>
      )}
    </div>
  );
}

// Re-export parseTemplate for callers that still want to import from here.
export { parseTemplate };
