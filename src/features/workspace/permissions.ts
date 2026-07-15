/**
 * Platform permission catalog + client-side helpers.
 * Mirrors the seed in the LS-13B migration.
 */

export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceType = "personal" | "business" | "agency" | "enterprise";
export type MemberStatus = "active" | "suspended" | "invited";

export interface PermissionDef {
  key: string;
  category: string;
  description: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { key: "dashboard.view", category: "Dashboard", description: "View dashboard" },
  { key: "builder.view", category: "Builder", description: "View bio pages" },
  { key: "builder.edit", category: "Builder", description: "Create and edit bio pages" },
  { key: "builder.delete", category: "Builder", description: "Delete bio pages" },
  { key: "publishing.publish", category: "Publishing", description: "Publish or unpublish bio pages" },
  { key: "analytics.view", category: "Analytics", description: "View analytics dashboards" },
  { key: "analytics.export", category: "Analytics", description: "Export analytics data" },
  { key: "media.view", category: "Media Library", description: "View media library" },
  { key: "media.upload", category: "Media Library", description: "Upload media" },
  { key: "media.delete", category: "Media Library", description: "Delete media" },
  { key: "ai.use", category: "AI", description: "Use AI tools and generators" },
  { key: "ai.manage", category: "AI", description: "Manage AI workflows and memory" },
  { key: "billing.view", category: "Billing", description: "View billing and invoices" },
  { key: "billing.manage", category: "Billing", description: "Manage plans, payments and taxes" },
  { key: "integrations.view", category: "Integrations", description: "View integrations" },
  { key: "integrations.manage", category: "Integrations", description: "Manage integrations and API keys" },
  { key: "domains.view", category: "Domains", description: "View domains" },
  { key: "domains.manage", category: "Domains", description: "Add or remove domains" },
  { key: "templates.view", category: "Templates", description: "Browse templates" },
  { key: "templates.manage", category: "Templates", description: "Create and manage templates" },
  { key: "settings.view", category: "Settings", description: "View workspace settings" },
  { key: "settings.manage", category: "Settings", description: "Update workspace settings" },
  { key: "users.view", category: "Users", description: "View members" },
  { key: "users.manage", category: "Users", description: "Invite, remove and change roles" },
];

export const PERMISSION_CATEGORIES = Array.from(new Set(PERMISSIONS.map((p) => p.category)));

export const ROLE_DEFAULTS: Record<WorkspaceRole, string[]> = {
  owner: PERMISSIONS.map((p) => p.key),
  admin: PERMISSIONS.map((p) => p.key).filter((k) => k !== "billing.manage"),
  member: [
    "dashboard.view",
    "builder.view",
    "builder.edit",
    "media.view",
    "media.upload",
    "analytics.view",
    "ai.use",
    "templates.view",
    "settings.view",
    "users.view",
  ],
};

/** Suggested preset roles for custom-role creation. */
export const CUSTOM_ROLE_PRESETS = [
  {
    key: "manager",
    name: "Manager",
    description: "Team lead — everything admin can do except billing.",
    permissions: ROLE_DEFAULTS.admin,
  },
  {
    key: "editor",
    name: "Editor",
    description: "Edit content and publish; no destructive access.",
    permissions: [
      "dashboard.view",
      "builder.view",
      "builder.edit",
      "publishing.publish",
      "media.view",
      "media.upload",
      "analytics.view",
      "ai.use",
      "templates.view",
      "settings.view",
    ],
  },
  {
    key: "designer",
    name: "Designer",
    description: "Focused on visual/media work.",
    permissions: [
      "dashboard.view",
      "builder.view",
      "builder.edit",
      "media.view",
      "media.upload",
      "media.delete",
      "templates.view",
      "templates.manage",
      "ai.use",
    ],
  },
  {
    key: "content_creator",
    name: "Content Creator",
    description: "Draft and edit; no publishing rights.",
    permissions: [
      "dashboard.view",
      "builder.view",
      "builder.edit",
      "media.view",
      "media.upload",
      "ai.use",
      "templates.view",
    ],
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read-only access to everything they can see.",
    permissions: [
      "dashboard.view",
      "builder.view",
      "media.view",
      "analytics.view",
      "templates.view",
      "settings.view",
      "users.view",
    ],
  },
];

export function computeEffectivePermissions(
  baseRole: WorkspaceRole,
  customPermissions?: string[] | null,
  overrides?: Array<{ permission_key: string; granted: boolean }>,
): Set<string> {
  const perms = new Set<string>(
    customPermissions && customPermissions.length > 0
      ? customPermissions
      : ROLE_DEFAULTS[baseRole] ?? [],
  );
  for (const o of overrides ?? []) {
    if (o.granted) perms.add(o.permission_key);
    else perms.delete(o.permission_key);
  }
  return perms;
}
