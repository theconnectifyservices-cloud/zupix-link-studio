import { Plus, Trash2 } from "lucide-react";
import { useBuilderStore, selectedBlock } from "../store";
import type { Block, SocialLink } from "../types";
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
            <Input
              value={block.displayName}
              onChange={(e) => set("displayName", e.target.value)}
            />
          </Field>
          <Field label="Bio">
            <Textarea
              rows={3}
              value={block.bio ?? ""}
              onChange={(e) => set("bio", e.target.value)}
            />
          </Field>
          <Field label="Avatar URL">
            <Input
              value={block.avatarUrl ?? ""}
              onChange={(e) => set("avatarUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </>
      )}

      {block.type === "heading" && (
        <>
          <Field label="Text">
            <Input value={block.text} onChange={(e) => set("text", e.target.value)} />
          </Field>
          <AlignField
            value={block.align}
            onChange={(v) => set("align", v)}
          />
        </>
      )}

      {block.type === "text" && (
        <>
          <Field label="Text">
            <Textarea
              rows={5}
              value={block.text}
              onChange={(e) => set("text", e.target.value)}
            />
          </Field>
          <AlignField value={block.align} onChange={(v) => set("align", v)} />
        </>
      )}

      {block.type === "button" && (
        <>
          <Field label="Label">
            <Input value={block.label} onChange={(e) => set("label", e.target.value)} />
          </Field>
          <Field label="URL">
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
        </>
      )}

      {block.type === "divider" && (
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
      )}

      {block.type === "social" && (
        <SocialEditor
          links={block.links}
          onChange={(links) => set("links", links)}
        />
      )}

      {def && !["profile","heading","text","button","image","divider","social"].includes(block.type) && (
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

function AlignField({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) {
  return (
    <Field label="Alignment">
      <Select value={value} onValueChange={(v) => onChange(v as "left" | "center" | "right")}>
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

const PLATFORMS: SocialLink["platform"][] = [
  "twitter",
  "instagram",
  "youtube",
  "tiktok",
  "linkedin",
  "github",
  "website",
];

function SocialEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (v: SocialLink[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Social links</Label>
      {links.map((l, i) => (
        <div key={l.id} className="flex items-center gap-1.5">
          <Select
            value={l.platform}
            onValueChange={(v) => {
              const next = [...links];
              next[i] = { ...l, platform: v as SocialLink["platform"] };
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          onChange([...links, { id: newId(), platform: "website", url: "" }])
        }
      >
        <Plus className="mr-2 h-3.5 w-3.5" /> Add link
      </Button>
    </div>
  );
}
