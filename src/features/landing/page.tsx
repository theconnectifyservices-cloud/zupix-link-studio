import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap, Globe2, ShieldCheck, Palette, BarChart3, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "./components/navbar";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#090B18] text-white">
      <div className="fixed inset-0 z-[-1] bg-[#090B18]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1f3b] via-[#090B18] to-[#090B18]" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7A1A]/20 bg-[#FF7A1A]/10 px-4 py-1.5 text-xs font-medium text-[#FF7A1A]">
            <Sparkles className="h-3.5 w-3.5" />
            Bio Links that actually convert
          </div>
          <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Beautiful Bio Links<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A1A] to-[#F72FB3]">That Convert</span>
          </h1>
          <p className="mt-6 text-lg text-[#B9C0D4] max-w-2xl mx-auto">
            Create professional mini-websites in minutes. No design skills, no coding, and fully optimized for Indian businesses.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full h-14 px-8 bg-gradient-to-r from-[#FF7A1A] to-[#F72FB3] text-lg font-bold">
              Start Building <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-white/10">
              View Templates
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: "Verified Profiles" },
            { icon: Zap, title: "UPI Ready" },
            { icon: Globe2, title: "Custom Domains" },
            { icon: Palette, title: "Premium Themes" },
            { icon: BarChart3, title: "Live Analytics" },
            { icon: LayoutTemplate, title: "Mini Websites" },
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-[22px] border border-white/5 bg-[#12152A] hover:border-[#FF7A1A]/30 transition-colors">
              <item.icon className="h-8 w-8 text-[#FF6A3D] mb-6" />
              <h3 className="text-xl font-semibold">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 text-center">
        <h2 className="text-4xl font-bold">Start Building Today</h2>
        <Button size="lg" className="mt-8 rounded-full h-14 px-8 bg-gradient-to-r from-[#FF7A1A] to-[#F72FB3] text-lg font-bold">
          Start Building <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </main>
  );
}
