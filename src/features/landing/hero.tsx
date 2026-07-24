/**
 * ZUPIX Link Studio — Premium landing hero.
 * Sunset Blaze bento on near-black with aurora mesh, animated iPhone 16 Pro
 * mockup cycling live Indian-business bio-page demos, floating activity
 * cards, animated counter stats, magnetic CTAs, trust chips.
 * Everything GPU-accelerated (transform/opacity/filter) — no layout shift.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Eye,
  Gem,
  Globe2,
  GraduationCap,
  HardHat,
  Hospital,
  IndianRupee,
  MessageCircle,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Utensils,
} from "lucide-react";

/* ────────────────────────────────────────────────────────── demo content */

type Demo = {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  gradient: string;
  accent: string;
  icon: typeof Gem;
  chips: string[];
  actions: { label: string; sub: string }[];
  featured: { title: string; meta: string };
};

const DEMOS: Demo[] = [
  {
    id: "jewellery",
    name: "Kalyan Heritage",
    handle: "@kalyanheritage",
    tagline: "Handcrafted 22K jewellery · Mumbai",
    gradient: "linear-gradient(160deg,#ff6b35 0%,#e84393 55%,#0b0b12 100%)",
    accent: "#ff6b35",
    icon: Gem,
    chips: ["Bridal", "22K Gold", "Certified"],
    actions: [
      { label: "Book a private viewing", sub: "Bandra flagship" },
      { label: "Shop bridal collection", sub: "New this week" },
    ],
    featured: { title: "Diwali Edit ’26", meta: "Live drop · ₹48,900 onwards" },
  },
  {
    id: "restaurant",
    name: "Bombay Canteen",
    handle: "@bombaycanteen",
    tagline: "Modern Indian · Kala Ghoda",
    gradient: "linear-gradient(160deg,#e84393 0%,#6c5ce7 60%,#0b0b12 100%)",
    accent: "#e84393",
    icon: Utensils,
    chips: ["Zomato Gold", "Chef’s table", "Vegan"],
    actions: [
      { label: "Reserve a table", sub: "Tonight · 8:30 PM" },
      { label: "Order on Swiggy", sub: "Free delivery" },
    ],
    featured: { title: "Monsoon tasting menu", meta: "7 courses · ₹2,400 pp" },
  },
  {
    id: "doctor",
    name: "Dr. Ananya Rao",
    handle: "@dranyarao",
    tagline: "Dermatologist · MBBS, MD",
    gradient: "linear-gradient(160deg,#6c5ce7 0%,#4f46e5 60%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: Stethoscope,
    chips: ["15+ yrs", "Fortis", "Verified"],
    actions: [
      { label: "Book consultation", sub: "Video · ₹1,200" },
      { label: "Skincare protocols", sub: "Guided plans" },
    ],
    featured: { title: "Slot open · Sat 11:00", meta: "Bandra clinic · in-person" },
  },
  {
    id: "school",
    name: "Sunrise Academy",
    handle: "@sunriseacademy",
    tagline: "CBSE · Pre-K to Grade 12",
    gradient: "linear-gradient(160deg,#ff6b35 0%,#f59e0b 55%,#0b0b12 100%)",
    accent: "#f59e0b",
    icon: GraduationCap,
    chips: ["Admissions ’26", "Scholarships", "STEM"],
    actions: [
      { label: "Apply for admission", sub: "Grade 1 – 8" },
      { label: "Virtual campus tour", sub: "10 min walk-through" },
    ],
    featured: { title: "Open house — Sunday", meta: "Pune campus · 10 AM" },
  },
  {
    id: "realestate",
    name: "Lodha Skyline",
    handle: "@lodhaskyline",
    tagline: "Sea-view residences · Worli",
    gradient: "linear-gradient(160deg,#0ea5e9 0%,#6c5ce7 55%,#0b0b12 100%)",
    accent: "#38bdf8",
    icon: Hospital,
    chips: ["3 / 4 BHK", "Ready to move", "RERA"],
    actions: [
      { label: "Download brochure", sub: "PDF · 24 MB" },
      { label: "Book site visit", sub: "Chauffeur pickup" },
    ],
    featured: { title: "₹6.8 Cr onwards", meta: "42nd floor sea-face" },
  },
  {
    id: "cafe",
    name: "Blue Tokai",
    handle: "@bluetokaicafe",
    tagline: "Single-origin coffee · Roasted daily",
    gradient: "linear-gradient(160deg,#f59e0b 0%,#ff6b35 55%,#0b0b12 100%)",
    accent: "#f59e0b",
    icon: Sparkles,
    chips: ["Roastery", "Filter", "Beans"],
    actions: [
      { label: "Order beans (250g)", sub: "Ships pan-India" },
      { label: "Find a café near you", sub: "38 locations" },
    ],
    featured: { title: "Ethiopia Guji · Natural", meta: "Notes: peach, jasmine, cocoa" },
  },
  {
    id: "agency",
    name: "Studio North",
    handle: "@studionorth",
    tagline: "Brand & digital · Bengaluru",
    gradient: "linear-gradient(160deg,#6c5ce7 0%,#e84393 60%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: Palette,
    chips: ["Awwwards", "Framer", "Since 2018"],
    actions: [
      { label: "Start a project", sub: "Reply within 24h" },
      { label: "See recent work", sub: "12 case studies" },
    ],
    featured: { title: "Currently booking Q1 ’27", meta: "2 slots remaining" },
  },
  {
    id: "law",
    name: "Mehta & Associates",
    handle: "@mehtalaw",
    tagline: "Corporate & tax law · Delhi",
    gradient: "linear-gradient(160deg,#1e3a5f 0%,#6c5ce7 55%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: ShieldCheck,
    chips: ["Chambers", "M&A", "GST"],
    actions: [
      { label: "Request a consult", sub: "Confidential intake" },
      { label: "Latest advisories", sub: "Compliance briefs" },
    ],
    featured: { title: "Union Budget ’26 note", meta: "Impact on start-ups · PDF" },
  },
  {
    id: "creator",
    name: "Priya Kapoor",
    handle: "@priyakapoor",
    tagline: "Design creator · 842K community",
    gradient: "linear-gradient(160deg,#e84393 0%,#ff6b35 55%,#0b0b12 100%)",
    accent: "#e84393",
    icon: Star,
    chips: ["YouTube", "Substack", "Store"],
    actions: [
      { label: "Join the newsletter", sub: "Weekly · 92K readers" },
      { label: "Design system pack", sub: "₹1,999 · lifetime" },
    ],
    featured: { title: "New drop · Bento kit v3", meta: "780 sold this week" },
  },
  {
    id: "construction",
    name: "Shapoorji Build",
    handle: "@shapoorjibuild",
    tagline: "Turnkey construction · Since 1865",
    gradient: "linear-gradient(160deg,#ea580c 0%,#4a5568 55%,#0b0b12 100%)",
    accent: "#f59e0b",
    icon: HardHat,
    chips: ["ISO 9001", "Green build", "Pan-India"],
    actions: [
      { label: "Request a proposal", sub: "Commercial fit-out" },
      { label: "Ongoing projects", sub: "17 across India" },
    ],
    featured: { title: "Case study — Godrej HQ", meta: "42 mo · LEED Platinum" },
  },
];

/* ────────────────────────────────────────────────────────── animated counter */

function useCountUp(target: number, duration = 1600, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function formatCount(n: number, suffix?: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix ?? ""}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K${suffix ?? ""}`;
  return `${n}${suffix ?? ""}`;
}

function Stat({ label, target, suffix }: { label: string; target: number; suffix?: string }) {
  const v = useCountUp(target);
  return (
    <div className="flex flex-col">
      <span className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
        {formatCount(v, suffix)}
      </span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── magnetic button */

function useMagnet<T extends HTMLElement>(strength = 14) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate3d(${dx * strength}px,${dy * strength}px,0)`;
    };
    const ml = () => {
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("mousemove", mm);
    el.addEventListener("mouseleave", ml);
    return () => {
      el.removeEventListener("mousemove", mm);
      el.removeEventListener("mouseleave", ml);
    };
  }, [strength]);
  return ref;
}

/* ────────────────────────────────────────────────────────── phone mock */

function PhoneMock({ demo }: { demo: Demo }) {
  const Icon = demo.icon;
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: demo.gradient }}>
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.7) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="relative flex h-full flex-col px-5 pb-6 pt-14 text-white">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between text-[10px] font-medium text-white/70">
          <span>zupix.link{demo.handle}</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-[3px] backdrop-blur">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        </div>

        {/* Avatar */}
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,.35)] backdrop-blur">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold leading-tight">{demo.name}</div>
            <div className="truncate text-[11px] text-white/70">{demo.tagline}</div>
          </div>
        </div>

        {/* Chips */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {demo.chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-white/25 bg-white/10 px-2 py-[3px] text-[10px] font-medium backdrop-blur"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Featured */}
        <div className="mb-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
          <div className="text-[12px] font-semibold">{demo.featured.title}</div>
          <div className="mt-0.5 text-[10.5px] text-white/70">{demo.featured.meta}</div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {demo.actions.map((a) => (
            <div
              key={a.label}
              className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/12 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.25)] backdrop-blur"
            >
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold">{a.label}</div>
                <div className="truncate text-[10px] text-white/70">{a.sub}</div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/80" />
            </div>
          ))}
        </div>

        {/* Pay */}
        <div className="mt-auto flex items-center justify-between rounded-2xl bg-black/40 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <IndianRupee className="h-3.5 w-3.5" /> UPI · Cards · Wallets
          </div>
          <div className="text-[10px] text-white/60">Instant payout</div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── floating card */

function FloatCard({
  icon: Icon,
  title,
  sub,
  tone,
  className,
  delay,
}: {
  icon: typeof BadgeCheck;
  title: string;
  sub: string;
  tone: string;
  className?: string;
  delay: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-30 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl ${className ?? ""}`}
      style={{
        animation: `zx-bob 6s ease-in-out ${delay}s infinite, zx-fade-in .8s ease-out ${delay}s both`,
        willChange: "transform, opacity",
      }}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
        style={{ background: `${tone}22`, color: tone, boxShadow: `inset 0 0 0 1px ${tone}55` }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-white">{title}</span>
        <span className="block truncate text-[10.5px] text-white/55">{sub}</span>
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── hero */

export function LandingHero() {
  // rotate demos every 4s
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % DEMOS.length), 4000);
    return () => window.clearInterval(t);
  }, []);
  const demo = DEMOS[idx];

  // reveal headline once
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const primaryRef = useMagnet<HTMLAnchorElement>(10);
  const secondaryRef = useMagnet<HTMLAnchorElement>(6);

  // parallax on scroll
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const p = Math.min(1, scrollY / 600);
  const heroStyle: CSSProperties = {
    transform: `scale(${1 - p * 0.04})`,
    filter: `saturate(${1 - p * 0.15})`,
    transformOrigin: "center top",
    willChange: "transform, filter",
  };
  const phoneWrapStyle: CSSProperties = {
    transform: `perspective(1200px) rotateY(${-6 + p * 8}deg) rotateX(${p * 3}deg) translateY(${p * -8}px)`,
    transition: "transform .25s ease-out",
    willChange: "transform",
  };

  const headline = ["Build", "Beautiful", "Bio", "Links", "That", "Actually", "Convert."];

  return (
    <section className="relative isolate min-h-dvh w-full overflow-hidden bg-[#0b0b12] text-white">
      {/* Local keyframes / utilities used by this hero only */}
      <style>{`
        @keyframes zx-aurora-a { 0%,100% { transform: translate3d(-6%,-4%,0) scale(1); }
          50% { transform: translate3d(8%,6%,0) scale(1.15); } }
        @keyframes zx-aurora-b { 0%,100% { transform: translate3d(6%,4%,0) scale(1.1); }
          50% { transform: translate3d(-8%,-6%,0) scale(1); } }
        @keyframes zx-aurora-c { 0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-4%,8%,0) scale(1.2); } }
        @keyframes zx-drift { 0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(0,-120px,0); } }
        @keyframes zx-bob { 0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-8px,0); } }
        @keyframes zx-fade-in { from { opacity: 0; transform: translate3d(0,10px,0); } to { opacity: 1; } }
        @keyframes zx-word { from { opacity: 0; transform: translate3d(0,24px,0); filter: blur(10px); }
          to { opacity: 1; transform: translate3d(0,0,0); filter: blur(0); } }
        @keyframes zx-shine { 0% { transform: translateX(-120%) skewX(-18deg); }
          60%,100% { transform: translateX(220%) skewX(-18deg); } }
        @keyframes zx-glow { 0%,100% { box-shadow: 0 20px 60px -18px rgba(255,107,53,.55),
          inset 0 1px 0 rgba(255,255,255,.35); }
          50% { box-shadow: 0 24px 70px -14px rgba(232,67,147,.65),
          inset 0 1px 0 rgba(255,255,255,.35); } }
        @keyframes zx-screen-in { from { opacity: 0; transform: scale(1.04); filter: blur(14px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); } }
        .zx-word { display: inline-block; opacity: 0; }
        .zx-word.on { animation: zx-word .8s cubic-bezier(.2,.8,.2,1) forwards; }
        .zx-cta-primary { animation: zx-glow 4s ease-in-out infinite; }
      `}</style>

      {/* AURORA MESH BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -left-[15%] -top-[20%] h-[70vw] w-[70vw] rounded-full opacity-60"
          style={{
            background: "radial-gradient(closest-side,#ff6b35, transparent 70%)",
            filter: "blur(120px)",
            animation: "zx-aurora-a 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-[15%] top-[10%] h-[65vw] w-[65vw] rounded-full opacity-55"
          style={{
            background: "radial-gradient(closest-side,#e84393, transparent 70%)",
            filter: "blur(130px)",
            animation: "zx-aurora-b 26s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-25%] left-[20%] h-[70vw] w-[70vw] rounded-full opacity-55"
          style={{
            background: "radial-gradient(closest-side,#6c5ce7, transparent 70%)",
            filter: "blur(140px)",
            animation: "zx-aurora-c 30s ease-in-out infinite",
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at 50% 40%, black 40%, transparent 75%)",
          }}
        />
        {/* Noise */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => {
            const left = (i * 37) % 100;
            const size = 1 + ((i * 13) % 3);
            const dur = 14 + ((i * 7) % 16);
            const delay = (i % 10) * -1.7;
            return (
              <span
                key={i}
                className="absolute bottom-[-40px] rounded-full bg-white/60"
                style={{
                  left: `${left}%`,
                  width: size,
                  height: size,
                  opacity: 0.35,
                  filter: "blur(.5px)",
                  animation: `zx-drift ${dur}s linear ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
        {/* Bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#0b0b12] to-transparent" />
      </div>

      {/* HERO */}
      <div
        className="relative mx-auto flex min-h-dvh max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:py-24"
        style={heroStyle}
      >
        {/* Top badge row */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b35] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6b35]" />
            </span>
            <span className="uppercase tracking-[0.18em]">v1.0 · Now live in India</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/60 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[#ff6b35]" /> Enterprise CMS · Payments · Domains
          </span>
        </div>

        {/* Bento */}
        <div className="grid gap-4 md:grid-cols-12 md:auto-rows-[130px]">
          {/* Headline cell */}
          <div className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md md:col-span-8 md:row-span-4 md:p-12">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40"
              style={{
                background: "radial-gradient(closest-side,#ff6b35,transparent 70%)",
                filter: "blur(60px)",
              }}
            />
            <h1
              className="relative text-[44px] font-medium leading-[1.02] tracking-tight text-white sm:text-[62px] lg:text-[76px]"
              style={{ fontFamily: "'Instrument Serif', ui-serif, Georgia, serif" }}
            >
              {headline.map((w, i) => {
                const isEm = w === "Beautiful" || w === "Convert.";
                return (
                  <span
                    key={`${w}-${i}`}
                    className={`zx-word ${revealed ? "on" : ""} mr-[0.25em]`}
                    style={{ animationDelay: `${120 + i * 90}ms` }}
                  >
                    {isEm ? (
                      <span
                        className="italic"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg,#ff6b35 0%,#e84393 55%,#6c5ce7 100%)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        {w}
                      </span>
                    ) : (
                      w
                    )}
                  </span>
                );
              })}
            </h1>
            <p
              className="relative mt-6 max-w-xl text-[15px] leading-relaxed text-white/60 sm:text-base"
              style={{ fontFamily: "'Work Sans', ui-sans-serif, system-ui, sans-serif" }}
            >
              Premium bio links, mini-websites, payments, products, custom domains, a visual
              builder and verified profiles — one studio to run your entire digital presence.
            </p>

            {/* CTAs */}
            <div className="relative mt-8 flex flex-wrap items-center gap-3">
              <Link
                ref={primaryRef}
                to="/auth"
                search={{ mode: "signup" }}
                className="zx-cta-primary group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3.5 text-sm font-semibold text-[#0b0b12] transition-transform duration-200"
                style={{
                  background: "linear-gradient(135deg,#ffb37a 0%,#ff6b35 45%,#e84393 100%)",
                }}
              >
                <span className="relative z-10">Start Building</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-70"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.6) 50%, transparent 100%)",
                    animation: "zx-shine 3.6s ease-in-out infinite",
                  }}
                />
              </Link>
              <Link
                ref={secondaryRef}
                to="/auth"
                className="group relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                  <Play className="h-3 w-3 fill-white text-white" />
                </span>
                View Live Demo
              </Link>
            </div>

            {/* Trust chips */}
            <div
              className="relative mt-8 flex flex-wrap gap-2 text-[11px] text-white/60"
              style={{ fontFamily: "'Work Sans', system-ui, sans-serif" }}
            >
              {[
                { icon: BadgeCheck, label: "Made in India" },
                { icon: IndianRupee, label: "UPI Payments Ready" },
                { icon: Palette, label: "20 Premium Themes" },
                { icon: Globe2, label: "Custom Domains" },
                { icon: ShieldCheck, label: "Enterprise CMS" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur"
                >
                  <Icon className="h-3.5 w-3.5 text-[#ff6b35]" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Phone cell */}
          <div className="relative rounded-[36px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-6 backdrop-blur-md md:col-span-4 md:row-span-6">
            {/* Inner clipped surface holds the phone + glow so floating cards can extend beyond */}
            <div className="relative h-full overflow-hidden rounded-[30px]">
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(120% 60% at 50% 0%, rgba(255,107,53,.25), transparent 60%)",
                }}
              />
              <div className="relative mx-auto flex h-full items-center justify-center">
                <div
                  className="relative h-[560px] w-[270px] rounded-[52px] border-[10px] border-[#1a1a22] bg-black shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  style={phoneWrapStyle}
                >
                  {/* side buttons */}
                  <span className="absolute -left-[13px] top-24 h-8 w-[3px] rounded-l bg-[#2a2a34]" />
                  <span className="absolute -left-[13px] top-36 h-12 w-[3px] rounded-l bg-[#2a2a34]" />
                  <span className="absolute -left-[13px] top-52 h-12 w-[3px] rounded-l bg-[#2a2a34]" />
                  <span className="absolute -right-[13px] top-32 h-16 w-[3px] rounded-r bg-[#2a2a34]" />
                  {/* dynamic island */}
                  <span className="absolute left-1/2 top-2.5 z-30 h-7 w-24 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
                  {/* screen */}
                  <div className="absolute inset-0 overflow-hidden rounded-[42px]">
                    <div
                      key={demo.id}
                      className="absolute inset-0"
                      style={{ animation: "zx-screen-in .7s cubic-bezier(.2,.8,.2,1) both" }}
                    >
                      <PhoneMock demo={demo} />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Floating cards around phone */}
            <FloatCard
              icon={BadgeCheck}
              title="Verified badge"
              sub="Business profile · approved"
              tone="#22c55e"
              className="left-2 top-10 md:-left-8"
              delay={0.2}
            />
            <FloatCard
              icon={IndianRupee}
              title="UPI ₹4,800 received"
              sub={`from ${demo.handle}`}
              tone="#ff6b35"
              className="right-2 top-24 md:-right-10"
              delay={0.5}
            />
            <FloatCard
              icon={MessageCircle}
              title="New WhatsApp order"
              sub="Kalyan Heritage · 2 items"
              tone="#22d3ee"
              className="right-3 bottom-40 md:-right-14"
              delay={0.9}
            />
            <FloatCard
              icon={Eye}
              title="+128 profile views"
              sub="last 5 minutes"
              tone="#a78bfa"
              className="left-3 bottom-28 md:-left-14"
              delay={1.2}
            />
            <FloatCard
              icon={Globe2}
              title="Custom domain live"
              sub="kalyan.link · DNS verified"
              tone="#38bdf8"
              className="left-6 bottom-4 md:-left-6"
              delay={1.5}
            />
            <FloatCard
              icon={BellRing}
              title="Theme applied"
              sub="Sunset Blaze · saved"
              tone="#e84393"
              className="right-6 bottom-6 md:-right-4"
              delay={1.8}
            />
          </div>

          {/* Stats */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md md:col-span-8 md:row-span-2">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat label="Profiles created" target={54200} suffix="+" />
              <Stat label="Premium themes" target={20} />
              <Stat label="Monthly page views" target={2400000} suffix="+" />
              <Stat label="Indian businesses" target={8900} suffix="+" />
            </div>
            {/* Demo indicator strip */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                Now showing
              </span>
              <span className="text-[12px] font-medium text-white/80">{demo.name}</span>
              <span className="text-[11px] text-white/40">· {demo.tagline}</span>
              <div className="ml-auto flex items-center gap-1.5">
                {DEMOS.map((d, i) => (
                  <span
                    key={d.id}
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === idx ? 22 : 6,
                      background: i === idx ? demo.accent : "rgba(255,255,255,0.18)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
