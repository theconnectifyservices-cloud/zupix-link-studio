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

const PRICING = [
  {
    name: "UDAAN",
    price: "Free",
    desc: "Perfect for students & hobbyists",
    features: ["1 Bio Link", "Standard Templates", "Basic Analytics", "ZUPIX Branding"],
    cta: "Start for Free",
    popular: false
  },
  {
    name: "TEJAS",
    price: "₹149",
    period: "/mo",
    desc: "For serious creators & small biz",
    features: ["3 Bio Links", "Premium Templates", "Custom Colors", "Priority Support"],
    cta: "Start 7-Day Trial",
    popular: true
  },
  {
    name: "SHIKHAR",
    price: "₹499",
    period: "/mo",
    desc: "Enterprise-grade performance",
    features: ["Unlimited Bio Links", "Custom Domains", "AI Content Studio", "0% Transaction Fee"],
    cta: "Contact Sales",
    popular: false
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

  return <div ref={elementRef}>{count}{suffix}</div>;
}

export function LandingPage() {
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
              
              <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both w-full max-w-[400px] min-[480px]:max-w-none mx-auto lg:mx-0">
                <CtaButton to="/auth" className="flex-1 min-[480px]:flex-none">
                  Start Building Free
                </CtaButton>
                <CtaButton to="/auth" variant="secondary" showIcon={false} icon={<Sparkles className="w-4 h-4 text-[#FF2DAA]" />} className="flex-1 min-[480px]:flex-none">
                  Start 3-Day Free Trial
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

      {/* Secondary Trust Logos */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] hidden sm:block">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-between gap-8 opacity-40 grayscale hover:opacity-100 transition-opacity duration-500">
             <span className="text-xl font-black tracking-widest italic">MADE IN INDIA</span>
             <span className="text-xl font-black tracking-widest italic">UPI SECURE</span>
             <span className="text-xl font-black tracking-widest italic">DOMAIN MAPPING</span>
             <span className="text-xl font-black tracking-widest italic">ENTERPRISE ANALYTICS</span>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-auto w-full">
                    {[
                      { label: "Visitors", value: "12k+" },
                      { label: "CTR", value: "8.4+" },
                      { label: "Sales", value: "₹45k" },
                      { label: "Growth", value: "+24%" }
                    ].map((stat) => (
                      <div 
                        key={stat.label} 
                        className="group/kpi p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center backdrop-blur-md hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all duration-300 active:scale-[0.98] flex flex-col items-center justify-center min-h-[100px] w-full"
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
              { label: "Bio Pages", value: "Unlimited" },
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CtaButton to="/auth" className="h-16 px-10 text-lg w-full sm:w-auto">
                Start 3-Day Free Trial
              </CtaButton>
              <CtaButton to="/auth" variant="secondary" showIcon={false} className="h-16 px-10 text-lg w-full sm:w-auto">
                See Live Demo
              </CtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">Simple, Honest Pricing.</h2>
            <p className="text-lg text-[#B9C0D4]">No hidden fees. No transaction commissions. Just a simple monthly subscription to power your growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING.map((p, i) => (
              <div key={i} className={cn(
                "relative p-10 rounded-[22px] border flex flex-col",
                p.popular ? "bg-[#12152A] border-[#FF6A3D]/30 shadow-2xl scale-105" : "bg-transparent border-white/5"
              )}>
                {p.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6A3D] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                    Most Popular
                  </span>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-[#B9C0D4]">{p.period}</span>
                  </div>
                  <p className="mt-4 text-[#B9C0D4] text-sm">{p.desc}</p>
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-[#B9C0D4]">
                      <CheckCircle2 className="h-4 w-4 text-[#FF6A3D]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <CtaButton 
                  to="/auth"
                  variant={p.popular ? "primary" : "secondary"}
                  className="w-full h-12"
                  showIcon={false}
                >
                  {p.cta}
                </CtaButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 sm:py-32 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl sm:text-5xl font-bold mb-16 text-center">Loved by Founders.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-8 rounded-[22px] bg-[#12152A] border border-white/5">
                <p className="text-lg text-[#B9C0D4] mb-8 leading-relaxed italic">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-sm text-[#B9C0D4]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
      <section className="py-24 sm:py-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FF6A3D]/5 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-8">Ready to transform your<br />digital presence?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <CtaButton to="/auth" className="h-16 px-10 text-xl w-full sm:w-auto">
              Start Building Now
            </CtaButton>
            <CtaButton to="/auth" variant="secondary" showIcon={false} icon={<Sparkles className="w-5 h-5 text-[#FF2DAA]" />} className="h-16 px-10 text-xl w-full sm:w-auto">
              Start 3-Day Free Trial
            </CtaButton>
          </div>
          <p className="mt-8 text-[#B9C0D4]">No credit card required. Cancel anytime.</p>
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
