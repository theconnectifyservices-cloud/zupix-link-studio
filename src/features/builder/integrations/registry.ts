/**
 * Integration Center — pluggable provider registry.
 *
 * Every integration is pure structured JSON: the builder stores only
 * `{ provider, mode, config }` on the block and the renderer generates the
 * markup at render time. Users never see or write HTML.
 *
 * Adding a new integration = append one entry to `INTEGRATIONS`.
 * No Builder UI change is required.
 */
import type { LucideIcon } from "lucide-react";
import {
  MessageCircle,
  CalendarClock,
  MapPin,
  Send,
  Phone,
  Mail,
  Youtube,
  Music2,
  ClipboardList,
  Star,
  ShieldCheck,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Code2,
} from "lucide-react";

export type IntegrationDisplayMode =
  | "button"
  | "embed"
  | "popup"
  | "newTab"
  | "floating"
  | "floatingBubble"
  | "stickyBottom"
  | "headerAction"
  | "iconOnly"
  | "card"
  | "hidden";

export type IntegrationFieldType =
  | "text"
  | "tel"
  | "url"
  | "email"
  | "textarea"
  | "select"
  | "color"
  | "switch"
  | "number";

export interface IntegrationField {
  key: string;
  label: string;
  type: IntegrationFieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Only render this field for these display modes. */
  modes?: IntegrationDisplayMode[];
}

export type IntegrationConfig = Record<string, string | number | boolean | undefined>;

export interface IntegrationAction {
  /** Outbound link (button / new tab / floating). */
  href?: string;
  /** iframe source (embed / popup). */
  embedSrc?: string;
  /** Default iframe height in px. */
  height?: number;
}

export interface IntegrationDef {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Brand accent used for the default button colour. */
  brand: string;
  /** Display modes this provider supports, first one is the default. */
  modes: IntegrationDisplayMode[];
  /** Provider-specific configuration fields. */
  fields: IntegrationField[];
  /** Default config values merged on insert. */
  defaults: IntegrationConfig;
  /** Pure function: structured JSON → renderable action. */
  build: (config: IntegrationConfig) => IntegrationAction;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const digits = (v: unknown) => s(v).replace(/[^\d]/g, "");

/** Turn a Google Maps place/address into a keyless embed URL. */
function mapsEmbed(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function youtubeId(url: string): string {
  const m =
    url.match(/[?&]v=([\w-]{6,})/) ??
    url.match(/youtu\.be\/([\w-]{6,})/) ??
    url.match(/embed\/([\w-]{6,})/) ??
    url.match(/shorts\/([\w-]{6,})/);
  return m?.[1] ?? "";
}

function spotifyEmbed(url: string): string {
  const m = url.match(/spotify\.com\/(track|album|playlist|artist|episode|show)\/([\w]+)/);
  if (!m) return "";
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
}

function googleFormEmbed(url: string): string {
  if (!url) return "";
  return url.includes("?") ? `${url}&embedded=true` : `${url}?embedded=true`;
}

/* ── shared style fields (applied to every integration) ──────────────── */

export const STYLE_FIELDS: IntegrationField[] = [
  {
    key: "buttonText",
    label: "Button text / Label",
    type: "text",
    modes: ["button", "popup", "newTab", "floating", "stickyBottom", "headerAction", "card", "floatingBubble"],
  },
  {
    key: "style",
    label: "Style",
    type: "select",
    modes: ["button", "popup", "newTab", "stickyBottom", "headerAction", "floating", "floatingBubble"],
    options: [
      { value: "filled", label: "Filled" },
      { value: "outline", label: "Outline" },
      { value: "soft", label: "Soft" },
      { value: "glass", label: "Glass" },
    ],
  },
  { key: "color", label: "Colour", type: "color" },
  { key: "textColor", label: "Text Colour", type: "color", modes: ["button", "floating", "stickyBottom", "card"] },
  { key: "showIcon", label: "Show icon", type: "switch", modes: ["button", "floating", "stickyBottom", "card", "headerAction", "floatingBubble"] },
  {
    key: "animation",
    label: "Animation",
    type: "select",
    options: [
      { value: "none", label: "None" },
      { value: "pulse", label: "Pulse" },
      { value: "bounce", label: "Bounce" },
      { value: "glow", label: "Glow" },
      { value: "float", label: "Float" },
    ],
  },
  {
    key: "position",
    label: "Position",
    type: "select",
    modes: ["floating", "floatingBubble"],
    options: [
      { value: "bottom-right", label: "Bottom right" },
      { value: "bottom-left", label: "Bottom left" },
      { value: "top-right", label: "Top right" },
      { value: "top-left", label: "Top left" },
    ],
  },
  {
    key: "shape",
    label: "Shape",
    type: "select",
    modes: ["floating", "floatingBubble"],
    options: [
      { value: "circle", label: "Circle" },
      { value: "rounded", label: "Rounded" },
      { value: "square", label: "Square" },
    ],
  },
  {
    key: "size",
    label: "Size",
    type: "select",
    modes: ["floating", "floatingBubble", "iconOnly"],
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ],
  },
  {
    key: "floatingMode",
    label: "Floating Mode",
    type: "select",
    modes: ["floating"],
    options: [
      { value: "icon", label: "Icon Only" },
      { value: "label", label: "Icon + Label" },
    ],
  },
  { key: "tooltip", label: "Tooltip Text", type: "text", modes: ["floating", "floatingBubble"] },
  { key: "badge", label: "Badge Counter", type: "number", modes: ["floating", "floatingBubble"] },
  { key: "zIndex", label: "Z-Index", type: "number", modes: ["floating", "floatingBubble", "stickyBottom"] },
  { key: "height", label: "Embed height (px)", type: "number", modes: ["embed", "popup"] },
  { key: "description", label: "Card Description", type: "textarea", modes: ["card"] },
  { key: "showOnDesktop", label: "Show on desktop", type: "switch" },
  { key: "showOnMobile", label: "Show on mobile", type: "switch" },
];

export const STYLE_DEFAULTS: IntegrationConfig = {
  style: "filled",
  showIcon: true,
  animation: "none",
  position: "bottom-right",
  shape: "circle",
  size: "md",
  floatingMode: "icon",
  height: 420,
  showOnDesktop: true,
  showOnMobile: true,
};

/* ── providers ───────────────────────────────────────────────────────── */

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Chat button or floating bubble",
    icon: MessageCircle,
    brand: "#25D366",
    modes: ["button", "floating", "floatingBubble", "newTab", "stickyBottom", "headerAction", "iconOnly", "card", "popup", "hidden"],
    fields: [
      { key: "phone", label: "Phone number", type: "tel", placeholder: "+91 98765 43210", required: true },
      { key: "message", label: "Default message", type: "textarea", placeholder: "Hi! I'd like to know more…" },
    ],
    defaults: { buttonText: "Chat on WhatsApp", color: "#25D366" },
    build: (c) => {
      const p = digits(c.phone);
      if (!p) return {};
      const text = s(c.message) ? `?text=${encodeURIComponent(s(c.message))}` : "";
      const href = `https://wa.me/${p}${text}`;
      return { href, embedSrc: href };
    },
  },
  {
    key: "calendly",
    label: "Calendly",
    description: "Booking popup or inline embed",
    icon: CalendarClock,
    brand: "#006BFF",
    modes: [
      "popup",
      "embed",
      "newTab",
      "button",
      "floating",
      "floatingBubble",
      "stickyBottom",
      "card",
      "hidden",
    ],
    fields: [
      {
        key: "url",
        label: "Calendly URL",
        type: "url",
        placeholder: "https://calendly.com/your-name/30min",
        required: true,
      },
      {
        key: "theme",
        label: "Theme",
        type: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      },
    ],
    defaults: { buttonText: "Book a meeting", color: "#006BFF", theme: "light", height: 640 },
    build: (c) => {
      const url = s(c.url);
      if (!url) return {};
      const sep = url.includes("?") ? "&" : "?";
      const themed =
        c.theme === "dark"
          ? `${url}${sep}background_color=1a1a1a&text_color=ffffff&hide_gdpr_banner=1`
          : `${url}${sep}hide_gdpr_banner=1`;
      return { href: url, embedSrc: themed, height: 640 };
    },
  },
  {
    key: "googleMaps",
    label: "Google Maps",
    description: "Location embed or directions button",
    icon: MapPin,
    brand: "#1A73E8",
    modes: ["embed", "button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "businessName", label: "Business name", type: "text", placeholder: "ZUPIX Studio" },
      { key: "address", label: "Address", type: "textarea", placeholder: "MG Road, Bengaluru" },
      { key: "query", label: "Search location", type: "text", placeholder: "Overrides address if set" },
    ],
    defaults: { buttonText: "Get directions", color: "#1A73E8", height: 320 },
    build: (c) => {
      const q = s(c.query) || [s(c.businessName), s(c.address)].filter(Boolean).join(" ");
      if (!q) return {};
      return {
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
        embedSrc: mapsEmbed(q),
        height: 320,
      };
    },
  },
  {
    key: "telegram",
    label: "Telegram",
    description: "Open a chat or channel",
    icon: Send,
    brand: "#229ED9",
    modes: ["button", "floating", "floatingBubble", "newTab", "stickyBottom", "headerAction", "iconOnly", "card", "popup", "hidden"],
    fields: [
      { key: "username", label: "Username or channel", type: "text", placeholder: "zupixstudio", required: true },
    ],
    defaults: { buttonText: "Message on Telegram", color: "#229ED9" },
    build: (c) => {
      const u = s(c.username).replace(/^@/, "");
      const href = u ? `https://t.me/${u}` : "";
      return { href, embedSrc: href };
    },
  },
  {
    key: "phone",
    label: "Phone Call",
    description: "One-tap call button",
    icon: Phone,
    brand: "#0F172A",
    modes: ["button", "floating", "floatingBubble", "stickyBottom", "headerAction", "iconOnly", "card", "popup", "hidden"],
    fields: [{ key: "phone", label: "Phone number", type: "tel", placeholder: "+91 98765 43210", required: true }],
    defaults: { buttonText: "Call now", color: "#0F172A" },
    build: (c) => {
      const p = s(c.phone).replace(/[^\d+]/g, "");
      const href = p ? `tel:${p}` : "";
      return { href, embedSrc: href };
    },
  },
  {
    key: "email",
    label: "Email",
    description: "Prefilled mail composer",
    icon: Mail,
    brand: "#EA4335",
    modes: ["button", "floating", "floatingBubble", "stickyBottom", "headerAction", "iconOnly", "card", "popup", "hidden"],
    fields: [
      { key: "email", label: "Email address", type: "email", placeholder: "hello@zupix.app", required: true },
      { key: "subject", label: "Subject", type: "text" },
      { key: "body", label: "Message", type: "textarea" },
    ],
    defaults: { buttonText: "Email us", color: "#EA4335" },
    build: (c) => {
      const e = s(c.email);
      if (!e) return {};
      const params = new URLSearchParams();
      if (s(c.subject)) params.set("subject", s(c.subject));
      if (s(c.body)) params.set("body", s(c.body));
      const qs = params.toString();
      const href = `mailto:${e}${qs ? `?${qs}` : ""}`;
      return { href, embedSrc: href };
    },
  },
  {
    key: "youtube",
    label: "YouTube",
    description: "Video player or channel link",
    icon: Youtube,
    brand: "#FF0000",
    modes: ["embed", "button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "url", label: "Video or channel URL", type: "url", placeholder: "https://youtu.be/…", required: true },
    ],
    defaults: { buttonText: "Watch on YouTube", color: "#FF0000", height: 240 },
    build: (c) => {
      const url = s(c.url);
      if (!url) return {};
      const id = youtubeId(url);
      return { href: url, embedSrc: id ? `https://www.youtube.com/embed/${id}` : "", height: 240 };
    },
  },
  {
    key: "spotify",
    label: "Spotify",
    description: "Track, album or playlist player",
    icon: Music2,
    brand: "#1DB954",
    modes: ["embed", "button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "url", label: "Spotify URL", type: "url", placeholder: "https://open.spotify.com/…", required: true },
    ],
    defaults: { buttonText: "Listen on Spotify", color: "#1DB954", height: 232 },
    build: (c) => {
      const url = s(c.url);
      if (!url) return {};
      return { href: url, embedSrc: spotifyEmbed(url), height: 232 };
    },
  },
  {
    key: "googleForms",
    label: "Google Forms",
    description: "Inline form or link",
    icon: ClipboardList,
    brand: "#673AB7",
    modes: ["embed", "button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "url", label: "Form URL", type: "url", placeholder: "https://docs.google.com/forms/…", required: true },
    ],
    defaults: { buttonText: "Open form", color: "#673AB7", height: 640 },
    build: (c) => {
      const url = s(c.url);
      if (!url) return {};
      return { href: url, embedSrc: googleFormEmbed(url), height: 640 };
    },
  },
  {
    key: "googleReviews",
    label: "Google Reviews",
    description: "Send customers to review you",
    icon: Star,
    brand: "#FBBC05",
    modes: ["button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "placeId", label: "Google Place ID", type: "text", placeholder: "ChIJ…" },
      { key: "url", label: "Review link", type: "url", placeholder: "Used when no Place ID", help: "Paste your Google review short link." },
    ],
    defaults: { buttonText: "Leave a Google review", color: "#FBBC05" },
    build: (c) => {
      const pid = s(c.placeId);
      let href = "";
      if (pid) {
        href = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}`;
      } else {
        href = s(c.url);
      }
      return { href, embedSrc: href };
    },
  },
  {
    key: "trustpilot",
    label: "Trustpilot",
    description: "Link to your Trustpilot profile",
    icon: ShieldCheck,
    brand: "#00B67A",
    modes: ["button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "domain", label: "Business domain", type: "text", placeholder: "zupix.app", required: true },
    ],
    defaults: { buttonText: "Read our reviews", color: "#00B67A" },
    build: (c) => {
      const d = s(c.domain).replace(/^https?:\/\//, "").replace(/\/$/, "");
      return d ? { href: `https://www.trustpilot.com/review/${d}` } : {};
    },
  },
  {
    key: "instagram",
    label: "Instagram",
    description: "Profile or post link",
    icon: Instagram,
    brand: "#E1306C",
    modes: ["button", "newTab", "floating", "floatingBubble", "stickyBottom", "iconOnly", "card", "popup", "hidden"],
    fields: [{ key: "username", label: "Username", type: "text", placeholder: "zupix.studio", required: true }],
    defaults: { buttonText: "Follow on Instagram", color: "#E1306C" },
    build: (c) => {
      const u = s(c.username).replace(/^@/, "");
      return u ? { href: `https://instagram.com/${u}` } : {};
    },
  },
  {
    key: "facebook",
    label: "Facebook",
    description: "Page or profile link",
    icon: Facebook,
    brand: "#1877F2",
    modes: ["button", "newTab", "floating", "floatingBubble", "stickyBottom", "iconOnly", "card", "popup", "hidden"],
    fields: [{ key: "username", label: "Page name or URL", type: "text", placeholder: "zupixstudio", required: true }],
    defaults: { buttonText: "Follow on Facebook", color: "#1877F2" },
    build: (c) => {
      const u = s(c.username);
      if (!u) return {};
      return { href: u.startsWith("http") ? u : `https://facebook.com/${u.replace(/^@/, "")}` };
    },
  },
  {
    key: "twitter",
    label: "Twitter / X",
    description: "Profile link",
    icon: Twitter,
    brand: "#0F1419",
    modes: ["button", "newTab", "floating", "floatingBubble", "stickyBottom", "iconOnly", "card", "popup", "hidden"],
    fields: [{ key: "username", label: "Username", type: "text", placeholder: "zupix", required: true }],
    defaults: { buttonText: "Follow on X", color: "#0F1419" },
    build: (c) => {
      const u = s(c.username).replace(/^@/, "");
      return u ? { href: `https://x.com/${u}` } : {};
    },
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    description: "Profile or company page",
    icon: Linkedin,
    brand: "#0A66C2",
    modes: ["button", "newTab", "floating", "floatingBubble", "stickyBottom", "iconOnly", "card", "popup", "hidden"],
    fields: [
      { key: "url", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/company/zupix", required: true },
    ],
    defaults: { buttonText: "Connect on LinkedIn", color: "#0A66C2" },
    build: (c) => {
      const u = s(c.url);
      return u ? { href: u.startsWith("http") ? u : `https://${u}` } : {};
    },
  },
  {
    key: "customEmbed",
    label: "Custom Embed",
    description: "Any trusted iframe URL",
    icon: Code2,
    brand: "#6366F1",
    modes: ["embed", "button", "newTab", "floating", "floatingBubble", "stickyBottom", "card", "popup", "hidden"],
    fields: [
      { key: "url", label: "Embed URL", type: "url", placeholder: "https://…", required: true },
      { key: "title", label: "Accessible title", type: "text", placeholder: "Booking widget" },
    ],
    defaults: { buttonText: "Open", color: "#6366F1", height: 420 },
    build: (c) => {
      const url = s(c.url);
      if (!url || !/^https:\/\//i.test(url)) return {};
      return { href: url, embedSrc: url, height: 420 };
    },
  },
];

export function getIntegration(key: string): IntegrationDef | undefined {
  return INTEGRATIONS.find((i) => i.key === key);
}

export function integrationDefaults(def: IntegrationDef): IntegrationConfig {
  return { ...STYLE_DEFAULTS, ...def.defaults };
}

/** Fields visible for a given display mode (provider fields + style fields). */
export function visibleFields(def: IntegrationDef, mode: IntegrationDisplayMode): IntegrationField[] {
  return [...def.fields, ...STYLE_FIELDS].filter((f) => !f.modes || f.modes.includes(mode));
}

export const MODE_LABEL: Record<IntegrationDisplayMode, string> = {
  button: "Section button",
  embed: "Inline embed",
  popup: "Popup",
  newTab: "Open in new tab",
  floating: "Floating button",
  floatingBubble: "Floating bubble",
  stickyBottom: "Sticky bottom bar",
  headerAction: "Header action",
  iconOnly: "Icon only",
  card: "Information card",
  hidden: "Hidden",
};
