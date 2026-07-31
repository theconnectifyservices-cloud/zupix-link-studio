import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  mergeCcDesign,
  type CcAlign,
  type CcAnimation,
  type CcBreakpointDesign,
  type CcDesign,
  type CcHover,
} from "@/features/custom-code/design";

interface Props {
  design?: CcDesign;
  onChange: (design: CcDesign) => void;
}

const ANIMATIONS: { value: CcAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "shine", label: "Shine Loop" },
  { value: "glow", label: "Glow" },
  { value: "pulse", label: "Pulse" },
  { value: "float", label: "Float" },
  { value: "bounce", label: "Bounce" },
  { value: "fade", label: "Fade" },
  { value: "zoom", label: "Zoom" },
  { value: "slide", label: "Slide" },
];

const HOVERS: { value: CcHover; label: string }[] = [
  { value: "none", label: "None" },
  { value: "lift", label: "Lift" },
  { value: "grow", label: "Grow" },
  { value: "shrink", label: "Shrink" },
  { value: "glow", label: "Glow" },
  { value: "brighten", label: "Brighten" },
  { value: "shadow", label: "Shadow" },
  { value: "tilt", label: "Tilt" },
  { value: "underline", label: "Underline" },
];

function NumField({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  suffix = "px",
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {value ?? 0}
          {suffix}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value ?? 0]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
          aria-label={label}
        />
        <Input
          className="h-8 min-w-0 text-xs"
          value={value ?? ""}
          placeholder="transparent / #fff / linear-gradient(...)"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/** Layout + button controls that differ between desktop and mobile. */
function BreakpointControls({
  bp,
  patch,
}: {
  bp: CcBreakpointDesign;
  patch: (p: Partial<CcBreakpointDesign>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Alignment</Label>
        <ToggleGroup
          type="single"
          value={bp.align ?? "center"}
          onValueChange={(v) => v && patch({ align: v as CcAlign })}
          className="justify-start"
        >
          <ToggleGroupItem value="left" className="h-8 px-3 text-xs">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="center" className="h-8 px-3 text-xs">
            Center
          </ToggleGroupItem>
          <ToggleGroupItem value="right" className="h-8 px-3 text-xs">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Input
            className="h-8 text-xs"
            value={bp.width ?? "100%"}
            placeholder="100% / 480px"
            onChange={(e) => patch({ width: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Height</Label>
          <Input
            className="h-8 text-xs"
            value={bp.height ?? "auto"}
            placeholder="auto / 240px"
            onChange={(e) => patch({ height: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumField
          label="Padding Y"
          value={bp.paddingY}
          onChange={(v) => patch({ paddingY: v })}
          max={120}
        />
        <NumField
          label="Padding X"
          value={bp.paddingX}
          onChange={(v) => patch({ paddingX: v })}
          max={120}
        />
        <NumField
          label="Margin Y"
          value={bp.marginY}
          onChange={(v) => patch({ marginY: v })}
          max={120}
        />
        <NumField
          label="Margin X"
          value={bp.marginX}
          onChange={(v) => patch({ marginX: v })}
          max={120}
        />
      </div>

      <NumField
        label="Base font size"
        value={bp.fontSize ?? 0}
        onChange={(v) => patch({ fontSize: v || undefined })}
        max={72}
      />
    </div>
  );
}

function ButtonControls({
  bp,
  patch,
  design,
  set,
}: {
  bp: CcBreakpointDesign;
  patch: (p: Partial<CcBreakpointDesign>) => void;
  design: CcDesign;
  set: (p: Partial<CcDesign>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Button width</Label>
          <Input
            className="h-8 text-xs"
            value={bp.buttonWidth ?? "auto"}
            placeholder="auto / 100% / 220px"
            onChange={(e) => patch({ buttonWidth: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Button height</Label>
          <Input
            className="h-8 text-xs"
            value={bp.buttonHeight ?? "auto"}
            placeholder="auto / 48px"
            onChange={(e) => patch({ buttonHeight: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Icon position</Label>
        <Select
          value={design.iconPosition ?? "left"}
          onValueChange={(v) => set({ iconPosition: v as CcDesign["iconPosition"] })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="none">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumField
          label="Icon size"
          value={bp.iconSize}
          onChange={(v) => patch({ iconSize: v })}
          max={72}
        />
        <NumField label="Gap" value={bp.gap} onChange={(v) => patch({ gap: v })} max={64} />
      </div>

      <NumField
        label="Button font size"
        value={bp.buttonFontSize ?? 0}
        onChange={(v) => patch({ buttonFontSize: v || undefined })}
        max={48}
      />

      <div className="grid grid-cols-1 gap-3">
        <ColorField
          label="Button background"
          value={design.buttonBackground}
          onChange={(v) => set({ buttonBackground: v })}
        />
        <ColorField
          label="Button text"
          value={design.buttonTextColor}
          onChange={(v) => set({ buttonTextColor: v })}
        />
        <NumField
          label="Button radius"
          value={design.buttonRadius ?? 0}
          onChange={(v) => set({ buttonRadius: v })}
          max={80}
        />
      </div>
    </div>
  );
}

/**
 * Visual HTML Builder controls — everything a user would otherwise
 * hand-write as CSS, exposed as inputs with desktop/mobile variants.
 */
export function CustomCodeVisualControls({ design, onChange }: Props) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const d = mergeCcDesign(design);
  const bp = device === "desktop" ? d.desktop : d.mobile;

  const set = (p: Partial<CcDesign>) => onChange({ ...d, ...p });
  const patch = (p: Partial<CcBreakpointDesign>) =>
    onChange({ ...d, [device]: { ...bp, ...p } });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2">
        <ToggleGroup
          type="single"
          value={device}
          onValueChange={(v) => v && setDevice(v as typeof device)}
        >
          <ToggleGroupItem value="desktop" className="h-8 px-3 text-xs">
            <Monitor className="mr-1 h-3.5 w-3.5" /> Desktop
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" className="h-8 px-3 text-xs">
            <Smartphone className="mr-1 h-3.5 w-3.5" /> Mobile
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Label className="text-[11px] text-muted-foreground">Visual styles</Label>
          <Switch
            checked={d.enabled !== false}
            onCheckedChange={(v) => set({ enabled: v })}
            aria-label="Enable visual styles"
          />
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["layout"]} className="w-full">
        <AccordionItem value="layout">
          <AccordionTrigger className="text-xs font-semibold">Layout</AccordionTrigger>
          <AccordionContent>
            <BreakpointControls bp={bp} patch={patch} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="style">
          <AccordionTrigger className="text-xs font-semibold">Style</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <ColorField
              label="Background"
              value={d.background}
              onChange={(v) => set({ background: v })}
            />
            <ColorField
              label="Text color"
              value={d.textColor}
              onChange={(v) => set({ textColor: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Border style</Label>
                <Select
                  value={d.borderStyle ?? "none"}
                  onValueChange={(v) => set({ borderStyle: v as CcDesign["borderStyle"] })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Shadow</Label>
                <Select
                  value={d.shadow ?? "none"}
                  onValueChange={(v) => set({ shadow: v as CcDesign["shadow"] })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra large</SelectItem>
                    <SelectItem value="glow">Glow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {d.borderStyle && d.borderStyle !== "none" && (
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  label="Border width"
                  value={d.borderWidth ?? 1}
                  onChange={(v) => set({ borderWidth: v })}
                  max={20}
                />
                <ColorField
                  label="Border color"
                  value={d.borderColor}
                  onChange={(v) => set({ borderColor: v })}
                />
              </div>
            )}
            <NumField
              label="Corner radius"
              value={d.radius ?? 0}
              onChange={(v) => set({ radius: v })}
              max={80}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="buttons">
          <AccordionTrigger className="text-xs font-semibold">Buttons &amp; icons</AccordionTrigger>
          <AccordionContent>
            <ButtonControls bp={bp} patch={patch} design={d} set={set} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="motion">
          <AccordionTrigger className="text-xs font-semibold">Animation &amp; hover</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Animation preset</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ANIMATIONS.map((a) => (
                  <Button
                    key={a.value}
                    type="button"
                    size="sm"
                    variant={(d.animation ?? "none") === a.value ? "default" : "outline"}
                    className="h-8 text-[11px]"
                    onClick={() => set({ animation: a.value })}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Duration"
                value={d.animationDuration ?? 2}
                onChange={(v) => set({ animationDuration: v })}
                min={1}
                max={20}
                suffix="s"
              />
              <NumField
                label="Delay"
                value={d.animationDelay ?? 0}
                onChange={(v) => set({ animationDelay: v })}
                max={10}
                suffix="s"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hover effect</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {HOVERS.map((h) => (
                  <Button
                    key={h.value}
                    type="button"
                    size="sm"
                    variant={(d.hover ?? "none") === h.value ? "default" : "outline"}
                    className="h-8 text-[11px]"
                    onClick={() => set({ hover: h.value })}
                  >
                    {h.label}
                  </Button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="responsive">
          <AccordionTrigger className="text-xs font-semibold">Responsive visibility</AccordionTrigger>
          <AccordionContent className="space-y-2">
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-xs">Hide on mobile</Label>
              <Switch
                checked={!!d.hideOnMobile}
                onCheckedChange={(v) => set({ hideOnMobile: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-xs">Hide on desktop</Label>
              <Switch
                checked={!!d.hideOnDesktop}
                onCheckedChange={(v) => set({ hideOnDesktop: v })}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Layout, spacing and button sizes are stored separately for desktop and mobile — switch
              the device toggle above to edit each.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
