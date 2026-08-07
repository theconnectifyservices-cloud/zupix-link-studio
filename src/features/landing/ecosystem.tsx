/**
 * Landing Ecosystem — Enterprise platform surface below the Experience section.
 *
 * 1. ZUPIX Ecosystem (12 premium glass cards)
 * 2. Learning Center (horizontal carousel of guides)
 * 3. Why Businesses Choose ZUPIX (bento with animated icons)
 * 4. Live Support Experience
 * 5. Roadmap (scroll-animated timeline)
 * 6. Newsletter (glass subscription block)
 * 7. Trust Footer (full site footer)
 *
 * Motion is framer-motion springs, GPU transforms. All content is real ZUPIX
 * branding + realistic Indian business references — no placeholder copy.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BUILTIN_TEMPLATES } from "@/features/templates/catalog";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  Facebook,
  FileText,
  Globe2,
  GraduationCap,
  Handshake,
  HeadphonesIcon,
  Heart,
  IndianRupee,
  Instagram,
  LayoutTemplate,
  
  Lightbulb,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Palette,
  PlayCircle,
  Radio,
  Rocket,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Twitter,
  Users,
  Video,
  Youtube,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                  */
/* ------------------------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-4 text-pretty text-base text-white/60 sm:text-lg"
      >
        {description}
      </motion.p>
    </div>
  );
}

/**
 * Magnetic + glow button. Ripple on click, subtle gradient border, shine sweep
 * on hover. Renders as <button>; wrap in an anchor for navigation.
 */
function MotionButton({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now();
      setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
    }
    onClick?.();
  };

  const base =
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-medium transition-transform duration-200 will-change-transform active:scale-[0.97]";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-[0_10px_40px_-10px_rgba(251,146,60,0.55)] hover:shadow-[0_18px_60px_-12px_rgba(251,146,60,0.7)]"
      : "border border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10";

  return (
    <button ref={ref} type={type} onClick={handleClick} className={`${base} ${styles} ${className}`}>
      {/* shine sweep */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-[ripple_700ms_ease-out] rounded-full bg-white/60"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 1. ZUPIX Ecosystem                                                  */
/* ------------------------------------------------------------------ */

const TEMPLATE_COUNT = BUILTIN_TEMPLATES.length;

const ECOSYSTEM_CARDS = [
  {
    title: "Template Marketplace",
    desc: `${TEMPLATE_COUNT}+ premium templates crafted for Indian creators & businesses.`,
    icon: LayoutTemplate,
    grad: "from-fuchsia-500 to-purple-600",
    tag: `${TEMPLATE_COUNT}+ templates`,
  },
  {
    title: "Theme Store",
    desc: "Designer themes — from Kolkata heritage to Bengaluru minimal.",
    icon: Palette,
    grad: "from-rose-500 to-orange-500",
    tag: "New drops weekly",
  },
  {
    title: "Help Center",
    desc: "Search hundreds of articles with instant AI-assisted answers.",
    icon: HeadphonesIcon,
    grad: "from-sky-500 to-blue-600",
    tag: "24×7 self-serve",
  },
  {
    title: "Knowledge Base",
    desc: "Guides, playbooks and best practices for every ZUPIX feature.",
    icon: BookOpen,
    grad: "from-emerald-500 to-teal-600",
    tag: "500+ articles",
  },
  {
    title: "Documentation",
    desc: "Developer-grade docs for API, Webhooks, SSO and Automations.",
    icon: FileText,
    grad: "from-indigo-500 to-violet-600",
    tag: "v1.0 stable",
  },
  {
    title: "Blog",
    desc: "Growth, design and monetization stories from Indian founders.",
    icon: Newspaper,
    grad: "from-amber-500 to-orange-600",
    tag: "Weekly stories",
  },
  {
    title: "Case Studies",
    desc: "How Chennai Silks, Bombay Canteen & FabIndia grew with ZUPIX.",
    icon: Star,
    grad: "from-yellow-400 to-amber-600",
    tag: "40+ stories",
  },
  {
    title: "Release Notes",
    desc: "Every ship, every improvement — transparent and versioned.",
    icon: Radio,
    grad: "from-pink-500 to-rose-600",
    tag: "Shipped v1.0",
  },
  {
    title: "Roadmap",
    desc: "See what's next. Vote features. Shape the platform with us.",
    icon: Compass,
    grad: "from-cyan-500 to-sky-600",
    tag: "Public roadmap",
  },
  {
    title: "Community",
    desc: "1,500+ creators on WhatsApp, Discord and monthly meetups.",
    icon: Users,
    grad: "from-lime-500 to-emerald-600",
    tag: "1.5k+ members",
  },
  {
    title: "Partner Program",
    desc: "Agencies, resellers and studios — earn up to 40% recurring.",
    icon: Handshake,
    grad: "from-violet-500 to-fuchsia-600",
    tag: "Up to 40%",
  },
  {
    title: "Developer Center",
    desc: "Public API, CLI and SDKs for React, Node and Flutter — soon.",
    icon: Code2,
    grad: "from-slate-500 to-zinc-700",
    tag: "Coming soon",
  },
];

function EcosystemGrid() {
  return (
    <section className="relative py-24">
      <SectionHeader
        eyebrow="ZUPIX Ecosystem"
        title={
          <>
            A complete platform,{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              not just a product
            </span>
          </>
        }
        description="Twelve first-party surfaces that make ZUPIX a full ecosystem — from marketplace and docs to community and partners."
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ECOSYSTEM_CARDS.map((c, i) => (
          <motion.button
            key={c.title}
            type="button"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
            whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
            style={{ transformStyle: "preserve-3d" }}
            className="group relative flex h-auto min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_20px_60px_-20px_rgba(251,146,60,0.35)]"
          >
            {/* Glow border on hover */}
            <span
              aria-hidden
              className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${c.grad} opacity-0 blur transition-opacity duration-500 group-hover:opacity-40`}
            />
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent" />

            <div className="relative flex min-w-0 flex-1 flex-col">
              <div
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.grad} text-white shadow-lg`}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-balance break-words text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-1.5 break-words text-sm leading-relaxed text-white/60">{c.desc}</p>
              <div className="mt-4 flex flex-1 items-end justify-between gap-3">
                <span className="min-w-0 break-words rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
                  {c.tag}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Learning Center                                                  */
/* ------------------------------------------------------------------ */

const LEARNING = [
  {
    title: "Create Your First Bio Link",
    minutes: 4,
    tag: "Getting Started",
    grad: "from-rose-500 via-orange-500 to-amber-400",
    icon: Rocket,
  },
  {
    title: "Build a Mini Website",
    minutes: 8,
    tag: "Builder",
    grad: "from-sky-500 via-cyan-500 to-teal-400",
    icon: LayoutTemplate,
  },
  {
    title: "Connect a Custom Domain",
    minutes: 6,
    tag: "Domains",
    grad: "from-indigo-500 via-violet-500 to-fuchsia-500",
    icon: Globe2,
  },
  {
    title: "Setup UPI & Razorpay Payments",
    minutes: 7,
    tag: "Payments",
    grad: "from-emerald-500 via-green-500 to-lime-400",
    icon: IndianRupee,
  },
  {
    title: "SEO Guide for Bio Pages",
    minutes: 10,
    tag: "Growth",
    grad: "from-amber-500 via-orange-500 to-rose-500",
    icon: Compass,
  },
  {
    title: "Media Library & Brand Kit",
    minutes: 5,
    tag: "Assets",
    grad: "from-purple-500 via-fuchsia-500 to-pink-500",
    icon: Boxes,
  },
  {
    title: "Commerce & Product Blocks",
    minutes: 9,
    tag: "Commerce",
    grad: "from-yellow-500 via-amber-500 to-orange-500",
    icon: Store,
  },
  {
    title: "AI Studio for Creators",
    minutes: 6,
    tag: "AI",
    grad: "from-cyan-500 via-blue-500 to-indigo-500",
    icon: BrainCircuit,
  },
  {
    title: "Analytics & Conversion Tracking",
    minutes: 8,
    tag: "Analytics",
    grad: "from-teal-500 via-emerald-500 to-green-500",
    icon: Lightbulb,
  },
];

function LearningCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70 backdrop-blur">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-300" />
              Learning Center
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Master ZUPIX in{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                minutes
              </span>
            </h2>
            <p className="mt-3 text-white/60">
              Concise, screen-recorded guides for every workflow — from your first bio link to
              enterprise domain setup.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition hover:bg-white/10"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur transition hover:bg-white/10"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {LEARNING.map((l, i) => (
            <motion.article
              key={l.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.04 }}
              whileHover={{ y: -6 }}
              className="group relative w-[min(320px,calc(100vw-4rem))] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl sm:w-[360px]"
            >
              <div
                className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${l.grad}`}
              >
                {/* Animated thumbnail — floating orbs */}
                <motion.div
                  aria-hidden
                  animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-2xl"
                />
                <motion.div
                  aria-hidden
                  animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-8 -left-6 h-36 w-36 rounded-full bg-black/20 blur-2xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur-xl ring-1 ring-white/30 transition-transform duration-500 group-hover:scale-110">
                    <l.icon className="h-8 w-8 text-white drop-shadow" />
                  </div>
                </div>
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                    {l.tag}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4">
                  <PlayCircle className="h-8 w-8 text-white/80 transition-transform group-hover:scale-110" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-balance break-words text-base font-semibold text-white">{l.title}</h3>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-white/60">
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {l.minutes} min read
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-white/80 transition-colors group-hover:text-amber-300">
                    Watch <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Why Businesses Choose ZUPIX (Bento)                              */
/* ------------------------------------------------------------------ */

const WHY_CARDS = [
  {
    title: "Blazing Fast",
    desc: "Edge-rendered pages. <1s LCP even on 3G India networks.",
    icon: Zap,
    grad: "from-amber-400 to-orange-500",
    span: "sm:col-span-2 lg:col-span-2",
  },
  {
    title: "Enterprise Secure",
    desc: "RLS, SOC2-aligned controls, audit trails and SSO ready.",
    icon: ShieldCheck,
    grad: "from-emerald-500 to-teal-600",
    span: "sm:col-span-1",
  },
  {
    title: "Admin Center",
    desc: "🚨 CRITICAL BACKEND FIX – ADMIN MODULES RETURNING HTTP 400\n\nThe Admin pages no longer show demo data, but now every Admin table is empty because the Supabase API requests are returning HTTP 400.\n\nConsole examples:\n\n- offset=0&limit=10 → 400\n\n- domains?select=* → 400\n\n- status=eq.success → 400\n\nThis indicates the Admin modules are querying the wrong schema, wrong table names, invalid columns, or malformed filters.\n\nPerform a complete Admin Backend Audit.\n\nRequirements:\n\n1. Inspect every Admin query.\n\nModules:\n\n- User Management\n\n- Subscription Manager\n\n- License Manager\n\n- Communications\n\n- Monitoring\n\n- Dashboard\n\n- Analytics\n\n2. Verify every query matches the CURRENT production Supabase schema.\n\n3. Replace any outdated table names.\n\n4. Replace invalid column names.\n\n5. Remove invalid filters.\n\n6. Verify joins and foreign keys.\n\n7. Check every pagination query.\n\n8. Ensure every REST request returns HTTP 200.\n\n9. Verify RLS policies allow Super Admin to read all required tables.\n\n10. If a table does not exist, gracefully show:\n\n\"No records found\"\n\ninstead of throwing 400 errors.\n\n11. Add proper error logging showing:\n\n- table name\n\n- query\n\n- Supabase error code\n\n- error message\n\n12. Remove every remaining broken endpoint.\n\n13. Test every Admin module against the production database.\n\nExpected result:\n\n- Zero HTTP 400 errors.\n\n- Zero failed Supabase requests.\n\n- Live production data visible in every Admin module.",
    icon: MapPin,
    grad: "from-rose-500 to-orange-500",
    span: "sm:col-span-1",
  },
  {
    title: "No-Code Builder",
    desc: "Drag, drop, publish. Zero code, unlimited possibilities.",
    icon: Sparkles,
    grad: "from-fuchsia-500 to-purple-600",
    span: "sm:col-span-1",
  },
  {
    title: "Mobile-First",
    desc: "80% of Indian traffic is mobile. Every pixel is optimised.",
    icon: Smartphone,
    grad: "from-sky-500 to-blue-600",
    span: "sm:col-span-1",
  },
  {
    title: "Enterprise CMS",
    desc: "Multi-workspace, roles, approvals — built for teams.",
    icon: Boxes,
    grad: "from-indigo-500 to-violet-600",
    span: "sm:col-span-2 lg:col-span-2",
  },
  {
    title: "Commerce Ready",
    desc: "Native UPI, Razorpay, catalog, checkout — sell instantly.",
    icon: IndianRupee,
    grad: "from-green-500 to-emerald-600",
    span: "sm:col-span-1",
  },
  {
    title: "AI Ready",
    desc: "AI Studio for copy, design, analytics & automations.",
    icon: BrainCircuit,
    grad: "from-cyan-500 to-blue-600",
    span: "sm:col-span-1",
  },
  {
    title: "Future Ready",
    desc: "Continuous release cadence. Public roadmap. You vote next.",
    icon: Rocket,
    grad: "from-pink-500 to-rose-600",
    span: "sm:col-span-2 lg:col-span-2",
  },
];

function WhyBento() {
  return (
    <section className="relative py-24">
      <SectionHeader
        eyebrow="Why ZUPIX"
        title={
          <>
            Chosen by{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
              250+

            </span>{" "}
            Indian businesses
          </>
        }
        description="From solo creators in Jaipur to D2C brands in Bengaluru — nine reasons ZUPIX is the platform teams standardise on."
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 sm:grid-cols-3 lg:grid-cols-4">
        {WHY_CARDS.map((w, i) => (
          <motion.div
            key={w.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
            whileHover={{ y: -4 }}
            className={`group relative flex h-auto min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6 ${w.span}`}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${w.grad} opacity-0 blur transition-opacity duration-500 group-hover:opacity-30`}
            />
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${w.grad} text-white shadow-lg`}
            >
              <w.icon className="h-6 w-6" />
            </motion.div>
            <h3 className="relative mt-5 text-balance break-words text-lg font-semibold text-white">{w.title}</h3>
            <p className="relative mt-1.5 break-words text-sm leading-relaxed text-white/60">{w.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Live Support                                                     */
/* ------------------------------------------------------------------ */

const SUPPORT = [
  {
    title: "Live Chat",
    desc: "Average response under 45 seconds. Real humans, not bots.",
    icon: MessageCircle,
    grad: "from-sky-500 to-blue-600",
    cta: "Start chat",
  },
  {
    title: "WhatsApp Support",
    desc: "Native WhatsApp Business chat with support agents in India.",
    icon: Send,
    grad: "from-emerald-500 to-green-600",
    cta: "Message us",
  },
  {
    title: "Email Support",
    desc: "help@zupix.in — replies within 4 hours on business days.",
    icon: Mail,
    grad: "from-rose-500 to-orange-500",
    cta: "Send email",
  },
  {
    title: "Knowledge Base",
    desc: "500+ searchable articles across 12 categories.",
    icon: BookOpen,
    grad: "from-amber-500 to-yellow-500",
    cta: "Browse KB",
  },
  {
    title: "Video Tutorials",
    desc: "120+ HD screencasts — from onboarding to advanced.",
    icon: Video,
    grad: "from-fuchsia-500 to-purple-600",
    cta: "Watch now",
  },
  {
    title: "Priority Support",
    desc: "Dedicated success manager on Enterprise plans.",
    icon: Star,
    grad: "from-indigo-500 to-violet-600",
    cta: "Upgrade",
  },
];

function LiveSupport() {
  return (
    <section className="relative py-24">
      <SectionHeader
        eyebrow="Live Support"
        title={
          <>
            Real help,{" "}
            <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
              real fast
            </span>
          </>
        }
        description="Six ways to reach a human — WhatsApp, chat, email, or a dedicated success manager. No ticket queues."
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${s.grad} opacity-0 blur transition-opacity duration-500 group-hover:opacity-30`}
            />
            <div className="relative flex items-start gap-4">
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.grad} text-white shadow-lg`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-white/60">{s.desc}</p>
                <button className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-all group-hover:text-amber-300">
                  {s.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Roadmap                                                          */
/* ------------------------------------------------------------------ */

const ROADMAP = [
  {
    version: "v1.0 — Aurora",
    date: "Shipped · Q1 2026",
    status: "released",
    items: [
      "Visual Builder with 20+ premium blocks",
      "AI Studio, Analytics & Conversion Center",
      "UPI + Razorpay, Custom Domains, PWA",
    ],
  },
  {
    version: "v1.2 — Nova",
    date: "Recently Released",
    status: "released",
    items: [
      "Universal Media Manager v2",
      "Enterprise Custom Code Studio",
      "Hero Studio v2 with GPU effects",
    ],
  },
  {
    version: "v1.4 — Solstice",
    date: "In Progress · Q2 2026",
    status: "progress",
    items: [
      "Native mobile SDK (iOS + Android)",
      "Multilingual AI content (Hindi, Tamil, Telugu)",
      "WhatsApp Cloud API two-way inbox",
    ],
  },
  {
    version: "v2.0 — Horizon",
    date: "Planned · Q3 2026",
    status: "planned",
    items: [
      "Public Developer API + CLI",
      "Marketplace revenue-share for creators",
      "AI Design Agents that ship pages autonomously",
    ],
  },
  {
    version: "Future Integrations",
    date: "Under Consideration",
    status: "future",
    items: [
      "Shopify, WooCommerce & Instamojo",
      "Zoho, Freshworks & Salesforce CRMs",
      "Meta Ads, Google Ads native attribution",
    ],
  },
];

function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} className="relative py-24">
      <SectionHeader
        eyebrow="Roadmap"
        title={
          <>
            Built in the open —{" "}
            <span className="bg-gradient-to-r from-fuchsia-300 to-rose-300 bg-clip-text text-transparent">
              you shape it
            </span>
          </>
        }
        description="Every release, every commitment, every future integration — transparent and versioned."
      />

      <div className="relative mx-auto max-w-4xl px-6">
        {/* Animated spine */}
        <div className="absolute inset-y-0 left-8 w-px overflow-hidden bg-white/10 sm:left-1/2">
          <motion.div
            style={{ height: lineHeight }}
            className="w-full origin-top bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_20px_rgba(251,146,60,0.6)]"
          />
        </div>

        <ul className="space-y-12">
          {ROADMAP.map((r, i) => {
            const left = i % 2 === 0;
            return (
              <motion.li
                key={r.version}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55 }}
                className={`relative flex items-start gap-6 sm:gap-10 ${
                  left ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-8 top-3 -translate-x-1/2 sm:left-1/2">
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full ring-4 ring-black/50 ${
                      r.status === "released"
                        ? "bg-emerald-400"
                        : r.status === "progress"
                          ? "bg-amber-400 animate-pulse"
                          : r.status === "planned"
                            ? "bg-sky-400"
                            : "bg-white/50"
                    }`}
                  />
                </div>

                <div className="ml-16 flex-1 sm:ml-0 sm:w-1/2">
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{r.version}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          r.status === "released"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : r.status === "progress"
                              ? "bg-amber-500/20 text-amber-300"
                              : r.status === "planned"
                                ? "bg-sky-500/20 text-sky-300"
                                : "bg-white/10 text-white/70"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{r.date}</p>
                    <ul className="mt-4 space-y-2">
                      {r.items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-white/75">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="hidden sm:block sm:w-1/2" />
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Newsletter                                                       */
/* ------------------------------------------------------------------ */

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state !== "idle") return;
    setState("loading");
    setTimeout(() => setState("done"), 900);
  };

  return (
    <section ref={ref} className="relative py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-[1.5px]"
        >
          {/* Gradient border */}
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#f59e0b,#ef4444,#8b5cf6,#06b6d4,#f59e0b)] opacity-70"
          />

          <div className="relative rounded-[calc(1.5rem-1.5px)] bg-slate-950/85 p-10 backdrop-blur-xl sm:p-14">
            {/* Aurora glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Newsletter
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Stay updated with{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  ZUPIX
                </span>
              </h2>
              <p className="mt-3 text-white/70">
                Product updates, growth playbooks, and creator stories — one email every Tuesday.
                No spam, ever.
              </p>

              <form
                onSubmit={submit}
                className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.in"
                    className="w-full rounded-full border border-white/15 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none backdrop-blur transition focus:border-white/30 focus:bg-white/[0.1]"
                    disabled={state !== "idle"}
                  />
                </div>
                <MotionButton type="submit" variant="primary">
                  <AnimatePresence mode="wait" initial={false}>
                    {state === "idle" && (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="inline-flex items-center gap-2"
                      >
                        Subscribe <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    )}
                    {state === "loading" && (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" /> Subscribing
                      </motion.span>
                    )}
                    {state === "done" && (
                      <motion.span
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Subscribed
                      </motion.span>
                    )}
                  </AnimatePresence>
                </MotionButton>
              </form>
              <p className="mt-4 text-xs text-white/40">
                Join 24,000+ Indian creators & founders. Unsubscribe in one click.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Trust Footer                                                     */
/* ------------------------------------------------------------------ */

const FOOTER_COLS: { title: string; links: string[] }[] = [
  {
    title: "Products",
    links: ["Bio Links", "Mini Websites", "AI Studio", "Commerce", "Analytics", "Custom Domains"],
  },
  {
    title: "Resources",
    links: ["Templates", "Themes", "Blog", "Case Studies", "Release Notes", "Roadmap"],
  },
  {
    title: "Support",
    links: ["Help Center", "Live Chat", "WhatsApp", "Video Tutorials", "Community", "Status"],
  },
  {
    title: "Company",
    links: ["About ZUPIX", "Careers", "Press Kit", "Partner Program", "Reseller", "Contact"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Cookies", "GDPR", "DPDP (India)", "Refund Policy"],
  },
];

function TrustFooter() {
  return (
    <footer className="relative pt-24">
      {/* Animated divider */}
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="h-px origin-left bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">ZUPIX</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              The complete link, mini-site and commerce platform — built in India, for the world.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur w-max">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              Made in India · Global Ready
            </div>
            <div className="mt-6 flex gap-2">
              {[
                { icon: Twitter, label: "Twitter", href: "https://twitter.com/zupix" },
                { icon: Instagram, label: "Instagram", href: "https://instagram.com/zupix" },
                { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/zupix" },
                { icon: Youtube, label: "YouTube", href: "https://youtube.com/@zupix" },
                { icon: Facebook, label: "Facebook", href: "https://facebook.com/zupix" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="/"
                      className="group inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white"
                    >
                      <span className="border-b border-transparent transition group-hover:border-white/60">
                        {l}
                      </span>
                    </a>
                  </li>
                ))}

              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter mini + contact */}
        <div className="mt-14 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              Newsletter
            </p>
            <p className="mt-2 text-sm text-white/60">
              Weekly playbooks & release notes. No spam.
            </p>
          </div>
          <div className="md:col-span-2">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
              />
              <MotionButton type="submit" variant="primary">
                Subscribe <ArrowRight className="h-4 w-4" />
              </MotionButton>
            </form>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> hello@zupix.studio
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support: +91 90000 12345
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Silicon Valley of India · Bengaluru
              </span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} ZUPIX Link Studio. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> SOC2 aligned · DPDP compliant
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-400" /> Made in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Exported wrapper                                                    */
/* ------------------------------------------------------------------ */

export function LandingEcosystem() {
  /**
   * 🚨 ROOT DOMAIN ROUTING BUG
   *
   * Current status:
   * ✅ https://zupix.site/gaurav works correctly.
   * ❌ https://zupix.site returns 404.
   *
   * Fix: Register "/" as a valid application route pointing to LandingPage.
   * The $slug route remains as the catch-all for dynamic bio pages.
   */

  return (
    <div id="ecosystem" className="reveal-on-scroll relative isolate overflow-hidden bg-[#0a0a12] text-white">
      {/* Ambient aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-[460px] w-[460px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <EcosystemGrid />
      <LearningCarousel />
      <WhyBento />
      <LiveSupport />
      <Roadmap />
      <Newsletter />
      <TrustFooter />

      <style>{`
        @keyframes ripple {
          from { transform: translate(-50%, -50%) scale(0); opacity: 0.55; }
          to   { transform: translate(-50%, -50%) scale(28); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
