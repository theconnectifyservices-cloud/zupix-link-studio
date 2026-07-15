/**
 * LS-12C — Curated palettes and font pairings.
 * Data-only, safe defaults tested for WCAG AA on body text.
 */
import type { ThemeColors } from "@/features/builder/theme";

export interface PalettePreset {
  id: string;
  label: string;
  tags: string[]; // industry / season
  colors: Pick<
    ThemeColors,
    | "background"
    | "backgroundSolid"
    | "surface"
    | "card"
    | "text"
    | "textMuted"
    | "border"
    | "primary"
    | "primaryText"
    | "secondary"
    | "secondaryText"
    | "accent"
    | "link"
    | "icon"
  >;
}

const p = (o: PalettePreset["colors"]) => o;

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "midnight-lux",
    label: "Midnight Lux",
    tags: ["luxury", "creator", "dark", "winter"],
    colors: p({
      background: "#0b0b12",
      backgroundSolid: "#0b0b12",
      surface: "#141420",
      card: "#181826",
      text: "#f5f5f7",
      textMuted: "#9ca3af",
      border: "#2a2a3a",
      primary: "#f5f5f7",
      primaryText: "#0b0b12",
      secondary: "#1e1e2e",
      secondaryText: "#f5f5f7",
      accent: "#d4af37",
      link: "#c9b56b",
      icon: "#f5f5f7",
    }),
  },
  {
    id: "sunrise-coral",
    label: "Sunrise Coral",
    tags: ["creator", "wellness", "summer"],
    colors: p({
      background: "#fff7f2",
      backgroundSolid: "#fff7f2",
      surface: "#ffefe6",
      card: "#ffffff",
      text: "#20141c",
      textMuted: "#7a5c6a",
      border: "#f5d9c7",
      primary: "#ff6b4a",
      primaryText: "#ffffff",
      secondary: "#fde3d5",
      secondaryText: "#20141c",
      accent: "#f4a261",
      link: "#e6532e",
      icon: "#20141c",
    }),
  },
  {
    id: "forest-emerald",
    label: "Forest Emerald",
    tags: ["business", "wellness", "sustainable"],
    colors: p({
      background: "#f4f7f4",
      backgroundSolid: "#f4f7f4",
      surface: "#e8efe8",
      card: "#ffffff",
      text: "#0f1e18",
      textMuted: "#4a6a5b",
      border: "#d0dcd2",
      primary: "#0f6b47",
      primaryText: "#ffffff",
      secondary: "#dbe9df",
      secondaryText: "#0f1e18",
      accent: "#c8a951",
      link: "#0a4d33",
      icon: "#0f1e18",
    }),
  },
  {
    id: "cobalt-tech",
    label: "Cobalt Tech",
    tags: ["tech", "startup", "saas"],
    colors: p({
      background: "#0a0e1a",
      backgroundSolid: "#0a0e1a",
      surface: "#111827",
      card: "#151b2c",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
      border: "#25304a",
      primary: "#3b82f6",
      primaryText: "#ffffff",
      secondary: "#1e293b",
      secondaryText: "#f1f5f9",
      accent: "#22d3ee",
      link: "#60a5fa",
      icon: "#f1f5f9",
    }),
  },
  {
    id: "rose-editorial",
    label: "Rose Editorial",
    tags: ["fashion", "beauty", "creator"],
    colors: p({
      background: "#faf5f3",
      backgroundSolid: "#faf5f3",
      surface: "#f2e8e5",
      card: "#ffffff",
      text: "#2a1a1f",
      textMuted: "#7a5966",
      border: "#e8d2ce",
      primary: "#8a2846",
      primaryText: "#ffffff",
      secondary: "#f0dfd9",
      secondaryText: "#2a1a1f",
      accent: "#c99087",
      link: "#701e37",
      icon: "#2a1a1f",
    }),
  },
  {
    id: "ink-mono",
    label: "Ink Mono",
    tags: ["minimal", "portfolio", "agency"],
    colors: p({
      background: "#ffffff",
      backgroundSolid: "#ffffff",
      surface: "#f5f5f5",
      card: "#ffffff",
      text: "#0b0b0b",
      textMuted: "#5c5c5c",
      border: "#e5e5e5",
      primary: "#0b0b0b",
      primaryText: "#ffffff",
      secondary: "#efefef",
      secondaryText: "#0b0b0b",
      accent: "#0b0b0b",
      link: "#0b0b0b",
      icon: "#0b0b0b",
    }),
  },
  {
    id: "autumn-terra",
    label: "Autumn Terra",
    tags: ["autumn", "restaurant", "artisan"],
    colors: p({
      background: "#fbf5ec",
      backgroundSolid: "#fbf5ec",
      surface: "#f2e6d1",
      card: "#ffffff",
      text: "#2b1a10",
      textMuted: "#6b4f3a",
      border: "#e8d3b0",
      primary: "#b0431f",
      primaryText: "#ffffff",
      secondary: "#efd9bd",
      secondaryText: "#2b1a10",
      accent: "#c98a3c",
      link: "#8f3418",
      icon: "#2b1a10",
    }),
  },
  {
    id: "spring-mint",
    label: "Spring Mint",
    tags: ["spring", "wellness", "kids"],
    colors: p({
      background: "#f2fbf6",
      backgroundSolid: "#f2fbf6",
      surface: "#e2f5ea",
      card: "#ffffff",
      text: "#0f2a1c",
      textMuted: "#4a6b58",
      border: "#c5e6d1",
      primary: "#149a5a",
      primaryText: "#ffffff",
      secondary: "#d5efdf",
      secondaryText: "#0f2a1c",
      accent: "#f4a261",
      link: "#0e7a48",
      icon: "#0f2a1c",
    }),
  },
];

export interface FontPairPreset {
  id: string;
  label: string;
  headingFamily: string;
  fontFamily: string;
  buttonFamily?: string;
  tags: string[];
}

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = 'ui-serif, Georgia, "Times New Roman", serif';

export const FONT_PAIRS: FontPairPreset[] = [
  {
    id: "inter-inter",
    label: "Inter · Inter",
    headingFamily: `Inter, ${SANS}`,
    fontFamily: `Inter, ${SANS}`,
    tags: ["minimal", "tech", "saas"],
  },
  {
    id: "playfair-inter",
    label: "Playfair Display · Inter",
    headingFamily: `"Playfair Display", ${SERIF}`,
    fontFamily: `Inter, ${SANS}`,
    tags: ["editorial", "luxury", "fashion"],
  },
  {
    id: "space-grotesk-dm-sans",
    label: "Space Grotesk · DM Sans",
    headingFamily: `"Space Grotesk", ${SANS}`,
    fontFamily: `"DM Sans", ${SANS}`,
    tags: ["startup", "creator"],
  },
  {
    id: "fraunces-inter",
    label: "Fraunces · Inter",
    headingFamily: `Fraunces, ${SERIF}`,
    fontFamily: `Inter, ${SANS}`,
    tags: ["boutique", "artisan"],
  },
  {
    id: "poppins-poppins",
    label: "Poppins · Poppins",
    headingFamily: `Poppins, ${SANS}`,
    fontFamily: `Poppins, ${SANS}`,
    tags: ["friendly", "creator"],
  },
  {
    id: "montserrat-lora",
    label: "Montserrat · Lora",
    headingFamily: `Montserrat, ${SANS}`,
    fontFamily: `Lora, ${SERIF}`,
    tags: ["wellness", "coach"],
  },
];
