import { useEffect, useState } from "react";
import {
  Palette,
  Type,
  Ruler,
  Square,
  Sparkles,
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  MousePointer2,
  ImageIcon,
  UserCircle2,
  Plus,
  X,
  Zap,
} from "lucide-react";
import { useBuilderStore } from "../store";
import {
  BACKGROUND_PATTERNS,
  DEFAULT_THEME,
  DEFAULT_PROFILE,
  DEFAULT_BUTTONS,
  DEFAULT_BACKGROUND,
  GOOGLE_FONTS,
  THEME_PRESETS,
  ensureGoogleFont,
  type BackgroundKind,
  type ButtonShapeId,
  type ButtonVariantId,
  type IconPositionId,
  type PageTheme,
  type ThemeMode,
  type ThemePresetId,
} from "../theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Live Design Studio — LS-07B.
 *
 * Every control here patches the page theme in the builder store, which
 * cascades into CSS variables on the preview root. No refresh; changes
 * appear in the mobile preview immediately.
 */
export function ThemePanel() {
  const theme = useBuilderStore((s) => s.content.theme) ?? DEFAULT_THEME;
  const patch = useBuilderStore((s) => s.patchTheme);
  const patchColors = useBuilderStore((s) => s.patchThemeColors);
  const patchType = useBuilderStore((s) => s.patchThemeTypography);
  const patchSpace = useBuilderStore((s) => s.patchThemeSpacing);
  const patchCard = useBuilderStore((s) => s.patchThemeCard);
  const patchButtons = useBuilderStore((s) => s.patchThemeButtons);
  const patchBg = useBuilderStore((s) => s.patchThemeBackground);
  const patchProfile = useBuilderStore((s) => s.patchThemeProfile);
  const patchMotion = useBuilderStore((s) => s.patchThemeMotion);
  const addBrand = useBuilderStore((s) => s.addBrandColor);
  const removeBrand = useBuilderStore((s) => s.removeBrandColor);
  const applyPreset = useBuilderStore((s) => s.applyThemePreset);
  const resetColors = useBuilderStore((s) => s.resetThemeColors);
  const resetType = useBuilderStore((s) => s.resetThemeTypography);
  const resetSpace = useBuilderStore((s) => s.resetThemeSpacing);
  const resetCard = useBuilderStore((s) => s.resetThemeCard);
  const resetButtons = useBuilderStore((s) => s.resetThemeButtons);
  const resetBg = useBuilderStore((s) => s.resetThemeBackground);
  const resetProfile = useBuilderStore((s) => s.resetThemeProfile);
  const resetMotion = useBuilderStore((s) => s.resetThemeMotion);
  const resetAll = useBuilderStore((s) => s.resetThemeAll);

  const [tab, setTab] = useState("presets");
  const buttons = theme.buttons ?? DEFAULT_BUTTONS;
  const bg = theme.background ?? DEFAULT_BACKGROUND;
  const profile = theme.profile ?? DEFAULT_PROFILE;
  const brands = theme.brandColors ?? [];

  // Preload any Google fonts already in the theme once, and each time the
  // user picks a new one via FontSelect (handled inside FontSelect too).
  useEffect(() => {
    (theme.googleFonts ?? []).forEach(ensureGoogleFont);
  }, [theme.googleFonts]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Design Studio <span className="text-foreground">· {theme.preset}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={resetAll}>
          <RotateCcw className="h-3 w-3" /> Reset all
        </Button>
      </div>

      <ModeSwitch value={theme.mode} onChange={(mode) => patch({ mode })} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabIcon value="presets" icon={Sparkles} label="Style" />
          <TabIcon value="colors" icon={Palette} label="Color" />
          <TabIcon value="type" icon={Type} label="Type" />
          <TabIcon value="buttons" icon={MousePointer2} label="Btn" />
        </TabsList>
        <TabsList className="mt-1 grid w-full grid-cols-5">
          <TabIcon value="bg" icon={ImageIcon} label="BG" />
          <TabIcon value="card" icon={Square} label="Card" />
          <TabIcon value="profile" icon={UserCircle2} label="Profile" />
          <TabIcon value="space" icon={Ruler} label="Space" />
          <TabIcon value="motion" icon={Zap} label="Motion" />
        </TabsList>

        <TabsContent value="presets" className="mt-3">
          <PresetsGrid current={theme.preset} onSelect={applyPreset} />
        </TabsContent>

        {/* ── COLOR STUDIO ─────────────────────────────────────────── */}
        <TabsContent value="colors" className="mt-3 space-y-3">
          <SectionHead label="Colors" onReset={resetColors} />
          <ColorField
            label="Background"
            value={theme.colors.background}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) =>
              patchColors({
                background: v,
                backgroundSolid: extractSolid(v) ?? theme.colors.backgroundSolid,
              })
            }
          />
          <ColorField
            label="Surface"
            value={theme.colors.surface}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ surface: v })}
          />
          <ColorField
            label="Card"
            value={theme.colors.card}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ card: v })}
          />
          <ColorField
            label="Text"
            value={theme.colors.text}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ text: v })}
          />
          <ColorField
            label="Muted text"
            value={theme.colors.textMuted}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ textMuted: v })}
          />
          <ColorField
            label="Border"
            value={theme.colors.border}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ border: v })}
          />
          <ColorField
            label="Primary"
            value={theme.colors.primary}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ primary: v })}
          />
          <ColorField
            label="Primary text"
            value={theme.colors.primaryText}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ primaryText: v })}
          />
          <ColorField
            label="Secondary"
            value={theme.colors.secondary}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ secondary: v })}
          />
          <ColorField
            label="Accent"
            value={theme.colors.accent}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ accent: v })}
          />
          <ColorField
            label="Icon"
            value={theme.colors.icon ?? theme.colors.text}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ icon: v })}
          />
          <ColorField
            label="Link"
            value={theme.colors.link ?? theme.colors.accent}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchColors({ link: v })}
          />
          <BrandColors brands={brands} onRemove={removeBrand} />
          <PalettePresets onPick={(p) => patchColors(p)} />
          <GradientPresets
            onPick={(g) => patchColors({ background: g.background, backgroundSolid: g.solid })}
          />
        </TabsContent>

        {/* ── TYPOGRAPHY STUDIO ────────────────────────────────────── */}
        <TabsContent value="type" className="mt-3 space-y-3">
          <SectionHead label="Typography" onReset={resetType} />
          <FontSelect
            label="Body font"
            value={theme.typography.fontFamily}
            onChange={(v) => {
              patchType({ fontFamily: v });
              rememberGoogle(patch, theme, v);
            }}
          />
          <FontSelect
            label="Heading font"
            value={theme.typography.headingFamily}
            onChange={(v) => {
              patchType({ headingFamily: v });
              rememberGoogle(patch, theme, v);
            }}
          />
          <FontSelect
            label="Button font"
            value={theme.typography.buttonFamily}
            onChange={(v) => {
              patchType({ buttonFamily: v });
              rememberGoogle(patch, theme, v);
            }}
          />
          <NumField
            label="Base size"
            min={12}
            max={20}
            step={1}
            value={theme.typography.baseSize}
            suffix="px"
            onChange={(v) => patchType({ baseSize: v })}
          />
          <NumField
            label="Button size"
            min={11}
            max={20}
            step={1}
            value={theme.typography.buttonSize ?? 14}
            suffix="px"
            onChange={(v) => patchType({ buttonSize: v })}
          />
          <NumField
            label="Line height"
            min={1}
            max={2}
            step={0.05}
            value={theme.typography.lineHeight}
            suffix=""
            onChange={(v) => patchType({ lineHeight: v })}
          />
          <NumField
            label="Letter spacing"
            min={-0.05}
            max={0.15}
            step={0.01}
            value={theme.typography.letterSpacing}
            suffix="em"
            onChange={(v) => patchType({ letterSpacing: v })}
          />
          <WeightSelect
            label="Heading weight"
            value={theme.typography.headingWeight}
            onChange={(v) =>
              patchType({ headingWeight: v as PageTheme["typography"]["headingWeight"] })
            }
            values={[400, 500, 600, 700, 800, 900]}
          />
          <WeightSelect
            label="Body weight"
            value={theme.typography.bodyWeight}
            onChange={(v) => patchType({ bodyWeight: v as PageTheme["typography"]["bodyWeight"] })}
            values={[300, 400, 500, 600]}
          />
          <Field label="Text transform">
            <Select
              value={theme.typography.textTransform ?? "none"}
              onValueChange={(v) =>
                patchType({ textTransform: v as PageTheme["typography"]["textTransform"] })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                <SelectItem value="capitalize">Capitalize</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </TabsContent>

        {/* ── BUTTON STUDIO ────────────────────────────────────────── */}
        <TabsContent value="buttons" className="mt-3 space-y-3">
          <SectionHead label="Buttons" onReset={resetButtons} />
          <Field label="Variant">
            <Select
              value={buttons.variant}
              onValueChange={(v) => patchButtons({ variant: v as ButtonVariantId })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="glass">Glass</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Shape">
            <Select
              value={buttons.shape}
              onValueChange={(v) => patchButtons({ shape: v as ButtonShapeId })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pill">Pill</SelectItem>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumField
            label="Height"
            min={32}
            max={80}
            step={1}
            value={buttons.height}
            suffix="px"
            onChange={(v) => patchButtons({ height: v })}
          />
          <NumField
            label="Radius"
            min={0}
            max={40}
            step={1}
            value={buttons.radius}
            suffix="px"
            onChange={(v) => patchButtons({ radius: v })}
          />
          <NumField
            label="Padding X"
            min={8}
            max={40}
            step={1}
            value={buttons.paddingX}
            suffix="px"
            onChange={(v) => patchButtons({ paddingX: v })}
          />
          <NumField
            label="Border width"
            min={0}
            max={4}
            step={1}
            value={buttons.border}
            suffix="px"
            onChange={(v) => patchButtons({ border: v })}
          />
          <Field label="Shadow">
            <Select value={buttons.shadow} onValueChange={(v) => patchButtons({ shadow: v })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0 1px 2px rgba(0,0,0,0.06)">Subtle</SelectItem>
                <SelectItem value="0 4px 14px -6px rgba(0,0,0,0.2)">Soft</SelectItem>
                <SelectItem value="0 10px 24px -8px rgba(0,0,0,0.35)">Strong</SelectItem>
                <SelectItem value="0 0 20px -2px rgba(59,130,246,0.55)">Glow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Icon position">
            <Select
              value={buttons.iconPosition}
              onValueChange={(v) => patchButtons({ iconPosition: v as IconPositionId })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumField
            label="Icon size"
            min={12}
            max={28}
            step={1}
            value={buttons.iconSize}
            suffix="px"
            onChange={(v) => patchButtons({ iconSize: v })}
          />
          <Field label="Alignment">
            <Select
              value={buttons.align}
              onValueChange={(v) =>
                patchButtons({
                  align: v as PageTheme["buttons"] extends infer B
                    ? B extends { align: infer A }
                      ? A
                      : never
                    : never,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="stretch">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </TabsContent>

        {/* ── BACKGROUND STUDIO ────────────────────────────────────── */}
        <TabsContent value="bg" className="mt-3 space-y-3">
          <SectionHead label="Background" onReset={resetBg} />
          <Field label="Kind">
            <Select value={bg.kind} onValueChange={(v) => patchBg({ kind: v as BackgroundKind })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Solid color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
                <SelectItem value="glass">Glass / blur</SelectItem>
                <SelectItem value="video">Video (soon)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {(bg.kind === "color" || bg.kind === "gradient" || bg.kind === "glass") && (
            <ColorField
              label="Background color"
              value={theme.colors.background}
              brands={brands}
              onSaveBrand={addBrand}
              onChange={(v) =>
                patchColors({
                  background: v,
                  backgroundSolid: extractSolid(v) ?? theme.colors.backgroundSolid,
                })
              }
            />
          )}

          {bg.kind === "gradient" && (
            <GradientPresets
              onPick={(g) => patchColors({ background: g.background, backgroundSolid: g.solid })}
            />
          )}

          {bg.kind === "image" && (
            <>
              <Field label="Image URL">
                <Input
                  className="h-8"
                  value={bg.imageUrl ?? ""}
                  onChange={(e) => patchBg({ imageUrl: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Size">
                <Select
                  value={bg.size ?? "cover"}
                  onValueChange={(v) =>
                    patchBg({
                      size: v as PageTheme["background"] extends infer B
                        ? B extends { size?: infer S }
                          ? S
                          : never
                        : never,
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Position">
                <Select
                  value={bg.position ?? "center"}
                  onValueChange={(v) =>
                    patchBg({
                      position: v as PageTheme["background"] extends infer B
                        ? B extends { position?: infer P }
                          ? P
                          : never
                        : never,
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "center",
                      "top",
                      "bottom",
                      "left",
                      "right",
                      "top left",
                      "top right",
                      "bottom left",
                      "bottom right",
                    ].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {bg.kind === "pattern" && (
            <div>
              <div className="mb-1 text-[11px] text-muted-foreground">Pattern</div>
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUND_PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patchBg({ patternId: p.id })}
                    className={cn(
                      "h-12 rounded-md border bg-background",
                      bg.patternId === p.id && "ring-2 ring-primary",
                    )}
                    style={{ backgroundImage: p.url, backgroundRepeat: "repeat" }}
                    aria-label={p.label}
                    title={p.label}
                  />
                ))}
              </div>
            </div>
          )}

          {(bg.kind === "image" || bg.kind === "pattern" || bg.kind === "glass") && (
            <>
              <NumField
                label="Blur"
                min={0}
                max={40}
                step={1}
                value={bg.blur ?? 0}
                suffix="px"
                onChange={(v) => patchBg({ blur: v })}
              />
              <ColorField
                label="Overlay color"
                value={bg.overlay ?? "#000000"}
                brands={brands}
                onSaveBrand={addBrand}
                onChange={(v) => patchBg({ overlay: v })}
              />
              <NumField
                label="Overlay opacity"
                min={0}
                max={1}
                step={0.05}
                value={bg.overlayOpacity ?? 0}
                suffix=""
                onChange={(v) => patchBg({ overlayOpacity: v })}
              />
            </>
          )}

          {bg.kind === "video" && (
            <div className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">
              Video backgrounds ship in a later phase. Architecture is ready.
            </div>
          )}

          <div className="mt-2 border-t pt-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Effects
            </div>
            <ToggleRow
              label="Noise texture"
              checked={!!bg.noise}
              onChange={(v) => patchBg({ noise: v })}
            />
            {bg.noise && (
              <NumField
                label="Noise opacity"
                min={0}
                max={1}
                step={0.02}
                value={bg.noiseOpacity ?? 0.08}
                suffix=""
                onChange={(v) => patchBg({ noiseOpacity: v })}
              />
            )}
            <ToggleRow
              label="Animated gradient"
              checked={!!bg.animatedGradient}
              onChange={(v) => patchBg({ animatedGradient: v })}
            />
          </div>
        </TabsContent>

        {/* ── CARD STUDIO ──────────────────────────────────────────── */}
        <TabsContent value="card" className="mt-3 space-y-3">
          <SectionHead label="Card style" onReset={resetCard} />
          <ColorField
            label="Card background"
            value={theme.card.background}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchCard({ background: v })}
          />
          <NumField
            label="Card radius"
            min={0}
            max={40}
            step={1}
            value={theme.card.radius}
            suffix="px"
            onChange={(v) => patchCard({ radius: v })}
          />
          <NumField
            label="Card padding"
            min={0}
            max={40}
            step={1}
            value={theme.card.padding ?? 12}
            suffix="px"
            onChange={(v) => patchCard({ padding: v })}
          />
          <NumField
            label="Card margin"
            min={0}
            max={40}
            step={1}
            value={theme.card.margin ?? 0}
            suffix="px"
            onChange={(v) => patchCard({ margin: v })}
          />
          <Field label="Border">
            <Select value={theme.card.border} onValueChange={(v) => patchCard({ border: v })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
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
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0 1px 2px rgba(0,0,0,0.05)">Subtle</SelectItem>
                <SelectItem value="0 4px 14px -8px rgba(0,0,0,0.15)">Soft</SelectItem>
                <SelectItem value="0 8px 24px -8px rgba(0,0,0,0.25)">Strong</SelectItem>
                <SelectItem value="0 0 24px -4px rgba(59,130,246,0.45)">Glow</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumField
            label="Opacity"
            min={0.4}
            max={1}
            step={0.05}
            value={theme.card.opacity}
            suffix=""
            onChange={(v) => patchCard({ opacity: v })}
          />
        </TabsContent>

        {/* ── PROFILE STUDIO ───────────────────────────────────────── */}
        <TabsContent value="profile" className="mt-3 space-y-3">
          <SectionHead label="Profile" onReset={resetProfile} />
          <Field label="Avatar shape">
            <Select
              value={profile.avatarShape}
              onValueChange={(v) =>
                patchProfile({
                  avatarShape: v as PageTheme["profile"] extends infer P
                    ? P extends { avatarShape: infer S }
                      ? S
                      : never
                    : never,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Avatar size">
            <Select
              value={profile.avatarSize}
              onValueChange={(v) =>
                patchProfile({
                  avatarSize: v as PageTheme["profile"] extends infer P
                    ? P extends { avatarSize: infer S }
                      ? S
                      : never
                    : never,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small (64)</SelectItem>
                <SelectItem value="md">Medium (80)</SelectItem>
                <SelectItem value="lg">Large (96)</SelectItem>
                <SelectItem value="xl">Extra large (128)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <NumField
            label="Avatar border"
            min={0}
            max={12}
            step={1}
            value={profile.avatarBorderWidth}
            suffix="px"
            onChange={(v) => patchProfile({ avatarBorderWidth: v })}
          />
          <ColorField
            label="Avatar border color"
            value={profile.avatarBorderColor}
            brands={brands}
            onSaveBrand={addBrand}
            onChange={(v) => patchProfile({ avatarBorderColor: v })}
          />
          <NumField
            label="Cover height"
            min={0}
            max={280}
            step={4}
            value={profile.coverHeight}
            suffix="px"
            onChange={(v) => patchProfile({ coverHeight: v })}
          />
          <NumField
            label="Name size"
            min={14}
            max={40}
            step={1}
            value={profile.nameSize}
            suffix="px"
            onChange={(v) => patchProfile({ nameSize: v })}
          />
          <WeightSelect
            label="Name weight"
            value={profile.nameWeight}
            onChange={(v) =>
              patchProfile({
                nameWeight: v as PageTheme["profile"] extends infer P
                  ? P extends { nameWeight: infer W }
                    ? W
                    : never
                  : never,
              })
            }
            values={[400, 500, 600, 700, 800, 900]}
          />
          <NumField
            label="Bio size"
            min={10}
            max={20}
            step={1}
            value={profile.bioSize}
            suffix="px"
            onChange={(v) => patchProfile({ bioSize: v })}
          />
          <WeightSelect
            label="Bio weight"
            value={profile.bioWeight}
            onChange={(v) =>
              patchProfile({
                bioWeight: v as PageTheme["profile"] extends infer P
                  ? P extends { bioWeight: infer W }
                    ? W
                    : never
                  : never,
              })
            }
            values={[300, 400, 500, 600]}
          />

          <div className="mt-2 border-t pt-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Effects
            </div>
            <ToggleRow
              label="Avatar glow"
              checked={!!profile.avatarGlow}
              onChange={(v) => patchProfile({ avatarGlow: v })}
            />
            <ToggleRow
              label="Avatar ring"
              checked={!!profile.avatarRing}
              onChange={(v) => patchProfile({ avatarRing: v })}
            />
            <ToggleRow
              label="Rotating ring"
              checked={!!profile.avatarRotatingRing}
              onChange={(v) => patchProfile({ avatarRotatingRing: v })}
            />
            <ToggleRow
              label="Floating avatar"
              checked={!!profile.avatarFloating}
              onChange={(v) => patchProfile({ avatarFloating: v })}
            />
            <ToggleRow
              label="Verified badge pulse"
              checked={!!profile.badgeAnimation}
              onChange={(v) => patchProfile({ badgeAnimation: v })}
            />
          </div>
        </TabsContent>

        {/* ── SPACING ──────────────────────────────────────────────── */}
        <TabsContent value="space" className="mt-3 space-y-3">
          <SectionHead label="Spacing & Layout" onReset={resetSpace} />
          <NumField
            label="Page padding X"
            min={0}
            max={64}
            step={2}
            value={theme.spacing.pagePadding}
            suffix="px"
            onChange={(v) => patchSpace({ pagePadding: v })}
          />
          <NumField
            label="Page padding Y"
            min={0}
            max={120}
            step={2}
            value={theme.spacing.pagePaddingY}
            suffix="px"
            onChange={(v) => patchSpace({ pagePaddingY: v })}
          />
          <NumField
            label="Block gap"
            min={0}
            max={48}
            step={1}
            value={theme.spacing.blockGap}
            suffix="px"
            onChange={(v) => patchSpace({ blockGap: v })}
          />
          <NumField
            label="Content width"
            min={320}
            max={1200}
            step={10}
            value={theme.spacing.contentWidth}
            suffix="px"
            onChange={(v) => patchSpace({ contentWidth: v })}
          />
          <NumField
            label="Radius"
            min={0}
            max={40}
            step={1}
            value={theme.spacing.radius}
            suffix="px"
            onChange={(v) => patchSpace({ radius: v })}
          />
        </TabsContent>

        {/* ── MOTION ───────────────────────────────────────────────── */}
        <TabsContent value="motion" className="mt-3 space-y-3">
          <SectionHead label="Motion" onReset={resetMotion} />
          <Field label="Page transition">
            <Select
              value={theme.motion?.pageTransition ?? "fade"}
              onValueChange={(v) =>
                patchMotion({
                  pageTransition: v as PageTheme["motion"] extends infer M
                    ? M extends { pageTransition?: infer P }
                      ? P
                      : never
                    : never,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <ToggleRow
            label="Stagger block entrances"
            checked={theme.motion?.stagger !== false}
            onChange={(v) => patchMotion({ stagger: v })}
          />
          <NumField
            label="Stagger step"
            min={0}
            max={400}
            step={10}
            value={theme.motion?.staggerStep ?? 60}
            suffix="ms"
            onChange={(v) => patchMotion({ staggerStep: v })}
          />
          <ToggleRow
            label="Reduce motion (disable all)"
            checked={!!theme.motion?.reduce}
            onChange={(v) => patchMotion({ reduce: v })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────

function TabIcon({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: typeof Palette;
  label: string;
}) {
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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
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
            value === v
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
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

function PresetsGrid({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (id: ThemePresetId) => void;
}) {
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
          <div className="h-16 w-full" style={{ background: p.theme.colors.background }}>
            <div className="flex h-full items-end gap-1 p-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.theme.colors.primary }}
              />
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.theme.colors.accent }}
              />
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

function ColorField({
  label,
  value,
  onChange,
  brands,
  onSaveBrand,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  brands: string[];
  onSaveBrand: (hex: string) => void;
}) {
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
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          title="Save to brand colors"
          onClick={() => extractSolid(value) && onSaveBrand(extractSolid(value)!)}
          disabled={!extractSolid(value) || brands.includes(extractSolid(value)!)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {brands.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {brands.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="h-5 w-5 rounded border hover:scale-110 transition-transform"
              style={{ background: c }}
              title={c}
              aria-label={`Use ${c}`}
            />
          ))}
        </div>
      )}
    </Field>
  );
}

function BrandColors({ brands, onRemove }: { brands: string[]; onRemove: (hex: string) => void }) {
  if (brands.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">Brand colors</div>
      <div className="flex flex-wrap gap-1">
        {brands.map((c) => (
          <div key={c} className="group relative">
            <span className="block h-6 w-6 rounded border" style={{ background: c }} title={c} />
            <button
              type="button"
              onClick={() => onRemove(c)}
              className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
              aria-label={`Remove ${c}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumField({
  label,
  min,
  max,
  step,
  value,
  suffix,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          className="flex-1"
          onValueChange={(v) => onChange(v[0])}
        />
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

/** System + Google font options. Picking a Google font injects its <link>. */
const SYSTEM_FONTS = [
  { label: "Inter (sans)", value: "Inter, ui-sans-serif, system-ui, sans-serif", google: "Inter" },
  { label: "System UI", value: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
  { label: "Serif (Georgia)", value: 'Georgia, "Times New Roman", serif' },
  { label: "Mono", value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' },
];

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    ...SYSTEM_FONTS,
    ...GOOGLE_FONTS.map((g) => ({
      label: g,
      value: `"${g}", ui-sans-serif, system-ui, sans-serif`,
      google: g,
    })),
  ];
  const match = options.find((f) => f.value === value);
  const handle = (v: string) => {
    const opt = options.find((o) => o.value === v);
    if (opt?.google) ensureGoogleFont(opt.google);
    onChange(v);
  };
  return (
    <Field label={label}>
      <Select value={match?.value ?? value} onValueChange={handle}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((f) => (
            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Remembers the Google-font family name (if any) so we can re-inject on load. */
function rememberGoogle(
  patch: (p: Partial<PageTheme>) => void,
  theme: PageTheme,
  cssValue: string,
) {
  const m = cssValue.match(/"([^"]+)"/);
  if (!m) return;
  const family = m[1];
  if (!GOOGLE_FONTS.includes(family)) return;
  const list = theme.googleFonts ?? [];
  if (list.includes(family)) return;
  patch({ googleFonts: [...list, family] });
}

function WeightSelect({
  label,
  value,
  onChange,
  values,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  values: number[];
}) {
  return (
    <Field label={label}>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((w) => (
            <SelectItem key={w} value={String(w)}>
              {w}
            </SelectItem>
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
function PalettePresets({
  onPick,
}: {
  onPick: (p: { primary: string; accent: string; secondary: string }) => void;
}) {
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
  { name: "Peach", background: "linear-gradient(180deg,#ffd5c2,#fff5ea)", solid: "#ffe8d6" },
  { name: "Sky", background: "linear-gradient(180deg,#dbeafe,#f0f9ff)", solid: "#dbeafe" },
  { name: "Mint", background: "linear-gradient(180deg,#a7f3d0,#ecfdf5)", solid: "#a7f3d0" },
  { name: "Violet", background: "linear-gradient(135deg,#a5b4fc,#f0abfc)", solid: "#c4b5fd" },
  {
    name: "Night",
    background: "radial-gradient(circle at 30% 20%,#3d0066,#0a0018)",
    solid: "#0a0018",
  },
  { name: "Fire", background: "linear-gradient(180deg,#ff5f6d,#ffc371)", solid: "#ff8b6b" },
];
function GradientPresets({
  onPick,
}: {
  onPick: (g: { background: string; solid: string }) => void;
}) {
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
