/**
 * Visual HTML Builder — design model for the Custom Code block.
 *
 * The user configures layout / style / button / animation / hover visually;
 * this module compiles that configuration into plain CSS that is injected
 * into the sandboxed iframe alongside any hand-written CSS. Hand-written
 * CSS is emitted *after* the generated CSS so power users can still override.
 */

export type CcAlign = "left" | "center" | "right";
export type CcShadow = "none" | "sm" | "md" | "lg" | "xl" | "glow";
export type CcIconPosition = "left" | "right" | "top" | "none";
export type CcAnimation =
  | "none"
  | "shine"
  | "glow"
  | "pulse"
  | "float"
  | "bounce"
  | "fade"
  | "zoom"
  | "slide";
export type CcHover =
  | "none"
  | "lift"
  | "grow"
  | "shrink"
  | "glow"
  | "brighten"
  | "shadow"
  | "tilt"
  | "underline";

/** Values that can differ between desktop and mobile. */
export interface CcBreakpointDesign {
  align?: CcAlign;
  /** CSS width for the content wrapper, e.g. "100%", "480px". */
  width?: string;
  /** CSS height, "auto" by default. */
  height?: string;
  paddingY?: number;
  paddingX?: number;
  marginY?: number;
  marginX?: number;
  fontSize?: number;
  /** Button sizing */
  buttonWidth?: string;
  buttonHeight?: string;
  buttonFontSize?: number;
  iconSize?: number;
  gap?: number;
}

export interface CcDesign {
  enabled?: boolean;
  desktop: CcBreakpointDesign;
  mobile: CcBreakpointDesign;
  /** Style */
  background?: string;
  textColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "none" | "solid" | "dashed" | "dotted";
  radius?: number;
  shadow?: CcShadow;
  /** Buttons */
  buttonBackground?: string;
  buttonTextColor?: string;
  buttonRadius?: number;
  iconPosition?: CcIconPosition;
  /** Motion */
  animation?: CcAnimation;
  animationDuration?: number;
  animationDelay?: number;
  hover?: CcHover;
  /** Visibility */
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

export const DEFAULT_CC_DESIGN: CcDesign = {
  enabled: true,
  desktop: {
    align: "center",
    width: "100%",
    height: "auto",
    paddingY: 0,
    paddingX: 0,
    marginY: 0,
    marginX: 0,
    buttonHeight: "auto",
    buttonWidth: "auto",
    gap: 8,
    iconSize: 18,
  },
  mobile: {
    align: "center",
    width: "100%",
    height: "auto",
    paddingY: 0,
    paddingX: 0,
    marginY: 0,
    marginX: 0,
    buttonHeight: "auto",
    buttonWidth: "auto",
    gap: 8,
    iconSize: 18,
  },
  borderStyle: "none",
  borderWidth: 0,
  radius: 0,
  shadow: "none",
  iconPosition: "left",
  animation: "none",
  animationDuration: 2,
  animationDelay: 0,
  hover: "none",
};

export function mergeCcDesign(design?: Partial<CcDesign> | null): CcDesign {
  return {
    ...DEFAULT_CC_DESIGN,
    ...(design ?? {}),
    desktop: { ...DEFAULT_CC_DESIGN.desktop, ...(design?.desktop ?? {}) },
    mobile: { ...DEFAULT_CC_DESIGN.mobile, ...(design?.mobile ?? {}) },
  };
}

const SHADOWS: Record<CcShadow, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.08)",
  md: "0 4px 12px rgba(0,0,0,.12)",
  lg: "0 10px 30px rgba(0,0,0,.16)",
  xl: "0 24px 60px rgba(0,0,0,.22)",
  glow: "0 0 0 1px rgba(255,255,255,.08), 0 0 28px var(--zx-accent, rgba(99,102,241,.55))",
};

const ALIGN_ITEMS: Record<CcAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const px = (v: number | undefined) => `${v ?? 0}px`;

function breakpointCss(d: CcBreakpointDesign): string {
  const rules: string[] = [];
  const align = d.align ?? "center";
  rules.push(`.zx-cc-scope{
  display:flex;
  flex-direction:column;
  align-items:${ALIGN_ITEMS[align]};
  text-align:${align};
  width:${d.width || "100%"};
  ${d.height && d.height !== "auto" ? `height:${d.height}; min-height:${d.height};` : ""}
  padding:${px(d.paddingY)} ${px(d.paddingX)};
  margin:${px(d.marginY)} ${px(d.marginX)};
  ${d.fontSize ? `font-size:${d.fontSize}px;` : ""}
  ${d.gap != null ? `gap:${d.gap}px;` : ""}
  box-sizing:border-box;
}`);
  rules.push(`.zx-cc-scope > *{max-width:100%;}`);
  const btn: string[] = [];
  if (d.buttonWidth && d.buttonWidth !== "auto") btn.push(`width:${d.buttonWidth};`);
  if (d.buttonHeight && d.buttonHeight !== "auto") btn.push(`height:${d.buttonHeight};`);
  if (d.buttonFontSize) btn.push(`font-size:${d.buttonFontSize}px;`);
  if (d.gap != null) btn.push(`gap:${d.gap}px;`);
  if (btn.length) {
    rules.push(`.zx-cc-scope a,.zx-cc-scope button,.zx-cc-scope .btn{${btn.join("")}}`);
  }
  if (d.iconSize) {
    rules.push(
      `.zx-cc-scope svg,.zx-cc-scope .icon,.zx-cc-scope img.icon{width:${d.iconSize}px;height:${d.iconSize}px;}`,
    );
  }
  return rules.join("\n");
}

const ICON_DIRECTION: Record<CcIconPosition, string> = {
  left: "row",
  right: "row-reverse",
  top: "column",
  none: "row",
};

function keyframes(): string {
  return `
@keyframes zx-shine{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes zx-glow{0%,100%{filter:drop-shadow(0 0 2px var(--zx-accent,rgba(99,102,241,.7)))}50%{filter:drop-shadow(0 0 16px var(--zx-accent,rgba(99,102,241,.95)))}}
@keyframes zx-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes zx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes zx-bounce{0%,20%,53%,100%{transform:translateY(0)}40%,43%{transform:translateY(-14px)}70%{transform:translateY(-7px)}90%{transform:translateY(-2px)}}
@keyframes zx-fade{from{opacity:0}to{opacity:1}}
@keyframes zx-zoom{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes zx-slide{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
`;
}

function animationCss(a: CcAnimation, duration: number, delay: number): string {
  if (!a || a === "none") return "";
  const timing = `${duration}s`;
  const d = `${delay}s`;
  if (a === "shine") {
    return `.zx-cc-scope .zx-anim{position:relative;overflow:hidden;}
.zx-cc-scope .zx-anim::after{content:"";position:absolute;inset:0;pointer-events:none;
background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.55) 50%,transparent 75%);
background-size:200% 100%;animation:zx-shine ${timing} linear ${d} infinite;}`;
  }
  const infinite = ["glow", "pulse", "float", "bounce"].includes(a);
  return `.zx-cc-scope .zx-anim{animation:zx-${a} ${timing} ease-in-out ${d} ${
    infinite ? "infinite" : "1"
  } both;}`;
}

function hoverCss(h: CcHover): string {
  if (!h || h === "none") return "";
  const sel = ".zx-cc-scope .zx-anim:hover";
  const base = `.zx-cc-scope .zx-anim{transition:transform .25s ease,box-shadow .25s ease,filter .25s ease;}`;
  const map: Record<Exclude<CcHover, "none">, string> = {
    lift: `${sel}{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.18);}`,
    grow: `${sel}{transform:scale(1.05);}`,
    shrink: `${sel}{transform:scale(.96);}`,
    glow: `${sel}{filter:drop-shadow(0 0 14px var(--zx-accent,rgba(99,102,241,.9)));}`,
    brighten: `${sel}{filter:brightness(1.12);}`,
    shadow: `${sel}{box-shadow:0 16px 40px rgba(0,0,0,.24);}`,
    tilt: `${sel}{transform:perspective(600px) rotateX(6deg) rotateY(-6deg);}`,
    underline: `${sel}{text-decoration:underline;text-underline-offset:4px;}`,
  };
  return `${base}\n${map[h]}`;
}

/**
 * Compile a design config into CSS for the sandboxed document.
 * `mobileMaxWidth` mirrors the app's mobile breakpoint.
 */
export function buildDesignCss(input?: Partial<CcDesign> | null, mobileMaxWidth = 640): string {
  const d = mergeCcDesign(input);
  if (d.enabled === false) return "";

  const shell: string[] = [];
  const styleBits: string[] = [];
  if (d.background) styleBits.push(`background:${d.background};`);
  if (d.textColor) styleBits.push(`color:${d.textColor};`);
  if (d.borderStyle && d.borderStyle !== "none") {
    styleBits.push(`border:${d.borderWidth ?? 1}px ${d.borderStyle} ${d.borderColor ?? "#000"};`);
  }
  if (d.radius) styleBits.push(`border-radius:${d.radius}px;`);
  if (d.shadow && d.shadow !== "none") styleBits.push(`box-shadow:${SHADOWS[d.shadow]};`);
  if (styleBits.length) shell.push(`.zx-cc-scope{${styleBits.join("")}}`);

  // Buttons + icon layout
  const btn: string[] = ["display:inline-flex;align-items:center;justify-content:center;"];
  btn.push(`flex-direction:${ICON_DIRECTION[d.iconPosition ?? "left"]};`);
  if (d.buttonBackground) btn.push(`background:${d.buttonBackground};`);
  if (d.buttonTextColor) btn.push(`color:${d.buttonTextColor};`);
  if (d.buttonRadius != null) btn.push(`border-radius:${d.buttonRadius}px;`);
  shell.push(`.zx-cc-scope a,.zx-cc-scope button,.zx-cc-scope .btn{${btn.join("")}}`);
  if (d.iconPosition === "none") {
    shell.push(`.zx-cc-scope a svg,.zx-cc-scope button svg,.zx-cc-scope .icon{display:none;}`);
  }

  const desktop = breakpointCss(d.desktop);
  const mobile = breakpointCss(d.mobile);

  const visibility = [
    d.hideOnMobile ? `@media (max-width:${mobileMaxWidth}px){.zx-cc-scope{display:none!important}}` : "",
    d.hideOnDesktop
      ? `@media (min-width:${mobileMaxWidth + 1}px){.zx-cc-scope{display:none!important}}`
      : "",
  ].join("\n");

  return [
    keyframes(),
    `.zx-cc-scope .zx-anim{width:100%;}`,
    desktop,
    shell.join("\n"),
    animationCss(d.animation ?? "none", d.animationDuration ?? 2, d.animationDelay ?? 0),
    hoverCss(d.hover ?? "none"),
    `@media (max-width:${mobileMaxWidth}px){${mobile}}`,
    visibility,
  ]
    .filter(Boolean)
    .join("\n");
}
