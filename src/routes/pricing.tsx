import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, ChevronDown, Lock, Sparkles, Zap, Crown, Shield,
  IndianRupee, Rocket, Star, HeartHandshake, CircleCheck, HelpCircle,
} from "lucide-react";
import { PublicLayout } from "@/shared/layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PLANS, PLAN_ORDER, formatPlanPrice, yearlySavingsPct, type PlanCode,
} from "@/features/subscription/plans";
import { SubscriptionCheckoutLauncher } from "@/features/billing/components/subscription-checkout-launcher";
import { useSession } from "@/features/auth/hooks/use-session";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { CycleToggle, PricingCards, useBillingCycle } from "@/features/pricing";

const TITLE = "Pricing — ZUPIX Link Studio | Plans from Free to Enterprise";
const DESC = "Choose the right plan for your business. Start free with Udaan, upgrade to Tejas (₹299/mo) or Shikhar (₹499/mo) for pro tools. 3-day free trial, no hidden charges.";
const URL = "https://zupixlink.lovable.app/pricing";

function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof w.gtag === "function") w.gtag("event", event, props);
  if (typeof w.plausible === "function") w.plausible(event, { props });
}

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "keywords", content: "bio link pricing, linktree alternative india, bio page pricing, upi bio link, business bio link plans, zupix pricing" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "ZUPIX Link Studio",
        description: DESC,
        brand: { "@type": "Brand", name: "ZUPIX" },
        offers: [
          { "@type": "Offer", name: "Udaan", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Tejas Monthly", price: "299", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Tejas Yearly", price: "2599", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Shikhar Monthly", price: "499", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Shikhar Yearly", price: "4599", priceCurrency: "INR", availability: "https://schema.org/InStock" },
        ],
      }),
    }],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [cycle, setCycle] = useBillingCycle();
  const [checkout, setCheckout] = useState<{ planCode: PlanCode } | null>(null);
  const session = useSession();
  const { workspace } = useCurrentWorkspace();
  const navigate = useNavigate();
  const authed = session.status === "authenticated";

  function handleCta(code: PlanCode) {
    track("plan_click", { plan: code, cycle });
    if (code === "shikhar") return;
    if (code === "udaan") {
      track("trial_start", { source: "pricing_udaan" });
      if (authed) navigate({ to: "/app" });
      else navigate({ to: "/signup", search: { plan: code } });
      return;
    }
    // tejas
    track("checkout_started", { plan: code, cycle });
    if (!authed) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("zupix:auth_intent", "trial");
      }
      navigate({ to: "/signup", search: { plan: code } });
      return;
    }
    setCheckout({ planCode: code });
  }

  return (
    <PublicLayout>
      <main className="relative overflow-hidden">
        <AmbientGlow />
        <Hero cycle={cycle} setCycle={setCycle} onStart={() => handleCta("udaan")} />
        <section id="plans" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <PricingCards cycle={cycle} onCta={handleCta} />
        </section>
        <ComparisonTable />
        <FeatureShowcase />
        <RoiCalculator />
        <BusinessExamples />
        <Testimonials />
        <FaqSection />
        <Guarantee />
        <FinalCta onFree={() => handleCta("udaan")} onTrial={() => handleCta("tejas")} />
      </main>

      {checkout && workspace ? (
        <SubscriptionCheckoutLauncher
          open={!!checkout}
          onOpenChange={(v) => { if (!v) setCheckout(null); }}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          planCode={checkout.planCode}
          cycle={cycle}
        />
      ) : null}
    </PublicLayout>
  );
}

function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
      <div className="absolute left-1/2 top-[-120px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute left-[10%] top-[220px] h-[380px] w-[380px] rounded-full bg-purple-500/15 blur-3xl" />
      <div className="absolute right-[8%] top-[300px] h-[420px] w-[420px] rounded-full bg-amber-500/15 blur-3xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({
  cycle, setCycle, onStart,
}: {
  cycle: "monthly" | "yearly";
  setCycle: (c: "monthly" | "yearly") => void;
  onStart: () => void;
}) {
  const tejasSavings = PLANS.tejas.priceMonthlyMinor * 12 - PLANS.tejas.priceYearlyMinor;
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24 sm:pb-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
      >
        <Sparkles className="h-3 w-3" /> Simple, transparent pricing
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05 }}
        className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl"
      >
        Choose the Right Plan for Your{" "}
        <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Business
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
      >
        Start free with Udaan. Upgrade anytime to unlock premium business tools —
        custom domains, commerce, analytics and the full Studio.
      </motion.p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" className="gap-2" onClick={onStart}>
            Start Free <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#compare">Compare Plans</a>
          </Button>
        </div>

        <CycleToggle
          cycle={cycle}
          onChange={(c) => { setCycle(c); track("toggle_usage", { cycle: c }); }}
          savingsHint={`Save \u20b9${(tejasSavings / 100).toFixed(0)} on Tejas / \u20b91,389 on Shikhar`}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison table                                                    */
/* ------------------------------------------------------------------ */

type Cell = "yes" | "no" | "soon" | string;
interface Row { label: string; udaan: Cell; tejas: Cell; shikhar: Cell }
interface Group { name: string; rows: Row[] }

const COMPARISON: Group[] = [
  {
    name: "Builder",
    rows: [
      { label: "Bio pages", udaan: "1", tejas: "3", shikhar: "10" },
      { label: "Content blocks", udaan: "13 essentials", tejas: "All 21 blocks", shikhar: "All + commerce" },
      { label: "Drag & drop builder", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Version history", udaan: "yes", tejas: "yes", shikhar: "yes" },
    ],
  },
  {
    name: "Design",
    rows: [
      { label: "Premium themes", udaan: "Basic", tejas: "All themes", shikhar: "All + custom" },
      { label: "Google fonts", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Motion & effects studio", udaan: "no", tejas: "yes", shikhar: "yes" },
      { label: "Custom CSS", udaan: "no", tejas: "yes", shikhar: "yes" },
    ],
  },
  {
    name: "Media",
    rows: [
      { label: "Image uploads", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Video embeds", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Digital asset manager", udaan: "no", tejas: "yes", shikhar: "yes" },
    ],
  },
  {
    name: "SEO",
    rows: [
      { label: "Meta & Open Graph", udaan: "Basic", tejas: "Full control", shikhar: "Full control" },
      { label: "JSON-LD schema", udaan: "no", tejas: "yes", shikhar: "yes" },
      { label: "Sitemap & robots", udaan: "yes", tejas: "yes", shikhar: "yes" },
    ],
  },
  {
    name: "Domains",
    rows: [
      { label: "ZUPIX subdomain", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Custom domain", udaan: "no", tejas: "1", shikhar: "Unlimited" },
      { label: "Remove ZUPIX branding", udaan: "no", tejas: "yes", shikhar: "yes" },
    ],
  },
  {
    name: "Commerce",
    rows: [
      { label: "UPI payments", udaan: "no", tejas: "no", shikhar: "soon" },
      { label: "Products & store", udaan: "no", tejas: "no", shikhar: "soon" },
      { label: "Bookings & memberships", udaan: "no", tejas: "no", shikhar: "soon" },
    ],
  },
  {
    name: "Analytics",
    rows: [
      { label: "Basic pageviews", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Visitor intelligence", udaan: "no", tejas: "yes", shikhar: "yes" },
      { label: "Conversion attribution", udaan: "no", tejas: "yes", shikhar: "yes" },
    ],
  },
  {
    name: "AI",
    rows: [
      { label: "AI copy assistant", udaan: "Trial", tejas: "yes", shikhar: "yes" },
      { label: "AI design coach", udaan: "no", tejas: "yes", shikhar: "yes" },
      { label: "Growth workflows", udaan: "no", tejas: "no", shikhar: "soon" },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Community support", udaan: "yes", tejas: "yes", shikhar: "yes" },
      { label: "Priority email", udaan: "no", tejas: "yes", shikhar: "yes" },
      { label: "Dedicated success manager", udaan: "no", tejas: "no", shikhar: "yes" },
    ],
  },
];

function ComparisonTable() {
  const [openGroup, setOpenGroup] = useState<string | null>("Builder");
  return (
    <section id="compare" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="Compare"
        title="Everything, side by side"
        subtitle="Explore what's unlocked at each level. Locked features show what's waiting when you upgrade."
      />

      <div className="mt-10 overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr] gap-4 border-b bg-muted/40 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
          <div>Feature</div>
          <div className="text-center">🌱 Udaan</div>
          <div className="text-center text-primary">🚀 Tejas</div>
          <div className="text-center">👑 Shikhar</div>
        </div>

        <div className="divide-y">
          {COMPARISON.map((group) => {
            const open = openGroup === group.name;
            return (
              <div key={group.name}>
                <button
                  onClick={() => setOpenGroup(open ? null : group.name)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold transition hover:bg-muted/40"
                >
                  <span>{group.name}</span>
                  <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="rows"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      {group.rows.map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-2 gap-3 border-t px-6 py-3 text-sm md:grid-cols-[1.6fr_1fr_1fr_1fr] md:gap-4"
                        >
                          <div className="col-span-2 font-medium md:col-span-1">{row.label}</div>
                          <CellView value={row.udaan} label="Udaan" />
                          <CellView value={row.tejas} label="Tejas" highlight />
                          <CellView value={row.shikhar} label="Shikhar" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CellView({ value, label, highlight }: { value: Cell; label: string; highlight?: boolean }) {
  const content = (() => {
    if (value === "yes") return <Check className={cn("h-4 w-4", highlight ? "text-primary" : "text-emerald-500")} />;
    if (value === "no") return <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />;
    if (value === "soon") return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Soon</span>;
    return <span className="text-xs">{value}</span>;
  })();
  return (
    <div className="flex items-center gap-2 md:justify-center">
      <span className="text-[10px] uppercase text-muted-foreground md:hidden">{label}:</span>
      {content}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature showcase (locked preview)                                   */
/* ------------------------------------------------------------------ */

function FeatureShowcase() {
  const items = [
    { icon: Crown, title: "Custom Domain", body: "Publish on yourbrand.com with automatic HTTPS and DNS wizard.", plan: "Tejas" },
    { icon: Sparkles, title: "Motion Studio", body: "GPU-accelerated animations, glassmorphism and entrance effects.", plan: "Tejas" },
    { icon: IndianRupee, title: "UPI Storefront", body: "Sell products, digital downloads and bookings with instant UPI.", plan: "Shikhar", soon: true },
    { icon: Rocket, title: "AI Growth Coach", body: "Personalised recommendations that grow clicks and conversions.", plan: "Tejas" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader eyebrow="Locked previews" title="A glimpse at what unlocks" subtitle="Premium features stay hidden — but never out of reach." />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((f) => (
          <div key={f.title} className="group relative overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur-xl">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {f.plan}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.body}</p>
              <div className="relative mt-4 h-24 overflow-hidden rounded-xl border bg-muted/40">
                <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent blur-sm" />
                <div className="absolute inset-0 grid place-items-center backdrop-blur-md">
                  <div className="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-medium">
                    <Lock className="h-3 w-3" /> {f.soon ? "Coming soon" : `Unlock with ${f.plan}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ROI calculator                                                      */
/* ------------------------------------------------------------------ */

function RoiCalculator() {
  const [visitors, setVisitors] = useState(5000);
  const [rate, setRate] = useState(4);
  const [value, setValue] = useState(500);
  const monthly = useMemo(() => Math.round((visitors * (rate / 100)) * value), [visitors, rate, value]);
  const yearly = monthly * 12;
  const cost = PLANS.tejas.priceYearlyMinor / 100;
  const roi = cost > 0 ? Math.round((yearly / cost) * 100) : 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader eyebrow="ROI calculator" title="See what ZUPIX can earn you" subtitle="Estimate the business impact of turning your bio link into a conversion engine." />
      <div className="mt-10 grid gap-6 rounded-3xl border bg-card/60 p-6 backdrop-blur-xl md:grid-cols-[1.1fr_1fr] md:p-8">
        <div className="space-y-5">
          <RoiField label="Monthly visitors" value={visitors} min={100} max={100000} step={100} suffix=" people" onChange={setVisitors} />
          <RoiField label="Conversion rate" value={rate} min={1} max={30} step={0.5} suffix=" %" onChange={setRate} />
          <RoiField label="Average lead value" value={value} min={50} max={20000} step={50} prefix="₹" onChange={setValue} />
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 p-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Estimated monthly value</div>
            <div className="mt-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              ₹{monthly.toLocaleString("en-IN")}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              That's <b className="text-foreground">₹{yearly.toLocaleString("en-IN")}</b> per year.
            </div>
          </div>
          <div className="rounded-xl border bg-background/60 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Star className="h-4 w-4 text-amber-500" /> Return on Tejas (₹{cost.toLocaleString("en-IN")}/yr)
            </div>
            <div className="mt-1 text-2xl font-bold">{roi.toLocaleString("en-IN")}× ROI</div>
            <p className="mt-1 text-xs text-muted-foreground">Numbers are indicative and depend on your niche.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoiField({
  label, value, min, max, step, prefix, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-muted-foreground">
          {prefix}{value.toLocaleString("en-IN")}{suffix}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Business examples                                                   */
/* ------------------------------------------------------------------ */

function BusinessExamples() {
  const items = [
    { emoji: "🩺", title: "Doctor", copy: "Appointments, clinic hours, prescriptions download." },
    { emoji: "🍽️", title: "Restaurant", copy: "Menu, reservations, Zomato & Swiggy links." },
    { emoji: "💇", title: "Salon", copy: "Bookings, services list, loyalty offers." },
    { emoji: "💎", title: "Jewellery", copy: "Catalogue, WhatsApp inquiries, festive drops." },
    { emoji: "✈️", title: "Travel", copy: "Packages, itineraries, one-tap enquire." },
    { emoji: "🏢", title: "Agency", copy: "Portfolio, case studies, contact & briefs." },
    { emoji: "🎓", title: "Coach", copy: "Programs, testimonials, calendar bookings." },
    { emoji: "⚖️", title: "Law Firm", copy: "Practice areas, consultations, credentials." },
    { emoji: "🏋️", title: "Gym", copy: "Trainers, memberships, class timetable." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader eyebrow="Made for every business" title="Templates & tools for your industry" subtitle="Realistic patterns modelled on Indian businesses that use ZUPIX every day." />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((b) => (
          <div key={b.title} className="rounded-2xl border bg-card/60 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg">
            <div className="text-3xl">{b.emoji}</div>
            <div className="mt-2 text-base font-semibold">{b.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{b.copy}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

function Testimonials() {
  const items = [
    { name: "Priya Sharma", role: "Founder, Kalakriti Studio", city: "Jaipur", quote: "We went from a scattered Instagram bio to a proper mini-website. Bookings doubled in the first month." },
    { name: "Dr. Rahul Verma", role: "Dental Clinic", city: "Bengaluru", quote: "Patients book appointments directly from the WhatsApp link in my ZUPIX page. It just works." },
    { name: "Aarav Patel", role: "Ecom Coach", city: "Ahmedabad", quote: "The design studio is unreal for the price. Cheaper than a designer, faster than a website." },
    { name: "Neha Iyer", role: "Boutique Owner", city: "Chennai", quote: "Custom domain + payments = my full storefront in one link. My CA loves the GST invoices." },
    { name: "Ankit Malhotra", role: "Travel Agency", city: "Delhi", quote: "Analytics finally makes sense. I know exactly which campaign brings in enquiries." },
    { name: "Sanya Kapoor", role: "Yoga Coach", city: "Pune", quote: "3-day trial was more than enough to fall in love. Upgraded before it ended." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader eyebrow="Loved by 12,000+ creators & businesses" title="Trusted across India" />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-2xl border bg-card/60 p-5 backdrop-blur-xl"
          >
            <div className="flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <p className="mt-3 text-sm leading-relaxed">"{t.quote}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-xs font-semibold text-primary-foreground">
                {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{t.name}</div>
                <div className="truncate text-xs text-muted-foreground">{t.role} · {t.city}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  { q: "Can I upgrade anytime?", a: "Yes. Upgrade to Tejas from any page in the app. Your data, pages and settings carry over instantly." },
  { q: "Can I use my own domain?", a: "Tejas includes 1 custom domain with automatic HTTPS. Shikhar unlocks unlimited domains and white-label branding." },
  { q: "Can I cancel anytime?", a: "Absolutely. Cancel with one click. Your paid features stay active until the end of the current billing period." },
  { q: "Will my data remain safe?", a: "All data is encrypted at rest, backed by enterprise-grade infrastructure with daily backups and RLS-scoped access." },
  { q: "What happens after the trial?", a: "If you don't upgrade, we simply move you to the Free Udaan plan. Your pages stay live — premium features are just paused." },
  { q: "Which payment methods do you support?", a: "UPI, cards, netbanking and wallets via Razorpay, PayU and Cashfree. Manual UPI is also available." },
  { q: "Do you offer GST invoices?", a: "Yes. Every paid transaction generates a GST-compliant invoice you can download from Billing." },
  { q: "Is there a refund policy?", a: "We offer a 7-day money-back guarantee on your first Tejas purchase. No questions asked." },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <SectionHeader eyebrow="FAQ" title="Answers before you ask" />
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const active = open === i;
          return (
            <div key={f.q} className="overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl">
              <button
                onClick={() => setOpen(active ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition", active && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pl-12 text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Guarantee / trust                                                   */
/* ------------------------------------------------------------------ */

function Guarantee() {
  const trust = [
    { icon: Shield, label: "Secure Payments" },
    { icon: HeartHandshake, label: "Made in India" },
    { icon: Sparkles, label: "3-Day Free Trial" },
    { icon: CircleCheck, label: "No Hidden Charges" },
    { icon: Lock, label: "Enterprise Security" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border bg-gradient-to-br from-emerald-500/10 via-primary/5 to-purple-500/10 p-8 backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-2xl font-bold sm:text-3xl">7-Day Money-Back Guarantee</h3>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Try Tejas risk-free. If it doesn't fit your business, we'll refund you in full — no questions asked.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {trust.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1.5 text-xs font-medium">
                <t.icon className="h-3.5 w-3.5 text-primary" /> {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta({ onFree, onTrial }: { onFree: () => void; onTrial: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-purple-500/10 to-pink-500/15 p-10 text-center backdrop-blur-xl sm:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-64 w-[560px] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Ready to Build Your Digital Identity?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Join thousands of Indian creators and businesses turning a single link into a full business.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="outline" onClick={onFree}>Start Free</Button>
          <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/30" onClick={onTrial}>
            <Zap className="h-4 w-4" /> Start 3-Day Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          No credit card required · Cancel anytime · GST invoices included
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}

// Suppress unused import warnings for icons kept for future use
void Link;
