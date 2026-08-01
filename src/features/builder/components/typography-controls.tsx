import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { familyOf } from "../fonts";
import { fontSupportsItalic, fontWeights } from "../theme";
import type { BlockSettings } from "../types";

const WEIGHT_LABEL: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const INHERIT = "__inherit__";

/**
 * Shared typography controls for any block. Every value is optional —
 * "Inherit" leaves the theme/parent value untouched, so existing pages
 * render exactly as before until a control is explicitly set.
 */
export function TypographyControls({
  settings,
  onChange,
}: {
  settings: BlockSettings;
  onChange: (patch: Partial<BlockSettings>) => void;
}) {
  const family = useMemo(() => familyOf(settings.fontFamily), [settings.fontFamily]);
  const italicOk = fontSupportsItalic(family);
  const weights = fontWeights(family);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Row label="Font weight">
          <Select
            value={settings.fontWeightNum != null ? String(settings.fontWeightNum) : INHERIT}
            onValueChange={(v) =>
              onChange({ fontWeightNum: v === INHERIT ? undefined : Number(v) })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>Inherit</SelectItem>
              {weights.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {WEIGHT_LABEL[w] ?? w} ({w})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Font style">
          <Select
            value={settings.fontStyle ?? INHERIT}
            onValueChange={(v) =>
              onChange({
                fontStyle: v === INHERIT ? undefined : (v as BlockSettings["fontStyle"]),
              })
            }
            disabled={!italicOk}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>Inherit</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="italic">Italic</SelectItem>
            </SelectContent>
          </Select>
          {!italicOk && (
            <p className="text-[10px] text-muted-foreground">
              {family} has no italic face.
            </p>
          )}
        </Row>
        <Row label="Letter spacing (em)">
          <Input
            type="number"
            step={0.01}
            min={-0.1}
            max={1}
            value={settings.letterSpacingEm ?? ""}
            placeholder="inherit"
            onChange={(e) =>
              onChange({
                letterSpacingEm: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </Row>
        <Row label="Line height">
          <Input
            type="number"
            step={0.05}
            min={0.8}
            max={3}
            value={settings.lineHeightNum ?? ""}
            placeholder="inherit"
            onChange={(e) =>
              onChange({
                lineHeightNum: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </Row>
        <Row label="Text transform">
          <Select
            value={settings.textTransformOverride ?? INHERIT}
            onValueChange={(v) =>
              onChange({
                textTransformOverride:
                  v === INHERIT ? undefined : (v as BlockSettings["textTransformOverride"]),
              })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>Inherit</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Text decoration">
          <Select
            value={settings.textDecoration ?? INHERIT}
            onValueChange={(v) =>
              onChange({
                textDecoration:
                  v === INHERIT ? undefined : (v as BlockSettings["textDecoration"]),
              })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>Inherit</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="underline">Underline</SelectItem>
              <SelectItem value="line-through">Line through</SelectItem>
              <SelectItem value="overline">Overline</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </div>
    </div>
  );
}
