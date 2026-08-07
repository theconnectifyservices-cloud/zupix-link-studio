import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Globe2, 
  ShieldCheck, 
  Palette, 
  BarChart3, 
  LayoutTemplate,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  ShoppingBag,
  Clock,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Menu,
  X,
  Calendar,
  CreditCard,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "./components/navbar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CtaButton } from "./components/cta-button";
import { PORTRAITS, COVERS } from "./demo-media";
import { BUILTIN_TEMPLATES } from "@/features/templates/catalog";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Profiles",
    desc: "Build trust instantly with verified blue badges and authentic business credentials."
  },
  {
    icon: Zap,
    title: "One-Click UPI Payments",
    desc: "Accept payments directly into your bank account via GPay, PhonePe, and Paytm."
  },
  {
    icon: Globe2,
    title: "Custom Domain Support",
    desc: "Connect your own domain like yourname.in to keep your brand professional."
  },
  {
    icon: Palette,
    title: "Premium Font Engine",
    desc: "Choose from 1,200+ Google Fonts and premium typefaces for a unique look."
  },
  {
    icon: BarChart3,
    title: "Enterprise Analytics",
    desc: "Track every click, location, and device with high-accuracy traffic insights."
  },
  {
    icon: LayoutTemplate,
    title: "Mini Websites",
    desc: "Go beyond links. Add store items, booking forms, and rich content blocks."
  }
];

const COMPARISON_FEATURES = [
  { name: "Bio Links", free: "1", starter: "3", pro: "10" },
  { name: "Mini Websites", free: "Basic", starter: "3", pro: "10" },
  { name: "Unlimited Buttons", free: false, starter: true, pro: true },
  { name: "Products Store", free: false, starter: true, pro: true },
  { name: "Booking System", free: false, starter: "Basic Forms", pro: "Advanced Calendar" },
  { name: "UPI Payments", free: false, starter: true, pro: true },
  { name: "Payment Gateways", free: false, starter: "Basic", pro: "Razorpay / Cashfree" },
  { name: "Custom Domain", free: false, starter: false, pro: true },
  { name: "Remove Branding", free: false, starter: false, pro: true },
  { name: "AI Studio", free: false, starter: false, pro: true },
  { name: "Analytics", free: "Basic", starter: "Standard", pro: "Advanced" },
  { name: "Social Embeds", free: "Basic", starter: "Standard", pro: "Full Suite" },
  { name: "Verified Badge", free: false, starter: false, pro: true },
  { name: "Premium Themes", free: false, starter: true, pro: true },
  { name: "SEO Tools", free: false, starter: "Basic", pro: "Advanced" },
  { name: "Support", free: "Community", starter: "Email", pro: "Priority" },
];

const PRICING = [
  {
    name: "FREE",
    price: { monthly: "₹0", yearly: "₹0" },
    desc: "Perfect for students & hobbyists",
    features: [
      "1 Bio Link",
      "Basic Theme",
      "Basic Buttons",
      "ZUPIX Branding",
      "Basic Analytics",
      "Community Support"
    ],
    cta: "Start for Free",
    popular: false
  },
  {
    name: "STARTER",
    price: { monthly: "₹299", yearly: "₹299" },
    desc: "Perfect for creators & growing businesses.",
    features: [
      "3 Bio Links",
      "3 Mini Websites",
      "Products Store",
      "Booking Forms",
      "Accept UPI Payments",
      "WhatsApp Button",
      "Social Media Embeds",
      "Contact Forms",
      "Image Gallery",
      "YouTube Embed",
      "Spotify Embed",
      "PDF Downloads",
      "Premium Themes",
      "QR Code",
      "Basic SEO",
      "Basic Analytics",
      "Email Support"
    ],
    cta: "Start 3-Day Free Trial",
    popular: false
  },
  {
    name: "PRO",
    price: { monthly: "₹499", yearly: "₹499" },
    desc: "Everything in Starter +",
    features: [
      "10 Bio Links",
      "10 Mini Websites",
      "Unlimited Buttons",
      "Products Store",
      "Booking System",
      "Appointment Calendar",
      "Razorpay Integration",
      "Cashfree Integration",
      "Custom Domain",
      "Remove Branding",
      "HTML/CSS/JS Embed",
      "Google Maps Embed",
      "Instagram Feed",
      "Facebook Feed",
      "LinkedIn Embed",
      "X (Twitter) Embed",
      "Threads Embed",
      "YouTube Playlist",
      "Spotify Embed",
      "WhatsApp Catalog",
      "Lead Forms",
      "Popup Forms",
      "AI Content Assistant",
      "Premium Templates",
      "Advanced Analytics",
      "Conversion Tracking",
      "Facebook Pixel",
      "Google Analytics",
      "Meta Verification",
      "SEO Tools",
      "Priority Support"
    ],
    cta: "Start 3-Day Free Trial",
    popular: true
  }
];

const TESTIMONIALS = [
  {
    name: "Rohan Kalyan",
    role: "Founder, Kalyan Heritage",
    image: PORTRAITS.jewellerOwner,
    content: "Our showroom visits tripled after we moved our catalog to ZUPIX. The UPI integration is a game-changer for Indian retail."
  },
  {
    name: "Dr. Ananya Rao",
    role: "Dermatologist",
    image: PORTRAITS.drAnanya,
    content: "The booking form on my bio link has streamlined my clinic appointments. Simple, professional, and very efficient."
  },
  {
    name: "Karan Malhotra",
    role: "Creative Director",
    image: PORTRAITS.karan,
    content: "Portfolio on one link. It's fast, beautiful, and works perfectly on mobile. The custom domain support is exactly what I needed."
  }
];

const FAQS = [
  {
    q: "How is ZUPIX different from Linktree?",
    a: "ZUPIX is built specifically for Indian businesses. We include deep UPI integrations (no commissions), verified profiles, and multi-page mini-website capabilities that global tools lack."
  },
  {
    q: "Can I use my own domain?",
    a: "Yes! On our Shikhar plan, you can connect your own domain (e.g., store.yourbrand.in) and even map custom paths."
  },
  {
    q: "Is there a transaction fee on payments?",
    a: "No. ZUPIX doesn't take any commission on your UPI payments. You keep 100% of what you earn."
  },
  {
    q: "Do I need design skills?",
    a: "Not at all. Pick a template, upload your logo, and add your links. Our builder handles all the layout and responsiveness for you."
  }
];

function NumberTicker({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const target = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.]/g, "");
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasAnimated, target, duration]);

  return <div ref={elementRef} className="inline-block">{count}{suffix}</div>;
}

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const width = el.offsetWidth;
      // We need a more accurate way since cards are 85vw
      const children = el.children;
      if (children.length === 0) return;
      
      const cardWidth = (children[0] as HTMLElement).offsetWidth + 16; // 16 is gap-4
      const index = Math.round(scrollLeft / cardWidth);
      setActiveSlide(Math.min(index, 4));
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main id="hero" className="min-h-screen bg-[#090B18] text-white selection:bg-[#FF6A3D]/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden lg:pt-48 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-[#FF6A3D]/10 via-transparent to-transparent blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#B9C0D4] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="flex h-2 w-2 rounded-full bg-[#FF6A3D] animate-pulse" />
                India's Premium Bio Link Platform
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both leading-[1.1]">
                Beautiful Bio Links<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2DAA] via-[#FF4D8D] to-[#FF7A45]">
                  That Actually Convert.
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-[#B9C0D4] max-w-2xl lg:max-w-none mx-auto lg:mx-0 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both leading-relaxed">
                Build professional <span className="text-white font-medium">Bio Links</span> and <span className="text-white font-medium">Mini Websites</span> in minutes. Accept <span className="text-white font-medium">Payments</span>, sell <span className="text-white font-medium">Products</span>, and verify your brand with <span className="text-white font-medium">Custom Domains</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-[14px] sm:gap-4 mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both w-full max-w-[400px] min-[480px]:max-w-[500px] sm:max-w-none mx-auto lg:mx-0">
                <CtaButton to="/auth" className="w-full sm:flex-1 h-[56px] px-6 text-base font-semibold">
                  Start 3-Day Free Trial
                </CtaButton>
                <CtaButton to="/auth" variant="secondary" showIcon={true} icon={<Sparkles className="w-4 h-4 text-[#FF2DAA]" />} className="w-full sm:flex-1 h-[56px] px-6 text-base font-semibold">
                  Watch Live Demo
                </CtaButton>
              </div>

              {/* Trust Badges Below CTA */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 animate-in fade-in duration-1000 delay-500 fill-mode-both">
                {[
                  { icon: ShieldCheck, label: "Made in India" },
                  { icon: Zap, label: "UPI Ready" },
                  { icon: CheckCircle2, label: "Verified Profiles" },
                  { icon: Globe2, label: "Custom Domains" },
                  { icon: BarChart3, label: "Analytics Included" }
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] font-medium text-[#B9C0D4]/80">
                    <badge.icon className="w-3.5 h-3.5 text-[#FF2DAA]" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Phone Mockup - 40-45% width on desktop */}
            <div className="w-full max-w-[340px] lg:max-w-[420px] lg:w-[42%] relative animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
              <div className="absolute inset-0 bg-[#FF2DAA]/20 blur-[100px] rounded-full pointer-events-none -z-10" />
              
              {/* Premium Phone Frame */}
              <div className="relative rounded-[50px] border-[10px] border-[#12152A] bg-[#090B18] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden aspect-[9/18.5]">
                {/* Status Bar */}
                <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-8 pt-2 z-20">
                  <span className="text-[10px] font-bold">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-2 rounded-[2px] border border-white/30" />
                  </div>
                </div>

                {/* Bio Profile Content (Non-scrolling Focus) */}
                <div className="h-full pt-16 px-6 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full border-2 border-[#FF2DAA] p-1">
                      <img src={PORTRAITS.drAnanya} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#007AFF] text-white p-1 rounded-full border-2 border-[#090B18]">
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">Dr. Ananya Rao</h3>
                  <p className="text-sm text-[#B9C0D4] mb-8 text-center px-4">Helping you glow with science-backed skincare. Founder of Glow Studio.</p>
                  
                  {/* Premium Buttons */}
                  <div className="w-full space-y-3 mb-8">
                    {[
                      { label: "Book Consultation", color: "#FF2DAA" },
                      { label: "View Shop", color: "#12152A" },
                      { label: "WhatsApp Me", color: "#12152A" }
                    ].map((btn, i) => (
                      <div key={i} className={cn(
                        "w-full h-12 rounded-2xl flex items-center justify-center text-sm font-bold border border-white/10 shadow-lg",
                        btn.color === "#12152A" ? "bg-[#12152A] text-white" : "bg-[#FF2DAA] text-white"
                      )}>
                        {btn.label}
                      </div>
                    ))}
                  </div>

                  {/* Visual blocks: Gallery & Products Mini Preview */}
                  <div className="w-full grid grid-cols-2 gap-3 mb-6">
                    <div className="aspect-square rounded-2xl bg-[#12152A] border border-white/5 overflow-hidden">
                      <img src={COVERS.restaurant} className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div className="aspect-square rounded-2xl bg-[#12152A] border border-white/5 overflow-hidden">
                      <img src={COVERS.fashion} className="w-full h-full object-cover opacity-60" />
                    </div>
                  </div>

                  <div className="w-full p-4 rounded-2xl bg-[#12152A] border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF2DAA]/20 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-[#FF2DAA]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-tighter opacity-50">FEATURED PRODUCT</div>
                      <div className="text-sm font-bold">Skin Revive Serum</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Why ZUPIX - Features */}
      <section id="features" className="py-24 sm:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">Built for Performance.<br />Designed for Elegance.</h2>
            <p className="text-lg text-[#B9C0D4]">Stop using cluttered link tools. ZUPIX gives you a professional enterprise-grade platform to grow your brand.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group p-6 sm:p-8 rounded-[22px] border border-white/5 bg-[#12152A] hover:border-[#FF6A3D]/30 transition-all duration-300 flex flex-col h-full">
                <div className="h-12 w-12 rounded-xl bg-[#FF6A3D]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shrink-0">
                  <f.icon className="h-6 w-6 text-[#FF6A3D]" />
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-[#B9C0D4] leading-[1.6] text-[15px] sm:text-base lg:text-[17px]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Section - Everything Your Business Needs */}
      <section id="features-bento" className="py-24 sm:py-32 bg-[#090B18] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-4xl sm:text-6xl font-bold mb-8 tracking-tight">
              Everything Your Business Needs.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2DAA] via-[#FF4D8D] to-[#FF7A45]">
                One Link.
              </span>
            </h2>
            <p className="text-xl text-[#B9C0D4] leading-relaxed">
              Stop paying for multiple tools. ZUPIX Link Studio combines your Bio Link, Mini Website, Store, Booking, Payments and Marketing into one powerful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:auto-rows-[240px] auto-rows-auto items-stretch">
            {/* Sell Products - Large Feature Card */}
            <div className="md:col-span-8 md:row-span-2 group relative p-6 sm:p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-[#FF2DAA]/30 transition-all duration-500 flex flex-col h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF2DAA]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-[#FF2DAA]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <ShoppingBag className="h-7 w-7 text-[#FF2DAA]" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Sell Products</h3>
                  <p className="text-[#B9C0D4] text-base sm:text-lg leading-[1.6] max-w-md">Create your own mini online store. Sell physical and digital products with inventory management, discounts, and seamless UPI payments.</p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {["Physical + Digital", "Inventory", "Discounts", "0% Fee"].map((tag) => (
                    <span key={tag} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-[#B9C0D4]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#FF2DAA]/10 blur-[80px] rounded-full group-hover:bg-[#FF2DAA]/20 transition-all duration-700 pointer-events-none" />
            </div>

            {/* Accept Payments - Medium Card */}
            <div className="md:col-span-4 md:row-span-2 group relative p-6 sm:p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-[#FF7A45]/30 transition-all duration-500 flex flex-col h-full">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1">
                  <div className="h-12 w-12 rounded-xl bg-[#FF7A45]/10 flex items-center justify-center mb-6">
                    <CreditCard className="h-6 w-6 text-[#FF7A45]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">Accept Payments</h3>
                  <p className="text-[#B9C0D4] leading-[1.6] text-[15px] sm:text-base mb-8">Integrated with Razorpay, Cashfree, and PayU. Support for offline UPI with manual approval.</p>
                </div>
                <div className="mt-auto space-y-3">
                  {["Razorpay", "Cashfree", "PayU", "Offline UPI"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-[#B9C0D4]">
                      <CheckCircle2 className="h-4 w-4 text-[#FF7A45]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Appointment Booking - Medium Card */}
            <div className="md:col-span-4 md:row-span-2 group relative p-6 sm:p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-[#FF4D8D]/30 transition-all duration-500 flex flex-col h-full">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1">
                  <div className="h-12 w-12 rounded-xl bg-[#FF4D8D]/10 flex items-center justify-center mb-6">
                    <Calendar className="h-6 w-6 text-[#FF4D8D]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">Appointment Booking</h3>
                  <p className="text-[#B9C0D4] leading-[1.6] text-[15px] sm:text-base mb-6">Professional calendar booking with time slots, auto-confirmation, and WhatsApp notifications.</p>
                </div>
                <ul className="space-y-2 mt-auto">
                  {["Time Slots", "Auto Confirm", "WhatsApp Alerts"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#B9C0D4]/70">
                      <Plus className="w-3 h-3 text-[#FF4D8D]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Assistant - Large Card */}
            <div className="md:col-span-8 md:row-span-2 group relative p-6 sm:p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-purple-500/30 transition-all duration-500 flex flex-col h-full">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-purple-400" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                    Coming Soon
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">AI Studio</h3>
                  <p className="text-[#B9C0D4] text-base sm:text-lg leading-[1.6] max-w-md mb-8">Our AI assistant doesn't just chat—it builds. Generate bios, CTAs, headlines, and descriptions tailored for your brand in seconds.</p>
                </div>
                <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {["Bio Gen", "CTA Gen", "Content Gen", "Headline Gen"].map((tool) => (
                    <div key={tool} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-[10px] sm:text-xs font-medium">
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Domain - Medium Card */}
            <div className="md:col-span-6 md:row-span-1 group relative p-6 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-blue-500/30 transition-all duration-500 flex items-center">
              <div className="relative z-10 flex items-center gap-6">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Globe2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">Custom Domain</h3>
                  <p className="text-[13px] sm:text-sm text-[#B9C0D4] leading-relaxed">yourbrand.com with free SSL & one-click connect.</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Integration - Medium Card */}
            <div className="md:col-span-6 md:row-span-1 group relative p-6 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-green-500/30 transition-all duration-500 flex items-center">
              <div className="relative z-10 flex items-center gap-6">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">WhatsApp Catalog</h3>
                  <p className="text-[13px] sm:text-sm text-[#B9C0D4] leading-relaxed">One-click chat, order capture, and lead management.</p>
                </div>
              </div>
            </div>

            {/* Analytics Dashboard - Medium Card */}
            <div className="md:col-span-12 md:row-span-2 group relative p-6 sm:p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:border-cyan-500/30 transition-all duration-500 flex flex-col h-full">
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-1">
                  <div className="flex flex-col h-full">
                    <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                      <BarChart3 className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4">Analytics Dashboard</h3>
                    <p className="text-[#B9C0D4] text-base sm:text-lg leading-[1.6]">Real-time tracking of visitors, clicks, CTR, device types, and traffic sources with precision.</p>
                  </div>
                  <div className="flex flex-row flex-wrap justify-between gap-y-3 gap-x-0 mt-auto w-full relative z-[1]">
                    {[
                      { label: "Visitors", value: "12k+" },
                      { label: "CTR", value: "8.4+" },
                      { label: "Sales", value: "₹45k" },
                      { label: "Growth", value: "+24%" }
                    ].map((stat) => (
                      <div 
                        key={stat.label} 
                        className="group/kpi p-3 sm:p-5 rounded-2xl bg-[#1A1C2E]/80 border border-white/10 text-center backdrop-blur-md shadow-xl transition-all duration-300 active:scale-[0.98] flex flex-col items-center justify-center min-h-[90px] w-[calc(50%-6px)] md:w-[calc(25%-12px)]"
                      >
                        <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-white mb-1.5 tracking-tight group-hover/kpi:text-cyan-400 transition-colors whitespace-nowrap">
                          <NumberTicker value={stat.value} />
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-[#B9C0D4]/60 uppercase tracking-widest group-hover/kpi:text-[#B9C0D4] transition-colors whitespace-nowrap">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Highlight Statistics */}
          <div className="mt-24 py-16 border-y border-white/5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 text-center">
            {[
              { label: "Premium Themes", value: "75+" },
              { label: "Business Modules", value: "15+" },
              { label: "Payment Options", value: "10+" },
              { label: "Bio Pages", value: "10" },
              { label: "Custom Domains", value: "Free" },
              { label: "AI Powered", value: "Yes" },
              { label: "Made in India", value: "🇮🇳" }
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF2DAA] to-[#FF7A45] mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-[11px] font-bold text-[#B9C0D4] uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Bottom CTA for Section */}
          <div className="mt-32 text-center max-w-3xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-[#12152A] to-[#090B18] border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#FF2DAA]/5 pointer-events-none" />
            <h3 className="text-3xl sm:text-5xl font-bold mb-6">Everything you need to grow online. Nothing you don't.</h3>
            <div className="flex flex-col sm:flex-row min-[480px]:flex-wrap items-center justify-center gap-4">
              <CtaButton to="/auth" className="min-[480px]:flex-1 min-[480px]:min-w-[220px]">
                Start 3-Day Free Trial
              </CtaButton>
              <CtaButton to="/auth" variant="secondary" showIcon={false} className="min-[480px]:flex-1 min-[480px]:min-w-[220px]">
                See Live Demo
              </CtaButton>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight">Choose Your Plan</h2>
            <p className="text-xl text-[#B9C0D4]">Power up your online presence with professional tools designed for growth.</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-16">
            <span className={cn("text-sm font-medium transition-colors", billingCycle === 'monthly' ? "text-white" : "text-[#B9C0D4]")}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 rounded-full bg-white/10 border border-white/10 p-1 transition-all duration-300"
            >
              <div className={cn(
                "w-5 h-5 rounded-full bg-gradient-to-r from-[#FF2DAA] to-[#FF7A45] transition-all duration-300 transform shadow-lg",
                billingCycle === 'yearly' ? "translate-x-7" : "translate-x-0"
              )} />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium transition-colors", billingCycle === 'yearly' ? "text-white" : "text-[#B9C0D4]")}>Yearly</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FF2DAA]/20 border border-[#FF2DAA]/30 text-[10px] font-bold text-[#FF2DAA] uppercase tracking-wider">
                Save 50%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-32 items-stretch">
            {PRICING.map((p, i) => (
              <div key={i} className={cn(
                "relative p-8 sm:p-10 rounded-[32px] border transition-all duration-500 flex flex-col group hover:shadow-[0_0_50px_-12px_rgba(255,45,170,0.3)] hover:-translate-y-2 h-full",
                p.popular 
                  ? "bg-white/[0.04] border-[#FF2DAA]/30 backdrop-blur-xl shadow-2xl z-10" 
                  : "bg-white/[0.02] border-white/5 backdrop-blur-md"
              )}>
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF2DAA] to-[#FF7A45] text-white text-[10px] font-bold px-5 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[#FF2DAA]/20">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className={cn(
                    "text-lg font-bold mb-4 tracking-widest",
                    p.popular ? "text-[#FF2DAA]" : "text-[#B9C0D4]"
                  )}>{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">
                      {typeof p.price === 'string' ? p.price : (billingCycle === 'monthly' ? p.price.monthly : p.price.yearly)}
                    </span>
                    {typeof p.price !== 'string' && (
                      <span className="text-[#B9C0D4] font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && p.name !== 'FREE' && (
                    <div className="mt-2 text-[#FF2DAA] text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Yearly savings applied
                    </div>
                  )}
                  <p className="mt-6 text-[#B9C0D4] text-base leading-relaxed">{p.desc}</p>
                </div>
                
                <div className="w-full h-px bg-white/10 mb-8" />

                <ul className="space-y-4 mb-10 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-[#B9C0D4] group/item">
                      <div className="mt-0.5 rounded-full p-0.5 bg-gradient-to-br from-[#FF2DAA]/20 to-[#FF7A45]/20">
                        <CheckCircle2 className={cn(
                          "h-4 w-4",
                          p.popular ? "text-[#FF2DAA]" : "text-[#FF7A45]"
                        )} />
                      </div>
                      <span className="group-hover/item:text-white transition-colors">{f}</span>
                    </li>
                  ))}
                </ul>

                <CtaButton 
                  to="/auth"
                  variant={p.popular ? "primary" : "secondary"}
                  className={cn(
                    "w-full h-14 text-base font-bold transition-all duration-300",
                    p.name === 'PRO' ? "bg-gradient-to-r from-[#FF2DAA] to-[#FF7A45] border-none text-white hover:opacity-90" : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                  showIcon={false}
                >
                  {p.cta}
                </CtaButton>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-5xl mx-auto mt-24">
            <div className="text-center mb-16">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">Compare Features</h3>
              <p className="text-[#B9C0D4]">Deep dive into what makes each plan unique.</p>
            </div>
            
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 font-bold text-white/50 text-xs uppercase tracking-[0.2em]">Feature</th>
                    <th className="p-6 font-bold text-center text-xs uppercase tracking-[0.2em]">Free</th>
                    <th className="p-6 font-bold text-center text-xs uppercase tracking-[0.2em]">Starter</th>
                    <th className="p-6 font-bold text-center text-xs uppercase tracking-[0.2em] text-[#FF2DAA]">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_FEATURES.map((feature, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="p-6 text-sm font-medium text-[#B9C0D4] group-hover:text-white transition-colors">{feature.name}</td>
                      <td className="p-6 text-center">
                        {typeof feature.free === 'string' ? (
                          <span className="text-xs font-bold text-white/40">{feature.free}</span>
                        ) : feature.free ? (
                          <CheckCircle2 className="h-5 w-5 text-white/20 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-white/5 mx-auto" />
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {typeof feature.starter === 'string' ? (
                          <span className="text-xs font-bold text-[#FF7A45]">{feature.starter}</span>
                        ) : feature.starter ? (
                          <CheckCircle2 className="h-5 w-5 text-[#FF7A45] mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-white/5 mx-auto" />
                        )}
                      </td>
                      <td className="p-6 text-center bg-[#FF2DAA]/5">
                        {typeof feature.pro === 'string' ? (
                          <span className="text-xs font-bold text-[#FF2DAA]">{feature.pro}</span>
                        ) : feature.pro ? (
                          <div className="relative inline-block group/check">
                            <CheckCircle2 className="h-5 w-5 text-[#FF2DAA] mx-auto relative z-10 animate-in zoom-in-50 duration-500" />
                            <div className="absolute inset-0 bg-[#FF2DAA]/40 blur-md rounded-full -z-0 opacity-0 group-hover/check:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <X className="h-5 w-5 text-white/5 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Social Ecosystem Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden bg-[#090B18]">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF2DAA]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-4xl sm:text-6xl font-bold mb-8 tracking-tight">
              One Link.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2DAA] via-[#FF4D8D] to-[#FF7A45]">
                Every Platform.
              </span>
            </h2>
            <p className="text-xl text-[#B9C0D4]">
              Connect your audience everywhere from one beautiful profile.
            </p>
          </div>

          {/* Animated Ecosystem Orbit */}
          <div className="relative h-[400px] sm:h-[600px] w-full flex items-center justify-center mb-24 perspective-1000">
            {/* Center Logo */}
            <div className="relative z-20 group">
              <div className="absolute inset-0 bg-[#FF2DAA]/40 blur-3xl rounded-full scale-150 group-hover:scale-[2] transition-transform duration-700" />
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-br from-[#FF2DAA] to-[#FF7A45] flex items-center justify-center shadow-2xl border border-white/20">
                <span className="text-3xl sm:text-4xl font-black tracking-tighter text-white">ZX</span>
              </div>
            </div>

            {/* Orbiting Icons */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { icon: Instagram, color: "#E4405F", delay: 0, radius: 140, speed: 20 },
                { icon: Twitter, color: "#1DA1F2", delay: 2, radius: 180, speed: 25 },
                { icon: Linkedin, color: "#0077B5", delay: 4, radius: 220, speed: 18, highlight: true },
                { icon: Youtube, color: "#FF0000", delay: 6, radius: 260, speed: 22 },
                { icon: MessageSquare, color: "#25D366", delay: 8, radius: 160, speed: 30 },
                { icon: Globe2, color: "#4285F4", delay: 10, radius: 240, speed: 28 },
                { icon: ShoppingBag, color: "#F72FB3", delay: 12, radius: 200, speed: 24 },
                { icon: Sparkles, color: "#A855F7", delay: 14, radius: 280, speed: 35 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    animation: `orbit ${item.speed}s linear infinite`,
                    animationDelay: `-${item.delay}s`,
                    width: `${item.radius * 2}px`,
                    height: `${item.radius * 2}px`,
                  }}
                >
                  <div 
                    className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-125 hover:border-white/30",
                      item.highlight && "ring-2 ring-[#0077B5] ring-offset-4 ring-offset-[#090B18]"
                    )}
                    style={{ 
                      boxShadow: `0 0 20px ${item.color}33`,
                    }}
                  >
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Particle Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Premium Ecosystem Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-32">
            {[
              "Social Embed", "Link Preview", "Smart Icons", "Video Embed",
              "Playlist Embed", "Google Reviews", "Maps Embed", "PDF Embed",
              "HTML Embed", "Instagram Feed", "YouTube Shorts", "LinkedIn Profile",
              "Company Page", "WhatsApp Catalog", "Telegram Channel", "Spotify Playlist"
            ].map((feature) => (
              <div key={feature} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] font-bold text-[#B9C0D4] uppercase tracking-wider hover:bg-white/[0.04] hover:border-white/10 transition-colors">
                {feature}
              </div>
            ))}
          </div>

          {/* LinkedIn Highlight Section */}
          <div className="max-w-6xl mx-auto rounded-[40px] bg-gradient-to-br from-[#0077B5]/10 via-[#090B18] to-[#FF2DAA]/5 border border-white/5 p-8 sm:p-16 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#0077B5]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0077B5]/20 border border-[#0077B5]/30 text-[10px] font-bold text-[#0077B5] uppercase tracking-widest mb-6">
                  ⭐ Professional Spotlight
                </div>
                <h3 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Grow Your Professional Brand.</h3>
                <p className="text-lg text-[#B9C0D4] mb-10 leading-relaxed max-w-xl">
                  Connect your LinkedIn profile or company page directly to your ZUPIX Link Studio. Let recruiters, clients, partners and businesses discover your professional identity in one click.
                </p>
                
                <div className="flex flex-wrap gap-3 mb-12">
                  {[
                    "Business Ready", "Professional Networking", "Recruitment Friendly",
                    "B2B Optimized", "Corporate Branding"
                  ].map((badge) => (
                    <span key={badge} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-[#B9C0D4]">
                      {badge}
                    </span>
                  ))}
                </div>

                <CtaButton to="/auth" className="bg-[#0077B5] hover:bg-[#006396] border-none shadow-xl shadow-[#0077B5]/20">
                  Connect LinkedIn
                </CtaButton>
              </div>

              {/* LinkedIn Card Preview */}
              <div className="w-full max-w-[400px] aspect-[4/5] relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="absolute inset-0 bg-[#0077B5]/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
                <div className="relative h-full w-full rounded-[32px] bg-[#12152A] border border-white/10 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:rotate-2 group-hover:scale-[1.02]">
                  {/* LinkedIn Header */}
                  <div className="h-24 bg-[#0077B5]/20 relative">
                     <div className="absolute -bottom-10 left-8 h-20 w-20 rounded-xl border-4 border-[#12152A] bg-white overflow-hidden shadow-lg">
                       <img src={PORTRAITS.karan} className="h-full w-full object-cover" alt="Profile" />
                     </div>
                  </div>
                  <div className="pt-14 px-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-bold">Karan Malhotra</h4>
                      <div className="bg-[#0077B5] text-white p-0.5 rounded-sm">
                        <Linkedin className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                    <p className="text-sm text-[#B9C0D4] mb-6 font-medium">Creative Director at ZUPIX Studio • Top Voice in Design</p>
                    
                    <div className="space-y-4">
                      <div className="h-10 w-full rounded-lg bg-[#0077B5]/10 border border-[#0077B5]/20 flex items-center justify-center text-xs font-bold text-[#0077B5]">
                        View LinkedIn Profile
                      </div>
                      <div className="h-32 w-full rounded-xl bg-white/5 border border-white/5 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <TrendingUp className="w-4 h-4 text-[#0077B5]" />
                          <div className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Recent Activity</div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-3/4 rounded-full bg-white/10" />
                          <div className="h-2 w-1/2 rounded-full bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}

      {/* FAQ Accordion */}
      <section id="faq" className="py-24 sm:py-32">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/5 bg-[#12152A] px-6 rounded-2xl">
                <AccordionTrigger className="text-left font-bold hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-[#B9C0D4] leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 md:py-32 lg:py-48 relative overflow-hidden">
        {/* Premium Gradient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] aspect-square bg-gradient-to-r from-[#FF2DAA]/10 via-[#FF7A45]/10 to-[#F72FB3]/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 duration-1000 w-full">
            <h2 className="text-[34px] sm:text-[42px] md:text-6xl lg:text-7xl font-bold mb-7 leading-[1.1] sm:leading-[1.15] max-w-[90%] md:max-w-4xl mx-auto tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              Everything you need to grow online. Nothing you don't.
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-[14px] sm:gap-3 md:gap-4 mt-7 w-full max-w-[400px] min-[480px]:max-w-[500px] sm:max-w-none mx-auto">
              <CtaButton 
                to="/auth" 
                showIcon={true}
                className="w-full sm:flex-1 h-[56px] px-6 text-base font-semibold"
              >
                Start 3-Day Free Trial
              </CtaButton>
              <CtaButton 
                to="/auth" 
                variant="secondary" 
                showIcon={true}
                icon={<Sparkles className="w-4 h-4 text-[#FF2DAA]" />}
                className="w-full sm:flex-1 h-[56px] px-6 text-base font-semibold"
              >
                Watch Live Demo
              </CtaButton>
            </div>
            
            <p className="mt-10 text-[#B9C0D4] text-base font-medium opacity-60">
              No credit card required • Cancel anytime • Instant setup
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className="text-2xl font-black tracking-tighter text-white">ZUPIX STUDIO</span>
              <p className="mt-2 text-[#B9C0D4] text-sm">© 2026 ZUPIX Link Studio. All rights reserved.</p>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-[#B9C0D4] hover:text-[#FF6A3D] transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-[#B9C0D4] hover:text-[#FF6A3D] transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-[#B9C0D4] hover:text-[#FF6A3D] transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="text-[#B9C0D4] hover:text-[#FF6A3D] transition-colors"><Youtube className="h-5 w-5" /></a>
            </div>

            <div className="flex items-center gap-8 text-sm text-[#B9C0D4]">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
