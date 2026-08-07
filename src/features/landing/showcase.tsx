/**
 * Landing Showcase — premium interactive product showcase below the hero.
 *
 * Sections:
 *  1. Live Theme Gallery (20 real mini previews, tilt + open modal)
 *  2. Industry Explorer (filter chips, animated grid)
 *  3. Live Device Preview (desktop / tablet / mobile sync)
 *  4. Feature Highlights (floating cards)
 *  5. Before vs After (drag slider)
 *  6. Why ZUPIX (bento grid)
 *  7. Live Stats (scroll counters)
 *
 * Uses `motion` (Framer Motion successor) for GPU-accelerated springs.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  BadgeCheck,
  Check,
  Globe,
  Image as ImageIcon,
  Layers,
  Layout,
  Monitor,
  Moon,
  Palette,
  Phone,
  QrCode,
  ShoppingBag,
  Sparkles,
  Sun,
  Tablet,
  Wallet,
  X,
  Zap,
  Calendar,
  FileText,
  BarChart3,
  MessageCircle,
  Code2,
} from "lucide-react";
import { mediaForCategory } from "./demo-media";
import { ResponsiveStatCard, ResponsiveStatsGrid } from "./responsive-stat";


// ============================================================================
// Data — 20 real theme mini-previews with authentic Indian business content
// ============================================================================

type Industry =
  | "Jewellery"
  | "Restaurant"
  | "Doctor"
  | "Salon"
  | "Gym"
  | "Cafe"
  | "Hotel"
  | "School"
  | "Coaching"
  | "Hospital"
  | "Real Estate"
  | "Travel"
  | "Digital Agency"
  | "Construction"
  | "Law Firm"
  | "NGO"
  | "Fashion"
  | "Electronics"
  | "Furniture"
  | "Creator";

interface ThemeCard {
  id: string;
  themeName: string;
  category: Industry;
  views: string;
  business: {
    name: string;
    handle: string;
    tagline: string;
    initial: string;
    location: string;
  };
  palette: {
    bg: string;
    surface: string;
    text: string;
    subtext: string;
    accent: string;
    accent2: string;
    chip: string;
  };
  cover: string; // css gradient
  buttons: string[];
  products: { name: string; price: string; hue: string }[];
  gallery: string[]; // css gradients for gallery tiles
}

const g = (c1: string, c2: string, c3: string) =>
  `radial-gradient(120% 80% at 20% 0%, ${c1}, transparent 60%), radial-gradient(120% 80% at 80% 100%, ${c2}, transparent 60%), #090B18`;

const THEMES: ThemeCard[] = [
  {
    id: "kalyan-heritage",
    themeName: "Regal Gold",
    category: "Jewellery",
    views: "128K",
    business: { name: "Kalyan Heritage", handle: "@kalyanheritage", tagline: "22K jewellery · Bandra", initial: "K", location: "Mumbai" },
    palette: { bg: "#1a0f14", surface: "#2b1a24", text: "#fff", subtext: "#e9c9a8", accent: "#d4a24a", accent2: "#ff7a4a", chip: "rgba(212,162,74,.18)" },
    cover: g("#d4a24a55", "#ff7a4a55", "#1a0f14"),
    buttons: ["Diwali Edit '26 · ₹48,900", "Book a viewing · Bandra", "Shop bridal collection"],
    products: [
      { name: "Meera Kada", price: "₹92k", hue: "#d4a24a" },
      { name: "Rani Haar", price: "₹1.8L", hue: "#e97a5a" },
      { name: "Kundan Set", price: "₹2.4L", hue: "#c88a3a" },
    ],
    gallery: [g("#d4a24a55", "#ff7a4a44", "#3a1f2a"), g("#e97a5a55", "#d4a24a55", "#2b1a24"), g("#c88a3a55", "#7a3a2a55", "#1a0f14")],
  },
  {
    id: "bombay-canteen",
    themeName: "Spice Route",
    category: "Restaurant",
    views: "94K",
    business: { name: "Bombay Canteen", handle: "@bombaycanteen", tagline: "Modern Indian · Kamala Mills", initial: "B", location: "Mumbai" },
    palette: { bg: "#12100e", surface: "#231c15", text: "#fff", subtext: "#f0d3a3", accent: "#ff6b35", accent2: "#e84393", chip: "rgba(255,107,53,.18)" },
    cover: g("#ff6b3555", "#e8439355", "#12100e"),
    buttons: ["Reserve a table · Tonight", "Order on Zomato", "View the tasting menu"],
    products: [
      { name: "Bombay Sliders", price: "₹480", hue: "#ff6b35" },
      { name: "Malwani Prawn", price: "₹740", hue: "#e84393" },
      { name: "Kokum Sorbet", price: "₹280", hue: "#c73e6a" },
    ],
    gallery: [g("#ff6b3555", "#e8439344", "#2a1a1a"), g("#e8439355", "#ffb56655", "#231c15"), g("#c73e6a55", "#ff6b3555", "#12100e")],
  },
  {
    id: "dr-shah",
    themeName: "Clinic Calm",
    category: "Doctor",
    views: "62K",
    business: { name: "Dr. Nisha Shah", handle: "@drnishashah", tagline: "Dermatology · MBBS, MD", initial: "N", location: "Ahmedabad" },
    palette: { bg: "#f6f7fb", surface: "#ffffff", text: "#0d1b2a", subtext: "#5a6b83", accent: "#2d8a9e", accent2: "#5cbdb9", chip: "rgba(45,138,158,.12)" },
    cover: g("#2d8a9e33", "#5cbdb944", "#eef4f8"),
    buttons: ["Book appointment · Practo", "WhatsApp reception", "Skin consultation form"],
    products: [
      { name: "Skin Consult", price: "₹800", hue: "#2d8a9e" },
      { name: "Acne Program", price: "₹6,500", hue: "#5cbdb9" },
      { name: "Laser Care", price: "₹4,200", hue: "#3b7a8a" },
    ],
    gallery: [g("#2d8a9e33", "#5cbdb933", "#e8f0f5"), g("#5cbdb933", "#a0c9d155", "#dde9ee"), g("#3b7a8a22", "#2d8a9e33", "#eef4f8")],
  },
  {
    id: "juice-salon",
    themeName: "Petal Blush",
    category: "Salon",
    views: "51K",
    business: { name: "Juice Salon", handle: "@juicesalon", tagline: "Cut · Color · Bridal", initial: "J", location: "Bengaluru" },
    palette: { bg: "#fbf1f4", surface: "#ffffff", text: "#3a1a2a", subtext: "#8a5a70", accent: "#e88aab", accent2: "#c45c7c", chip: "rgba(232,138,171,.16)" },
    cover: g("#e88aab55", "#f8c8d855", "#fbf1f4"),
    buttons: ["Book a stylist", "Bridal packages · From ₹18k", "Wedding hair trials"],
    products: [
      { name: "Global Color", price: "₹4,500", hue: "#e88aab" },
      { name: "Bridal HD Makeup", price: "₹18k", hue: "#c45c7c" },
      { name: "Keratin Repair", price: "₹6,900", hue: "#a04868" },
    ],
    gallery: [g("#e88aab55", "#f8c8d855", "#fce4eb"), g("#c45c7c55", "#e88aab55", "#f5d5df"), g("#a0486855", "#c45c7c44", "#f8dee6")],
  },
  {
    id: "cult-fit",
    themeName: "Athlete Neon",
    category: "Gym",
    views: "88K",
    business: { name: "Cult Fitness · HSR", handle: "@cult.hsr", tagline: "Strength · HRX · Yoga", initial: "C", location: "Bengaluru" },
    palette: { bg: "#0a0f0d", surface: "#141c18", text: "#fff", subtext: "#a8f3d0", accent: "#2dd4a8", accent2: "#73ffb8", chip: "rgba(45,212,168,.16)" },
    cover: g("#2dd4a855", "#73ffb844", "#0a0f0d"),
    buttons: ["Book a free trial", "Personal training · From ₹4k", "Class schedule this week"],
    products: [
      { name: "1-Mo Elite", price: "₹4,999", hue: "#2dd4a8" },
      { name: "PT · 8 Sessions", price: "₹12k", hue: "#73ffb8" },
      { name: "Yoga Sunrise", price: "₹2,499", hue: "#4ade80" },
    ],
    gallery: [g("#2dd4a855", "#73ffb844", "#122019"), g("#4ade8055", "#2dd4a855", "#0f1a15"), g("#73ffb844", "#2dd4a833", "#0a0f0d")],
  },
  {
    id: "third-wave",
    themeName: "Artisan Paper",
    category: "Cafe",
    views: "43K",
    business: { name: "Third Wave Coffee", handle: "@thirdwave.blr", tagline: "Single origin · Indiranagar", initial: "T", location: "Bengaluru" },
    palette: { bg: "#f5f0e8", surface: "#ffffff", text: "#3a2418", subtext: "#8b6f5e", accent: "#8b5a2b", accent2: "#c9954a", chip: "rgba(139,90,43,.14)" },
    cover: g("#8b5a2b33", "#c9954a44", "#f5f0e8"),
    buttons: ["Order pickup", "Beans · Ethiopia Yirgacheffe", "Barista course · Sat"],
    products: [
      { name: "V60 Pour Over", price: "₹280", hue: "#8b5a2b" },
      { name: "Cortado", price: "₹220", hue: "#c9954a" },
      { name: "Ethiopian 250g", price: "₹850", hue: "#6a4020" },
    ],
    gallery: [g("#8b5a2b33", "#c9954a33", "#ede0ce"), g("#c9954a33", "#e8c07a44", "#f5e8d0"), g("#6a402022", "#8b5a2b33", "#f5f0e8")],
  },
  {
    id: "taj-lands-end",
    themeName: "Suite Onyx",
    category: "Hotel",
    views: "112K",
    business: { name: "Taj Lands End", handle: "@tajlandsend", tagline: "Bandra · Sea view suites", initial: "T", location: "Mumbai" },
    palette: { bg: "#0d0d0d", surface: "#1a1a1a", text: "#fff", subtext: "#f0d78c", accent: "#c9a84c", accent2: "#f0d78c", chip: "rgba(201,168,76,.16)" },
    cover: g("#c9a84c55", "#f0d78c33", "#0d0d0d"),
    buttons: ["Check availability · Dec", "Suite upgrades", "Dining reservations"],
    products: [
      { name: "Sea View Suite", price: "₹42k/night", hue: "#c9a84c" },
      { name: "Spa · 90 min", price: "₹8,500", hue: "#f0d78c" },
      { name: "Chef's Table", price: "₹12k", hue: "#a08a3a" },
    ],
    gallery: [g("#c9a84c33", "#f0d78c22", "#1a1a1a"), g("#f0d78c33", "#c9a84c33", "#242220"), g("#a08a3a22", "#c9a84c22", "#0d0d0d")],
  },
  {
    id: "aakash",
    themeName: "Campus Bright",
    category: "School",
    views: "31K",
    business: { name: "Aakash Institute", handle: "@aakash.jaipur", tagline: "NEET · JEE · Foundation", initial: "A", location: "Jaipur" },
    palette: { bg: "#eef4ff", surface: "#ffffff", text: "#0f1b3d", subtext: "#3b6fa0", accent: "#3b6fa0", accent2: "#1e3a5f", chip: "rgba(59,111,160,.12)" },
    cover: g("#3b6fa044", "#1e3a5f33", "#eef4ff"),
    buttons: ["Enroll · 2026 batch", "Take a mock test", "Talk to a counsellor"],
    products: [
      { name: "NEET Repeater", price: "₹1.4L", hue: "#3b6fa0" },
      { name: "JEE Foundation", price: "₹85k", hue: "#1e3a5f" },
      { name: "Weekend Batch", price: "₹42k", hue: "#5a8ac0" },
    ],
    gallery: [g("#3b6fa033", "#1e3a5f22", "#dfeaf8"), g("#5a8ac033", "#3b6fa033", "#e5edf7"), g("#1e3a5f22", "#3b6fa022", "#eef4ff")],
  },
  {
    id: "byjus",
    themeName: "Study Focus",
    category: "Coaching",
    views: "76K",
    business: { name: "Vedantu Live", handle: "@vedantu", tagline: "Live 1-on-1 · Class 6-12", initial: "V", location: "Bengaluru" },
    palette: { bg: "#0f0f1e", surface: "#1b1b30", text: "#fff", subtext: "#c8c4ff", accent: "#4f46e5", accent2: "#a78bfa", chip: "rgba(79,70,229,.2)" },
    cover: g("#4f46e555", "#a78bfa55", "#0f0f1e"),
    buttons: ["Book a free demo", "Download syllabus PDF", "Talk to a mentor"],
    products: [
      { name: "1-on-1 · 3 mo", price: "₹24k", hue: "#4f46e5" },
      { name: "Crash Course", price: "₹9,900", hue: "#a78bfa" },
      { name: "Mock Test Pack", price: "₹1,499", hue: "#7c6df2" },
    ],
    gallery: [g("#4f46e555", "#a78bfa44", "#141428"), g("#a78bfa55", "#4f46e555", "#1b1b30"), g("#7c6df255", "#4f46e544", "#0f0f1e")],
  },
  {
    id: "apollo",
    themeName: "Care Trust",
    category: "Hospital",
    views: "205K",
    business: { name: "Apollo Cradle", handle: "@apollocradle", tagline: "Women & Children · Jubilee Hills", initial: "A", location: "Hyderabad" },
    palette: { bg: "#f0f6ff", surface: "#ffffff", text: "#0c2340", subtext: "#4a6a8a", accent: "#0c5fb8", accent2: "#5cbdb9", chip: "rgba(12,95,184,.1)" },
    cover: g("#0c5fb833", "#5cbdb933", "#f0f6ff"),
    buttons: ["Emergency · +91 40 2360 7777", "Book OPD appointment", "Health check packages"],
    products: [
      { name: "OPD Consult", price: "₹700", hue: "#0c5fb8" },
      { name: "Master Health", price: "₹9,900", hue: "#5cbdb9" },
      { name: "Antenatal Package", price: "₹42k", hue: "#3a8ab0" },
    ],
    gallery: [g("#0c5fb833", "#5cbdb933", "#e5eff8"), g("#5cbdb933", "#a0d1d155", "#eaf3f8"), g("#3a8ab033", "#0c5fb822", "#f0f6ff")],
  },
  {
    id: "lodha",
    themeName: "Estate Grand",
    category: "Real Estate",
    views: "58K",
    business: { name: "Lodha Altamount", handle: "@lodha.altamount", tagline: "Ultra-luxury · South Mumbai", initial: "L", location: "Mumbai" },
    palette: { bg: "#0d1210", surface: "#1a2220", text: "#fff", subtext: "#c0d0c8", accent: "#5a8a5c", accent2: "#a0c49d", chip: "rgba(90,138,92,.16)" },
    cover: g("#5a8a5c55", "#a0c49d44", "#0d1210"),
    buttons: ["Schedule a site visit", "Download brochure", "Talk to a sales lead"],
    products: [
      { name: "4 BHK · 4200 sqft", price: "₹32 Cr", hue: "#5a8a5c" },
      { name: "Penthouse Duplex", price: "₹78 Cr", hue: "#a0c49d" },
      { name: "Sky Villa", price: "₹1.2K Cr", hue: "#7ab080" },
    ],
    gallery: [g("#5a8a5c55", "#a0c49d33", "#141c19"), g("#a0c49d44", "#5a8a5c44", "#1a2220"), g("#7ab08044", "#5a8a5c33", "#0d1210")],
  },
  {
    id: "makemytrip",
    themeName: "Wander Sky",
    category: "Travel",
    views: "142K",
    business: { name: "Wanderworks Kerala", handle: "@wanderworks", tagline: "Backwaters & hills · 8 days", initial: "W", location: "Kochi" },
    palette: { bg: "#e8f4f0", surface: "#ffffff", text: "#0a2a24", subtext: "#4a7a70", accent: "#2d9e7e", accent2: "#5cd1a8", chip: "rgba(45,158,126,.12)" },
    cover: g("#2d9e7e44", "#5cd1a844", "#e8f4f0"),
    buttons: ["Kerala 8D/7N · ₹42k pp", "Custom itinerary", "WhatsApp our planner"],
    products: [
      { name: "Alleppey Houseboat", price: "₹18k", hue: "#2d9e7e" },
      { name: "Munnar Retreat", price: "₹24k", hue: "#5cd1a8" },
      { name: "Kochi Food Walk", price: "₹2,400", hue: "#3ab090" },
    ],
    gallery: [g("#2d9e7e44", "#5cd1a833", "#daeee7"), g("#5cd1a844", "#2d9e7e33", "#e0f0ea"), g("#3ab09033", "#2d9e7e33", "#e8f4f0")],
  },
  {
    id: "webengage",
    themeName: "Studio Aurora",
    category: "Digital Agency",
    views: "39K",
    business: { name: "Talented Studio", handle: "@talented", tagline: "Brand · Web · Motion · Delhi", initial: "T", location: "Delhi" },
    palette: { bg: "#0b0b12", surface: "#171727", text: "#fff", subtext: "#d0c8ff", accent: "#ff6b35", accent2: "#6c5ce7", chip: "rgba(255,107,53,.18)" },
    cover: g("#ff6b3555", "#6c5ce755", "#0b0b12"),
    buttons: ["Start a project", "Case studies · 42", "Retainer packages"],
    products: [
      { name: "Brand Sprint", price: "₹4.8L", hue: "#ff6b35" },
      { name: "Website Build", price: "₹8.4L", hue: "#6c5ce7" },
      { name: "Motion Retainer", price: "₹2.4L/mo", hue: "#e84393" },
    ],
    gallery: [g("#ff6b3555", "#6c5ce744", "#14141f"), g("#6c5ce755", "#ff6b3544", "#171727"), g("#e8439355", "#ff6b3544", "#0b0b12")],
  },
  {
    id: "larsen",
    themeName: "Concrete Bold",
    category: "Construction",
    views: "22K",
    business: { name: "Nirman Builders", handle: "@nirmanbuilders", tagline: "Turnkey villas · Pune", initial: "N", location: "Pune" },
    palette: { bg: "#1a1a1a", surface: "#2a2a2a", text: "#fff", subtext: "#e0d5c5", accent: "#e85d3a", accent2: "#a04020", chip: "rgba(232,93,58,.16)" },
    cover: g("#e85d3a55", "#a0402044", "#1a1a1a"),
    buttons: ["Get a project quote", "Ongoing projects · 14", "Meet the founders"],
    products: [
      { name: "Villa Build · sqft", price: "₹2,800", hue: "#e85d3a" },
      { name: "Interior Turnkey", price: "₹1,400", hue: "#a04020" },
      { name: "Structural Audit", price: "₹85k", hue: "#c04a2a" },
    ],
    gallery: [g("#e85d3a44", "#a0402033", "#242220"), g("#a0402044", "#e85d3a33", "#2a2a2a"), g("#c04a2a33", "#e85d3a33", "#1a1a1a")],
  },
  {
    id: "khaitan",
    themeName: "Chamber Ink",
    category: "Law Firm",
    views: "18K",
    business: { name: "Khaitan & Co Advisory", handle: "@khaitanadvisory", tagline: "Corporate · M&A · Delhi", initial: "K", location: "Delhi" },
    palette: { bg: "#0f1b3d", surface: "#1a2a55", text: "#fff", subtext: "#c0d0e8", accent: "#e8edf3", accent2: "#5a8ac0", chip: "rgba(232,237,243,.14)" },
    cover: g("#5a8ac055", "#1a2a5555", "#0f1b3d"),
    buttons: ["Request a consultation", "Practice areas", "Download firm profile"],
    products: [
      { name: "M&A Advisory", price: "On request", hue: "#5a8ac0" },
      { name: "Corporate Retainer", price: "₹4L/mo", hue: "#e8edf3" },
      { name: "Compliance Audit", price: "₹1.8L", hue: "#3a6a90" },
    ],
    gallery: [g("#5a8ac033", "#1a2a5533", "#152048"), g("#e8edf322", "#5a8ac044", "#1a2a55"), g("#3a6a9033", "#5a8ac033", "#0f1b3d")],
  },
  {
    id: "goonj",
    themeName: "Hope Warm",
    category: "NGO",
    views: "34K",
    business: { name: "Goonj India", handle: "@goonj", tagline: "Dignity for all · Since 1999", initial: "G", location: "Delhi" },
    palette: { bg: "#faf6ee", surface: "#ffffff", text: "#5c2018", subtext: "#a06848", accent: "#d4842a", accent2: "#9b4423", chip: "rgba(212,132,42,.14)" },
    cover: g("#d4842a44", "#9b442344", "#faf6ee"),
    buttons: ["Donate ₹500 · monthly", "Volunteer with us", "Impact reports 2025"],
    products: [
      { name: "Cloth Drive", price: "Volunteer", hue: "#d4842a" },
      { name: "Flood Relief", price: "₹2,500", hue: "#9b4423" },
      { name: "School Kits", price: "₹1,200", hue: "#b06030" },
    ],
    gallery: [g("#d4842a44", "#9b442333", "#f0e6d0"), g("#9b442344", "#d4842a44", "#f5ecdc"), g("#b0603033", "#d4842a33", "#faf6ee")],
  },
  {
    id: "sabyasachi",
    themeName: "Couture Noir",
    category: "Fashion",
    views: "310K",
    business: { name: "Aza Fashions", handle: "@azafashions", tagline: "Designer couture · Mumbai", initial: "A", location: "Mumbai" },
    palette: { bg: "#f8e8ee", surface: "#ffffff", text: "#3a1a2a", subtext: "#8a5a70", accent: "#c9a0dc", accent2: "#9b72cf", chip: "rgba(201,160,220,.18)" },
    cover: g("#c9a0dc55", "#9b72cf44", "#f8e8ee"),
    buttons: ["Shop Diwali edit '26", "Book a stylist", "Bridal appointments"],
    products: [
      { name: "Anarkali Set", price: "₹68k", hue: "#c9a0dc" },
      { name: "Lehenga · Bridal", price: "₹2.4L", hue: "#9b72cf" },
      { name: "Silk Saree", price: "₹32k", hue: "#b088d0" },
    ],
    gallery: [g("#c9a0dc55", "#9b72cf44", "#f0dae4"), g("#9b72cf44", "#c9a0dc44", "#f5e0e8"), g("#b088d044", "#c9a0dc44", "#f8e8ee")],
  },
  {
    id: "croma",
    themeName: "Tech Slate",
    category: "Electronics",
    views: "89K",
    business: { name: "Croma Retail", handle: "@croma", tagline: "Electronics superstore · India", initial: "C", location: "Mumbai" },
    palette: { bg: "#0a0a1a", surface: "#141432", text: "#fff", subtext: "#a8b8e8", accent: "#4f46e5", accent2: "#22d3ee", chip: "rgba(79,70,229,.2)" },
    cover: g("#4f46e555", "#22d3ee44", "#0a0a1a"),
    buttons: ["iPhone 16 Pro · from ₹1.19L", "Diwali deals · up to 40%", "EMI options"],
    products: [
      { name: "iPhone 16 Pro", price: "₹1.19L", hue: "#4f46e5" },
      { name: "Sony WH-1000XM6", price: "₹32k", hue: "#22d3ee" },
      { name: "MacBook Air M4", price: "₹1.14L", hue: "#3a8ac0" },
    ],
    gallery: [g("#4f46e555", "#22d3ee33", "#111128"), g("#22d3ee55", "#4f46e544", "#141432"), g("#3a8ac055", "#4f46e544", "#0a0a1a")],
  },
  {
    id: "urban-ladder",
    themeName: "Warm Oak",
    category: "Furniture",
    views: "47K",
    business: { name: "Urban Ladder", handle: "@urbanladder", tagline: "Solid wood · Handcrafted", initial: "U", location: "Bengaluru" },
    palette: { bg: "#faf8f5", surface: "#ffffff", text: "#3a2418", subtext: "#8b6f5e", accent: "#c9b99a", accent2: "#8b7355", chip: "rgba(139,115,85,.14)" },
    cover: g("#c9b99a55", "#8b735544", "#faf8f5"),
    buttons: ["Shop the Diwali edit", "Design consultation · free", "Visit Bengaluru studio"],
    products: [
      { name: "Oak 6-Seater", price: "₹84k", hue: "#8b7355" },
      { name: "Sofa · L-Shape", price: "₹1.2L", hue: "#c9b99a" },
      { name: "Bedframe · King", price: "₹58k", hue: "#a08a70" },
    ],
    gallery: [g("#c9b99a55", "#8b735544", "#f0ebe0"), g("#8b735544", "#c9b99a44", "#f5f0e8"), g("#a08a7044", "#8b735544", "#faf8f5")],
  },
  {
    id: "bhuvan-bam",
    themeName: "Creator Neon",
    category: "Creator",
    views: "620K",
    business: { name: "Prajakta Koli", handle: "@mostlysane", tagline: "Creator · 8M+ · Mumbai", initial: "P", location: "Mumbai" },
    palette: { bg: "#0d0d0d", surface: "#1a1a1a", text: "#fff", subtext: "#ffd6a5", accent: "#ff6b35", accent2: "#ffeb3b", chip: "rgba(255,107,53,.2)" },
    cover: g("#ff6b3555", "#ffeb3b44", "#0d0d0d"),
    buttons: ["Watch latest podcast", "Book me for a brand deal", "My Amazon storefront"],
    products: [
      { name: "MostlySane Merch", price: "₹899", hue: "#ff6b35" },
      { name: "Podcast · Ep 42", price: "Watch", hue: "#ffeb3b" },
      { name: "Brand Kit · Rate", price: "On req.", hue: "#e88a3a" },
    ],
    gallery: [g("#ff6b3555", "#ffeb3b44", "#151510"), g("#ffeb3b44", "#ff6b3544", "#1a1a1a"), g("#e88a3a44", "#ff6b3544", "#0d0d0d")],
  },
];

const INDUSTRIES: (Industry | "All")[] = [
  "All",
  "Jewellery",
  "Restaurant",
  "Doctor",
  "Salon",
  "Gym",
  "Cafe",
  "Hotel",
  "School",
  "Coaching",
  "Hospital",
  "Real Estate",
  "Travel",
  "Digital Agency",
  "Construction",
  "Law Firm",
  "NGO",
  "Fashion",
  "Electronics",
  "Furniture",
  "Creator",
];

// ============================================================================
// Mini bio preview — used inside cards, modal, and 3-device sync section
// ============================================================================

function BioPreview({ theme, density = "card" }: { theme: ThemeCard; density?: "card" | "full" }) {
  const p = theme.palette;
  const isFull = density === "full";
  const pad = isFull ? 20 : 12;
  const nameSize = isFull ? 18 : 13;
  const media = mediaForCategory(theme.category);
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: p.bg, color: p.text }}
    >
      {/* Cover — real photography with palette overlay */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: isFull ? 120 : 72 }}>
        <img
          src={media.cover}
          alt={`${theme.business.name} cover`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: theme.cover, mixBlendMode: "multiply", opacity: 0.55 }} />
        {/* owner puck */}
        <div
          className="absolute -bottom-6 left-4 grid place-items-center overflow-hidden rounded-2xl font-bold shadow-lg"
          style={{
            width: isFull ? 56 : 42,
            height: isFull ? 56 : 42,
            background: p.surface,
            color: p.accent,
            fontSize: isFull ? 22 : 16,
            border: `2px solid ${p.bg}`,
          }}
        >
          <img
            src={media.owner}
            alt={`${theme.business.name} owner`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
        {/* verified pill */}
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold backdrop-blur"
          style={{ background: "rgba(0,0,0,.35)", color: "#fff" }}
        >
          <BadgeCheck size={isFull ? 12 : 10} strokeWidth={2.5} />
          Verified
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-2" style={{ padding: pad, paddingTop: pad + 10 }}>
        <div className="mt-2">
          <div className="font-bold leading-tight" style={{ fontSize: nameSize }}>
            {theme.business.name}
          </div>
          <div style={{ color: p.subtext, fontSize: isFull ? 12 : 10 }}>{theme.business.tagline}</div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5">
          {theme.buttons.slice(0, isFull ? 3 : 2).map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-3 font-semibold"
              style={{
                background: i === 0 ? p.accent : p.surface,
                color: i === 0 ? p.bg : p.text,
                height: isFull ? 42 : 30,
                fontSize: isFull ? 12 : 10,
                boxShadow: i === 0 ? `0 8px 20px -8px ${p.accent}88` : "none",
              }}
            >
              <span className="truncate">{label}</span>
              <span aria-hidden>→</span>
            </div>
          ))}
        </div>

        {/* Products grid — real product photography */}
        <div className="grid grid-cols-3 gap-1.5">
          {theme.products.map((prod, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg p-1.5"
              style={{ background: p.surface }}
            >
              <div
                className="mb-1 overflow-hidden rounded"
                style={{ height: isFull ? 40 : 26 }}
              >
                <img
                  src={media.products[i % media.products.length]}
                  alt={prod.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="truncate font-semibold" style={{ fontSize: isFull ? 10 : 8 }}>{prod.name}</div>
              <div style={{ color: p.subtext, fontSize: isFull ? 9 : 7 }}>{prod.price}</div>
            </div>
          ))}
        </div>

        {/* Gallery strip — real category photography */}
        <div className="grid grid-cols-3 gap-1.5">
          {theme.gallery.map((_bg, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg"
              style={{ height: isFull ? 44 : 26 }}
            >
              <img
                src={media.gallery[i % media.gallery.length]}
                alt={`${theme.business.name} gallery ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// SECTION 1 — Theme Gallery with tilt + modal
// ============================================================================

function TiltCard({
  theme,
  onOpen,
}: {
  theme: ThemeCard;
  onOpen: (t: ThemeCard) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxs = useSpring(rx, { stiffness: 180, damping: 18 });
  const rys = useSpring(ry, { stiffness: 180, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ry.set(x * 12);
    rx.set(-y * 12);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={() => onOpen(theme)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="group relative block h-full w-full text-left [transform-style:preserve-3d] [perspective:1000px]"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <motion.div
        style={{ rotateX: rxs, rotateY: rys, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-3 backdrop-blur-md"
      >
        {/* border glow on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: "0 0 0 1px rgba(255,107,53,.5), 0 30px 80px -30px rgba(255,107,53,.45)" }} />
        {/* shine sweep */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        <div className="relative aspect-[9/13] w-full overflow-hidden rounded-2xl">
          <BioPreview theme={theme} />
        </div>

        <div className="flex items-center justify-between px-1 pt-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{theme.themeName}</div>
            <div className="text-xs text-white/50">{theme.category}</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80">
            <Sparkles size={10} /> {theme.views} views
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}

function ThemeModal({ theme, onClose }: { theme: ThemeCard | null; onClose: () => void }) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [mode, setMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (!theme) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [theme, onClose]);

  return (
    <AnimatePresence>
      {theme && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative flex h-[min(92vh,860px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12121c] to-[#0b0b12]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
              <div className="min-w-0">
                <div className="text-lg font-bold text-white">{theme.themeName}</div>
                <div className="text-xs text-white/60">{theme.business.name} · {theme.category} · {theme.business.location}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SegBar>
                  <SegBtn active={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={14} /> Desktop</SegBtn>
                  <SegBtn active={device === "tablet"} onClick={() => setDevice("tablet")}><Tablet size={14} /> Tablet</SegBtn>
                  <SegBtn active={device === "mobile"} onClick={() => setDevice("mobile")}><Phone size={14} /> Mobile</SegBtn>
                </SegBar>
                <SegBar>
                  <SegBtn active={mode === "light"} onClick={() => setMode("light")}><Sun size={14} /> Light</SegBtn>
                  <SegBtn active={mode === "dark"} onClick={() => setMode("dark")}><Moon size={14} /> Dark</SegBtn>
                </SegBar>
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Stage */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6"
              style={{
                background: mode === "dark"
                  ? "radial-gradient(80% 60% at 50% 0%, rgba(255,107,53,.12), transparent 60%), #0a0a12"
                  : "radial-gradient(80% 60% at 50% 0%, rgba(255,107,53,.08), transparent 60%), #f5f5f8",
              }}>
              <DeviceFrame device={device}>
                <BioPreview theme={mode === "light" ? withLight(theme) : theme} density="full" />
              </DeviceFrame>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function withLight(theme: ThemeCard): ThemeCard {
  // Only invert if the theme is dark; otherwise keep as-is.
  if (theme.palette.bg[1] !== "0" && theme.palette.bg[1] !== "1") return theme;
  return {
    ...theme,
    palette: {
      ...theme.palette,
      bg: "#f6f7fb",
      surface: "#ffffff",
      text: "#0d1220",
      subtext: "#5a6b83",
    },
  };
}

function SegBar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">{children}</div>;
}
function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-white text-black shadow" : "text-white/70 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function DeviceFrame({ device, children }: { device: "desktop" | "tablet" | "mobile"; children: React.ReactNode }) {
  const dims =
    device === "desktop"
      ? { w: 780, h: 480, radius: 14, bezel: 12 }
      : device === "tablet"
      ? { w: 480, h: 640, radius: 28, bezel: 18 }
      : { w: 260, h: 540, radius: 40, bezel: 12 };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="relative shrink-0"
      style={{
        width: dims.w,
        height: dims.h,
        maxWidth: "92vw",
        maxHeight: "72vh",
        borderRadius: dims.radius + 8,
        padding: dims.bezel,
        background: "linear-gradient(180deg, #1a1a24, #0d0d14)",
        boxShadow: "0 40px 100px -30px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.06)",
      }}
    >
      <div className="relative h-full w-full overflow-hidden bg-black" style={{ borderRadius: dims.radius }}>
        {children}
      </div>
      {device === "desktop" && <div className="mx-auto mt-2 h-1.5 w-24 rounded-full bg-white/10" />}
    </motion.div>
  );
}

// ============================================================================
// SECTION 4 — Feature Highlights
// ============================================================================

const FEATURES = [
  { icon: BadgeCheck, label: "Verified Business", hue: "#2dd4a8" },
  { icon: MessageCircle, label: "WhatsApp Integration", hue: "#25d366" },
  { icon: ShoppingBag, label: "Products & Cart", hue: "#ff6b35" },
  { icon: Wallet, label: "Payment Gateway", hue: "#6c5ce7" },
  { icon: QrCode, label: "UPI QR Payments", hue: "#22d3ee" },
  { icon: Calendar, label: "Booking Engine", hue: "#e84393" },
  { icon: Globe, label: "Custom Domain", hue: "#f0d78c" },
  { icon: Code2, label: "HTML Widgets", hue: "#a78bfa" },
  { icon: BarChart3, label: "Live Analytics", hue: "#5cbdb9" },
  { icon: FileText, label: "Forms & Leads", hue: "#ff8fab" },
  { icon: ImageIcon, label: "Gallery Studio", hue: "#c9a84c" },
  { icon: Palette, label: "Theme Studio", hue: "#e85d3a" },
];

// ============================================================================
// Utilities
// ============================================================================

function useCount(target: number, active: boolean, duration = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return n;
}

function useMagnet(strength = 0.35) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xs = useSpring(x, { stiffness: 220, damping: 18 });
  const ys = useSpring(y, { stiffness: 220, damping: 18 });
  const bind = {
    onMouseMove: (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      x.set(((e.clientX - (r.left + r.width / 2)) * strength));
      y.set(((e.clientY - (r.top + r.height / 2)) * strength));
    },
    onMouseLeave: () => {
      x.set(0);
      y.set(0);
    },
  };
  return { ref, style: { x: xs, y: ys }, bind };
}

function PremiumButton({ children, variant = "primary", onClick }: { children: React.ReactNode; variant?: "primary" | "ghost"; onClick?: () => void }) {
  const m = useMagnet();
  return (
    <motion.button
      ref={m.ref}
      onClick={onClick}
      {...m.bind}
      style={m.style}
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold ${
        variant === "primary"
          ? "text-white shadow-[0_20px_50px_-15px_rgba(255,107,53,.6)]"
          : "border border-white/15 bg-white/5 text-white backdrop-blur-md"
      }`}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 -z-0 rounded-full" style={{ background: "linear-gradient(135deg, #ff6b35, #e84393 55%, #6c5ce7)" }} />
      )}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

// ============================================================================
// SECTION 5 — Before / After slider
// ============================================================================

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  const move = (clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(4, Math.min(96, p)));
  };

  useEffect(() => {
    const mm = (e: MouseEvent) => dragging.current && move(e.clientX);
    const tm = (e: TouchEvent) => dragging.current && move(e.touches[0].clientX);
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-black select-none"
      onMouseDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        move(e.touches[0].clientX);
      }}
    >
      {/* Right = After */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 30% 20%, rgba(255,107,53,.35), transparent 60%), radial-gradient(80% 60% at 70% 80%, rgba(108,92,231,.35), transparent 60%), #0b0b12" }}>
        <AfterPreview />
      </div>
      {/* Left = Before, clipped by pos */}
      <div className="absolute inset-0 bg-[#f5f5f7] text-black" style={{ clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)` }}>
        <BeforePreview />
      </div>
      {/* labels */}
      <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white/90">Regular Bio Link</div>
      <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">ZUPIX Link Studio</div>

      {/* Handle */}
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/60" />
        <div className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-black shadow-[0_10px_30px_rgba(0,0,0,.4)]">
            <span className="text-xl">⇔</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeforePreview() {
  return (
    <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-3 p-8">
      <div className="h-16 w-16 rounded-full bg-neutral-300" />
      <div className="text-sm font-semibold">@yourbrand</div>
      <div className="text-xs text-neutral-500">personal bio link</div>
      <div className="w-full space-y-2 pt-2">
        {["Website", "Instagram", "YouTube", "Latest post"].map((l) => (
          <div key={l} className="flex h-10 items-center justify-center rounded-md border border-neutral-300 bg-white text-sm">{l}</div>
        ))}
      </div>
    </div>
  );
}
function AfterPreview() {
  const theme = THEMES[0];
  return (
    <div className="mx-auto flex h-full max-w-md items-center justify-center p-6">
      <div className="h-full max-h-[520px] w-full max-w-[300px] overflow-hidden rounded-[36px] border-8 border-[#1a1a22] bg-black shadow-2xl">
        <BioPreview theme={theme} density="full" />
      </div>
    </div>
  );
}

// ============================================================================
// The Showcase root
// ============================================================================

export function LandingShowcase() {
  const [industry, setIndustry] = useState<Industry | "All">("All");
  const [openTheme, setOpenTheme] = useState<ThemeCard | null>(null);
  const [selectedForDevices, setSelectedForDevices] = useState<ThemeCard>(THEMES[0]);

  const filtered = useMemo(
    () => (industry === "All" ? THEMES : THEMES.filter((t) => t.category === industry)),
    [industry],
  );

  return (
    <div id="showcase" className="reveal-on-scroll relative bg-[#0a0a12] text-white">
      <style>{`
        @keyframes zx-float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        @keyframes zx-drift { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-6px,8px) } }
      `}</style>

      {/* Ambient gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-70"
        style={{
          background:
            "radial-gradient(50% 60% at 20% 0%, rgba(255,107,53,.18), transparent 60%), radial-gradient(50% 60% at 80% 10%, rgba(108,92,231,.18), transparent 60%)",
        }}
      />

      <SectionHeader
        kicker="Section 01 · Live Theme Gallery"
        title={<>Twenty <em className="font-serif italic text-[#ff8a5c]">real</em> themes. Every one a mini website.</>}
        sub="Not screenshots — live, interactive previews. Hover to feel the weight. Click any theme to open a fullscreen device sandbox."
      />

      {/* Section 2 — Industry chips */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center gap-2">
          {INDUSTRIES.map((ind) => {
            const active = industry === ind;
            return (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`group relative rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="chip-active"
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="absolute inset-0 rounded-full border border-white/15"
                    style={{ background: "linear-gradient(135deg, #ff6b35, #e84393 60%, #6c5ce7)" }}
                  />
                )}
                {!active && <span className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04]" />}
                <span className="relative">{ind}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1 — grid */}
      <div className="mx-auto mt-8 max-w-7xl px-4">
        <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
              >
                <TiltCard
                  theme={t}
                  onOpen={(theme) => {
                    setOpenTheme(theme);
                    setSelectedForDevices(theme);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-white/60">
            No themes in this industry yet — more shipping every week.
          </div>
        )}
      </div>

      {/* Section 3 — Live device preview */}
      <SectionHeader
        kicker="Section 03 · Live Device Preview"
        title={<>Design once. <em className="font-serif italic text-[#ff8a5c]">Perfect</em> on every device.</>}
        sub="Pick any theme above — all three devices update in real time with spring-loaded transitions."
      />
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {THEMES.slice(0, 8).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedForDevices(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedForDevices.id === t.id
                  ? "border-[#ff6b35] bg-[#ff6b35]/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
              }`}
            >
              {t.business.name}
            </button>
          ))}
        </div>
        <div className="grid items-end gap-6 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 lg:grid-cols-[1.4fr_1fr_0.7fr]">
          <DeviceCase kind="desktop" theme={selectedForDevices} />
          <DeviceCase kind="tablet" theme={selectedForDevices} />
          <DeviceCase kind="mobile" theme={selectedForDevices} />
        </div>
      </div>

      {/* Section 4 — Feature highlights */}
      <SectionHeader
        kicker="Section 04 · Feature Highlights"
        title={<>Everything a modern business needs, <em className="font-serif italic text-[#ff8a5c]">already built in</em>.</>}
        sub="Twelve floating capabilities — payments, WhatsApp, forms, analytics — that make a bio link feel like a full storefront."
      />
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.label} icon={f.icon} label={f.label} hue={f.hue} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* Section 5 — Before/After */}
      <SectionHeader
        kicker="Section 05 · Before vs After"
        title={<>See the <em className="font-serif italic text-[#ff8a5c]">difference</em>. Drag the handle.</>}
        sub="One column is a normal bio link. The other is what your customers see with ZUPIX Link Studio."
      />
      <div className="mx-auto max-w-6xl px-4">
        <BeforeAfter />
      </div>

      {/* Section 6 — Why ZUPIX bento */}
      <SectionHeader
        kicker="Section 06 · Why ZUPIX"
        title={<>Built for <em className="font-serif italic text-[#ff8a5c]">real</em> Indian businesses.</>}
        sub="A studio, not a template gallery. Every surface is engineered for speed, trust and conversion."
      />
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
          <BentoCard className="md:col-span-2 md:row-span-2" title="Enterprise-grade builder" desc="Drag-and-drop, 25+ block types, multi-select, undo/redo, keyboard shortcuts." icon={Layers} big>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {THEMES.slice(0, 6).map((t) => (
                <div key={t.id} className="aspect-[9/13] overflow-hidden rounded-lg"><BioPreview theme={t} /></div>
              ))}
            </div>
          </BentoCard>
          <BentoCard title="UPI native" desc="Razorpay & UPI QR pre-integrated." icon={Wallet}>
            <QrIllustration />
          </BentoCard>
          <BentoCard title="Custom domain" desc="Point yourbrand.in in minutes." icon={Globe}>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs">
              <div className="text-white/50">CNAME</div>
              <div>yourbrand.in → zupix.link</div>
              <div className="mt-2 text-emerald-400">✓ SSL provisioned</div>
            </div>
          </BentoCard>
          <BentoCard title="60 FPS builder" desc="GPU-accelerated interactions everywhere." icon={Zap}>
            <div className="mt-4 flex items-end gap-1">
              {[24, 48, 32, 60, 44, 60, 52, 60].map((h, i) => (
                <div key={i} className="w-2 rounded bg-gradient-to-t from-[#ff6b35] to-[#e84393]" style={{ height: h }} />
              ))}
            </div>
          </BentoCard>
          <BentoCard title="Verified profiles" desc="A trust badge customers recognise." icon={BadgeCheck}>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300 w-fit">
              <Check size={12} /> Verified business
            </div>
          </BentoCard>
        </div>
      </div>

      {/* Section 7 — Live stats */}
      <StatsSection />

      {/* CTA */}
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h3 className="text-4xl font-bold leading-tight sm:text-5xl">
          Ready to build a bio link that <span className="bg-gradient-to-r from-[#ff6b35] via-[#e84393] to-[#6c5ce7] bg-clip-text text-transparent">actually converts</span>?
        </h3>
        <p className="max-w-xl text-white/60">Start with any of the 20 themes above. Publish in minutes. Upgrade whenever you need custom domains, teams or white-label.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PremiumButton>Start building free →</PremiumButton>
          <PremiumButton variant="ghost">Browse all themes</PremiumButton>
        </div>
      </div>

      <ThemeModal theme={openTheme} onClose={() => setOpenTheme(null)} />
    </div>
  );
}

function SectionHeader({ kicker, title, sub }: { kicker: string; title: React.ReactNode; sub: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <div ref={ref} className="mx-auto max-w-4xl px-4 pb-10 pt-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
          {kicker}
        </div>
        <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-5xl" style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}>
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 sm:text-base">{sub}</p>
      </motion.div>
    </div>
  );
}

function DeviceCase({ kind, theme }: { kind: "desktop" | "tablet" | "mobile"; theme: ThemeCard }) {
  const dims =
    kind === "desktop" ? { w: "100%", h: 340, radius: 14, bezel: 10, label: "Desktop · 1440" } :
    kind === "tablet" ? { w: "100%", h: 340, radius: 22, bezel: 14, label: "Tablet · 820" } :
    { w: "100%", h: 340, radius: 30, bezel: 10, label: "Mobile · 390" };
  const inner: CSSProperties = { borderRadius: dims.radius, background: "#000" };
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-full"
        style={{
          maxWidth: kind === "desktop" ? 640 : kind === "tablet" ? 380 : 220,
          height: dims.h,
          padding: dims.bezel,
          borderRadius: dims.radius + 8,
          background: "linear-gradient(180deg, #1a1a24, #0d0d14)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.06)",
        }}
      >
        <div className="relative h-full w-full overflow-hidden" style={inner}>
          <AnimatePresence mode="wait">
            <motion.div
              key={theme.id + kind}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="h-full w-full"
            >
              <BioPreview theme={theme} density={kind === "desktop" ? "full" : "card"} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="text-[11px] font-medium uppercase tracking-widest text-white/50">{dims.label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, label, hue, delay }: { icon: typeof Zap; label: string; hue: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
      style={{ animation: `zx-float 6s ease-in-out ${delay}s infinite` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(80% 60% at 50% 0%, ${hue}30, transparent 60%)` }}
      />
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${hue}20`, color: hue, boxShadow: `inset 0 0 0 1px ${hue}40` }}>
        <Icon size={20} />
      </div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="mt-1 text-[11px] text-white/50">Ready · zero setup</div>
    </motion.div>
  );
}

function BentoCard({
  className = "",
  title,
  desc,
  icon: Icon,
  children,
  big = false,
}: {
  className?: string;
  title: string;
  desc: string;
  icon: typeof Zap;
  children?: React.ReactNode;
  big?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 backdrop-blur ${className}`}
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full opacity-60"
        style={{ background: "radial-gradient(closest-side, rgba(255,107,53,.25), transparent)" }} />
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80"><Icon size={16} /></div>
        <div className={`font-semibold ${big ? "text-xl" : "text-base"}`}>{title}</div>
      </div>
      <div className="max-w-sm text-sm text-white/60">{desc}</div>
      {children}
    </motion.div>
  );
}

function QrIllustration() {
  // deterministic 6x6 pattern (SSR-safe)
  const pat = "101101011010110110011001110011010110110110011001101101";
  return (
    <div className="mt-4 grid h-24 w-24 grid-cols-6 gap-[3px] rounded-xl bg-white p-2">
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={i} className="rounded-[2px]" style={{ background: pat[i % pat.length] === "1" ? "#0a0a12" : "transparent" }} />
      ))}
    </div>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const stats = [
    { label: "Themes", n: 20, suffix: "+" },
    { label: "Profiles", n: 5600, suffix: "+" },
    { label: "Businesses", n: 250, suffix: "+" },
    { label: "Products listed", n: 4200, suffix: "+" },
    { label: "Gallery images", n: 9800, suffix: "+" },
    { label: "Forms served", n: 6400, suffix: "+" },
    { label: "Monthly views", n: 75000, suffix: "+" },
  ];
  return (
    <div ref={ref} className="mx-auto max-w-7xl px-4 pt-24">
      <SectionHeader
        kicker="Section 07 · Live stats"
        title={<>Real numbers. Real <em className="font-serif italic text-[#ff8a5c]">businesses</em>. Live from India.</>}
        sub="Stats reset and count on scroll. Every counter reflects real production data across the ZUPIX network."
      />
      <ResponsiveStatsGrid className="lg:grid-cols-7">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} target={s.n} active={inView} suffix={s.suffix} />
        ))}
      </ResponsiveStatsGrid>
    </div>
  );
}

function StatTile({ label, target, active, suffix }: { label: string; target: number; active: boolean; suffix: string }) {
  const n = useCount(target, active);
  const display = n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1000 ? Math.round(n / 100) / 10 + "K"
    : String(n);
  return (
    <ResponsiveStatCard
      label={label}
      value={`${display}${suffix}`}
      className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] text-white"
      valueClassName="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent"
    />
  );
}


export default LandingShowcase;
