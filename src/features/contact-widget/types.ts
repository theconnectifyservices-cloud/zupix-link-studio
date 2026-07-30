/**
 * Smart Contact Floating Widget — configuration model.
 *
 * Persisted inside `bio_pages.content.contactWidget` (JSONB), so keep this
 * shape append-only compatible: new optional fields are fine, renames break
 * already-published pages.
 */

export type ContactActionId = "whatsapp" | "phone" | "calendly" | "email" | "maps";

export type ContactWidgetPosition = "left" | "right";

export type ContactWidgetAnimation = "spring" | "fade" | "slide" | "scale" | "arc";

/** Icon keys resolved lazily from the shared icon library. */
export type ContactIconKey =
  | "message"
  | "chat"
  | "phone"
  | "mail"
  | "calendar"
  | "mapPin"
  | "sparkles"
  | "zap"
  | "users"
  | "headset"
  | "plus";

export interface ContactActionConfig {
  id: ContactActionId;
  /** Show this action inside the expanded menu. */
  enabled: boolean;
  /** Visible label / accessible name. */
  label: string;
  /** Raw value: phone number, email, or full URL depending on the action. */
  value: string;
  /** Optional explicit override URL — wins over `value`. */
  customUrl?: string;
  /** Icon key override; falls back to the action default. */
  icon?: ContactIconKey;
  /** Accent color for the action pill. */
  color?: string;
}

export interface ContactWidgetConfig {
  enabled: boolean;
  position: ContactWidgetPosition;
  animation: ContactWidgetAnimation;
  /** Primary FAB icon. */
  icon: ContactIconKey;
  /** FAB gradient endpoints. */
  color: string;
  colorSecondary: string;
  /** Icon / label color on the FAB. */
  foreground: string;
  /** Tooltip-ish label shown next to the FAB when collapsed (desktop). */
  buttonLabel?: string;
  actions: ContactActionConfig[];
}

export const CONTACT_ACTION_META: Record<
  ContactActionId,
  { label: string; icon: ContactIconKey; color: string; placeholder: string; hint: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: "chat",
    color: "#25D366",
    placeholder: "919876543210",
    hint: "Phone number with country code (no + or spaces)",
  },
  phone: {
    label: "Call us",
    icon: "phone",
    color: "#3b82f6",
    placeholder: "+91 98765 43210",
    hint: "Phone number to dial",
  },
  calendly: {
    label: "Book a meeting",
    icon: "calendar",
    color: "#6366f1",
    placeholder: "https://calendly.com/your-handle/30min",
    hint: "Calendly (or any scheduling) link",
  },
  email: {
    label: "Email",
    icon: "mail",
    color: "#f97316",
    placeholder: "hello@example.com",
    hint: "Email address",
  },
  maps: {
    label: "Directions",
    icon: "mapPin",
    color: "#ef4444",
    placeholder: "Connaught Place, New Delhi",
    hint: "Address or a full Google Maps link",
  },
};

export const DEFAULT_CONTACT_WIDGET: ContactWidgetConfig = {
  enabled: false,
  position: "right",
  animation: "spring",
  icon: "message",
  color: "#6d28d9",
  colorSecondary: "#ec4899",
  foreground: "#ffffff",
  buttonLabel: "Contact",
  actions: (Object.keys(CONTACT_ACTION_META) as ContactActionId[]).map((id) => ({
    id,
    enabled: id === "whatsapp",
    label: CONTACT_ACTION_META[id].label,
    value: "",
    icon: CONTACT_ACTION_META[id].icon,
    color: CONTACT_ACTION_META[id].color,
  })),
};

/** Fills in missing fields / new actions on older saved configs. */
export function normalizeContactWidget(
  input?: Partial<ContactWidgetConfig> | null,
): ContactWidgetConfig {
  const base = DEFAULT_CONTACT_WIDGET;
  const saved = input ?? {};
  const savedActions = saved.actions ?? [];
  const actions = base.actions.map((def) => {
    const found = savedActions.find((a) => a?.id === def.id);
    return found ? { ...def, ...found } : def;
  });
  return { ...base, ...saved, actions };
}

const digits = (s: string) => s.replace(/[^\d+]/g, "");

/** Builds the outbound href for an action, or null when unusable. */
export function contactActionHref(action: ContactActionConfig): string | null {
  const custom = action.customUrl?.trim();
  if (custom) return custom;
  const value = action.value?.trim();
  if (!value) return null;

  switch (action.id) {
    case "whatsapp":
      return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
    case "phone":
      return `tel:${digits(value)}`;
    case "email":
      return value.includes("@") ? `mailto:${value}` : null;
    case "calendly":
      return value.startsWith("http") ? value : `https://${value}`;
    case "maps":
      return value.startsWith("http")
        ? value
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
    default:
      return null;
  }
}

/** Actions that are enabled AND have a usable destination. */
export function resolvedActions(config: ContactWidgetConfig) {
  return config.actions
    .filter((a) => a.enabled)
    .map((a) => ({ action: a, href: contactActionHref(a) }))
    .filter((x): x is { action: ContactActionConfig; href: string } => !!x.href);
}
