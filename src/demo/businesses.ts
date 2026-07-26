/**
 * LS-DEMO-01 · Phase 1 — Twelve fully populated Indian business showcases.
 * Deterministic UUIDs so later phases (analytics/payments seed, reset engine)
 * can reference the exact same rows.
 */

import type { ThemePresetId } from "@/features/builder/theme";

export type DemoBusinessKey =
  | "ratan-jewellers"
  | "spice-route-kitchen"
  | "brew-and-bloom"
  | "dr-anjali-clinic"
  | "ashirwad-hospital"
  | "glow-studio"
  | "ironcore-fitness"
  | "vidya-school"
  | "wanderlust-trails"
  | "casa-verde-homes"
  | "pixel-forge"
  | "meher-associates";

export interface DemoTestimonial {
  name: string;
  role: string;
  city: string;
  rating: number;
  review: string;
}

export interface DemoFaq {
  question: string;
  answer: string;
}

export interface DemoCatalogueItem {
  title: string;
  description: string;
  priceLabel: string;
}

export interface DemoBusiness {
  key: DemoBusinessKey;
  id: string;                    // bio_pages.id
  slug: string;                  // public URL
  name: string;                  // brand/business name
  ownerName: string;
  ownerRole: string;
  category: "creator" | "business" | "agency" | "personal" | "portfolio" | "product" | "event" | "other";
  industryLabel: string;
  themePreset: ThemePresetId;
  cityState: string;
  address: string;
  hours: string;
  tagline: string;
  bio: string;
  aboutLong: string;
  whatsapp: string;              // +91XXXXXXXXXX
  phone: string;
  email: string;
  website: string;
  mapEmbedUrl: string;
  seo: { title: string; description: string; ogTitle: string; ogDescription: string; keywords: string[] };
  customDomain: string;          // shown as metadata example
  socials: { instagram?: string; facebook?: string; youtube?: string; linkedin?: string; whatsapp?: string; website?: string };
  ctas: Array<{ label: string; url: string; action: "website" | "whatsapp" | "phone" | "email" | "custom" }>;
  cataloguePrefix: string;       // e.g. "Featured Collections" / "Signature Services"
  catalogueKind: "product" | "service";
  catalogue: DemoCatalogueItem[]; // 6 items
  galleryCaptions: string[];      // 6 captions
  testimonials: DemoTestimonial[]; // 3
  faqs: DemoFaq[];                 // 4
  htmlWidget: { title: string; html: string };
  downloadLabel: string;
  downloadDescription: string;
}

/** Fixed workspace + owner (owner is the existing super-admin). */
export const DEMO_WORKSPACE = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerId: "7b5ce26e-965d-4578-9bae-018fbb6a106c",
  name: "ZUPIX Showcase",
  slug: "zupix-showcase",
} as const;

const map = (q: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    key: "ratan-jewellers",
    id: "22222222-0001-4000-8000-000000000001",
    slug: "ratan-jewellers",
    name: "Ratan Jewellers",
    ownerName: "Vikram Ratan Soni",
    ownerRole: "Third-generation jeweller",
    category: "business",
    industryLabel: "Fine Jewellery",
    themePreset: "luxury",
    cityState: "Jaipur, Rajasthan",
    address: "12 Johari Bazaar, Jaipur 302003",
    hours: "Mon – Sat · 11:00 AM – 8:30 PM",
    tagline: "Timeless craftsmanship since 1974",
    bio: "Hand-crafted 22K & 18K gold, uncut diamonds and Kundan heirlooms — made in Jaipur, worn across the world.",
    aboutLong:
      "For fifty years, three generations of the Soni family have hand-set every stone at Ratan Jewellers. From bridal Polki suites to everyday temple gold, each piece carries a lifetime buy-back and a BIS hallmark.",
    whatsapp: "+919829012345",
    phone: "+911412234567",
    email: "care@ratanjewellers.in",
    website: "https://ratanjewellers.in",
    mapEmbedUrl: map("Johari Bazaar Jaipur"),
    seo: {
      title: "Ratan Jewellers · Jaipur's Heritage Gold & Kundan House",
      description: "BIS-hallmarked 22K gold, Polki & Kundan bridal sets from Johari Bazaar, Jaipur. Book a private consultation.",
      ogTitle: "Ratan Jewellers — 50 years of Jaipur craftsmanship",
      ogDescription: "Book a private appointment for bridal Polki, Kundan, and uncut-diamond suites.",
      keywords: ["jewellers jaipur", "kundan bridal", "22k gold jaipur"],
    },
    customDomain: "ratanjewellers.in",
    socials: {
      instagram: "https://instagram.com/ratanjewellers",
      facebook: "https://facebook.com/ratanjewellers",
      youtube: "https://youtube.com/@ratanjewellers",
      whatsapp: "https://wa.me/919829012345",
      website: "https://ratanjewellers.in",
    },
    ctas: [
      { label: "Book Private Viewing", url: "https://wa.me/919829012345?text=I%27d%20like%20to%20book%20a%20private%20viewing", action: "whatsapp" },
      { label: "Today's Gold Rate", url: "https://ratanjewellers.in/rate", action: "website" },
      { label: "WhatsApp the Store", url: "https://wa.me/919829012345", action: "whatsapp" },
      { label: "Call Showroom", url: "tel:+911412234567", action: "phone" },
      { label: "Bridal Lookbook 2026", url: "https://ratanjewellers.in/bridal", action: "website" },
    ],
    cataloguePrefix: "Featured Collections",
    catalogueKind: "product",
    catalogue: [
      { title: "Polki Bridal Choker Set", description: "Uncut diamonds set in 22K gold, matched jhumkas and maang tikka.", priceLabel: "₹4,85,000" },
      { title: "Temple Gold Haram", description: "South-Indian nakshi work, 78 grams, Lakshmi motif.", priceLabel: "₹5,95,000" },
      { title: "Kundan Rani Haar", description: "Meenakari reverse, pearl drops, hand-set.", priceLabel: "₹3,25,000" },
      { title: "Solitaire Diamond Ring", description: "1.02ct GIA-certified, 18K rose gold band.", priceLabel: "₹2,85,000" },
      { title: "Everyday Gold Chain", description: "22K, 8-gram figaro, adjustable clasp.", priceLabel: "₹52,400" },
      { title: "Antique Nose Pin Set", description: "Pack of 3, hallmarked, gift-boxed.", priceLabel: "₹18,900" },
    ],
    galleryCaptions: [
      "Polki bridal set — private viewing",
      "22K temple gold haram",
      "Kundan meenakari reverse",
      "Diamond solitaire in rose gold",
      "Hand-setting in the atelier",
      "Certified & gift-boxed",
    ],
    testimonials: [
      { name: "Aishwarya Kothari", role: "Bride, 2025", city: "Udaipur", rating: 5, review: "My Polki set was ready in six weeks and the fit was perfect on the wedding morning." },
      { name: "Meera Agrawal", role: "Repeat customer", city: "Jaipur", rating: 5, review: "Third generation buying from Ratan Ji. The buy-back is honest to the paisa." },
      { name: "Nikhil Sethi", role: "NRI client", city: "London", rating: 5, review: "Shipped my mother's anniversary set to London with full BIS papers. Flawless service." },
    ],
    faqs: [
      { question: "Do you certify your diamonds?", answer: "Every diamond above 0.30ct ships with a GIA or IGI certificate; smaller stones carry an in-house lab report." },
      { question: "Is there a buy-back guarantee?", answer: "Yes — lifetime buy-back on all our 22K and 18K gold at the prevailing rate, minus a 4% making deduction." },
      { question: "Can I book a private viewing?", answer: "WhatsApp us with a preferred slot; our senior consultant will set up a private lounge session in Jaipur." },
      { question: "Do you deliver outside India?", answer: "We ship insured across the US, UK, UAE and Singapore with full BIS documentation." },
    ],
    htmlWidget: {
      title: "Today's Gold Rate",
      html: `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#3b2a10,#0f0a05);color:#ffd58a;font-family:serif"><div style="font-size:12px;opacity:.7;letter-spacing:.14em;text-transform:uppercase">Today's rate · Jaipur</div><div style="font-size:28px;margin-top:6px">22K · ₹ 7,142 / g</div><div style="font-size:14px;opacity:.75;margin-top:2px">24K · ₹ 7,795 / g</div></div>`,
    },
    downloadLabel: "Bridal Lookbook 2026 (PDF)",
    downloadDescription: "62-page catalogue of our new bridal Polki & Kundan suites.",
  },

  {
    key: "spice-route-kitchen",
    id: "22222222-0002-4000-8000-000000000002",
    slug: "spice-route-kitchen",
    name: "Spice Route Kitchen",
    ownerName: "Chef Kabir Menon",
    ownerRole: "Executive Chef & Owner",
    category: "business",
    industryLabel: "Indian Coastal Restaurant",
    themePreset: "creator",
    cityState: "Bandra West, Mumbai",
    address: "Ground Floor, Waterfield Rd, Bandra West, Mumbai 400050",
    hours: "Daily · 12:00 PM – 12:00 AM",
    tagline: "A coastal grand tour, in one menu",
    bio: "Kerala backwaters to Konkan shores — reimagined by Chef Kabir Menon. 15 tables. Sea-view. No compromises.",
    aboutLong:
      "Chef Kabir spent seven years touring India's coastal kitchens before opening Spice Route in 2019. Every ingredient is sourced within 48 hours of harvest — the meen curry uses Alleppey's morning catch, flown in daily.",
    whatsapp: "+919820098765",
    phone: "+912226401234",
    email: "hello@spiceroutekitchen.in",
    website: "https://spiceroutekitchen.in",
    mapEmbedUrl: map("Waterfield Road Bandra West Mumbai"),
    seo: {
      title: "Spice Route Kitchen · Coastal Indian Fine Dining, Bandra",
      description: "Chef Kabir Menon's coastal Indian tasting menu in Bandra West, Mumbai. Reserve your table.",
      ogTitle: "Spice Route Kitchen — Bandra's coastal Indian table",
      ogDescription: "Kerala to Konkan, reimagined. Reservations now open for dinner service.",
      keywords: ["fine dining bandra", "coastal indian mumbai", "chef kabir menon"],
    },
    customDomain: "spiceroutekitchen.in",
    socials: {
      instagram: "https://instagram.com/spiceroutebandra",
      facebook: "https://facebook.com/spiceroutebandra",
      youtube: "https://youtube.com/@spiceroutebandra",
      whatsapp: "https://wa.me/919820098765",
    },
    ctas: [
      { label: "Reserve a Table", url: "https://wa.me/919820098765?text=Reservation%20for%20tonight", action: "whatsapp" },
      { label: "Order on Zomato", url: "https://zomato.com/spice-route-kitchen", action: "website" },
      { label: "Tonight's Tasting Menu", url: "https://spiceroutekitchen.in/menu", action: "website" },
      { label: "Private Events", url: "mailto:events@spiceroutekitchen.in", action: "email" },
      { label: "Call the Host", url: "tel:+912226401234", action: "phone" },
    ],
    cataloguePrefix: "Signature Plates",
    catalogueKind: "product",
    catalogue: [
      { title: "Alleppey Meen Curry", description: "Kingfish in raw-mango coconut gravy, red rice.", priceLabel: "₹ 1,150" },
      { title: "Malvani Chicken Sukka", description: "Slow-cooked malvani masala, kokum ghee toast.", priceLabel: "₹ 950" },
      { title: "Konkani Prawns Balchão", description: "Toddy vinegar, Kashmiri chilli, appam.", priceLabel: "₹ 1,450" },
      { title: "Goan Xacuti Lamb", description: "Roasted spice paste, cashew, hand-rolled poi.", priceLabel: "₹ 1,650" },
      { title: "Karimeen Pollichathu", description: "Pearl-spot fish wrapped in banana leaf.", priceLabel: "₹ 1,850" },
      { title: "Kerala Sadya Thali", description: "26-item vegetarian banana-leaf feast, Sundays.", priceLabel: "₹ 1,995" },
    ],
    galleryCaptions: [
      "Chef Kabir plating the sadya",
      "Fresh Alleppey catch, 6 AM",
      "Meen curry, ready for service",
      "The 15-seat sea-view room",
      "Konkani prawn balchão",
      "Private events room, upper floor",
    ],
    testimonials: [
      { name: "Rhea D'Souza", role: "Food critic, Mid-Day", city: "Mumbai", rating: 5, review: "The meen curry is worth booking a Bandra table just for. Chef Kabir has range." },
      { name: "Arjun Kapoor", role: "Regular guest", city: "Mumbai", rating: 5, review: "Every visit is a masterclass. The Sunday sadya is a religious experience." },
      { name: "Priya & Rohan Mehra", role: "Anniversary dinner", city: "Pune", rating: 5, review: "Drove in from Pune. Worth every kilometre. The staff remembered our anniversary." },
    ],
    faqs: [
      { question: "Do you take walk-ins?", answer: "We hold two counter seats each service. Everything else is by reservation on WhatsApp." },
      { question: "Is there a vegetarian menu?", answer: "Yes — a full 12-plate vegetarian tasting, plus the Sunday Kerala Sadya thali." },
      { question: "Can you accommodate allergies?", answer: "We flag every dish for shellfish, dairy, gluten and peanuts. Tell us at booking." },
      { question: "Do you host private events?", answer: "Upper-floor room seats 22. Custom menu, ₹4,500++ per guest." },
    ],
    htmlWidget: {
      title: "Tonight's Chef's Table",
      html: `<div style="padding:16px;border-radius:12px;background:#0d1a12;color:#c6f2c8;font-family:sans-serif"><div style="font-size:12px;opacity:.7;letter-spacing:.16em;text-transform:uppercase">Chef's Table · 8:30 PM</div><div style="font-size:22px;margin-top:6px">7-course coastal journey</div><div style="font-size:14px;opacity:.75;margin-top:4px">₹3,850 per guest · seats 6</div></div>`,
    },
    downloadLabel: "Full Menu Card (PDF)",
    downloadDescription: "Signature plates, tasting menus and wine pairings.",
  },

  {
    key: "brew-and-bloom",
    id: "22222222-0003-4000-8000-000000000003",
    slug: "brew-and-bloom",
    name: "Brew & Bloom Café",
    ownerName: "Ananya Iyer",
    ownerRole: "Founder & Head Roaster",
    category: "business",
    industryLabel: "Speciality Coffee & Bakery",
    themePreset: "minimal",
    cityState: "Indiranagar, Bengaluru",
    address: "12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560008",
    hours: "Mon – Sun · 7:30 AM – 10:30 PM",
    tagline: "Single-origin coffee. Slow mornings.",
    bio: "Speciality single-origin coffee, sourdough baked daily, and a garden courtyard in the heart of Indiranagar.",
    aboutLong:
      "Ananya trained at Melbourne's Small Batch Roasting before returning home. Beans are roasted in-house every Tuesday; sourdough is levained overnight from a 6-year-old starter.",
    whatsapp: "+919902456789",
    phone: "+918041234567",
    email: "hi@brewandbloom.co",
    website: "https://brewandbloom.co",
    mapEmbedUrl: map("12th Main Indiranagar Bengaluru"),
    seo: {
      title: "Brew & Bloom Café · Speciality Coffee in Indiranagar",
      description: "Single-origin coffee, sourdough and garden seating in Indiranagar, Bengaluru.",
      ogTitle: "Brew & Bloom — Bengaluru's slow-morning café",
      ogDescription: "Small-batch roasts. Sourdough baked daily. Garden courtyard.",
      keywords: ["speciality coffee bengaluru", "cafe indiranagar", "sourdough bengaluru"],
    },
    customDomain: "brewandbloom.co",
    socials: {
      instagram: "https://instagram.com/brewandbloom",
      facebook: "https://facebook.com/brewandbloom",
      whatsapp: "https://wa.me/919902456789",
    },
    ctas: [
      { label: "Book Cupping Session", url: "https://wa.me/919902456789?text=I%27d%20like%20to%20join%20a%20cupping", action: "whatsapp" },
      { label: "Buy Beans Online", url: "https://brewandbloom.co/shop", action: "website" },
      { label: "Reserve a Table", url: "https://brewandbloom.co/reserve", action: "website" },
      { label: "Café Directions", url: "https://maps.google.com/?q=12th+Main+Indiranagar", action: "website" },
    ],
    cataloguePrefix: "This Week's Menu",
    catalogueKind: "product",
    catalogue: [
      { title: "Chikmagalur Peaberry Filter", description: "150ml pour-over, notes of dark chocolate & orange peel.", priceLabel: "₹ 220" },
      { title: "Iced Sparkling Espresso", description: "Double shot, house tonic, orange twist.", priceLabel: "₹ 280" },
      { title: "Miso Chocolate Sourdough", description: "Fudgy, 65% dark, sea salt finish.", priceLabel: "₹ 320" },
      { title: "Truffle Cheese Toastie", description: "Farmhouse cheddar, black truffle, sourdough.", priceLabel: "₹ 380" },
      { title: "House Roast — 250g Bag", description: "Whole beans or freshly ground, dark roast.", priceLabel: "₹ 650" },
      { title: "Weekend Brunch Board", description: "Eggs, sourdough, jams, hash, seasonal fruit.", priceLabel: "₹ 590" },
    ],
    galleryCaptions: [
      "Chikmagalur peaberry filter",
      "The garden courtyard",
      "House sourdough, morning bake",
      "Cupping Saturdays at 10 AM",
      "Roasting day — Tuesdays",
      "Weekend brunch board",
    ],
    testimonials: [
      { name: "Kabir Rao", role: "Barista trainer", city: "Bengaluru", rating: 5, review: "The Chikmagalur filter is the most honest cup in the city right now." },
      { name: "Nikita Sen", role: "Freelance designer", city: "Bengaluru", rating: 5, review: "My WFH office. Wifi is fast, the courtyard is quiet, and the sourdough is dangerous." },
      { name: "Vivek & Anu", role: "Weekend regulars", city: "Bengaluru", rating: 5, review: "Best brunch in Indiranagar. Book ahead — the garden fills up by 10 AM." },
    ],
    faqs: [
      { question: "Do you have vegan options?", answer: "Full oat & almond menu, plus vegan bakes daily (marked V on the board)." },
      { question: "Is the space laptop friendly?", answer: "Weekday mornings, absolutely. Weekends we ask laptops to stay in the loft." },
      { question: "Can I buy the beans?", answer: "Yes — retail bags of our current three roasts are at the counter or on our shop." },
      { question: "Do you host cupping sessions?", answer: "Every Saturday 10 AM — free, 8 seats, book via WhatsApp." },
    ],
    htmlWidget: {
      title: "This Week's Roast",
      html: `<div style="padding:16px;border-radius:16px;background:#f8f4ee;color:#2c1a0e;font-family:sans-serif;border:1px solid #e6dbc9"><div style="font-size:11px;opacity:.6;letter-spacing:.18em;text-transform:uppercase">Roast · Week 12</div><div style="font-size:22px;margin-top:6px;font-weight:600">Chikmagalur Peaberry</div><div style="font-size:13px;opacity:.7;margin-top:4px">Dark chocolate · orange peel · almond</div></div>`,
    },
    downloadLabel: "Coffee Menu & Cupping Notes",
    downloadDescription: "Full menu plus tasting notes for this month's rotating roasts.",
  },

  {
    key: "dr-anjali-clinic",
    id: "22222222-0004-4000-8000-000000000004",
    slug: "dr-anjali-clinic",
    name: "Dr. Anjali Sharma · Skin & Aesthetic Clinic",
    ownerName: "Dr. Anjali Sharma",
    ownerRole: "MD Dermatology · 14 years",
    category: "business",
    industryLabel: "Dermatology Clinic",
    themePreset: "glass",
    cityState: "Greater Kailash, New Delhi",
    address: "M-Block Market, GK-II, New Delhi 110048",
    hours: "Mon – Sat · 10:00 AM – 7:00 PM",
    tagline: "Evidence-based skin care, in the heart of GK-II",
    bio: "MD Dermatology · 14 years' clinical experience · gentle, science-first treatments for acne, pigmentation and anti-ageing.",
    aboutLong:
      "Dr. Anjali trained at AIIMS Delhi and King's College London. Her practice focuses on evidence-based, minimally invasive treatments — every plan is discussed transparently in the consult, with no upselling.",
    whatsapp: "+919871456123",
    phone: "+911141234567",
    email: "consult@drAnjalisharma.in",
    website: "https://drAnjalisharma.in",
    mapEmbedUrl: map("M Block Market GK 2 New Delhi"),
    seo: {
      title: "Dr. Anjali Sharma · Dermatologist in GK-II, New Delhi",
      description: "MD Dermatology · acne, pigmentation, laser, anti-ageing. Book a consultation in GK-II, Delhi.",
      ogTitle: "Dr. Anjali Sharma · Skin & Aesthetic Clinic",
      ogDescription: "Evidence-based dermatology in Greater Kailash — book online.",
      keywords: ["dermatologist delhi", "acne treatment gk2", "skin clinic new delhi"],
    },
    customDomain: "drAnjalisharma.in",
    socials: {
      instagram: "https://instagram.com/dr.anjali.derm",
      linkedin: "https://linkedin.com/in/dranjalisharma",
      whatsapp: "https://wa.me/919871456123",
    },
    ctas: [
      { label: "Book a Consultation", url: "https://wa.me/919871456123?text=I%27d%20like%20to%20book%20a%20consultation", action: "whatsapp" },
      { label: "Treatment Menu", url: "https://drAnjalisharma.in/treatments", action: "website" },
      { label: "Call the Clinic", url: "tel:+911141234567", action: "phone" },
      { label: "Video Consult", url: "https://drAnjalisharma.in/telehealth", action: "website" },
    ],
    cataloguePrefix: "Signature Services",
    catalogueKind: "service",
    catalogue: [
      { title: "Skin-Health Consult (45 min)", description: "Full history, digital dermatoscopy, personalised plan.", priceLabel: "₹ 2,500" },
      { title: "Advanced Acne Programme", description: "12-week regimen · in-clinic peels · WhatsApp follow-ups.", priceLabel: "₹ 24,500" },
      { title: "Pigmentation Peel Course", description: "6 sessions · glutathione + azelaic protocol.", priceLabel: "₹ 32,000" },
      { title: "Laser Hair Reduction", description: "Diode LightSheer · 6 sessions · full face.", priceLabel: "₹ 18,000" },
      { title: "PRP Hair Restoration", description: "3 sessions · autologous PRP · guided injection.", priceLabel: "₹ 21,000" },
      { title: "Anti-Ageing Consult", description: "Botox, fillers, HIFU — planned only if indicated.", priceLabel: "₹ 3,000" },
    ],
    galleryCaptions: [
      "Consultation room",
      "Dermatoscopy in progress",
      "Laser treatment bay",
      "Skin-analysis suite",
      "Waiting lounge",
      "Post-treatment care area",
    ],
    testimonials: [
      { name: "Sanya Kapoor", role: "Acne patient", city: "New Delhi", rating: 5, review: "Six years of stubborn acne, gone in five months. Dr. Anjali explained every step." },
      { name: "Rohit Mahajan", role: "PRP patient", city: "Noida", rating: 5, review: "Honest advice — she told me I didn't need what I asked for. That earned my trust." },
      { name: "Neha Bhalla", role: "Pigmentation patient", city: "Delhi", rating: 5, review: "The peel programme actually worked. My melasma is 80% lighter." },
    ],
    faqs: [
      { question: "Do you take same-day appointments?", answer: "We hold two slots each morning for same-day consults — WhatsApp before 11 AM." },
      { question: "Are your prices transparent?", answer: "Every treatment plan is written up with itemised costs before you commit." },
      { question: "Do you offer video consults?", answer: "Yes — 30-minute video consults are ₹1,800 and are ideal for follow-ups and second opinions." },
      { question: "What insurance do you accept?", answer: "We are cash-and-card only, but issue GST invoices for reimbursement claims." },
    ],
    htmlWidget: {
      title: "Consultation Availability",
      html: `<div style="padding:16px;border-radius:14px;background:rgba(255,255,255,.7);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.5);color:#0e2a4a;font-family:sans-serif"><div style="font-size:11px;opacity:.7;letter-spacing:.16em;text-transform:uppercase">Next Available</div><div style="font-size:22px;margin-top:6px;font-weight:600">Today · 3:30 PM</div><div style="font-size:13px;opacity:.75;margin-top:4px">45-min slot with Dr. Anjali</div></div>`,
    },
    downloadLabel: "Skin Care Guide (PDF)",
    downloadDescription: "Dr. Anjali's 20-page evidence-based skincare handbook.",
  },

  {
    key: "ashirwad-hospital",
    id: "22222222-0005-4000-8000-000000000005",
    slug: "ashirwad-hospital",
    name: "Ashirwad Multispeciality Hospital",
    ownerName: "Dr. Rakesh Deshpande",
    ownerRole: "Medical Director",
    category: "business",
    industryLabel: "Multispeciality Hospital",
    themePreset: "business",
    cityState: "Baner, Pune",
    address: "Baner-Balewadi Road, Pune 411045",
    hours: "24 × 7 · Emergency & OPD",
    tagline: "Care that puts your family first",
    bio: "180-bed NABH-accredited multispeciality hospital · 24×7 emergency · 32 specialities · cashless with 60+ TPAs.",
    aboutLong:
      "Ashirwad has served Western Pune for 22 years. NABH- and NABL-accredited, with dedicated cardiac, ortho, mother-and-child, oncology and critical-care blocks.",
    whatsapp: "+919812345670",
    phone: "+912067819000",
    email: "info@ashirwadhospital.in",
    website: "https://ashirwadhospital.in",
    mapEmbedUrl: map("Baner Balewadi Road Pune"),
    seo: {
      title: "Ashirwad Multispeciality Hospital · Baner, Pune",
      description: "NABH-accredited hospital in Baner, Pune. 32 specialities, 24×7 emergency, cashless with 60+ insurers.",
      ogTitle: "Ashirwad Hospital · 22 years serving Western Pune",
      ogDescription: "Book an appointment, video consult, or ambulance in one tap.",
      keywords: ["hospital pune baner", "24x7 emergency pune", "cashless hospital pune"],
    },
    customDomain: "ashirwadhospital.in",
    socials: {
      facebook: "https://facebook.com/ashirwadhospital",
      linkedin: "https://linkedin.com/company/ashirwadhospital",
      youtube: "https://youtube.com/@ashirwadhospital",
      whatsapp: "https://wa.me/919812345670",
    },
    ctas: [
      { label: "🚑 Emergency & Ambulance", url: "tel:+911800123456", action: "phone" },
      { label: "Book OPD Appointment", url: "https://ashirwadhospital.in/opd", action: "website" },
      { label: "Video Consult", url: "https://ashirwadhospital.in/video", action: "website" },
      { label: "Find a Doctor", url: "https://ashirwadhospital.in/doctors", action: "website" },
      { label: "WhatsApp Reception", url: "https://wa.me/919812345670", action: "whatsapp" },
    ],
    cataloguePrefix: "Departments & Services",
    catalogueKind: "service",
    catalogue: [
      { title: "Cardiology & Cath Lab", description: "24×7 angio, angioplasty, TAVI, structural heart.", priceLabel: "Cashless" },
      { title: "Orthopaedics & Joint Replacement", description: "Robotic-assisted knee & hip, sports injuries.", priceLabel: "Cashless" },
      { title: "Mother & Child Unit", description: "Birthing suites, Level-III NICU, lactation clinic.", priceLabel: "Packages from ₹75,000" },
      { title: "Oncology & Chemo Daycare", description: "Medical, surgical, radiation oncology.", priceLabel: "Cashless" },
      { title: "24×7 Emergency & Trauma", description: "Golden-hour protocols, in-house blood bank.", priceLabel: "24 × 7" },
      { title: "Executive Health Check", description: "Full-day comprehensive screening & consult.", priceLabel: "₹ 8,950" },
    ],
    galleryCaptions: [
      "24×7 emergency entrance",
      "Modular OT complex",
      "Cardiac cath lab",
      "Level-III NICU",
      "Birthing suite",
      "Executive lounge",
    ],
    testimonials: [
      { name: "Vaibhav Patil", role: "Cardiac patient", city: "Pune", rating: 5, review: "Angioplasty at 2 AM, discharged in 48 hours. The nursing was exceptional." },
      { name: "Sneha Kulkarni", role: "New mother", city: "Pune", rating: 5, review: "The birthing suite felt like a hotel, but the NICU was the reason we chose Ashirwad." },
      { name: "Mahesh Joshi", role: "Health check patient", city: "Pune", rating: 5, review: "Full-body check-up was thorough, on time, and the report was ready by evening." },
    ],
    faqs: [
      { question: "Do you accept cashless insurance?", answer: "Yes — 60+ TPAs and every major insurer are cashless at our billing desk 24×7." },
      { question: "Can I book a video consult?", answer: "OPD video slots are available for 30+ specialities. Book via our website or WhatsApp." },
      { question: "Is there a 24×7 ambulance?", answer: "ALS and BLS ambulances dispatch within 12 minutes across Pune. Call 1800 123 456." },
      { question: "Do you have international patient support?", answer: "Yes — visa letters, airport pick-up, translator and travel-desk services are available." },
    ],
    htmlWidget: {
      title: "24×7 Emergency Line",
      html: `<div style="padding:18px;border-radius:14px;background:#0a2c4a;color:#e8f4ff;font-family:sans-serif"><div style="font-size:11px;opacity:.75;letter-spacing:.16em;text-transform:uppercase">Emergency & Ambulance</div><div style="font-size:26px;margin-top:6px;font-weight:700;letter-spacing:.02em">1800 123 456</div><div style="font-size:13px;opacity:.8;margin-top:4px">Answered live, 24 × 7 · Pune-wide dispatch</div></div>`,
    },
    downloadLabel: "Insurance & TPA List",
    downloadDescription: "Full list of cashless insurers, TPAs and empanelments.",
  },

  {
    key: "glow-studio",
    id: "22222222-0006-4000-8000-000000000006",
    slug: "glow-studio",
    name: "Glow Studio · Salon & Spa",
    ownerName: "Aditi Reddy",
    ownerRole: "Master Stylist & Founder",
    category: "business",
    industryLabel: "Premium Salon & Spa",
    themePreset: "creator",
    cityState: "Jubilee Hills, Hyderabad",
    address: "Road No. 36, Jubilee Hills, Hyderabad 500033",
    hours: "Tue – Sun · 10:00 AM – 9:00 PM",
    tagline: "Where every visit is a mini-retreat",
    bio: "Kérastase & Olaplex premium salon · balayage, keratin, luxury facials, HD bridal makeup. Jubilee Hills, Hyderabad.",
    aboutLong:
      "Aditi trained at Vidal Sassoon London. Glow Studio's team of 14 stylists deliver Kérastase, Olaplex and Wella Master colour in a 3,200 sq ft loft space.",
    whatsapp: "+919000123456",
    phone: "+914023415678",
    email: "hello@glowstudio.in",
    website: "https://glowstudio.in",
    mapEmbedUrl: map("Jubilee Hills Road 36 Hyderabad"),
    seo: {
      title: "Glow Studio · Premium Salon in Jubilee Hills, Hyderabad",
      description: "Balayage, keratin, luxury facials and bridal makeup — Kérastase & Olaplex, Jubilee Hills.",
      ogTitle: "Glow Studio — Hyderabad's premium salon experience",
      ogDescription: "Book a consultation with our master stylists today.",
      keywords: ["salon jubilee hills", "balayage hyderabad", "bridal makeup hyderabad"],
    },
    customDomain: "glowstudio.in",
    socials: {
      instagram: "https://instagram.com/glowstudio.hyd",
      facebook: "https://facebook.com/glowstudiohyd",
      youtube: "https://youtube.com/@glowstudio",
      whatsapp: "https://wa.me/919000123456",
    },
    ctas: [
      { label: "Book an Appointment", url: "https://wa.me/919000123456?text=I%27d%20like%20to%20book%20an%20appointment", action: "whatsapp" },
      { label: "Bridal Package Menu", url: "https://glowstudio.in/bridal", action: "website" },
      { label: "Membership & Prepaid", url: "https://glowstudio.in/membership", action: "website" },
      { label: "Gift Card", url: "https://glowstudio.in/giftcard", action: "website" },
    ],
    cataloguePrefix: "Signature Services",
    catalogueKind: "service",
    catalogue: [
      { title: "Balayage & Toner", description: "Free-hand highlights, Wella colour, gloss toner.", priceLabel: "₹ 12,500" },
      { title: "Olaplex Keratin Smoothing", description: "Bond-repair keratin, 4-month lasting.", priceLabel: "₹ 15,000" },
      { title: "Signature Kérastase Facial", description: "Scalp analysis, deep hydration, head massage.", priceLabel: "₹ 4,500" },
      { title: "HD Bridal Makeup", description: "Airbrush base, lashes, hair set, saree draping.", priceLabel: "₹ 25,000" },
      { title: "Luxury Gold Facial", description: "90-minute Sothys gold facial with LED therapy.", priceLabel: "₹ 6,800" },
      { title: "Manicure & Gel Pedicure", description: "Detox soak, exfoliation, OPI gel finish.", priceLabel: "₹ 3,200" },
    ],
    galleryCaptions: [
      "The colour bar",
      "Balayage in progress",
      "HD bridal makeup",
      "Gold facial suite",
      "The nail lounge",
      "Signature blowout",
    ],
    testimonials: [
      { name: "Priya Nair", role: "Regular guest", city: "Hyderabad", rating: 5, review: "Best balayage I've had in India. Aditi actually listens." },
      { name: "Anjali Rao", role: "2025 bride", city: "Hyderabad", rating: 5, review: "My bridal look was picture-perfect. They even came for the mehendi at 6 AM." },
      { name: "Kavya S.", role: "Wedding party", city: "Bengaluru", rating: 5, review: "Six of us got styled together — everyone was ready on time. That's rare." },
    ],
    faqs: [
      { question: "Do I need to book in advance?", answer: "For master stylists and bridal, we suggest 2 weeks; standard services usually have same-week openings." },
      { question: "Do you do home bridal calls?", answer: "Yes — HD bridal, mehendi and reception packages come with home visits within Hyderabad." },
      { question: "Is there a first-time offer?", answer: "20% off your first visit on any service above ₹2,500. Show us this page at billing." },
      { question: "Do you sell products?", answer: "The full Kérastase, Olaplex and Wella professional retail range is available in-salon." },
    ],
    htmlWidget: {
      title: "This Month's Offer",
      html: `<div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,#ffe8d0,#ffc9a3);color:#3f1f0d;font-family:sans-serif"><div style="font-size:11px;opacity:.7;letter-spacing:.18em;text-transform:uppercase">Limited · March</div><div style="font-size:22px;margin-top:6px;font-weight:700">Balayage + Kérastase spa · 25% off</div><div style="font-size:13px;opacity:.8;margin-top:4px">Show this card at billing.</div></div>`,
    },
    downloadLabel: "Bridal Package Menu (PDF)",
    downloadDescription: "Every bridal package with day-by-day breakdown.",
  },

  {
    key: "ironcore-fitness",
    id: "22222222-0007-4000-8000-000000000007",
    slug: "ironcore-fitness",
    name: "IronCore Fitness Studio",
    ownerName: "Rajat Malhotra",
    ownerRole: "Head Coach · Ex-NIS",
    category: "business",
    industryLabel: "Strength & Conditioning Gym",
    themePreset: "neon",
    cityState: "DLF Phase 3, Gurugram",
    address: "Cyber Hub Extension, DLF Phase 3, Gurugram 122002",
    hours: "Mon – Sat · 5:30 AM – 11:00 PM · Sun · 6:30 AM – 2:00 PM",
    tagline: "Train smart. Build strong. Recover better.",
    bio: "Coach-led strength & conditioning · Olympic lifting · InBody scans · nutrition-included memberships. DLF Phase 3.",
    aboutLong:
      "IronCore is a 5,600 sq ft coach-led facility built around barbell training. Every member gets an InBody scan, a personalised programme, and monthly progress reviews.",
    whatsapp: "+919810234567",
    phone: "+911244567890",
    email: "hello@ironcore.fit",
    website: "https://ironcore.fit",
    mapEmbedUrl: map("Cyber Hub DLF Phase 3 Gurugram"),
    seo: {
      title: "IronCore Fitness · Coach-led Gym in DLF Phase 3, Gurugram",
      description: "Barbell training, Olympic lifting and nutrition-included memberships in Gurugram.",
      ogTitle: "IronCore Fitness Studio · Gurugram",
      ogDescription: "Book your free trial session today.",
      keywords: ["gym gurugram", "strength coach gurgaon", "personal trainer dlf"],
    },
    customDomain: "ironcore.fit",
    socials: {
      instagram: "https://instagram.com/ironcore.fit",
      youtube: "https://youtube.com/@ironcore",
      whatsapp: "https://wa.me/919810234567",
    },
    ctas: [
      { label: "Book a FREE Trial", url: "https://wa.me/919810234567?text=I%27d%20like%20a%20free%20trial", action: "whatsapp" },
      { label: "Membership Plans", url: "https://ironcore.fit/plans", action: "website" },
      { label: "InBody Scan (₹499)", url: "https://ironcore.fit/inbody", action: "website" },
      { label: "Coach Directory", url: "https://ironcore.fit/coaches", action: "website" },
    ],
    cataloguePrefix: "Programmes",
    catalogueKind: "service",
    catalogue: [
      { title: "Strength Foundations · 12 wk", description: "Barbell squat, bench, deadlift, press — 3× / week.", priceLabel: "₹ 18,000" },
      { title: "Fat-Loss Sprint · 8 wk", description: "Strength + conditioning + nutrition · InBody every 2 wk.", priceLabel: "₹ 14,000" },
      { title: "Olympic Lifting Group", description: "Snatch, clean & jerk · 4×/wk · max 6 lifters.", priceLabel: "₹ 9,500 / mo" },
      { title: "1:1 Coach Membership", description: "Weekly private session + 24×7 gym access.", priceLabel: "₹ 12,500 / mo" },
      { title: "Corporate Team Programme", description: "On-site or in-studio · assessments · 8 weeks.", priceLabel: "Custom" },
      { title: "Nutrition Coaching · 12 wk", description: "Weekly plan · WhatsApp check-ins · 2 InBody scans.", priceLabel: "₹ 10,000" },
    ],
    galleryCaptions: [
      "The barbell floor",
      "Deadlift PR morning",
      "Small-group conditioning",
      "InBody scan station",
      "Olympic platform",
      "The recovery lounge",
    ],
    testimonials: [
      { name: "Naveen Batra", role: "Member since 2023", city: "Gurugram", rating: 5, review: "Dropped 14 kg in 6 months without any crash diets. The coaches actually coach." },
      { name: "Ritika Sen", role: "Powerlifting lifter", city: "Delhi", rating: 5, review: "Squatted 100 kg in 9 months. The programming here is elite-level." },
      { name: "Arjun Sharma", role: "Corporate client", city: "Gurugram", rating: 5, review: "We ran a 12-week team programme — best team-building spend we've done." },
    ],
    faqs: [
      { question: "Is my first session free?", answer: "Yes — one full 60-minute coached session with InBody scan is free. Book on WhatsApp." },
      { question: "Do I need experience?", answer: "Zero. Our Strength Foundations track is built for total beginners." },
      { question: "What's included in membership?", answer: "Coach-led sessions, gym access, monthly InBody scans, nutrition support, recovery lounge." },
      { question: "Do you have women-only slots?", answer: "Yes — dedicated women-only Strength Foundations groups Tue/Thu 6 PM." },
    ],
    htmlWidget: {
      title: "Next Free Trial",
      html: `<div style="padding:16px;border-radius:14px;background:#0a0a12;color:#a2ffcb;font-family:'JetBrains Mono',monospace;border:1px solid #1f2f42"><div style="font-size:11px;opacity:.7;letter-spacing:.18em;text-transform:uppercase">FREE trial · this week</div><div style="font-size:24px;margin-top:6px;font-weight:700">SAT · 8:00 AM</div><div style="font-size:13px;opacity:.75;margin-top:4px">6 seats left · WhatsApp to hold yours</div></div>`,
    },
    downloadLabel: "Membership Handbook (PDF)",
    downloadDescription: "Plans, timings, coach bios and gym rules.",
  },

  {
    key: "vidya-school",
    id: "22222222-0008-4000-8000-000000000008",
    slug: "vidya-school",
    name: "Vidya Public School",
    ownerName: "Mrs. Kavita Verma",
    ownerRole: "Principal · M.Ed",
    category: "business",
    industryLabel: "K-12 CBSE School",
    themePreset: "modern",
    cityState: "Gomti Nagar, Lucknow",
    address: "Vibhuti Khand, Gomti Nagar, Lucknow 226010",
    hours: "Admissions · Mon – Sat · 8:00 AM – 4:00 PM",
    tagline: "Empowering thinkers since 1992",
    bio: "Co-educational CBSE school · Nursery to Grade 12 · Cambridge partnership · science, arts and sports of national standard.",
    aboutLong:
      "Vidya Public School has been Lucknow's leading CBSE co-ed institution for over three decades. Our 12-acre campus houses a 25,000-book library, Cambridge-partnered curriculum, and 4 national-level sports teams.",
    whatsapp: "+919415012345",
    phone: "+915224067890",
    email: "admissions@vidyaschool.in",
    website: "https://vidyaschool.in",
    mapEmbedUrl: map("Vibhuti Khand Gomti Nagar Lucknow"),
    seo: {
      title: "Vidya Public School · CBSE School in Gomti Nagar, Lucknow",
      description: "Nursery to Grade 12 CBSE school in Gomti Nagar, Lucknow. Cambridge partnership. Admissions open.",
      ogTitle: "Vidya Public School · 30 years of academic excellence",
      ogDescription: "Book a campus visit or apply online for 2026-27 admissions.",
      keywords: ["cbse school lucknow", "gomti nagar school", "vidya public school"],
    },
    customDomain: "vidyaschool.in",
    socials: {
      facebook: "https://facebook.com/vidyaschoollucknow",
      youtube: "https://youtube.com/@vidyaschool",
      linkedin: "https://linkedin.com/school/vidya-public-school",
      whatsapp: "https://wa.me/919415012345",
    },
    ctas: [
      { label: "Apply for Admission 2026-27", url: "https://vidyaschool.in/apply", action: "website" },
      { label: "Book a Campus Tour", url: "https://wa.me/919415012345?text=I%27d%20like%20to%20book%20a%20campus%20tour", action: "whatsapp" },
      { label: "Download Prospectus", url: "https://vidyaschool.in/prospectus.pdf", action: "website" },
      { label: "Fee Structure", url: "https://vidyaschool.in/fees", action: "website" },
      { label: "Call Admissions", url: "tel:+915224067890", action: "phone" },
    ],
    cataloguePrefix: "Programmes & Grades",
    catalogueKind: "service",
    catalogue: [
      { title: "Early Years (Nursery – KG)", description: "Play-based, Cambridge Early Years framework.", priceLabel: "Grade N – KG" },
      { title: "Primary (Grades 1 – 5)", description: "Bilingual literacy, hands-on STEM, art & music.", priceLabel: "Grades 1 – 5" },
      { title: "Middle School (Grades 6 – 8)", description: "Robotics lab, coding, sports academy.", priceLabel: "Grades 6 – 8" },
      { title: "Secondary (Grades 9 – 10)", description: "CBSE + Cambridge Checkpoint prep.", priceLabel: "Grades 9 – 10" },
      { title: "Senior Secondary (11 – 12)", description: "Science, Commerce, Humanities · career counselling.", priceLabel: "Grades 11 – 12" },
      { title: "Cambridge Enrichment Track", description: "Optional Cambridge International certification.", priceLabel: "Add-on" },
    ],
    galleryCaptions: [
      "The Cambridge learning wing",
      "Robotics lab",
      "25,000-book library",
      "Interschool basketball final",
      "Annual Day 2025",
      "Founder's Day cultural event",
    ],
    testimonials: [
      { name: "Rekha Awasthi", role: "Parent · Grade 8", city: "Lucknow", rating: 5, review: "Our daughter went from shy to head girl in 3 years. This school changes children." },
      { name: "Rohan Bakshi", role: "Alumnus · 2019", city: "New Delhi", rating: 5, review: "Vidya prepared me for IIT-Delhi better than any coaching institute could." },
      { name: "Suman Verma", role: "Parent · Grade 3", city: "Lucknow", rating: 5, review: "The teachers know every child by name. That's rare in a big school." },
    ],
    faqs: [
      { question: "How can I apply for admission?", answer: "Apply online, submit documents, and book an interaction slot for the child and parents. All under 20 minutes." },
      { question: "Do you offer transport?", answer: "GPS-tracked, RFID-attendance school buses across 34 routes in and around Lucknow." },
      { question: "What is the student–teacher ratio?", answer: "1:22 in Primary, 1:18 in Middle & Secondary, dedicated 1:12 special-needs support." },
      { question: "Are scholarships available?", answer: "Merit and need-based scholarships up to 100% of tuition are announced every February." },
    ],
    htmlWidget: {
      title: "Admissions 2026-27",
      html: `<div style="padding:18px;border-radius:14px;background:linear-gradient(135deg,#1c3a6e,#0b1a35);color:#f6faff;font-family:sans-serif"><div style="font-size:11px;opacity:.75;letter-spacing:.18em;text-transform:uppercase">Now Open · 2026-27</div><div style="font-size:22px;margin-top:6px;font-weight:600">Apply by 28 March</div><div style="font-size:13px;opacity:.8;margin-top:4px">Interaction slots fill early — book yours today.</div></div>`,
    },
    downloadLabel: "School Prospectus 2026 (PDF)",
    downloadDescription: "42-page prospectus with curriculum, fee, and campus details.",
  },

  {
    key: "wanderlust-trails",
    id: "22222222-0009-4000-8000-000000000009",
    slug: "wanderlust-trails",
    name: "Wanderlust Trails · Travel Studio",
    ownerName: "Karan D'Silva",
    ownerRole: "Founder · IATA-certified",
    category: "business",
    industryLabel: "Boutique Travel Agency",
    themePreset: "creator",
    cityState: "Panjim, Goa",
    address: "Rua de Ourem, Fontainhas, Panjim, Goa 403001",
    hours: "Mon – Sat · 10:00 AM – 7:00 PM",
    tagline: "Trips that feel handcrafted — because they are.",
    bio: "IATA-certified boutique travel studio · custom itineraries · honeymoons · small-group trips across India & 32 countries.",
    aboutLong:
      "Karan has personally travelled through 47 countries. Wanderlust Trails builds every itinerary from scratch — no cookie-cutter packages, no hidden markups. On-ground concierge in 8 Indian states.",
    whatsapp: "+919845123456",
    phone: "+918322456789",
    email: "hello@wanderlusttrails.in",
    website: "https://wanderlusttrails.in",
    mapEmbedUrl: map("Fontainhas Panjim Goa"),
    seo: {
      title: "Wanderlust Trails · Boutique Travel Studio in Goa",
      description: "IATA-certified boutique travel · custom itineraries, honeymoons, and curated small-group trips.",
      ogTitle: "Wanderlust Trails — travel handcrafted from Goa",
      ogDescription: "Plan your next India or international trip with a real human.",
      keywords: ["travel agency goa", "custom itineraries india", "honeymoon planner goa"],
    },
    customDomain: "wanderlusttrails.in",
    socials: {
      instagram: "https://instagram.com/wanderlust.trails",
      facebook: "https://facebook.com/wanderlusttrails",
      youtube: "https://youtube.com/@wanderlusttrails",
      whatsapp: "https://wa.me/919845123456",
    },
    ctas: [
      { label: "Plan My Trip (Free Consult)", url: "https://wa.me/919845123456?text=I%27d%20like%20to%20plan%20a%20trip", action: "whatsapp" },
      { label: "Curated Itineraries", url: "https://wanderlusttrails.in/trips", action: "website" },
      { label: "Honeymoon Packages", url: "https://wanderlusttrails.in/honeymoons", action: "website" },
      { label: "Group Departures", url: "https://wanderlusttrails.in/groups", action: "website" },
    ],
    cataloguePrefix: "Featured Journeys",
    catalogueKind: "product",
    catalogue: [
      { title: "Ladakh · Frozen Zanskar · 9 Days", description: "Fixed departure · Feb & Mar · high-altitude ready.", priceLabel: "₹ 89,000" },
      { title: "Kerala · Backwaters & Tea · 7 Days", description: "Alleppey, Munnar, Fort Kochi · private stays.", priceLabel: "₹ 62,000" },
      { title: "Bali Honeymoon · 8 Nights", description: "Ubud, Uluwatu & Nusa Penida · pool villas.", priceLabel: "₹ 1,55,000 / pp" },
      { title: "Georgia & Kazbegi · 7 Days", description: "Tbilisi, wine country, Caucasus drive.", priceLabel: "₹ 1,15,000 / pp" },
      { title: "Rajasthan Palaces · 10 Days", description: "Udaipur, Jaipur, Jaisalmer · heritage stays.", priceLabel: "₹ 1,25,000 / pp" },
      { title: "Sri Lanka · Tea to Sea · 8 Days", description: "Kandy, Ella, Yala safari, Galle beach.", priceLabel: "₹ 78,000 / pp" },
    ],
    galleryCaptions: [
      "Kerala backwaters at dawn",
      "Ubud rice terraces",
      "Ladakh moonscape",
      "Jaisalmer sunset dunes",
      "Bali beach villa",
      "Kazbegi Caucasus drive",
    ],
    testimonials: [
      { name: "Meera & Vivek Kapoor", role: "Honeymoon · Bali", city: "Mumbai", rating: 5, review: "Karan planned every villa transfer. We had zero stress for 8 days." },
      { name: "Sneha Iyengar", role: "Ladakh · 2024", city: "Bengaluru", rating: 5, review: "Frozen Zanskar with a small group — the trip of our lives." },
      { name: "The Patel Family", role: "Kerala · 6 pax", city: "Ahmedabad", rating: 5, review: "Every meal, driver, houseboat was handpicked. Best family trip in years." },
    ],
    faqs: [
      { question: "Do you handle visas?", answer: "Yes — full visa handling for 40+ countries with document checklists and same-day appointments." },
      { question: "Do I have to pay everything upfront?", answer: "Book with 25% and pay in three instalments until 30 days before travel." },
      { question: "What if something goes wrong on the trip?", answer: "24×7 WhatsApp support for the duration of your trip — one number, always answered." },
      { question: "Do you plan solo & women-only trips?", answer: "Absolutely. Every quarter we run a curated women-only trip and solo-friendly departures." },
    ],
    htmlWidget: {
      title: "Featured Escape",
      html: `<div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,#ffd7b1,#ff9077);color:#3b1a0d;font-family:sans-serif"><div style="font-size:11px;opacity:.7;letter-spacing:.18em;text-transform:uppercase">Fixed Departure · March 2026</div><div style="font-size:22px;margin-top:6px;font-weight:700">Frozen Zanskar · 9 days</div><div style="font-size:13px;opacity:.8;margin-top:4px">₹ 89,000 · only 4 seats left</div></div>`,
    },
    downloadLabel: "Featured Itineraries (PDF)",
    downloadDescription: "Sample itineraries with day-by-day breakdown and inclusions.",
  },

  {
    key: "casa-verde-homes",
    id: "22222222-000a-4000-8000-00000000000a",
    slug: "casa-verde-homes",
    name: "Casa Verde Homes",
    ownerName: "Ishaan Chopra",
    ownerRole: "Founder · MRICS",
    category: "business",
    industryLabel: "Boutique Real Estate",
    themePreset: "business",
    cityState: "Sector 62, Noida",
    address: "L-Tower, Sector 62, Noida 201309",
    hours: "Mon – Sat · 10:00 AM – 7:30 PM",
    tagline: "Homes worth coming home to.",
    bio: "Curated residential inventory in Noida, Gurugram & New Delhi · legal-vetted, RERA-checked, transparent brokerage.",
    aboutLong:
      "Casa Verde has closed 340+ residential transactions since 2018. Every property is legal-vetted, RERA-checked, and physically walked by our team before being listed.",
    whatsapp: "+919810123400",
    phone: "+911204567890",
    email: "hello@casaverdehomes.in",
    website: "https://casaverdehomes.in",
    mapEmbedUrl: map("Sector 62 Noida"),
    seo: {
      title: "Casa Verde Homes · Boutique Real Estate in NCR",
      description: "Curated, legal-vetted residential listings in Noida, Gurugram and New Delhi.",
      ogTitle: "Casa Verde Homes — real estate you can trust",
      ogDescription: "340+ closed deals. RERA-verified. No hidden brokerage.",
      keywords: ["real estate noida", "property gurugram", "3bhk sector 62"],
    },
    customDomain: "casaverdehomes.in",
    socials: {
      instagram: "https://instagram.com/casaverde.homes",
      linkedin: "https://linkedin.com/company/casaverdehomes",
      youtube: "https://youtube.com/@casaverdehomes",
      whatsapp: "https://wa.me/919810123400",
    },
    ctas: [
      { label: "Book a Site Visit", url: "https://wa.me/919810123400?text=I%27d%20like%20to%20book%20a%20site%20visit", action: "whatsapp" },
      { label: "Curated Listings", url: "https://casaverdehomes.in/listings", action: "website" },
      { label: "Home Loan Support", url: "https://casaverdehomes.in/loans", action: "website" },
      { label: "Sell Your Property", url: "https://casaverdehomes.in/sell", action: "website" },
    ],
    cataloguePrefix: "Featured Listings",
    catalogueKind: "product",
    catalogue: [
      { title: "3 BHK · Jaypee Greens · Noida", description: "1,850 sq ft · fully furnished · 8th floor.", priceLabel: "₹ 2.15 Cr" },
      { title: "4 BHK Villa · Ansal Emerald", description: "3,200 sq ft · garden · community pool.", priceLabel: "₹ 4.85 Cr" },
      { title: "2 BHK · Gaur City · Ready", description: "1,150 sq ft · east-facing · park view.", priceLabel: "₹ 87 L" },
      { title: "Builder Floor · GK-1 · Delhi", description: "2,400 sq ft · lift · basement parking.", priceLabel: "₹ 5.25 Cr" },
      { title: "3 BHK · DLF Camellias · Gurugram", description: "3,850 sq ft · Golf course · concierge.", priceLabel: "₹ 12.5 Cr" },
      { title: "Commercial Office · Sec 132", description: "2,100 sq ft · Grade A · leased at 8.4% yield.", priceLabel: "₹ 3.4 Cr" },
    ],
    galleryCaptions: [
      "Jaypee Greens · 3 BHK",
      "Ansal Emerald · villa view",
      "GK-1 builder floor",
      "DLF Camellias golf view",
      "Community amenity deck",
      "Grade A office space",
    ],
    testimonials: [
      { name: "Ankit Sinha", role: "First-time buyer", city: "Noida", rating: 5, review: "Ishaan walked us through 14 properties, no pressure. Closed the right one in 6 weeks." },
      { name: "Reena Malik", role: "NRI seller", city: "London", rating: 5, review: "Sold our Delhi flat while abroad — full videos, legal support, no surprises." },
      { name: "Vishal & Priya Grover", role: "Upgraders", city: "Gurugram", rating: 5, review: "Bought in DLF Camellias with confidence. Every legal check was done for us." },
    ],
    faqs: [
      { question: "Do I pay you brokerage?", answer: "One-time 1.5% on the transacted value — no advance retainer, invoice at closing." },
      { question: "Do you handle NRI transactions?", answer: "Yes — power-of-attorney handling, remote closing, tax structuring with our CA panel." },
      { question: "How do you shortlist properties?", answer: "We physically walk every listing, verify RERA and titles, and share a curated shortlist." },
      { question: "Can you help with home loans?", answer: "Yes — panel of 12 banks; approvals in 5-7 working days at negotiated rates." },
    ],
    htmlWidget: {
      title: "Home Loan Calculator",
      html: `<div style="padding:16px;border-radius:14px;background:#0f172a;color:#e4edff;font-family:sans-serif"><div style="font-size:11px;opacity:.7;letter-spacing:.16em;text-transform:uppercase">Sample EMI · 20 yrs @ 8.75%</div><div style="font-size:22px;margin-top:6px;font-weight:600">₹ 88,371 / month</div><div style="font-size:13px;opacity:.75;margin-top:4px">on a ₹ 1 Cr loan · pre-approval in 5 days</div></div>`,
    },
    downloadLabel: "Buyer's Guide 2026 (PDF)",
    downloadDescription: "Legal, tax and negotiation guide for NCR homebuyers.",
  },

  {
    key: "pixel-forge",
    id: "22222222-000b-4000-8000-00000000000b",
    slug: "pixel-forge",
    name: "Pixel Forge Digital",
    ownerName: "Yash Patel",
    ownerRole: "Co-founder · Creative Director",
    category: "agency",
    industryLabel: "Digital Growth Agency",
    themePreset: "modern",
    cityState: "SG Highway, Ahmedabad",
    address: "Titanium One, SG Highway, Ahmedabad 380054",
    hours: "Mon – Fri · 10:00 AM – 7:30 PM",
    tagline: "Design-led growth for D2C, SaaS & retail",
    bio: "Full-stack digital agency · branding, web, SEO, performance ads · trusted by 60+ Indian and global brands.",
    aboutLong:
      "Pixel Forge is a 22-person studio building brands and growth systems. We ship real work every 2 weeks, with weekly async reports and Slack channels shared with every client.",
    whatsapp: "+917990123456",
    phone: "+917926789012",
    email: "hello@pixelforge.co",
    website: "https://pixelforge.co",
    mapEmbedUrl: map("Titanium One SG Highway Ahmedabad"),
    seo: {
      title: "Pixel Forge · Digital Growth Agency in Ahmedabad",
      description: "Branding, web, SEO and performance ads for D2C, SaaS and retail brands in India and abroad.",
      ogTitle: "Pixel Forge Digital — design-led growth from Ahmedabad",
      ogDescription: "See case studies and book a discovery call.",
      keywords: ["digital agency ahmedabad", "seo agency india", "d2c growth agency"],
    },
    customDomain: "pixelforge.co",
    socials: {
      instagram: "https://instagram.com/pixelforgedigital",
      linkedin: "https://linkedin.com/company/pixelforge-digital",
      youtube: "https://youtube.com/@pixelforge",
      website: "https://pixelforge.co",
    },
    ctas: [
      { label: "Book a Discovery Call", url: "https://pixelforge.co/discovery", action: "website" },
      { label: "See Case Studies", url: "https://pixelforge.co/work", action: "website" },
      { label: "Get a Proposal", url: "https://wa.me/917990123456?text=Send%20me%20a%20proposal", action: "whatsapp" },
      { label: "Careers", url: "https://pixelforge.co/careers", action: "website" },
    ],
    cataloguePrefix: "Services",
    catalogueKind: "service",
    catalogue: [
      { title: "Brand Identity", description: "Positioning, verbal + visual system, brand guide.", priceLabel: "From ₹ 4.5 L" },
      { title: "Website & E-commerce", description: "Design + build on Shopify / Framer / Next.js.", priceLabel: "From ₹ 6 L" },
      { title: "SEO & Content", description: "Technical audit, monthly content, on-page + off-page.", priceLabel: "From ₹ 1.2 L / mo" },
      { title: "Performance Marketing", description: "Meta, Google, YouTube — creative + media.", priceLabel: "From ₹ 1.5 L / mo" },
      { title: "Product Design (UX)", description: "Research, prototyping, design system for SaaS.", priceLabel: "From ₹ 4 L / sprint" },
      { title: "Retainer · Growth Pod", description: "Design + dev + growth · fixed monthly team.", priceLabel: "From ₹ 3.5 L / mo" },
    ],
    galleryCaptions: [
      "D2C rebrand · case study",
      "SaaS marketing site launch",
      "Studio floor · Ahmedabad",
      "Client workshop day",
      "Brand book · print",
      "Meta creative shoot",
    ],
    testimonials: [
      { name: "Ritvik Shah", role: "CEO, Nourish D2C", city: "Mumbai", rating: 5, review: "Rebranded and rebuilt our site in 8 weeks. Conversion up 61% since launch." },
      { name: "Kanika Bansal", role: "Head of Growth, Cloudkite", city: "Bengaluru", rating: 5, review: "Best agency partnership we've had. Weekly reports, no fluff, real numbers." },
      { name: "Aakash Rao", role: "Founder, Fablearn", city: "Ahmedabad", rating: 5, review: "Went from zero to first ₹1 Cr in 5 months of paid + organic. Highly recommend." },
    ],
    faqs: [
      { question: "What size clients do you work with?", answer: "D2C brands ₹1-50 Cr ARR, seed-to-Series-B SaaS, and select retail chains." },
      { question: "How do we start?", answer: "30-min discovery call, then a written scoping proposal within 5 working days." },
      { question: "Do you work with international clients?", answer: "Yes — 30% of our book is UK, US and MENA; all billing in USD or GBP." },
      { question: "How do you report progress?", answer: "Weekly async Loom + monthly live review. Shared Slack channel + Notion workspace." },
    ],
    htmlWidget: {
      title: "Latest Case Study",
      html: `<div style="padding:16px;border-radius:14px;background:linear-gradient(135deg,#ecf3ff,#c8dcff);color:#0a2454;font-family:sans-serif;border:1px solid #a7c2ff"><div style="font-size:11px;opacity:.7;letter-spacing:.18em;text-transform:uppercase">Case Study · D2C · Nourish</div><div style="font-size:22px;margin-top:6px;font-weight:700">+61% conversion</div><div style="font-size:13px;opacity:.8;margin-top:4px">Rebrand + site rebuild · 8 weeks</div></div>`,
    },
    downloadLabel: "Agency Deck 2026 (PDF)",
    downloadDescription: "Services, case studies, team and pricing overview.",
  },

  {
    key: "meher-associates",
    id: "22222222-000c-4000-8000-00000000000c",
    slug: "meher-associates",
    name: "Meher & Associates · Advocates",
    ownerName: "Adv. Meher Krishnan",
    ownerRole: "Managing Partner · Bar Council of India",
    category: "business",
    industryLabel: "Corporate & Commercial Law Firm",
    themePreset: "minimal",
    cityState: "Nungambakkam, Chennai",
    address: "Sterling Road, Nungambakkam, Chennai 600034",
    hours: "Mon – Fri · 10:00 AM – 6:30 PM · By appointment",
    tagline: "Considered counsel for founders, families and boards.",
    bio: "Corporate, commercial and dispute resolution practice · 18 years' bar experience · trusted by 120+ clients across South India.",
    aboutLong:
      "Meher & Associates advises promoters, boards, HNIs and venture-backed companies on M&A, contracts, family arrangements, and commercial disputes. Fee-transparent, always in writing.",
    whatsapp: "+919840123456",
    phone: "+914428234567",
    email: "office@meherlaw.in",
    website: "https://meherlaw.in",
    mapEmbedUrl: map("Sterling Road Nungambakkam Chennai"),
    seo: {
      title: "Meher & Associates · Corporate Law Firm in Chennai",
      description: "Corporate, commercial and dispute-resolution practice in Nungambakkam, Chennai. 18 years' bar experience.",
      ogTitle: "Meher & Associates · Advocates · Chennai",
      ogDescription: "Book a consultation with our senior partners.",
      keywords: ["corporate lawyer chennai", "m&a advocate india", "law firm nungambakkam"],
    },
    customDomain: "meherlaw.in",
    socials: {
      linkedin: "https://linkedin.com/company/meher-associates",
      whatsapp: "https://wa.me/919840123456",
      website: "https://meherlaw.in",
    },
    ctas: [
      { label: "Book a Consultation", url: "https://wa.me/919840123456?text=I%27d%20like%20to%20book%20a%20consultation", action: "whatsapp" },
      { label: "Practice Areas", url: "https://meherlaw.in/practice", action: "website" },
      { label: "Partner Directory", url: "https://meherlaw.in/team", action: "website" },
      { label: "Publications", url: "https://meherlaw.in/thinking", action: "website" },
    ],
    cataloguePrefix: "Practice Areas",
    catalogueKind: "service",
    catalogue: [
      { title: "Corporate & M&A", description: "Structuring, due diligence, share purchase, JVs.", priceLabel: "Retainer / fixed" },
      { title: "Commercial Contracts", description: "SaaS, distribution, franchise, IP licensing.", priceLabel: "Fixed fee" },
      { title: "Family & Succession", description: "Wills, family constitutions, HUF partitions.", priceLabel: "Fixed fee" },
      { title: "Dispute Resolution", description: "Commercial suits, arbitration, cheque bounce.", priceLabel: "Hourly / brief fee" },
      { title: "Startup Counsel", description: "Founders' agreements, ESOPs, term sheets, SHA.", priceLabel: "Retainer" },
      { title: "Regulatory & Compliance", description: "SEBI, RBI, FEMA, competition law.", priceLabel: "As needed" },
    ],
    galleryCaptions: [
      "Reception, Nungambakkam office",
      "Partners' conference room",
      "Library & research suite",
      "Client meeting bay",
      "Court chambers · Chennai HC",
      "Team offsite · 2025",
    ],
    testimonials: [
      { name: "Suresh Krishnamurthy", role: "Promoter · Family business", city: "Chennai", rating: 5, review: "Meher handled our succession plan with sensitivity. We finally have clarity." },
      { name: "Anita Iyer", role: "Founder, SaaS startup", city: "Chennai", rating: 5, review: "She structured our Series-A term sheet in a way our investors respected. Rare skill." },
      { name: "R. Venkatesh", role: "Board member, listed co.", city: "Bengaluru", rating: 5, review: "Sharp, discreet, always clear on cost. We use them for all sensitive matters." },
    ],
    faqs: [
      { question: "How do you charge?", answer: "Fixed fee for defined scope; hourly for open-ended matters. Always agreed in writing upfront." },
      { question: "Do you handle international matters?", answer: "Yes — cross-border M&A, contracts and family disputes with our associate offices in London and Singapore." },
      { question: "Do you offer a first consultation?", answer: "60-minute paid consultation at ₹4,500, credited to your retainer if you engage us." },
      { question: "Is my matter confidential?", answer: "All communications are covered by attorney-client privilege and firm-wide encryption." },
    ],
    htmlWidget: {
      title: "Latest Publication",
      html: `<div style="padding:18px;border-radius:12px;background:#f6f4ee;color:#22201b;font-family:'Playfair Display',serif;border:1px solid #e1dcd0"><div style="font-size:11px;opacity:.65;letter-spacing:.2em;text-transform:uppercase;font-family:sans-serif">M&A · March 2026</div><div style="font-size:20px;margin-top:6px;font-weight:600;line-height:1.3">Founder liquidity: five clauses to negotiate before signing</div></div>`,
    },
    downloadLabel: "Firm Brochure (PDF)",
    downloadDescription: "Practice areas, partner bios and representative matters.",
  },
];
