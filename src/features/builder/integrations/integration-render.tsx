import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRendererMode } from "../renderer-mode";
import { getIntegration, type IntegrationConfig, type IntegrationDisplayMode } from "./registry";
import type { IntegrationBlock } from "../types";
import { X, Plus, ChevronRight, ChevronUp, ChevronDown, ChevronLeft } from "lucide-react";
import { ButtonFxSurface } from "../button-fx";

const ANIM: Record<string, string> = {
  none: "",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  glow: "zi-glow",
  float: "zi-float",
};

function buttonClasses(style: string) {
  switch (style) {
    case "outline":
      return "border-2 bg-transparent";
    case "soft":
      return "border border-transparent";
    case "glass":
      return "border border-white/30 backdrop-blur-md";
    default:
      return "border border-transparent text-white";
  }
}

function buttonStyle(style: string, color: string, textColor?: string): React.CSSProperties {
  const base: React.CSSProperties = textColor ? { color: textColor } : {};
  switch (style) {
    case "outline":
      return { ...base, borderColor: color, color: textColor || color };
    case "soft":
      return { ...base, backgroundColor: `${color}1f`, color: textColor || color };
    case "glass":
      return { ...base, backgroundColor: `${color}26`, color: textColor || color };
    default:
      return { ...base, backgroundColor: color, color: textColor || "white" };
  }
}

/**
 * Universal Display Mode Engine for Integrations.
 */
export function IntegrationRender({ block }: { block: IntegrationBlock }) {
  const mode = useRendererMode();
  const [popupOpen, setPopupOpen] = useState(false);
  const def = getIntegration(block.provider);

  if (!def) return null;

  const cfg: IntegrationConfig = block.config ?? {};
  const display = (block.mode ?? def.modes[0]) as IntegrationDisplayMode;
  const action = def.build(cfg);
  const color = typeof cfg.color === "string" && cfg.color ? cfg.color : def.brand;
  const textColor = typeof cfg.textColor === "string" && cfg.textColor ? cfg.textColor : undefined;
  const label = typeof cfg.buttonText === "string" && cfg.buttonText ? cfg.buttonText : def.label;
  const anim = ANIM[String(cfg.animation ?? "none")] ?? "";
  const Icon = def.icon;
  const showIcon = cfg.showIcon !== false;
  const height = Number(cfg.height) > 0 ? Number(cfg.height) : (action.height ?? 420);
  const isBuilder = mode === "builder";

  if (display === "hidden") return null;

  const visibility = cn(
    cfg.showOnMobile === false && "hidden sm:block",
    cfg.showOnDesktop === false && "sm:hidden",
  );

  const notConfigured = (
    <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
      Configure your {def.label} integration
    </div>
  );

  /* ── embed ─────────────────────────────────────────────────────────── */
  if (display === "embed") {
    if (!action.embedSrc) return notConfigured;
    return (
      <div className={visibility}>
        <iframe
          src={action.embedSrc}
          title={`${def.label} embed`}
          className="w-full overflow-hidden rounded-xl border"
          style={{ height }}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  const btn = (
    <span
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5",
        buttonClasses(String(cfg.style ?? "filled")),
        anim,
      )}
      style={buttonStyle(String(cfg.style ?? "filled"), color, textColor)}
    >
      {showIcon && <Icon className="h-4 w-4" />}
      {label}
    </span>
  );

  /* ── popup ─────────────────────────────────────────────────────────── */
  if (display === "popup") {
    if (!action.embedSrc) return notConfigured;
    return (
      <div className={visibility}>
        <button type="button" className="w-full" onClick={() => setPopupOpen(true)}>
          {btn}
        </button>
        {popupOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-background shadow-2xl">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPopupOpen(false)}
                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow"
              >
                <X className="h-4 w-4" />
              </button>
              <iframe
                src={action.embedSrc}
                title={`${def.label} popup`}
                className="w-full"
                style={{ height: Math.min(height, 680) }}
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── iconOnly ──────────────────────────────────────────────────────── */
  if (display === "iconOnly") {
    const sizeMap: Record<string, string> = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
    const iconMap: Record<string, string> = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };
    const size = sizeMap[String(cfg.size ?? "md")] ?? sizeMap.md;
    const iconSize = iconMap[String(cfg.size ?? "md")] ?? iconMap.md;
    
    return (
      <div className={cn("flex justify-center", visibility)}>
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            "grid place-items-center transition-transform hover:scale-110",
            size,
            anim
          )}
          style={{ color }}
          onClick={isBuilder ? (e) => e.preventDefault() : undefined}
        >
          <Icon className={iconSize} />
        </a>
      </div>
    );
  }

  /* ── card ────────────────────────────────────────────────────────── */
  if (display === "card") {
    return (
      <div className={cn("rounded-2xl border bg-card p-4 shadow-sm", visibility)}>
        <div className="flex items-start gap-4">
          <div 
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold">{label}</h4>
            {cfg.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{String(cfg.description)}</p>
            )}
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color }}
              onClick={isBuilder ? (e) => e.preventDefault() : undefined}
            >
              Get Started <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── headerAction ─────────────────────────────────────────────────── */
  if (display === "headerAction") {
    return (
      <div className={cn("inline-block", visibility)}>
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
            anim
          )}
          style={{ color }}
          onClick={isBuilder ? (e) => e.preventDefault() : undefined}
        >
          {showIcon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </a>
      </div>
    );
  }

  /* ── floating / floatingBubble / stickyBottom handled by IntegrationStack ── */
  // We return a placeholder in builder for these modes so the user can select the block.
  if (display === "floating" || display === "floatingBubble" || display === "stickyBottom") {
    if (isBuilder) {
      return (
        <div className={cn("rounded-xl border border-dashed bg-muted/20 p-3", visibility)}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {MODE_LABEL[display]}
            </span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
             <div 
              className="grid h-10 w-10 place-items-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{label}</div>
              <div className="text-[10px] text-muted-foreground">
                {display === "stickyBottom" ? "Sticky at bottom" : `Fixed position: ${cfg.position ?? "bottom-right"}`}
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Production render will be handled by the Global Integration Stack
    return null;
  }

  /* ── default: button / new tab ─────────────────────────────────────── */
  return (
    <div className={visibility}>
      <a
        href={action.href}
        target={display === "newTab" ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="block w-full"
        onClick={isBuilder ? (e) => e.preventDefault() : undefined}
      >
        {btn}
      </a>
    </div>
  );
}

const MODE_LABEL: Record<string, string> = {
  floating: "Floating Button",
  floatingBubble: "Floating Bubble",
  stickyBottom: "Sticky Bottom Bar",
};

/**
 * Renders the global stack of floating and sticky integrations.
 * This should be mounted at the bottom of the page/preview.
 */
export function IntegrationStack({ blocks }: { blocks: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const mode = useRendererMode();
  
  const floatingItems = useMemo(() => {
    return (blocks ?? []).filter(b => 
      b.type === "integration" && 
      !b.hidden && 
      (b.mode === "floating" || b.mode === "floatingBubble")
    ) as IntegrationBlock[];
  }, [blocks]);

  const stickyItems = useMemo(() => {
    return (blocks ?? []).filter(b => 
      b.type === "integration" && 
      !b.hidden && 
      b.mode === "stickyBottom"
    ) as IntegrationBlock[];
  }, [blocks]);

  if (floatingItems.length === 0 && stickyItems.length === 0) return null;

  // Group by position
  const groups: Record<string, IntegrationBlock[]> = {};
  floatingItems.forEach(item => {
    const pos = String(item.config?.position ?? "bottom-right");
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(item);
  });

  return (
    <>
       {/* ── Sticky Bottom Bar ── */}
       {stickyItems.length > 0 && (
         <div className="fixed bottom-4 left-1/2 z-[9999] flex w-[calc(100%-32px)] max-w-[var(--zx-content-max,1200px)] -translate-x-1/2 flex-col gap-2 p-0 safe-bottom rounded-2xl pointer-events-none">
            {stickyItems.map(item => {
              const def = getIntegration(item.provider);
              if (!def) return null;
              const cfg: IntegrationConfig = item.config ?? {};
              const action = def.build(cfg);
              
              // Validation: don't render if missing required fields
              if (!action.href && !action.embedSrc) return null;

              const color = typeof cfg.color === "string" && cfg.color ? cfg.color : def.brand;
              const textColor = typeof cfg.textColor === "string" && cfg.textColor ? cfg.textColor : undefined;
              const label = typeof cfg.buttonText === "string" && cfg.buttonText ? cfg.buttonText : def.label;
              const Icon = def.icon;
              const anim = ANIM[String(cfg.animation ?? "none")] ?? "";

              const content = (
                <div
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 shadow-2xl transition-all active:scale-95 pointer-events-auto",
                    "bg-background/80 backdrop-blur-md border border-border/50",
                    buttonClasses(String(cfg.style ?? "filled")),
                    anim
                  )}
                  style={{
                    ...buttonStyle(String(cfg.style ?? "filled"), color, textColor),
                  }}
                >
                  {cfg.showIcon !== false && <Icon className="h-5 w-5" />}
                  <span className="font-semibold">{label}</span>
                </div>
              );

              // Use standard wrapper for interaction (Popup vs Link)
              return (
                <div key={item.id} className="w-full">
                   {item.mode === "stickyBottom" && item.provider === "calendly" || item.mode === "stickyBottom" && def.modes.includes("popup") ? (
                      <StickyTriggerWrapper block={item} def={def} cfg={cfg} action={action}>
                        {content}
                      </StickyTriggerWrapper>
                   ) : (
                     <a
                       href={action.href}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="block w-full"
                       onClick={mode === "builder" ? (e) => e.preventDefault() : undefined}
                     >
                       {content}
                     </a>
                   )}
                </div>
              );
            })}
         </div>
       )}

       {/* ── Floating Action Stacks ── */}
       {Object.entries(groups).map(([pos, items]) => {
         const isBottom = pos.startsWith("bottom");
         const isRight = pos.endsWith("right");
         
         const containerCls = cn(
           "fixed z-[110] flex flex-col gap-3 p-4",
           pos === "bottom-right" && "bottom-20 right-0",
           pos === "bottom-left" && "bottom-20 left-0",
           pos === "top-right" && "top-0 right-0",
           pos === "top-left" && "top-0 left-0",
         );

         // If multiple items, we show an expand/collapse stack
         if (items.length > 1) {
           return (
             <div key={pos} className={containerCls}>
               <div className={cn("flex flex-col gap-3 transition-all duration-300", 
                 expanded ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")}>
                 {items.map(item => <FloatingItem key={item.id} item={item} />)}
               </div>
               <button
                 onClick={() => setExpanded(!expanded)}
                 className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform active:scale-90"
               >
                 {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
               </button>
             </div>
           );
         }

         // Single item
         return (
           <div key={pos} className={containerCls}>
             {items.map(item => <FloatingItem key={item.id} item={item} />)}
           </div>
         );
       })}
    </>
  );
}

function FloatingItem({ item }: { item: IntegrationBlock }) {
  const def = getIntegration(item.provider);
  if (!def) return null;
  const cfg: IntegrationConfig = item.config ?? {};
  const action = def.build(cfg);
  const color = typeof cfg.color === "string" && cfg.color ? cfg.color : def.brand;
  const textColor = typeof cfg.textColor === "string" && cfg.textColor ? cfg.textColor : undefined;
  const label = typeof cfg.buttonText === "string" && cfg.buttonText ? cfg.buttonText : def.label;
  const anim = ANIM[String(cfg.animation ?? "none")] ?? "";
  const Icon = def.icon;
  const sizeMap: Record<string, string> = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-16 w-16" };
  const iconMap: Record<string, string> = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" };
  const size = sizeMap[String(cfg.size ?? "md")] ?? sizeMap.md;
  const iconSize = iconMap[String(cfg.size ?? "md")] ?? iconMap.md;

  const radiusMap: Record<string, string> = { circle: "rounded-full", rounded: "rounded-2xl", square: "rounded-none" };
  const radius = radiusMap[String(cfg.shape ?? "circle")] ?? radiusMap.circle;

  const isBubble = item.mode === "floatingBubble";
  const isIconMode = cfg.floatingMode === "icon" || isBubble;

  return (
    <a
      href={action.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex items-center shadow-xl transition-all hover:scale-105 active:scale-95",
        radius,
        !isIconMode ? "gap-2 pl-4 pr-6 py-3" : cn("grid place-items-center", size),
        anim
      )}
      style={buttonStyle("filled", color, textColor)}
    >
      <Icon className={iconSize} />
      {!isIconMode && <span className="text-sm font-semibold">{label}</span>}
      
      {/* Tooltip */}
      {cfg.tooltip && (
        <span className="absolute right-full mr-3 hidden rounded-lg bg-black/80 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-md backdrop-blur-sm group-hover:block whitespace-nowrap">
          {String(cfg.tooltip)}
        </span>
      )}
      
      {/* Badge */}
      {Number(cfg.badge) > 0 && (
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
          {Number(cfg.badge)}
        </span>
      )}
    </a>
  );
}

/**
 * Handles clicks for fixed-position elements that might need to open a popup.
 */
function StickyTriggerWrapper({ 
  block, 
  def, 
  cfg, 
  action, 
  children 
}: { 
  block: IntegrationBlock; 
  def: any; 
  cfg: IntegrationConfig; 
  action: any;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const mode = useRendererMode();
  const height = Number(cfg.height) > 0 ? Number(cfg.height) : (action.height ?? 420);

  // If it's a link mode, just use an <a> tag
  if (block.mode !== "popup" && block.mode !== "stickyBottom") {
     return (
       <a 
         href={action.href} 
         target="_blank" 
         rel="noopener noreferrer" 
         className="block"
         onClick={mode === "builder" ? (e) => e.preventDefault() : undefined}
       >
         {children}
       </a>
     );
  }

  // For stickyBottom, we might want it to act as a popup trigger if it's Calendly or similar
  const isPopup = block.provider === "calendly" || block.mode === "popup";

  return (
    <>
      <button 
        type="button" 
        className="block w-full text-left"
        onClick={() => {
          if (mode === "builder") return;
          if (isPopup && action.embedSrc) {
            setOpen(true);
          } else if (action.href) {
            window.open(action.href, "_blank", "noopener,noreferrer");
          }
        }}
      >
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-background shadow-2xl">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={action.embedSrc}
              title={`${def.label} popup`}
              className="w-full"
              style={{ height: Math.min(height, 680) }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
