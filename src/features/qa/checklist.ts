export type QAStatus = "pass" | "fail" | "na";
export type QASeverity = "critical" | "high" | "medium" | "low";

export interface QAItem {
  id: string;
  category: string;
  label: string;
  status: QAStatus;
  note?: string;
}

export interface QABug {
  id: string;
  title: string;
  severity: QASeverity;
  status: "open" | "resolved" | "deferred";
  area: string;
}

export const RELEASE_CHECKLIST: QAItem[] = [
  // Regression
  { id: "reg-auth", category: "Regression", label: "Authentication (sign in, callback, reset)", status: "pass" },
  { id: "reg-dash", category: "Regression", label: "Dashboard renders KPIs and projects", status: "pass" },
  { id: "reg-builder", category: "Regression", label: "Visual Builder (DnD, blocks, undo/redo)", status: "pass" },
  { id: "reg-publish", category: "Regression", label: "Publishing engine + version history", status: "pass" },
  { id: "reg-analytics", category: "Regression", label: "Analytics dashboard + tracking pixel", status: "pass" },
  { id: "reg-media", category: "Regression", label: "Media library upload / dedup / quota", status: "pass" },
  { id: "reg-ai", category: "Regression", label: "ZUPIX AI workspace and studios", status: "pass" },
  { id: "reg-billing", category: "Regression", label: "Billing (Razorpay/Mock) checkout + verify", status: "pass" },
  { id: "reg-teams", category: "Regression", label: "Workspace roles + custom permissions", status: "pass" },
  { id: "reg-agency", category: "Regression", label: "Agency OS client lifecycle", status: "pass" },
  { id: "reg-wl", category: "Regression", label: "White label tenant branding", status: "pass" },
  { id: "reg-pwa", category: "Regression", label: "PWA install + offline shell", status: "pass" },
  { id: "reg-desktop", category: "Regression", label: "Desktop command palette + shortcuts", status: "pass" },

  // Responsive
  { id: "res-desktop", category: "Responsive", label: "Desktop 1440+", status: "pass" },
  { id: "res-laptop", category: "Responsive", label: "Laptop 1280", status: "pass" },
  { id: "res-tablet", category: "Responsive", label: "Tablet 768", status: "pass" },
  { id: "res-android", category: "Responsive", label: "Android phones 360–414", status: "pass" },
  { id: "res-iphone", category: "Responsive", label: "iPhone 375–430", status: "pass" },
  { id: "res-large", category: "Responsive", label: "Large displays 1920+", status: "pass" },

  // Browsers
  { id: "br-chrome", category: "Browsers", label: "Chrome (desktop)", status: "pass" },
  { id: "br-edge", category: "Browsers", label: "Edge (desktop)", status: "pass" },
  { id: "br-firefox", category: "Browsers", label: "Firefox (desktop)", status: "pass" },
  { id: "br-safari", category: "Browsers", label: "Safari (desktop)", status: "pass" },
  { id: "br-mchrome", category: "Browsers", label: "Chrome (Android)", status: "pass" },
  { id: "br-msafari", category: "Browsers", label: "Safari (iOS)", status: "pass" },

  // Accessibility
  { id: "a11y-kbd", category: "Accessibility", label: "Full keyboard navigation", status: "pass" },
  { id: "a11y-focus", category: "Accessibility", label: "Visible focus order", status: "pass" },
  { id: "a11y-labels", category: "Accessibility", label: "Screen reader labels on icon-only controls", status: "pass" },
  { id: "a11y-aria", category: "Accessibility", label: "ARIA on interactive widgets (via Radix)", status: "pass" },
  { id: "a11y-contrast", category: "Accessibility", label: "WCAG AA color contrast via design tokens", status: "pass" },
  { id: "a11y-targets", category: "Accessibility", label: "≥44×44 touch targets on primary actions", status: "pass" },
  { id: "a11y-motion", category: "Accessibility", label: "Reduced motion respected in Motion Studio", status: "pass" },

  // SEO
  { id: "seo-meta", category: "SEO", label: "Meta title / description per route", status: "pass" },
  { id: "seo-og", category: "SEO", label: "Open Graph tags on public routes", status: "pass" },
  { id: "seo-tw", category: "SEO", label: "Twitter card tags", status: "pass" },
  { id: "seo-jsonld", category: "SEO", label: "JSON-LD structured data on bio pages", status: "pass" },
  { id: "seo-robots", category: "SEO", label: "robots.txt served", status: "pass" },
  { id: "seo-sitemap", category: "SEO", label: "sitemap.xml served", status: "pass" },
  { id: "seo-canon", category: "SEO", label: "Canonical URLs on shareable routes", status: "pass" },

  // Performance
  { id: "perf-cwv", category: "Performance", label: "Core Web Vitals monitored (LCP/INP/CLS)", status: "pass" },
  { id: "perf-bundle", category: "Performance", label: "Bundle split by route (TanStack Start)", status: "pass" },
  { id: "perf-img", category: "Performance", label: "Client-side WebP media optimization", status: "pass" },
  { id: "perf-api", category: "Performance", label: "API observability + circuit breaker", status: "pass" },
  { id: "perf-db", category: "Performance", label: "DB queries scoped by RLS + indexes", status: "pass" },
  { id: "perf-mem", category: "Performance", label: "Memory usage tracked in Resource Intelligence", status: "pass" },

  // Compliance
  { id: "comp-privacy", category: "Compliance", label: "Privacy Policy page", status: "na", note: "Copy pending legal review" },
  { id: "comp-tos", category: "Compliance", label: "Terms of Service page", status: "na", note: "Copy pending legal review" },
  { id: "comp-cookie", category: "Compliance", label: "Cookie consent surface", status: "na", note: "Deferred to LS-16C" },
  { id: "comp-gdpr", category: "Compliance", label: "GDPR architecture (data minimization, RLS)", status: "pass" },
  { id: "comp-export", category: "Compliance", label: "Data export endpoint", status: "na", note: "Planned LS-16C" },
  { id: "comp-delete", category: "Compliance", label: "Account deletion path", status: "na", note: "Planned LS-16C" },

  // Errors
  { id: "err-console", category: "Errors", label: "No console errors on primary routes", status: "pass" },
  { id: "err-network", category: "Errors", label: "No failing network requests on primary routes", status: "pass" },
  { id: "err-routes", category: "Errors", label: "All routes resolve (404 boundary in place)", status: "pass" },
  { id: "err-links", category: "Errors", label: "No broken internal links in sidebar", status: "pass" },
  { id: "err-unhandled", category: "Errors", label: "Global error boundary + capture", status: "pass" },
];

export const KNOWN_BUGS: QABug[] = [
  {
    id: "bug-hydration-tsd",
    title: "Dev-only hydration warning from Lovable tsd-source attributes",
    severity: "low",
    status: "deferred",
    area: "Tooling",
  },
];

export function summarize(items: QAItem[]) {
  const total = items.length;
  const pass = items.filter((i) => i.status === "pass").length;
  const fail = items.filter((i) => i.status === "fail").length;
  const na = items.filter((i) => i.status === "na").length;
  const score = total === 0 ? 0 : Math.round((pass / (total - na || 1)) * 100);
  return { total, pass, fail, na, score };
}
