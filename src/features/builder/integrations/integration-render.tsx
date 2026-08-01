import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRendererMode } from "../renderer-mode";
import { getIntegration, type IntegrationConfig, type IntegrationDisplayMode } from "./registry";
import type { IntegrationBlock } from "../types";
import { X } from "lucide-react";

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

function buttonStyle(style: string, color: string): React.CSSProperties {
  switch (style) {
    case "outline":
      return { borderColor: color, color };
    case "soft":
      return { backgroundColor: `${color}1f`, color };
    case "glass":
      return { backgroundColor: `${color}26`, color };
    default:
      return { backgroundColor: color };
  }
}

/**
 * Renders an integration block from its structured JSON.
 * No stored HTML: markup is generated here at render time.
 */
export function IntegrationRender({ block }: { block: IntegrationBlock }) {
  const mode = useRendererMode();
  const [popupOpen, setPopupOpen] = useState(false);
  const def = getIntegration(block.provider);

  if (!def) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        Unknown integration
      </div>
    );
  }

  const cfg: IntegrationConfig = block.config ?? {};
  const display = (block.mode ?? def.modes[0]) as IntegrationDisplayMode;
  const action = def.build(cfg);
  const color = typeof cfg.color === "string" && cfg.color ? cfg.color : def.brand;
  const label = typeof cfg.buttonText === "string" && cfg.buttonText ? cfg.buttonText : def.label;
  const anim = ANIM[String(cfg.animation ?? "none")] ?? "";
  const Icon = def.icon;
  const showIcon = cfg.showIcon !== false;
  const height = Number(cfg.height) > 0 ? Number(cfg.height) : (action.height ?? 420);
  const isBuilder = mode === "builder";

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
      style={buttonStyle(String(cfg.style ?? "filled"), color)}
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

  if (!action.href) return notConfigured;

  /* ── floating ──────────────────────────────────────────────────────── */
  if (display === "floating") {
    const pos = cfg.position === "bottom-left" ? "left-4" : "right-4";
    if (isBuilder) {
      return (
        <div className={cn("rounded-xl border border-dashed p-3", visibility)}>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Floating · {cfg.position === "bottom-left" ? "bottom left" : "bottom right"}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn("grid h-12 w-12 place-items-center rounded-full text-white shadow-lg", anim)}
              style={{ backgroundColor: color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        </div>
      );
    }
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(
          "fixed bottom-20 z-[60] grid h-14 w-14 place-items-center rounded-full text-white shadow-xl transition-transform hover:scale-105",
          pos,
          anim,
          visibility,
        )}
        style={{ backgroundColor: color }}
      >
        <Icon className="h-6 w-6" />
      </a>
    );
  }

  /* ── button / new tab ──────────────────────────────────────────────── */
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
