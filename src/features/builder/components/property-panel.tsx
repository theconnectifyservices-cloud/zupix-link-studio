import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useBuilderStore, selectedBlock } from "../store";
import type {
  Block,
  ButtonAction,
  SocialLink,
  SocialPlatform,
  TextAlign,
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

/** Right sidebar — properties for the currently selected block. */
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

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Editing
        </div>
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
            <Textarea rows={2} value={block.bio ?? ""} onChange={(e) => set("bio", e.target.value)} />
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
            <Switch
              checked={!!block.verified}
              onCheckedChange={(v) => set("verified", v)}
            />
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
          <FontWeightField value={block.fontWeight ?? "bold"} onChange={(v) => set("fontWeight", v)} />
          <ColorField value={block.color} onChange={(v) => set("color", v)} />
        </>
      )}

      {block.type === "text" && (
        <>
          <Field label="Style">
            <Select value={block.kind ?? "paragraph"} onValueChange={(v) => set("kind", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="heading">Heading</SelectItem>
                <SelectItem value="paragraph">Paragraph</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Text">
            <Textarea rows={5} value={block.text} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <AlignField value={block.align} onChange={(v) => set("align", v)} />
          <FontSizeField value={block.fontSize ?? "sm"} onChange={(v) => set("fontSize", v)} />
          <FontWeightField value={block.fontWeight ?? "normal"} onChange={(v) => set("fontWeight", v)} />
          <ColorField value={block.color} onChange={(v) => set("color", v)} />
        </>
      )}

      {block.type === "button" && (
        <>
          <Field label="Title">
            <Input value={block.label} onChange={(e) => set("label", e.target.value)} />
          </Field>
          <Field label="Action">
            <Select
              value={block.action ?? "website"}
              onValueChange={(v) => set("action", v as ButtonAction)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(
                  [
                    "website","whatsapp","phone","email","telegram",
                    "instagram","facebook","youtube","x","linkedin","custom",
                  ] as ButtonAction[]
                ).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="URL / value">
            <Input
              value={block.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Style">
            <Select value={block.style} onValueChange={(v) => set("style", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Width">
            <Select value={block.width ?? "full"} onValueChange={(v) => set("width", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="half">Half</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Alignment">
            <Select value={block.align ?? "center"} onValueChange={(v) => set("align", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Row>
            <Label className="text-xs">Open in new tab</Label>
            <Switch checked={block.newTab !== false} onCheckedChange={(v) => set("newTab", v)} />
          </Row>
          <Row>
            <Label className="text-xs">Disabled</Label>
            <Switch checked={!!block.disabled} onCheckedChange={(v) => set("disabled", v)} />
          </Row>
        </>
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
            <Select value={block.rounded ?? "md"} onValueChange={(v) => set("rounded", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fit">
            <Select value={block.fit ?? "cover"} onValueChange={(v) => set("fit", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}

      {block.type === "divider" && (
        <>
          <Field label="Style">
            <Select value={block.style ?? "solid"} onValueChange={(v) => set("style", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Thickness">
            <Select value={block.thickness} onValueChange={(v) => set("thickness", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thin">Thin</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="thick">Thick</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Spacing">
            <Select value={block.spacing ?? "md"} onValueChange={(v) => set("spacing", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
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

      {def &&
        !["profile","heading","text","button","image","divider","spacer","social"].includes(block.type) && (
          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Properties for {def.label} arrive in a later phase.
          </div>
        )}
    </div>
  );
}

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

function AlignField({
  value,
  onChange,
}: {
  value: TextAlign;
  onChange: (v: TextAlign) => void;
}) {
  return (
    <Field label="Alignment">
      <Select value={value} onValueChange={(v) => onChange(v as TextAlign)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Left</SelectItem>
          <SelectItem value="center">Center</SelectItem>
          <SelectItem value="right">Right</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function FontSizeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Font size">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {["xs","sm","base","lg","xl","2xl","3xl"].map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function FontWeightField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Font weight">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {["normal","medium","semibold","bold"].map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
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

const PLATFORMS: SocialPlatform[] = [
  "instagram","facebook","youtube","tiktok","threads","linkedin",
  "pinterest","telegram","whatsapp","github","twitter","website","custom",
];

function SocialEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (v: SocialLink[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    const [item] = next.splice(i, 1);
    next.splice(target, 0, item);
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
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
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
            <Button variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove"
              onClick={() => onChange(links.filter((_, j) => j !== i))}
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
          onChange([...links, { id: newId(), platform: "instagram", url: "" }])
        }
      >
        <Plus className="mr-2 h-3.5 w-3.5" /> Add link
      </Button>
    </div>
  );
}
