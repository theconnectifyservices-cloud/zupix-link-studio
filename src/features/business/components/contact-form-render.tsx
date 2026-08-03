import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { ContactFormBlock, FormFieldDef } from "@/features/builder/types";
import { useRendererMode } from "@/features/builder/renderer-mode";
import { usePublicPage } from "../page-context";
import { submitLead, trackBusiness } from "../submit";
import { BusinessCard, BusinessHeader } from "./business-surface";
import { cn } from "@/lib/utils";

type Values = Record<string, string | string[] | boolean>;

const INPUT_CLS =
  "w-full rounded-lg border bg-background/70 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

function fieldKey(f: FormFieldDef): string {
  const builtin = ["name", "email", "phone", "company", "subject", "message"];
  return builtin.includes(f.type) ? f.type : f.id;
}

/**
 * Contact Form block. Submissions post to `/api/public/leads` and appear in
 * Dashboard → Leads. Inside the builder the form is inert (no writes).
 */
export function ContactFormRender({ block }: { block: ContactFormBlock }) {
  const mode = useRendererMode();
  const page = usePublicPage();
  const isLive = mode === "public" && !!page;

  const fields = block.fields ?? [];
  const [values, setValues] = useState<Values>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string | string[] | boolean) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    setError(null);

    const missing = fields.find((f) => {
      if (!f.required) return false;
      const v = values[fieldKey(f)];
      if (typeof v === "boolean") return !v;
      if (Array.isArray(v)) return v.length === 0;
      return !v || !String(v).trim();
    });
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }

    if (!isLive || !page) {
      setDone(true);
      return;
    }

    setBusy(true);
    const res = await submitLead({
      pageId: page.pageId,
      slug: page.slug,
      blockId: block.id,
      formName: block.title || "Contact Form",
      values,
    });
    setBusy(false);
    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }
    trackBusiness("form_submit", { blockId: block.id, blockType: "form", label: block.title });
    setDone(true);
    if (block.redirectUrl) {
      window.setTimeout(() => {
        window.location.href = block.redirectUrl as string;
      }, 900);
    }
  }

  if (done) {
    return (
      <BusinessCard style={block.cardStyle} radius={block.radius}>
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium">
            {block.successMessage || "Thanks! We've received your message."}
          </p>
        </div>
      </BusinessCard>
    );
  }

  return (
    <BusinessCard style={block.cardStyle} radius={block.radius}>
      <form className="p-4 sm:p-5" onSubmit={onSubmit} noValidate>
        <BusinessHeader title={block.title} description={block.description} />

        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            Add form fields in the settings panel
          </p>
        ) : (
          <div className={cn("grid gap-3", block.columns === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>
            {fields.map((f) => (
              <FieldRender
                key={f.id}
                field={f}
                value={values[fieldKey(f)]}
                onChange={(v) => set(fieldKey(f), v)}
                span={block.columns === 2 && (f.fullWidth || f.type === "message")}
              />
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {block.submitLabel || "Send message"}
        </button>
      </form>
    </BusinessCard>
  );
}

function FieldRender({
  field,
  value,
  onChange,
  span,
}: {
  field: FormFieldDef;
  value: string | string[] | boolean | undefined;
  onChange: (v: string | string[] | boolean) => void;
  span?: boolean;
}) {
  const label = (
    <label className="mb-1 block text-xs font-medium">
      {field.label}
      {field.required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
  const wrap = (children: React.ReactNode) => (
    <div className={cn(span && "sm:col-span-2")}>
      {label}
      {children}
    </div>
  );
  const options = field.options ?? [];

  switch (field.type) {
    case "message":
      return wrap(
        <textarea
          rows={4}
          className={INPUT_CLS}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "dropdown":
      return wrap(
        <select
          className={INPUT_CLS}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>,
      );
    case "radio":
      return wrap(
        <div className="flex flex-wrap gap-3 pt-1">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-xs">
              <input
                type="radio"
                name={field.id}
                checked={value === o}
                onChange={() => onChange(o)}
                className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
              />
              {o}
            </label>
          ))}
        </div>,
      );
    case "checkbox":
      return (
        <div className={cn(span && "sm:col-span-2")}>
          {options.length > 0 ? (
            <>
              {label}
              <div className="flex flex-wrap gap-3 pt-1">
                {options.map((o) => {
                  const arr = Array.isArray(value) ? value : [];
                  return (
                    <label key={o} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={arr.includes(o)}
                        onChange={(e) =>
                          onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))
                        }
                        className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                      />
                      {o}
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <label className="flex items-center gap-2 pt-1 text-xs">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => onChange(e.target.checked)}
                className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
              />
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </label>
          )}
        </div>
      );
    case "file":
      return wrap(
        <input
          type="file"
          className={cn(INPUT_CLS, "file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs")}
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        />,
      );
    default:
      return wrap(
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          className={INPUT_CLS}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
  }
}
