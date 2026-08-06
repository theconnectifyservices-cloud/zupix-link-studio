/**
 * Social & Contact block renderers.
 *
 * Covers: Social Buttons, WhatsApp / Call / Email / SMS / Telegram buttons,
 * Follow Card and QR Contact Card. All renderers are SSR-safe (the QR code is
 * generated only after mount) and share the visual language of the premium
 * Social Icons block.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Download, Mail, MessageCircle, MessageSquare, Phone, Send, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ContactActionBlock,
  ContactActionType,
  FollowCardBlock,
  QrContactBlock,
  SocialButtonsBlock,
  SocialSurfaceStyle,
} from "../types";
import { BRAND_COLOR, SOCIAL_ICON } from "./social-icons-render";
import { ButtonFxSurface } from "../button-fx";

const ALIGN_CLASS = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
} as const;

function surfaceStyle(style: SocialSurfaceStyle, color: string): CSSProperties {
  switch (style) {
    case "outline":
      return { background: "transparent", color, border: `1.5px solid ${color}` };
    case "soft":
      return { background: `${color}1f`, color, border: "1px solid transparent" };
    case "glass":
      return {
        background: `${color}26`,
        color,
        border: `1px solid ${color}59`,
        backdropFilter: "blur(10px)",
      };
    default:
      return { background: color, color: "#fff", border: "1px solid transparent" };
  }
}

// ── Social Buttons ───────────────────────────────────────────────────────
export function SocialButtonsRender({
  block,
  reduceMotion = false,
}: {
  block: SocialButtonsBlock;
  reduceMotion?: boolean;
}) {
  const items = block.items ?? [];
  const style = block.style ?? "filled";
  const radius = block.radius ?? 12;
  const showIcons = block.showIcons !== false;
  const align = block.align ?? "center";

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        Add social buttons
      </div>
    );
  }

  const grid = block.layout === "grid";
  return (
    <div
      className={cn("w-full", grid ? "grid gap-2" : "flex flex-col gap-2")}
      style={grid ? { gridTemplateColumns: `repeat(${block.columns ?? 2}, minmax(0,1fr))` } : undefined}
    >
      {items.map((item) => {
        const Icon = SOCIAL_ICON[item.platform] ?? SOCIAL_ICON.custom;
        const color =
          block.colorMode === "custom"
            ? (block.customColor ?? "#6366F1")
            : (item.color ?? BRAND_COLOR[item.platform] ?? "#6366F1");
        return (
          <ButtonFxSurface
            key={item.id}
            as="a"
            settings={block.settings}
            reduceMotion={reduceMotion}
            href={item.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5",
              ALIGN_CLASS[align],
            )}
            style={{ ...surfaceStyle(style, color), borderRadius: radius }}
          >
            {showIcons && <Icon className="h-4 w-4 shrink-0" />}
            <span className="truncate">{item.label || item.platform}</span>
          </ButtonFxSurface>
        );
      })}
    </div>
  );
}

// ── Contact action buttons ───────────────────────────────────────────────
const ACTION_META: Record<
  ContactActionType,
  { icon: LucideIcon; color: string; label: string; placeholder: string }
> = {
  whatsappButton: {
    icon: MessageCircle,
    color: "#25D366",
    label: "Chat on WhatsApp",
    placeholder: "+91 98765 43210",
  },
  callButton: { icon: Phone, color: "#0EA5E9", label: "Call now", placeholder: "+91 98765 43210" },
  emailButton: { icon: Mail, color: "#EA4335", label: "Send email", placeholder: "you@email.com" },
  smsButton: { icon: MessageSquare, color: "#8B5CF6", label: "Send SMS", placeholder: "+91 98765 43210" },
  telegramButton: { icon: Send, color: "#26A5E4", label: "Message on Telegram", placeholder: "@username" },
};

export function contactActionMeta(type: ContactActionType) {
  return ACTION_META[type];
}

function digits(v: string) {
  return v.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function contactActionHref(block: ContactActionBlock): string {
  const value = (block.value ?? "").trim();
  if (!value) return "#";
  const msg = block.message ? encodeURIComponent(block.message) : "";
  switch (block.type) {
    case "whatsappButton":
      return `https://wa.me/${digits(value)}${msg ? `?text=${msg}` : ""}`;
    case "callButton":
      return `tel:${value.replace(/\s/g, "")}`;
    case "smsButton":
      return `sms:${value.replace(/\s/g, "")}${msg ? `?&body=${msg}` : ""}`;
    case "telegramButton":
      return /^https?:/i.test(value) ? value : `https://t.me/${value.replace(/^@/, "")}`;
    case "emailButton": {
      const params = [
        block.subject ? `subject=${encodeURIComponent(block.subject)}` : "",
        msg ? `body=${msg}` : "",
      ].filter(Boolean);
      return `mailto:${value}${params.length ? `?${params.join("&")}` : ""}`;
    }
    default:
      return "#";
  }
}

const SIZE_CLASS = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-base" } as const;

export function ContactActionRender({
  block,
  reduceMotion = false,
}: {
  block: ContactActionBlock;
  reduceMotion?: boolean;
}) {
  const meta = ACTION_META[block.type];
  const Icon = meta.icon;
  const color = block.brandColor === false ? (block.color ?? "#6366F1") : meta.color;
  const align = block.align ?? "center";
  const href = contactActionHref(block);
  const full = (block.width ?? "full") === "full";

  return (
    <div className={cn("flex w-full", ALIGN_CLASS[align])}>
      <ButtonFxSurface
        as="a"
        settings={block.settings}
        reduceMotion={reduceMotion}
        href={href}
        target={block.newTab === false ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-transform hover:-translate-y-0.5",
          SIZE_CLASS[block.size ?? "md"],
          full && "w-full",
        )}
        style={{ ...surfaceStyle(block.style ?? "filled", color), borderRadius: block.radius ?? 12 }}
      >
        {block.showIcon !== false && <Icon className="h-4 w-4 shrink-0" />}
        <span className="truncate">{block.label || meta.label}</span>
      </ButtonFxSurface>
    </div>
  );
}

// ── Follow card ──────────────────────────────────────────────────────────
export function FollowCardRender({
  block,
  reduceMotion = false,
}: {
  block: FollowCardBlock;
  reduceMotion?: boolean;
}) {
  const links = block.links ?? [];
  const align = block.align ?? "center";
  const minimal = block.layout === "minimal";
  return (
    <div
      className={cn(
        "w-full p-4",
        !minimal && "border bg-card shadow-sm",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
      style={{ borderRadius: block.radius ?? 16 }}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          align === "center" && "flex-col",
          align === "right" && "flex-row-reverse",
        )}
      >
        {block.avatarUrl ? (
          <img
            src={block.avatarUrl}
            alt={block.name ? `${block.name} avatar` : "Profile avatar"}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{block.name || "Your name"}</div>
          {block.handle && (
            <div className="truncate text-xs text-muted-foreground">{block.handle}</div>
          )}
        </div>
      </div>
      {block.description && (
        <p className="mt-2 text-xs text-muted-foreground">{block.description}</p>
      )}
      {links.length > 0 && (
        <div 
          className={cn("mt-4 flex flex-wrap", ALIGN_CLASS[block.buttonAlign ?? align])}
          style={{ gap: block.buttonGap ?? 8 }}
        >
          {links.map((l) => {
            const Icon = SOCIAL_ICON[l.platform] ?? SOCIAL_ICON.custom;
            const isCustom = block.buttonStyle !== undefined;
            
            // Base styles from the block or legacy defaults
            const baseColor = l.color ?? BRAND_COLOR[l.platform] ?? "#6366F1";
            const textColor = block.buttonColor ?? (block.buttonStyle === "filled" ? "#ffffff" : baseColor);
            const bgColor = block.buttonBgColor ?? (block.buttonStyle === "filled" ? baseColor : block.buttonStyle === "gradient" ? `linear-gradient(135deg, ${baseColor}, ${baseColor}dd)` : "transparent");
            const borderColor = block.buttonBorderColor ?? (block.buttonStyle === "outline" ? baseColor : "transparent");

            const shadowSize = block.buttonShadowSize ?? "none";
            const shadowBlur = block.buttonShadowBlur ?? (shadowSize === "none" ? 0 : 4);
            const shadowColor = block.buttonShadowColor ?? "rgba(0,0,0,0.1)";
            
            const shadowMap = {
              none: "none",
              sm: `0 1px 2px 0 ${shadowColor}`,
              md: `0 4px 6px -1px ${shadowColor}`,
              lg: `0 10px 15px -3px ${shadowColor}`,
              xl: `0 20px 25px -5px ${shadowColor}`,
            };

            const btnStyle: CSSProperties = isCustom ? {
              color: textColor,
              backgroundColor: bgColor,
              borderColor: borderColor,
              borderRadius: block.buttonRadius ?? 100,
              paddingLeft: block.buttonPaddingX ?? 12,
              paddingRight: block.buttonPaddingX ?? 12,
              paddingTop: block.buttonPaddingY ?? 6,
              paddingBottom: block.buttonPaddingY ?? 6,
              fontSize: block.buttonFontSize ?? 12,
              fontWeight: block.buttonFontWeight === "bold" ? 700 : block.buttonFontWeight === "semibold" ? 600 : block.buttonFontWeight === "medium" ? 500 : 400,
              boxShadow: shadowMap[shadowSize as keyof typeof shadowMap] || `0 ${shadowBlur}px ${shadowBlur * 2}px ${shadowColor}`,
              borderWidth: block.buttonStyle === "outline" ? 1.5 : 0,
              borderStyle: "solid",
              width: block.buttonWidth === "full" ? "100%" : "auto",
            } : surfaceStyle("soft", baseColor);

            return (
              <ButtonFxSurface
                key={l.id}
                as="a"
                settings={block.settings}
                reduceMotion={reduceMotion}
                href={l.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center transition-all hover:-translate-y-0.5",
                  block.buttonIconPosition === "right" && "flex-row-reverse",
                  block.buttonSize === "sm" && !isCustom && "px-3 py-1.5 text-xs",
                  block.buttonSize === "md" && !isCustom && "px-4 py-2 text-sm",
                  block.buttonSize === "lg" && !isCustom && "px-5 py-2.5 text-base",
                  isCustom && "justify-center"
                )}
                style={btnStyle}
              >
                {block.showIcons !== false && (
                  <Icon 
                    className="shrink-0" 
                    style={{ 
                      width: block.buttonIconSize ?? (isCustom ? 14 : 14), 
                      height: block.buttonIconSize ?? (isCustom ? 14 : 14),
                      marginRight: block.buttonIconPosition === "right" ? 0 : 6,
                      marginLeft: block.buttonIconPosition === "right" ? 6 : 0,
                    }} 
                  />
                )}
                <span className="truncate" style={{ fontSize: block.buttonFontSize ?? (isCustom ? 12 : undefined) }}>{l.label || l.platform}</span>
              </ButtonFxSurface>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── QR contact card ──────────────────────────────────────────────────────
export function buildVCard(block: QrContactBlock): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${block.fullName || block.name || ""}`,
    block.org ? `ORG:${block.org}` : "",
    block.phone ? `TEL;TYPE=CELL:${block.phone}` : "",
    block.email ? `EMAIL:${block.email}` : "",
    block.website ? `URL:${block.website}` : "",
    block.address ? `ADR:;;${block.address};;;;` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

export function QrContactRender({ block }: { block: QrContactBlock }) {
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const size = block.size ?? 180;

  const data = useMemo(() => {
    if ((block.mode ?? "vcard") === "url") return (block.url ?? "").trim();
    return buildVCard(block);
  }, [block]);

  useEffect(() => {
    let cancelled = false;
    const node = holder.current;
    if (!node || !data) return;
    (async () => {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled || !holder.current) return;
      holder.current.innerHTML = "";
      const qr = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data,
        margin: 6,
        backgroundOptions: { color: block.background ?? "#ffffff" },
        dotsOptions: { type: "rounded", color: block.color ?? "#111827" },
        cornersSquareOptions: { type: "extra-rounded", color: block.color ?? "#111827" },
      });
      qr.append(holder.current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [data, size, block.color, block.background]);

  const rows = [
    block.phone && { icon: Phone, text: block.phone },
    block.email && { icon: Mail, text: block.email },
  ].filter(Boolean) as { icon: LucideIcon; text: string }[];

  return (
    <div className="rounded-2xl border bg-card p-4 text-center">
      {block.title && <div className="mb-2 text-sm font-semibold">{block.title}</div>}
      <div className="flex justify-center">
        {data ? (
          <div
            ref={holder}
            className="overflow-hidden rounded-xl"
            style={{ width: size, height: size, background: block.background ?? "#ffffff" }}
          />
        ) : (
          <div
            className="grid place-items-center rounded-xl border border-dashed text-muted-foreground"
            style={{ width: size, height: size }}
          >
            <QrCode className="h-6 w-6" />
          </div>
        )}
      </div>
      {block.fullName && <div className="mt-3 text-sm font-medium">{block.fullName}</div>}
      {block.org && <div className="text-xs text-muted-foreground">{block.org}</div>}
      {block.showDetails !== false && rows.length > 0 && (
        <ul className="mt-2 space-y-1">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <r.icon className="h-3.5 w-3.5" />
              <span className="truncate">{r.text}</span>
            </li>
          ))}
        </ul>
      )}
      {block.note && <p className="mt-2 text-xs text-muted-foreground">{block.note}</p>}
      {block.downloadable && ready && (block.mode ?? "vcard") === "vcard" && (
        <a
          href={`data:text/vcard;charset=utf-8,${encodeURIComponent(data)}`}
          download={`${(block.fullName || "contact").replace(/\s+/g, "-").toLowerCase()}.vcf`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5" /> Save contact
        </a>
      )}
    </div>
  );
}
