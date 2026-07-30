import { useBuilderStore } from "@/features/builder/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CONTACT_ACTION_META,
  DEFAULT_CONTACT_WIDGET,
  normalizeContactWidget,
  type ContactActionId,
  type ContactIconKey,
  type ContactWidgetAnimation,
} from "../types";
import { CONTACT_ICON_KEYS, ContactIcon } from "./contact-icon";

const ANIMATIONS: { id: ContactWidgetAnimation; label: string }[] = [
  { id: "spring", label: "Spring pop" },
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide in" },
  { id: "scale", label: "Scale" },
  { id: "arc", label: "Arc fan" },
];

/** CMS controls for the floating contact widget. Live-patches the page. */
export function ContactWidgetPanel() {
  const saved = useBuilderStore((s) => s.content.contactWidget);
  const patch = useBuilderStore((s) => s.patchContactWidget);
  const patchAction = useBuilderStore((s) => s.patchContactAction);
  const cfg = normalizeContactWidget(saved);

  return (
    <div className="space-y-4">
      <Row label="Enable widget" hint="Shows the floating button on the live page">
        <Switch checked={cfg.enabled} onCheckedChange={(enabled) => patch({ enabled })} />
      </Row>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Position">
          <Select
            value={cfg.position}
            onValueChange={(v) => patch({ position: v as "left" | "right" })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Bottom right</SelectItem>
              <SelectItem value="left">Bottom left</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Animation">
          <Select
            value={cfg.animation}
            onValueChange={(v) => patch({ animation: v as ContactWidgetAnimation })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANIMATIONS.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Button label (accessible name)">
        <Input
          className="h-9"
          value={cfg.buttonLabel ?? ""}
          placeholder="Contact"
          onChange={(e) => patch({ buttonLabel: e.target.value })}
        />
      </Field>

      <Field label="Primary icon">
        <div className="flex flex-wrap gap-1.5">
          {CONTACT_ICON_KEYS.filter((k) => k !== "plus").map((key) => (
            <button
              key={key}
              type="button"
              aria-label={`Use ${key} icon`}
              aria-pressed={cfg.icon === key}
              onClick={() => patch({ icon: key as ContactIconKey })}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-md border transition-colors",
                cfg.icon === key ? "border-primary bg-primary/10" : "hover:bg-muted",
              )}
            >
              <ContactIcon name={key} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <ColorField label="Color 1" value={cfg.color} onChange={(color) => patch({ color })} />
        <ColorField
          label="Color 2"
          value={cfg.colorSecondary}
          onChange={(colorSecondary) => patch({ colorSecondary })}
        />
        <ColorField
          label="Icon"
          value={cfg.foreground}
          onChange={(foreground) => patch({ foreground })}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Actions</div>
        {cfg.actions.map((action) => {
          const meta = CONTACT_ACTION_META[action.id as ContactActionId];
          return (
            <div key={action.id} className="rounded-lg border p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: action.color ?? meta.color }}
                  >
                    <ContactIcon name={action.icon ?? meta.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-sm font-medium">{meta.label}</span>
                </div>
                <Switch
                  checked={action.enabled}
                  aria-label={`Enable ${meta.label}`}
                  onCheckedChange={(enabled) => patchAction(action.id, { enabled })}
                />
              </div>

              {action.enabled && (
                <div className="space-y-2">
                  <Field label="Label">
                    <Input
                      className="h-8"
                      value={action.label}
                      onChange={(e) => patchAction(action.id, { label: e.target.value })}
                    />
                  </Field>
                  <Field label={meta.hint}>
                    <Input
                      className="h-8"
                      value={action.value}
                      placeholder={meta.placeholder}
                      onChange={(e) => patchAction(action.id, { value: e.target.value })}
                    />
                  </Field>
                  <Field label="Custom URL (optional, overrides above)">
                    <Input
                      className="h-8"
                      value={action.customUrl ?? ""}
                      placeholder="https://…"
                      onChange={(e) => patchAction(action.id, { customUrl: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                    <Field label="Icon">
                      <div className="flex flex-wrap gap-1">
                        {CONTACT_ICON_KEYS.filter((k) => k !== "plus").map((key) => (
                          <button
                            key={key}
                            type="button"
                            aria-label={`${meta.label}: use ${key} icon`}
                            aria-pressed={(action.icon ?? meta.icon) === key}
                            onClick={() => patchAction(action.id, { icon: key })}
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-md border transition-colors",
                              (action.icon ?? meta.icon) === key
                                ? "border-primary bg-primary/10"
                                : "hover:bg-muted",
                            )}
                          >
                            <ContactIcon name={key} className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    </Field>
                    <ColorField
                      label="Color"
                      value={action.color ?? meta.color}
                      onChange={(color) => patchAction(action.id, { color })}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full text-xs"
        onClick={() => patch({ ...DEFAULT_CONTACT_WIDGET, enabled: cfg.enabled })}
      >
        Reset widget
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

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer rounded-md border bg-transparent p-1"
      />
    </Field>
  );
}
