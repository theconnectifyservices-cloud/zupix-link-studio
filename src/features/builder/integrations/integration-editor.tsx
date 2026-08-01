import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IntegrationBlock } from "../types";
import {
  getIntegration,
  visibleFields,
  MODE_LABEL,
  type IntegrationDisplayMode,
  type IntegrationField,
} from "./registry";
import { IntegrationRender } from "./integration-render";

/**
 * Generic, registry-driven configuration panel.
 * New providers get a full editor with zero UI changes.
 */
export function IntegrationEditor({
  block,
  update,
}: {
  block: IntegrationBlock;
  update: (patch: Partial<IntegrationBlock>) => void;
}) {
  const def = getIntegration(block.provider);
  if (!def) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        This integration is no longer available.
      </div>
    );
  }

  const mode = (block.mode ?? def.modes[0]) as IntegrationDisplayMode;
  const cfg = block.config ?? {};
  const setCfg = (key: string, value: string | number | boolean) =>
    update({ config: { ...cfg, [key]: value } });

  const Icon = def.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <span
          className="grid h-8 w-8 place-items-center rounded-md"
          style={{ backgroundColor: `${def.brand}1f`, color: def.brand }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{def.label}</div>
          <div className="truncate text-[11px] text-muted-foreground">{def.description}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Display as</Label>
        <Select value={mode} onValueChange={(v) => update({ mode: v })}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {def.modes.map((m) => (
              <SelectItem key={m} value={m}>
                {MODE_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visibleFields(def, mode).map((f) => (
        <FieldRow key={f.key} field={f} value={cfg[f.key]} onChange={(v) => setCfg(f.key, v)} />
      ))}

      <div className="space-y-2 rounded-lg border p-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Preview
        </div>
        <IntegrationRender block={{ ...block, mode, config: cfg }} />
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: IntegrationField;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  if (field.type === "switch") {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label className="text-xs">{field.label}</Label>
        <Switch checked={value !== false} onCheckedChange={onChange} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>

      {field.type === "textarea" ? (
        <Textarea
          rows={2}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <Select value={String(value ?? field.options?.[0]?.value ?? "")} onValueChange={onChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "color" ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(value ?? "#000000")}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border bg-background"
          />
          <Input
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#25D366"
          />
        </div>
      ) : field.type === "number" ? (
        <Input
          type="number"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : (
        <Input
          type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
    </div>
  );
}
