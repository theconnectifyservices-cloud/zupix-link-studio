export type LicensePlan =
  | "trial_3day"
  | "monthly"
  | "yearly"
  | "lifetime"
  | "reseller"
  | "enterprise";

export type LicenseStatusValue = "unused" | "active" | "suspended" | "revoked" | "expired";

export interface ProductLicense {
  id: string;
  license_key: string;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  plan: LicensePlan;
  status: LicenseStatusValue;
  expires_at: string | null;
  activated_at: string | null;
  last_login_at: string | null;
  max_devices: number; // -1 = unlimited
  notes: string | null;
  user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicenseActivation {
  id: string;
  license_id: string;
  user_id: string | null;
  device_id: string;
  device_label: string | null;
  last_seen_at: string;
  revoked_at: string | null;
  created_at: string;
}

export const PLAN_LABELS: Record<LicensePlan, string> = {
  trial_3day: "3 Days Trial",
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
  reseller: "Reseller",
  enterprise: "Enterprise",
};

export const PLAN_OPTIONS = Object.entries(PLAN_LABELS) as Array<[LicensePlan, string]>;

export const STATUS_LABELS: Record<LicenseStatusValue, string> = {
  unused: "Unused",
  active: "Active",
  suspended: "Suspended",
  revoked: "Revoked",
  expired: "Expired",
};

export const DEVICE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "1 Device" },
  { value: 2, label: "2 Devices" },
  { value: 3, label: "3 Devices" },
  { value: 5, label: "5 Devices" },
  { value: -1, label: "Unlimited" },
];

/** Default validity in days per plan (null = no expiry). */
export const PLAN_DURATION_DAYS: Record<LicensePlan, number | null> = {
  trial_3day: 3,
  monthly: 30,
  yearly: 365,
  lifetime: null,
  reseller: 365,
  enterprise: 365,
};

export function licenseErrorMessage(reason?: string | null, maxDevices?: number | null) {
  switch (reason) {
    case "device_limit":
      return `This License Key has reached its activation limit${
        maxDevices && maxDevices > 0 ? ` (${maxDevices} device${maxDevices > 1 ? "s" : ""})` : ""
      }.`;
    case "invalid":
    case "not_found":
      return "License Not Found";
    case "already_used":
    case "active":
      return "License Already Activated";
    case "suspended":
      return "License Suspended";
    case "revoked":
      return "License Revoked";
    case "expired":
      return "License Expired";
    case "customer_mismatch":
      return "Customer Mismatch — contact support to update your license details.";
    case "missing_details":
      return "This license has no customer details. Please complete the form.";
    case "email_taken":
      return "An account with this email already exists. Please sign in instead.";
    case "phone_taken":
      return "An account with this phone number already exists. Please sign in instead.";
    default:
      return reason ? `Activation failed: ${reason}` : "Invalid or Expired License Key";
  }
}

/**
 * Expiry is stored as a date (midnight UTC). A license is valid through the
 * whole of its expiry day, so compare against the end of that day.
 */
export function isLicenseExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return false;
  const endOfDay = new Date(t);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return endOfDay.getTime() < Date.now();
}
