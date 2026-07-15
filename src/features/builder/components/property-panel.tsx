import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
  SocialFeedBlock,
  SocialLink,
  SocialPlatform,
  Testimonial,
  TextAlign,
  VideoBlock,
} from "../types";
import { newId } from "../types";
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
          <Field label="Avatar URL">
            <Input
              value={block.avatarUrl ?? ""}
              onChange={(e) => set("avatarUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Cover image URL">
            <Input
              value={block.coverUrl ?? ""}
              onChange={(e) => set("coverUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Row>
            <Label className="text-xs">Verified badge</Label>
            <Switch checked={!!block.verified} onCheckedChange={(v) => set("verified", v)} />
          </Row>
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
          <Field label="Font family">
            <Input
              value={block.fontFamily ?? ""}
              onChange={(e) => set("fontFamily", e.target.value || undefined)}
              placeholder="Inherit theme"
            />
          </Field>
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
        <ButtonGroupEditor
          layout={block.layout}
          columns={block.columns}
          buttons={block.buttons}
          onLayout={(v) => set("layout", v)}
          onColumns={(v) => set("columns", v)}
          onButtons={(v) => set("buttons", v)}
        />
      )}

      {block.type === "image" && (
        <>
          <Field label="Image URL">
            <Input
              value={block.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
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
      <Field label="Video URL">
        <Input
          value={block.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Field label="Thumbnail URL">
        <Input
          value={block.thumbnailUrl ?? ""}
          onChange={(e) => set("thumbnailUrl", e.target.value)}
          placeholder="https://…"
        />
      </Field>
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
      <div className="space-y-2">
        <Label className="text-xs">Images</Label>
        {images.map((img, i) => (
          <div key={img.id} className="space-y-1.5 rounded-md border p-2">
            <Input
              value={img.url}
              placeholder="https://…"
              onChange={(e) => {
                const n = [...images];
                n[i] = { ...img, url: e.target.value };
                onImages(n);
              }}
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
            <Input
              value={t.avatarUrl ?? ""}
              placeholder="Avatar URL"
              onChange={(e) => upd(i, { avatarUrl: e.target.value })}
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

function ButtonGroupEditor({
  layout,
  columns,
  buttons,
  onLayout,
  onColumns,
  onButtons,
}: {
  layout: "horizontal" | "vertical" | "grid";
  columns?: 2 | 3;
  buttons: ButtonGroupItem[];
  onLayout: (v: string) => void;
  onColumns: (v: number) => void;
  onButtons: (v: ButtonGroupItem[]) => void;
}) {
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
  return (
    <>
      <Field label="Layout">
        <SelectSimple
          value={layout}
          onChange={onLayout}
          options={[
            ["vertical", "Vertical"],
            ["horizontal", "Horizontal"],
            ["grid", "Grid"],
          ]}
        />
      </Field>
      {layout === "grid" && (
        <Field label="Columns">
          <SelectSimple
            value={String(columns ?? 2)}
            onChange={(v) => onColumns(Number(v))}
            options={[
              ["2", "2"],
              ["3", "3"],
            ]}
          />
        </Field>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Buttons</Label>
        {buttons.map((b, i) => (
          <div key={b.id} className="space-y-1.5 rounded-md border p-2">
            <Input
              value={b.label}
              placeholder="Label"
              onChange={(e) => upd(i, { label: e.target.value })}
            />
            <Input
              value={b.url}
              placeholder="https://…"
              onChange={(e) => upd(i, { url: e.target.value })}
            />
            <SelectSimple
              value={b.style ?? "filled"}
              onChange={(v) => upd(i, { style: v as ButtonStyle })}
              options={[
                ["filled", "Filled"],
                ["outline", "Outline"],
                ["soft", "Soft"],
              ]}
            />
            <div className="flex justify-end gap-0.5">
              <IconBtn label="Up" onClick={() => move(i, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Down" onClick={() => move(i, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Remove" onClick={() => onButtons(buttons.filter((_, j) => j !== i))}>
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
            onButtons([
              ...buttons,
              { id: newId(), label: "New button", url: "https://", style: "filled" },
            ])
          }
        >
          <Plus className="mr-2 h-3.5 w-3.5" /> Add button
        </Button>
      </div>
    </>
  );
}

function FileEditor({ block, set }: { block: FileBlock; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="File URL">
        <Input
          value={block.fileUrl}
          onChange={(e) => set("fileUrl", e.target.value)}
          placeholder="https://…"
        />
      </Field>
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
                ]}
              />
            </Field>
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
