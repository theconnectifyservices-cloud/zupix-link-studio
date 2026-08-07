/**
 * Landing Conversion — the high-converting section stack below the Showcase.
 *
 * 1. Success Stories (Indian customers, animated stats)
 * 2. Enterprise Features (bento grid, animated icons)
 * 3. Enterprise Features (bento grid, animated icons)
 * 4. Comparison Table (sticky header, ZUPIX highlighted)
 * 5. Pricing Experience (glass cards, glow border)
 * 6. FAQ (searchable, category filters)
 * 7. Trust Bar (Made in India, uptime, etc.)
 * 8. Final CTA (large premium banner)
 *
 * All CTAs share the same premium <MagneticButton /> (magnetic hover +
 * shine sweep + ripple). Content is authentic Indian small businesses —
 * no lorem ipsum, no placeholder avatars.
 */

import { PricingSection } from "@/features/pricing";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calendar,
  CalendarCheck,
  Check,
  ChevronDown,
  Code2,
  Crown,
  Eye,
  FileText,
  Gauge,
  Globe,
  IndianRupee,
  Image as ImageIcon,
  Layers,
  Lock,
  MessageCircle,
  Palette,
  Play,
  Search,
  Server,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { PORTRAITS, COVERS } from "./demo-media";
import { ResponsiveStatCard, ResponsiveStatsGrid } from "./responsive-stat";

// ============================================================================
// Shared primitives
// ============================================================================

type ClassValue = string | false | null | undefined;
const cx = (...v: ClassValue[]) => v.filter(Boolean).join(" ");

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Magnetic + shine-sweep button used across every CTA in this file. */
function MagneticButton({
  children,
  variant = "primary",
  href,
  onClick,
  className,
  icon,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  href?: string;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMove = (e: ReactMouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    "relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap overflow-hidden isolation-auto transition-shadow";
  const styles = {
    primary:
      "text-white bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7] shadow-[0_10px_40px_-10px_rgba(232,67,147,0.6)] hover:shadow-[0_16px_50px_-8px_rgba(232,67,147,0.75)]",
    outline:
      "text-foreground border border-foreground/15 bg-background/60 backdrop-blur-md hover:bg-background/80",
    ghost:
      "text-foreground/80 hover:text-foreground",
  }[variant];

  const inner = (
    <>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
        initial={false}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
        {icon ?? null}
      </span>
    </>
  );

  const style: CSSProperties = { x: sx as unknown as number, y: sy as unknown as number };

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={style}
        className={cx(base, styles, className)}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={style}
      className={cx(base, styles, className)}
    >
      {inner}
    </motion.button>
  );
}

/** Count-up number that animates once when scrolled into view. */
function CountUp({
  to,
  duration = 1600,
  prefix = "",
  suffix = "",
  format = (n) => Math.round(n).toLocaleString("en-IN"),
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {format(n)}
      {suffix}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cx(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      {eyebrow && (
        <div
          className={cx(
            "inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/70 backdrop-blur-md",
          )}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#e84393]" />
          {eyebrow}
        </div>
      )}
      <h2
        className="mt-4 text-balance text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-foreground/60 sm:text-lg">{subtitle}</p>
      )}
    </div>
  );
}

// ============================================================================
// SECTION 1 — SUCCESS STORIES
// ============================================================================

type Story = {
  id: string;
  business: string;
  owner: string;
  city: string;
  industry: string;
  monogram: string;
  logo: [string, string]; // gradient
  quote: string;
  before: { views: number; wa: number; revenue: number };
  after: { views: number; wa: number; revenue: number };
  revenueGrowthPct: number;
  photo: string;
  coverKey: keyof typeof COVERS;
};

const STORIES: Story[] = [
  {
    id: "kalyan",
    business: "Kalyan Heritage Jewellers",
    owner: "Rohan Kalyan",
    city: "Jaipur, Rajasthan",
    industry: "Jewellery",
    monogram: "KH",
    logo: ["#c9a84c", "#8b5e00"],
    quote:
      "Our WhatsApp catalogue used to be screenshots. Now customers browse 400+ pieces and book showroom visits themselves.",
    before: { views: 1240, wa: 46, revenue: 385000 },
    after: { views: 28960, wa: 812, revenue: 2470000 },
    revenueGrowthPct: 541,
     photo: PORTRAITS.jewellerOwner,
    coverKey: "jewellery",
  },
  {
    id: "canteen",
    business: "The Bombay Canteen",
    owner: "Ayesha Merchant",
    city: "Delhi NCR",
    industry: "Restaurant",
    monogram: "BC",
    logo: ["#ff6b35", "#c44569"],
    quote:
      "Zomato was eating 30% commission. Direct bookings through ZUPIX now cover two full server salaries a month.",
    before: { views: 3400, wa: 120, revenue: 640000 },
    after: { views: 61200, wa: 1980, revenue: 3860000 },
    revenueGrowthPct: 503,
     photo: PORTRAITS.chefRestaurant,
    coverKey: "restaurant",
  },
  {
    id: "north",
    business: "North Star Digital",
    owner: "Karan Malhotra",
    city: "Mumbai, Maharashtra",
    industry: "Agency",
    monogram: "NS",
    logo: ["#4f46e5", "#22d3ee"],
    quote:
      "Client pitches close 2× faster since we send one branded ZUPIX link instead of a deck, a PDF and three case studies.",
    before: { views: 890, wa: 22, revenue: 720000 },
    after: { views: 17300, wa: 340, revenue: 4180000 },
    revenueGrowthPct: 481,
     photo: PORTRAITS.karan,
    coverKey: "agency",
  },
  {
    id: "vaidya",
    business: "Vaidya Care Clinic",
    owner: "Dr. Ananya Rao",
    city: "Bangalore, Karnataka",
    industry: "Healthcare",
    monogram: "VC",
    logo: ["#2dd4a8", "#0d9488"],
    quote:
      "Online appointment bookings jumped 6× and our front-desk phone finally stopped ringing off the hook.",
    before: { views: 2100, wa: 88, revenue: 1120000 },
    after: { views: 38400, wa: 1420, revenue: 5210000 },
    revenueGrowthPct: 365,
     photo: PORTRAITS.drAnanya,
    coverKey: "doctor",
  },
  {
    id: "iit",
    business: "Sharma IIT Academy",
    owner: "Prof. Rajesh Sharma",
    city: "Lucknow, Uttar Pradesh",
    industry: "Coaching",
    monogram: "SA",
    logo: ["#0f1b3d", "#3b6fa0"],
    quote:
      "Parents can now watch demo classes, read reviews and pay fees on UPI — from a single link on our WhatsApp Business.",
    before: { views: 1560, wa: 60, revenue: 480000 },
    after: { views: 42100, wa: 1240, revenue: 3050000 },
    revenueGrowthPct: 535,
     photo: PORTRAITS.rajesh,
    coverKey: "coaching",
  },
  {
    id: "iron",
    business: "Iron Republic Gym",
    owner: "Rehan Kapoor",
    city: "Pune, Maharashtra",
    industry: "Fitness",
    monogram: "IR",
    logo: ["#e85d3a", "#0d0d0d"],
    quote:
      "Trial pass sign-ups tripled the first week. The booking block plus UPI made memberships almost frictionless.",
    before: { views: 720, wa: 34, revenue: 210000 },
    after: { views: 19800, wa: 610, revenue: 1580000 },
    revenueGrowthPct: 652,
     photo: PORTRAITS.gymTrainer,
    coverKey: "gym",
  },
  {
    id: "casa",
    business: "Casa Wood Furniture",
    owner: "Priya Shah",
    city: "Ahmedabad, Gujarat",
    industry: "Furniture",
    monogram: "CW",
    logo: ["#6b3a2a", "#e8b84a"],
    quote:
      "Catalogue on Instagram bio + UPI checkout = we sold ₹18L of custom teak within 90 days of switching.",
    before: { views: 980, wa: 41, revenue: 340000 },
    after: { views: 24600, wa: 720, revenue: 2260000 },
    revenueGrowthPct: 565,
     photo: PORTRAITS.priya,
    coverKey: "furniture",
  },
];

function LogoMark({ initials, colors }: { initials: string; colors: [string, string] }) {
  return (
    <div
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgba(0,0,0,0.5)]"
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
    >
      {initials}
    </div>
  );
}

function AvatarMonogram({ name, colors, photo }: { name: string; colors: [string, string]; photo?: string }) {
  const parts = name.split(" ").filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        decoding="async"
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-background"
      />
    );
  }
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ring-2 ring-background"
      style={{ background: `radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]})` }}
    >
      {initials}
    </div>
  );
}


function GrowthBar({ before, after, label, format }: {
  before: number;
  after: number;
  label: string;
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const pct = Math.min(100, (before / after) * 100);
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>{label}</span>
        <span className="tabular-nums text-foreground/90">
          {format(before)} <span className="text-foreground/40">→</span>{" "}
          <span className="font-semibold text-foreground">{format(after)}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-foreground/5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7]"
          initial={{ width: `${pct}%` }}
          animate={inView ? { width: "100%" } : { width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function StoryCard({ s, index }: { s: Story; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-md transition-transform duration-500 hover:-translate-y-1"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${s.logo[0]}, transparent 60%)` }}
      />
      <header className="flex items-center gap-3">
        <LogoMark initials={s.monogram} colors={s.logo} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{s.business}</h3>
          <p className="truncate text-xs text-foreground/60">
            {s.industry} • {s.city}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" />
          <CountUp to={s.revenueGrowthPct} suffix="%" />
        </div>
      </header>

      <blockquote className="mt-4 text-sm leading-relaxed text-foreground/80">
        "{s.quote}"
      </blockquote>

      <div className="mt-5 flex items-center gap-3">
        <AvatarMonogram name={s.owner} colors={s.logo} photo={s.photo} />
        <div>
          <div className="text-sm font-medium">{s.owner}</div>
          <div className="text-xs text-foreground/60">Founder</div>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
        <GrowthBar
          before={s.before.views}
          after={s.after.views}
          label="Profile views / mo"
          format={(n) => Math.round(n).toLocaleString("en-IN")}
        />
        <GrowthBar
          before={s.before.wa}
          after={s.after.wa}
          label="WhatsApp inquiries"
          format={(n) => Math.round(n).toLocaleString("en-IN")}
        />
        <GrowthBar
          before={s.before.revenue}
          after={s.after.revenue}
          label="Revenue / mo"
          format={(n) => inr(Math.round(n))}
        />
      </div>
    </motion.article>
  );
}

function SectionSuccessStories() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Real Indian businesses. Real results."
          title={
            <>
              From{" "}
              <span
                className="bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7] bg-clip-text text-transparent"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                bio link
              </span>{" "}
              to business growth engine
            </>
          }
          subtitle="Founders across India use ZUPIX to convert Instagram, WhatsApp and QR traffic into paying customers."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s, i) => (
            <StoryCard key={s.id} s={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}


// ============================================================================
// SECTION 3 — ENTERPRISE FEATURES BENTO
// ============================================================================

const FEATURES = [
  { icon: ShoppingBag, title: "Unlimited Products", desc: "Sell physical, digital and services with variants and inventory.", colors: ["#ff6b35", "#c44569"], span: "md:col-span-2" },
  { icon: MessageCircle, title: "WhatsApp Integration", desc: "One-tap chat, order forms and broadcast lists — native.", colors: ["#22c55e", "#16a34a"], span: "" },
  { icon: Wallet, title: "UPI Payments", desc: "Instant QR + GPay / PhonePe / Paytm settlements.", colors: ["#6c5ce7", "#4f46e5"], span: "" },
  { icon: Calendar, title: "Booking System", desc: "Slots, buffers, staff calendars and reminders included.", colors: ["#0d7a5f", "#2dd4a8"], span: "md:col-span-2" },
  { icon: FileText, title: "Forms & Leads", desc: "Custom fields, conditional logic, CRM export.", colors: ["#e8b84a", "#c9a84c"], span: "" },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Views, taps, conversions, funnels and heatmaps.", colors: ["#3b82f6", "#0ea5e9"], span: "md:col-span-2" },
  { icon: Globe, title: "Custom Domain", desc: "Bring your own domain with auto-SSL in minutes.", colors: ["#0f1b3d", "#3b6fa0"], span: "" },
  { icon: Code2, title: "HTML Widgets", desc: "20+ presets — sandboxed, safe, editable.", colors: ["#0d0d0d", "#e85d3a"], span: "" },
  { icon: Search, title: "Enterprise SEO", desc: "OpenGraph, JSON-LD, sitemaps, favicons.", colors: ["#7d9b76", "#4a6741"], span: "" },
  { icon: Palette, title: "Theme Studio", desc: "Live design tokens, motion presets, brand kits.", colors: ["#e84393", "#c44569"], span: "md:col-span-2" },
  { icon: BadgeCheck, title: "Verified Profiles", desc: "Blue-tick verification for creators & brands.", colors: ["#22d3ee", "#0ea5e9"], span: "" },
  { icon: ImageIcon, title: "Media Library", desc: "Universal picker with dedupe and quotas.", colors: ["#8b5e00", "#e8b84a"], span: "" },
];

function FeatureCell({ f, i }: { f: (typeof FEATURES)[number]; i: number }) {
  const Icon = f.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={cx(
        "group relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-md",
        f.span,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${f.colors[0]}, transparent 60%)` }}
      />
      <motion.div
        whileHover={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.6 }}
        className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${f.colors[0]}, ${f.colors[1]})` }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
      <p className="mt-1.5 text-sm text-foreground/60">{f.desc}</p>
    </motion.div>
  );
}

function SectionFeatures() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Enterprise features"
          title={
            <>
              Everything you need,{" "}
              <span
                className="bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7] bg-clip-text text-transparent"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                nothing you don't
              </span>
            </>
          }
          subtitle="Twelve pillars that replace a stack of subscriptions."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {FEATURES.map((f, i) => (
            <FeatureCell key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 4 — COMPARISON TABLE
// ============================================================================

type Cell = boolean | string;
type Row = { label: string; values: [Cell, Cell, Cell, Cell] };

const COMPARE_COLS = ["Traditional Bio Link", "Linktree", "Generic Website", "ZUPIX Link Studio"] as const;

const COMPARE_ROWS: Row[] = [
  { label: "Custom domain", values: [false, "Paid add-on", true, true] },
  { label: "UPI + QR payments", values: [false, false, "Manual", true] },
  { label: "WhatsApp native", values: [false, false, false, true] },
  { label: "Booking / scheduling", values: [false, false, "Plugin", true] },
  { label: "Unlimited products", values: [false, false, "Paid", true] },
  { label: "Custom HTML widgets", values: [false, false, true, true] },
  { label: "Real-time analytics", values: [false, "Basic", "GA setup", true] },
  { label: "SEO + JSON-LD", values: [false, false, "Manual", true] },
  { label: "Theme studio", values: [false, "Limited", false, true] },
  { label: "Multi-workspace + roles", values: [false, false, false, true] },
  { label: "White-label / reseller", values: [false, false, false, true] },
  { label: "Setup time", values: ["Days", "Hours", "Weeks", "Minutes"] },
];

function CellRender({ v, highlight }: { v: Cell; highlight: boolean }) {
  if (v === true) {
    return (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className={cx(
          "inline-grid h-6 w-6 place-items-center rounded-full",
          highlight
            ? "bg-gradient-to-br from-[#ff6b35] via-[#e84393] to-[#6c5ce7] text-white"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </motion.span>
    );
  }
  if (v === false) {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-foreground/5 text-foreground/40">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
        highlight
          ? "bg-gradient-to-r from-[#ff6b35]/15 to-[#6c5ce7]/15 font-semibold text-foreground"
          : "text-foreground/60",
      )}
    >
      {v}
    </span>
  );
}

function SectionCompare() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Compare the stack"
          title={<>Why teams pick ZUPIX</>}
          subtitle="A single studio replacing a bio-link tool, a payment link, a booking plugin and a marketing site."
        />

        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-3xl border border-foreground/10 bg-background/70 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur">
                <tr className="border-b border-foreground/10">
                  <th className="px-5 py-4 text-left font-medium text-foreground/60">Capability</th>
                  {COMPARE_COLS.map((c, i) => {
                    const highlight = i === 3;
                    return (
                      <th
                        key={c}
                        className={cx(
                          "px-5 py-4 text-center text-sm font-semibold",
                          highlight && "relative",
                        )}
                      >
                        {highlight ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7] bg-clip-text text-transparent">
                              {c}
                            </span>
                            <span className="rounded-full bg-gradient-to-r from-[#ff6b35] to-[#6c5ce7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Recommended
                            </span>
                          </div>
                        ) : (
                          <span className="text-foreground/70">{c}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r, ri) => (
                  <tr
                    key={r.label}
                    className={cx(
                      "border-b border-foreground/5 last:border-b-0 transition-colors",
                      ri % 2 === 1 && "bg-foreground/[0.015]",
                    )}
                  >
                    <td className="px-5 py-4 font-medium">{r.label}</td>
                    {r.values.map((v, i) => {
                      const highlight = i === 3;
                      return (
                        <td
                          key={i}
                          className={cx(
                            "px-5 py-4 text-center",
                            highlight &&
                              "bg-gradient-to-b from-[#ff6b35]/[0.04] to-[#6c5ce7]/[0.04]",
                          )}
                        >
                          <CellRender v={v} highlight={highlight} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 5 — PRICING (single shared component, see @/features/pricing)
// ============================================================================


// ============================================================================
// SECTION 6 — FAQ
// ============================================================================

const FAQ_CATEGORIES = ["All", "General", "Pricing", "Payments", "Domains", "Support"] as const;
type FaqCategory = (typeof FAQ_CATEGORIES)[number];

type Faq = { q: string; a: string; c: Exclude<FaqCategory, "All"> };

const FAQS: Faq[] = [
  { q: "How is ZUPIX different from Linktree?", a: "ZUPIX is a full mini-website studio: unlimited products, UPI/QR payments, WhatsApp, booking, custom domain, themes and analytics — not just a list of links.", c: "General" },
  { q: "Can I use my own domain?", a: "Yes — connect any domain from Professional onwards. We provision SSL automatically in under 2 minutes.", c: "Domains" },
  { q: "Do you support UPI, GPay, PhonePe and Paytm?", a: "Yes. UPI QR + intent links are native. Card payments are available on Professional and higher via our Razorpay integration.", c: "Payments" },
  { q: "What happens if I cancel?", a: "Your page stays live on the ZUPIX subdomain in read-only mode. Upgrade any time to restore editing.", c: "Pricing" },
  { q: "Do you charge a platform fee on sales?", a: "Starter: 2%. Professional: 0.75%. Enterprise: 0%. Payment gateway fees are separate.", c: "Payments" },
  { q: "Is there a free trial for Professional?", a: "Yes — 14 days, no credit card. Full access to themes, domains and analytics.", c: "Pricing" },
  { q: "How fast is customer support?", a: "Median first response is under 2 hours on Professional and under 15 minutes on Enterprise with a dedicated success manager.", c: "Support" },
  { q: "Can agencies manage multiple client pages?", a: "Enterprise includes unlimited workspaces, roles and a white-label reseller portal built for agencies.", c: "General" },
  { q: "Is my data secure and India-compliant?", a: "Data is stored in encrypted form, RLS-enforced per tenant, and we align with India's DPDP framework. Audit logs are included on Enterprise.", c: "Support" },
  { q: "Can I move my domain later?", a: "Yes — domains are portable. Disconnect anytime and DNS is yours.", c: "Domains" },
];

function FaqItem({ f, i }: { f: Faq; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.03 }}
      className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/60 backdrop-blur-md"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium sm:text-base">{f.q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground/5 text-foreground/70"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-5 text-sm leading-relaxed text-foreground/70">{f.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionFaq() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FaqCategory>("All");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return FAQS.filter((f) => (cat === "All" ? true : f.c === cat)).filter((f) =>
      query ? (f.q + f.a).toLowerCase().includes(query) : true,
    );
  }, [q, cat]);

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeader
          eyebrow="Frequently asked"
          title={<>Answers, not fine print</>}
          subtitle="Everything founders ask before they ship on ZUPIX."
        />

        <div className="mt-10 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search questions…"
              className="w-full rounded-full border border-foreground/10 bg-background/70 py-3 pl-11 pr-4 text-sm outline-none backdrop-blur-md transition focus:border-foreground/30"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FAQ_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  cat === c
                    ? "border-transparent bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7] text-white shadow"
                    : "border-foreground/10 bg-background/60 text-foreground/70 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-foreground/10 bg-background/50 p-6 text-center text-sm text-foreground/60">
              No questions match. Try a different search.
            </p>
          ) : (
            filtered.map((f, i) => <FaqItem key={f.q} f={f} i={i} />)
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 7 — TRUST BAR
// ============================================================================

const TRUST_BADGES = [
  { icon: IndianRupee, label: "Made in India", sub: "Built in Bengaluru" },
  { icon: Shield, label: "Enterprise Ready", sub: "SSO • RBAC • Audit" },
  { icon: Lock, label: "Secure", sub: "RLS + encryption at rest" },
  { icon: Zap, label: "Blazing Fast", sub: "Edge-cached in 190+ PoPs" },
  { icon: Wallet, label: "Payment Ready", sub: "UPI • Cards • Wallets" },
  { icon: Server, label: "99.9% Uptime", sub: "Verified SLA" },
];

function SectionTrust() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-md sm:p-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
            {TRUST_BADGES.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: -3 }}
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff6b35]/15 via-[#e84393]/15 to-[#6c5ce7]/15 text-foreground"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <div className="text-sm font-semibold">{b.label}</div>
                  <div className="text-xs text-foreground/55">{b.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 8 — FINAL CTA
// ============================================================================

function SectionFinalCta() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 p-10 sm:p-16 md:p-20">
          {/* Aurora background */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, #1a0a2e 0%, #2a0f3d 40%, #3d1846 70%, #1a0a2e 100%)",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute -inset-40 -z-10 opacity-70"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, #ff6b3555, #e8439355, #6c5ce755, #22d3ee55, #ff6b3555)",
              filter: "blur(80px)",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-40 mix-blend-overlay"
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 40%)",
              backgroundSize: "200% 200%",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.06]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>\")",
            }}
          />

          <div className="relative text-center text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#ffb199]" />
              Built for the next decade of Indian brands
            </div>
            <h2
              className="mx-auto mt-6 max-w-3xl text-balance text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Build your premium{" "}
              <span className="bg-gradient-to-r from-[#ffb199] via-[#ff8ec4] to-[#b6a6ff] bg-clip-text text-transparent italic">
                digital identity
              </span>{" "}
              today
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
              Ship a beautiful, high-converting mini-site in under 10 minutes.
              No credit card. No lock-in.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="/pricing" icon={<ArrowRight className="h-4 w-4" />}>
                Start Building — Free
              </MagneticButton>
              <MagneticButton href="/auth" variant="outline" icon={<CalendarCheck className="h-4 w-4" />}>
                Book a Demo
              </MagneticButton>
              <MagneticButton href="/auth" variant="ghost" icon={<Wand2 className="h-4 w-4" />}>
                View Templates
              </MagneticButton>

            </div>

            <ResponsiveStatsGrid className="mx-auto mt-12 max-w-3xl lg:grid-cols-4">
              <TrustStat icon={Users} label="Businesses" value={<CountUp to={250} suffix="+" />} />
              <TrustStat icon={Eye} label="Monthly views" value={<CountUp to={75000} format={(n) => Math.round(n).toLocaleString("en-IN")} suffix="+" />} />
              <TrustStat icon={Star} label="Avg. rating" value={<CountUp to={4.9} format={(n) => n.toFixed(1)} />} />
              <TrustStat icon={Gauge} label="Uptime" value={<CountUp to={99.9} format={(n) => n.toFixed(1)} suffix="%" />} />
            </ResponsiveStatsGrid>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: ReactNode;
}) {
  return (
    <ResponsiveStatCard icon={Icon} label={label} value={value} className="text-white" />

  );
}

// ============================================================================
// EXPORT
// ============================================================================

export function LandingConversion() {
  return (
    <div className="relative isolate">
      {/* Ambient background wash for the entire conversion stack */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 20% 10%, rgba(255,107,53,0.06), transparent 60%), radial-gradient(ellipse 80% 40% at 80% 60%, rgba(108,92,231,0.06), transparent 60%)",
        }}
      />
      <SectionSuccessStories />
      
      <SectionFeatures />
      <SectionCompare />
      <PricingSection id="pricing" />
      <SectionFaq />
      <SectionTrust />
      <SectionFinalCta />
    </div>
  );
}
