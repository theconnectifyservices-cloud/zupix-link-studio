import { LandingHero } from "./hero";
import { LandingNavbar } from "./components/navbar";
import { ScrollProgress } from "./components/scroll-progress";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { LandingShowcase } from "./showcase";
import { LandingExperience } from "./experience";
import { LandingConversion } from "./conversion";
import { LandingEcosystem } from "./ecosystem";

export function LandingPage() {
  useScrollReveal();

  return (
    <main className="relative min-h-screen bg-[#090B18] text-white selection:bg-primary selection:text-white flex flex-col overflow-x-hidden">
      {/* Root Background Layer - Fixed and GPU accelerated */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#090B18] transform-gpu overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#090B18] via-[#0f0f1a] to-[#090B18]" />
      </div>

      <ScrollProgress />
      <LandingNavbar />
      
      <LandingHero />
      
      <LandingShowcase />
      <LandingExperience />
      <LandingConversion />
      <LandingEcosystem />
    </main>
  );
}
