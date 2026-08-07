import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/zupix-studio-logo.png.asset.json";

const NAV_LINKS = [
  { label: "Showcase", href: "#showcase" },
  { label: "Features", href: "#experience" },
  { label: "Pricing", href: "#conversion" },
  { label: "Ecosystem", href: "#ecosystem" },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      // Logic for scrolled state
      setIsScrolled(window.scrollY > 20);

      // Active section detection
      const sections = NAV_LINKS.map(link => link.href.substring(1));
      let currentActive = "";
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If section top is above or near the middle of viewport
          if (rect.top <= 150) {
            currentActive = `#${section}`;
          }
        }
      }
      setActiveSection(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 transform-gpu",
          isScrolled ? "py-2 sm:py-3" : "py-4 sm:py-6"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            className={cn(
              "relative flex items-center justify-between rounded-full px-5 py-2 transition-all duration-500",
              "h-[72px] sm:h-[76px]",
              isScrolled 
                ? "bg-[#090B18]/92 backdrop-blur-[22px] border border-[#FF7A1A]/18 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mx-2 sm:mx-4 scale-[0.98]" 
                : "bg-transparent border border-white/5 backdrop-blur-[2px]"
            )}
          >
            {/* Logo */}
            <Link 
              to="/" 
              className="flex shrink-0 items-center transition-all duration-300 hover:opacity-80"
              style={{ transform: isScrolled ? 'scale(0.92)' : 'scale(1)' }}
            >
              <img 
                src={logoAsset.url} 
                alt="ZUPIX Studio" 
                className="h-[32px] w-auto object-contain sm:h-[42px] min-w-[120px]" 
                loading="eager"
                onError={(e) => {
                  console.error("Logo failed to load:", e);
                  // Fallback to text if image fails
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const span = document.createElement('span');
                    span.className = 'logo-fallback text-xl font-bold tracking-tight text-white';
                    span.innerText = 'ZUPIX STUDIO';
                    parent.appendChild(span);
                  }
                }}
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map((link, idx) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium transition-all duration-300 hover:text-white group",
                    activeSection === link.href ? "text-white" : "text-white/60",
                    "animate-in fade-in slide-in-from-top-2 fill-mode-both"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {link.label}
                  <span className={cn(
                    "absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-[#FF7A1A] to-[#F72FB3] transition-transform duration-300 group-hover:scale-x-100",
                    activeSection === link.href && "scale-x-100"
                  )} />
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden items-center gap-6 lg:flex">
              <Link to="/auth" className="text-sm font-medium text-white/60 transition-colors hover:text-white">
                Sign In
              </Link>
              <Button 
                asChild
                className="h-11 rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#F72FB3] px-6 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,122,26,0.2)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_0_25px_rgba(255,122,26,0.4)] group active:scale-95"
              >
                <Link to="/auth">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Mobile Toggle */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white lg:hidden transition-transform active:scale-90"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" /> }
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[110] bg-[#090B18]/98 backdrop-blur-2xl transition-all duration-500 lg:hidden",
          isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-8 pt-24">
          <button 
            className="absolute top-8 right-8 text-white/60"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>

          <div className="flex flex-col gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-4xl font-bold text-white transition-colors hover:text-[#FF7A1A]"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="mt-auto flex flex-col gap-4 pb-12">
            <Link 
              to="/auth" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-16 items-center justify-center rounded-2xl border border-white/10 text-xl font-semibold text-white"
            >
              Sign In
            </Link>
            <Button 
              asChild
              className="h-16 rounded-2xl bg-gradient-to-r from-[#FF7A1A] to-[#F72FB3] text-white text-xl font-bold shadow-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Link to="/auth">Start Building</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

