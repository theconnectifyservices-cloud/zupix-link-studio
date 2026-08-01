/**
 * Shared Button Effects engine.
 *
 * Single source of truth for every button-like surface in the builder:
 * Standard Button, Button Group, WhatsApp / Call / Email / SMS / Telegram
 * buttons, Social Buttons, Follow Card links and any future button widget
 * (Coupon, Payment).
 *
 * Usage: wrap the actual clickable pill in <ButtonFxSurface settings={...}>.
 * Never apply effects on an outer block wrapper — the effect layers are
 * clipped to the pill shape (overflow:hidden + isolate).
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BlockSettings, ButtonEffect } from "./types";

export interface ButtonFxResult {
  className: string;
  style: CSSProperties;
  needsInteractive: boolean;
  effect: "magnetic" | "spotlight" | null;
  intensity: number;
  distance: number;
}

/** Compute btn-fx className + CSS vars for a button-ish block. */
export function computeButtonFx(
  s: BlockSettings,
  reduceMotion: boolean,
): ButtonFxResult {
  const raw = s.buttonEffect && s.buttonEffect !== "none" ? s.buttonEffect : null;
  if (!raw) {
    return {
      className: "",
      style: {},
      needsInteractive: false,
      effect: null,
      intensity: 50,
      distance: 20,
    };
  }
  const disabled = s.buttonEffectEnabled === false;
  const mode =
    raw === "shine"
      ? (s.buttonEffectMode ?? "hover")
      : raw === "neon"
        ? (s.buttonEffectMode ?? null)
        : null;
  const dir = s.buttonEffectDirection ?? null;
  const className = cn(
    `zx-btn-fx zx-btn-fx-${raw}`,
    mode && `zx-btn-fx-mode-${mode}`,
    dir && `zx-btn-fx-dir-${dir}`,
    disabled && `zx-btn-fx-disabled`,
  );
  const style: CSSProperties = {};
  const vars = style as Record<string, string>;
  if (s.buttonEffectSpeed) vars["--zx-btn-fx-dur"] = `${s.buttonEffectSpeed}ms`;
  if (s.buttonEffectDelay) vars["--zx-btn-fx-delay"] = `${s.buttonEffectDelay}ms`;
  if (s.buttonEffectRepeat !== undefined)
    vars["--zx-btn-fx-repeat"] = String(s.buttonEffectRepeat);
  if (s.buttonEffectColor) vars["--zx-btn-fx-color"] = s.buttonEffectColor;
  if (s.buttonEffectColor2) vars["--zx-btn-fx-color2"] = s.buttonEffectColor2;
  if (typeof s.buttonEffectIntensity === "number")
    vars["--zx-btn-fx-intensity"] = String(Math.max(0, s.buttonEffectIntensity) / 50);
  if (typeof s.buttonEffectSize === "number") {
    vars["--zx-btn-fx-size"] = `${s.buttonEffectSize}%`;
    vars["--zx-btn-fx-size-px"] = `${s.buttonEffectSize}px`;
  }
  if (typeof s.buttonEffectOpacity === "number")
    vars["--zx-btn-fx-opacity"] = String(s.buttonEffectOpacity);
  if (typeof s.buttonEffectDistance === "number") {
    vars["--zx-btn-fx-distance"] = `${s.buttonEffectDistance}px`;
    vars["--zx-btn-fx-distance-scale"] = String(Math.max(10, s.buttonEffectDistance * 2));
  }
  if (typeof s.buttonEffectScale === "number")
    vars["--zx-btn-fx-scale"] = String(s.buttonEffectScale);
  if (s.buttonEffectGradient && s.buttonEffectGradient.length >= 2) {
    const stops = s.buttonEffectGradient.join(", ");
    vars["--zx-btn-fx-grad"] = `linear-gradient(90deg, ${stops}, ${s.buttonEffectGradient[0]})`;
  }
  const needsInteractive =
    !disabled && !reduceMotion && (raw === "magnetic" || raw === "spotlight");
  return {
    className,
    style,
    needsInteractive,
    effect: needsInteractive ? (raw as "magnetic" | "spotlight") : null,
    intensity: s.buttonEffectIntensity ?? 50,
    distance: s.buttonEffectDistance ?? 20,
  };
}

/** Build a BlockSettings-shaped object from flat per-item effect fields. */
export function fxSettingsFromItem(item: {
  effect?: ButtonEffect;
  effectColor?: string;
  effectColor2?: string;
  effectSpeed?: number;
  effectIntensity?: number;
  effectMode?: "always" | "hover" | "click";
}): BlockSettings {
  return {
    buttonEffect: item.effect,
    buttonEffectColor: item.effectColor,
    buttonEffectColor2: item.effectColor2,
    buttonEffectSpeed: item.effectSpeed,
    buttonEffectIntensity: item.effectIntensity,
    buttonEffectMode: item.effectMode,
    buttonEffectEnabled: !!item.effect && item.effect !== "none",
  };
}

/** Lightweight JS layer for effects that depend on pointer position. */
export function InteractiveFxWrapper({
  effect,
  intensity,
  distance,
  children,
  as = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  effect: "magnetic" | "spotlight";
  intensity: number;
  distance: number;
  as?: "div" | "a" | "span";
  href?: string;
  target?: string;
  rel?: string;
  download?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches) return;
    let raf = 0;
    const strength = Math.max(0, Math.min(1, intensity / 100));
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (effect === "magnetic") {
          const max = distance;
          const nx = Math.max(-max, Math.min(max, dx * 0.35 * strength));
          const ny = Math.max(-max, Math.min(max, dy * 0.35 * strength));
          el.style.setProperty("--zx-mx", `${nx}px`);
          el.style.setProperty("--zx-my", `${ny}px`);
        } else {
          const sx = ((e.clientX - r.left) / r.width) * 100;
          const sy = ((e.clientY - r.top) / r.height) * 100;
          el.style.setProperty("--zx-sx", `${sx}%`);
          el.style.setProperty("--zx-sy", `${sy}%`);
        }
      });
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (effect === "magnetic") {
        el.style.setProperty("--zx-mx", `0px`);
        el.style.setProperty("--zx-my", `0px`);
      }
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [effect, intensity, distance]);

  const Tag = as as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} {...(rest as object)}>
      {children}
    </Tag>
  );
}

/**
 * Renders a clickable button surface with the shared effect engine applied.
 * Every button widget (standard, group, WhatsApp, call, email, sms, telegram,
 * social, coupon, payment) should render through this component.
 */
export function ButtonFxSurface({
  settings,
  reduceMotion = false,
  as = "a",
  className,
  style,
  children,
  clip = true,
  ...rest
}: {
  settings?: BlockSettings;
  reduceMotion?: boolean;
  as?: "div" | "a" | "span";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Clip effect layers to the pill shape. Default true. */
  clip?: boolean;
} & React.HTMLAttributes<HTMLElement> & {
    href?: string;
    target?: string;
    rel?: string;
    download?: string;
  }) {
  const fx = computeButtonFx(settings ?? {}, reduceMotion);
  const merged: CSSProperties = {
    ...(clip ? { overflow: "hidden", position: "relative", isolation: "isolate" } : null),
    ...style,
    ...fx.style,
  };
  const cls = cn(className, fx.className);

  if (fx.needsInteractive) {
    return (
      <InteractiveFxWrapper
        as={as}
        className={cls}
        style={merged}
        effect={fx.effect as "magnetic" | "spotlight"}
        intensity={fx.intensity}
        distance={fx.distance}
        {...rest}
      >
        {children}
      </InteractiveFxWrapper>
    );
  }
  const Tag = as as "div";
  return (
    <Tag className={cls} style={merged} {...(rest as object)}>
      {children}
    </Tag>
  );
}
