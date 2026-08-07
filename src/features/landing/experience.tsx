/**
 * Landing Experience — Interactive product playground below the Conversion stack.
 *
 * 1. Live Builder Experience (real-feel builder with theme/logo/products switching)
 * 2. AI Studio Demo (prompt → animated live generation)
 * 3. Feature Explorer (bento grid, 16 tiles, hover expansion)
 * 4. Live Profile Switcher (floating phone, auto-cycles 10 Indian businesses)
 * 5. Workflow Timeline (scroll-animated 8-step journey)
 * 6. Interactive Before/After slider
 * 7. Performance Metrics (animated ring gauges)
 *
 * All motion uses framer-motion springs, GPU transforms, no layout thrash.
 * Content is realistic Indian small-business data — no lorem, no placeholders.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Bot,
  Calendar,
  Camera,
  ChevronRight,
  Code2,
  CreditCard,
  Crown,
  Download,
  Eye,
  FileText,
  Gauge,
  Globe,
  Image as ImageIcon,
  Layers,
  Layout,
  Lock,
  MessageCircle,
  MousePointer2,
  Palette,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Type,
  Upload,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import { mediaForCategory } from "./demo-media";


/* ============================================================
 * Premium primitives — magnetic button, glass card, section
 * ==========================================================*/

interface MagneticProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  icon?: ReactNode;
  className?: string;
}
function Magnetic({ children, onClick, variant = "primary", size = "md", icon, className = "" }: MagneticProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useSpring(0, { stiffness: 300, damping: 20 });
  const my = useSpring(0, { stiffness: 300, damping: 20 });

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full font-medium overflow-hidden transition-colors will-change-transform";
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-sm" };
  const variants = {
    primary: "bg-foreground text-background hover:bg-foreground/90",
    outline: "bg-background/60 backdrop-blur border border-border/70 text-foreground hover:bg-background",
    ghost: "text-foreground/80 hover:text-foreground",
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: mx, y: my }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 12);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 12);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon}
      </span>
    </motion.button>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "200px" }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 1, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "200px" }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="font-serif text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 1, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "200px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-4 text-base text-foreground/60 md:text-lg"
      >
        {description}
      </motion.p>
    </div>
  );
}

/* ============================================================
 * Shared realistic Indian business data
 * ==========================================================*/

interface Business {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  category: string;
  logo: string; // emoji
  verified: boolean;
  palette: { bg: string; surface: string; accent: string; ink: string; muted: string };
  bg: string; // linear-gradient
  buttons: { icon: ReactNode; label: string; sub?: string }[];
  products: { name: string; price: string; img: string }[];
  gallery: string[];
  socials: { name: string; handle: string; icon: string }[];
}

const BUSINESSES: Business[] = [
  {
    id: "kalyan",
    name: "Kalyan Heritage Jewellers",
    handle: "@kalyanheritage",
    tagline: "Bespoke 22K gold since 1974 · Chennai",
    category: "Jeweller",
    logo: "💎",
    verified: true,
    palette: {
      bg: "#1a0f08",
      surface: "#2a1a0f",
      accent: "#e8b84a",
      ink: "#f8ecd4",
      muted: "#a89577",
    },
    bg: "linear-gradient(160deg,#1a0f08 0%,#2a1a0f 50%,#3a2410 100%)",
    buttons: [
      { icon: <Calendar className="h-4 w-4" />, label: "Book Appointment", sub: "Free bridal consultation" },
      { icon: <MessageCircle className="h-4 w-4" />, label: "WhatsApp Stylist" },
      { icon: <ShoppingBag className="h-4 w-4" />, label: "New Bridal Collection" },
    ],
    products: [
      { name: "Meenakari Choker", price: "₹1,84,000", img: "💍" },
      { name: "Temple Necklace", price: "₹2,45,000", img: "📿" },
      { name: "Kundan Jhumka", price: "₹42,500", img: "👂" },
    ],
    gallery: ["✨", "💍", "👑", "📿"],
    socials: [
      { name: "Instagram", handle: "180K", icon: "📷" },
      { name: "WhatsApp", handle: "Direct", icon: "💬" },
    ],
  },
  {
    id: "bombay",
    name: "The Bombay Canteen",
    handle: "@thebombaycanteen",
    tagline: "Modern Indian, honest ingredients · Lower Parel",
    category: "Restaurant",
    logo: "🍛",
    verified: true,
    palette: {
      bg: "#0f1a14",
      surface: "#152820",
      accent: "#4ade80",
      ink: "#e8f5ea",
      muted: "#88a894",
    },
    bg: "linear-gradient(160deg,#0f1a14 0%,#152820 50%,#1a3325 100%)",
    buttons: [
      { icon: <Calendar className="h-4 w-4" />, label: "Reserve a Table", sub: "Tonight from 7 PM" },
      { icon: <ShoppingBag className="h-4 w-4" />, label: "Order on Zomato" },
      { icon: <FileText className="h-4 w-4" />, label: "Chef's Tasting Menu" },
    ],
    products: [
      { name: "Kejriwal Toast", price: "₹495", img: "🥪" },
      { name: "Goan Fish Curry", price: "₹745", img: "🍲" },
      { name: "Chai Panna Cotta", price: "₹385", img: "🍮" },
    ],
    gallery: ["🍽️", "🍷", "🌶️", "🥭"],
    socials: [
      { name: "Instagram", handle: "312K", icon: "📷" },
      { name: "Zomato", handle: "4.6★", icon: "🍴" },
    ],
  },
  {
    id: "apollo",
    name: "Dr. Meera Apollo Clinic",
    handle: "@drmeera_derma",
    tagline: "Dermatology & aesthetic care · Hyderabad",
    category: "Doctor",
    logo: "🩺",
    verified: true,
    palette: {
      bg: "#0a1526",
      surface: "#122238",
      accent: "#60a5fa",
      ink: "#e6efff",
      muted: "#7f96b8",
    },
    bg: "linear-gradient(160deg,#0a1526 0%,#122238 50%,#1a2f4d 100%)",
    buttons: [
      { icon: <Calendar className="h-4 w-4" />, label: "Book Consultation", sub: "Video or in-clinic" },
      { icon: <MessageCircle className="h-4 w-4" />, label: "WhatsApp Reception" },
      { icon: <FileText className="h-4 w-4" />, label: "Skin Assessment Form" },
    ],
    products: [
      { name: "Acne Program", price: "₹8,500", img: "🧴" },
      { name: "Chemical Peel", price: "₹6,200", img: "💧" },
      { name: "Laser Hair Reduction", price: "₹4,999", img: "✨" },
    ],
    gallery: ["🏥", "🔬", "💊", "🧑‍⚕️"],
    socials: [
      { name: "Practo", handle: "4.9★", icon: "🩺" },
      { name: "Instagram", handle: "62K", icon: "📷" },
    ],
  },
  {
    id: "delhischool",
    name: "Sunrise Public School",
    handle: "@sunrisepublicdelhi",
    tagline: "CBSE · Pre-K to 12 · Dwarka, New Delhi",
    category: "School",
    logo: "🎓",
    verified: true,
    palette: {
      bg: "#1a1428",
      surface: "#26203c",
      accent: "#c084fc",
      ink: "#efe9ff",
      muted: "#9a8cba",
    },
    bg: "linear-gradient(160deg,#1a1428 0%,#26203c 50%,#332855 100%)",
    buttons: [
      { icon: <FileText className="h-4 w-4" />, label: "Admissions 2026-27", sub: "Now open" },
      { icon: <Calendar className="h-4 w-4" />, label: "Book School Tour" },
      { icon: <Download className="h-4 w-4" />, label: "Download Prospectus" },
    ],
    products: [
      { name: "Pre-K Program", price: "Ages 3-5", img: "🧸" },
      { name: "STEM Lab", price: "Grades 6-10", img: "🔬" },
      { name: "Board Prep", price: "Grades 11-12", img: "📚" },
    ],
    gallery: ["🏫", "📚", "🎨", "⚽"],
    socials: [
      { name: "Website", handle: "sunrise.edu", icon: "🌐" },
      { name: "YouTube", handle: "12K", icon: "▶️" },
    ],
  },
  {
    id: "salon",
    name: "Lakmé Ateliér Salon",
    handle: "@lakmeatelier_bkc",
    tagline: "Hair · Skin · Bridal · BKC Mumbai",
    category: "Salon",
    logo: "💇‍♀️",
    verified: true,
    palette: {
      bg: "#1f0d18",
      surface: "#331624",
      accent: "#f472b6",
      ink: "#ffe8f2",
      muted: "#c48fa8",
    },
    bg: "linear-gradient(160deg,#1f0d18 0%,#331624 50%,#4a1e33 100%)",
    buttons: [
      { icon: <Calendar className="h-4 w-4" />, label: "Book Now", sub: "Same-day slots" },
      { icon: <Crown className="h-4 w-4" />, label: "Bridal Package" },
      { icon: <MessageCircle className="h-4 w-4" />, label: "WhatsApp Stylist" },
    ],
    products: [
      { name: "Keratin Treatment", price: "₹8,500", img: "💆‍♀️" },
      { name: "Bridal Makeup", price: "₹35,000", img: "👰" },
      { name: "Signature Facial", price: "₹4,500", img: "✨" },
    ],
    gallery: ["💄", "💅", "👗", "💇‍♀️"],
    socials: [
      { name: "Instagram", handle: "94K", icon: "📷" },
      { name: "Google", handle: "4.8★", icon: "⭐" },
    ],
  },
  {
    id: "gym",
    name: "Cult.fit Indiranagar",
    handle: "@cultfit_indiranagar",
    tagline: "Strength · HIIT · Yoga · Bengaluru",
    category: "Gym",
    logo: "💪",
    verified: true,
    palette: {
      bg: "#0f1520",
      surface: "#1a2233",
      accent: "#fb923c",
      ink: "#fff4e6",
      muted: "#a89680",
    },
    bg: "linear-gradient(160deg,#0f1520 0%,#1a2233 50%,#252d40 100%)",
    buttons: [
      { icon: <Calendar className="h-4 w-4" />, label: "Free Trial Class", sub: "This week only" },
      { icon: <Zap className="h-4 w-4" />, label: "Join Membership" },
      { icon: <FileText className="h-4 w-4" />, label: "Class Schedule" },
    ],
    products: [
      { name: "Monthly Pass", price: "₹2,999", img: "🎫" },
      { name: "Personal Training", price: "₹15,000", img: "🏋️" },
      { name: "Yoga Bundle", price: "₹4,499", img: "🧘" },
    ],
    gallery: ["🏋️", "🤸", "🧘", "🥊"],
    socials: [
      { name: "Instagram", handle: "48K", icon: "📷" },
      { name: "Website", handle: "cult.fit", icon: "🌐" },
    ],
  },
  {
    id: "travel",
    name: "Wanderlust Kerala Trails",
    handle: "@wanderlust_kerala",
    tagline: "Curated backwater & hill escapes",
    category: "Travel",
    logo: "🌴",
    verified: true,
    palette: {
      bg: "#0a1a1a",
      surface: "#0f2626",
      accent: "#14b8a6",
      ink: "#e0f5f2",
      muted: "#7ba8a3",
    },
    bg: "linear-gradient(160deg,#0a1a1a 0%,#0f2626 50%,#123333 100%)",
    buttons: [
      { icon: <Send className="h-4 w-4" />, label: "Plan My Trip", sub: "Talk to a local expert" },
      { icon: <ImageIcon className="h-4 w-4" />, label: "Munnar Hill Package" },
      { icon: <MessageCircle className="h-4 w-4" />, label: "WhatsApp Concierge" },
    ],
    products: [
      { name: "Alleppey Houseboat", price: "₹18,500", img: "⛵" },
      { name: "Munnar Retreat", price: "₹24,900", img: "☕" },
      { name: "Wayanad Wildlife", price: "₹21,500", img: "🐘" },
    ],
    gallery: ["🌴", "🏝️", "⛵", "🐘"],
    socials: [
      { name: "Instagram", handle: "76K", icon: "📷" },
      { name: "TripAdvisor", handle: "4.9★", icon: "🧳" },
    ],
  },
  {
    id: "agency",
    name: "Studio Yellow Design",
    handle: "@studioyellow.in",
    tagline: "Brand · Product · Motion · Pune",
    category: "Agency",
    logo: "🎨",
    verified: true,
    palette: {
      bg: "#141410",
      surface: "#20201a",
      accent: "#facc15",
      ink: "#fff9dd",
      muted: "#b0a880",
    },
    bg: "linear-gradient(160deg,#141410 0%,#20201a 50%,#2d2a1d 100%)",
    buttons: [
      { icon: <Send className="h-4 w-4" />, label: "Start a Project", sub: "Reply in 2 hours" },
      { icon: <Eye className="h-4 w-4" />, label: "See Case Studies" },
      { icon: <Calendar className="h-4 w-4" />, label: "Book Discovery Call" },
    ],
    products: [
      { name: "Brand Identity", price: "from ₹2.4L", img: "✨" },
      { name: "Product Design", price: "from ₹5L", img: "🖥️" },
      { name: "Motion Reel", price: "from ₹1.8L", img: "🎬" },
    ],
    gallery: ["🎨", "🖼️", "✏️", "🖥️"],
    socials: [
      { name: "Behance", handle: "12K", icon: "🎨" },
      { name: "Dribbble", handle: "8K", icon: "🏀" },
    ],
  },
  {
    id: "creator",
    name: "Ananya Kaur · Creator",
    handle: "@ananya.creates",
    tagline: "Design · Notion · Digital products",
    category: "Creator",
    logo: "✨",
    verified: true,
    palette: {
      bg: "#0f0a1a",
      surface: "#1a1030",
      accent: "#a78bfa",
      ink: "#f0e9ff",
      muted: "#9789b8",
    },
    bg: "linear-gradient(160deg,#0f0a1a 0%,#1a1030 50%,#231550 100%)",
    buttons: [
      { icon: <Download className="h-4 w-4" />, label: "Free Notion Template", sub: "18,400 downloads" },
      { icon: <Play className="h-4 w-4" />, label: "Watch on YouTube" },
      { icon: <MessageCircle className="h-4 w-4" />, label: "Join Community" },
    ],
    products: [
      { name: "Notion Life OS", price: "₹499", img: "📓" },
      { name: "Design Course", price: "₹2,999", img: "🎓" },
      { name: "1:1 Portfolio Review", price: "₹4,500", img: "🧑‍💻" },
    ],
    gallery: ["📓", "🎨", "🎬", "📱"],
    socials: [
      { name: "YouTube", handle: "285K", icon: "▶️" },
      { name: "Instagram", handle: "142K", icon: "📷" },
    ],
  },
  {
    id: "hospital",
    name: "Fortis Multi-Specialty",
    handle: "@fortis.gurgaon",
    tagline: "24×7 emergency · Cardiac · Ortho · Neuro",
    category: "Hospital",
    logo: "🏥",
    verified: true,
    palette: {
      bg: "#0a1a1e",
      surface: "#0f262b",
      accent: "#22d3ee",
      ink: "#e0f7fa",
      muted: "#7fa8ae",
    },
    bg: "linear-gradient(160deg,#0a1a1e 0%,#0f262b 50%,#12333a 100%)",
    buttons: [
      { icon: <MessageCircle className="h-4 w-4" />, label: "Emergency: 1800-102-4444", sub: "24×7 ambulance" },
      { icon: <Calendar className="h-4 w-4" />, label: "Book Appointment" },
      { icon: <FileText className="h-4 w-4" />, label: "Health Packages" },
    ],
    products: [
      { name: "Cardiac Screening", price: "₹3,499", img: "❤️" },
      { name: "Full Body Check", price: "₹5,999", img: "🩻" },
      { name: "Diabetes Care", price: "₹2,299", img: "🩸" },
    ],
    gallery: ["🏥", "🚑", "💊", "🩺"],
    socials: [
      { name: "Practo", handle: "4.7★", icon: "🩺" },
      { name: "Website", handle: "fortis.in", icon: "🌐" },
    ],
  },
];

/* ============================================================
 * Phone frame — reused across sections
 * ==========================================================*/

function PhoneFrame({ business, className = "" }: { business: Business; className?: string }) {
  const p = business.palette;
  const media = mediaForCategory(business.category);
  return (
    <div
      className={`relative mx-auto aspect-[9/19] w-full max-w-[280px] rounded-[42px] p-[10px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/40 ${className}`}
      style={{ background: "linear-gradient(140deg,#2a2a2e,#0a0a0a)" }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[34px]"
        style={{ background: business.bg, color: p.ink }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black/80" />
        <AnimatePresence mode="wait">
          <motion.div
            key={business.id}
            initial={{ opacity: 1, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Cover banner */}
            <div className="relative h-24 w-full overflow-hidden">
              <img
                src={media.cover}
                alt={`${business.name} cover`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: business.bg, opacity: 0.55 }} />
            </div>

            {/* Avatar — real portrait */}
            <div className="-mt-8 flex flex-col items-center px-5">
              <div
                className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl text-4xl shadow-lg ring-2"
                style={{
                  background: p.surface,
                  boxShadow: `0 12px 40px -12px ${p.accent}55`,
                  ["--tw-ring-color" as string]: p.bg,
                }}
              >
                <img
                  src={media.owner}
                  alt={`${business.name} owner`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: p.ink }}>
                {business.name}
                {business.verified && <BadgeCheck className="h-4 w-4" style={{ color: p.accent }} />}
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: p.muted }}>
                {business.handle}
              </div>
              <div className="mt-2 text-center text-[11px] leading-snug" style={{ color: p.muted }}>
                {business.tagline}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-4 space-y-2 px-4">
              {business.buttons.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 1, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.15 }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium"
                  style={{
                    background: p.surface,
                    color: p.ink,
                    border: `1px solid ${p.accent}22`,
                  }}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg"
                    style={{ background: `${p.accent}22`, color: p.accent }}
                  >
                    {b.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{b.label}</div>
                    {b.sub && (
                      <div className="truncate text-[10px]" style={{ color: p.muted }}>
                        {b.sub}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: p.muted }} />
                </motion.div>
              ))}
            </div>

            {/* Products — real photography */}
            <div className="mt-4 px-4">
              <div className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: p.muted }}>
                Featured
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {business.products.map((prod, i) => (
                  <div
                    key={prod.name}
                    className="overflow-hidden rounded-lg p-1.5 text-center"
                    style={{ background: p.surface, border: `1px solid ${p.accent}18` }}
                  >
                    <div className="mb-1 aspect-square overflow-hidden rounded">
                      <img
                        src={media.products[i % media.products.length]}
                        alt={prod.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="truncate text-[9px]" style={{ color: p.ink }}>
                      {prod.name}
                    </div>
                    <div className="text-[9px] font-semibold" style={{ color: p.accent }}>
                      {prod.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery — real photography */}
            <div className="mt-3 grid grid-cols-4 gap-1 px-4 pb-6">
              {business.gallery.map((_g, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-md"
                  style={{ background: p.surface }}
                >
                  <img
                    src={media.gallery[i % media.gallery.length]}
                    alt={`${business.name} gallery ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


/* ============================================================
 * SECTION 1 — Live Builder Experience
 * ==========================================================*/

function BuilderExperience() {
  const [activeId, setActiveId] = useState(BUSINESSES[0].id);
  const business = BUSINESSES.find((b) => b.id === activeId) ?? BUSINESSES[0];
  const [selectedBlock, setSelectedBlock] = useState("hero");

  const blocks = [
    { id: "hero", label: "Profile Hero", icon: <Layout className="h-3.5 w-3.5" /> },
    { id: "cta1", label: "Book Appointment", icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: "cta2", label: "WhatsApp Button", icon: <MessageCircle className="h-3.5 w-3.5" /> },
    { id: "cta3", label: "Featured Grid", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    { id: "gallery", label: "Gallery Strip", icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { id: "social", label: "Social Links", icon: <Share2 className="h-3.5 w-3.5" /> },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,#f5e1c8_0%,transparent_45%),radial-gradient(circle_at_80%_60%,#e8d0f0_0%,transparent_45%)] opacity-40" />
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Live Builder"
          title={<>The builder is <span className="italic text-foreground/80">right here</span>.</>}
          description="Not a screenshot. Click any business — watch the theme, logo, verified badge, buttons, products and gallery update instantly on the live preview."
        />

        {/* Business switcher chips */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {BUSINESSES.slice(0, 8).map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveId(b.id)}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                b.id === activeId
                  ? "border-foreground/80 bg-foreground text-background"
                  : "border-border/60 bg-background/60 text-foreground/70 hover:border-foreground/30 hover:bg-background"
              }`}
            >
              <span>{b.logo}</span>
              <span>{b.category}</span>
            </button>
          ))}
        </div>

        {/* Builder chrome */}
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-background/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {/* Topbar */}
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="hidden items-center gap-1.5 rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs text-foreground/60 md:flex">
                <Globe className="h-3 w-3" />
                zupix.link/{business.id}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted md:inline-flex">
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
                <Send className="h-3 w-3" /> Publish
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 divide-x divide-border/50">
            {/* Layers */}
            <div className="col-span-3 hidden bg-muted/20 p-3 lg:block">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                  Layers
                </div>
                <Plus className="h-3.5 w-3.5 text-foreground/40" />
              </div>
              <div className="space-y-1">
                {blocks.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBlock(b.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                      selectedBlock === b.id
                        ? "bg-foreground/10 text-foreground"
                        : "text-foreground/60 hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-foreground/50">{b.icon}</span>
                    <span className="flex-1 text-left">{b.label}</span>
                    {selectedBlock === b.id && <MousePointer2 className="h-3 w-3" />}
                  </button>
                ))}
              </div>

              <div className="mt-6 mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                Blocks
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[Type, ImageIcon, Video, ShoppingBag, Calendar, FileText, MessageCircle, Layers, Code2].map(
                  (Icon, i) => (
                    <div
                      key={i}
                      className="grid aspect-square place-items-center rounded-md border border-border/40 bg-background text-foreground/50 hover:border-foreground/40 hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="col-span-12 flex min-h-[560px] items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,rgba(0,0,0,0.02)_12px,rgba(0,0,0,0.02)_13px)] p-6 lg:col-span-6">
              <PhoneFrame business={business} />
            </div>

            {/* Properties */}
            <div className="col-span-3 hidden bg-muted/20 p-3 lg:block">
              <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                Properties
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="mb-1 text-foreground/50">Theme</div>
                  <div className="rounded-md border border-border/50 bg-background p-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded"
                        style={{ background: business.palette.accent }}
                      />
                      <span className="font-medium capitalize">{business.category} Preset</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-foreground/50">Palette</div>
                  <div className="flex gap-1.5">
                    {[business.palette.bg, business.palette.surface, business.palette.accent, business.palette.ink].map(
                      (c) => (
                        <span key={c} className="h-6 flex-1 rounded" style={{ background: c }} />
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-foreground/50">Verified Badge</div>
                  <div className="flex items-center justify-between rounded-md border border-border/50 bg-background px-2 py-1.5">
                    <span>Auto-verified</span>
                    <div className="relative h-4 w-7 rounded-full bg-green-500">
                      <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-foreground/50">Background</div>
                  <div className="h-10 rounded-md border border-border/50" style={{ background: business.bg }} />
                </div>

                <div>
                  <div className="mb-1 text-foreground/50">Motion</div>
                  <div className="rounded-md border border-border/50 bg-background px-2 py-1.5">
                    <span className="font-medium">Fade + Rise · 400ms</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-foreground/50">Custom Domain</div>
                  <div className="rounded-md border border-border/50 bg-background px-2 py-1.5 text-foreground/70">
                    {business.id}.in
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 2 — AI Studio Demo
 * ==========================================================*/

interface AiPrompt {
  id: string;
  chip: string;
  prompt: string;
  labels: string[];
  outputs: string[];
}

const AI_PROMPTS: AiPrompt[] = [
  {
    id: "jewel",
    chip: "Jeweller bio",
    prompt: "Write a premium bio for a Chennai heritage jeweller with a 50-year legacy.",
    labels: ["Business description", "Tagline", "SEO title", "SEO description", "WhatsApp CTA", "Theme suggestion"],
    outputs: [
      "Kalyan Heritage crafts bespoke 22K gold jewellery, hand-finished by master karigars in Chennai since 1974.",
      "Heirlooms made in gold, worn for generations.",
      "Kalyan Heritage · Bespoke 22K Bridal Jewellery in Chennai",
      "Fourth-generation Chennai jeweller specialising in bridal sets, temple jewellery and 22K daily wear. Book an in-store consultation.",
      "Hi Kalyan Heritage 👋 I'd love to see your latest bridal collection. Could we book a private viewing?",
      "Recommended: 'Champagne Heritage' — cream ivory canvas, antique gold accents, Cormorant Garamond serif headings.",
    ],
  },
  {
    id: "cafe",
    chip: "Restaurant CTA",
    prompt: "Write CTAs and a description for a modern Indian bistro in Mumbai.",
    labels: ["Business description", "Reserve CTA", "Order CTA", "SEO title", "Instagram bio", "Theme suggestion"],
    outputs: [
      "The Bombay Canteen re-imagines regional Indian classics with seasonal, honest ingredients — a Lower Parel staple.",
      "Reserve your table · Tonight from 7 PM · Chef's tasting available",
      "Order the Kejriwal Toast · Zomato · Swiggy · 32 min avg",
      "The Bombay Canteen · Modern Indian in Lower Parel, Mumbai",
      "Cooking India — one plate at a time. 📍 Lower Parel · Reservations ↓",
      "Recommended: 'Monsoon Bistro' — deep forest palette, warm amber accents, editorial serif.",
    ],
  },
  {
    id: "doc",
    chip: "Clinic profile",
    prompt: "Create a trust-building profile for a Hyderabad dermatology clinic.",
    labels: ["Business description", "Booking CTA", "Trust line", "SEO title", "WhatsApp CTA", "Theme suggestion"],
    outputs: [
      "Dr. Meera's Apollo Clinic offers evidence-based dermatology and aesthetic care — from acne to advanced laser.",
      "Book a consultation · Video or in-clinic · Slots today",
      "MD Dermatology · 12+ years experience · 8,400+ patients treated",
      "Dr. Meera Apollo Clinic · Dermatologist in Banjara Hills, Hyderabad",
      "Hi Dr. Meera 👋 I'd like to book a skin consultation this week. Please share available slots.",
      "Recommended: 'Clinical Trust' — clean off-white, medical blue accent, Work Sans typography.",
    ],
  },
];

function AiStudioDemo() {
  const [selected, setSelected] = useState(AI_PROMPTS[0]);
  const [runId, setRunId] = useState(0);
  const [visibleOutputs, setVisibleOutputs] = useState<number>(0);
  const [prompt, setPrompt] = useState(AI_PROMPTS[0].prompt);

  useEffect(() => {
    setPrompt(selected.prompt);
  }, [selected]);

  useEffect(() => {
    setVisibleOutputs(0);
    if (runId === 0) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setVisibleOutputs(i);
      if (i >= selected.outputs.length) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [runId, selected]);

  const run = () => setRunId((r) => r + 1);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-transparent via-muted/20 to-transparent py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="AI Studio"
          title={<>Describe your business. <span className="italic text-foreground/80">Watch it write itself.</span></>}
          description="ZUPIX AI drafts your headline, CTAs, SEO tags, WhatsApp scripts and theme suggestions — trained on your brand context."
        />

        <div className="mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:p-8">
          {/* Left — assistant panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">ZUPIX AI Studio</div>
                <div className="text-xs text-foreground/50">Brand-aware · Multi-LLM · GPT + Gemini failover</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                Suggested prompts
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AI_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setRunId(0);
                      setVisibleOutputs(0);
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      p.id === selected.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 bg-background text-foreground/70 hover:border-foreground/40"
                    }`}
                  >
                    {p.chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-foreground/50">
                  <Sparkles className="h-3 w-3" /> Brand context loaded · {selected.chip}
                </div>
                <button
                  onClick={run}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
                >
                  <Wand2 className="h-3 w-3" /> Generate
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-3 text-[11px] text-foreground/60">
              <div className="mb-1 font-semibold text-foreground/80">Live model</div>
              <div className="flex items-center justify-between">
                <span>google/gemini-3.6-flash</span>
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600">
                  streaming
                </span>
              </div>
            </div>
          </div>

          {/* Right — outputs */}
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground/70">Generated content</div>
              <div className="text-[10px] text-foreground/50">
                {visibleOutputs}/{selected.outputs.length} sections
              </div>
            </div>

            {runId === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-border/60 text-foreground/40">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div className="text-sm text-foreground/60">
                  Hit <span className="font-semibold text-foreground">Generate</span> to see ZUPIX AI draft your page.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selected.outputs.map((text, i) => {
                  const shown = i < visibleOutputs;
                  const streaming = i === visibleOutputs - 1;
                  return (
                    <AnimatePresence key={`${runId}-${i}`} initial>
                      {shown && (
                        <motion.div
                          initial={{ opacity: 1, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-xl border border-border/60 bg-background p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                              {selected.labels[i]}
                            </div>
                            {streaming && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                streaming
                              </span>
                            )}
                          </div>
                          <TypewriterText text={text} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const t = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [text]);
  return <div className="text-[13px] leading-snug text-foreground/85">{shown}<span className="animate-pulse text-foreground/40">{shown.length < text.length ? "▍" : ""}</span></div>;
}

/* ============================================================
 * SECTION 3 — Feature Explorer bento
 * ==========================================================*/

const FEATURES = [
  { icon: Palette, title: "Theme Studio", desc: "Live tokens, gradients, dynamic Google Fonts.", accent: "#e8b84a" },
  { icon: ShoppingBag, title: "Commerce", desc: "Products, variants, checkout, tax.", accent: "#4ade80" },
  { icon: Calendar, title: "Booking", desc: "Slots, buffers, deposits, reminders.", accent: "#60a5fa" },
  { icon: ImageIcon, title: "Gallery", desc: "Masonry, lightbox, video mix.", accent: "#c084fc" },
  { icon: Camera, title: "Media Studio", desc: "Client-side WebP, dedupe, brand kit.", accent: "#f472b6" },
  { icon: Activity, title: "Analytics", desc: "Real-time, geo, funnels, heatmaps.", accent: "#fb923c" },
  { icon: BadgeCheck, title: "Verified Badge", desc: "Auto-issued from verified domain.", accent: "#22d3ee" },
  { icon: FileText, title: "Forms", desc: "Conditional logic, CRM export.", accent: "#facc15" },
  { icon: CreditCard, title: "Payments", desc: "UPI, cards, Razorpay, Paddle, Stripe.", accent: "#14b8a6" },
  { icon: Code2, title: "Custom HTML", desc: "Sanitized widgets & iframes.", accent: "#a78bfa" },
  { icon: Globe, title: "Domains", desc: "Custom, DoH verify, SSL auto.", accent: "#38bdf8" },
  { icon: Search, title: "SEO", desc: "Meta, OG, JSON-LD, sitemap.", accent: "#fb7185" },
  { icon: Blocks, title: "Integrations", desc: "WhatsApp, Slack, Zapier, webhooks.", accent: "#84cc16" },
  { icon: Bot, title: "AI Studio", desc: "Copy, design, growth, workflows.", accent: "#e879f9" },
  { icon: Lock, title: "Security", desc: "RLS, RBAC, audit logs, MFA.", accent: "#f87171" },
  { icon: Layers, title: "Backups", desc: "Snapshots, version history, restore.", accent: "#93c5fd" },
];

function FeatureExplorer() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Feature Explorer"
          title={<>Everything you need to <span className="italic text-foreground/80">run a business</span>.</>}
          description="Sixteen enterprise modules — every one live in the app today. Hover any tile to expand."
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {FEATURES.map((f, i) => (
            <FeatureTile key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureTile({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  const { icon: Icon, title, desc, accent } = feature;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur-xl transition-shadow hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]"
      style={
        {
          background: `linear-gradient(135deg, ${accent}08, transparent 60%)`,
        } as CSSProperties
      }
    >
      {/* animated gradient border on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${accent}55, transparent 60%)`,
          padding: 1,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      <motion.div
        whileHover={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.6 }}
        className="mb-3 grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: `${accent}18`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-foreground/60">{desc}</div>

      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ color: accent }}>
        Explore <ArrowRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}

/* ============================================================
 * SECTION 4 — Live Profile Switcher (floating phone auto-cycle)
 * ==========================================================*/

function ProfileSwitcher() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % BUSINESSES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const business = BUSINESSES[i];

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        className="absolute inset-0 -z-10 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${business.palette.accent}20, transparent 60%)`,
        }}
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="Any Industry"
            title={<>One platform. <span className="italic text-foreground/80">Every business.</span></>}
            description="From jewellers to hospitals — ZUPIX adapts. Watch a real profile switch every five seconds."
          />
          <div className="-mt-6 flex flex-wrap gap-2">
            {BUSINESSES.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setI(idx)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  idx === i
                    ? "border-foreground/80 bg-foreground text-background"
                    : "border-border/60 bg-background/70 text-foreground/60 hover:border-foreground/30"
                }`}
              >
                {b.logo} {b.category}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <PhoneFrame business={business} />
          </motion.div>

          {/* Floating cards */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-16 hidden rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-xl backdrop-blur md:block"
          >
            <div className="flex items-center gap-2 text-xs">
              <BadgeCheck className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-semibold">Verified</div>
                <div className="text-[10px] text-foreground/60">Domain confirmed</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-4 bottom-24 hidden rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-xl backdrop-blur md:block"
          >
            <div className="flex items-center gap-2 text-xs">
              <Store className="h-4 w-4 text-green-500" />
              <div>
                <div className="font-semibold">New order</div>
                <div className="text-[10px] text-foreground/60">₹4,850 · UPI</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 5 — Workflow Timeline
 * ==========================================================*/

const STEPS = [
  { icon: Plus, title: "Create Profile", desc: "One click. Google or email." },
  { icon: Palette, title: "Choose a Theme", desc: "20+ presets. Live tokens." },
  { icon: Upload, title: "Upload Media", desc: "Auto WebP, dedupe, brand kit." },
  { icon: ShoppingBag, title: "Add Products", desc: "Variants, prices, stock." },
  { icon: Globe, title: "Connect Domain", desc: "SSL auto in 60 seconds." },
  { icon: Send, title: "Publish", desc: "Global CDN in one tap." },
  { icon: MessageCircle, title: "Receive Orders", desc: "WhatsApp + email + Slack." },
  { icon: CreditCard, title: "Collect Payments", desc: "UPI · Cards · Razorpay." },
];

function WorkflowTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineY = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHeader
          eyebrow="Workflow"
          title={<>From <span className="italic">idea</span> to <span className="italic">income</span> — in one afternoon.</>}
          description="An honest look at the eight steps your business takes inside ZUPIX Link Studio."
        />

        <div ref={ref} className="relative pl-12 md:pl-0">
          {/* rail */}
          <div className="absolute left-4 top-0 h-full w-px bg-border md:left-1/2 md:-translate-x-1/2" />
          <motion.div
            className="absolute left-4 top-0 w-px origin-top bg-foreground md:left-1/2 md:-translate-x-1/2"
            style={{ height: lineY }}
          />

          <div className="space-y-10 md:space-y-16">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const left = i % 2 === 0;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 1, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5 }}
                  className={`relative grid grid-cols-1 items-center gap-4 md:grid-cols-2 md:gap-12 ${
                    left ? "" : "md:[&>div:first-child]:col-start-2"
                  }`}
                >
                  <div className={left ? "md:text-right" : ""}>
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-5 backdrop-blur-xl">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/50">
                        Step {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="text-lg font-semibold">{s.title}</div>
                      <div className="mt-1 text-sm text-foreground/60">{s.desc}</div>
                    </div>
                  </div>
                  <div />
                  {/* node */}
                  <div className="absolute left-4 top-6 -translate-x-1/2 md:left-1/2">
                    <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background shadow">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 6 — Before / After slider
 * ==========================================================*/

function BeforeAfterSlider() {
  const [pos, setPos] = useState(52);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const pct = Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100));
    setPos(pct);
  };

  useEffect(() => {
    const up = () => (dragging.current = false);
    const mv = (e: MouseEvent) => dragging.current && move(e.clientX);
    const tmv = (e: TouchEvent) => dragging.current && move(e.touches[0].clientX);
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", mv);
    window.addEventListener("touchend", up);
    window.addEventListener("touchmove", tmv);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchmove", tmv);
    };
  }, []);

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHeader
          eyebrow="Old vs. New"
          title={<>The <span className="italic">plain</span> bio link. <span className="italic">And this.</span></>}
          description="Drag the handle. That's the difference between a link list and an actual business surface."
        />

        <div
          ref={ref}
          onMouseDown={(e) => {
            dragging.current = true;
            move(e.clientX);
          }}
          onTouchStart={(e) => {
            dragging.current = true;
            move(e.touches[0].clientX);
          }}
          className="relative mx-auto aspect-[16/10] w-full max-w-4xl select-none overflow-hidden rounded-3xl border border-border/60 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.35)]"
        >
          {/* After (ZUPIX) — bottom layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f08] via-[#2a1a0f] to-[#3a2410] p-8">
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center text-white">
              <div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-3xl backdrop-blur">💎</div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                Kalyan Heritage <BadgeCheck className="h-4 w-4 text-amber-300" />
              </div>
              <div className="mb-4 text-xs text-white/60">Bespoke 22K bridal · Chennai · Since 1974</div>
              <div className="w-full space-y-2">
                {["Book bridal consultation", "WhatsApp our stylist", "Shop new collection"].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-amber-300/30 bg-white/5 py-2 text-xs backdrop-blur"
                  >
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid w-full grid-cols-3 gap-1.5">
                {["💍", "📿", "👑"].map((e) => (
                  <div key={e} className="rounded-md bg-white/5 py-3 text-lg">
                    {e}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white backdrop-blur">
              ZUPIX Link Studio
            </div>
          </div>

          {/* Before — clipped */}
          <div
            className="absolute inset-0 overflow-hidden bg-slate-100"
            style={{ width: `${pos}%` }}
          >
            <div className="flex h-full w-[100vw] max-w-4xl flex-col items-center justify-center px-8 text-center">
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-slate-300 text-slate-500">?</div>
              <div className="text-sm font-medium text-slate-700">kalyanheritage</div>
              <div className="mb-4 text-[11px] text-slate-500">Chennai jeweller</div>
              <div className="w-64 space-y-2">
                {["Instagram", "Website", "Contact"].map((t) => (
                  <div
                    key={t}
                    className="rounded-md border border-slate-300 bg-white py-2 text-xs text-slate-700"
                  >
                    {t}
                  </div>
                ))}
              </div>
              <div className="absolute left-4 top-4 rounded-full bg-slate-200 px-3 py-1 text-[10px] font-medium text-slate-600">
                Basic bio link
              </div>
            </div>
          </div>

          {/* Handle */}
          <div
            className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)]"
            style={{ left: `${pos}%` }}
          >
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-900 shadow-xl">
              <ChevronRight className="h-4 w-4 -translate-x-1" />
              <ChevronRight className="absolute h-4 w-4 translate-x-1 rotate-180" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 7 — Performance metrics (ring gauges)
 * ==========================================================*/

const METRICS = [
  { label: "Load Speed", value: 98, unit: "score", icon: Zap, hint: "0.6s FCP · edge CDN" },
  { label: "SEO", value: 100, unit: "score", icon: Search, hint: "Meta · OG · JSON-LD" },
  { label: "Lighthouse", value: 99, unit: "avg", icon: Gauge, hint: "Perf · A11y · Best Practice" },
  { label: "Accessibility", value: 96, unit: "score", icon: Eye, hint: "WCAG 2.1 AA" },
  { label: "Core Web Vitals", value: 100, unit: "pass", icon: Activity, hint: "LCP · FID · CLS" },
  { label: "Responsive", value: 100, unit: "coverage", icon: Layout, hint: "Mobile · Tablet · Desktop" },
  { label: "Security", value: 97, unit: "score", icon: Lock, hint: "RLS · HTTPS · CSP" },
];

function RingGauge({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, mv, value]);
  useEffect(() => {
    return spring.on("change", (v) => setDisplay(Math.round(v)));
  }, [spring]);
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (display / 100) * circumference;
  return (
    <div ref={ref} className="relative grid h-24 w-24 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" strokeWidth="6" className="stroke-border/50" fill="none" />
        <circle
          cx="40"
          cy="40"
          r="34"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-foreground"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-xl font-semibold tabular-nums">{display}</div>
    </div>
  );
}

function PerformanceMetrics() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Performance"
          title={<>Fast because it <span className="italic">has to be</span>.</>}
          description="Every ZUPIX page is measured on the real production stack. These are the numbers your customers get."
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {METRICS.map((m) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 1, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "200px" }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-border/60 bg-background/70 p-5 text-center backdrop-blur-xl"
            >
              <RingGauge value={m.value} />
              <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold">
                <m.icon className="h-3.5 w-3.5 text-foreground/60" />
                {m.label}
              </div>
              <div className="mt-1 text-[10px] text-foreground/50">{m.hint}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Magnetic icon={<ArrowRight className="h-4 w-4" />}>Start building free</Magnetic>
          <Magnetic variant="outline" icon={<Eye className="h-4 w-4" />}>See it live</Magnetic>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Public export
 * ==========================================================*/

export function LandingExperience() {
  const sections = useMemo(
    () => [
      <BuilderExperience key="builder" />,
      <AiStudioDemo key="ai" />,
      <FeatureExplorer key="features" />,
      <ProfileSwitcher key="switcher" />,
      <WorkflowTimeline key="workflow" />,
      <BeforeAfterSlider key="ba" />,
      <PerformanceMetrics key="perf" />,
    ],
    [],
  );
  return <div id="experience" className="reveal-visible relative bg-[#090B18]">{sections}</div>;
}
