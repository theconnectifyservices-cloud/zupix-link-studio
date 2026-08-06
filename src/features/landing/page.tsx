import { LandingHero } from "./hero";
import { LandingShowcase } from "./showcase";
import { LandingExperience } from "./experience";
import { LandingConversion } from "./conversion";
import { LandingEcosystem } from "./ecosystem";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <LandingShowcase />
      <LandingExperience />
      <LandingConversion />
      <LandingEcosystem />
    </main>
  );
}
