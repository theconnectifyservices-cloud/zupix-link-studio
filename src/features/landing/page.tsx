import { LandingHero } from "./hero";
import { LazySection } from "./lazy-section";
import { LandingNavbar } from "./components/navbar";
import { ScrollProgress } from "./components/scroll-progress";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export function LandingPage() {
  useScrollReveal();

  return (
    <main className="relative min-h-screen bg-[#0a0a12] text-white selection:bg-primary selection:text-white">
      {/* Root Background Layer - Fixed and GPU accelerated */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#0a0a12] transform-gpu">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12]" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-50 contrast-150" />
      </div>

      <ScrollProgress />
      <LandingNavbar />
      
      <LandingHero />
      
      <LazySection 
        id="showcase" 
        loader={() => import("./showcase")} 
        minHeight={800} 
      />
      
      <LazySection 
        id="experience" 
        loader={() => import("./experience").then(m => ({ default: m.LandingExperience }))} 
        minHeight={800} 
      />
      
      <LazySection 
        id="conversion" 
        loader={() => import("./conversion").then(m => ({ default: m.LandingConversion }))} 
        minHeight={800} 
      />
      
      <LazySection 
        id="ecosystem" 
        loader={() => import("./ecosystem").then(m => ({ default: m.LandingEcosystem }))} 
        minHeight={800} 
      />
    </main>
  );
}
