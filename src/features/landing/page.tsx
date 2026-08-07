import { LandingHero } from "./hero";
import { LazySection } from "./lazy-section";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
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
