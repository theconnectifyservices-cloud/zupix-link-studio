import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SocialBlock,
  SocialColorMode,
  SocialIconAnimation,
  SocialIconHover,
  SocialIconLabels,
  SocialIconShape,
  SocialIconStyle,
  SocialLink,
  SocialPlatform,
  TextAlign,
} from "../types";
import { newId } from "../types";
import { SocialIconsRender } from "./social-icons-render";
import { RendererModeProvider } from "../renderer-mode";

const PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "threads",
  "linkedin",
  "pinterest",
  "telegram",
  "whatsapp",
  "github",
  "twitter",
  "website",
  "custom",
];

const STYLES: [SocialIconStyle, string][] = [
  ["minimal", "Minimal"],
  ["glass", "Glass"],
  ["gradient", "Gradient"],
  ["filled", "Filled"],
  ["outline", "Outline"],
  ["neon", "Neon"],
  ["luxury", "Luxury"],
  ["corporate", "Corporate"],
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
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

function NumberSlider({
  label,
  value,
  min,
  max,
  suffix = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
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
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SocialIconsEditor({
  block,
  set,
}: {
  block: SocialBlock;
  set: (key: string, value: unknown) => void;
}) {
  const links = block.links ?? [];
  const colorMode: SocialColorMode = block.colorMode ?? "brand";

  function updateLinks(next: SocialLink[]) {
    set("links", next);
  }
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= links.length) return;
    const next = [...links];
    const [item] = next.splice(i, 1);
    next.splice(t, 0, item);
    updateLinks(next);
  }

  return (
    <div className="space-y-4">
      {/* Live preview */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Live preview</Label>
        <div className="rounded-lg border bg-muted/30 p-4">
          <RendererModeProvider mode="public">
            <SocialIconsRender block={block} />
          </RendererModeProvider>
        </div>
      </div>

      <Row label="Style">
        <Choice
          value={block.iconStyle ?? "minimal"}
          onChange={(v) => set("iconStyle", v)}
          options={STYLES}
        />
      </Row>

      <Row label="Shape">
        <Choice<SocialIconShape>
          value={block.shape ?? "circle"}
          onChange={(v) => set("shape", v)}
          options={[
            ["circle", "Circle"],
            ["rounded", "Rounded"],
            ["square", "Square"],
          ]}
        />
      </Row>

      <NumberSlider
        label="Icon size"
        value={block.iconSize ?? 18}
        min={12}
        max={48}
        onChange={(v) => set("iconSize", v)}
      />
      <NumberSlider
        label="Spacing"
        value={block.spacing ?? 12}
        min={0}
        max={48}
        onChange={(v) => set("spacing", v)}
      />
      {(block.shape ?? "circle") === "rounded" && (
        <NumberSlider
          label="Border radius"
          value={block.radius ?? 14}
          min={0}
          max={32}
          onChange={(v) => set("radius", v)}
        />
      )}

      <div className="grid gap-2">
        <Toggle
          label="Shadow"
          checked={block.shadow !== false}
          onChange={(v) => set("shadow", v)}
        />
        <Toggle label="Glow" checked={block.glow === true} onChange={(v) => set("glow", v)} />
      </div>

      <Row label="Colour mode">
        <Choice<SocialColorMode>
          value={colorMode}
          onChange={(v) => set("colorMode", v)}
          options={[
            ["brand", "Official brand colours"],
            ["custom", "Custom colour"],
          ]}
        />
      </Row>

      {colorMode === "custom" && (
        <Row label="Custom colour">
          <div className="flex items-center gap-2">
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={block.customColor ?? "#6366f1"}
              onChange={(e) => set("customColor", e.target.value)}
            />
            <Input
              value={block.customColor ?? "#6366f1"}
              onChange={(e) => set("customColor", e.target.value)}
            />
          </div>
        </Row>
      )}

      <Row label="Animation">
        <Choice<SocialIconAnimation>
          value={block.animation ?? "none"}
          onChange={(v) => set("animation", v)}
          options={[
            ["none", "None"],
            ["float", "Float"],
            ["pulse", "Pulse"],
            ["bounce", "Bounce"],
            ["scale", "Scale"],
            ["rotate", "Rotate"],
          ]}
        />
      </Row>

      <Row label="Labels">
        <Choice<SocialIconLabels>
          value={block.labels ?? "hidden"}
          onChange={(v) => set("labels", v)}
          options={[
            ["hidden", "Hidden"],
            ["always", "Always"],
            ["hover", "On hover"],
          ]}
        />
      </Row>

      <Row label="Hover effect">
        <Choice<SocialIconHover>
          value={block.hoverEffect ?? "lift"}
          onChange={(v) => set("hoverEffect", v)}
          options={[
            ["lift", "Lift"],
            ["glow", "Glow"],
            ["fill", "Fill"],
            ["rotate", "Rotate"],
            ["scale", "Scale"],
            ["none", "None"],
          ]}
        />
      </Row>

      <Row label="Alignment">
        <Choice<TextAlign>
          value={block.align ?? "center"}
          onChange={(v) => set("align", v)}
          options={[
            ["left", "Left"],
            ["center", "Center"],
            ["right", "Right"],
          ]}
        />
      </Row>

      {/* Links */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs">Social links</Label>
        {links.map((l, i) => (
          <div key={l.id} className="space-y-1.5 rounded-md border p-2">
            <div className="flex items-center gap-1.5">
              <Select
                value={l.platform}
                onValueChange={(v) => {
                  const next = [...links];
                  next[i] = { ...l, platform: v as SocialPlatform };
                  updateLinks(next);
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={l.url}
                placeholder="https://…"
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...l, url: e.target.value };
                  updateLinks(next);
                }}
              />
            </div>
            <Input
              value={l.label ?? ""}
              placeholder="Label (optional)"
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...l, label: e.target.value || undefined };
                updateLinks(next);
              }}
            />
            <div className="flex items-center justify-end gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move up"
                onClick={() => move(i, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move down"
                onClick={() => move(i, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => updateLinks(links.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            updateLinks([...links, { id: newId(), platform: "instagram", url: "" }])
          }
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add link
        </Button>
      </div>
    </div>
  );
}
