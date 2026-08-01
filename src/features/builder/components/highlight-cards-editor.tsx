import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageField } from "./image-field";
import { HIGHLIGHT_PRESETS } from "../highlight-presets";
import { newId, type HighlightCard, type HighlightCardsBlock } from "../types";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Sel({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ColorField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
}) {
  return (
    <F label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value && value.startsWith("#") ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border bg-transparent"
          aria-label={label}
        />
        <Input
          value={value ?? ""}
          placeholder={placeholder ?? "Theme default"}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      </div>
    </F>
  );
}

export function HighlightCardsEditor({
  block,
  set,
}: {
  block: HighlightCardsBlock;
  set: (k: string, v: unknown) => void;
}) {
  const cards = block.cards ?? [];
  const [openId, setOpenId] = useState<string | null>(cards[0]?.id ?? null);

  function setCards(next: HighlightCard[]) {
    set("cards", next);
  }
  function patchCard(id: string, patch: Partial<HighlightCard>) {
    setCards(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function addCard() {
    const c: HighlightCard = {
      id: newId(),
      iconKind: "emoji",
      emoji: "✨",
      title: "New card",
      description: "",
    };
    setCards([...cards, c]);
    setOpenId(c.id);
  }
  function duplicateCard(id: string) {
    const i = cards.findIndex((c) => c.id === id);
    if (i < 0) return;
    const copy = { ...cards[i], id: newId() };
    setCards([...cards.slice(0, i + 1), copy, ...cards.slice(i + 1)]);
  }
  function moveCard(id: string, dir: -1 | 1) {
    const i = cards.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[i], next[j]] = [next[j], next[i]];
    setCards(next);
  }
  function removeCard(id: string) {
    setCards(cards.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-3">
      {/* ── Presets ───────────────────────────────────────────── */}
      <div className="rounded-md border bg-muted/30 p-2">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Ready-made presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HIGHLIGHT_PRESETS.map((p) => (
            <Button
              key={p.key}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              title={p.description}
              onClick={() => {
                const cfg = p.apply();
                for (const [k, v] of Object.entries(cfg)) set(k, v);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Section ───────────────────────────────────────────── */}
      <F label="Section title">
        <Input
          value={block.title ?? ""}
          placeholder="Optional"
          onChange={(e) => set("title", e.target.value)}
        />
      </F>
      <F label="Subtitle">
        <Input
          value={block.subtitle ?? ""}
          placeholder="Optional"
          onChange={(e) => set("subtitle", e.target.value)}
        />
      </F>
      <F label="Layout">
        <Sel
          value={block.layout ?? "grid"}
          onChange={(v) => set("layout", v)}
          options={[
            ["scroll", "Horizontal scroll"],
            ["grid", "Wrap grid"],
            ["centered", "Centered"],
            ["carousel", "Carousel"],
            ["masonry", "Masonry"],
          ]}
        />
      </F>
      <div className="grid grid-cols-3 gap-2">
        <F label="Cols · desktop">
          <Input
            type="number"
            min={1}
            max={6}
            value={block.columns ?? 3}
            onChange={(e) => set("columns", Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
          />
        </F>
        <F label="Tablet">
          <Input
            type="number"
            min={1}
            max={4}
            value={block.columnsTablet ?? 2}
            onChange={(e) =>
              set("columnsTablet", Math.max(1, Math.min(4, Number(e.target.value) || 1)))
            }
          />
        </F>
        <F label="Mobile">
          <Input
            type="number"
            min={1}
            max={3}
            value={block.columnsMobile ?? 1}
            onChange={(e) =>
              set("columnsMobile", Math.max(1, Math.min(3, Number(e.target.value) || 1)))
            }
          />
        </F>
      </div>
      {(block.layout ?? "grid") === "carousel" && (
        <div className="space-y-2 rounded-md border p-2.5">
          <div className="text-xs font-medium">Carousel</div>
          <Toggle
            label="Infinite loop"
            checked={block.carouselLoop !== false}
            onChange={(v) => set("carouselLoop", v)}
          />
          <Toggle
            label="Swipe / drag"
            checked={block.carouselDrag !== false}
            onChange={(v) => set("carouselDrag", v)}
          />
          <Toggle
            label="Show arrows"
            checked={block.carouselArrows !== false}
            onChange={(v) => set("carouselArrows", v)}
          />
          <Toggle
            label="Show pagination dots"
            checked={block.carouselDots !== false}
            onChange={(v) => set("carouselDots", v)}
          />
          <Toggle
            label="Keyboard arrows"
            checked={block.carouselKeyboard !== false}
            onChange={(v) => set("carouselKeyboard", v)}
          />
          <Toggle
            label="Mouse wheel"
            checked={block.carouselWheel === true}
            onChange={(v) => set("carouselWheel", v)}
          />
          <Toggle
            label="Autoplay"
            checked={block.carouselAutoplay === true}
            onChange={(v) => set("carouselAutoplay", v)}
          />
          {block.carouselAutoplay === true && (
            <>
              <F label="Autoplay speed (ms)">
                <Input
                  type="number"
                  min={1000}
                  max={15000}
                  step={250}
                  value={block.carouselAutoplayDelay ?? 4000}
                  onChange={(e) =>
                    set(
                      "carouselAutoplayDelay",
                      Math.max(1000, Math.min(15000, Number(e.target.value) || 4000)),
                    )
                  }
                />
              </F>
              <Toggle
                label="Pause on hover"
                checked={block.carouselPauseOnHover !== false}
                onChange={(v) => set("carouselPauseOnHover", v)}
              />
              <Toggle
                label="Pause on touch"
                checked={block.carouselPauseOnTouch !== false}
                onChange={(v) => set("carouselPauseOnTouch", v)}
              />
            </>
          )}
          <F label="Animation speed (lower = faster)">
            <Input
              type="number"
              min={8}
              max={80}
              value={block.carouselSpeed ?? 28}
              onChange={(e) =>
                set("carouselSpeed", Math.max(8, Math.min(80, Number(e.target.value) || 28)))
              }
            />
          </F>
        </div>
      )}
      <div className="flex items-center justify-between rounded-md border p-2">
        <div className="min-w-0 pr-2">
          <div className="text-xs font-medium">Swipe on mobile</div>
          <div className="text-[10px] text-muted-foreground">
            Many cards scroll horizontally on small screens
          </div>
        </div>
        <Switch
          checked={block.mobileScroll !== false}
          onCheckedChange={(v) => set("mobileScroll", v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <F label="Gap">
          <Sel
            value={block.gap ?? "md"}
            onChange={(v) => set("gap", v)}
            options={[
              ["sm", "Small"],
              ["md", "Medium"],
              ["lg", "Large"],
            ]}
          />
        </F>
        <F label="Content align">
          <Sel
            value={block.align ?? "center"}
            onChange={(v) => set("align", v)}
            options={[
              ["center", "Center"],
              ["left", "Left"],
            ]}
          />
        </F>
      </div>

      {/* ── Card style ────────────────────────────────────────── */}
      <div className="rounded-md border p-2">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Card design</div>
        <div className="space-y-2">
          <F label="Background">
            <Sel
              value={block.cardStyle ?? "solid"}
              onChange={(v) => set("cardStyle", v)}
              options={[
                ["solid", "Solid"],
                ["gradient", "Gradient"],
                ["glass", "Glass"],
                ["outline", "Transparent / outline"],
              ]}
            />
          </F>
          {(block.cardStyle ?? "solid") === "gradient" ? (
            <div className="grid grid-cols-2 gap-2">
              <ColorField
                label="From"
                value={block.gradientFrom ?? "#6366f1"}
                onChange={(v) => set("gradientFrom", v)}
              />
              <ColorField
                label="To"
                value={block.gradientTo ?? "#ec4899"}
                onChange={(v) => set("gradientTo", v)}
              />
            </div>
          ) : (
            <ColorField
              label="Card colour"
              value={block.bgColor}
              onChange={(v) => set("bgColor", v)}
            />
          )}
          <ColorField
            label="Text colour"
            value={block.textColor}
            onChange={(v) => set("textColor", v)}
          />
          <div className="flex items-center justify-between rounded-md border p-2">
            <span className="text-xs font-medium">Border</span>
            <Switch
              checked={block.border !== false}
              onCheckedChange={(v) => set("border", v)}
            />
          </div>
          {block.border !== false && (
            <ColorField
              label="Border colour"
              value={block.borderColor}
              onChange={(v) => set("borderColor", v)}
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <F label="Radius (px)">
              <Input
                type="number"
                min={0}
                max={60}
                value={block.radius ?? 16}
                onChange={(e) =>
                  set("radius", Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                }
              />
            </F>
            <F label="Icon size (px)">
              <Input
                type="number"
                min={12}
                max={96}
                value={block.iconSize ?? 34}
                onChange={(e) =>
                  set("iconSize", Math.max(12, Math.min(96, Number(e.target.value) || 12)))
                }
              />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Shadow">
              <Sel
                value={block.shadow ?? "md"}
                onChange={(v) => set("shadow", v)}
                options={[
                  ["none", "None"],
                  ["sm", "Small"],
                  ["md", "Medium"],
                  ["lg", "Large"],
                  ["xl", "XL"],
                ]}
              />
            </F>
            <F label="Hover effect">
              <Sel
                value={block.hover ?? "lift"}
                onChange={(v) => set("hover", v)}
                options={[
                  ["none", "None"],
                  ["lift", "Lift"],
                  ["scale", "Scale"],
                  ["glow", "Glow"],
                  ["shadow", "Shadow"],
                  ["border", "Border"],
                  ["tilt", "Tilt"],
                  ["pulse", "Pulse"],
                ]}
              />
            </F>
          </div>
          <F label="Entrance animation">
            <Sel
              value={block.animation ?? "fade-up"}
              onChange={(v) => set("animation", v)}
              options={[
                ["none", "None"],
                ["fade", "Fade"],
                ["fade-up", "Fade up"],
                ["fade-down", "Fade down"],
                ["zoom-in", "Zoom in"],
                ["slide-up", "Slide up"],
                ["flip", "Flip"],
                ["bounce", "Bounce"],
              ]}
            />
          </F>
        </div>
      </div>

      {/* ── Cards ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Cards ({cards.length})
        </span>
        <Button type="button" size="sm" variant="outline" className="h-7" onClick={addCard}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add card
        </Button>
      </div>

      <div className="space-y-2">
        {cards.map((c, i) => {
          const open = openId === c.id;
          const kind = c.iconKind ?? "emoji";
          return (
            <div key={c.id} className="rounded-md border">
              <div className="flex items-center gap-1 p-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-xs font-medium"
                  onClick={() => setOpenId(open ? null : c.id)}
                >
                  {c.emoji ? `${c.emoji} ` : ""}
                  {c.title || `Card ${i + 1}`}
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => moveCard(c.id, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Move down"
                  disabled={i === cards.length - 1}
                  onClick={() => moveCard(c.id, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Duplicate card"
                  onClick={() => duplicateCard(c.id)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Delete card"
                  onClick={() => removeCard(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              {open && (
                <div className="space-y-2 border-t p-2">
                  <F label="Icon type">
                    <Sel
                      value={kind}
                      onChange={(v) => patchCard(c.id, { iconKind: v as HighlightCard["iconKind"] })}
                      options={[
                        ["none", "None"],
                        ["emoji", "Emoji"],
                        ["svg", "SVG code"],
                        ["image", "Uploaded image"],
                      ]}
                    />
                  </F>
                  {kind === "emoji" && (
                    <F label="Emoji">
                      <Input
                        value={c.emoji ?? ""}
                        placeholder="💳"
                        onChange={(e) => patchCard(c.id, { emoji: e.target.value })}
                      />
                    </F>
                  )}
                  {kind === "svg" && (
                    <F label="SVG code">
                      <Textarea
                        rows={4}
                        className="font-mono text-[11px]"
                        value={c.svg ?? ""}
                        placeholder="<svg viewBox='0 0 24 24'>…</svg>"
                        onChange={(e) => patchCard(c.id, { svg: e.target.value })}
                      />
                    </F>
                  )}
                  {kind === "image" && (
                    <ImageField
                      label="Icon image"
                      value={c.imageUrl ?? ""}
                      onChange={(v) => patchCard(c.id, { imageUrl: v })}
                      pickerTitle="Choose card icon"
                    />
                  )}
                  <F label="Title">
                    <Input
                      value={c.title ?? ""}
                      onChange={(e) => patchCard(c.id, { title: e.target.value })}
                    />
                  </F>
                  <F label="Description (optional)">
                    <Textarea
                      rows={2}
                      value={c.description ?? ""}
                      onChange={(e) => patchCard(c.id, { description: e.target.value })}
                    />
                  </F>
                  <F label="Link (optional)">
                    <Input
                      value={c.url ?? ""}
                      placeholder="https://"
                      onChange={(e) => patchCard(c.id, { url: e.target.value })}
                    />
                  </F>
                  <div className="grid grid-cols-2 gap-2">
                    <ColorField
                      label="Card colour"
                      value={c.bgColor}
                      onChange={(v) => patchCard(c.id, { bgColor: v })}
                      placeholder="Section default"
                    />
                    <ColorField
                      label="Text colour"
                      value={c.textColor}
                      onChange={(v) => patchCard(c.id, { textColor: v })}
                      placeholder="Section default"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
