import { Suspense, lazy, type ComponentType } from "react";
import type { ContactIconKey } from "../types";

type IconProps = { className?: string; strokeWidth?: number; "aria-hidden"?: boolean };

/**
 * Icons are code-split: the lucide chunk only downloads when the widget
 * actually renders, keeping the public bio page's initial payload small.
 */
const LOADERS: Record<ContactIconKey, () => Promise<{ default: ComponentType<IconProps> }>> = {
  message: () => import("lucide-react").then((m) => ({ default: m.MessageCircle })),
  chat: () => import("lucide-react").then((m) => ({ default: m.MessagesSquare })),
  phone: () => import("lucide-react").then((m) => ({ default: m.Phone })),
  mail: () => import("lucide-react").then((m) => ({ default: m.Mail })),
  calendar: () => import("lucide-react").then((m) => ({ default: m.CalendarDays })),
  mapPin: () => import("lucide-react").then((m) => ({ default: m.MapPin })),
  sparkles: () => import("lucide-react").then((m) => ({ default: m.Sparkles })),
  zap: () => import("lucide-react").then((m) => ({ default: m.Zap })),
  users: () => import("lucide-react").then((m) => ({ default: m.Users })),
  headset: () => import("lucide-react").then((m) => ({ default: m.Headphones })),
  plus: () => import("lucide-react").then((m) => ({ default: m.Plus })),
};

export const CONTACT_ICON_KEYS = Object.keys(LOADERS) as ContactIconKey[];

const CACHE = new Map<ContactIconKey, ComponentType<IconProps>>();

function get(key: ContactIconKey): ComponentType<IconProps> {
  const existing = CACHE.get(key);
  if (existing) return existing;
  const Comp = lazy(LOADERS[key] ?? LOADERS.message);
  CACHE.set(key, Comp);
  return Comp;
}

/** Reserves its box while loading, so there is never a layout shift. */
export function ContactIcon({
  name,
  className = "h-5 w-5",
}: {
  name: ContactIconKey;
  className?: string;
}) {
  const Comp = get(name);
  return (
    <Suspense fallback={<span className={className} aria-hidden />}>
      <Comp className={className} aria-hidden />
    </Suspense>
  );
}
