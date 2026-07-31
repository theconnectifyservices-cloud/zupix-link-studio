export interface CountryCode {
  code: string; // dial code with +
  iso: string;
  name: string;
  flag: string;
  /** expected national number length (digits) */
  digits?: number;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "+91", iso: "IN", name: "India", flag: "🇮🇳", digits: 10 },
  { code: "+1", iso: "US", name: "United States", flag: "🇺🇸", digits: 10 },
  { code: "+44", iso: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", iso: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+61", iso: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "+65", iso: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "+60", iso: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "+64", iso: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "+27", iso: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "+49", iso: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "+33", iso: "FR", name: "France", flag: "🇫🇷" },
  { code: "+39", iso: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "+34", iso: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "+31", iso: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "+41", iso: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "+46", iso: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "+353", iso: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "+81", iso: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "+82", iso: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "+86", iso: "CN", name: "China", flag: "🇨🇳" },
  { code: "+62", iso: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "+63", iso: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "+66", iso: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "+84", iso: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "+880", iso: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", iso: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", iso: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "+92", iso: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "+966", iso: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+974", iso: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "+965", iso: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "+968", iso: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "+973", iso: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "+20", iso: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "+234", iso: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "+254", iso: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "+55", iso: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "+52", iso: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "+7", iso: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "+90", iso: "TR", name: "Türkiye", flag: "🇹🇷" },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0];

export function normalizeNationalNumber(raw: string) {
  return raw.replace(/\D/g, "").replace(/^0+/, "");
}

export function buildE164(dialCode: string, national: string) {
  return `${dialCode}${normalizeNationalNumber(national)}`;
}

export function isValidPhone(country: CountryCode, national: string) {
  const digits = normalizeNationalNumber(national);
  if (country.digits) return digits.length === country.digits;
  return digits.length >= 6 && digits.length <= 14;
}
