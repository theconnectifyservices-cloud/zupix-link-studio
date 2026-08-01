/**
 * Configuration panels for the Social & Contact block family.
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ContactActionBlock,
  FollowCardBlock,
  QrContactBlock,
  SocialButtonItem,
  SocialButtonsBlock,
  SocialLink,
  SocialPlatform,
  SocialSurfaceStyle,
  TextAlign,
} from "../types";
import { newId } from "../types";
import { contactActionMeta } from "./social-contact-render";
import { ImageField } from "./image-field";

type Set = (key: string, value: unknown) => void;

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

const STYLES: SocialSurfaceStyle[] = ["filled", "outline", "soft", "glass"];
const ALIGNS: TextAlign[] = ["left", "center", "right"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function StyleSelect({ value, onChange }: { value: SocialSurfaceStyle; onChange: (v: SocialSurfaceStyle) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SocialSurfaceStyle)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STYLES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AlignSelect({ value, onChange }: { value: TextAlign; onChange: (v: TextAlign) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TextAlign)}>
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALIGNS.map((a) => (
          <SelectItem key={a} value={a} className="capitalize">
            {a}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Social Buttons ───────────────────────────────────────────────────────
export function SocialButtonsEditor({ block, set }: { block: SocialButtonsBlock; set: Set }) {
  const items = block.items ?? [];
  const patch = (id: string, p: Partial<SocialButtonItem>) =>
    set("items", items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("items", next);
  };

  return (
    <div className="space-y-4">
      <Field label="Layout">
        <Select value={block.layout ?? "stack"} onValueChange={(v) => set("layout", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stack">Stacked</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {block.layout === "grid" && (
        <Field label={`Columns (${block.columns ?? 2})`}>
          <Slider
            min={1}
            max={4}
            step={1}
            value={[block.columns ?? 2]}
            onValueChange={([v]) => set("columns", v)}
          />
        </Field>
      )}
      <Field label="Button style">
        <StyleSelect value={block.style ?? "filled"} onChange={(v) => set("style", v)} />
      </Field>
      <Field label={`Corner radius (${block.radius ?? 12}px)`}>
        <Slider min={0} max={32} step={1} value={[block.radius ?? 12]} onValueChange={([v]) => set("radius", v)} />
      </Field>
      <Row label="Show icons">
        <Switch checked={block.showIcons !== false} onCheckedChange={(v) => set("showIcons", v)} />
      </Row>
      <Row label="Alignment">
        <AlignSelect value={block.align ?? "center"} onChange={(v) => set("align", v)} />
      </Row>
      <Field label="Colour mode">
        <Select value={block.colorMode ?? "brand"} onValueChange={(v) => set("colorMode", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brand">Official brand colours</SelectItem>
            <SelectItem value="custom">Custom colour</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {block.colorMode === "custom" && (
        <Field label="Custom colour">
          <Input
            type="color"
            value={block.customColor ?? "#6366F1"}
            onChange={(e) => set("customColor", e.target.value)}
          />
        </Field>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Buttons</Label>
        {items.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-lg border p-2">
            <div className="flex items-center gap-1">
              <Select value={item.platform} onValueChange={(v) => patch(item.id, { platform: v as SocialPlatform })}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(index, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(index, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => set("items", items.filter((i) => i.id !== item.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              placeholder="Label"
              value={item.label ?? ""}
              onChange={(e) => patch(item.id, { label: e.target.value })}
            />
            <Input
              placeholder="https://…"
              value={item.url}
              onChange={(e) => patch(item.id, { url: e.target.value })}
            />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            set("items", [
              ...items,
              { id: newId(), platform: "instagram", label: "Instagram", url: "https://" },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add button
        </Button>
      </div>
    </div>
  );
}

// ── Contact action buttons ───────────────────────────────────────────────
export function ContactActionEditor({ block, set }: { block: ContactActionBlock; set: Set }) {
  const meta = contactActionMeta(block.type);
  const valueLabel =
    block.type === "emailButton"
      ? "Email address"
      : block.type === "telegramButton"
        ? "Telegram username or link"
        : "Phone number (with country code)";
  const supportsMessage = block.type !== "callButton";

  return (
    <div className="space-y-4">
      <Field label={valueLabel}>
        <Input
          value={block.value ?? ""}
          placeholder={meta.placeholder}
          onChange={(e) => set("value", e.target.value)}
        />
      </Field>
      <Field label="Button label">
        <Input
          value={block.label ?? ""}
          placeholder={meta.label}
          onChange={(e) => set("label", e.target.value)}
        />
      </Field>
      {block.type === "emailButton" && (
        <Field label="Subject">
          <Input value={block.subject ?? ""} onChange={(e) => set("subject", e.target.value)} />
        </Field>
      )}
      {supportsMessage && (
        <Field label={block.type === "emailButton" ? "Body" : "Prefilled message"}>
          <Textarea
            rows={2}
            value={block.message ?? ""}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Hi! I'd like to know more…"
          />
        </Field>
      )}
      <Field label="Style">
        <StyleSelect value={block.style ?? "filled"} onChange={(v) => set("style", v)} />
      </Field>
      <Field label="Size">
        <Select value={block.size ?? "md"} onValueChange={(v) => set("size", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Width">
        <Select value={block.width ?? "full"} onValueChange={(v) => set("width", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full width</SelectItem>
            <SelectItem value="auto">Fit content</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Row label="Alignment">
        <AlignSelect value={block.align ?? "center"} onChange={(v) => set("align", v)} />
      </Row>
      <Field label={`Corner radius (${block.radius ?? 12}px)`}>
        <Slider min={0} max={32} step={1} value={[block.radius ?? 12]} onValueChange={([v]) => set("radius", v)} />
      </Field>
      <Row label="Show icon">
        <Switch checked={block.showIcon !== false} onCheckedChange={(v) => set("showIcon", v)} />
      </Row>
      <Row label="Use brand colour">
        <Switch checked={block.brandColor !== false} onCheckedChange={(v) => set("brandColor", v)} />
      </Row>
      {block.brandColor === false && (
        <Field label="Custom colour">
          <Input
            type="color"
            value={block.color ?? "#6366F1"}
            onChange={(e) => set("color", e.target.value)}
          />
        </Field>
      )}
    </div>
  );
}

// ── Follow card ──────────────────────────────────────────────────────────
export function FollowCardEditor({ block, set }: { block: FollowCardBlock; set: Set }) {
  const links = block.links ?? [];
  const patch = (id: string, p: Partial<SocialLink>) =>
    set("links", links.map((l) => (l.id === id ? { ...l, ...p } : l)));

  return (
    <div className="space-y-4">
      <Field label="Avatar">
        <ImageField value={block.avatarUrl ?? ""} onChange={(v) => set("avatarUrl", v)} />
      </Field>
      <Field label="Name">
        <Input value={block.name ?? ""} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Handle">
        <Input
          value={block.handle ?? ""}
          placeholder="@yourhandle"
          onChange={(e) => set("handle", e.target.value)}
        />
      </Field>
      <Field label="Description">
        <Textarea rows={2} value={block.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Layout">
        <Select value={block.layout ?? "card"} onValueChange={(v) => set("layout", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Row label="Alignment">
        <AlignSelect value={block.align ?? "center"} onChange={(v) => set("align", v)} />
      </Row>
      <Field label={`Corner radius (${block.radius ?? 16}px)`}>
        <Slider min={0} max={32} step={1} value={[block.radius ?? 16]} onValueChange={([v]) => set("radius", v)} />
      </Field>
      <Row label="Show icons">
        <Switch checked={block.showIcons !== false} onCheckedChange={(v) => set("showIcons", v)} />
      </Row>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Follow links</Label>
        {links.map((l) => (
          <div key={l.id} className="space-y-2 rounded-lg border p-2">
            <div className="flex items-center gap-1">
              <Select value={l.platform} onValueChange={(v) => patch(l.id, { platform: v as SocialPlatform })}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => set("links", links.filter((x) => x.id !== l.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              placeholder="Label"
              value={l.label ?? ""}
              onChange={(e) => patch(l.id, { label: e.target.value })}
            />
            <Input placeholder="https://…" value={l.url} onChange={(e) => patch(l.id, { url: e.target.value })} />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            set("links", [...links, { id: newId(), platform: "instagram", label: "Follow", url: "https://" }])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add link
        </Button>
      </div>
    </div>
  );
}

// ── QR contact card ──────────────────────────────────────────────────────
export function QrContactEditor({ block, set }: { block: QrContactBlock; set: Set }) {
  const mode = block.mode ?? "vcard";
  return (
    <div className="space-y-4">
      <Field label="Title">
        <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="QR content">
        <Select value={mode} onValueChange={(v) => set("mode", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vcard">Contact card (vCard)</SelectItem>
            <SelectItem value="url">Link (URL)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {mode === "url" ? (
        <Field label="URL">
          <Input
            value={block.url ?? ""}
            placeholder="https://…"
            onChange={(e) => set("url", e.target.value)}
          />
        </Field>
      ) : (
        <>
          <Field label="Full name">
            <Input value={block.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} />
          </Field>
          <Field label="Company">
            <Input value={block.org ?? ""} onChange={(e) => set("org", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={block.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={block.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Website">
            <Input value={block.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="Address">
            <Textarea rows={2} value={block.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </>
      )}
      <Field label={`QR size (${block.size ?? 180}px)`}>
        <Slider min={120} max={320} step={10} value={[block.size ?? 180]} onValueChange={([v]) => set("size", v)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="QR colour">
          <Input type="color" value={block.color ?? "#111827"} onChange={(e) => set("color", e.target.value)} />
        </Field>
        <Field label="Background">
          <Input
            type="color"
            value={block.background ?? "#ffffff"}
            onChange={(e) => set("background", e.target.value)}
          />
        </Field>
      </div>
      <Row label="Show details below QR">
        <Switch checked={block.showDetails !== false} onCheckedChange={(v) => set("showDetails", v)} />
      </Row>
      {mode === "vcard" && (
        <Row label="Save contact button">
          <Switch checked={block.downloadable !== false} onCheckedChange={(v) => set("downloadable", v)} />
        </Row>
      )}
      <Field label="Note">
        <Input value={block.note ?? ""} onChange={(e) => set("note", e.target.value)} />
      </Field>
    </div>
  );
}
