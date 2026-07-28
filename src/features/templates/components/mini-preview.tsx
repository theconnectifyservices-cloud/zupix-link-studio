/**
 * Layout-aware mini preview.
 *
 * Every theme picks a `layoutId` from the registry — this file provides
 * a distinct composition per layout so the marketplace feels genuinely
 * varied even when themes share tokens. All layouts read from the same
 * `--zx-*` CSS variables the live builder uses.
 */

import { useMemo } from "react";
import { themeToCssVars } from "@/features/builder/theme";
import type { Template, TemplateLayoutId } from "../types";
import { cn } from "@/lib/utils";

interface Props {
  template: Template;
  className?: string;
  size?: "sm" | "md" | "lg";
  frame?: boolean;
}

export function MiniPreview({ template, className, size = "md", frame = true }: Props) {
  const style = useMemo(() => themeToCssVars(template.theme, "mobile"), [template]);
  const isDark = template.theme.mode === "dark";
  const layoutId = (template.layoutId ?? "classic") as TemplateLayoutId;

  const scale = size === "sm" ? "text-[8px]" : size === "lg" ? "text-[11px]" : "text-[9px]";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        frame ? "rounded-2xl border shadow-sm" : "rounded-xl",
        isDark ? "border-white/10" : "border-black/10",
        className,
      )}
      style={{
        background: (style as Record<string, string>)["--zx-bg"] as string | undefined,
        aspectRatio: "9 / 16",
      }}
    >
      <div className={cn("relative flex h-full w-full flex-col p-3", scale)} style={style}>
        <LayoutBody layoutId={layoutId} />
      </div>
    </div>
  );
}

// ── Shared atoms ──────────────────────────────────────────────────────

function Avatar({ size = 40, shape = "circle" }: { size?: number; shape?: "circle" | "rounded" | "square" }) {
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "10px" : "2px";
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "var(--primary)",
        border: "2px solid var(--border)",
        borderRadius: radius,
        boxShadow: "var(--zx-card-shadow, 0 2px 6px rgba(0,0,0,0.08))",
      }}
      className="shrink-0"
    />
  );
}

function Btn({ label, variant = "primary" }: { label: string; variant?: "primary" | "outline" | "ghost" }) {
  const base = {
    color: "var(--zx-btn-fg)",
    border: "var(--zx-btn-border)",
    borderRadius: "var(--zx-btn-radius, 12px)",
    boxShadow: "var(--zx-btn-shadow, none)",
    fontFamily: "var(--zx-btn-font)",
  } as React.CSSProperties;
  const bg = variant === "primary" ? "var(--zx-btn-bg)" : variant === "outline" ? "transparent" : "transparent";
  const border = variant === "outline" ? "1px solid var(--primary)" : (base.border as string);
  return (
    <div
      className="w-full truncate px-2 py-1.5 text-center font-medium"
      style={{ ...base, background: bg, border, color: variant === "outline" ? "var(--primary)" : (base.color as string) }}
    >
      {label}
    </div>
  );
}

function Tile({ h = 28 }: { h?: number }) {
  return (
    <div
      className="w-full"
      style={{
        height: h,
        background: "var(--zx-card-bg)",
        border: "var(--zx-card-border)",
        borderRadius: "var(--zx-card-radius, 10px)",
        boxShadow: "var(--zx-card-shadow, none)",
      }}
    />
  );
}

// ── Layout renderers ──────────────────────────────────────────────────

function LayoutBody({ layoutId }: { layoutId: TemplateLayoutId }) {
  switch (layoutId) {
    case "apple":
      return <AppleLayout />;
    case "glass":
      return <GlassLayout />;
    case "neumorph":
      return <NeumorphLayout />;
    case "notion":
      return <NotionLayout />;
    case "linear":
      return <LinearLayout />;
    case "stripe":
      return <StripeLayout />;
    case "framer":
      return <FramerLayout />;
    case "portfolio":
      return <PortfolioLayout />;
    case "luxury":
      return <LuxuryLayout />;
    case "neon-cyber":
      return <NeonCyberLayout />;
    case "terminal":
      return <TerminalLayout />;
    case "magazine":
      return <MagazineLayout />;
    case "bento":
      return <BentoLayout />;
    case "split-hero":
      return <SplitHeroLayout />;
    case "story-card":
      return <StoryCardLayout />;
    case "editorial":
      return <EditorialLayout />;
    case "gaming":
      return <GamingLayout />;
    case "corporate":
      return <CorporateLayout />;
    case "classic":
    default:
      return <ClassicLayout />;
  }
}

// ── Individual layouts ────────────────────────────────────────────────

function ClassicLayout() {
  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <div className="mt-1"><Avatar /></div>
        <div className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)" }}>Your Name</div>
        <div className="opacity-70" style={{ color: "var(--muted-foreground)" }}>@yourhandle</div>
      </div>
      <div className="mt-2 flex w-full flex-col gap-1.5">
        <Btn label="Portfolio" />
        <Btn label="Contact me" />
        <Btn label="Latest work" />
      </div>
    </>
  );
}

function AppleLayout() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 py-4">
      <div className="text-left" style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)" }}>
        <div style={{ fontSize: "1.6em", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>
          Think<br />different.
        </div>
        <div className="mt-1 opacity-60" style={{ fontSize: "0.9em" }}>A portfolio for the curious.</div>
      </div>
      <div className="mt-2"><Btn label="Explore" /></div>
    </div>
  );
}

function GlassLayout() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="rounded-2xl p-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.28)", border: "1px solid rgba(255,255,255,0.5)" }}>
        <div className="flex flex-col items-center gap-1">
          <Avatar shape="rounded" />
          <div className="font-semibold" style={{ color: "var(--foreground)" }}>Frosted</div>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-1.5">
        <Btn label="Shop" />
        <Btn label="Book" />
      </div>
      <Btn label="About" variant="outline" />
    </div>
  );
}

function NeumorphLayout() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="rounded-full p-2" style={{ boxShadow: "inset 4px 4px 8px #b8bcc2, inset -4px -4px 8px #ffffff" }}>
        <Avatar size={44} />
      </div>
      <div className="font-semibold" style={{ color: "var(--foreground)" }}>Soft UI</div>
      <div className="mt-1 flex w-full flex-col gap-2">
        <Btn label="Explore" />
        <Btn label="Contact" />
      </div>
    </div>
  );
}

function NotionLayout() {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: "1.2em" }}>📄</span>
        <div className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)", fontSize: "1.1em" }}>Working Notes</div>
      </div>
      <div className="opacity-60" style={{ color: "var(--muted-foreground)" }}>By Your Name</div>
      <div className="mt-1 h-px" style={{ background: "var(--border)" }} />
      <div className="mt-1 flex flex-col gap-1">
        <div style={{ color: "var(--foreground)" }}>• Latest essay</div>
        <div style={{ color: "var(--foreground)" }}>• Now reading</div>
        <div style={{ color: "var(--foreground)" }}>• Contact</div>
      </div>
      <div className="mt-auto"><Btn label="Subscribe" /></div>
    </div>
  );
}

function LinearLayout() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <Avatar size={30} shape="rounded" />
        <div>
          <div className="font-semibold" style={{ color: "var(--foreground)" }}>Your Name</div>
          <div className="opacity-60" style={{ color: "var(--muted-foreground)" }}>Product engineer</div>
        </div>
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {["Work", "Writing", "Talks", "CV"].map((l) => (
          <div key={l} className="flex items-center justify-between border-b py-1" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--foreground)" }}>{l}</span>
            <span className="opacity-60">→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StripeLayout() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg,var(--primary),var(--accent))", color: "var(--primary-foreground)" }}>
        <div style={{ fontWeight: 800, fontSize: "1.2em" }}>Payments,<br />reimagined.</div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Tile h={26} /><Tile h={26} />
        <Tile h={26} /><Tile h={26} />
      </div>
      <div className="mt-auto"><Btn label="Get started" /></div>
    </div>
  );
}

function FramerLayout() {
  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div style={{ fontSize: "2em", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>Hi 👋</div>
      <div className="opacity-70" style={{ color: "var(--muted-foreground)" }}>Design with motion.</div>
      <div className="mt-1 flex gap-1.5">
        <div className="h-6 w-6 rounded-full" style={{ background: "var(--primary)" }} />
        <div className="h-6 w-6 rounded-full" style={{ background: "var(--accent)" }} />
        <div className="h-6 w-6 rounded-lg" style={{ background: "var(--foreground)", opacity: 0.2 }} />
      </div>
      <div className="mt-auto w-full"><Btn label="Say hello" /></div>
    </div>
  );
}

function PortfolioLayout() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)", fontSize: "1.1em" }}>Selected Works</div>
      <div className="grid grid-cols-2 gap-1 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: "var(--muted)", borderRadius: 4 }} />
        ))}
      </div>
      <div className="mt-1"><Btn label="View all" variant="outline" /></div>
    </div>
  );
}

function LuxuryLayout() {
  return (
    <div className="flex h-full flex-col items-center justify-between py-2">
      <div className="text-center" style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)" }}>
        <div style={{ fontSize: "0.7em", letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.7 }}>MAISON</div>
        <div style={{ fontSize: "1.4em", fontWeight: 500, marginTop: 4 }}>Estelle</div>
        <div className="mt-1 h-px w-8 mx-auto" style={{ background: "var(--primary)" }} />
        <div className="mt-1 opacity-70" style={{ fontSize: "0.75em" }}>Est. 2026</div>
      </div>
      <div className="w-full space-y-1.5">
        <Btn label="Collection" variant="outline" />
        <Btn label="Atelier" variant="outline" />
      </div>
    </div>
  );
}

function NeonCyberLayout() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="rounded-full p-1" style={{ background: "conic-gradient(from 0deg,var(--primary),var(--accent),var(--primary))" }}>
        <div className="rounded-full p-1" style={{ background: "var(--zx-bg)" }}>
          <Avatar size={36} />
        </div>
      </div>
      <div style={{ color: "var(--foreground)", fontWeight: 800, textShadow: "0 0 8px var(--primary)" }}>CYBER_KID</div>
      <div className="opacity-70" style={{ color: "var(--muted-foreground)" }}>&gt;_ online</div>
      <div className="mt-1 w-full space-y-1.5">
        <Btn label="◆ Stream" />
        <Btn label="◆ Merch" />
      </div>
    </div>
  );
}

function TerminalLayout() {
  return (
    <div className="flex h-full flex-col gap-1" style={{ fontFamily: "var(--zx-heading-family)" }}>
      <div style={{ color: "var(--primary)" }}>$ whoami</div>
      <div style={{ color: "var(--foreground)" }}>your.name@zupix:~$</div>
      <div style={{ color: "var(--primary)" }}>$ ls links/</div>
      <div style={{ color: "var(--foreground)" }}>├── github</div>
      <div style={{ color: "var(--foreground)" }}>├── blog</div>
      <div style={{ color: "var(--foreground)" }}>└── contact</div>
      <div style={{ color: "var(--primary)" }}>$ <span className="inline-block h-2 w-1.5 animate-pulse" style={{ background: "var(--primary)" }} /></div>
      <div className="mt-auto"><Btn label="./connect.sh" /></div>
    </div>
  );
}

function MagazineLayout() {
  return (
    <div className="flex h-full flex-col gap-1">
      <div style={{ fontFamily: "var(--zx-heading-family)", color: "var(--foreground)", fontSize: "0.65em", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7 }}>ISSUE 12 · 2026</div>
      <div style={{ fontFamily: "var(--zx-heading-family)", color: "var(--foreground)", fontSize: "1.35em", fontWeight: 700, lineHeight: 1.05 }}>
        Voice of a New Season
      </div>
      <div className="my-1 h-px" style={{ background: "var(--foreground)", opacity: 0.3 }} />
      <div className="grid flex-1 grid-cols-2 gap-1">
        <div style={{ background: "var(--muted)", borderRadius: 2 }} />
        <div className="flex flex-col gap-1">
          <div style={{ color: "var(--foreground)", fontSize: "0.85em" }}>Features</div>
          <div className="opacity-70" style={{ color: "var(--muted-foreground)" }}>Editorial • Photo • Words</div>
        </div>
      </div>
      <div className="mt-1"><Btn label="Read the issue" /></div>
    </div>
  );
}

function BentoLayout() {
  return (
    <div className="grid h-full grid-cols-3 grid-rows-4 gap-1">
      <div className="col-span-2 row-span-2 flex flex-col justify-end p-1.5" style={{ background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: 8 }}>
        <div style={{ fontWeight: 800 }}>Studio</div>
      </div>
      <div style={{ background: "var(--accent)", borderRadius: 8 }} />
      <div style={{ background: "var(--muted)", borderRadius: 8 }} />
      <div className="col-span-2" style={{ background: "var(--muted)", borderRadius: 8 }} />
      <div style={{ background: "var(--primary)", borderRadius: 8 }} />
      <div className="col-span-3 flex items-center justify-center" style={{ background: "var(--accent)", borderRadius: 8, color: "var(--primary-foreground)", fontWeight: 700 }}>
        View all
      </div>
    </div>
  );
}

function SplitHeroLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-2" style={{ background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: 8 }}>
        <div style={{ fontWeight: 800, fontSize: "1.25em", lineHeight: 1.05 }}>Build<br />bolder.</div>
        <div className="mt-1 opacity-80" style={{ fontSize: "0.85em" }}>A studio for the ambitious.</div>
      </div>
      <div className="flex-1 pt-2 flex flex-col gap-1.5">
        <Btn label="See services" />
        <Btn label="Book a call" variant="outline" />
      </div>
    </div>
  );
}

function StoryCardLayout() {
  return (
    <div className="relative flex h-full flex-col justify-end overflow-hidden rounded-xl">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.55) 100%)" }} />
      <div className="absolute inset-x-0 top-2 flex justify-center">
        <div className="rounded-full bg-white/25 px-2 py-0.5 backdrop-blur" style={{ color: "#fff" }}>@yourhandle</div>
      </div>
      <div className="relative p-2 text-white">
        <div style={{ fontWeight: 800, fontSize: "1.2em" }}>Latest drop 🔥</div>
        <div className="opacity-80">Swipe up to shop</div>
        <div className="mt-1"><Btn label="Shop now" /></div>
      </div>
    </div>
  );
}

function EditorialLayout() {
  return (
    <div className="flex h-full flex-col">
      <div style={{ fontFamily: "var(--zx-heading-family)", color: "var(--foreground)", fontSize: "1.6em", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>
        "Design is intelligence made visible."
      </div>
      <div className="mt-2 opacity-70" style={{ color: "var(--muted-foreground)" }}>— Your Name · Editor</div>
      <div className="mt-auto space-y-1.5">
        <Btn label="Read essays" variant="outline" />
        <Btn label="Subscribe" />
      </div>
    </div>
  );
}

function GamingLayout() {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="rounded-md p-2" style={{ background: "var(--zx-card-bg)", border: "1px solid var(--primary)", boxShadow: "0 0 12px -4px var(--primary)" }}>
        <div style={{ color: "var(--primary)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.75em" }}>▶ PLAYER 1</div>
        <div style={{ color: "var(--foreground)", fontWeight: 800, fontSize: "1.1em" }}>NightHawk</div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {["LVL 87", "12.4K", "PRO"].map((t) => (
          <div key={t} className="rounded-md p-1 text-center" style={{ background: "var(--zx-card-bg)", color: "var(--foreground)", border: "1px solid var(--border)" }}>{t}</div>
        ))}
      </div>
      <div className="mt-auto space-y-1"><Btn label="▶ Watch Live" /><Btn label="◆ Discord" variant="outline" /></div>
    </div>
  );
}

function CorporateLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-sm" style={{ background: "var(--primary)" }} />
        <div style={{ color: "var(--foreground)", fontWeight: 700, letterSpacing: "0.05em" }}>ACME CORP</div>
      </div>
      <div className="my-1 h-px" style={{ background: "var(--border)" }} />
      <div style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)", fontWeight: 700, fontSize: "1.2em", lineHeight: 1.1 }}>
        Enterprise solutions for modern teams.
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Tile h={24} /><Tile h={24} />
      </div>
      <div className="mt-auto"><Btn label="Request demo" /></div>
    </div>
  );
}
