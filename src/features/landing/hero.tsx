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
import { PORTRAITS, COVERS } from "./demo-media";
import { ResponsiveStatCard, ResponsiveStatsGrid } from "./responsive-stat";

/* ────────────────────────────────────────────────────────── demo content */

import { PRODUCTS } from "./demo-media";
import { Instagram, Youtube, Facebook, Phone, MapPin, Clock, Heart } from "lucide-react";

type Review = { name: string; photo: string; stars: number; text: string };
type Product = { name: string; price: string; image: string };
type Social = { icon: typeof Instagram; handle: string };

type Demo = {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  description: string;
  gradient: string;
  accent: string;
  icon: typeof Gem;
  chips: string[];
  actions: { label: string; sub: string }[];
  featured: { title: string; meta: string };
  avatar: string;
  cover: string;
  rating: number;
  reviewsCount: number;
  hours: string;
  domain: string;
  upi: string;
  services: string[];
  products: Product[];
  gallery: string[];
  reviews: Review[];
  socials: Social[];
};

const DEMOS: Demo[] = [
  {
    id: "jewellery",
    name: "Kalyan Heritage",
    handle: "@kalyanheritage",
    tagline: "Handcrafted 22K jewellery · Mumbai",
    description: "Family-run bridal & everyday gold since 1974. BIS-hallmarked, lifetime buy-back, in-house designers.",
    gradient: "linear-gradient(160deg,#ff6b35 0%,#e84393 55%,#0b0b12 100%)",
    accent: "#ff6b35",
    icon: Gem,
    chips: ["Bridal", "22K Gold", "BIS Hallmark"],
    actions: [
      { label: "Book a private viewing", sub: "Bandra flagship" },
      { label: "Shop bridal collection", sub: "New this week" },
    ],
    featured: { title: "Diwali Edit ’26", meta: "Live drop · ₹48,900 onwards" },
    avatar: PORTRAITS.jewellerOwner,
    cover: COVERS.jewellery,
    rating: 4.9, reviewsCount: 2148,
    hours: "Open · 10 AM – 9 PM",
    domain: "kalyan.link",
    upi: "kalyan@hdfcbank",
    services: ["Bridal consult", "Custom design", "Old-gold exchange", "Insurance"],
    products: [
      { name: "Polki choker", price: "₹1,84,000", image: PRODUCTS.jewellery },
      { name: "Temple haaram", price: "₹96,500", image: PRODUCTS.fashion },
      { name: "Kundan set", price: "₹1,24,000", image: PRODUCTS.jewellery },
      { name: "Uncut studs", price: "₹42,900", image: PRODUCTS.fashion },
    ],
    gallery: [COVERS.jewellery, COVERS.fashion, PRODUCTS.jewellery],
    reviews: [
      { name: "Meera S.", photo: PORTRAITS.meera, stars: 5, text: "Bridal set was breathtaking. Fittings were perfect." },
      { name: "Ayesha K.", photo: PORTRAITS.ayesha, stars: 5, text: "Genuine 22K, honest weight — trusted for years." },
    ],
    socials: [
      { icon: Instagram, handle: "@kalyanheritage" },
      { icon: Youtube, handle: "Kalyan Heritage" },
      { icon: Facebook, handle: "kalyanheritage" },
    ],
  },
  {
    id: "restaurant",
    name: "Bombay Canteen",
    handle: "@bombaycanteen",
    tagline: "Modern Indian · Kala Ghoda",
    description: "Regional Indian plates reimagined with seasonal produce and small-batch spirits. Chef Thomas Zacharias.",
    gradient: "linear-gradient(160deg,#e84393 0%,#6c5ce7 60%,#0b0b12 100%)",
    accent: "#e84393",
    icon: Utensils,
    chips: ["Zomato Gold", "Chef’s table", "Vegan"],
    actions: [
      { label: "Reserve a table", sub: "Tonight · 8:30 PM" },
      { label: "Order on Swiggy", sub: "Free delivery" },
    ],
    featured: { title: "Monsoon tasting menu", meta: "7 courses · ₹2,400 pp" },
    avatar: PORTRAITS.chefRestaurant,
    cover: COVERS.restaurant,
    rating: 4.8, reviewsCount: 3821,
    hours: "Open · 12 PM – 1 AM",
    domain: "bombaycanteen.in",
    upi: "canteen@icici",
    services: ["Reservations", "Private dining", "Curated tastings", "Corporate events"],
    products: [
      { name: "Monsoon thali", price: "₹1,150", image: PRODUCTS.food },
      { name: "Kokum sour", price: "₹520", image: PRODUCTS.coffee },
      { name: "Goan pulled pork", price: "₹780", image: PRODUCTS.food },
      { name: "Ragi malpua", price: "₹360", image: PRODUCTS.food },
    ],
    gallery: [COVERS.restaurant, COVERS.cafe, PRODUCTS.food],
    reviews: [
      { name: "Rohan D.", photo: PORTRAITS.rohan, stars: 5, text: "The thali is a love letter to the coast. Service impeccable." },
      { name: "Kavya M.", photo: PORTRAITS.kavya, stars: 5, text: "Best cocktails in Mumbai. Warli-inspired plates are unreal." },
    ],
    socials: [
      { icon: Instagram, handle: "@bombaycanteen" },
      { icon: Facebook, handle: "bombaycanteen" },
    ],
  },
  {
    id: "doctor",
    name: "Dr. Ananya Rao",
    handle: "@dranyarao",
    tagline: "Dermatologist · MBBS, MD",
    description: "Fortis-affiliated dermatologist & cosmetologist. Evidence-based skin, hair & laser care since 2011.",
    gradient: "linear-gradient(160deg,#6c5ce7 0%,#4f46e5 60%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: Stethoscope,
    chips: ["15+ yrs", "Fortis", "Verified"],
    actions: [
      { label: "Book consultation", sub: "Video · ₹1,200" },
      { label: "Skincare protocols", sub: "Guided plans" },
    ],
    featured: { title: "Slot open · Sat 11:00", meta: "Bandra clinic · in-person" },
    avatar: PORTRAITS.drAnanya,
    cover: COVERS.doctor,
    rating: 4.9, reviewsCount: 987,
    hours: "Open · Mon–Sat · 10 AM – 7 PM",
    domain: "drananyarao.in",
    upi: "clinic@axis",
    services: ["Acne care", "Laser hair removal", "PRP for hair", "Chemical peels", "Anti-ageing"],
    products: [
      { name: "Skin audit", price: "₹1,200", image: PRODUCTS.salonKit },
      { name: "PRP session", price: "₹6,500", image: PRODUCTS.salonKit },
    ],
    gallery: [COVERS.doctor, COVERS.salon],
    reviews: [
      { name: "Nisha P.", photo: PORTRAITS.nisha, stars: 5, text: "Cleared my hormonal acne in 4 months. Honest, patient, kind." },
      { name: "Arjun R.", photo: PORTRAITS.arjun, stars: 5, text: "Best hair PRP experience — visible results by session 3." },
    ],
    socials: [
      { icon: Instagram, handle: "@dranyarao" },
      { icon: Youtube, handle: "Dr. Ananya Rao" },
    ],
  },
  {
    id: "school",
    name: "Sunrise Academy",
    handle: "@sunriseacademy",
    tagline: "CBSE · Pre-K to Grade 12",
    description: "Inquiry-based CBSE school on 8 acres in Baner, Pune. STEM labs, performing arts, 1:14 teacher ratio.",
    gradient: "linear-gradient(160deg,#ff6b35 0%,#f59e0b 55%,#0b0b12 100%)",
    accent: "#f59e0b",
    icon: GraduationCap,
    chips: ["Admissions ’26", "Scholarships", "STEM"],
    actions: [
      { label: "Apply for admission", sub: "Grade 1 – 8" },
      { label: "Virtual campus tour", sub: "10 min walk-through" },
    ],
    featured: { title: "Open house — Sunday", meta: "Pune campus · 10 AM" },
    avatar: PORTRAITS.teacher,
    cover: COVERS.school,
    rating: 4.7, reviewsCount: 512,
    hours: "Admissions office · 9 AM – 5 PM",
    domain: "sunrise.edu.in",
    upi: "fees@sunrise",
    services: ["Pre-primary", "Primary", "Middle school", "Senior secondary", "Boarding"],
    products: [
      { name: "Admission form", price: "₹2,000", image: PRODUCTS.books },
      { name: "Prospectus", price: "Free", image: PRODUCTS.books },
    ],
    gallery: [COVERS.school, COVERS.coaching],
    reviews: [
      { name: "Priya K.", photo: PORTRAITS.priya, stars: 5, text: "My daughter thrives here. Real focus on curiosity." },
      { name: "Vikram S.", photo: PORTRAITS.vikram, stars: 5, text: "Excellent STEM program. Transparent leadership." },
    ],
    socials: [
      { icon: Instagram, handle: "@sunriseacademy" },
      { icon: Facebook, handle: "sunriseacademypune" },
    ],
  },
  {
    id: "salon",
    name: "Studio Lakmé Pro",
    handle: "@studiolakmepro",
    tagline: "Luxury salon & spa · Juhu",
    description: "Signature colour bar, keratin lab, and bridal suite. L’Oréal Colour Trophy 2025 finalists.",
    gradient: "linear-gradient(160deg,#e84393 0%,#f472b6 55%,#0b0b12 100%)",
    accent: "#f472b6",
    icon: Sparkles,
    chips: ["Bridal", "Colour bar", "Keratin"],
    actions: [
      { label: "Book an appointment", sub: "Today · 5 slots open" },
      { label: "Bridal packages", sub: "From ₹18,000" },
    ],
    featured: { title: "Free consultation this week", meta: "Colour · cut · care" },
    avatar: PORTRAITS.salonOwner,
    cover: COVERS.salon,
    rating: 4.8, reviewsCount: 1642,
    hours: "Open · 10 AM – 9 PM · Daily",
    domain: "studiolakme.pro",
    upi: "studio@kotak",
    services: ["Hair colour", "Keratin", "Bridal makeup", "Facials", "Manicure"],
    products: [
      { name: "Signature blowout", price: "₹2,400", image: PRODUCTS.salonKit },
      { name: "Global colour", price: "₹7,800", image: PRODUCTS.salonKit },
      { name: "Bridal trial", price: "₹8,500", image: PRODUCTS.fashion },
      { name: "Keratin treatment", price: "₹12,000", image: PRODUCTS.salonKit },
    ],
    gallery: [COVERS.salon, COVERS.fashion, PRODUCTS.salonKit],
    reviews: [
      { name: "Anaya G.", photo: PORTRAITS.anaya, stars: 5, text: "Colour turned out exactly like the reference. Loved it." },
      { name: "Kavya M.", photo: PORTRAITS.kavya, stars: 5, text: "Bridal team was calm and precise on the big day." },
    ],
    socials: [
      { icon: Instagram, handle: "@studiolakmepro" },
      { icon: Youtube, handle: "Studio Lakmé Pro" },
    ],
  },
  {
    id: "hotel",
    name: "Taj Colaba Suites",
    handle: "@tajcolabasuites",
    tagline: "Heritage boutique hotel · South Mumbai",
    description: "42 suites overlooking the Gateway. Butler service, rooftop infinity pool, Michelin-recommended dining.",
    gradient: "linear-gradient(160deg,#0ea5e9 0%,#6c5ce7 55%,#0b0b12 100%)",
    accent: "#38bdf8",
    icon: Globe2,
    chips: ["5★", "Heritage", "Sea-view"],
    actions: [
      { label: "Book a suite", sub: "From ₹18,900 / night" },
      { label: "Weekend packages", sub: "Includes brunch" },
    ],
    featured: { title: "Monsoon escape · 20% off", meta: "Fri–Sun · 3-night stays" },
    avatar: PORTRAITS.rehan,
    cover: COVERS.hotel,
    rating: 4.9, reviewsCount: 5218,
    hours: "Reception · 24 × 7",
    domain: "tajcolaba.in",
    upi: "reservations@taj",
    services: ["Butler", "Spa", "Airport pickup", "Fine dining", "Concierge"],
    products: [
      { name: "Sea-view suite", price: "₹18,900", image: PRODUCTS.travel },
      { name: "Presidential", price: "₹94,000", image: PRODUCTS.travel },
      { name: "Sunday brunch", price: "₹3,200", image: PRODUCTS.food },
      { name: "Spa journey 90 min", price: "₹6,800", image: PRODUCTS.salonKit },
    ],
    gallery: [COVERS.hotel, COVERS.restaurant, PRODUCTS.travel],
    reviews: [
      { name: "Rajesh N.", photo: PORTRAITS.rajesh, stars: 5, text: "Old-world charm, faultless service. Butler remembered our tea." },
      { name: "Farhan A.", photo: PORTRAITS.farhan, stars: 5, text: "The rooftop pool at sunset is a religious experience." },
    ],
    socials: [
      { icon: Instagram, handle: "@tajcolabasuites" },
      { icon: Facebook, handle: "tajcolabasuites" },
    ],
  },
  {
    id: "realestate",
    name: "Lodha Skyline",
    handle: "@lodhaskyline",
    tagline: "Sea-view residences · Worli",
    description: "RERA-registered 3 & 4 BHK sky-homes on Worli sea-face. 42nd–70th floor, ready to move.",
    gradient: "linear-gradient(160deg,#0ea5e9 0%,#6c5ce7 55%,#0b0b12 100%)",
    accent: "#38bdf8",
    icon: Hospital,
    chips: ["3 / 4 BHK", "Ready to move", "RERA"],
    actions: [
      { label: "Download brochure", sub: "PDF · 24 MB" },
      { label: "Book site visit", sub: "Chauffeur pickup" },
    ],
    featured: { title: "₹6.8 Cr onwards", meta: "42nd floor sea-face" },
    avatar: PORTRAITS.realEstate,
    cover: COVERS.realestate,
    rating: 4.6, reviewsCount: 214,
    hours: "Sales gallery · 10 AM – 8 PM",
    domain: "lodhaskyline.in",
    upi: "sales@lodha",
    services: ["Site visit", "Home loan desk", "Interior design", "NRI concierge"],
    products: [
      { name: "3 BHK Signature", price: "₹6.8 Cr", image: PRODUCTS.furniture },
      { name: "4 BHK Sky Villa", price: "₹12.4 Cr", image: PRODUCTS.furniture },
    ],
    gallery: [COVERS.realestate, COVERS.furniture],
    reviews: [
      { name: "Karan T.", photo: PORTRAITS.karan, stars: 5, text: "Handover was on time, finishes are premium." },
      { name: "Priya K.", photo: PORTRAITS.priyaKapoor, stars: 4, text: "Views are stunning. Amenities well maintained." },
    ],
    socials: [
      { icon: Instagram, handle: "@lodhaskyline" },
      { icon: Facebook, handle: "lodhaskyline" },
    ],
  },
  {
    id: "travel",
    name: "Wanderer & Co.",
    handle: "@wandererco",
    tagline: "Curated small-group travel · India + Asia",
    description: "Slow, small-group journeys across Ladakh, Kerala, Bhutan and Japan. Max 12 travellers per trip.",
    gradient: "linear-gradient(160deg,#22d3ee 0%,#0ea5e9 55%,#0b0b12 100%)",
    accent: "#22d3ee",
    icon: Globe2,
    chips: ["Small group", "IATA", "1000+ trips"],
    actions: [
      { label: "See ’26 departures", sub: "12 curated trips" },
      { label: "Talk to a planner", sub: "Free 20-min call" },
    ],
    featured: { title: "Ladakh · Aug ’26", meta: "9 nights · 3 seats left" },
    avatar: PORTRAITS.travelAgent,
    cover: COVERS.travel,
    rating: 4.9, reviewsCount: 1284,
    hours: "Planners · 10 AM – 7 PM · Mon–Sat",
    domain: "wanderer.co.in",
    upi: "trips@wanderer",
    services: ["Group tours", "Honeymoons", "Bespoke itineraries", "Visa assist"],
    products: [
      { name: "Ladakh · 9N", price: "₹1,48,000", image: PRODUCTS.travel },
      { name: "Kerala · 7N", price: "₹92,000", image: PRODUCTS.travel },
      { name: "Bhutan · 6N", price: "₹1,26,000", image: PRODUCTS.travel },
      { name: "Japan · 12N", price: "₹3,84,000", image: PRODUCTS.travel },
    ],
    gallery: [COVERS.travel, COVERS.hotel, PRODUCTS.travel],
    reviews: [
      { name: "Aditya B.", photo: PORTRAITS.aditya, stars: 5, text: "Ladakh trip was perfectly paced. Local guides were brilliant." },
      { name: "Meera S.", photo: PORTRAITS.meera, stars: 5, text: "The honeymoon in Bhutan blew us away. Every detail sorted." },
    ],
    socials: [
      { icon: Instagram, handle: "@wandererco" },
      { icon: Youtube, handle: "Wanderer & Co." },
    ],
  },
  {
    id: "gym",
    name: "Iron Republic",
    handle: "@ironrepublic",
    tagline: "Strength gym & coaching · HSR Layout",
    description: "10,000 sq ft strength & conditioning gym. Certified coaches, powerlifting rack row, recovery lounge.",
    gradient: "linear-gradient(160deg,#f59e0b 0%,#ef4444 55%,#0b0b12 100%)",
    accent: "#f59e0b",
    icon: HardHat,
    chips: ["24/7", "Powerlifting", "Recovery"],
    actions: [
      { label: "Book a free trial", sub: "60-min session" },
      { label: "1-on-1 coaching", sub: "8-week programs" },
    ],
    featured: { title: "New: recovery lounge", meta: "Ice bath · sauna · Normatec" },
    avatar: PORTRAITS.gymTrainer,
    cover: COVERS.gym,
    rating: 4.9, reviewsCount: 942,
    hours: "Open · 24 × 7",
    domain: "ironrepublic.fit",
    upi: "iron@yesbank",
    services: ["Strength", "Personal training", "Nutrition", "Physio", "Recovery"],
    products: [
      { name: "Monthly pass", price: "₹3,800", image: PRODUCTS.gymPass },
      { name: "Quarterly", price: "₹9,600", image: PRODUCTS.gymPass },
      { name: "1-on-1 · 12 sessions", price: "₹22,000", image: PRODUCTS.gymPass },
      { name: "Nutrition + training", price: "₹28,000", image: PRODUCTS.gymPass },
    ],
    gallery: [COVERS.gym, PRODUCTS.gymPass],
    reviews: [
      { name: "Farhan A.", photo: PORTRAITS.farhan, stars: 5, text: "Squatted my first 100kg here. Coaches actually coach." },
      { name: "Nisha P.", photo: PORTRAITS.nisha, stars: 5, text: "Cleanest strength gym in Bengaluru. No ego, all effort." },
    ],
    socials: [
      { icon: Instagram, handle: "@ironrepublic" },
      { icon: Youtube, handle: "Iron Republic" },
    ],
  },
  {
    id: "cafe",
    name: "Blue Tokai",
    handle: "@bluetokaicafe",
    tagline: "Single-origin coffee · Roasted daily",
    description: "India’s largest specialty coffee roaster. 38 cafés, farm-direct beans from Chikmagalur & Coorg.",
    gradient: "linear-gradient(160deg,#f59e0b 0%,#ff6b35 55%,#0b0b12 100%)",
    accent: "#f59e0b",
    icon: Sparkles,
    chips: ["Roastery", "Filter", "Beans"],
    actions: [
      { label: "Order beans (250g)", sub: "Ships pan-India" },
      { label: "Find a café near you", sub: "38 locations" },
    ],
    featured: { title: "Ethiopia Guji · Natural", meta: "Notes: peach, jasmine, cocoa" },
    avatar: PORTRAITS.cafeOwner,
    cover: COVERS.cafe,
    rating: 4.7, reviewsCount: 6218,
    hours: "Open · 8 AM – 10 PM · Daily",
    domain: "bluetokai.link",
    upi: "cafe@bluetokai",
    services: ["Dine-in", "Bean subscription", "Brewing workshops", "Wholesale"],
    products: [
      { name: "Ethiopia Guji · 250g", price: "₹850", image: PRODUCTS.coffee },
      { name: "Attikan Estate · 500g", price: "₹1,240", image: PRODUCTS.coffee },
      { name: "Cold brew (4-pack)", price: "₹640", image: PRODUCTS.coffee },
      { name: "Filter kit", price: "₹2,900", image: PRODUCTS.coffee },
    ],
    gallery: [COVERS.cafe, COVERS.coffee, PRODUCTS.coffee],
    reviews: [
      { name: "Rohan D.", photo: PORTRAITS.rohan, stars: 5, text: "Guji is my daily driver — fruity, clean, consistent." },
      { name: "Ayesha K.", photo: PORTRAITS.ayesha, stars: 5, text: "The Bandra café is my second office. Baristas are gold." },
    ],
    socials: [
      { icon: Instagram, handle: "@bluetokaicoffee" },
      { icon: Youtube, handle: "Blue Tokai Coffee" },
    ],
  },
  {
    id: "electronics",
    name: "Croma Elite",
    handle: "@cromaelite",
    tagline: "Premium electronics & smart home · Delhi NCR",
    description: "Authorised premium reseller for Apple, Sony, Dyson, Bose. 7-day price-match, in-home installation.",
    gradient: "linear-gradient(160deg,#0ea5e9 0%,#22d3ee 55%,#0b0b12 100%)",
    accent: "#22d3ee",
    icon: Sparkles,
    chips: ["Apple ASP", "Sony Elite", "Dyson"],
    actions: [
      { label: "Shop iPhone 16 Pro", sub: "In stock · 256GB" },
      { label: "Book in-home demo", sub: "Sony · Bose · Dyson" },
    ],
    featured: { title: "iPhone 16 Pro · from ₹1,19,900", meta: "0% EMI · same-day delivery" },
    avatar: PORTRAITS.vikram,
    cover: COVERS.electronics,
    rating: 4.8, reviewsCount: 3210,
    hours: "Open · 10 AM – 10 PM",
    domain: "cromaelite.in",
    upi: "shop@croma",
    services: ["Same-day delivery", "In-home install", "AppleCare+", "Trade-in"],
    products: [
      { name: "iPhone 16 Pro · 256GB", price: "₹1,34,900", image: PRODUCTS.electronics },
      { name: "MacBook Air M3", price: "₹1,14,900", image: PRODUCTS.electronics },
      { name: "Sony WH-1000XM6", price: "₹34,990", image: PRODUCTS.electronics },
      { name: "Dyson V15 Detect", price: "₹66,900", image: PRODUCTS.electronics },
    ],
    gallery: [COVERS.electronics, PRODUCTS.electronics],
    reviews: [
      { name: "Karan T.", photo: PORTRAITS.karan, stars: 5, text: "Installed the Sony bar the same evening. Price-matched too." },
      { name: "Arjun R.", photo: PORTRAITS.arjun, stars: 5, text: "iPhone activation and data transfer in 15 minutes. Smooth." },
    ],
    socials: [
      { icon: Instagram, handle: "@cromaelite" },
      { icon: Facebook, handle: "cromaelite" },
    ],
  },
  {
    id: "furniture",
    name: "Studio Pepperfry",
    handle: "@studiopepperfry",
    tagline: "Design-led furniture · Bengaluru",
    description: "Hand-finished solid wood furniture and modular systems. 15-year warranty, white-glove delivery.",
    gradient: "linear-gradient(160deg,#a78bfa 0%,#6c5ce7 55%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: HardHat,
    chips: ["Solid wood", "Custom size", "15 yr warranty"],
    actions: [
      { label: "Browse living room", sub: "148 pieces" },
      { label: "Free design consult", sub: "Book a home visit" },
    ],
    featured: { title: "New: Kyoto collection", meta: "Sheesham · walnut finish" },
    avatar: PORTRAITS.architect,
    cover: COVERS.furniture,
    rating: 4.6, reviewsCount: 1876,
    hours: "Studio · 11 AM – 8 PM · Daily",
    domain: "studiopepperfry.in",
    upi: "shop@pepperfry",
    services: ["Free design", "Custom sizing", "White-glove delivery", "Buyback"],
    products: [
      { name: "Kyoto 3-seater", price: "₹68,000", image: PRODUCTS.furniture },
      { name: "Osaka bed · King", price: "₹94,500", image: PRODUCTS.furniture },
      { name: "Zen dining · 6", price: "₹1,18,000", image: PRODUCTS.furniture },
      { name: "Study desk", price: "₹32,900", image: PRODUCTS.furniture },
    ],
    gallery: [COVERS.furniture, PRODUCTS.furniture],
    reviews: [
      { name: "Ananya D.", photo: PORTRAITS.ananya, stars: 5, text: "Craftsmanship is genuinely premium. Delivery team was careful." },
      { name: "Rehan S.", photo: PORTRAITS.rehan, stars: 5, text: "Kyoto sofa is stunning. Design team helped us pick fabric." },
    ],
    socials: [
      { icon: Instagram, handle: "@studiopepperfry" },
      { icon: Youtube, handle: "Studio Pepperfry" },
    ],
  },
  {
    id: "agency",
    name: "Studio North",
    handle: "@studionorth",
    tagline: "Brand & digital · Bengaluru",
    description: "A 14-person studio building brands, sites and products for climate & consumer teams.",
    gradient: "linear-gradient(160deg,#6c5ce7 0%,#e84393 60%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: Palette,
    chips: ["Awwwards", "Framer", "Since 2018"],
    actions: [
      { label: "Start a project", sub: "Reply within 24h" },
      { label: "See recent work", sub: "12 case studies" },
    ],
    featured: { title: "Currently booking Q1 ’27", meta: "2 slots remaining" },
    avatar: PORTRAITS.fashionDesigner,
    cover: COVERS.agency,
    rating: 5.0, reviewsCount: 82,
    hours: "Studio · 10 AM – 7 PM · Mon–Fri",
    domain: "studionorth.co",
    upi: "hello@studionorth",
    services: ["Brand identity", "Web design", "Motion", "Product design"],
    products: [
      { name: "Brand sprint · 2 wks", price: "₹4,80,000", image: PRODUCTS.books },
      { name: "Website · 6 wks", price: "₹12,00,000", image: PRODUCTS.books },
    ],
    gallery: [COVERS.agency, COVERS.creator],
    reviews: [
      { name: "Priya K.", photo: PORTRAITS.priyaKapoor, stars: 5, text: "Best studio we’ve worked with. Sharp thinking, gorgeous craft." },
      { name: "Rajesh N.", photo: PORTRAITS.rajesh, stars: 5, text: "Rebrand landed perfectly. Sales up 34% in Q1." },
    ],
    socials: [
      { icon: Instagram, handle: "@studionorth" },
      { icon: Youtube, handle: "Studio North" },
    ],
  },
  {
    id: "law",
    name: "Mehta & Associates",
    handle: "@mehtalaw",
    tagline: "Corporate & tax law · Delhi",
    description: "Full-service corporate, M&A and tax advisory. Chambers-ranked partners, 40+ lawyer team.",
    gradient: "linear-gradient(160deg,#1e3a5f 0%,#6c5ce7 55%,#0b0b12 100%)",
    accent: "#a78bfa",
    icon: ShieldCheck,
    chips: ["Chambers", "M&A", "GST"],
    actions: [
      { label: "Request a consult", sub: "Confidential intake" },
      { label: "Latest advisories", sub: "Compliance briefs" },
    ],
    featured: { title: "Union Budget ’26 note", meta: "Impact on start-ups · PDF" },
    avatar: PORTRAITS.mehtaLawyer,
    cover: COVERS.law,
    rating: 4.9, reviewsCount: 168,
    hours: "Chambers · 10 AM – 7 PM · Mon–Fri",
    domain: "mehtalaw.in",
    upi: "accounts@mehta",
    services: ["Corporate", "M&A", "Tax", "Litigation", "IP"],
    products: [
      { name: "30-min consult", price: "₹8,500", image: PRODUCTS.books },
      { name: "Retainer · monthly", price: "₹1,25,000", image: PRODUCTS.books },
    ],
    gallery: [COVERS.law, COVERS.construction],
    reviews: [
      { name: "Vikram S.", photo: PORTRAITS.vikram, stars: 5, text: "Handled our Series B closing flawlessly. Sharp, responsive." },
      { name: "Karan T.", photo: PORTRAITS.karan, stars: 5, text: "The best tax mind I’ve worked with. Saved us 22% last year." },
    ],
    socials: [
      { icon: Instagram, handle: "@mehtalaw" },
      { icon: Facebook, handle: "mehtalaw" },
    ],
  },
  {
    id: "creator",
    name: "Priya Kapoor",
    handle: "@priyakapoor",
    tagline: "Design creator · 842K community",
    description: "Weekly essays on design systems, careers and craft. 92K newsletter readers, YouTube 640K.",
    gradient: "linear-gradient(160deg,#e84393 0%,#ff6b35 55%,#0b0b12 100%)",
    accent: "#e84393",
    icon: Star,
    chips: ["YouTube", "Substack", "Store"],
    actions: [
      { label: "Join the newsletter", sub: "Weekly · 92K readers" },
      { label: "Design system pack", sub: "₹1,999 · lifetime" },
    ],
    featured: { title: "New drop · Bento kit v3", meta: "780 sold this week" },
    avatar: PORTRAITS.priyaKapoor,
    cover: COVERS.creator,
    rating: 5.0, reviewsCount: 2189,
    hours: "Newsletter drops · every Tue · 9 AM",
    domain: "priyakapoor.design",
    upi: "priya@upi",
    services: ["Newsletter", "Courses", "Design system packs", "1:1 mentoring"],
    products: [
      { name: "Bento Kit v3", price: "₹1,999", image: PRODUCTS.books },
      { name: "Career playbook", price: "₹1,499", image: PRODUCTS.books },
      { name: "Portfolio review", price: "₹8,000", image: PRODUCTS.books },
      { name: "Design system course", price: "₹6,999", image: PRODUCTS.books },
    ],
    gallery: [COVERS.creator, COVERS.agency],
    reviews: [
      { name: "Ayesha K.", photo: PORTRAITS.ayesha, stars: 5, text: "Bento kit paid for itself in one project. Excellent." },
      { name: "Aditya B.", photo: PORTRAITS.aditya, stars: 5, text: "Career playbook helped me land a senior role. Thank you." },
    ],
    socials: [
      { icon: Instagram, handle: "@priyakapoor.design" },
      { icon: Youtube, handle: "Priya Kapoor" },
    ],
  },
  {
    id: "ngo",
    name: "Ekta Foundation",
    handle: "@ektafoundation",
    tagline: "Girl-child education · Rajasthan",
    description: "12(A) & 80G registered. Sponsors education for 4,800 girls across 62 villages since 2014.",
    gradient: "linear-gradient(160deg,#22c55e 0%,#0ea5e9 55%,#0b0b12 100%)",
    accent: "#22c55e",
    icon: Heart,
    chips: ["80G", "Verified", "10 yrs"],
    actions: [
      { label: "Sponsor a girl", sub: "₹1,500 / month" },
      { label: "One-time donation", sub: "Any amount · secure" },
    ],
    featured: { title: "62 new admissions this term", meta: "4,800 girls in school" },
    avatar: PORTRAITS.ngoFounder,
    cover: COVERS.coaching,
    rating: 4.9, reviewsCount: 1284,
    hours: "Office · 10 AM – 6 PM · Mon–Sat",
    domain: "ekta.ngo",
    upi: "donate@ekta",
    services: ["Sponsor a child", "One-time donations", "CSR partnerships", "Volunteer"],
    products: [
      { name: "Monthly sponsorship", price: "₹1,500", image: PRODUCTS.books },
      { name: "One school kit", price: "₹2,400", image: PRODUCTS.books },
      { name: "Annual scholarship", price: "₹18,000", image: PRODUCTS.books },
    ],
    gallery: [COVERS.coaching, COVERS.school],
    reviews: [
      { name: "Meera S.", photo: PORTRAITS.meera, stars: 5, text: "Transparent updates every quarter. My sponsored girl just finished Grade 10." },
      { name: "Rajesh N.", photo: PORTRAITS.rajesh, stars: 5, text: "Genuine work. Field visit was eye-opening." },
    ],
    socials: [
      { icon: Instagram, handle: "@ektafoundation" },
      { icon: Facebook, handle: "ektafoundation" },
    ],
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

function formatCompactCount(n: number, suffix?: string) {
  const ending = suffix ?? "";
  if (n >= 1_000_000) {
    const value = n / 1_000_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}M${ending}`;
  }
  if (n >= 1_000) {
    const value = n / 1_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}K${ending}`;
  }
  return `${n}${ending}`;
}

function formatFullCount(n: string, suffix?: string) {
  return `${n}${suffix ?? ""}`;
}

function Stat({
  label,
  target,
  suffix,
  icon: Icon,
}: {
  label: string;
  target: number;
  suffix?: string;
  icon?: typeof BadgeCheck;
}) {
  const v = useCountUp(target);
  return (
    <ResponsiveStatCard
      icon={Icon}
      label={label}
      iconClassName="text-[#ff6b35]"
      className="text-white transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07]"
      value={
        <>
          <span className="landing-stat-compact-value">{formatCompactCount(v, suffix)}</span>
          <span className="landing-stat-full-value">{formatFullCount(v.toLocaleString("en-IN"), suffix)}</span>
        </>
      }
    />
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
  // rotating in-screen live activity toast
  const toasts = useMemo(() => {
    // Deterministic UPI amount per demo — must match on SSR and client to avoid hydration mismatch.
    const seed = demo.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const upiAmount = ((seed % 40) + 4) * 100;
    return [
      { icon: IndianRupee, tone: "#22c55e", title: `UPI ₹${upiAmount} received`, sub: demo.upi },
      { icon: MessageCircle, tone: "#22d3ee", title: "New WhatsApp order", sub: `${demo.name} · 2 items` },
      { icon: Eye, tone: "#a78bfa", title: "+128 profile views", sub: "last 5 minutes" },
      { icon: BellRing, tone: "#f59e0b", title: "New booking", sub: demo.actions[0]?.sub ?? "Today" },
      { icon: Heart, tone: "#e84393", title: "New follower", sub: demo.handle },
    ];
  }, [demo]);

  const [tIdx, setTIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTIdx((i) => (i + 1) % toasts.length), 2200);
    return () => window.clearInterval(t);
  }, [toasts.length]);
  const toast = toasts[tIdx];
  const ToastIcon = toast.icon;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: demo.gradient }}>
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.7) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Status bar */}
      <div className="absolute inset-x-0 top-2.5 z-20 flex items-center justify-between px-6 text-[10px] font-semibold text-white/85">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="ml-1 rounded-sm border border-white/60 px-1 text-[8px] leading-[10px]">92</span>
        </span>
      </div>

      {/* Scrollable content */}
      <div
        className="relative h-full overflow-y-auto pb-6 pt-11 text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ animation: "zx-feed-scroll 22s ease-in-out infinite" }}
      >
        <div className="px-4">
          {/* URL bar */}
          <div className="mb-3 flex items-center justify-between text-[9.5px] font-medium text-white/70">
            <span className="rounded-full bg-black/30 px-2 py-[3px] backdrop-blur">{demo.domain}</span>
            <span className="rounded-full bg-white/15 px-2 py-[3px] backdrop-blur">Share</span>
          </div>

          {/* Cover */}
          <div className="relative mb-0 h-24 w-full overflow-hidden rounded-t-2xl border border-white/15">
            <img src={demo.cover} alt="" className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Avatar + verified pulse */}
          <div className="relative -mt-8 mb-3 flex items-end gap-3 px-1">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/80 bg-white shadow-[0_10px_30px_-8px_rgba(0,0,0,.5)]">
              <img src={demo.avatar} alt={demo.name} className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
            </div>
            <div className="relative mt-1 min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-[14px] font-semibold leading-tight">{demo.name}</span>
                <span className="relative inline-flex h-3.5 w-3.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22d3ee] opacity-60" />
                  <BadgeCheck className="relative h-3.5 w-3.5 text-[#22d3ee]" fill="currentColor" />
                </span>
              </div>
              <div className="truncate text-[10.5px] text-white/75">{demo.tagline}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/70">
                <span className="flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-[#fbbf24] text-[#fbbf24]" /> {demo.rating}
                </span>
                <span>· {demo.reviewsCount.toLocaleString("en-IN")} reviews</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mb-3 text-[10.5px] leading-snug text-white/75">{demo.description}</p>

          {/* Hours */}
          <div className="mb-3 flex items-center gap-1.5 text-[10px] text-white/80">
            <Clock className="h-3 w-3 text-[#22c55e]" />
            <span className="font-medium">{demo.hours}</span>
          </div>

          {/* Action rail: WA / Call / Directions / UPI */}
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {[
              { icon: MessageCircle, label: "WhatsApp", tone: "#22c55e" },
              { icon: Phone, label: "Call", tone: "#38bdf8" },
              { icon: MapPin, label: "Directions", tone: "#f472b6" },
              { icon: IndianRupee, label: "Pay UPI", tone: "#f59e0b" },
            ].map((a) => {
              const AI = a.icon;
              return (
                <button
                  key={a.label}
                  type="button"
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 py-2 backdrop-blur"
                >
                  <span
                    className="grid h-6 w-6 place-items-center rounded-lg"
                    style={{ background: `${a.tone}30`, color: a.tone }}
                  >
                    <AI className="h-3 w-3" />
                  </span>
                  <span className="text-[8.5px] font-semibold">{a.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chips */}
          <div className="mb-3 flex flex-wrap gap-1">
            {demo.chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/25 bg-white/10 px-2 py-[2px] text-[9.5px] font-medium backdrop-blur"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Featured */}
          <div className="mb-3 overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 p-2.5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <img src={demo.gallery[0] ?? demo.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold">{demo.featured.title}</div>
                <div className="truncate text-[9.5px] text-white/70">{demo.featured.meta}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-3 space-y-1.5">
            {demo.actions.map((a) => (
              <div
                key={a.label}
                className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/12 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.25)] backdrop-blur"
              >
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold">{a.label}</div>
                  <div className="truncate text-[9.5px] text-white/70">{a.sub}</div>
                </div>
                <ArrowRight className="h-3 w-3 shrink-0 text-white/80" />
              </div>
            ))}
          </div>

          {/* Products / Services */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9.5px] font-semibold uppercase tracking-wider text-white/60">Shop</span>
            <span className="text-[9px] text-white/50">See all</span>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {demo.products.slice(0, 4).map((p) => (
              <div key={p.name} className="overflow-hidden rounded-xl border border-white/15 bg-white/10 backdrop-blur">
                <div className="aspect-square w-full overflow-hidden">
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </div>
                <div className="p-1.5">
                  <div className="truncate text-[9.5px] font-semibold">{p.name}</div>
                  <div className="truncate text-[9px] text-white/70">{p.price}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Services */}
          <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-wider text-white/60">Services</div>
          <div className="mb-3 flex flex-wrap gap-1">
            {demo.services.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/15 bg-white/[0.08] px-2 py-[2px] text-[9.5px] text-white/85"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Gallery */}
          <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-wider text-white/60">Gallery</div>
          <div className="mb-3 grid grid-cols-3 gap-1">
            {demo.gallery.map((g, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-white/15">
                <img src={g} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>

          {/* Reviews */}
          <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-wider text-white/60">Reviews</div>
          <div className="mb-3 space-y-1.5">
            {demo.reviews.slice(0, 2).map((r) => (
              <div
                key={r.name}
                className="flex gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2 backdrop-blur"
              >
                <img
                  src={r.photo}
                  alt={r.name}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[9.5px] font-semibold">
                    {r.name}
                    <span className="flex">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <Star key={i} className="h-2 w-2 fill-[#fbbf24] text-[#fbbf24]" />
                      ))}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-[9.5px] leading-snug text-white/75">{r.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Socials */}
          <div className="mb-3 flex items-center justify-center gap-2">
            {demo.socials.map((s) => {
              const SI = s.icon;
              return (
                <span
                  key={s.handle}
                  className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur"
                >
                  <SI className="h-3.5 w-3.5" />
                </span>
              );
            })}
          </div>

          {/* Pay footer */}
          <div className="flex items-center justify-between rounded-2xl bg-black/40 px-2.5 py-2 backdrop-blur">
            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <IndianRupee className="h-3 w-3" /> UPI · Cards · Wallets
            </div>
            <div className="text-[9px] text-white/60">Instant payout</div>
          </div>

          {/* Domain footer */}
          <div className="mt-2 text-center text-[9px] text-white/50">
            {demo.domain} · powered by ZUPIX
          </div>
        </div>
      </div>

      {/* Live activity toast overlay */}
      <div className="pointer-events-none absolute inset-x-3 top-11 z-30">
        <div
          key={`${demo.id}-${tIdx}`}
          className="flex items-center gap-2 rounded-2xl border border-white/25 bg-black/55 px-2.5 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          style={{ animation: "zx-toast-in .5s cubic-bezier(.2,.8,.2,1) both" }}
        >
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ background: `${toast.tone}30`, color: toast.tone }}
          >
            <ToastIcon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10.5px] font-semibold text-white">{toast.title}</span>
            <span className="block truncate text-[9.5px] text-white/70">{toast.sub}</span>
          </span>
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

  // parallax on scroll — write directly to refs via rAF to avoid React re-renders
  const heroRef = useRef<HTMLDivElement | null>(null);
  const phoneWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let raf = 0;
    let ticking = false;
    const apply = () => {
      ticking = false;
      const p = Math.min(1, window.scrollY / 600);
      if (heroRef.current) {
        heroRef.current.style.transform = `scale(${1 - p * 0.04})`;
        heroRef.current.style.filter = `saturate(${1 - p * 0.15})`;
      }
      if (phoneWrapRef.current) {
        phoneWrapRef.current.style.transform = `perspective(1200px) rotateY(${-6 + p * 8}deg) rotateX(${p * 3}deg) translateY(${p * -8}px)`;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  const heroStyle: CSSProperties = {
    transformOrigin: "center top",
    willChange: "transform, filter",
  };
  const phoneWrapStyle: CSSProperties = {
    transition: "transform .25s ease-out",
    willChange: "transform",
  };

  const headline = ["Build", "Beautiful", "Bio", "Links", "That", "Actually", "Convert."];

  return (
    <section id="hero" className="relative isolate min-h-dvh w-full overflow-hidden bg-[#0a0a12] text-white">
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
        @keyframes zx-toast-in { from { opacity: 0; transform: translate3d(0,-14px,0) scale(.96); }
          to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
        @keyframes zx-feed-scroll { 0%,10% { transform: translateY(0); }
          55%,70% { transform: translateY(-42%); } 100% { transform: translateY(0); } }
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
        ref={heroRef}
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
        <div className="grid gap-4 lg:grid-cols-12 lg:auto-rows-[130px]">
          {/* Headline cell */}
          <div className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md lg:col-span-8 lg:row-span-4 lg:p-12">
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
              <a
                ref={primaryRef}
                href="/pricing"
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
              </a>
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
          <div className="relative rounded-[36px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-6 backdrop-blur-md lg:col-span-4 lg:row-span-6">
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
                  ref={phoneWrapRef}
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
              className="left-2 top-10 lg:-left-8"
              delay={0.2}
            />
            <FloatCard
              icon={IndianRupee}
              title="UPI ₹4,800 received"
              sub={`from ${demo.handle}`}
              tone="#ff6b35"
              className="right-2 top-24 lg:-right-10"
              delay={0.5}
            />
            <FloatCard
              icon={MessageCircle}
              title="New WhatsApp order"
              sub="Kalyan Heritage · 2 items"
              tone="#22d3ee"
              className="right-3 bottom-40 lg:-right-14"
              delay={0.9}
            />
            <FloatCard
              icon={Eye}
              title="+128 profile views"
              sub="last 5 minutes"
              tone="#a78bfa"
              className="left-3 bottom-28 lg:-left-14"
              delay={1.2}
            />
            <FloatCard
              icon={Globe2}
              title="Custom domain live"
              sub="kalyan.link · DNS verified"
              tone="#38bdf8"
              className="left-6 bottom-4 lg:-left-6"
              delay={1.5}
            />
            <FloatCard
              icon={BellRing}
              title="Theme applied"
              sub="Sunset Blaze · saved"
              tone="#e84393"
              className="right-6 bottom-6 lg:-right-4"
              delay={1.8}
            />
          </div>

          {/* Stats */}
          <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-[clamp(1rem,3.5vw,1.5rem)] backdrop-blur-md lg:col-span-8 lg:row-span-3 xl:row-span-2">
            <ResponsiveStatsGrid className="min-[1200px]:grid-cols-4">
              <Stat icon={BadgeCheck} label="Profiles created" target={5600} suffix="+" />
              <Stat icon={Palette} label="Premium themes" target={20} suffix="+" />
              <Stat icon={Eye} label="Monthly page views" target={75000} suffix="+" />
              <Stat icon={Globe2} label="Indian businesses" target={250} suffix="+" />
            </ResponsiveStatsGrid>
            {/* Demo indicator strip */}
            <div className="mt-[clamp(0.875rem,3vw,1.25rem)] grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:flex sm:flex-wrap">
              <span className="min-w-0 text-[clamp(0.58rem,1.9vw,0.625rem)] font-medium uppercase tracking-[0.18em] text-white/40 sm:shrink-0">
                Now showing
              </span>
              <div className="order-3 col-span-2 min-w-0 sm:order-none sm:col-span-1">
                <span className="block truncate text-[clamp(0.7rem,2.2vw,0.75rem)] font-medium text-white/80 sm:inline">{demo.name}</span>
                <span className="mt-0.5 block truncate text-[clamp(0.65rem,2vw,0.6875rem)] text-white/40 sm:ml-2 sm:inline sm:before:content-['·_']">{demo.tagline}</span>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
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
