import { useState } from "react";
import { Palette, Type, Ruler, Square, Sparkles, RotateCcw, Moon, Sun, Monitor } from "lucide-react";
import { useBuilderStore } from "../store";
import {
  DEFAULT_THEME, THEME_PRESETS, type PageTheme, type ThemeMode,
  type ThemePresetId,
} from "../theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/** Global theme editor — presets, colors, typography, spacing, card, mode. */
export function ThemePanel() {
  const theme = useBuilderStore((s) => s.content.theme) ?? DEFAULT_THEME;
  const patch = useBuilderStore((s) => s.patchTheme);
  const patchColors = useBuilderStore((s) => s.patchThemeColors);
  const patchType = useBuilderStore((s) => s.patchThemeTypography);
  const patchSpace = useBuilderStore((s) => s.patchThemeSpacing);
  const patchCard = useBuilderStore((s) => s.patchThemeCard);
  const applyPreset = useBuilderStore((s) => s.applyThemePreset);
  const resetColors = useBuilderStore((s) => s.resetThemeColors);
  const resetType = useBuilderStore((s) => s.resetThemeTypography);
  const resetSpace = useBuilderStore((s) => s.resetThemeSpacing);
  const resetCard = useBuilderStore((s) => s.resetThemeCard);
  const resetAll = useBuilderStore((s) => s.resetThemeAll);

  const [tab, setTab] = useState("presets");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Theme <span className="text-foreground">· {theme.preset}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={resetAll}>
          <RotateCcw className="h-3 w-3" /> Reset all
        </Button>
      </div>

      <ModeSwitch value={theme.mode} onChange={(mode) => patch({ mode })} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabIcon value="presets" icon={Sparkles} label="Style" />
          <TabIcon value="colors" icon={Palette} label="Color" />
          <TabIcon value="type" icon={Type} label="Type" />
          <TabIcon value="space" icon={Ruler} label="Space" />
          <TabIcon value="card" icon={Square} label="Card" />
        </TabsList>

        <TabsContent value="presets" className="mt-3">
          <PresetsGrid current={theme.preset} onSelect={applyPreset} />
        </TabsContent>

        <TabsContent value="colors" className="mt-3 space-y-3">
          <SectionHead label="Colors" onReset={resetColors} />
          <ColorField label="Background" value={theme.colors.background}
            onChange={(v) => patchColors({ background: v, backgroundSolid: extractSolid(v) ?? theme.colors.backgroundSolid })} />
          <ColorField label="Surface" value={theme.colors.surface} onChange={(v) => patchColors({ surface: v })} />
          <ColorField label="Card" value={theme.colors.card} onChange={(v) => patchColors({ card: v })} />
          <ColorField label="Text" value={theme.colors.text} onChange={(v) => patchColors({ text: v })} />
          <ColorField label="Muted text" value={theme.colors.textMuted} onChange={(v) => patchColors({ textMuted: v })} />
          <ColorField label="Border" value={theme.colors.border} onChange={(v) => patchColors({ border: v })} />
          <ColorField label="Primary" value={theme.colors.primary} onChange={(v) => patchColors({ primary: v })} />
          <ColorField label="Primary text" value={theme.colors.primaryText} onChange={(v) => patchColors({ primaryText: v })} />
          <ColorField label="Secondary" value={theme.colors.secondary} onChange={(v) => patchColors({ secondary: v })} />
          <ColorField label="Accent" value={theme.colors.accent} onChange={(v) => patchColors({ accent: v })} />
          <PalettePresets onPick={(p) => patchColors(p)} />
          <GradientPresets onPick={(g) => patchColors({ background: g.background, backgroundSolid: g.solid })} />
        </TabsContent>

        <TabsContent value="type" className="mt-3 space-y-3">
          <SectionHead label="Typography" onReset={resetType} />
          <FontSelect label="Body font" value={theme.typography.fontFamily}
            onChange={(v) => patchType({ fontFamily: v })} />
          <FontSelect label="Heading font" value={theme.typography.headingFamily}
            onChange={(v) => patchType({ headingFamily: v })} />
          <FontSelect label="Button font" value={theme.typography.buttonFamily}
            onChange={(v) => patchType({ buttonFamily: v })} />
          <NumField label="Base size" min={12} max={20} step={1}
            value={theme.typography.baseSize} suffix="px"
            onChange={(v) => patchType({ baseSize: v })} />
          <NumField label="Line height" min={1} max={2} step={0.05}
            value={theme.typography.lineHeight} suffix=""
            onChange={(v) => patchType({ lineHeight: v })} />
          <NumField label="Letter spacing" min={-0.05} max={0.15} step={0.01}
            value={theme.typography.letterSpacing} suffix="em"
            onChange={(v) => patchType({ letterSpacing: v })} />
          <WeightSelect label="Heading weight" value={theme.typography.headingWeight}
            onChange={(v) => patchType({ headingWeight: v as PageTheme["typography"]["headingWeight"] })}
            values={[400, 500, 600, 700, 800, 900]} />
          <WeightSelect label="Body weight" value={theme.typography.bodyWeight}
            onChange={(v) => patchType({ bodyWeight: v as PageTheme["typography"]["bodyWeight"] })}
            values={[300, 400, 500, 600]} />
        </TabsContent>

        <TabsContent value="space" className="mt-3 space-y-3">
          <SectionHead label="Spacing & Layout" onReset={resetSpace} />
          <NumField label="Page padding X" min={0} max={64} step={2}
            value={theme.spacing.pagePadding} suffix="px"
            onChange={(v) => patchSpace({ pagePadding: v })} />
          <NumField label="Page padding Y" min={0} max={120} step={2}
            value={theme.spacing.pagePaddingY} suffix="px"
            onChange={(v) => patchSpace({ pagePaddingY: v })} />
          <NumField label="Block gap" min={0} max={48} step={1}
            value={theme.spacing.blockGap} suffix="px"
            onChange={(v) => patchSpace({ blockGap: v })} />
          <NumField label="Content width" min={320} max={1200} step={10}
            value={theme.spacing.contentWidth} suffix="px"
            onChange={(v) => patchSpace({ contentWidth: v })} />
          <NumField label="Radius" min={0} max={40} step={1}
            value={theme.spacing.radius} suffix="px"
            onChange={(v) => patchSpace({ radius: v })} />
        </TabsContent>

        <TabsContent value="card" className="mt-3 space-y-3">
          <SectionHead label="Card style" onReset={resetCard} />
          <ColorField label="Card background" value={theme.card.background}
            onChange={(v) => patchCard({ background: v })} />
          <NumField label="Card radius" min={0} max={40} step={1}
            value={theme.card.radius} suffix="px"
            onChange={(v) => patchCard({ radius: v })} />
          <Field label="Border">
            <Select value={theme.card.border} onValueChange={(v) => patchCard({ border: v })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="1px solid var(--border)">Thin</SelectItem>
                <SelectItem value="2px solid var(--border)">Medium</SelectItem>
                <SelectItem value="1px solid rgba(255,255,255,0.6)">Light glow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Shadow">
            <Select value={theme.card.shadow} onValueChange={(v) => patchCard({ shadow: v })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0 1px 2px rgba(0,0,0,0.05)">Subtle</SelectItem>
                <SelectItem value="0 4px 14px -8px rgba(0,0,0,0.15)">Soft</SelectItem>
                <SelectItem value="0 8px 24px -8px rgba(0,0,0,0.25)">Strong</SelectItem>
                <SelectItem value="0 0 24px -4px rgba(59,130,246,0.45)">Glow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumField label="Opacity" min={0.4} max={1} step={0.05}
            value={theme.card.opacity} suffix=""
            onChange={(v) => patchCard({ opacity: v })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────

function TabIcon({ value, icon: Icon, label }: { value: string; icon: typeof Palette; label: string }) {
  return (
    <TabsTrigger value={value} className="flex flex-col gap-0.5 py-1.5 text-[10px]">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </TabsTrigger>
  );
}

function SectionHead({ label, onReset }: { label: string; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold">{label}</div>
      <Button size="sm" variant="ghost" className="h-6 gap-1 text-[11px]" onClick={onReset}>
        <RotateCcw className="h-3 w-3" /> Reset
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ModeSwitch({ value, onChange }: { value: ThemeMode; onChange: (m: ThemeMode) => void }) {
  const items = [
    { v: "light" as const, Icon: Sun, l: "Light" },
    { v: "dark" as const, Icon: Moon, l: "Dark" },
    { v: "auto" as const, Icon: Monitor, l: "Auto" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5">
      {items.map(({ v, Icon, l }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            value === v ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={l}
        >
          <Icon className="h-3.5 w-3.5" />
          {l}
        </button>
      ))}
    </div>
  );
}

function PresetsGrid({ current, onSelect }: { current: string; onSelect: (id: ThemePresetId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className={cn(
            "group relative overflow-hidden rounded-lg border p-0 text-left transition-all hover:border-primary",
            current === p.id && "ring-2 ring-primary",
          )}
        >
          <div
            className="h-16 w-full"
            style={{ background: p.theme.colors.background }}
          >
            <div className="flex h-full items-end gap-1 p-2">
              <span className="h-2 w-2 rounded-full" style={{ background: p.theme.colors.primary }} />
              <span className="h-2 w-2 rounded-full" style={{ background: p.theme.colors.accent }} />
              <span className="h-2 w-2 rounded-full" style={{ background: p.theme.colors.text }} />
            </div>
          </div>
          <div className="p-2">
            <div className="text-xs font-semibold">{p.label}</div>
            <div className="line-clamp-1 text-[10px] text-muted-foreground">{p.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const solid = extractSolid(value) ?? "#ffffff";
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#/.test(solid) ? solid : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded border bg-transparent"
          aria-label={`${label} color`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8" />
      </div>
    </Field>
  );
}

function NumField({
  label, min, max, step, value, suffix, onChange,
}: {
  label: string; min: number; max: number; step: number;
  value: number; suffix: string; onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Slider value={[value]} min={min} max={max} step={step} className="flex-1"
          onValueChange={(v) => onChange(v[0])} />
        <div className="w-16 shrink-0">
          <Input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-8 text-xs"
          />
        </div>
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </Field>
  );
}

const FONT_OPTIONS = [
  { label: "Inter (sans)", value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: "System UI", value: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
  { label: "Serif (Georgia)", value: 'Georgia, "Times New Roman", serif' },
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", Georgia, serif' },
  { label: "Playfair Display", value: '"Playfair Display", Georgia, serif' },
  { label: "Mono", value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' },
  { label: "Rounded", value: '"SF Pro Rounded", "Inter", system-ui, sans-serif' },
];

function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const match = FONT_OPTIONS.find((f) => f.value === value);
  return (
    <Field label={label}>
      <Select value={match?.value ?? value} onValueChange={onChange}>
        <SelectTrigger className="h-8"><SelectValue placeholder="Select font" /></SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((f) => (
            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function WeightSelect({
  label, value, onChange, values,
}: { label: string; value: number; onChange: (v: number) => void; values: number[] }) {
  return (
    <Field label={label}>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
        <SelectContent>
          {values.map((w) => (
            <SelectItem key={w} value={String(w)}>{w}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const PALETTE_PRESETS = [
  { name: "Mono", primary: "#0b0b0f", accent: "#3b82f6", secondary: "#f1f5f9" },
  { name: "Ocean", primary: "#0369a1", accent: "#06b6d4", secondary: "#e0f2fe" },
  { name: "Forest", primary: "#14532d", accent: "#84cc16", secondary: "#dcfce7" },
  { name: "Sunset", primary: "#c2410c", accent: "#f59e0b", secondary: "#fef3c7" },
  { name: "Berry", primary: "#7c3aed", accent: "#ec4899", secondary: "#f3e8ff" },
  { name: "Slate", primary: "#334155", accent: "#0ea5e9", secondary: "#f1f5f9" },
];
function PalettePresets({ onPick }: { onPick: (p: { primary: string; accent: string; secondary: string }) => void }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">Palette presets</div>
      <div className="grid grid-cols-3 gap-2">
        {PALETTE_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onPick(p)}
            className="rounded-md border p-1.5 text-left transition-colors hover:border-primary"
            title={p.name}
          >
            <div className="flex gap-1">
              <span className="h-4 w-4 rounded" style={{ background: p.primary }} />
              <span className="h-4 w-4 rounded" style={{ background: p.accent }} />
              <span className="h-4 w-4 rounded border" style={{ background: p.secondary }} />
            </div>
            <div className="mt-1 text-[10px]">{p.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const GRADIENT_PRESETS = [
  { name: "Peach",  background: "linear-gradient(180deg,#ffd5c2,#fff5ea)", solid: "#ffe8d6" },
  { name: "Sky",    background: "linear-gradient(180deg,#dbeafe,#f0f9ff)", solid: "#dbeafe" },
  { name: "Mint",   background: "linear-gradient(180deg,#a7f3d0,#ecfdf5)", solid: "#a7f3d0" },
  { name: "Violet", background: "linear-gradient(135deg,#a5b4fc,#f0abfc)", solid: "#c4b5fd" },
  { name: "Night",  background: "radial-gradient(circle at 30% 20%,#3d0066,#0a0018)", solid: "#0a0018" },
  { name: "Fire",   background: "linear-gradient(180deg,#ff5f6d,#ffc371)", solid: "#ff8b6b" },
];
function GradientPresets({ onPick }: { onPick: (g: { background: string; solid: string }) => void }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">Backgrounds</div>
      <div className="grid grid-cols-3 gap-2">
        {GRADIENT_PRESETS.map((g) => (
          <button
            key={g.name}
            type="button"
            onClick={() => onPick(g)}
            className="h-10 rounded-md border transition-transform hover:scale-[1.02]"
            style={{ background: g.background }}
            title={g.name}
            aria-label={g.name}
          />
        ))}
      </div>
    </div>
  );
}

/** Extract a hex color from a solid value; returns null for gradients. */
function extractSolid(v: string): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  return null;
}
