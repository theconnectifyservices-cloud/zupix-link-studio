import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_GROUPS, FONT_OPTIONS, findFontOption } from "../fonts";
import { ensureGoogleFont } from "../theme";

/**
 * Reusable per-element font picker.
 *
 * `undefined` = inherit the global theme font. Toggling the switch off
 * reveals the dropdown and applies the chosen family to this element only.
 * Options are grouped (Premium Serif / Sans / Display / Classic) and each
 * family is previewed in its own face; the webfont is fetched on demand.
 */
export function FontFamilyField({
  label = "Font family",
  value,
  onChange,
}: {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const inherit = !value;
  const current = useMemo(() => findFontOption(value), [value]);
  const groups = useMemo(
    () => FONT_GROUPS.map((g) => ({ group: g, items: FONT_OPTIONS.filter((o) => (o.group ?? "Classic") === g) })),
    [],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Inherit theme</span>
          <Switch
            checked={inherit}
            onCheckedChange={(on) => {
              if (on) return onChange(undefined);
              const fallback = FONT_OPTIONS.find((o) => o.google === "Inter") ?? FONT_OPTIONS[0];
              if (fallback.google) ensureGoogleFont(fallback.google);
              onChange(fallback.value);
            }}
          />
        </div>
      </div>
      {!inherit && (
        <Select
          value={current?.value ?? value}
          onValueChange={(v) => {
            const opt = FONT_OPTIONS.find((o) => o.value === v);
            if (opt?.google) ensureGoogleFont(opt.google);
            onChange(v);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {groups.map(({ group, items }) => (
              <SelectGroup key={group}>
                <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {group}
                </SelectLabel>
                {items.map((f) => (
                  <SelectItem
                    key={f.value}
                    value={f.value}
                    style={{ fontFamily: f.value }}
                    onMouseEnter={() => f.google && ensureGoogleFont(f.google)}
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
