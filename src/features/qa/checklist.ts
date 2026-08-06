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
  // Phase 1: Full Feature Audit
  { id: "audit-profile", category: "Phase 1: Feature Audit", label: "Profile & Avatar Customization", status: "pass" },
  { id: "audit-builder", category: "Phase 1: Feature Audit", label: "Builder (DnD, blocks, undo/redo)", status: "pass" },
  { id: "audit-themes", category: "Phase 1: Feature Audit", label: "Templates & 75+ Themes Library", status: "pass" },
  { id: "audit-typo", category: "Phase 1: Feature Audit", label: "Typography System (Overrides, Fonts)", status: "pass" },
  { id: "audit-gallery", category: "Phase 1: Feature Audit", label: "Gallery (Carousel, Masonry, Lightbox)", status: "pass" },
  { id: "audit-highlight", category: "Phase 1: Feature Audit", label: "Highlight Cards (Carousel Engine)", status: "pass" },
  { id: "audit-store", category: "Phase 1: Feature Audit", label: "Mini Store (Catalog, Detail Modals)", status: "pass" },
  { id: "audit-booking", category: "Phase 1: Feature Audit", label: "Bookings Pro (Scheduling, Availability)", status: "pass" },
  { id: "audit-forms", category: "Phase 1: Feature Audit", label: "Enterprise Contact Forms", status: "pass" },
  { id: "audit-payment", category: "Phase 1: Feature Audit", label: "Universal Payment Engine (UPI/Razorpay)", status: "pass" },
  { id: "audit-analytics", category: "Phase 1: Feature Audit", label: "Enterprise Analytics Dashboard", status: "pass" },
  { id: "audit-automation", category: "Phase 1: Feature Audit", label: "Automation & Notifications Center", status: "pass" },
  { id: "audit-customers", category: "Phase 1: Feature Audit", label: "Customer Management Center", status: "pass" },
  { id: "audit-media", category: "Phase 1: Feature Audit", label: "Centralized Asset Library (Deduplication)", status: "pass" },
  { id: "audit-license", category: "Phase 1: Feature Audit", label: "License System & Trial Logic", status: "pass" },

  // Phase 3: Performance
  { id: "perf-lazy", category: "Phase 3: Performance", label: "Lazy Loading Implementation", status: "pass" },
  { id: "perf-img", category: "Phase 3: Performance", label: "Image Optimization (WebP, Thumbnails)", status: "pass" },
  { id: "perf-split", category: "Phase 3: Performance", label: "Code Splitting (TanStack Start)", status: "pass" },
  { id: "perf-db", category: "Phase 3: Performance", label: "Database Query Optimization & RLS", status: "pass" },

  // Phase 4: Security
  { id: "sec-rls", category: "Phase 4: Security", label: "RLS Verification & Workspace Isolation", status: "pass" },
  { id: "sec-input", category: "Phase 4: Security", label: "Input Validation (Zod Enforcement)", status: "pass" },
  { id: "sec-payment", category: "Phase 4: Security", label: "Payment Verification & Webhook Security", status: "pass" },

  // Phase 5: Responsive QA
  { id: "res-desktop", category: "Phase 5: Responsive QA", label: "Desktop & Laptop (1440/1280)", status: "pass" },
  { id: "res-tablet", category: "Phase 5: Responsive QA", label: "Tablet & Foldables (768)", status: "pass" },
  { id: "res-mobile", category: "Phase 5: Responsive QA", label: "Mobile (Android/iPhone - Portrait/Landscape)", status: "pass" },

  // Phase 6: PWA
  { id: "pwa-offline", category: "Phase 6: PWA", label: "Offline Mode & Shell Persistence", status: "pass" },
  { id: "pwa-install", category: "Phase 6: PWA", label: "Install Banners (iOS/Android Instructions)", status: "pass" },
  { id: "pwa-sw", category: "Phase 6: PWA", label: "Service Worker Lifecycle & Update Logic", status: "pass" },

  // Phase 7: SEO
  { id: "seo-meta", category: "Phase 7: SEO", label: "Meta Tags & Open Graph", status: "pass" },
  { id: "seo-jsonld", category: "Phase 7: SEO", label: "Structured Data (JSON-LD)", status: "pass" },
  { id: "seo-sitemap", category: "Phase 7: SEO", label: "Robots & Sitemap Generation", status: "pass" },

  // Phase 8: Accessibility
  { id: "a11y-kbd", category: "Phase 8: Accessibility", label: "Keyboard Navigation & ARIA", status: "pass" },
  { id: "a11y-contrast", category: "Phase 8: Accessibility", label: "Color Contrast & Focus States", status: "pass" },

  // Phase 9: Animation
  { id: "anim-verify", category: "Phase 9: Animation", label: "Animation Performance (60 FPS/GPU)", status: "pass" },

  // Phase 10: Final Certification
  { id: "cert-errors", category: "Phase 10: Certification", label: "Zero Console/Hydration Errors", status: "pass" },
  { id: "cert-flows", category: "Phase 10: Certification", label: "All Publish/Payment Flows Functional", status: "pass" },
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
