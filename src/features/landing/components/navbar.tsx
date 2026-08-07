import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Showcase", href: "#showcase" },
  { label: "Features", href: "#experience" },
  { label: "Pricing", href: "#conversion" },
  { label: "Ecosystem", href: "#ecosystem" },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Glass effect toggle
      setIsScrolled(currentScrollY > 20);

      // Scroll direction reveal logic
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY && !isMobileMenuOpen) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 transform",
          isScrolled ? "py-3" : "py-6",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            className={cn(
              "relative flex items-center justify-between rounded-full px-4 py-2 transition-all duration-500 sm:px-6",
              isScrolled 
                ? "bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" 
                : "bg-transparent border border-transparent"
            )}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-accent transition-transform group-hover:scale-110">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">ZUPIX</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden items-center gap-4 lg:flex">
              <Link to="/auth" className="text-sm font-medium text-white/60 transition-colors hover:text-white">
                Sign In
              </Link>
              <Button size="sm" className="rounded-full bg-white text-black hover:bg-white/90 group">
                Start Building
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Mobile Toggle */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" /> }
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl transition-all duration-500 lg:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex h-full flex-col p-6 pt-24">
          <div className="flex flex-col gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-3xl font-bold text-white transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="mt-auto flex flex-col gap-4 pb-12">
            <Link 
              to="/auth" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-14 items-center justify-center rounded-2xl border border-white/10 text-lg font-semibold text-white"
            >
              Sign In
            </Link>
            <Button 
              size="lg" 
              className="h-14 rounded-2xl bg-primary text-white text-lg font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Start Building
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
