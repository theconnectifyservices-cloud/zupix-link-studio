import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Paperclip, Send, X } from "lucide-react";
import type { ContactFormBlock, FormFieldDef } from "@/features/builder/types";
import { useRendererMode } from "@/features/builder/renderer-mode";
import { usePublicPage } from "../page-context";
import { submitLead, trackBusiness, type LeadAttachment } from "../submit";
import { BusinessCard, BusinessHeader } from "./business-surface";
import { cn } from "@/lib/utils";

type Values = Record<string, string | string[] | boolean>;

const INPUT_CLS =
  "w-full rounded-lg border bg-background/70 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx";

const BUILTIN = ["name", "email", "phone", "company", "subject", "message"];

function fieldKey(f: FormFieldDef): string {
  return BUILTIN.includes(f.type) ? f.type : f.id;
}

function isFull(block: ContactFormBlock, f: FormFieldDef): boolean {
  if (f.width) return f.width === "full";
  return !!f.fullWidth || f.type === "message" || f.type === "textarea" || f.type === "file";
}

const SHADOW: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-xl",
};

function buttonClasses(style: ContactFormBlock["buttonStyle"]): string {
  switch (style) {
    case "gradient":
      return "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground";
    case "outline":
      return "border-2 border-primary bg-transparent text-primary hover:bg-primary/10";
    case "soft":
      return "bg-primary/15 text-primary hover:bg-primary/25";
    default:
      return "bg-primary text-primary-foreground";
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read_failed"));
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.readAsDataURL(file);
  });
}

/**
 * Contact Form block. Submissions post to `/api/public/leads` and appear in
 * Dashboard → Leads. Inside the builder the form is inert (no writes).
 */
export function ContactFormRender({ block }: { block: ContactFormBlock }) {
  const mode = useRendererMode();
  const page = usePublicPage();
  const isLive = mode === "public" && !!page;

  const fields = useMemo(
    () => (block.fields ?? []).filter((f) => !f.hidden),
    [block.fields],
  );

  const initial = useMemo<Values>(() => {
    const v: Values = {};
    for (const f of fields) if (f.defaultValue) v[fieldKey(f)] = f.defaultValue;
    return v;
  }, [fields]);

  const [values, setValues] = useState<Values>(initial);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(Date.now());
  const opened = useRef(false);

  // Analytics: form view (in-viewport) and form open (first interaction).
  useEffect(() => {
    if (!isLive || !rootRef.current) return;
    const el = rootRef.current;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((e) => e.isIntersecting)) return;
        fired = true;
        trackBusiness("form_view", { blockId: block.id, blockType: "form", label: block.title });
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isLive, block.id, block.title]);

  const markOpen = () => {
    if (opened.current || !isLive) return;
    opened.current = true;
    trackBusiness("form_open", { blockId: block.id, blockType: "form", label: block.title });
  };

  const set = (k: string, v: string | string[] | boolean) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    setError(null);

    const missing = fields.find((f) => {
      if (!f.required) return false;
      if (f.type === "file") return !files[f.id];
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
    let attachments: LeadAttachment[] = [];
    try {
      attachments = await Promise.all(
        Object.values(files).map(async (file) => ({
          name: file.name.slice(0, 160),
          type: file.type || "application/octet-stream",
          size: file.size,
          data: await fileToBase64(file),
        })),
      );
    } catch {
      setBusy(false);
      setError("Could not read the attached file.");
      return;
    }

    const res = await submitLead({
      pageId: page.pageId,
      slug: page.slug,
      blockId: block.id,
      formName: block.title || "Contact Form",
      values,
      hp,
      elapsedMs: Date.now() - mountedAt.current,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
      attachments,
    });
    setBusy(false);
    if (!res.ok) {
      const code = res.error ?? "";
      setError(
        code === "duplicate"
          ? "You've already sent this message."
          : code === "rate_limited"
            ? "Too many submissions. Please try again in a minute."
            : code === "quota_exceeded"
              ? "This form is not accepting submissions right now."
              : block.errorMessage || "Something went wrong. Please try again.",
      );
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

  const shadow = SHADOW[block.shadow ?? "md"] ?? "shadow-md";
  const pad = block.padding ?? 18;
  const style: React.CSSProperties = block.fontFamily
    ? { fontFamily: block.fontFamily }
    : {};

  if (done) {
    return (
      <BusinessCard style={block.cardStyle} radius={block.radius} className={shadow}>
        <div className="flex flex-col items-center gap-2 p-6 text-center" style={style}>
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium">
            {block.successMessage || "Thanks! We've received your message."}
          </p>
        </div>
      </BusinessCard>
    );
  }

  return (
    <div ref={rootRef}>
      <BusinessCard style={block.cardStyle} radius={block.radius} className={shadow}>
        <form
          onSubmit={onSubmit}
          onFocusCapture={markOpen}
          noValidate
          style={{ padding: pad, ...style }}
        >
          <BusinessHeader title={block.title} description={block.description} />

          {/* honeypot — hidden from humans, tempting for bots */}
          <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Company website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </label>
          </div>

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
                  file={files[f.id]}
                  onFile={(file) =>
                    setFiles((prev) => {
                      const next = { ...prev };
                      if (file) next[f.id] = file;
                      else delete next[f.id];
                      return next;
                    })
                  }
                  onError={setError}
                  onChange={(v) => set(fieldKey(f), v)}
                  span={block.columns === 2 && isFull(block, f)}
                />
              ))}
            </div>
          )}

          {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            style={{ borderRadius: block.buttonRadius ?? 10 }}
            className={cn(
              "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60",
              buttonClasses(block.buttonStyle),
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {block.submitLabel || "Send message"}
          </button>
        </form>
      </BusinessCard>
    </div>
  );
}

function FieldRender({
  field,
  value,
  file,
  onFile,
  onError,
  onChange,
  span,
}: {
  field: FormFieldDef;
  value: string | string[] | boolean | undefined;
  file?: File;
  onFile: (f: File | null) => void;
  onError: (msg: string | null) => void;
  onChange: (v: string | string[] | boolean) => void;
  span?: boolean;
}) {
  const text = typeof value === "string" ? value : "";
  const limit = field.maxLength && field.maxLength > 0 ? field.maxLength : undefined;

  const label = (
    <label className="mb-1 block text-xs font-medium">
      {field.label}
      {field.required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
  const foot = (
    <>
      {field.helpText && (
        <p className="mt-1 text-[11px] text-muted-foreground">{field.helpText}</p>
      )}
      {limit && (
        <p className="mt-0.5 text-right text-[10px] tabular-nums text-muted-foreground">
          {text.length}/{limit}
        </p>
      )}
    </>
  );
  const wrap = (children: React.ReactNode) => (
    <div className={cn(span && "sm:col-span-2")}>
      {label}
      {children}
      {foot}
    </div>
  );
  const options = field.options ?? [];
  const change = (v: string) => onChange(limit ? v.slice(0, limit) : v);

  switch (field.type) {
    case "message":
    case "textarea":
      return wrap(
        <textarea
          rows={4}
          maxLength={limit}
          className={INPUT_CLS}
          placeholder={field.placeholder}
          value={text}
          onChange={(e) => change(e.target.value)}
        />,
      );
    case "dropdown":
      return wrap(
        <select className={INPUT_CLS} value={text} onChange={(e) => onChange(e.target.value)}>
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
          {field.helpText && (
            <p className="mt-1 text-[11px] text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );
    case "file":
      return wrap(
        <div className="space-y-1.5">
          {file ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onFile(null);
                  onChange("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept={ACCEPT}
              className={cn(
                INPUT_CLS,
                "file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs",
              )}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > MAX_FILE_BYTES) {
                  onError("File is larger than 8 MB.");
                  e.target.value = "";
                  return;
                }
                onError(null);
                onFile(f);
                onChange(f?.name ?? "");
              }}
            />
          )}
        </div>,
      );
    case "website":
      return wrap(
        <input
          type="url"
          inputMode="url"
          maxLength={limit}
          className={INPUT_CLS}
          placeholder={field.placeholder || "https://"}
          value={text}
          onChange={(e) => change(e.target.value)}
        />,
      );
    default:
      return wrap(
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          maxLength={limit}
          className={INPUT_CLS}
          placeholder={field.placeholder}
          value={text}
          onChange={(e) => change(e.target.value)}
        />,
      );
  }
}
