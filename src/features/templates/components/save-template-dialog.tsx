/**
 * Save-as-template dialog. Captures a name, description, category and
 * a few tags, then persists the current builder theme (and optionally
 * blocks) as a custom template.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TEMPLATE_CATEGORIES } from "../catalog";
import { useCustomTemplates } from "../hooks";
import type { PageTheme } from "@/features/builder/theme";
import type { Block } from "@/features/builder/types";
import type { Template, TemplateCategoryId } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: PageTheme;
  blocks: Block[];
  onSaved?: (t: Template) => void;
}

export function SaveTemplateDialog({ open, onOpenChange, theme, blocks, onSaved }: Props) {
  const { create } = useCustomTemplates();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategoryId>("modern");
  const [tags, setTags] = useState("");
  const [includeBlocks, setIncludeBlocks] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setCategory("modern");
    setTags("");
    setIncludeBlocks(false);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Give your template a name");
      return;
    }
    setBusy(true);
    try {
      const t = create({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        style: theme.mode === "dark" ? "dark" : "light",
        theme,
        blocks: includeBlocks ? blocks : undefined,
      });
      toast.success(`Saved "${t.name}"`);
      onSaved?.(t);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>
            Bundle the current design (and optionally your blocks) into a reusable template you can
            apply to other pages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Studio Portfolio"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — what makes this template useful?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategoryId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-tags">Tags</Label>
              <Input
                id="tpl-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma, separated"
              />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-md border p-3">
            <div className="min-w-0 pr-3">
              <div className="text-sm font-medium">Include current blocks</div>
              <div className="text-xs text-muted-foreground">
                Save {blocks.length} block{blocks.length === 1 ? "" : "s"} as starter content.
              </div>
            </div>
            <Switch checked={includeBlocks} onCheckedChange={setIncludeBlocks} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
