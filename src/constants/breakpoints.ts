/**
 * Responsive breakpoints supported across the app.
 * Keep in sync with Tailwind screen tokens.
 */
export const BREAKPOINTS = {
  xs: 320,
  sm: 375,
  md: 425,
  tablet: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  "3xl": 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
