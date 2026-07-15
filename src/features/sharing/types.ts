/** Shared types for the Smart Sharing Hub (QR + share + embed + print). */

export type QrDotStyle = "square" | "rounded" | "dots" | "classy" | "extra-rounded";
export type QrCornerStyle = "square" | "extra-rounded" | "dot";
export type QrErrorLevel = "L" | "M" | "Q" | "H";

export interface QrSettings {
  /** Foreground color of the QR modules. */
  color: string;
  /** Background color. Ignored when `transparent` is true. */
  background: string;
  transparent: boolean;
  dotStyle: QrDotStyle;
  cornerStyle: QrCornerStyle;
  errorLevel: QrErrorLevel;
  /** Data URL or absolute URL for the center logo. */
  logoUrl: string | null;
  /** 0.2–0.5 — how much of the QR the logo may cover. */
  logoSize: number;
  /** Whether to punch out modules behind the logo. */
  logoMargin: boolean;
}

export const DEFAULT_QR_SETTINGS: QrSettings = {
  color: "#0F172A",
  background: "#FFFFFF",
  transparent: false,
  dotStyle: "rounded",
  cornerStyle: "extra-rounded",
  errorLevel: "H",
  logoUrl: null,
  logoSize: 0.28,
  logoMargin: true,
};

export interface ShareSettings {
  /** Overrides the SEO title used when sharing. */
  title: string;
  description: string;
  /** Absolute URL for a share image (og:image). */
  imageUrl: string | null;
  /** Prewritten copy inserted into social share intents and native share. */
  message: string;
}

export const DEFAULT_SHARE_SETTINGS: ShareSettings = {
  title: "",
  description: "",
  imageUrl: null,
  message: "",
};

export interface QrDesignRow {
  id: string;
  page_id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  settings: QrSettings;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type ExportFormat = "png" | "svg" | "pdf";

export interface PrintPreset {
  id: "poster-a4" | "business-card" | "flyer" | "social-square";
  label: string;
  description: string;
  /** Page size in mm for PDF, or px for image exports. */
  widthMm: number;
  heightMm: number;
  qrSizeMm: number;
}

export const PRINT_PRESETS: PrintPreset[] = [
  {
    id: "poster-a4",
    label: "QR Poster (A4)",
    description: "Full-page A4 poster with headline and QR",
    widthMm: 210,
    heightMm: 297,
    qrSizeMm: 130,
  },
  {
    id: "business-card",
    label: "Business Card",
    description: "Standard 85 × 55 mm business card with QR",
    widthMm: 85,
    heightMm: 55,
    qrSizeMm: 35,
  },
  {
    id: "flyer",
    label: "Flyer (A5)",
    description: "A5 flyer with QR and call to action",
    widthMm: 148,
    heightMm: 210,
    qrSizeMm: 90,
  },
  {
    id: "social-square",
    label: "Social Post (1080×1080)",
    description: "Square graphic ready for Instagram / Facebook",
    widthMm: 270,
    heightMm: 270,
    qrSizeMm: 150,
  },
];
