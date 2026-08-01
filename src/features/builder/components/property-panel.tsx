import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_LIBRARY, ICON_KEYS } from "../button-icons";
import { useBuilderStore, selectedBlock } from "../store";
import type {
  Block,
  BlockSettings,
  ButtonAction,
  ButtonGroupItem,
  ButtonStyle,
  EmbedBlock,
  FaqItem,
  FileBlock,
  GalleryImage,
  GalleryBlock,
  SocialFeedBlock,
  SocialLink,
  SocialPlatform,
  Testimonial,
  TextAlign,
  VideoBlock,
} from "../types";
import { newId } from "../types";
import { CustomCodeEditor } from "./property-editors/custom-code-editor";
import { IntegrationEditor } from "../integrations/integration-editor";

import { FontFamilyField } from "./font-family-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { getBlockDef } from "../block-registry";
import { ImageField } from "./image-field";
import { HighlightCardsEditor } from "./highlight-cards-editor";
import { VideoSourceField } from "./video-source-field";
import { MediaFileField } from "./media-file-field";

export function PropertyPanel() {
  const block = useBuilderStore(selectedBlock);
  const update = useBuilderStore((s) => s.updateBlock);

  if (!block) {
    return (
      <EmptyState
        title="Nothing selected"
        description="Click a block in the preview to edit its properties."
      />
    );
  }
  const def = getBlockDef(block.type);
  function set(key: string, value: unknown) {
    update(block!.id, { [key]: value } as unknown as Partial<Block>);
  }
  function setSettings(patch: Partial<BlockSettings>) {
    update(block!.id, { settings: { ...(block!.settings ?? {}), ...patch } } as Partial<Block>);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Editing</div>
        <div className="text-sm font-semibold">{def?.label ?? block.type}</div>
      </div>

      {block.type === "profile" && (
        <>
          <SectionTitle>Content</SectionTitle>
          <Field label="Display name">
            <Input value={block.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Username">
            <Input
              value={block.username ?? ""}
              onChange={(e) => set("username", e.target.value.replace(/^@/, ""))}
              placeholder="username"
            />
          </Field>
          <Field label="Bio">
            <Textarea
              rows={2}
              value={block.bio ?? ""}
              onChange={(e) => set("bio", e.target.value)}
            />
          </Field>
          <Field label="Short description">
            <Textarea
              rows={2}
              value={block.shortDescription ?? ""}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </Field>
          <Field label="Location">
            <Input
              value={block.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, Country"
            />
          </Field>

          <SectionTitle>Layout</SectionTitle>
          <Field label="Alignment / layout">
            <SelectSimple
              value={block.layout ?? "center"}
              onChange={(v) => set("layout", v)}
              options={[
                ["left", "Left"],
                ["center", "Center"],
                ["right", "Right"],
                ["stacked", "Stacked"],
                ["split", "Split (image + text)"],
              ]}
            />
          </Field>

          <SectionTitle>Profile image</SectionTitle>
          <ImageField
            label="Avatar"
            value={block.avatarUrl}
            onChange={(url) => set("avatarUrl", url)}
            circle
            crop={{ shape: "round", aspect: 1 }}
            pickerTitle="Choose profile picture"
          />

          <Row>
            <Label className="text-xs">Object fit</Label>
            <SelectSimple
              value={block.avatarObjectFit ?? "cover"}
              onChange={(v) => set("avatarObjectFit", v)}
              options={[
                ["cover", "Cover"],
                ["contain", "Contain"],
              ]}
            />
          </Row>
          <Field label="Zoom">
            <Input
              type="number"
              step="0.05"
              min={1}
              max={3}
              value={block.avatarZoom ?? 1}
              onChange={(e) => set("avatarZoom", Number(e.target.value) || 1)}
            />
          </Field>
          <Field label="Size (px)">
            <Input
              type="number"
              min={32}
              max={240}
              value={block.avatarSize ?? 80}
              onChange={(e) => set("avatarSize", Number(e.target.value) || 80)}
            />
          </Field>
          <Field label="Border radius (px, 9999 = circle)">
            <Input
              type="number"
              min={0}
              max={9999}
              value={block.avatarRadius ?? 9999}
              onChange={(e) => set("avatarRadius", Number(e.target.value))}
            />
          </Field>
          <Field label="Border width (px)">
            <Input
              type="number"
              min={0}
              max={20}
              value={block.avatarBorderWidth ?? 4}
              onChange={(e) => set("avatarBorderWidth", Number(e.target.value))}
            />
          </Field>
          <NamedColorField
            label="Border color"
            value={block.avatarBorderColor}
            onChange={(v) => set("avatarBorderColor", v)}
          />
          <Field label="Shadow">
            <SelectSimple
              value={block.avatarShadow ?? "none"}
              onChange={(v) => set("avatarShadow", v)}
              options={[
                ["none", "None"],
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
                ["xl", "Extra large"],
              ]}
            />
          </Field>
          <Field label="Ring style">
            <SelectSimple
              value={block.avatarRing ?? "none"}
              onChange={(v) => set("avatarRing", v)}
              options={[
                ["none", "None"],
                ["solid", "Solid"],
                ["gradient", "Gradient"],
                ["glow", "Glow"],
              ]}
            />
          </Field>
          <NamedColorField
            label="Ring color"
            value={block.avatarRingColor}
            onChange={(v) => set("avatarRingColor", v)}
          />

          <SectionTitle>Name typography</SectionTitle>
          <NamedColorField
            label="Color"
            value={block.nameColor}
            onChange={(v) => set("nameColor", v)}
          />
          <FontFamilyField
            label="Name font"
            value={block.nameFontFamily}
            onChange={(v) => set("nameFontFamily", v)}
          />

          <Field label="Font size (px)">
            <Input
              type="number"
              min={10}
              max={96}
              value={block.nameFontSizePx ?? ""}
              onChange={(e) =>
                set("nameFontSizePx", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Inherit"
            />
          </Field>
          <FontWeightField
            value={block.nameFontWeight ?? "bold"}
            onChange={(v) => set("nameFontWeight", v)}
          />
          <Field label="Letter spacing (px)">
            <Input
              type="number"
              step="0.1"
              value={block.nameLetterSpacing ?? ""}
              onChange={(e) =>
                set("nameLetterSpacing", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="0"
            />
          </Field>
          <Field label="Line height">
            <Input
              type="number"
              step="0.1"
              min={0.8}
              max={3}
              value={block.nameLineHeight ?? ""}
              onChange={(e) =>
                set("nameLineHeight", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Auto"
            />
          </Field>
          <Field label="Text shadow (CSS)">
            <Input
              value={block.nameTextShadow ?? ""}
              onChange={(e) => set("nameTextShadow", e.target.value || undefined)}
              placeholder="0 2px 4px rgba(0,0,0,0.3)"
            />
          </Field>

          <SectionTitle>Bio typography</SectionTitle>
          <NamedColorField
            label="Color"
            value={block.bioColor}
            onChange={(v) => set("bioColor", v)}
          />
          <FontFamilyField
            label="Bio font"
            value={block.bioFontFamily}
            onChange={(v) => set("bioFontFamily", v)}
          />
          <Field label="Font size (px)">
            <Input
              type="number"
              min={8}
              max={48}
              value={block.bioFontSizePx ?? ""}
              onChange={(e) =>
                set("bioFontSizePx", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Inherit"
            />
          </Field>
          <FontWeightField
            value={block.bioFontWeight ?? "normal"}
            onChange={(v) => set("bioFontWeight", v)}
          />
          <Field label="Letter spacing (px)">
            <Input
              type="number"
              step="0.1"
              value={block.bioLetterSpacing ?? ""}
              onChange={(e) =>
                set("bioLetterSpacing", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </Field>
          <Field label="Line height">
            <Input
              type="number"
              step="0.1"
              min={0.8}
              max={3}
              value={block.bioLineHeight ?? ""}
              onChange={(e) =>
                set("bioLineHeight", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </Field>
          <Field label="Max lines (0 = unlimited)">
            <Input
              type="number"
              min={0}
              max={20}
              value={block.bioMaxLines ?? 0}
              onChange={(e) => set("bioMaxLines", Number(e.target.value) || undefined)}
            />
          </Field>

          <SectionTitle>Verified badge</SectionTitle>
          <Row>
            <Label className="text-xs">Show badge</Label>
            <Switch checked={!!block.verified} onCheckedChange={(v) => set("verified", v)} />
          </Row>
          <NamedColorField
            label="Icon color"
            value={block.badgeColor}
            onChange={(v) => set("badgeColor", v)}
          />
          <NamedColorField
            label="Background"
            value={block.badgeBgColor}
            onChange={(v) => set("badgeBgColor", v)}
          />
          <NamedColorField
            label="Border"
            value={block.badgeBorderColor}
            onChange={(v) => set("badgeBorderColor", v)}
          />
          <Field label="Size (px)">
            <Input
              type="number"
              min={10}
              max={40}
              value={block.badgeSize ?? 16}
              onChange={(e) => set("badgeSize", Number(e.target.value))}
            />
          </Field>
          <Field label="Position">
            <SelectSimple
              value={block.badgePosition ?? "inline"}
              onChange={(v) => set("badgePosition", v)}
              options={[
                ["inline", "Inline with name"],
                ["top-right", "Top right of avatar"],
                ["bottom-right", "Bottom right of avatar"],
              ]}
            />
          </Field>

          <SectionTitle>Hero background</SectionTitle>
          <ImageField
            label="Cover image"
            value={block.coverUrl}
            onChange={(url) => set("coverUrl", url)}
            crop={{ shape: "rect", aspect: 16 / 9 }}
            previewAspect="16 / 9"
            pickerTitle="Choose cover image"
          />

          <Field label="Background type">
            <SelectSimple
              value={block.bgType ?? "none"}
              onChange={(v) => set("bgType", v)}
              options={[
                ["none", "None"],
                ["solid", "Solid color"],
                ["gradient", "Gradient"],
                ["image", "Image"],
                ["video", "Video"],
                ["glass", "Glass"],
              ]}
            />
          </Field>
          {(block.bgType === "solid" || block.bgType === "glass") && (
            <NamedColorField
              label="Color"
              value={block.bgColor}
              onChange={(v) => set("bgColor", v)}
            />
          )}
          {block.bgType === "gradient" && (
            <>
              <NamedColorField
                label="Gradient from"
                value={block.bgGradientFrom}
                onChange={(v) => set("bgGradientFrom", v)}
              />
              <NamedColorField
                label="Gradient to"
                value={block.bgGradientTo}
                onChange={(v) => set("bgGradientTo", v)}
              />
              <Field label="Angle (deg)">
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={block.bgGradientAngle ?? 135}
                  onChange={(e) => set("bgGradientAngle", Number(e.target.value))}
                />
              </Field>
            </>
          )}
          {block.bgType === "image" && (
            <ImageField
              label="Background image"
              value={block.bgImageUrl}
              onChange={(url) => set("bgImageUrl", url)}
              crop={{ shape: "rect", aspect: "free" }}
              previewAspect="16 / 9"
            />
          )}

          {block.bgType === "video" && (
            <VideoSourceField
              label="Background video"
              value={block.bgVideoUrl}
              onChange={(url) => set("bgVideoUrl", url)}
              background
            />
          )}
          {(block.bgType === "glass" || block.bgType === "image") && (
            <Field label="Blur (px)">
              <Input
                type="number"
                min={0}
                max={60}
                value={block.bgBlur ?? 16}
                onChange={(e) => set("bgBlur", Number(e.target.value))}
              />
            </Field>
          )}
          <NamedColorField
            label="Overlay color"
            value={block.overlayColor}
            onChange={(v) => set("overlayColor", v)}
          />
          <Field label="Overlay opacity (0–1)">
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={block.overlayOpacity ?? 0}
              onChange={(e) => set("overlayOpacity", Number(e.target.value))}
            />
          </Field>

          <HeroEffectsStudio block={block} update={update} />
        </>

      )}


      {block.type === "heading" && (
        <>
          <Field label="Text">
            <Input value={block.text} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <AlignField value={block.align} onChange={(v) => set("align", v)} />
          <FontSizeField value={block.fontSize ?? "xl"} onChange={(v) => set("fontSize", v)} />
          <FontWeightField
            value={block.fontWeight ?? "bold"}
            onChange={(v) => set("fontWeight", v)}
          />
          <ColorField value={block.color} onChange={(v) => set("color", v)} />
        </>
      )}

      {block.type === "text" && (
        <>
          <Field label="Style">
            <SelectSimple
              value={block.kind ?? "paragraph"}
              onChange={(v) => set("kind", v)}
              options={[
                ["heading", "Heading"],
                ["paragraph", "Paragraph"],
              ]}
            />
          </Field>
          <Field label="Text">
            <Textarea rows={5} value={block.text} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <AlignField value={block.align} onChange={(v) => set("align", v)} />
          <FontSizeField value={block.fontSize ?? "sm"} onChange={(v) => set("fontSize", v)} />
          <FontWeightField
            value={block.fontWeight ?? "normal"}
            onChange={(v) => set("fontWeight", v)}
          />
          <ColorField value={block.color} onChange={(v) => set("color", v)} />
        </>
      )}

      {block.type === "button" && (
        <>
          <Field label="Title">
            <Input value={block.label} onChange={(e) => set("label", e.target.value)} />
          </Field>
          <Field label="Action">
            <SelectSimple
              value={block.action ?? "website"}
              onChange={(v) => set("action", v as ButtonAction)}
              options={(
                [
                  "website",
                  "whatsapp",
                  "phone",
                  "email",
                  "telegram",
                  "instagram",
                  "facebook",
                  "youtube",
                  "x",
                  "linkedin",
                  "custom",
                ] as ButtonAction[]
              ).map((a) => [a, a])}
            />
          </Field>
          <Field label="URL / value">
            <Input
              value={block.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Style">
            <SelectSimple
              value={block.style}
              onChange={(v) => set("style", v)}
              options={[
                ["filled", "Filled"],
                ["outline", "Outline"],
                ["soft", "Soft"],
              ]}
            />
          </Field>
          <Field label="Width">
            <SelectSimple
              value={block.width ?? "full"}
              onChange={(v) => set("width", v)}
              options={[
                ["full", "Full"],
                ["half", "Half"],
                ["auto", "Auto"],
              ]}
            />
          </Field>
          <Field label="Alignment">
            <SelectSimple
              value={block.align ?? "center"}
              onChange={(v) => set("align", v)}
              options={[
                ["left", "Left"],
                ["center", "Center"],
                ["right", "Right"],
              ]}
            />
          </Field>
          <Row>
            <Label className="text-xs">Open in new tab</Label>
            <Switch checked={block.newTab !== false} onCheckedChange={(v) => set("newTab", v)} />
          </Row>
          <Row>
            <Label className="text-xs">Disabled</Label>
            <Switch checked={!!block.disabled} onCheckedChange={(v) => set("disabled", v)} />
          </Row>

          <SectionTitle>Typography</SectionTitle>
          <FontFamilyField value={block.fontFamily} onChange={(v) => set("fontFamily", v)} />
          <Field label="Font size (px)">
            <Input
              type="number"
              min={8}
              max={72}
              value={block.fontSizePx ?? ""}
              onChange={(e) =>
                set("fontSizePx", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Inherit"
            />
          </Field>
          <FontWeightField
            value={block.fontWeight ?? "medium"}
            onChange={(v) => set("fontWeight", v)}
          />
          <Field label="Letter spacing (px)">
            <Input
              type="number"
              step="0.1"
              value={block.letterSpacing ?? ""}
              onChange={(e) =>
                set("letterSpacing", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="0"
            />
          </Field>
          <Field label="Line height">
            <Input
              type="number"
              step="0.1"
              min={0.8}
              max={3}
              value={block.lineHeight ?? ""}
              onChange={(e) =>
                set("lineHeight", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Auto"
            />
          </Field>
          <Field label="Text transform">
            <SelectSimple
              value={block.textTransform ?? "none"}
              onChange={(v) => set("textTransform", v)}
              options={[
                ["none", "None"],
                ["uppercase", "UPPERCASE"],
                ["lowercase", "lowercase"],
                ["capitalize", "Capitalize"],
              ]}
            />
          </Field>
          <Field label="Text alignment">
            <SelectSimple
              value={block.textAlign ?? "center"}
              onChange={(v) => set("textAlign", v)}
              options={[
                ["left", "Left"],
                ["center", "Center"],
                ["right", "Right"],
              ]}
            />
          </Field>

          <SectionTitle>Colors — Normal</SectionTitle>
          <NamedColorField
            label="Background"
            value={block.bgColor}
            onChange={(v) => set("bgColor", v)}
          />
          <NamedColorField
            label="Text"
            value={block.textColor}
            onChange={(v) => set("textColor", v)}
          />
          <NamedColorField
            label="Border"
            value={block.borderColor}
            onChange={(v) => set("borderColor", v)}
          />
          <Row>
            <Label className="text-xs">Auto contrast text</Label>
            <Switch
              checked={block.autoContrast !== false}
              onCheckedChange={(v) => set("autoContrast", v)}
            />
          </Row>

          <SectionTitle>Colors — Hover</SectionTitle>
          <NamedColorField
            label="Background"
            value={block.hoverBgColor}
            onChange={(v) => set("hoverBgColor", v)}
          />
          <NamedColorField
            label="Text"
            value={block.hoverTextColor}
            onChange={(v) => set("hoverTextColor", v)}
          />
          <NamedColorField
            label="Border"
            value={block.hoverBorderColor}
            onChange={(v) => set("hoverBorderColor", v)}
          />
        </>
      )}

      {block.type === "buttonGroup" && (
        <ButtonGroupEditor block={block} set={set} />
      )}


      {block.type === "image" && (
        <>
          <ImageField
            label="Image"
            value={block.url}
            onChange={(url) => set("url", url ?? "")}
            crop={{ shape: "rect", aspect: "free" }}
            pickerTitle="Choose image"
          />
          <Field label="Alt text">
            <Input value={block.alt ?? ""} onChange={(e) => set("alt", e.target.value)} />
          </Field>
          <Field label="Link (optional)">
            <Input
              value={block.link ?? ""}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Rounded">
            <SelectSimple
              value={block.rounded ?? "md"}
              onChange={(v) => set("rounded", v)}
              options={[
                ["none", "None"],
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
                ["full", "Full"],
              ]}
            />
          </Field>
          <Field label="Fit">
            <SelectSimple
              value={block.fit ?? "cover"}
              onChange={(v) => set("fit", v)}
              options={[
                ["cover", "Cover"],
                ["contain", "Contain"],
              ]}
            />
          </Field>
        </>
      )}

      {block.type === "divider" && (
        <>
          <Field label="Variant">
            <SelectSimple
              value={block.variant ?? "line"}
              onChange={(v) => set("variant", v)}
              options={[
                ["line", "Line"],
                ["gradient", "Gradient"],
                ["icon", "Icon"],
                ["text", "Text"],
              ]}
            />
          </Field>
          {(block.variant ?? "line") === "line" && (
            <Field label="Style">
              <SelectSimple
                value={block.style ?? "solid"}
                onChange={(v) => set("style", v)}
                options={[
                  ["solid", "Solid"],
                  ["dashed", "Dashed"],
                  ["dotted", "Dotted"],
                ]}
              />
            </Field>
          )}
          {block.variant === "gradient" && (
            <>
              <ColorField value={block.gradientFrom} onChange={(v) => set("gradientFrom", v)} />
              <ColorField value={block.gradientTo} onChange={(v) => set("gradientTo", v)} />
            </>
          )}
          {block.variant === "text" && (
            <Field label="Label">
              <Input value={block.label ?? ""} onChange={(e) => set("label", e.target.value)} />
            </Field>
          )}
          <Field label="Thickness">
            <SelectSimple
              value={block.thickness}
              onChange={(v) => set("thickness", v)}
              options={[
                ["thin", "Thin"],
                ["medium", "Medium"],
                ["thick", "Thick"],
              ]}
            />
          </Field>
          <Field label="Spacing">
            <SelectSimple
              value={block.spacing ?? "md"}
              onChange={(v) => set("spacing", v)}
              options={[
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
              ]}
            />
          </Field>
        </>
      )}

      {block.type === "spacer" && (
        <Field label={`Height (${block.height ?? 24}px)`}>
          <Input
            type="number"
            min={4}
            max={400}
            value={block.height ?? 24}
            onChange={(e) => set("height", Math.max(4, Math.min(400, Number(e.target.value) || 0)))}
          />
        </Field>
      )}

      {block.type === "social" && (
        <SocialEditor links={block.links} onChange={(links) => set("links", links)} />
      )}

      {block.type === "video" && <VideoEditor block={block} set={set} />}
      {block.type === "gallery" && (
        <GalleryEditor
          layout={block.layout}
          columns={block.columns ?? 2}
          gap={block.gap ?? "md"}
          rounded={block.rounded ?? "md"}
          images={block.images}
          onLayout={(v) => set("layout", v)}
          onColumns={(v) => set("columns", v)}
          onGap={(v) => set("gap", v)}
          onRounded={(v) => set("rounded", v)}
          onImages={(v) => set("images", v)}
          block={block}
          set={set}
        />
      )}
      {block.type === "socialFeed" && <SocialFeedEditor block={block} set={set} />}
      {block.type === "testimonials" && (
        <TestimonialsEditor
          title={block.title ?? ""}
          items={block.items}
          onTitle={(v) => set("title", v)}
          onItems={(v) => set("items", v)}
        />
      )}
      {block.type === "highlightCards" && <HighlightCardsEditor block={block} set={set} />}
      {block.type === "faq" && (
        <FaqEditor
          title={block.title ?? ""}
          items={block.items}
          onTitle={(v) => set("title", v)}
          onItems={(v) => set("items", v)}
        />
      )}
      {block.type === "countdown" && (
        <>
          <Field label="Title">
            <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Target date/time">
            <Input
              type="datetime-local"
              value={toLocalDT(block.target)}
              onChange={(e) => set("target", fromLocalDT(e.target.value))}
            />
          </Field>
          <Field label="Timezone">
            <Input
              value={block.timezone ?? ""}
              onChange={(e) => set("timezone", e.target.value)}
              placeholder="e.g. Europe/London"
            />
          </Field>
          <Field label="Finished message">
            <Input
              value={block.finishedLabel ?? ""}
              onChange={(e) => set("finishedLabel", e.target.value)}
            />
          </Field>
        </>
      )}
      {block.type === "map" && (
        <>
          <Field label="Google Maps URL">
            <Input
              value={block.mapUrl}
              onChange={(e) => set("mapUrl", e.target.value)}
              placeholder="https://www.google.com/maps/embed?…"
            />
          </Field>
          <Field label="Location name">
            <Input
              value={block.locationName ?? ""}
              onChange={(e) => set("locationName", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <Input value={block.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </>
      )}
      {block.type === "file" && <FileEditor block={block} set={set} />}
      {block.type === "contact" && (
        <>
          <Field label="Title">
            <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input
              value={block.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 555…"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={block.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Website">
            <Input
              value={block.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={block.whatsapp ?? ""}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+1 555…"
            />
          </Field>
          <Field label="Address">
            <Textarea
              rows={2}
              value={block.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </>
      )}
      {block.type === "embed" && <EmbedEditor block={block} set={set} />}
      {block.type === "customCode" && <CustomCodeEditor block={block} update={update} />}
      {block.type === "integration" && <IntegrationEditor block={block} update={update} />}



      <SharedSettings settings={block.settings} onChange={setSettings} />
    </div>
  );
}

// ── Shared UI helpers ───────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between">{children}</div>;
}
function SelectSimple({
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
function AlignField({ value, onChange }: { value: TextAlign; onChange: (v: TextAlign) => void }) {
  return (
    <Field label="Alignment">
      <SelectSimple
        value={value}
        onChange={(v) => onChange(v as TextAlign)}
        options={[
          ["left", "Left"],
          ["center", "Center"],
          ["right", "Right"],
        ]}
      />
    </Field>
  );
}
function FontSizeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Font size">
      <SelectSimple
        value={value}
        onChange={onChange}
        options={["xs", "sm", "base", "lg", "xl", "2xl", "3xl"].map(
          (s) => [s, s] as [string, string],
        )}
      />
    </Field>
  );
}
function FontWeightField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Font weight">
      <SelectSimple
        value={value}
        onChange={onChange}
        options={["normal", "medium", "semibold", "bold"].map((s) => [s, s] as [string, string])}
      />
    </Field>
  );
}
function ColorField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Field label="Color">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border bg-transparent"
          aria-label="Color picker"
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Inherit"
        />
      </div>
    </Field>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}
function NamedColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border bg-transparent"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Inherit"
        />
      </div>
    </Field>
  );
}

// ── Social links editor ─────────────────────────────────────────────────
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
function SocialEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (v: SocialLink[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= links.length) return;
    const next = [...links];
    const [it] = next.splice(i, 1);
    next.splice(t, 0, it);
    onChange(next);
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs">Social links</Label>
      {links.map((l, i) => (
        <div key={l.id} className="space-y-1.5 rounded-md border p-2">
          <div className="flex items-center gap-1.5">
            <Select
              value={l.platform}
              onValueChange={(v) => {
                const next = [...links];
                next[i] = { ...l, platform: v as SocialPlatform };
                onChange(next);
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
                onChange(next);
              }}
            />
          </div>
          <div className="flex items-center justify-end gap-0.5">
            <IconBtn label="Move up" onClick={() => move(i, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Move down" onClick={() => move(i, 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Remove" onClick={() => onChange(links.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </IconBtn>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onChange([...links, { id: newId(), platform: "instagram", url: "" }])}
      >
        <Plus className="mr-2 h-3.5 w-3.5" /> Add link
      </Button>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label={label} onClick={onClick}>
      {children}
    </Button>
  );
}

// ── Advanced block editors ──────────────────────────────────────────────
function VideoEditor({ block, set }: { block: VideoBlock; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Provider">
        <SelectSimple
          value={block.provider}
          onChange={(v) => set("provider", v)}
          options={[
            ["youtube", "YouTube"],
            ["vimeo", "Vimeo"],
            ["mp4", "MP4 upload URL"],
          ]}
        />
      </Field>
      <VideoSourceField
        label="Video source"
        value={block.url}
        onChange={(url) => set("url", url ?? "")}
        background={false}
      />
      <ImageField
        label="Thumbnail / poster"
        value={block.thumbnailUrl}
        onChange={(url) => set("thumbnailUrl", url)}
        crop={{ shape: "rect", aspect: 16 / 9 }}
        previewAspect="16 / 9"
        pickerTitle="Choose thumbnail"
      />
      <Row>
        <Label className="text-xs">Autoplay</Label>
        <Switch checked={!!block.autoplay} onCheckedChange={(v) => set("autoplay", v)} />
      </Row>
      <Row>
        <Label className="text-xs">Loop</Label>
        <Switch checked={!!block.loop} onCheckedChange={(v) => set("loop", v)} />
      </Row>
      <Row>
        <Label className="text-xs">Muted</Label>
        <Switch checked={!!block.muted} onCheckedChange={(v) => set("muted", v)} />
      </Row>
      <Field label="Rounded">
        <SelectSimple
          value={block.rounded ?? "lg"}
          onChange={(v) => set("rounded", v)}
          options={[
            ["none", "None"],
            ["sm", "Small"],
            ["md", "Medium"],
            ["lg", "Large"],
            ["xl", "XL"],
          ]}
        />
      </Field>
    </>
  );
}

function GalleryEditor({
  layout,
  columns,
  gap,
  rounded,
  images,
  onLayout,
  onColumns,
  onGap,
  onRounded,
  onImages,
  block,
  set,
}: {
  layout: "grid" | "carousel" | "masonry";
  columns: 2 | 3 | 4;
  gap: "sm" | "md" | "lg";
  rounded: "none" | "sm" | "md" | "lg";
  images: GalleryImage[];
  onLayout: (v: string) => void;
  onColumns: (v: number) => void;
  onGap: (v: string) => void;
  onRounded: (v: string) => void;
  onImages: (v: GalleryImage[]) => void;
  block: GalleryBlock;
  set: (k: string, v: unknown) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= images.length) return;
    const next = [...images];
    const [it] = next.splice(i, 1);
    next.splice(t, 0, it);
    onImages(next);
  }
  return (
    <>
      <Field label="Layout">
        <SelectSimple
          value={layout}
          onChange={onLayout}
          options={[
            ["grid", "Grid"],
            ["carousel", "Carousel"],
            ["masonry", "Masonry"],
          ]}
        />
      </Field>
      <Field label="Columns">
        <SelectSimple
          value={String(columns)}
          onChange={(v) => onColumns(Number(v))}
          options={[
            ["2", "2"],
            ["3", "3"],
            ["4", "4"],
          ]}
        />
      </Field>
      <Field label="Gap">
        <SelectSimple
          value={gap}
          onChange={onGap}
          options={[
            ["sm", "Small"],
            ["md", "Medium"],
            ["lg", "Large"],
          ]}
        />
      </Field>
      <Field label="Rounded">
        <SelectSimple
          value={rounded}
          onChange={onRounded}
          options={[
            ["none", "None"],
            ["sm", "Small"],
            ["md", "Medium"],
            ["lg", "Large"],
          ]}
        />
      </Field>
      {layout === "carousel" && (
        <div className="space-y-2 rounded-md border p-2">
          <Label className="text-xs font-medium">Carousel</Label>
          <Field label="Autoplay">
            <Switch
              checked={block.autoplay !== false}
              onCheckedChange={(v) => set("autoplay", v)}
            />
          </Field>
          {block.autoplay !== false && (
            <Field label="Speed (ms)">
              <Input
                type="number"
                min={1500}
                step={500}
                value={block.autoplaySpeed ?? 4000}
                onChange={(e) =>
                  set("autoplaySpeed", Math.max(1500, Number(e.target.value) || 4000))
                }
              />
            </Field>
          )}
          <Field label="Infinite loop">
            <Switch checked={block.loop !== false} onCheckedChange={(v) => set("loop", v)} />
          </Field>
          <Field label="Arrows">
            <Switch
              checked={block.showArrows !== false}
              onCheckedChange={(v) => set("showArrows", v)}
            />
          </Field>
          <Field label="Dots">
            <Switch
              checked={block.showDots !== false}
              onCheckedChange={(v) => set("showDots", v)}
            />
          </Field>
        </div>
      )}
      <Field label="Fullscreen lightbox">
        <Switch checked={block.lightbox !== false} onCheckedChange={(v) => set("lightbox", v)} />
      </Field>
      <div className="space-y-2">
        <Label className="text-xs">Images</Label>
        {images.map((img, i) => (
          <div key={img.id} className="space-y-1.5 rounded-md border p-2">
            <ImageField
              label={`Image ${i + 1}`}
              value={img.url || undefined}
              onChange={(url) => {
                const n = [...images];
                n[i] = { ...img, url: url ?? "" };
                onImages(n);
              }}
              crop={{ shape: "rect", aspect: "free" }}
              pickerTitle="Choose image"
            />
            <Input
              value={img.alt ?? ""}
              placeholder="Alt text"
              onChange={(e) => {
                const n = [...images];
                n[i] = { ...img, alt: e.target.value };
                onImages(n);
              }}
            />
            <div className="flex justify-end gap-0.5">
              <IconBtn label="Up" onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Down" onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Remove" onClick={() => onImages(images.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </IconBtn>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onImages([...images, { id: newId(), url: "" }])}
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add image
        </Button>
      </div>
    </>
  );
}

function SocialFeedEditor({
  block,
  set,
}: {
  block: SocialFeedBlock;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <>
      <Field label="Provider">
        <SelectSimple
          value={block.provider}
          onChange={(v) => set("provider", v)}
          options={[
            ["instagram", "Instagram"],
            ["youtube", "YouTube"],
            ["tiktok", "TikTok"],
            ["pinterest", "Pinterest"],
          ]}
        />
      </Field>
      <Field label="Handle / channel">
        <Input
          value={block.handle ?? ""}
          onChange={(e) => set("handle", e.target.value)}
          placeholder="@yourhandle"
        />
      </Field>
      <Field label="Item limit">
        <Input
          type="number"
          min={1}
          max={30}
          value={block.limit ?? 6}
          onChange={(e) => set("limit", Math.max(1, Math.min(30, Number(e.target.value) || 6)))}
        />
      </Field>
      <div className="rounded-md border border-dashed p-2 text-[11px] text-muted-foreground">
        Live feed loads once the provider is connected (upcoming phase).
      </div>
    </>
  );
}

function TestimonialsEditor({
  title,
  items,
  onTitle,
  onItems,
}: {
  title: string;
  items: Testimonial[];
  onTitle: (v: string) => void;
  onItems: (v: Testimonial[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= items.length) return;
    const n = [...items];
    const [it] = n.splice(i, 1);
    n.splice(t, 0, it);
    onItems(n);
  }
  function upd(i: number, patch: Partial<Testimonial>) {
    const n = [...items];
    n[i] = { ...n[i], ...patch };
    onItems(n);
  }
  return (
    <>
      <Field label="Section title">
        <Input value={title} onChange={(e) => onTitle(e.target.value)} />
      </Field>
      <div className="space-y-2">
        <Label className="text-xs">Testimonials</Label>
        {items.map((t, i) => (
          <div key={t.id} className="space-y-1.5 rounded-md border p-2">
            <Input
              value={t.name}
              placeholder="Name"
              onChange={(e) => upd(i, { name: e.target.value })}
            />
            <Input
              value={t.role ?? ""}
              placeholder="Role"
              onChange={(e) => upd(i, { role: e.target.value })}
            />
            <ImageField
              label="Avatar"
              value={t.avatarUrl}
              onChange={(url) => upd(i, { avatarUrl: url })}
              crop={{ shape: "round", aspect: 1 }}
              circle
              pickerTitle="Choose avatar"
            />
            <SelectSimple
              value={String(t.rating ?? 5)}
              onChange={(v) => upd(i, { rating: Number(v) })}
              options={[
                ["0", "0★"],
                ["1", "1★"],
                ["2", "2★"],
                ["3", "3★"],
                ["4", "4★"],
                ["5", "5★"],
              ]}
            />
            <Textarea
              rows={3}
              value={t.review}
              placeholder="Review"
              onChange={(e) => upd(i, { review: e.target.value })}
            />
            <div className="flex justify-end gap-0.5">
              <IconBtn label="Up" onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Down" onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Remove" onClick={() => onItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </IconBtn>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            onItems([
              ...items,
              { id: newId(), name: "New review", role: "", rating: 5, review: "" },
            ])
          }
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add testimonial
        </Button>
      </div>
    </>
  );
}

function FaqEditor({
  title,
  items,
  onTitle,
  onItems,
}: {
  title: string;
  items: FaqItem[];
  onTitle: (v: string) => void;
  onItems: (v: FaqItem[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= items.length) return;
    const n = [...items];
    const [it] = n.splice(i, 1);
    n.splice(t, 0, it);
    onItems(n);
  }
  function upd(i: number, patch: Partial<FaqItem>) {
    const n = [...items];
    n[i] = { ...n[i], ...patch };
    onItems(n);
  }
  return (
    <>
      <Field label="Section title">
        <Input value={title} onChange={(e) => onTitle(e.target.value)} />
      </Field>
      <div className="space-y-2">
        <Label className="text-xs">Questions</Label>
        {items.map((it, i) => (
          <div key={it.id} className="space-y-1.5 rounded-md border p-2">
            <Input
              value={it.question}
              placeholder="Question"
              onChange={(e) => upd(i, { question: e.target.value })}
            />
            <Textarea
              rows={3}
              value={it.answer}
              placeholder="Answer"
              onChange={(e) => upd(i, { answer: e.target.value })}
            />
            <div className="flex justify-end gap-0.5">
              <IconBtn label="Up" onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Down" onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Remove" onClick={() => onItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </IconBtn>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onItems([...items, { id: newId(), question: "New question", answer: "" }])}
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add question
        </Button>
      </div>
    </>
  );
}

const BUTTON_STYLES: [ButtonStyle, string][] = [
  ["filled", "Filled"],
  ["outline", "Outline"],
  ["soft", "Soft"],
  ["ghost", "Ghost"],
  ["glass", "Glass"],
  ["gradient", "Gradient"],
  ["elevated", "Elevated"],
  ["neumorphism", "Neumorphism"],
];
const ITEM_EFFECTS: [string, string][] = [
  ["none", "None"],
  ["shine", "Shine"],
  ["neon", "Neon"],
  ["glow", "Glow"],
  ["pulse", "Pulse"],
  ["bounce", "Bounce"],
  ["floating", "Floating"],
  ["ripple", "Ripple"],
  ["breathing", "Breathing"],
  ["magnetic", "Magnetic"],
  ["spotlight", "Spotlight"],
  ["gradientFlow", "Gradient Flow"],
  ["rainbowBorder", "Rainbow Border"],
  ["borderGlow", "Border Glow"],
];

function ButtonGroupEditor({
  block,
  set,
}: {
  block: import("../types").ButtonGroupBlock;
  set: (k: string, v: unknown) => void;
}) {
  const buttons = block.buttons;
  const onButtons = (v: ButtonGroupItem[]) => set("buttons", v);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= buttons.length) return;
    const n = [...buttons];
    const [it] = n.splice(i, 1);
    n.splice(t, 0, it);
    onButtons(n);
  }
  function upd(i: number, patch: Partial<ButtonGroupItem>) {
    const n = [...buttons];
    n[i] = { ...n[i], ...patch };
    onButtons(n);
  }
  function duplicate(i: number) {
    const n = [...buttons];
    n.splice(i + 1, 0, { ...buttons[i], id: newId() });
    onButtons(n);
  }

  return (
    <>
      <SectionTitle>Group layout</SectionTitle>
      <Field label="Layout">
        <SelectSimple
          value={block.layout}
          onChange={(v) => set("layout", v)}
          options={[
            ["vertical", "Vertical"],
            ["horizontal", "Horizontal"],
            ["grid", "Grid"],
          ]}
        />
      </Field>
      {block.layout === "grid" && (
        <Field label="Columns">
          <SelectSimple
            value={String(block.columns ?? 2)}
            onChange={(v) => set("columns", Number(v))}
            options={[
              ["2", "2"],
              ["3", "3"],
            ]}
          />
        </Field>
      )}
      <Field label="Gap (px)">
        <Input
          type="number"
          value={block.gap ?? 8}
          onChange={(e) => set("gap", Number(e.target.value) || 0)}
        />
      </Field>
      <Field label="Alignment">
        <SelectSimple
          value={block.align ?? "center"}
          onChange={(v) => set("align", v)}
          options={[
            ["left", "Left"],
            ["center", "Center"],
            ["right", "Right"],
            ["stretch", "Stretch"],
          ]}
        />
      </Field>
      <Row>
        <Label className="text-xs">Stack on mobile</Label>
        <Switch
          checked={!!block.stackOnMobile}
          onCheckedChange={(v) => set("stackOnMobile", v)}
        />
      </Row>

      <SectionTitle>Buttons</SectionTitle>
      <div className="space-y-2">
        {buttons.map((b, i) => {
          const open = openIdx === i;
          return (
            <div key={b.id} className="rounded-md border">
              <div className="flex items-center gap-1 p-2">
                <Input
                  value={b.label}
                  placeholder="Label"
                  onChange={(e) => upd(i, { label: e.target.value })}
                  className="h-8"
                />
                <IconBtn label={open ? "Collapse" : "Expand"} onClick={() => setOpenIdx(open ? null : i)}>
                  <ArrowDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                </IconBtn>
              </div>
              {open && (
                <div className="space-y-2 border-t p-2">
                  <Field label="Link URL">
                    <Input
                      value={b.url}
                      placeholder="https://…"
                      onChange={(e) => upd(i, { url: e.target.value })}
                    />
                  </Field>
                  <Row>
                    <Label className="text-xs">Open in new tab</Label>
                    <Switch
                      checked={!!b.newTab}
                      onCheckedChange={(v) => upd(i, { newTab: v })}
                    />
                  </Row>
                  <Row>
                    <Label className="text-xs">Disabled</Label>
                    <Switch
                      checked={!!b.disabled}
                      onCheckedChange={(v) => upd(i, { disabled: v })}
                    />
                  </Row>

                  <SectionTitle>Style</SectionTitle>
                  <Field label="Variant">
                    <SelectSimple
                      value={b.style ?? "filled"}
                      onChange={(v) => upd(i, { style: v as ButtonStyle })}
                      options={BUTTON_STYLES.map(([v, l]) => [v, l] as [string, string])}
                    />
                  </Field>
                  {b.style === "gradient" && (
                    <div className="grid grid-cols-2 gap-2">
                      <NamedColorField label="From" value={b.gradientFrom} onChange={(v) => upd(i, { gradientFrom: v })} />
                      <NamedColorField label="To" value={b.gradientTo} onChange={(v) => upd(i, { gradientTo: v })} />
                      <Field label="Angle (deg)">
                        <Input
                          type="number"
                          value={b.gradientAngle ?? 90}
                          onChange={(e) => upd(i, { gradientAngle: Number(e.target.value) })}
                        />
                      </Field>
                    </div>
                  )}

                  <SectionTitle>Colors — Normal</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <NamedColorField label="Background" value={b.bgColor} onChange={(v) => upd(i, { bgColor: v })} />
                    <NamedColorField label="Text" value={b.textColor} onChange={(v) => upd(i, { textColor: v })} />
                    <NamedColorField label="Border" value={b.borderColor} onChange={(v) => upd(i, { borderColor: v })} />
                  </div>

                  <SectionTitle>Colors — Hover</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <NamedColorField label="Background" value={b.hoverBgColor} onChange={(v) => upd(i, { hoverBgColor: v })} />
                    <NamedColorField label="Text" value={b.hoverTextColor} onChange={(v) => upd(i, { hoverTextColor: v })} />
                    <NamedColorField label="Border" value={b.hoverBorderColor} onChange={(v) => upd(i, { hoverBorderColor: v })} />
                  </div>

                  <SectionTitle>Colors — Pressed</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <NamedColorField label="Background" value={b.pressedBgColor} onChange={(v) => upd(i, { pressedBgColor: v })} />
                    <NamedColorField label="Text" value={b.pressedTextColor} onChange={(v) => upd(i, { pressedTextColor: v })} />
                  </div>
                  <Row>
                    <Label className="text-xs">Auto-contrast text</Label>
                    <Switch
                      checked={b.autoContrast !== false}
                      onCheckedChange={(v) => upd(i, { autoContrast: v })}
                    />
                  </Row>

                  <SectionTitle>Typography</SectionTitle>
                  <FontFamilyField
                    value={b.fontFamily}
                    onChange={(v) => upd(i, { fontFamily: v })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Size (px)">
                      <Input
                        type="number"
                        value={b.fontSizePx ?? ""}
                        onChange={(e) =>
                          upd(i, { fontSizePx: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </Field>
                    <FontWeightField
                      value={b.fontWeight ?? "medium"}
                      onChange={(v) => upd(i, { fontWeight: v as ButtonGroupItem["fontWeight"] })}
                    />
                    <Field label="Letter spacing">
                      <Input
                        type="number"
                        value={b.letterSpacing ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            letterSpacing: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                    <Field label="Line height">
                      <Input
                        type="number"
                        step="0.05"
                        value={b.lineHeight ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            lineHeight: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Text transform">
                    <SelectSimple
                      value={b.textTransform ?? "none"}
                      onChange={(v) => upd(i, { textTransform: v as ButtonGroupItem["textTransform"] })}
                      options={[
                        ["none", "None"],
                        ["uppercase", "Uppercase"],
                        ["lowercase", "Lowercase"],
                        ["capitalize", "Capitalize"],
                      ]}
                    />
                  </Field>

                  <SectionTitle>Layout & sizing</SectionTitle>
                  <Field label="Width">
                    <SelectSimple
                      value={b.widthMode ?? "full"}
                      onChange={(v) => upd(i, { widthMode: v as "full" | "auto" })}
                      options={[
                        ["full", "Full width"],
                        ["auto", "Auto"],
                      ]}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Min height (px)">
                      <Input
                        type="number"
                        value={b.minHeight ?? ""}
                        onChange={(e) =>
                          upd(i, { minHeight: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </Field>
                    <Field label="Radius (px)">
                      <Input
                        type="number"
                        value={b.radius ?? ""}
                        placeholder="9999 = pill"
                        onChange={(e) =>
                          upd(i, { radius: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </Field>
                    <Field label="Padding X">
                      <Input
                        type="number"
                        value={b.paddingX ?? ""}
                        onChange={(e) =>
                          upd(i, { paddingX: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </Field>
                    <Field label="Padding Y">
                      <Input
                        type="number"
                        value={b.paddingY ?? ""}
                        onChange={(e) =>
                          upd(i, { paddingY: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </Field>
                    <Field label="Border width">
                      <Input
                        type="number"
                        value={b.borderWidth ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            borderWidth: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                  </div>

                  <SectionTitle>Icons</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <IconPickerField
                      label="Left icon"
                      value={b.leftIcon}
                      onChange={(v) => upd(i, { leftIcon: v })}
                    />
                    <IconPickerField
                      label="Right icon"
                      value={b.rightIcon}
                      onChange={(v) => upd(i, { rightIcon: v })}
                    />
                    <Field label="Icon size (px)">
                      <Input
                        type="number"
                        value={b.iconSize ?? 16}
                        onChange={(e) => upd(i, { iconSize: Number(e.target.value) })}
                      />
                    </Field>
                    <NamedColorField
                      label="Icon color"
                      value={b.iconColor}
                      onChange={(v) => upd(i, { iconColor: v })}
                    />
                    <Field label="Gap (px)">
                      <Input
                        type="number"
                        value={b.iconGap ?? 8}
                        onChange={(e) => upd(i, { iconGap: Number(e.target.value) })}
                      />
                    </Field>
                  </div>

                  <SectionTitle>Effect</SectionTitle>
                  <Field label="Type">
                    <SelectSimple
                      value={b.effect ?? "none"}
                      onChange={(v) =>
                        upd(i, {
                          effect: v as ButtonGroupItem["effect"],
                        })
                      }
                      options={ITEM_EFFECTS}
                    />
                  </Field>
                  {b.effect && b.effect !== "none" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <NamedColorField
                          label="Color"
                          value={b.effectColor}
                          onChange={(v) => upd(i, { effectColor: v })}
                        />
                        <NamedColorField
                          label="Color 2"
                          value={b.effectColor2}
                          onChange={(v) => upd(i, { effectColor2: v })}
                        />
                        <Field label="Speed (ms)">
                          <Input
                            type="number"
                            value={b.effectSpeed ?? ""}
                            onChange={(e) =>
                              upd(i, {
                                effectSpeed: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                          />
                        </Field>
                        <Field label="Intensity">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={b.effectIntensity ?? ""}
                            onChange={(e) =>
                              upd(i, {
                                effectIntensity: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Trigger">
                        <SelectSimple
                          value={b.effectMode ?? "hover"}
                          onChange={(v) =>
                            upd(i, { effectMode: v as "always" | "hover" | "click" })
                          }
                          options={[
                            ["hover", "Hover"],
                            ["always", "Always"],
                            ["click", "Click"],
                          ]}
                        />
                      </Field>
                    </>
                  )}

                  <SectionTitle>Shadow</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <NamedColorField
                      label="Color"
                      value={b.shadowColor}
                      onChange={(v) => upd(i, { shadowColor: v })}
                    />
                    <Field label="Blur">
                      <Input
                        type="number"
                        value={b.shadowBlur ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            shadowBlur: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                    <Field label="Spread">
                      <Input
                        type="number"
                        value={b.shadowSpread ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            shadowSpread: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                    <Field label="Offset Y">
                      <Input
                        type="number"
                        value={b.shadowY ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            shadowY: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                    <Field label="Opacity (0-1)">
                      <Input
                        type="number"
                        step="0.05"
                        min={0}
                        max={1}
                        value={b.shadowOpacity ?? ""}
                        onChange={(e) =>
                          upd(i, {
                            shadowOpacity: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end gap-0.5 pt-1">
                    <IconBtn label="Duplicate" onClick={() => duplicate(i)}>
                      <Plus className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn label="Move up" onClick={() => move(i, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn label="Move down" onClick={() => move(i, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Remove"
                      onClick={() => onButtons(buttons.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </IconBtn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            const next = [
              ...buttons,
              {
                id: newId(),
                label: "New button",
                url: "https://",
                style: "filled" as ButtonStyle,
                widthMode: "full" as const,
              },
            ];
            onButtons(next);
            setOpenIdx(next.length - 1);
          }}
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add button
        </Button>
      </div>
    </>
  );
}

function IconPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const Icon = value ? ICON_LIBRARY[value] : null;
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/40">
          {Icon ? <Icon size={16} /> : <span className="text-[10px] text-muted-foreground">—</span>}
        </div>
        <Select value={value ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? undefined : v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="__none">None</SelectItem>
            {ICON_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Field>
  );
}


function FileEditor({ block, set }: { block: FileBlock; set: (k: string, v: unknown) => void }) {
  const kindFromMime = (mime?: string): FileBlock["fileKind"] => {
    if (!mime) return block.fileKind ?? "custom";
    if (mime === "application/pdf") return "pdf";
    if (mime.includes("word")) return "docx";
    if (mime.includes("zip")) return "zip";
    if (mime.startsWith("image/")) return "image";
    return "custom";
  };
  return (
    <>
      <MediaFileField
        label="File"
        value={block.fileUrl || undefined}
        fileName={block.fileName}
        pickerTitle="Choose a file"
        hint="Upload a PDF, DOC, XLS, PPT, ZIP or audio file — or pick one from your Media Library."
        onChange={(v) => {
          if (!v) {
            set("fileUrl", "");
            return;
          }
          set("fileUrl", v.url);
          if (v.name) set("fileName", v.name);
          if (v.size) set("sizeLabel", humanBytes(v.size));
          set("fileKind", kindFromMime(v.mime));
        }}
      />
      <Field label="File name">
        <Input value={block.fileName} onChange={(e) => set("fileName", e.target.value)} />
      </Field>
      <Field label="Type">
        <SelectSimple
          value={block.fileKind ?? "pdf"}
          onChange={(v) => set("fileKind", v)}
          options={[
            ["pdf", "PDF"],
            ["docx", "DOCX"],
            ["zip", "ZIP"],
            ["image", "Image"],
            ["custom", "Custom"],
          ]}
        />
      </Field>
      <Field label="Size label">
        <Input
          value={block.sizeLabel ?? ""}
          onChange={(e) => set("sizeLabel", e.target.value)}
          placeholder="e.g. 2.4 MB"
        />
      </Field>
      <Field label="Button label">
        <Input
          value={block.buttonLabel ?? ""}
          onChange={(e) => set("buttonLabel", e.target.value)}
          placeholder="Download"
        />
      </Field>
    </>
  );
}

function humanBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function EmbedEditor({ block, set }: { block: EmbedBlock; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Provider">
        <SelectSimple
          value={block.provider}
          onChange={(v) => set("provider", v)}
          options={[
            ["spotify", "Spotify"],
            ["appleMusic", "Apple Music"],
            ["googleForms", "Google Forms"],
            ["typeform", "Typeform"],
            ["youtube", "YouTube"],
            ["loom", "Loom"],
            ["figma", "Figma"],
            ["canva", "Canva"],
            ["notion", "Notion"],
          ]}
        />
      </Field>
      <Field label="URL">
        <Input
          value={block.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="Paste a trusted embed URL"
        />
      </Field>
      <Field label={`Height (${block.height ?? 232}px)`}>
        <Input
          type="number"
          min={120}
          max={900}
          value={block.height ?? 232}
          onChange={(e) =>
            set("height", Math.max(120, Math.min(900, Number(e.target.value) || 232)))
          }
        />
      </Field>
      <div className="rounded-md border border-dashed p-2 text-[11px] text-muted-foreground">
        Only trusted providers are allowed. Other URLs will be rejected.
      </div>
    </>
  );
}

// ── Shared block settings ───────────────────────────────────────────────
function SharedSettings({
  settings,
  onChange,
}: {
  settings?: BlockSettings;
  onChange: (patch: Partial<BlockSettings>) => void;
}) {
  const s = settings ?? {};
  return (
    <details className="rounded-md border p-2" open={!!settings}>
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        Block settings
      </summary>
      <div className="mt-3 space-y-3">
        <div className="rounded-md border bg-muted/30 p-2">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">
            Section spacing (auto layout)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Top spacing (px)">
              <Input
                type="number"
                min={0}
                max={400}
                placeholder="0"
                value={s.spaceTop ?? ""}
                onChange={(e) => onChange({ spaceTop: numOrUndef(e.target.value) })}
              />
            </Field>
            <Field label="Bottom spacing (px)">
              <Input
                type="number"
                min={0}
                max={400}
                placeholder="Page default"
                value={s.spaceBottom ?? ""}
                onChange={(e) => onChange({ spaceBottom: numOrUndef(e.target.value) })}
              />
            </Field>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Empty bottom spacing uses the page's Default Section Gap. Sections never overlap —
            Spacer blocks are only for creative layouts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Padding Y (px)">
            <Input
              type="number"
              min={0}
              max={200}
              value={s.paddingY ?? ""}
              onChange={(e) => onChange({ paddingY: numOrUndef(e.target.value) })}
            />
          </Field>
          <Field label="Padding X (px)">
            <Input
              type="number"
              min={0}
              max={200}
              value={s.paddingX ?? ""}
              onChange={(e) => onChange({ paddingX: numOrUndef(e.target.value) })}
            />
          </Field>
          <Field label="Margin top (px)">
            <Input
              type="number"
              min={0}
              max={200}
              value={s.marginTop ?? ""}
              onChange={(e) => onChange({ marginTop: numOrUndef(e.target.value) })}
            />
          </Field>
          <Field label="Margin bottom (px)">
            <Input
              type="number"
              min={0}
              max={200}
              value={s.marginBottom ?? ""}
              onChange={(e) => onChange({ marginBottom: numOrUndef(e.target.value) })}
            />
          </Field>
        </div>
        <FontFamilyField
          value={s.fontFamily}
          onChange={(v) => onChange({ fontFamily: v })}
        />
        <Field label="Border radius">
          <SelectSimple
            value={s.radius ?? "none"}
            onChange={(v) => onChange({ radius: v as BlockSettings["radius"] })}
            options={[
              ["none", "None"],
              ["sm", "Small"],
              ["md", "Medium"],
              ["lg", "Large"],
              ["xl", "XL"],
              ["full", "Full"],
            ]}
          />
        </Field>
        <Field label="Background">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={s.background || "#ffffff"}
              onChange={(e) => onChange({ background: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border bg-transparent"
              aria-label="Background color"
            />
            <Input
              value={s.background ?? ""}
              onChange={(e) => onChange({ background: e.target.value || undefined })}
              placeholder="transparent"
            />
          </div>
        </Field>

        <div className="mt-2 border-t pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Motion
          </div>
          <div className="grid gap-2">
            <Field label="Entrance animation">
              <SelectSimple
                value={s.animation ?? "none"}
                onChange={(v) => onChange({ animation: v as BlockSettings["animation"] })}
                options={[
                  ["none", "None"],
                  ["fade", "Fade"],
                  ["fade-up", "Fade up"],
                  ["fade-down", "Fade down"],
                  ["slide-up", "Slide up"],
                  ["slide-down", "Slide down"],
                  ["slide-left", "Slide left"],
                  ["slide-right", "Slide right"],
                  ["zoom", "Zoom"],
                  ["zoom-in", "Zoom in"],
                  ["zoom-out", "Zoom out"],
                  ["rotate", "Rotate"],
                  ["flip", "Flip"],
                  ["bounce", "Bounce"],
                ]}
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Duration (ms)">
                <Input
                  type="number"
                  min={0}
                  max={4000}
                  value={s.animationDuration ?? ""}
                  onChange={(e) => onChange({ animationDuration: numOrUndef(e.target.value) })}
                />
              </Field>
              <Field label="Delay (ms)">
                <Input
                  type="number"
                  min={0}
                  max={4000}
                  value={s.animationDelay ?? ""}
                  onChange={(e) => onChange({ animationDelay: numOrUndef(e.target.value) })}
                />
              </Field>
              <Field label="Repeat">
                <SelectSimple
                  value={s.animationRepeat ?? "once"}
                  onChange={(v) =>
                    onChange({ animationRepeat: v as BlockSettings["animationRepeat"] })
                  }
                  options={[
                    ["once", "Once"],
                    ["infinite", "Infinite"],
                  ]}
                />
              </Field>
            </div>
            <Field label="Hover effect">
              <SelectSimple
                value={s.hover ?? "none"}
                onChange={(v) => onChange({ hover: v as BlockSettings["hover"] })}
                options={[
                  ["none", "None"],
                  ["lift", "Lift"],
                  ["scale", "Scale"],
                  ["glow", "Glow"],
                  ["pulse", "Pulse"],
                  ["tilt", "Tilt"],
                  ["shine", "Shine"],
                ]}
              />
            </Field>
            <Field label="Button effect">
              <SelectSimple
                value={s.buttonEffect ?? "none"}
                onChange={(v) => onChange({ buttonEffect: v as BlockSettings["buttonEffect"] })}
                options={[
                  ["none", "None"],
                  ["shine", "Shine"],
                  ["ripple", "Ripple"],
                  ["neon", "Neon"],
                  ["floating", "Floating"],
                  ["pulse", "Pulse"],
                  ["bounce", "Bounce"],
                  ["glow", "Glow"],
                  ["gradientFlow", "Gradient Flow"],
                  ["magnetic", "Magnetic Hover"],
                  ["glass", "Glass Reflection"],
                  ["borderGlow", "Border Glow"],
                  ["breathing", "Soft Breathing"],
                  ["shake", "Shake Attention"],
                  ["floatingGlow", "Floating Glow"],
                  ["lift3d", "3D Lift"],
                  ["liquidFill", "Liquid Fill"],
                  ["rainbowBorder", "Rainbow Border"],
                  ["spotlight", "Spotlight Hover"],
                  ["premiumCta", "Premium CTA"],
                ]}
              />
            </Field>
            <ButtonEffectControls s={s} onChange={onChange} />

          </div>
        </div>

        <div className="mt-2 border-t pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Responsive
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Desktop">
              <Switch
                checked={s.visibility?.desktop !== false}
                onCheckedChange={(v) =>
                  onChange({ visibility: { ...(s.visibility ?? {}), desktop: v } })
                }
              />
            </Field>
            <Field label="Tablet">
              <Switch
                checked={s.visibility?.tablet !== false}
                onCheckedChange={(v) =>
                  onChange({ visibility: { ...(s.visibility ?? {}), tablet: v } })
                }
              />
            </Field>
            <Field label="Mobile">
              <Switch
                checked={s.visibility?.mobile !== false}
                onCheckedChange={(v) =>
                  onChange({ visibility: { ...(s.visibility ?? {}), mobile: v } })
                }
              />
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Field label="Mobile font ×">
              <Input
                type="number"
                step="0.05"
                min={0.5}
                max={2}
                value={s.responsive?.mobile?.fontScale ?? ""}
                onChange={(e) =>
                  onChange({
                    responsive: {
                      ...(s.responsive ?? {}),
                      mobile: {
                        ...(s.responsive?.mobile ?? {}),
                        fontScale: numOrUndef(e.target.value),
                      },
                    },
                  })
                }
              />
            </Field>
            <Field label="Tablet font ×">
              <Input
                type="number"
                step="0.05"
                min={0.5}
                max={2}
                value={s.responsive?.tablet?.fontScale ?? ""}
                onChange={(e) =>
                  onChange({
                    responsive: {
                      ...(s.responsive ?? {}),
                      tablet: {
                        ...(s.responsive?.tablet ?? {}),
                        fontScale: numOrUndef(e.target.value),
                      },
                    },
                  })
                }
              />
            </Field>
            <Field label="Desktop font ×">
              <Input
                type="number"
                step="0.05"
                min={0.5}
                max={2}
                value={s.responsive?.desktop?.fontScale ?? ""}
                onChange={(e) =>
                  onChange({
                    responsive: {
                      ...(s.responsive ?? {}),
                      desktop: {
                        ...(s.responsive?.desktop ?? {}),
                        fontScale: numOrUndef(e.target.value),
                      },
                    },
                  })
                }
              />
            </Field>
          </div>
        </div>
      </div>
    </details>
  );
}
function numOrUndef(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

// ── Countdown datetime helpers ──────────────────────────────────────────
function toLocalDT(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}
function fromLocalDT(v: string): string {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/* ────────────────────────────────────────────────────────────────────────
   Button Effect controls (v2.0). Renders per-effect fields based on the
   currently-selected effect id. Keep in sync with `ButtonEffect` in
   src/features/builder/types.ts and the CSS classes in src/styles.css.
   ──────────────────────────────────────────────────────────────────────── */

const DIRECTION_OPTIONS: Array<[string, string]> = [
  ["lr", "Left → Right"],
  ["rl", "Right → Left"],
  ["tb", "Top → Bottom"],
  ["bt", "Bottom → Top"],
  ["diag", "Diagonal"],
];

function ButtonEffectControls({
  s,
  onChange,
}: {
  s: BlockSettings;
  onChange: (patch: Partial<BlockSettings>) => void;
}) {
  const fx = s.buttonEffect ?? "none";
  if (fx === "none") return null;

  const Num = ({
    label,
    field,
    min,
    max,
    step = 1,
    fallback,
  }: {
    label: string;
    field: keyof BlockSettings;
    min?: number;
    max?: number;
    step?: number;
    fallback?: number;
  }) => (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={(s[field] as number | undefined) ?? fallback ?? ""}
        onChange={(e) =>
          onChange({ [field]: e.target.value === "" ? undefined : Number(e.target.value) } as Partial<BlockSettings>)
        }
      />
    </Field>
  );
  const Color = ({
    label,
    field,
    fallback = "#6366f1",
  }: {
    label: string;
    field: "buttonEffectColor" | "buttonEffectColor2";
    fallback?: string;
  }) => (
    <Field label={label}>
      <Input
        type="color"
        className="h-9 w-full p-1"
        value={(s[field] as string | undefined) ?? fallback}
        onChange={(e) => onChange({ [field]: e.target.value })}
      />
    </Field>
  );
  const Dir = () => (
    <Field label="Direction">
      <SelectSimple
        value={s.buttonEffectDirection ?? "lr"}
        onChange={(v) =>
          onChange({ buttonEffectDirection: v as BlockSettings["buttonEffectDirection"] })
        }
        options={DIRECTION_OPTIONS}
      />
    </Field>
  );

  const gradient = s.buttonEffectGradient ?? ["#6366f1", "#ec4899", "#f59e0b"];

  return (
    <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-2">
      <Field label="Enabled">
        <Switch
          checked={s.buttonEffectEnabled !== false}
          onCheckedChange={(v) => onChange({ buttonEffectEnabled: v })}
        />
      </Field>

      {fx === "shine" && (
        <>
          <Field label="Trigger">
            <SelectSimple
              value={s.buttonEffectMode ?? "hover"}
              onChange={(v) =>
                onChange({ buttonEffectMode: v as BlockSettings["buttonEffectMode"] })
              }
              options={[["always", "Always"], ["hover", "Hover"], ["click", "Click"]]}
            />
          </Field>
          <Dir />
          <Num label="Sweep width (%)" field="buttonEffectSize" min={10} max={100} fallback={40} />
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={200} max={10000} step={100} fallback={1500} />
          <Num label="Delay (ms)" field="buttonEffectDelay" min={0} max={5000} step={50} fallback={0} />
          <Color label="Shine color" field="buttonEffectColor2" fallback="#ffffff" />
        </>
      )}

      {fx === "ripple" && (
        <>
          <Color label="Ripple color" field="buttonEffectColor" />
          <Num label="Max size" field="buttonEffectDistance" min={10} max={80} fallback={30} />
          <Num label="Duration (ms)" field="buttonEffectSpeed" min={100} max={2000} step={50} fallback={600} />
          <Num label="Opacity" field="buttonEffectOpacity" min={0.1} max={1} step={0.05} fallback={0.55} />
        </>
      )}

      {fx === "neon" && (
        <>
          <Color label="Glow color" field="buttonEffectColor" />
          <Num label="Glow strength" field="buttonEffectIntensity" min={20} max={200} fallback={50} />
          <Num label="Pulse speed (ms)" field="buttonEffectSpeed" min={400} max={6000} step={100} fallback={2000} />
          <Field label="Mode">
            <SelectSimple
              value={s.buttonEffectMode ?? "hover"}
              onChange={(v) =>
                onChange({ buttonEffectMode: v as BlockSettings["buttonEffectMode"] })
              }
              options={[["hover", "Animated"], ["always", "Animated (always)"], ["click", "Static"]]}
            />
          </Field>
        </>
      )}

      {(fx === "floating" || fx === "floatingGlow") && (
        <>
          <Num label="Distance (px)" field="buttonEffectDistance" min={1} max={30} fallback={4} />
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={500} max={10000} step={100} fallback={3000} />
          <Dir />
          {fx === "floatingGlow" && <Color label="Glow color" field="buttonEffectColor" />}
        </>
      )}

      {fx === "pulse" && (
        <>
          <Num label="Scale" field="buttonEffectScale" min={1.01} max={1.4} step={0.01} fallback={1.04} />
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={300} max={6000} step={100} fallback={1600} />
        </>
      )}

      {fx === "bounce" && (
        <>
          <Num label="Height (px)" field="buttonEffectDistance" min={2} max={40} fallback={8} />
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={400} max={6000} step={100} fallback={1400} />
        </>
      )}

      {fx === "glow" && (
        <>
          <Color label="Glow color" field="buttonEffectColor" />
          <Num label="Blur (px)" field="buttonEffectSize" min={4} max={80} fallback={24} />
          <Num label="Intensity" field="buttonEffectIntensity" min={20} max={200} fallback={50} />
        </>
      )}

      {(fx === "gradientFlow" || fx === "borderGlow" || fx === "rainbowBorder") && (
        <>
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={800} max={20000} step={100} fallback={fx === "rainbowBorder" ? 4000 : 6000} />
          {(fx === "borderGlow" || fx === "rainbowBorder") && (
            <Num label="Border width (px)" field="buttonEffectSize" min={1} max={8} fallback={2} />
          )}
          {(fx === "gradientFlow" || fx === "borderGlow") && (
            <>
              <Dir />
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <Field key={i} label={`Color ${i + 1}`}>
                    <Input
                      type="color"
                      className="h-9 w-full p-1"
                      value={gradient[i] ?? "#6366f1"}
                      onChange={(e) => {
                        const next = [...gradient];
                        next[i] = e.target.value;
                        onChange({ buttonEffectGradient: next });
                      }}
                    />
                  </Field>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {fx === "magnetic" && (
        <>
          <Num label="Pull distance (px)" field="buttonEffectDistance" min={4} max={60} fallback={20} />
          <Num label="Sensitivity" field="buttonEffectIntensity" min={10} max={100} fallback={50} />
          <div className="text-[11px] text-muted-foreground">Desktop only — touch devices disable this effect.</div>
        </>
      )}

      {fx === "glass" && (
        <>
          <Num label="Reflection width (%)" field="buttonEffectSize" min={10} max={100} fallback={40} />
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={800} max={10000} step={100} fallback={4000} />
          <Num label="Opacity" field="buttonEffectOpacity" min={0.1} max={1} step={0.05} fallback={0.5} />
          <Color label="Reflection tint" field="buttonEffectColor2" fallback="#ffffff" />
        </>
      )}

      {fx === "breathing" && (
        <>
          <Num label="Scale" field="buttonEffectScale" min={1.01} max={1.15} step={0.01} fallback={1.03} />
          <Num label="Duration (ms)" field="buttonEffectSpeed" min={1000} max={8000} step={100} fallback={3200} />
        </>
      )}

      {fx === "shake" && (
        <>
          <Num label="Distance (px)" field="buttonEffectDistance" min={1} max={12} fallback={4} />
          <Num label="Speed (ms)" field="buttonEffectSpeed" min={300} max={2000} step={50} fallback={600} />
          <Num label="Repeat delay (ms)" field="buttonEffectDelay" min={0} max={20000} step={100} fallback={3000} />
        </>
      )}

      {fx === "lift3d" && (
        <>
          <Num label="Elevation (px)" field="buttonEffectDistance" min={2} max={20} fallback={6} />
        </>
      )}

      {fx === "liquidFill" && (
        <>
          <Color label="Fill color" field="buttonEffectColor" />
          <Num label="Fill speed (ms)" field="buttonEffectSpeed" min={150} max={3000} step={50} fallback={500} />
          <Dir />
        </>
      )}

      {fx === "spotlight" && (
        <>
          <Color label="Spotlight color" field="buttonEffectColor2" fallback="#ffffff" />
          <Num label="Spot radius (px)" field="buttonEffectSize" min={40} max={400} fallback={120} />
          <Num label="Light strength" field="buttonEffectIntensity" min={10} max={100} fallback={60} />
          <div className="text-[11px] text-muted-foreground">Desktop only.</div>
        </>
      )}

      {fx === "premiumCta" && (
        <>
          <Color label="Accent color" field="buttonEffectColor" />
          <Color label="Shine tint" field="buttonEffectColor2" fallback="#ffffff" />
          <div className="text-[11px] text-muted-foreground">
            Composite: Glow + Breathing + Floating + Shine — tuned for conversion.
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────── Hero Effects Studio (v2.0) ─────────── */

import type { HeroEffectsConfig } from "../effects/hero-effects";
import { DEFAULT_HERO_EFFECTS } from "../effects/hero-effects";

type ProfileBlockT = Extract<Block, { type: "profile" }>;

function HeroEffectsStudio({
  block,
  update,
}: {
  block: ProfileBlockT;
  update: (id: string, patch: Partial<Block>) => void;
}) {
  const fx: HeroEffectsConfig = block.effects ?? {};
  function setFx(patch: Partial<HeroEffectsConfig>) {
    update(block.id, { effects: { ...fx, ...patch } } as Partial<Block>);
  }
  function setGroup<K extends keyof HeroEffectsConfig>(
    key: K,
    patch: Partial<NonNullable<HeroEffectsConfig[K]>>,
  ) {
    const cur = (fx[key] ?? {}) as Record<string, unknown>;
    setFx({ [key]: { ...cur, ...patch } } as Partial<HeroEffectsConfig>);
  }
  const a = { ...DEFAULT_HERO_EFFECTS.avatar, ...fx.avatar };
  const r = { ...DEFAULT_HERO_EFFECTS.ring, ...fx.ring };
  const bd = { ...DEFAULT_HERO_EFFECTS.badge, ...fx.badge };
  const c = { ...DEFAULT_HERO_EFFECTS.card, ...fx.card };
  const bg = { ...DEFAULT_HERO_EFFECTS.background, ...fx.background };
  const enabled = fx.enabled !== false;

  return (
    <>
      <SectionTitle>Hero Effects Studio</SectionTitle>

      <div className="flex items-center justify-between rounded-md border p-2">
        <div className="text-xs">
          <div className="font-medium">Effects enabled</div>
          <div className="text-muted-foreground">Master switch for all hero animations.</div>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => setFx({ enabled: v })} />
      </div>
      <div className="flex items-center justify-between rounded-md border p-2">
        <div className="text-xs">
          <div className="font-medium">Reduce motion</div>
          <div className="text-muted-foreground">Force-disable animations for this block.</div>
        </div>
        <Switch
          checked={fx.reduceMotion === true}
          onCheckedChange={(v) => setFx({ reduceMotion: v })}
        />
      </div>

      {/* Avatar */}
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Avatar
      </div>
      <Field label="Effect">
        <SelectSimple
          value={a.effect ?? "none"}
          onChange={(v) => setGroup("avatar", { effect: v as typeof a.effect })}
          options={[
            ["none", "None"],
            ["glow", "Glow"],
            ["floating", "Floating"],
            ["softFloating", "Soft floating"],
            ["pulse", "Pulse"],
            ["breathing", "Breathing"],
            ["bounce", "Bounce"],
            ["neonGlow", "Neon glow"],
            ["shadowDepth", "Shadow depth"],
            ["blurGlow", "Blur glow"],
          ]}
        />
      </Field>
      {(a.effect ?? "none") !== "none" && (
        <>
          <NamedColorField
            label="Color"
            value={a.color}
            onChange={(v) => setGroup("avatar", { color: v })}
          />
          <Field label="Intensity (0–100)">
            <Input
              type="number"
              min={0}
              max={100}
              value={a.strength ?? 60}
              onChange={(e) => setGroup("avatar", { strength: Number(e.target.value) })}
            />
          </Field>
          <Field label="Speed (ms)">
            <Input
              type="number"
              min={200}
              max={20000}
              value={a.speed ?? 3200}
              onChange={(e) => setGroup("avatar", { speed: Number(e.target.value) })}
            />
          </Field>
        </>
      )}

      {/* Ring */}
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Ring
      </div>
      <Field label="Style">
        <SelectSimple
          value={r.style ?? "none"}
          onChange={(v) => setGroup("ring", { style: v as typeof r.style })}
          options={[
            ["none", "None"],
            ["solid", "Solid"],
            ["gradient", "Gradient"],
            ["animatedGradient", "Animated gradient"],
            ["neon", "Neon"],
            ["glass", "Glass"],
            ["double", "Double"],
            ["dashed", "Dashed"],
          ]}
        />
      </Field>
      {(r.style ?? "none") !== "none" && (
        <>
          <Field label="Animation">
            <SelectSimple
              value={r.animation ?? "static"}
              onChange={(v) => setGroup("ring", { animation: v as typeof r.animation })}
              options={[
                ["static", "Static"],
                ["rotateCw", "Rotate CW"],
                ["rotateCcw", "Rotate CCW"],
                ["pulse", "Pulse"],
                ["expand", "Expand"],
                ["ripple", "Ripple"],
              ]}
            />
          </Field>
          <Field label="Width (px)">
            <Input
              type="number"
              min={1}
              max={24}
              value={r.width ?? 3}
              onChange={(e) => setGroup("ring", { width: Number(e.target.value) })}
            />
          </Field>
          <NamedColorField
            label="Color"
            value={r.color}
            onChange={(v) => setGroup("ring", { color: v })}
          />
          <NamedColorField
            label="Color 2 (gradient)"
            value={r.color2}
            onChange={(v) => setGroup("ring", { color2: v })}
          />
          <Field label="Speed (ms)">
            <Input
              type="number"
              min={500}
              max={20000}
              value={r.speed ?? 4000}
              onChange={(e) => setGroup("ring", { speed: Number(e.target.value) })}
            />
          </Field>
        </>
      )}

      {/* Badge */}
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Verified badge
      </div>
      <Field label="Effect">
        <SelectSimple
          value={bd.effect ?? "static"}
          onChange={(v) => setGroup("badge", { effect: v as typeof bd.effect })}
          options={[
            ["static", "Static"],
            ["pulse", "Pulse"],
            ["glow", "Glow"],
            ["shine", "Shine"],
            ["bounce", "Bounce"],
            ["blink", "Blink"],
            ["rotate", "Rotate"],
            ["floating", "Floating"],
          ]}
        />
      </Field>
      {(bd.effect ?? "static") !== "static" && (
        <>
          <NamedColorField
            label="Color"
            value={bd.color}
            onChange={(v) => setGroup("badge", { color: v })}
          />
          <Field label="Speed (ms)">
            <Input
              type="number"
              min={200}
              max={10000}
              value={bd.speed ?? 1600}
              onChange={(e) => setGroup("badge", { speed: Number(e.target.value) })}
            />
          </Field>
        </>
      )}

      {/* Card */}
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Card container
      </div>
      <Field label="Effect">
        <SelectSimple
          value={c.effect ?? "none"}
          onChange={(v) => setGroup("card", { effect: v as typeof c.effect })}
          options={[
            ["none", "None"],
            ["glass", "Glass"],
            ["floating", "Floating"],
            ["borderGlow", "Border glow"],
            ["animatedBorder", "Animated border"],
            ["gradientBorder", "Gradient border"],
            ["spotlight", "Spotlight"],
            ["shadowLift", "Shadow lift"],
            ["aurora", "Aurora"],
          ]}
        />
      </Field>
      {(c.effect ?? "none") !== "none" && (
        <>
          <Field label="Radius (px)">
            <Input
              type="number"
              min={0}
              max={64}
              value={c.borderRadius ?? 20}
              onChange={(e) => setGroup("card", { borderRadius: Number(e.target.value) })}
            />
          </Field>
          <Field label="Shadow (0–100)">
            <Input
              type="number"
              min={0}
              max={100}
              value={c.shadow ?? 30}
              onChange={(e) => setGroup("card", { shadow: Number(e.target.value) })}
            />
          </Field>
          <NamedColorField
            label="Glow color"
            value={c.glowColor}
            onChange={(v) => setGroup("card", { glowColor: v })}
          />
          <NamedColorField
            label="Border color"
            value={c.borderColor}
            onChange={(v) => setGroup("card", { borderColor: v })}
          />
        </>
      )}

      {/* Background effect */}
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Background effect
      </div>
      <Field label="Effect">
        <SelectSimple
          value={bg.effect ?? "none"}
          onChange={(v) => setGroup("background", { effect: v as typeof bg.effect })}
          options={[
            ["none", "None"],
            ["animatedGradient", "Animated gradient"],
            ["aurora", "Aurora"],
            ["meshGradient", "Mesh gradient"],
            ["particles", "Particles"],
            ["glassOverlay", "Glass overlay"],
            ["blurOverlay", "Blur overlay"],
            ["ambientGlow", "Ambient glow"],
          ]}
        />
      </Field>
      {(bg.effect ?? "none") !== "none" && (
        <>
          <NamedColorField
            label="Color 1"
            value={bg.color1}
            onChange={(v) => setGroup("background", { color1: v })}
          />
          <NamedColorField
            label="Color 2"
            value={bg.color2}
            onChange={(v) => setGroup("background", { color2: v })}
          />
          <NamedColorField
            label="Color 3"
            value={bg.color3}
            onChange={(v) => setGroup("background", { color3: v })}
          />
          <Field label="Speed (ms)">
            <Input
              type="number"
              min={1000}
              max={30000}
              value={bg.speed ?? 8000}
              onChange={(e) => setGroup("background", { speed: Number(e.target.value) })}
            />
          </Field>
        </>
      )}
      <Field label="Overlay opacity (0–1)">
        <Input
          type="number"
          step="0.05"
          min={0}
          max={1}
          value={bg.overlayOpacity ?? 0.35}
          onChange={(e) => setGroup("background", { overlayOpacity: Number(e.target.value) })}
        />
      </Field>
    </>
  );
}
