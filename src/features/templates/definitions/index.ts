/**
 * Central theme registry. Add a new definition file, spread its specs
 * into `ALL_SPECS`, and it lights up across the library — no other
 * code changes required.
 */
import { buildTemplateFromSpec, type ThemeSpec } from "../build";
import { FREE_THEMES } from "./free";
import { PREMIUM_THEMES } from "./premium";
import type { Template } from "../types";

export const ALL_THEME_SPECS: ThemeSpec[] = [...FREE_THEMES, ...PREMIUM_THEMES];

export const REGISTRY_TEMPLATES: Template[] = ALL_THEME_SPECS.map(buildTemplateFromSpec);
