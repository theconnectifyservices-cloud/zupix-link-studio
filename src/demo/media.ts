/**
 * LS-DEMO-01 · Phase 1 — CDN cover image map for the 12 demo businesses.
 * Uploaded to Lovable Assets CDN; URLs are stable and immutable.
 */
import type { DemoBusinessKey } from "./businesses";

export const DEMO_COVER_URLS: Record<DemoBusinessKey, string> = {
  "ratan-jewellers": "/__l5e/assets-v1/8fc920d2-b593-4f6c-b1cd-8b11ee65f0f6/cover-ratan-jewellers.jpg",
  "spice-route-kitchen": "/__l5e/assets-v1/4a2a48d2-42ac-48d2-b23d-d0a1c0155664/cover-spice-route-kitchen.jpg",
  "brew-and-bloom": "/__l5e/assets-v1/473b630d-6c96-436b-acbf-54e49793fb63/cover-brew-and-bloom.jpg",
  "dr-anjali-clinic": "/__l5e/assets-v1/6365ef4e-3df5-47e7-86cc-d5e35542d2bb/cover-dr-anjali-clinic.jpg",
  "ashirwad-hospital": "/__l5e/assets-v1/ec8bac54-cdf2-4e74-9cf8-b280893b5474/cover-ashirwad-hospital.jpg",
  "glow-studio": "/__l5e/assets-v1/a9f8b558-5a6a-45f7-ad02-330c2ae5ff5f/cover-glow-studio.jpg",
  "ironcore-fitness": "/__l5e/assets-v1/9a6e9aa0-c89a-4e16-abbf-4847f948cbff/cover-ironcore-fitness.jpg",
  "vidya-school": "/__l5e/assets-v1/1b1b8d97-1410-482b-be74-12e9d7e9c818/cover-vidya-school.jpg",
  "wanderlust-trails": "/__l5e/assets-v1/b1f2fb66-750a-445e-a15f-1efa0e4d7741/cover-wanderlust-trails.jpg",
  "casa-verde-homes": "/__l5e/assets-v1/df9ac1c7-b1d8-4886-8e28-27851c3c8169/cover-casa-verde-homes.jpg",
  "pixel-forge": "/__l5e/assets-v1/fd939aeb-65b5-4d2b-8947-ebc6e18e11c4/cover-pixel-forge.jpg",
  "meher-associates": "/__l5e/assets-v1/05c55e5a-71b8-4053-81d4-3d67a3f4bb6f/cover-meher-associates.jpg",
};

/** Public site origin used to build absolute OG image URLs. */
export const DEMO_PUBLIC_ORIGIN = "https://zupixlink.lovable.app";

export function absCoverUrl(key: DemoBusinessKey): string {
  return DEMO_PUBLIC_ORIGIN + DEMO_COVER_URLS[key];
}
