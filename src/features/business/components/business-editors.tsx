/**
 * Property-panel editors for the three Business Tools blocks.
 * Kept in the business feature so the builder panel stays thin.
 */
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageField } from "@/features/builder/components/image-field";
import { usePlan } from "@/features/subscription/hooks";
import { catalogToBlockItem, listStoreItems } from "../store-api";
import { maxStoreItems, storeKindAllowed, storeLimitLabel } from "../store-plans";
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
  ["textarea", "Long text"],
  ["website", "Website"],
  ["dropdown", "Dropdown"],
  ["checkbox", "Checkbox"],
  ["radio", "Radio"],
  ["file", "File upload"],
];

export function ContactFormEditor({ block, set }: { block: ContactFormBlock; set: Set }) {
  const fields = block.fields ?? [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const patch = (id: string, p: Partial<FormFieldDef>) =>
    set(
      "fields",
      fields.map((f) => (f.id === id ? { ...f, ...p } : f)),
    );
  const remove = (id: string) =>
    set("fields", fields.filter((x) => x.id !== id));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from < 0 || to < 0) return;
    set("fields", arrayMove(fields, from, to));
  };

  return (
    <div className="space-y-3">
      <Section>Content</Section>
      <Field label="Form title">
        <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Subtitle">
        <Textarea
          rows={2}
          value={block.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Section>Fields</Section>
      <p className="text-[11px] text-muted-foreground">Drag the handle to reorder fields.</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fields.map((f) => (
              <SortableFieldRow
                key={f.id}
                field={f}
                onPatch={(p) => patch(f.id, p)}
                onRemove={() => remove(f.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          set("fields", [
            ...fields,
            {
              id: uid(),
              type: "text",
              label: "New field",
              required: false,
              width: "full",
            } as FormFieldDef,
          ])
        }
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> Add field
      </Button>

      <Section>After submit</Section>
      <Field label="Submit button text">
        <Input value={block.submitLabel ?? ""} onChange={(e) => set("submitLabel", e.target.value)} />
      </Field>
      <Field label="Success message">
        <Input
          value={block.successMessage ?? ""}
          onChange={(e) => set("successMessage", e.target.value)}
        />
      </Field>
      <Field label="Error message">
        <Input
          value={block.errorMessage ?? ""}
          onChange={(e) => set("errorMessage", e.target.value)}
          placeholder="Something went wrong. Please try again."
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

      <Section>Spam protection</Section>
      <Toggle
        label="Prevent duplicate submissions"
        checked={block.preventDuplicates !== false}
        onChange={(v) => set("preventDuplicates", v)}
      />

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
      <Field label="Shadow">
        <Select
          value={block.shadow ?? "md"}
          onChange={(v) => set("shadow", v)}
          options={[
            ["none", "None"],
            ["sm", "Soft"],
            ["md", "Medium"],
            ["lg", "Large"],
          ]}
        />
      </Field>
      <Field label="Padding">
        <Input
          type="number"
          value={block.padding ?? 18}
          onChange={(e) => set("padding", Number(e.target.value))}
        />
      </Field>
      <Field label="Font family (optional)">
        <Input
          value={block.fontFamily ?? ""}
          onChange={(e) => set("fontFamily", e.target.value)}
          placeholder="Inherit from theme"
        />
      </Field>
      <Field label="Button style">
        <Select
          value={block.buttonStyle ?? "solid"}
          onChange={(v) => set("buttonStyle", v)}
          options={[
            ["solid", "Solid"],
            ["gradient", "Gradient"],
            ["outline", "Outline"],
            ["soft", "Soft"],
          ]}
        />
      </Field>
      <Field label="Button radius">
        <Input
          type="number"
          value={block.buttonRadius ?? 10}
          onChange={(e) => set("buttonRadius", Number(e.target.value))}
        />
      </Field>
    </div>
  );
}

function SortableFieldRow({
  field: f,
  onPatch,
  onRemove,
}: {
  field: FormFieldDef;
  onPatch: (p: Partial<FormFieldDef>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: f.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("space-y-2 rounded-lg border p-2.5", isDragging && "opacity-70 shadow-lg")}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Input
          className="h-8"
          value={f.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder="Label"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={f.type}
          onChange={(v) => onPatch({ type: v as FormFieldType })}
          options={FIELD_TYPES}
        />
        <Input
          className="h-9"
          value={f.placeholder ?? ""}
          onChange={(e) => onPatch({ placeholder: e.target.value })}
          placeholder="Placeholder"
        />
      </div>
      {(f.type === "dropdown" || f.type === "radio" || f.type === "checkbox") && (
        <Input
          className="h-9"
          value={(f.options ?? []).join(", ")}
          onChange={(e) =>
            onPatch({
              options: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Option 1, Option 2, Option 3"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="h-9"
          value={f.defaultValue ?? ""}
          onChange={(e) => onPatch({ defaultValue: e.target.value })}
          placeholder="Default value"
        />
        <Input
          className="h-9"
          type="number"
          value={f.maxLength ?? ""}
          onChange={(e) =>
            onPatch({ maxLength: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="Character limit"
        />
      </div>
      <Input
        className="h-9"
        value={f.helpText ?? ""}
        onChange={(e) => onPatch({ helpText: e.target.value })}
        placeholder="Help text"
      />
      <Select
        value={f.width ?? (f.fullWidth ? "full" : "half")}
        onChange={(v) => onPatch({ width: v as "half" | "full", fullWidth: v === "full" })}
        options={[
          ["half", "Width 50%"],
          ["full", "Width 100%"],
        ]}
      />
      <div className="flex items-center gap-4">
        <Toggle
          label="Required"
          checked={!!f.required}
          onChange={(v) => onPatch({ required: v })}
        />
        <Toggle
          label="Visible"
          checked={!f.hidden}
          onChange={(v) => onPatch({ hidden: !v })}
        />
      </div>
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

const ITEM_ACTIONS: [string, string][] = [
  ["buy_now", "Buy Now"],
  ["payment_link", "Payment Link"],
  ["whatsapp", "WhatsApp Order"],
  ["download", "Download"],
  ["external", "External URL"],
];

const ITEM_BADGES: [string, string][] = [
  ["none", "No badge"],
  ["new", "NEW"],
  ["hot", "HOT"],
  ["best_seller", "BEST SELLER"],
  ["limited", "LIMITED"],
  ["sale", "SALE"],
  ["popular", "POPULAR"],
];

export function MiniStoreEditor({ block, set }: { block: MiniStoreBlock; set: Set }) {
  const items = block.items ?? [];
  const { code: plan, workspaceId } = usePlan();
  const limit = maxStoreItems(plan);
  const kindOptions = ITEM_KINDS.filter(([v]) => storeKindAllowed(plan, v as StoreItemKind));
  const [importOpen, setImportOpen] = useState(false);

  const catalogQ = useQuery({
    queryKey: ["store", "items", workspaceId],
    queryFn: () => listStoreItems(workspaceId!),
    enabled: !!workspaceId && importOpen,
  });

  const patch = (id: string, p: Partial<StoreItem>) =>
    set(
      "items",
      items.map((it) => (it.id === id ? { ...it, ...p } : it)),
    );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    set("items", arrayMove(items, index, target));
  };

  const addItem = (item: StoreItem) => {
    if (items.length >= limit) {
      toast.error(`Your plan includes ${limit} store items. Upgrade to add more.`);
      return;
    }
    set("items", [...items, item]);
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

      <Section>Items</Section>
      <p className="text-[11px] text-muted-foreground">
        {items.length}
        {Number.isFinite(limit) ? ` / ${limit}` : ""} items · {storeLimitLabel(plan)}
      </p>
      <div className="space-y-3">
        {items.map((it, index) => (
          <div
            key={it.id}
            className={cn("space-y-2 rounded-lg border p-2.5", it.hidden && "opacity-60")}
          >
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
                className="h-8 w-8"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Move down"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={it.hidden ? "Show item" : "Hide item"}
                onClick={() => patch(it.id, { hidden: !it.hidden })}
              >
                {it.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Duplicate item"
                onClick={() => addItem({ ...it, id: uid(), title: `${it.title} (copy)` })}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                aria-label="Delete item"
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
              options={kindOptions}
            />
            <Textarea
              rows={2}
              value={it.description ?? ""}
              onChange={(e) => patch(it.id, { description: e.target.value })}
              placeholder="Short description"
            />
            <Textarea
              rows={3}
              value={it.longDescription ?? ""}
              onChange={(e) => patch(it.id, { longDescription: e.target.value })}
              placeholder="Full description (product popup)"
            />
            <ImageField
              label="Image"
              value={it.coverImage ?? it.image}
              onChange={(url) => patch(it.id, { coverImage: url, image: url })}
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
                options={ITEM_BADGES}
              />
            </div>
            <Field label="Action">
              <Select
                value={it.action ?? "buy_now"}
                onChange={(v) => patch(it.id, { action: v as StoreItem["action"] })}
                options={ITEM_ACTIONS}
              />
            </Field>

            {(it.action ?? "buy_now") === "download" && (
              <Input
                className="h-9"
                value={it.downloadUrl ?? ""}
                onChange={(e) => patch(it.id, { downloadUrl: e.target.value })}
                placeholder="Download link (PDF, ZIP, course…)"
              />
            )}
            {(it.action ?? "buy_now") === "whatsapp" && (
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
            {["buy_now", "payment_link", "external"].includes(it.action ?? "buy_now") && (
              <Input
                className="h-9"
                value={it.url ?? ""}
                onChange={(e) => patch(it.id, { url: e.target.value })}
                placeholder="Destination / payment URL"
              />
            )}
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addItem({
                id: uid(),
                kind: kindOptions[0]?.[0] as StoreItemKind,
                title: "New item",
                badge: "none",
                action: "buy_now",
              } as StoreItem)
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add item
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <ShoppingBag className="mr-1 h-3.5 w-3.5" /> From catalog
          </Button>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add from your catalog</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(catalogQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No catalog items yet. Create them in Dashboard → Mini Store to reuse them across
                bio pages.
              </p>
            ) : (
              (catalogQ.data ?? []).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border p-2 text-left hover:bg-accent"
                  onClick={() => {
                    addItem(catalogToBlockItem(row));
                    setImportOpen(false);
                  }}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                    {row.cover_image && (
                      <img
                        src={row.cover_image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.price != null ? `${row.currency}${row.price}` : row.kind}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Section>Design</Section>
      <Field label="Layout">
        <Select
          value={block.layout ?? "grid"}
          onChange={(v) => set("layout", v)}
          options={[
            ["grid", "Grid"],
            ["list", "List"],
            ["featured", "Featured"],
            ["carousel", "Carousel"],
            ["modern", "Modern"],
            ["glass", "Glass"],
            ["compact", "Compact"],
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
      <div className="grid grid-cols-2 gap-2">
        <Field label="Corner radius">
          <Input
            type="number"
            value={block.radius ?? 18}
            onChange={(e) => set("radius", Number(e.target.value))}
          />
        </Field>
        <Field label="Card gap">
          <Input
            type="number"
            value={block.gap ?? 12}
            onChange={(e) => set("gap", Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Shadow">
        <Select
          value={block.shadow ?? "md"}
          onChange={(v) => set("shadow", v)}
          options={[
            ["none", "None"],
            ["sm", "Soft"],
            ["md", "Medium"],
            ["lg", "Large"],
          ]}
        />
      </Field>
      <Field label="Hover animation">
        <Select
          value={block.hoverAnimation ?? "lift"}
          onChange={(v) => set("hoverAnimation", v)}
          options={[
            ["none", "None"],
            ["lift", "Lift"],
            ["zoom", "Zoom"],
            ["glow", "Glow"],
          ]}
        />
      </Field>
      <Field label="Entrance animation">
        <Select
          value={block.entranceAnimation ?? "rise"}
          onChange={(v) => set("entranceAnimation", v)}
          options={[
            ["none", "None"],
            ["fade", "Fade"],
            ["rise", "Rise"],
          ]}
        />
      </Field>

      <Section>Display</Section>
      <Toggle
        label="Show images"
        checked={block.showImage !== false}
        onChange={(v) => set("showImage", v)}
      />
      <Toggle
        label="Show prices"
        checked={block.showPrice !== false}
        onChange={(v) => set("showPrice", v)}
      />
      <Toggle
        label="Show old price"
        checked={block.showOldPrice !== false}
        onChange={(v) => set("showOldPrice", v)}
      />
      <Toggle
        label="Show badges"
        checked={block.showBadge !== false}
        onChange={(v) => set("showBadge", v)}
      />
      <Toggle
        label="Show descriptions"
        checked={block.showDescription !== false}
        onChange={(v) => set("showDescription", v)}
      />
      <Toggle
        label="Show buttons"
        checked={block.showButton !== false}
        onChange={(v) => set("showButton", v)}
      />
      <Toggle
        label="Product detail popup"
        checked={block.detailPopup !== false}
        onChange={(v) => set("detailPopup", v)}
      />
      <Toggle
        label="Related products in popup"
        checked={block.showRelated !== false}
        onChange={(v) => set("showRelated", v)}
      />
    </div>
  );
}


// ── Booking ─────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingEditor({ block, set }: { block: BookingBlock; set: Set }) {
  const services = block.services ?? [];

  return (
    <div className="space-y-3">
      <Section>Content</Section>
      <Field label="Main title">
        <Input value={block.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Main description">
        <Textarea
          rows={2}
          value={block.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Section>Services</Section>
      <div className="space-y-2">
        {services.map((s, idx) => (
          <div key={s.id} className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase">Service #{idx + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => set("services", services.filter((x) => x.id !== s.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Field label="Service title">
              <Input
                value={s.title}
                onChange={(e) =>
                  set(
                    "services",
                    services.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x))
                  )
                }
              />
            </Field>
            <Field label="Duration (min)">
              <Input
                type="number"
                value={s.durationMin}
                onChange={(e) =>
                  set(
                    "services",
                    services.map((x) => (x.id === s.id ? { ...x, durationMin: Number(e.target.value) } : x))
                  )
                }
              />
            </Field>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            set("services", [
              ...services,
              {
                id: Math.random().toString(36).slice(2, 10),
                kind: "appointment",
                title: "New Service",
                durationMin: 30,
                locationType: "online",
              },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add service
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
            ["carousel", "Carousel"],
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
    </div>
  );
}
