/**
 * Platform-level RBAC (distinct from workspace-scoped permissions).
 * Roles live in public.user_roles and drive which modules a user can access.
 */
export type PlatformRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "team_member"
  | "agency_owner"
  | "reseller"
  | "customer"
  | "user"; // legacy — treated as customer

export type Permission =
  | "can_view_dashboard"
  | "can_manage_bio_pages"
  | "can_view_analytics"
  | "can_manage_media"
  | "can_use_ai"
  | "can_manage_workspace"
  | "can_manage_agency"
  | "can_manage_enterprise"
  | "can_manage_monetization"
  | "can_manage_whitelabel"
  | "can_manage_reseller"
  | "can_manage_infrastructure"
  | "can_manage_performance"
  | "can_manage_security"
  | "can_manage_qa"
  | "can_manage_operations"
  | "can_manage_launch"
  | "can_manage_billing"
  | "can_manage_monitoring";

const CUSTOMER_PERMS: Permission[] = [
  "can_view_dashboard",
  "can_manage_bio_pages",
  "can_view_analytics",
  "can_manage_media",
  "can_use_ai",
  "can_manage_workspace",
  "can_manage_billing",
];

const TEAM_MEMBER_PERMS: Permission[] = [...CUSTOMER_PERMS];

const AGENCY_PERMS: Permission[] = [...CUSTOMER_PERMS, "can_manage_agency"];

const RESELLER_PERMS: Permission[] = [
  ...CUSTOMER_PERMS,
  "can_manage_reseller",
  "can_manage_whitelabel",
];

const ADMIN_PERMS: Permission[] = [
  ...CUSTOMER_PERMS,
  "can_manage_agency",
  "can_manage_enterprise",
  "can_manage_monetization",
  "can_manage_whitelabel",
  "can_manage_reseller",
  "can_manage_infrastructure",
  "can_manage_performance",
  "can_manage_security",
  "can_manage_qa",
  "can_manage_operations",
  "can_manage_launch",
];

const ALL_PERMS: Permission[] = [
  ...ADMIN_PERMS,
];

export const ROLE_PERMISSIONS: Record<PlatformRole, Permission[]> = {
  super_admin: ALL_PERMS,
  admin: ADMIN_PERMS,
  moderator: ADMIN_PERMS,
  agency_owner: AGENCY_PERMS,
  reseller: RESELLER_PERMS,
  team_member: TEAM_MEMBER_PERMS,
  customer: CUSTOMER_PERMS,
  user: CUSTOMER_PERMS,
};

export function permissionsFor(roles: PlatformRole[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) {
    for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  }
  return set;
}

export function isSuperAdmin(roles: PlatformRole[]): boolean {
  return roles.includes("super_admin");
}
