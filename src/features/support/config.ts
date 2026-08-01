/**
 * Support Center configuration — single source of truth for the MVP Help
 * Center. New channels (tickets, live chat, AI support) can be added here
 * and rendered by the shared card grid without redesigning the page.
 */

export const SUPPORT_EMAIL = "support@zupix.in";
export const SUPPORT_WHATSAPP_DISPLAY = "+91 80040 21255";
export const SUPPORT_WHATSAPP_NUMBER = "918004021255";

export const SUPPORT_WHATSAPP_MESSAGE = [
  "Hello ZUPIX Support,",
  "",
  "I need help with my ZUPIX Link Studio account.",
  "",
  "Thank you.",
].join("\n");

export const supportWhatsAppUrl = () =>
  `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;

export const supportMailtoUrl = () =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "ZUPIX Link Studio — Support request",
  )}&body=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;

export const SUPPORT_HOURS = {
  days: "Monday – Saturday",
  time: "10:00 AM – 7:00 PM (IST)",
  responseTime: "Within 24 hours",
};
