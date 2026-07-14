/**
 * Full-screen template preview. Shows desktop and mobile phone frames
 * side by side, template metadata, and Apply / Apply-with-content
 * actions when the caller opted in.
 */

import { Crown, Monitor, Smartphone, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniPreview } from "./mini-preview";
import { TEMPLATE_CATEGORIES } from "../catalog";
import type { Template } from "../types";

interface Props {
  template: Template;
  onClose: () => void;
  /** When provided, Apply buttons render; the boolean is
   *  `replaceContent` — true replaces blocks with the template's. */
  onApply?: (replaceContent: boolean) => void;
}

export function PreviewDialog({ template, onClose, onApply }: Props) {
  const cat = TEMPLATE_CATEGORIES.find((c) => c.id === template.category)?.label ?? template.category;
  const hasStarterBlocks = (template.blocks?.length ?? 0) > 0;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl gap-0 p-0">
        <DialogHeader className="flex-row items-start justify-between gap-4 border-b p-4">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2">
              {template.name}
              {template.isPremium && (
                <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
                  <Crown className="h-3 w-3" /> Premium
                </Badge>
              )}
              {template.isCustom && <Badge variant="secondary">Mine</Badge>}
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">{cat}</Badge>
              {template.style && <Badge variant="outline">{template.style}</Badge>}
              {(template.tags ?? []).map((t) => (
                <Badge key={t} variant="outline" className="text-muted-foreground">{t}</Badge>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-6 bg-muted/40 p-6 md:grid-cols-[1fr_320px]">
          {/* Desktop frame */}
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Monitor className="h-3.5 w-3.5" /> Desktop
              <span className="ml-auto flex gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="h-2 w-2 rounded-full bg-green-400" />
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="w-[280px]">
                <MiniPreview template={template} size="lg" />
              </div>
            </div>
          </div>
          {/* Mobile frame */}
          <div className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </div>
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="w-[220px]">
                <MiniPreview template={template} size="md" />
              </div>
            </div>
          </div>
        </div>

        {onApply && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
            <p className="text-xs text-muted-foreground">
              Applying replaces the current design tokens. Your blocks are kept
              unless you choose to replace content.
            </p>
            <div className="flex gap-2">
              {hasStarterBlocks && (
                <Button variant="outline" onClick={() => onApply(true)}>
                  Replace design & content
                </Button>
              )}
              <Button onClick={() => onApply(false)}>Apply theme</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
