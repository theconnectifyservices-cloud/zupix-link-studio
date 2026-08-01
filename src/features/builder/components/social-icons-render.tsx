import { useMemo } from "react";
import {
  AtSign,
  Facebook,
  Github,
  Globe,
  Image as ImageIcon,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  MessageCircle,
  Music2,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialBlock, SocialLink, SocialPlatform } from "../types";
import { useRendererMode } from "../renderer-mode";

export const SOCIAL_ICON: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  threads: AtSign,
  linkedin: Linkedin,
  pinterest: ImageIcon,
  telegram: Send,
  whatsapp: MessageCircle,
  github: Github,
  twitter: Twitter,
  website: Globe,
  custom: LinkIcon,
};

/** Official brand colours (single hue) + gradients for platforms that have one. */
export const BRAND_COLOR: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  youtube: "#FF0000",
  tiktok: "#010101",
  threads: "#000000",
  linkedin: "#0A66C2",
  pinterest: "#E60023",
  telegram: "#26A5E4",
  whatsapp: "#25D366",
  github: "#181717",
  twitter: "#1DA1F2",
  website: "#6366F1",
  custom: "#6366F1",
};

const BRAND_GRADIENT: Partial<Record<SocialPlatform, string>> = {
  instagram: "linear-gradient(135deg,#F58529,#DD2A7B 50%,#8134AF 80%,#515BD4)",
  facebook: "linear-gradient(135deg,#1877F2,#0A5DC2)",
  youtube: "linear-gradient(135deg,#FF4E45,#CC0000)",
  tiktok: "linear-gradient(135deg,#25F4EE,#010101 55%,#FE2C55)",
  linkedin: "linear-gradient(135deg,#2D8FE0,#0A66C2)",
  whatsapp: "linear-gradient(135deg,#4AE07A,#128C7E)",
  telegram: "linear-gradient(135deg,#37BBFE,#007DBB)",
  pinterest: "linear-gradient(135deg,#FF4B62,#B7001B)",
  github: "linear-gradient(135deg,#4A4A4A,#181717)",
  threads: "linear-gradient(135deg,#3D3D3D,#000000)",
  twitter: "linear-gradient(135deg,#4FC3F7,#1DA1F2)",
  website: "linear-gradient(135deg,#818CF8,#4F46E5)",
  custom: "linear-gradient(135deg,#818CF8,#4F46E5)",
};

const KEYFRAMES = `
@keyframes zx-si-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes zx-si-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes zx-si-bounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}55%{transform:translateY(0)}70%{transform:translateY(-3px)}85%{transform:translateY(0)}}
@keyframes zx-si-scale{0%,100%{transform:scale(1)}50%{transform:scale(0.9)}}
@keyframes zx-si-rotate{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.zx-si-item{transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s ease,background .25s ease,color .25s ease,border-color .25s ease,filter .25s ease;will-change:transform}
.zx-si-anim-float .zx-si-item{animation:zx-si-float 3.4s ease-in-out infinite}
.zx-si-anim-pulse .zx-si-item{animation:zx-si-pulse 2.4s ease-in-out infinite}
.zx-si-anim-bounce .zx-si-item{animation:zx-si-bounce 2.8s ease-in-out infinite}
.zx-si-anim-scale .zx-si-item{animation:zx-si-scale 2.6s ease-in-out infinite}
.zx-si-anim-rotate .zx-si-item{animation:zx-si-rotate 9s linear infinite}
.zx-si-item:nth-child(2){animation-delay:.15s}
.zx-si-item:nth-child(3){animation-delay:.3s}
.zx-si-item:nth-child(4){animation-delay:.45s}
.zx-si-item:nth-child(5){animation-delay:.6s}
.zx-si-item:nth-child(6){animation-delay:.75s}
.zx-si-live .zx-si-hover-lift:hover{transform:translateY(-6px)}
.zx-si-live .zx-si-hover-scale:hover{transform:scale(1.14)}
.zx-si-live .zx-si-hover-rotate:hover{transform:rotate(-12deg) scale(1.06)}
.zx-si-live .zx-si-hover-glow:hover{box-shadow:0 0 0 1px var(--zx-si-accent),0 8px 26px -4px var(--zx-si-accent);filter:brightness(1.06)}
.zx-si-live .zx-si-hover-fill:hover{background:var(--zx-si-accent-bg)!important;color:#fff!important;border-color:transparent!important}
.zx-si-label-hover .zx-si-label{opacity:0;max-height:0;transform:translateY(-2px);transition:opacity .2s ease,transform .2s ease,max-height .2s ease}
.zx-si-live .zx-si-cell:hover .zx-si-label{opacity:1;max-height:2rem;transform:translateY(0)}
@media (prefers-reduced-motion: reduce){
.zx-si-item{animation:none!important;transition:none!important}
}
`;

function accentFor(block: SocialBlock, link: SocialLink): string {
  if ((block.colorMode ?? "brand") === "custom") {
    return link.color || block.customColor || "#6366F1";
  }
  return link.color || BRAND_COLOR[link.platform] || BRAND_COLOR.custom;
}

function accentBackground(block: SocialBlock, link: SocialLink, accent: string): string {
  if ((block.colorMode ?? "brand") === "custom") return accent;
  return BRAND_GRADIENT[link.platform] ?? accent;
}

function shapeRadius(block: SocialBlock, box: number): string {
  const shape = block.shape ?? "circle";
  if (shape === "circle") return "9999px";
  if (shape === "square") return "2px";
  return `${Math.min(block.radius ?? 14, box / 2)}px`;
}

/** Builds the per-item surface style for the selected premium preset. */
function itemStyle(block: SocialBlock, link: SocialLink, box: number): React.CSSProperties {
  const style = block.iconStyle ?? "minimal";
  const accent = accentFor(block, link);
  const accentBg = accentBackground(block, link, accent);
  const shadow = block.shadow !== false;
  const glow = block.glow === true;

  const base: React.CSSProperties = {
    width: `${box}px`,
    height: `${box}px`,
    borderRadius: shapeRadius(block, box),
    color: block.iconColor || accent,
  };

  const shadows: string[] = [];
  if (glow) shadows.push(`0 0 18px -2px ${accent}`);

  switch (style) {
    case "filled":
      base.background = accentBg;
      base.color = block.iconColor || "#ffffff";
      if (shadow) shadows.push(`0 8px 20px -8px ${accent}`);
      break;
    case "gradient":
      base.background = BRAND_GRADIENT[link.platform] ?? `linear-gradient(135deg, ${accent}, ${accent}99)`;
      if ((block.colorMode ?? "brand") === "custom") {
        base.background = `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 55%, #000))`;
      }
      base.color = block.iconColor || "#ffffff";
      if (shadow) shadows.push(`0 10px 24px -10px ${accent}`);
      break;
    case "glass":
      base.background = `color-mix(in oklab, ${accent} 16%, transparent)`;
      base.border = `1px solid color-mix(in oklab, ${accent} 32%, transparent)`;
      base.backdropFilter = "blur(10px) saturate(140%)";
      base.WebkitBackdropFilter = "blur(10px) saturate(140%)";
      if (shadow) shadows.push("inset 0 1px 0 rgba(255,255,255,.35), 0 8px 22px -14px rgba(0,0,0,.55)");
      break;
    case "outline":
      base.background = "transparent";
      base.border = `1.5px solid ${accent}`;
      if (shadow) shadows.push(`0 4px 14px -10px ${accent}`);
      break;
    case "neon":
      base.background = "rgba(8,8,14,.82)";
      base.border = `1.5px solid ${accent}`;
      base.color = block.iconColor || accent;
      shadows.push(`0 0 10px -1px ${accent}`, `inset 0 0 12px -6px ${accent}`);
      break;
    case "luxury":
      base.background = "linear-gradient(145deg,#1b1b1f,#0b0b0d)";
      base.border = "1px solid color-mix(in oklab, #d9b56b 55%, transparent)";
      base.color = block.iconColor || "#E8C77E";
      if (shadow) shadows.push("0 10px 28px -14px rgba(0,0,0,.9), inset 0 1px 0 rgba(232,199,126,.28)");
      break;
    case "corporate":
      base.background = "color-mix(in oklab, currentColor 6%, transparent)";
      base.background = "rgba(255,255,255,.92)";
      base.border = "1px solid rgba(15,23,42,.12)";
      base.color = block.iconColor || accent;
      if (shadow) shadows.push("0 1px 2px rgba(15,23,42,.10), 0 6px 16px -12px rgba(15,23,42,.45)");
      break;
    case "minimal":
    default:
      base.background = `color-mix(in oklab, ${accent} 10%, transparent)`;
      if (shadow) shadows.push(`0 4px 12px -10px ${accent}`);
      break;
  }

  if (shadows.length > 0) base.boxShadow = shadows.join(", ");
  return base;
}

export function SocialIconsRender({ block }: { block: SocialBlock }) {
  const mode = useRendererMode();
  const links = useMemo(() => (block.links ?? []).filter((l) => l.url || mode === "builder"), [
    block.links,
    mode,
  ]);

  if (links.length === 0) {
    return <div className="text-center text-xs text-muted-foreground">No social links yet</div>;
  }

  const iconSize = Math.max(12, Math.min(48, block.iconSize ?? 18));
  const box = Math.round(iconSize * 2.1);
  const gap = Math.max(0, Math.min(48, block.spacing ?? 12));
  const labels = block.labels ?? "hidden";
  const hover = block.hoverEffect ?? "lift";
  const animation = block.animation ?? "none";
  const align = block.align ?? "center";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div
        className={cn(
          "flex flex-wrap items-start",
          align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center",
          animation !== "none" && `zx-si-anim-${animation}`,
          labels === "hover" && "zx-si-label-hover",
          mode === "public" && "zx-si-live",
        )}
        style={{ gap: `${gap}px` }}
      >
        {links.map((link) => {
          const Icon = SOCIAL_ICON[link.platform] ?? Globe;
          const accent = accentFor(block, link);
          const label = link.label || link.platform;
          const content = (
            <>
              <span
                className={cn(
                  "zx-si-item grid place-items-center",
                  hover !== "none" && `zx-si-hover-${hover}`,
                )}
                style={itemStyle(block, link, box)}
              >
                <Icon style={{ width: iconSize, height: iconSize }} strokeWidth={1.9} />
              </span>
              {labels !== "hidden" && (
                <span
                  className="zx-si-label overflow-hidden text-[11px] font-medium capitalize leading-4 opacity-80"
                  style={{ maxWidth: `${box + 28}px` }}
                >
                  {label}
                </span>
              )}
            </>
          );

          const cellClass = "zx-si-cell flex flex-col items-center gap-1.5 no-underline";
          const cellStyle = {
            ["--zx-si-accent" as string]: accent,
            ["--zx-si-accent-bg" as string]: accentBackground(block, link, accent),
          } as React.CSSProperties;

          return mode === "public" && link.url ? (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={label}
              className={cellClass}
              style={cellStyle}
            >
              {content}
            </a>
          ) : (
            <span key={link.id} aria-label={label} className={cellClass} style={cellStyle}>
              {content}
            </span>
          );
        })}
      </div>
    </>
  );
}
