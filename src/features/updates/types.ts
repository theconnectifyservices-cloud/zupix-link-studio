/**
 * ZUPIX App Update Center — shared types.
 * Phase 1 is in-app only. The schema already carries `channels`, `translations`
 * and beta targeting so push / email / WhatsApp / i18n can be layered on later
 * without a migration.
 */

export const RELEASE_TYPES = [
  "major_update",
  "feature_update",
  "bug_fix",
  "security_update",
  "hotfix",
] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

export const UPDATE_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type UpdatePriority = (typeof UPDATE_PRIORITIES)[number];

export const UPDATE_VISIBILITIES = ["everyone", "plan", "users", "beta"] as const;
export type UpdateVisibility = (typeof UPDATE_VISIBILITIES)[number];

export const UPDATE_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type UpdateStatus = (typeof UPDATE_STATUSES)[number];

export const TARGETABLE_PLANS = ["udaan", "tejas", "garuda", "vajra", "lifetime"] as const;

/** A version row exactly as stored (admin view). */
export interface PlatformVersion {
  id: string;
  version: string;
  version_sort: number;
  title: string;
  description: string;
  whats_new: string[];
  bug_fixes: string[];
  performance_improvements: string[];
  security_updates: string[];
  release_date: string;
  release_type: ReleaseType;
  priority: UpdatePriority;
  visibility: UpdateVisibility;
  target_plans: string[];
  target_user_ids: string[];
  banner_image_url: string | null;
  video_url: string | null;
  docs_url: string | null;
  status: UpdateStatus;
  publish_at: string | null;
  published_at: string | null;
  is_forced: boolean;
  is_important: boolean;
  is_pinned: boolean;
  channels: Record<string, boolean>;
  translations: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** A version as delivered to the signed-in user, with their own state. */
export interface MyVersion {
  id: string;
  version: string;
  title: string;
  description: string;
  whats_new: string[];
  bug_fixes: string[];
  performance_improvements: string[];
  security_updates: string[];
  release_date: string;
  release_type: ReleaseType;
  priority: UpdatePriority;
  banner_image_url: string | null;
  video_url: string | null;
  docs_url: string | null;
  is_forced: boolean;
  is_important: boolean;
  is_pinned: boolean;
  published_at: string | null;
  version_sort: number;
  seen_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  never_show_at: string | null;
  updated_at_action: string | null;
}

export interface UpdateAnalytics {
  eligible: number;
  seen: number;
  updated: number;
  read: number;
  ignored: number;
  pending: number;
  dismiss_rate: number;
}

export const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  major_update: "Major Update",
  feature_update: "Feature Update",
  bug_fix: "Bug Fix",
  security_update: "Security Update",
  hotfix: "Hotfix",
};

export const PRIORITY_LABEL: Record<UpdatePriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
};

export const VISIBILITY_LABEL: Record<UpdateVisibility, string> = {
  everyone: "All Users",
  plan: "Specific Plans",
  users: "Selected Users",
  beta: "Beta Testers",
};

export const STATUS_LABEL: Record<UpdateStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

/** Semantic accent classes per release type — dark-mode safe, token driven. */
export const RELEASE_TYPE_STYLE: Record<ReleaseType, string> = {
  major_update: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20",
  feature_update: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20",
  bug_fix: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  security_update: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
  hotfix: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
};

export const PRIORITY_STYLE: Record<UpdatePriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export const STATUS_STYLE: Record<UpdateStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

/** `1.2.3` -> sortable integer. Mirrors platform_version_sort_key() in SQL. */
export function versionSortKey(version: string): number {
  const v = String(version ?? "0")
    .trim()
    .toLowerCase()
    .replace(/^v/, "");
  const [a, b, c] = v.split(".");
  const n = (s?: string) => Number.parseInt((s ?? "0").replace(/[^0-9].*$/, "") || "0", 10) || 0;
  return n(a) * 1_000_000 + n(b) * 1_000 + n(c);
}

export function isVersionValid(version: string): boolean {
  return /^v?[0-9]+(\.[0-9]+){0,3}([-.][a-z0-9]+)*$/i.test(String(version ?? "").trim());
}

/** Total number of changelog line items across all four buckets. */
export function changeCount(v: Pick<MyVersion, "whats_new" | "bug_fixes" | "performance_improvements" | "security_updates">) {
  return (
    v.whats_new.length +
    v.bug_fixes.length +
    v.performance_improvements.length +
    v.security_updates.length
  );
}
