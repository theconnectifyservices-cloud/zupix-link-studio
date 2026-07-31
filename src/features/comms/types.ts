/** Communication Center (Phase 1 — in-app only) shared types. */

export const NOTIFICATION_TYPES = [
  "information",
  "update",
  "success",
  "warning",
  "offer",
  "maintenance",
] as const;
export type CommNotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PRIORITIES = ["low", "normal", "high", "important"] as const;
export type CommPriority = (typeof PRIORITIES)[number];

export const AUDIENCES = [
  "all",
  "trial",
  "udaan",
  "tejas",
  "garuda",
  "vajra",
  "lifetime",
  "selected",
] as const;
export type CommAudience = (typeof AUDIENCES)[number];

export const STATUSES = ["draft", "published", "archived"] as const;
export type CommStatus = (typeof STATUSES)[number];

export type CommBarMode = "static" | "marquee";

export interface CommNotification {
  id: string;
  title: string;
  description: string;
  type: CommNotificationType;
  banner_image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  priority: CommPriority;
  audience: CommAudience;
  target_user_ids: string[];
  starts_at: string;
  ends_at: string | null;
  status: CommStatus;
  created_at: string;
  updated_at: string;
}

/** A notification as seen by the recipient, with their own read state. */
export interface FeedNotification {
  id: string;
  title: string;
  description: string;
  type: CommNotificationType;
  banner_image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  priority: CommPriority;
  starts_at: string;
  created_at: string;
  read_at: string | null;
  popup_seen_at: string | null;
}

export interface AnnouncementBar {
  id: string;
  message: string;
  mode: CommBarMode;
  button_text: string | null;
  button_url: string | null;
  background_color: string;
  text_color: string;
  is_enabled: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReleaseNote {
  id: string;
  version: string;
  title: string;
  description: string;
  release_date: string;
  status: CommStatus;
  created_at: string;
  updated_at: string;
}

export const TYPE_LABEL: Record<CommNotificationType, string> = {
  information: "Information",
  update: "Update",
  success: "Success",
  warning: "Warning",
  offer: "Offer",
  maintenance: "Maintenance",
};

export const AUDIENCE_LABEL: Record<CommAudience, string> = {
  all: "All Users",
  trial: "Trial Users",
  udaan: "UDAAN",
  tejas: "TEJAS",
  garuda: "GARUDA",
  vajra: "VAJRA",
  lifetime: "Lifetime",
  selected: "Selected Users",
};

export const PRIORITY_LABEL: Record<CommPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  important: "Important (popup)",
};

/** Semantic accent classes per notification type — dark-mode safe. */
export const TYPE_STYLE: Record<CommNotificationType, { chip: string; icon: string }> = {
  information: { chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: "text-sky-500" },
  update: { chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: "text-violet-500" },
  success: {
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-500",
  },
  warning: { chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: "text-amber-500" },
  offer: { chip: "bg-pink-500/10 text-pink-600 dark:text-pink-400", icon: "text-pink-500" },
  maintenance: { chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300", icon: "text-slate-500" },
};

export function isLive(n: { status: CommStatus; starts_at: string; ends_at: string | null }) {
  const now = Date.now();
  return (
    n.status === "published" &&
    new Date(n.starts_at).getTime() <= now &&
    (!n.ends_at || new Date(n.ends_at).getTime() > now)
  );
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
