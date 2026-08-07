import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaButton } from "./cta-button";
import logoAsset from "@/assets/zupix-studio-logo.png.asset.json";

const NAV_LINKS = [
  { label: "Showcase", href: "#showcase" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Templates", href: "#templates" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 transform-gpu",
          isScrolled ? "py-3" : "py-6"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            className={cn(
              "relative flex items-center justify-between rounded-full px-5 py-2 transition-all duration-500",
              "h-16 sm:h-20",
              isScrolled 
                ? "bg-[#090B18]/80 backdrop-blur-xl border border-white/10 shadow-2xl mx-2" 
                : "bg-transparent border border-white/5"
            )}
          >
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center">
              <img 
                src={logoAsset.url} 
                alt="ZUPIX Studio" 
                className="h-12 sm:h-14 w-auto object-contain brightness-110" 
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[#B9C0D4] transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden items-center gap-4 lg:flex">
              <Link to="/auth" className="text-sm font-medium text-[#B9C0D4] hover:text-white">
                Sign In
              </Link>
              <CtaButton 
                to="/auth"
                className="h-12 px-6"
              >
                Start Building
              </CtaButton>
            </div>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" /> }
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-[110] bg-[#090B18] transition-all duration-500 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-8 pt-24">
          <button 
            className="absolute top-8 right-8 text-white"
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
                className="text-3xl font-bold text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="mt-auto flex flex-col gap-4">
            <Link 
              to="/auth" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-16 items-center justify-center rounded-2xl border border-white/10 text-xl font-semibold text-white"
            >
              Sign In
            </Link>
            <CtaButton 
              to="/auth"
              className="h-16 rounded-2xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Start Building
            </CtaButton>
          </div>
        </div>
      </div>
    </>
  );
}
