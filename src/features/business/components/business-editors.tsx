/**
 * Property-panel editors for the three Business Tools blocks.
 * Kept in the business feature so the builder panel stays thin.
 */
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/features/builder/components/image-field";
import type {
  BookingBlock,
  ContactFormBlock,
  FormFieldDef,
  FormFieldType,
  MiniStoreBlock,
  StoreItem,
  StoreItemKind,
} from "@/features/builder/types";

type Set = (key: string, value: unknown) => void;

const uid = () => Math.random().toString(36).slice(2, 10);

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
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

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      className="h-9 w-full rounded-md border bg-background px-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const CARD_STYLES: [string, string][] = [
  ["glass", "Glass"],
  ["solid", "Solid"],
  ["outline", "Outline"],
];

// ── Contact Form ────────────────────────────────────────────────────────
const FIELD_TYPES: [string, string][] = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Mobile number"],
  ["company", "Company"],
  ["subject", "Subject"],
  ["message", "Message"],
  ["text", "Short text"],
  ["dropdown", "Dropdown"],
  ["checkbox", "Checkbox"],
  ["radio", "Radio"],
  ["file", "File upload"],
];

export function ContactFormEditor({ block, set }: { block: ContactFormBlock; set: Set }) {
  const fields = block.fields ?? [];
  const patch = (id: string, p: Partial<FormFieldDef>) =>
    set(
      "fields",
      fields.map((f) => (f.id === id ? { ...f, ...p } : f)),
    );
  const move = (i: number, dir: -1 | 1) => {
    const next = [...fields];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
    set("fields", next);
  };

  return (
    <div className="space-y-3">
      <Section>Content</Section>
      <Field label="Title">
        <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea
          rows={2}
          value={block.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Section>Fields</Section>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="rounded-lg border p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Input
                className="h-8"
                value={f.label}
                onChange={(e) => patch(f.id, { label: e.target.value })}
                placeholder="Label"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)}>
                ↑
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)}>
                ↓
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() =>
                  set(
                    "fields",
                    fields.filter((x) => x.id !== f.id),
                  )
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={f.type}
                onChange={(v) => patch(f.id, { type: v as FormFieldType })}
                options={FIELD_TYPES}
              />
              <Input
                className="h-9"
                value={f.placeholder ?? ""}
                onChange={(e) => patch(f.id, { placeholder: e.target.value })}
                placeholder="Placeholder"
              />
            </div>
            {(f.type === "dropdown" || f.type === "radio" || f.type === "checkbox") && (
              <Input
                className="h-9"
                value={(f.options ?? []).join(", ")}
                onChange={(e) =>
                  patch(f.id, {
                    options: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Option 1, Option 2, Option 3"
              />
            )}
            <div className="flex items-center gap-4">
              <Toggle
                label="Required"
                checked={!!f.required}
                onChange={(v) => patch(f.id, { required: v })}
              />
              <Toggle
                label="Full width"
                checked={!!f.fullWidth}
                onChange={(v) => patch(f.id, { fullWidth: v })}
              />
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            set("fields", [
              ...fields,
              { id: uid(), type: "text", label: "New field", required: false } as FormFieldDef,
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add field
        </Button>
      </div>

      <Section>After submit</Section>
      <Field label="Button label">
        <Input value={block.submitLabel ?? ""} onChange={(e) => set("submitLabel", e.target.value)} />
      </Field>
      <Field label="Success message">
        <Input
          value={block.successMessage ?? ""}
          onChange={(e) => set("successMessage", e.target.value)}
        />
      </Field>
      <Field label="Redirect URL (optional)">
        <Input
          value={block.redirectUrl ?? ""}
          onChange={(e) => set("redirectUrl", e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <Section>Notifications</Section>
      <Field label="Notify email">
        <Input
          value={block.notifyEmail ?? ""}
          onChange={(e) => set("notifyEmail", e.target.value)}
          placeholder="you@business.com"
        />
      </Field>
      <Field label="Notify WhatsApp number">
        <Input
          value={block.notifyWhatsapp ?? ""}
          onChange={(e) => set("notifyWhatsapp", e.target.value)}
          placeholder="+91 90000 00000"
        />
      </Field>

      <Section>Design</Section>
      <Field label="Card style">
        <Select
          value={block.cardStyle ?? "glass"}
          onChange={(v) => set("cardStyle", v)}
          options={CARD_STYLES}
        />
      </Field>
      <Field label="Columns">
        <Select
          value={String(block.columns ?? 1)}
          onChange={(v) => set("columns", Number(v))}
          options={[
            ["1", "1 column"],
            ["2", "2 columns"],
          ]}
        />
      </Field>
      <Field label="Corner radius">
        <Input
          type="number"
          value={block.radius ?? 18}
          onChange={(e) => set("radius", Number(e.target.value))}
        />
      </Field>
    </div>
  );
}

// ── Mini Store ──────────────────────────────────────────────────────────
const ITEM_KINDS: [string, string][] = [
  ["digital", "Digital product"],
  ["service", "Service"],
  ["payment_link", "Payment link"],
  ["buy_now", "Buy now button"],
  ["whatsapp", "WhatsApp order"],
  ["upi_qr", "UPI QR"],
  ["razorpay", "Razorpay payment"],
];

export function MiniStoreEditor({ block, set }: { block: MiniStoreBlock; set: Set }) {
  const items = block.items ?? [];
  const patch = (id: string, p: Partial<StoreItem>) =>
    set(
      "items",
      items.map((it) => (it.id === id ? { ...it, ...p } : it)),
    );

  return (
    <div className="space-y-3">
      <Section>Content</Section>
      <Field label="Title">
        <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea
          rows={2}
          value={block.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Section>Items</Section>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="space-y-2 rounded-lg border p-2.5">
            <div className="flex items-center gap-1.5">
              <Input
                className="h-8"
                value={it.title}
                onChange={(e) => patch(it.id, { title: e.target.value })}
                placeholder="Item title"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() =>
                  set(
                    "items",
                    items.filter((x) => x.id !== it.id),
                  )
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Select
              value={it.kind}
              onChange={(v) => patch(it.id, { kind: v as StoreItemKind })}
              options={ITEM_KINDS}
            />
            <Textarea
              rows={2}
              value={it.description ?? ""}
              onChange={(e) => patch(it.id, { description: e.target.value })}
              placeholder="Short description"
            />
            <ImageField
              label="Image"
              value={it.image}
              onChange={(url) => patch(it.id, { image: url })}
              previewAspect="4 / 3"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                className="h-9"
                value={it.price ?? ""}
                onChange={(e) =>
                  patch(it.id, { price: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                placeholder="Price"
              />
              <Input
                type="number"
                className="h-9"
                value={it.oldPrice ?? ""}
                onChange={(e) =>
                  patch(it.id, {
                    oldPrice: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Old price"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="h-9"
                value={it.buttonLabel ?? ""}
                onChange={(e) => patch(it.id, { buttonLabel: e.target.value })}
                placeholder="Button label"
              />
              <Select
                value={it.badge ?? "none"}
                onChange={(v) => patch(it.id, { badge: v as StoreItem["badge"] })}
                options={[
                  ["none", "No badge"],
                  ["new", "NEW"],
                  ["popular", "POPULAR"],
                  ["limited", "LIMITED"],
                ]}
              />
            </div>

            {it.kind === "digital" && (
              <Input
                className="h-9"
                value={it.downloadUrl ?? ""}
                onChange={(e) => patch(it.id, { downloadUrl: e.target.value })}
                placeholder="Download link (PDF, ZIP, course…)"
              />
            )}
            {it.kind === "whatsapp" && (
              <>
                <Input
                  className="h-9"
                  value={it.whatsappNumber ?? ""}
                  onChange={(e) => patch(it.id, { whatsappNumber: e.target.value })}
                  placeholder="WhatsApp number with country code"
                />
                <Input
                  className="h-9"
                  value={it.whatsappMessage ?? ""}
                  onChange={(e) => patch(it.id, { whatsappMessage: e.target.value })}
                  placeholder="Pre-filled message"
                />
              </>
            )}
            {it.kind === "upi_qr" && (
              <>
                <Input
                  className="h-9"
                  value={it.upiId ?? ""}
                  onChange={(e) => patch(it.id, { upiId: e.target.value })}
                  placeholder="name@upi"
                />
                <Input
                  className="h-9"
                  value={it.payeeName ?? ""}
                  onChange={(e) => patch(it.id, { payeeName: e.target.value })}
                  placeholder="Payee name"
                />
                <ImageField
                  label="Or upload a QR image"
                  value={it.upiQrImage}
                  onChange={(url) => patch(it.id, { upiQrImage: url })}
                  previewAspect="1 / 1"
                />
              </>
            )}
            {(it.kind === "payment_link" ||
              it.kind === "buy_now" ||
              it.kind === "razorpay" ||
              it.kind === "service") && (
              <Input
                className="h-9"
                value={it.url ?? ""}
                onChange={(e) => patch(it.id, { url: e.target.value })}
                placeholder={
                  it.kind === "razorpay" ? "Razorpay payment link" : "Destination / payment URL"
                }
              />
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            set("items", [
              ...items,
              { id: uid(), kind: "digital", title: "New item", badge: "none" } as StoreItem,
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add item
        </Button>
      </div>

      <Section>Design</Section>
      <Field label="Layout">
        <Select
          value={block.layout ?? "grid"}
          onChange={(v) => set("layout", v)}
          options={[
            ["grid", "Grid"],
            ["list", "List"],
          ]}
        />
      </Field>
      <Field label="Columns">
        <Select
          value={String(block.columns ?? 2)}
          onChange={(v) => set("columns", Number(v))}
          options={[
            ["1", "1"],
            ["2", "2"],
            ["3", "3"],
          ]}
        />
      </Field>
      <Field label="Card style">
        <Select
          value={block.cardStyle ?? "glass"}
          onChange={(v) => set("cardStyle", v)}
          options={CARD_STYLES}
        />
      </Field>
      <Field label="Currency symbol">
        <Input value={block.currency ?? "₹"} onChange={(e) => set("currency", e.target.value)} />
      </Field>
      <Toggle
        label="Show prices"
        checked={block.showPrice !== false}
        onChange={(v) => set("showPrice", v)}
      />
      <Field label="Corner radius">
        <Input
          type="number"
          value={block.radius ?? 18}
          onChange={(e) => set("radius", Number(e.target.value))}
        />
      </Field>
    </div>
  );
}

// ── Booking ─────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingEditor({ block, set }: { block: BookingBlock; set: Set }) {
  const days = block.days ?? [];
  const slots = block.slots ?? [];

  return (
    <div className="space-y-3">
      <Section>Content</Section>
      <Field label="Title">
        <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea
          rows={2}
          value={block.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
      <Field label="Type">
        <Select
          value={block.kind ?? "appointment"}
          onChange={(v) => set("kind", v)}
          options={[
            ["appointment", "Appointment"],
            ["meeting", "Meeting"],
            ["consultation", "Consultation"],
          ]}
        />
      </Field>
      <Field label="Duration (minutes)">
        <Input
          type="number"
          value={block.durationMin ?? 30}
          onChange={(e) => set("durationMin", Number(e.target.value))}
        />
      </Field>

      <Section>Availability</Section>
      <Field label="Available days">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d, i) => {
            const on = days.includes(i);
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  set("days", on ? days.filter((x) => x !== i) : [...days, i].sort((a, b) => a - b))
                }
                className={`h-9 min-w-11 rounded-md border px-2 text-xs font-medium ${
                  on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Time slots (comma separated, 24h)">
        <Input
          value={slots.join(", ")}
          onChange={(e) =>
            set(
              "slots",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => /^\d{1,2}:\d{2}$/.test(s))
                .map((s) => s.padStart(5, "0")),
            )
          }
          placeholder="10:00, 11:00, 15:30"
        />
      </Field>
      <Field label="Timezone">
        <Input
          value={block.timezone ?? ""}
          onChange={(e) => set("timezone", e.target.value)}
          placeholder="Asia/Kolkata"
        />
      </Field>

      <Section>Meeting location</Section>
      <Field label="Location type">
        <Select
          value={block.locationType ?? "online"}
          onChange={(v) => set("locationType", v)}
          options={[
            ["online", "Online"],
            ["offline", "In person"],
          ]}
        />
      </Field>
      {block.locationType === "offline" ? (
        <Field label="Address">
          <Textarea
            rows={2}
            value={block.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
      ) : (
        <>
          <Field label="Provider">
            <Select
              value={block.meetingProvider ?? "google_meet"}
              onChange={(v) => set("meetingProvider", v)}
              options={[
                ["google_meet", "Google Meet"],
                ["zoom", "Zoom"],
                ["whatsapp", "WhatsApp"],
                ["custom", "Custom link"],
              ]}
            />
          </Field>
          <Field label="Meeting link">
            <Input
              value={block.meetingLink ?? ""}
              onChange={(e) => set("meetingLink", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </>
      )}

      <Section>Requests</Section>
      <Toggle
        label="Require phone number"
        checked={!!block.requirePhone}
        onChange={(v) => set("requirePhone", v)}
      />
      <Toggle
        label="Send email confirmation"
        checked={!!block.emailConfirmation}
        onChange={(v) => set("emailConfirmation", v)}
      />
      <Field label="Notify email">
        <Input
          value={block.notifyEmail ?? ""}
          onChange={(e) => set("notifyEmail", e.target.value)}
          placeholder="you@business.com"
        />
      </Field>
      <Field label="Button label">
        <Input
          value={block.submitLabel ?? ""}
          onChange={(e) => set("submitLabel", e.target.value)}
        />
      </Field>
      <Field label="Confirmation message">
        <Input
          value={block.confirmationMessage ?? ""}
          onChange={(e) => set("confirmationMessage", e.target.value)}
        />
      </Field>

      <Section>Design</Section>
      <Field label="Card style">
        <Select
          value={block.cardStyle ?? "glass"}
          onChange={(v) => set("cardStyle", v)}
          options={CARD_STYLES}
        />
      </Field>
      <Field label="Corner radius">
        <Input
          type="number"
          value={block.radius ?? 18}
          onChange={(e) => set("radius", Number(e.target.value))}
        />
      </Field>
    </div>
  );
}
