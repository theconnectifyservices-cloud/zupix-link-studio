import { Hero } from "./hero";
import { Showcase } from "./showcase";
import { Experience } from "./experience";
import { Conversion } from "./conversion";
import { LandingEcosystem } from "./ecosystem";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Showcase />
      <Experience />
      <Conversion />
      <LandingEcosystem />
    </main>
  );
}
