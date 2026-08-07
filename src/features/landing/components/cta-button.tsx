import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CtaButtonProps {
  to?: string;
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function CtaButton({ 
  to, 
  href, 
  children, 
  variant = "primary", 
  className,
  showIcon = true,
  icon,
  onClick
}: CtaButtonProps) {
  const isPrimary = variant === "primary";
  
  const baseStyles = cn(
    "group relative inline-flex items-center justify-center h-14 min-h-[56px] px-6 rounded-[18px] sm:rounded-full text-white font-semibold transition-all duration-[250ms] hover:-translate-y-[2px] hover:scale-[1.02] active:scale-[0.98] cursor-pointer outline-none select-none overflow-hidden text-base whitespace-nowrap w-full min-[480px]:w-auto min-w-[200px]",
    isPrimary 
      ? "bg-gradient-to-r from-[#FF2DAA] via-[#FF4D8D] to-[#FF7A45] shadow-[0_10px_30px_rgba(255,45,170,0.22)] hover:shadow-[0_15px_35px_rgba(255,45,170,0.3)]"
      : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FF2DAA]/50 backdrop-blur-md",
    className
  );

  const innerHighlight = isPrimary && (
    <span className="absolute inset-x-0 top-0 h-[1px] bg-white/20 pointer-events-none" />
  );

  const outerGlow = isPrimary && (
    <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md bg-[#FF2DAA]/20 -z-10" />
  );

  const gradientShift = isPrimary && (
    <span className="absolute inset-0 bg-gradient-to-r from-[#FF3BB5] via-[#FF5B9D] to-[#FF8A4F] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  );

  const content = (
    <>
      {innerHighlight}
      {gradientShift}
      {outerGlow}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {children}
        {showIcon && variant === "primary" && (
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseStyles} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={baseStyles} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={baseStyles} onClick={onClick}>
      {content}
    </button>
  );
}
